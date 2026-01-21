
import React, { useEffect, useState, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

interface Props {
  botName: string;
  onClose: () => void;
  systemInstruction: string;
  onTurnComplete?: (userText: string, modelText: string) => void;
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

async function pcmToAudioBuffer(
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

const VoiceOverlay: React.FC<Props> = ({ botName, onClose, systemInstruction, onTurnComplete }) => {
  const [isActive, setIsActive] = useState(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [status, setStatus] = useState('Requesting Microphone...');
  const [inputTranscription, setInputTranscription] = useState('');
  const [outputTranscription, setOutputTranscription] = useState('');
  const [volume, setVolume] = useState(0);

  const sessionRef = useRef<any>(null);
  const contextsRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);
  const transcriptionBufferRef = useRef({ in: '', out: '' });

  useEffect(() => {
    const startLiveSession = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        await inputAudioContext.resume();
        await outputAudioContext.resume();
        
        contextsRef.current = { input: inputAudioContext, output: outputAudioContext };

        const fullSystemInstruction = `${systemInstruction} 
        You are SARATHI, the charioteer and a supportive academic mentor. 
        If asked for your name or who you are, you MUST answer: "I am SARATHI, your charioteer."
        MANDATORY: If the user asks non-academic questions, politely refuse. 
        Detect Hindi, Telugu, and English automatically and respond in the same language.
        Keep spoken responses concise and helpful. Use a friendly, encouraging tone like a close friend.`;

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              setStatus('Listening...');
              setIsActive(true);

              const source = inputAudioContext.createMediaStreamSource(stream);
              const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (e) => {
                const isSpeaking = outputAudioContext.currentTime < nextStartTimeRef.current;
                
                if (isSpeaking) {
                  if (!isModelSpeaking) setIsModelSpeaking(true);
                  setVolume(0);
                  return;
                }

                if (isModelSpeaking) setIsModelSpeaking(false);

                const inputData = e.inputBuffer.getChannelData(0);
                let sum = 0;
                for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                setVolume(Math.sqrt(sum / inputData.length));

                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) {
                  int16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
                }
                
                const media = {
                  data: encode(new Uint8Array(int16.buffer)),
                  mimeType: 'audio/pcm;rate=16000',
                };
                
                sessionPromise.then(s => s.sendRealtimeInput({ media }));
              };
              
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContext.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              if (message.serverContent?.outputTranscription) {
                transcriptionBufferRef.current.out += message.serverContent.outputTranscription.text;
                setOutputTranscription(transcriptionBufferRef.current.out);
              } else if (message.serverContent?.inputTranscription) {
                transcriptionBufferRef.current.in += message.serverContent.inputTranscription.text;
                setInputTranscription(transcriptionBufferRef.current.in);
              }

              if (message.serverContent?.turnComplete) {
                // RECORD THE TURN: Sync voice turn to chat history
                const userFinal = transcriptionBufferRef.current.in;
                const modelFinal = transcriptionBufferRef.current.out;
                
                if (userFinal && modelFinal) {
                  onTurnComplete?.(userFinal, modelFinal);
                }

                transcriptionBufferRef.current = { in: '', out: '' };
                setInputTranscription('');
                setOutputTranscription('');
              }

              const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (base64Audio) {
                const ctx = outputAudioContext;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                const buffer = await pcmToAudioBuffer(decode(base64Audio), ctx, 24000, 1);
                const sourceNode = ctx.createBufferSource();
                sourceNode.buffer = buffer;
                sourceNode.connect(ctx.destination);
                
                sourceNode.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(sourceNode);
                
                sourceNode.onended = () => {
                  sourcesRef.current.delete(sourceNode);
                  if (sourcesRef.current.size === 0 && ctx.currentTime >= nextStartTimeRef.current) {
                    setIsModelSpeaking(false);
                    setStatus('Listening...');
                  }
                };

                if (!isModelSpeaking) {
                  setIsModelSpeaking(true);
                  setStatus(`SARATHI is Speaking...`);
                }
              }

              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => {
                  try { s.stop(); } catch(e) {}
                });
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setIsModelSpeaking(false);
                setStatus('Listening...');
                transcriptionBufferRef.current = { in: '', out: '' };
                setOutputTranscription('');
                setInputTranscription('');
              }
            },
            onerror: (e) => {
              console.error('Live session error:', e);
              setStatus('Connection Error');
            },
            onclose: (e) => {
              setIsActive(false);
              setStatus('Session Ended');
            },
          },
          config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
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
        setStatus('Microphone Access Denied');
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
    <div className="fixed inset-0 z-[200] bg-slate-900/98 backdrop-blur-xl flex flex-col items-center justify-center text-white overflow-hidden">
      <div className={`absolute inset-0 bg-indigo-600/10 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} />

      <div className="relative z-10">
        <div 
          className="w-48 h-48 rounded-[60px] bg-white/5 flex items-center justify-center transition-all duration-300 border border-white/10"
          style={{ transform: `scale(${1 + volume * 1.5})` }}
        >
          <div className={`w-32 h-32 rounded-[45px] transition-all duration-500 flex items-center justify-center shadow-2xl ${
            isModelSpeaking ? 'bg-indigo-400 shadow-indigo-400/30' : 
            isActive ? 'bg-indigo-600 shadow-indigo-600/50' : 'bg-slate-700'
          }`}>
            {isActive ? (
              <div className="flex gap-1.5 items-end h-8">
                {isModelSpeaking ? (
                  [0.3, 0.5, 0.4, 0.6, 0.3].map((h, i) => (
                    <div 
                      key={i} 
                      className="w-1.5 bg-white/80 rounded-full animate-pulse" 
                      style={{ height: `${h * 100}%`, animationDelay: `${i * 0.15}s` }} 
                    />
                  ))
                ) : (
                  [0.4, 0.8, 0.5, 0.9, 0.6].map((h, i) => (
                    <div 
                      key={i} 
                      className="w-1.5 bg-white rounded-full animate-bounce" 
                      style={{ 
                        height: `${Math.max(20, h * 100 * (volume * 5 + 0.2))}%`, 
                        animationDuration: '0.6s',
                        animationDelay: `${i * 0.1}s` 
                      }} 
                    />
                  ))
                )}
              </div>
            ) : (
              <span className="text-4xl">🎙️</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12 text-center space-y-8 px-8 max-w-2xl relative z-10 min-h-[200px]">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight">{botName}</h2>
          <p className={`text-sm font-bold uppercase tracking-widest transition-colors ${
            isModelSpeaking ? 'text-indigo-300' : 'text-indigo-400 animate-pulse'
          }`}>
            {status}
          </p>
        </div>

        <div className="space-y-6">
          {inputTranscription && !isModelSpeaking && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">You</p>
              <p className="text-lg text-white font-medium italic opacity-90 leading-tight">"{inputTranscription}"</p>
            </div>
          )}
          
          {outputTranscription && isModelSpeaking && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">SARATHI</p>
              <p className="text-xl text-indigo-100 font-bold leading-relaxed">{outputTranscription}</p>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-12 left-0 right-0 flex justify-center z-10 pb-safe">
        <button 
          onClick={onClose}
          className="group flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-red-500 hover:text-white rounded-[24px] font-black text-sm uppercase tracking-widest transition-all border border-white/10 hover:border-red-500"
        >
          <span className="text-xl group-hover:rotate-90 transition-transform">✕</span>
          End Session
        </button>
      </div>
    </div>
  );
};

export default VoiceOverlay;
