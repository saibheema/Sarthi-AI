
import React, { useEffect, useState, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

interface Props {
  botName: string;
  onClose: () => void;
  systemInstruction: string;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const VoiceOverlay: React.FC<Props> = ({ botName, onClose, systemInstruction }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Initializing Microphone...');
  const sessionRef = useRef<any>(null);
  const contextsRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);

  useEffect(() => {
    const startLiveSession = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Fix: Initialize GoogleGenAI using process.env.API_KEY directly per guidelines
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        // Explicitly resume contexts to satisfy browser security policies
        await inputAudioContext.resume();
        await outputAudioContext.resume();
        
        contextsRef.current = { input: inputAudioContext, output: outputAudioContext };

        const fullSystemInstruction = `${systemInstruction} 
        IMPORTANT: You must support Hindi, Telugu, and English. 
        Detect the user's language automatically. 
        Respond in Hindi if spoken to in Hindi. 
        Respond in Telugu if spoken to in Telugu. 
        Otherwise use English. Keep responses focused on academic help.`;

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              setStatus('Voice Link Established');
              setIsActive(true);
              const source = inputAudioContext.createMediaStreamSource(stream);
              const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
                const media = {
                  data: encode(new Uint8Array(int16.buffer)),
                  mimeType: 'audio/pcm;rate=16000',
                };
                // CRITICAL: Solely rely on sessionPromise resolves and then call `session.sendRealtimeInput`
                sessionPromise.then(s => s.sendRealtimeInput({ media }));
              };
              
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContext.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64Audio) {
                const ctx = outputAudioContext;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
              }
              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => {
                  try { s.stop(); } catch(e) {}
                });
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }
            },
            onerror: (e) => {
              console.error('Live session error:', e);
              setStatus('Connection Error');
            },
            onclose: () => {
              setIsActive(false);
              setStatus('Session Closed');
            },
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { 
              voiceConfig: { 
                prebuiltVoiceConfig: { voiceName: 'Kore' } 
              } 
            },
            systemInstruction: fullSystemInstruction
          }
        });

        sessionRef.current = await sessionPromise;
      } catch (err) {
        console.error('Failed to start voice session:', err);
        setStatus('Permission Denied / Mic Error');
      }
    };

    startLiveSession();

    return () => {
      if (sessionRef.current) sessionRef.current.close();
      if (contextsRef.current) {
        contextsRef.current.input.close();
        contextsRef.current.output.close();
      }
    };
  }, [systemInstruction]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center text-white">
      <div className="relative">
        <div className={`w-48 h-48 rounded-full bg-blue-500/20 flex items-center justify-center transition-all duration-1000 ${isActive ? 'scale-110' : 'scale-100 animate-pulse'}`}>
          <div className={`w-32 h-32 rounded-full bg-blue-600 shadow-2xl shadow-blue-500/50 flex items-center justify-center transition-transform duration-300 ${isActive ? 'scale-105 ring-4 ring-blue-400/50' : 'scale-100'}`}>
            <span className="text-4xl">🎙️</span>
          </div>
        </div>
        {isActive && (
           <div className="absolute inset-0 -z-10 animate-ping rounded-full border border-blue-400/30 opacity-75"></div>
        )}
      </div>

      <div className="mt-12 text-center space-y-2 px-6">
        <h2 className="text-2xl font-bold tracking-tight">{botName} is ready</h2>
        <p className="text-slate-400 text-sm font-medium">{status}</p>
        <p className="text-slate-500 text-xs mt-4 max-w-xs">Supports English, Hindi (हिन्दी), and Telugu (తెలుగు)</p>
      </div>

      <div className="mt-16 flex gap-4">
        <button 
          onClick={onClose}
          className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full font-medium transition-all border border-white/10"
        >
          Exit Voice Mode
        </button>
      </div>
    </div>
  );
};

export default VoiceOverlay;
