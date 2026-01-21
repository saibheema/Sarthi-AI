
import React, { useRef, useEffect } from 'react';
import { Message } from '../types';

interface Props {
  messages: Message[];
  isLoading: boolean;
}

const ChatContainer: React.FC<Props> = ({ messages, isLoading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const renderContent = (text: string, aiGeneratedImage?: string) => {
    // Check for the specific 403 Error JSON
    try {
      if (text.trim().startsWith('{')) {
        const errorObj = JSON.parse(text);
        if (errorObj.error && errorObj.error.code === 403) {
          return (
            <div className="bg-red-50 border-2 border-red-200 p-6 rounded-[32px] text-red-700 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🚫</span>
                <h4 className="font-black uppercase tracking-widest text-xs">Academic Integrity Filter</h4>
              </div>
              <p className="text-sm font-bold leading-relaxed">{errorObj.error.message}</p>
              <p className="text-[10px] mt-2 opacity-70">Status: {errorObj.error.status}</p>
            </div>
          );
        }
      }
    } catch (e) {}

    // Clean up text by removing/hiding the [VISUAL] tag if the image is already present
    let cleanText = text;
    if (aiGeneratedImage) {
      cleanText = text.replace(/\[VISUAL: (.*?)\]/g, '').trim();
    }

    const elements: React.ReactNode[] = [];
    const problemRegex = /\[PROBLEM_START\]([\s\S]*?)\[PROBLEM_END\]/g;
    const stepRegex = /\[STEP_(\d+):\s*(.*?)\]([\s\S]*?)\[STEP_END\]/g;
    const conclusionRegex = /\[CONCLUSION_START\]([\s\S]*?)\[CONCLUSION_END\]/g;

    // Split text by lines to handle general text
    if (!text.includes('[PROBLEM_START]') && !text.includes('[STEP_')) {
      return (
        <div className="space-y-4">
          <div className="whitespace-pre-wrap leading-relaxed">{cleanText}</div>
          {aiGeneratedImage && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 px-1">AI-Generated Visual Aid</div>
              <img src={aiGeneratedImage} alt="Academic Visual" className="w-full rounded-[32px] shadow-xl border-4 border-white" />
            </div>
          )}
        </div>
      );
    }

    let match;
    const probMatch = new RegExp(problemRegex).exec(cleanText);
    if (probMatch) {
      elements.push(
        <div key="prob" className="mb-6 bg-blue-50/50 border-l-4 border-blue-600 p-5 rounded-r-2xl">
          <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">Topic Analysis</div>
          <div className="text-slate-800 font-semibold">{probMatch[1].trim()}</div>
        </div>
      );
    }

    // Insert image if available before steps or after analysis
    if (aiGeneratedImage) {
      elements.push(
        <div key="gen-img" className="my-6 animate-in fade-in zoom-in duration-700">
          <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 px-1">Concept Visualization</div>
          <img src={aiGeneratedImage} alt="Academic Visual" className="w-full rounded-[32px] shadow-xl border-4 border-white" />
        </div>
      );
    }

    const stepRegexLocal = new RegExp(stepRegex);
    while ((match = stepRegexLocal.exec(cleanText)) !== null) {
      elements.push(
        <div key={`step-${match[1]}`} className="relative pl-12 mb-8">
          <div className="absolute left-0 top-0 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black shadow-lg">
            {match[1]}
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
            <h4 className="text-[11px] font-black text-indigo-900 mb-2 uppercase tracking-wider">{match[2]}</h4>
            <div className="text-[14px] text-slate-700">{match[3].trim()}</div>
          </div>
        </div>
      );
    }

    const concMatch = new RegExp(conclusionRegex).exec(cleanText);
    if (concMatch) {
      elements.push(
        <div key="conc" className="mt-8 bg-indigo-600 text-white p-6 rounded-[32px] text-center shadow-xl">
          <div className="text-[10px] font-bold text-indigo-200 uppercase mb-1">Final Result</div>
          <div className="text-xl font-black">{concMatch[1].trim()}</div>
        </div>
      );
    }

    return <div className="space-y-2">{elements}</div>;
  };

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-white">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-60">
          <div className="w-32 h-32 bg-indigo-50 rounded-[40px] flex items-center justify-center text-6xl shadow-inner border border-indigo-100">🎓</div>
          <h3 className="text-2xl font-black text-slate-800">Sarthi Academic Mentor</h3>
          <p className="max-w-xs text-sm font-medium text-slate-500 leading-relaxed">I help with Math, Science, and Language. Upload a photo or ask me to explain with a visual!</p>
        </div>
      )}

      {messages.map((msg) => (
        <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
          <div className={`max-w-[95%] md:max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-600 text-white px-6 py-4 rounded-[32px] rounded-tr-none shadow-xl' : 'w-full'}`}>
            {msg.role === 'user' && msg.image && (
              <img src={msg.image} alt="User Upload" className="mb-4 rounded-2xl max-h-60 object-cover shadow-lg border-4 border-white" />
            )}
            {msg.role === 'model' ? renderContent(msg.text, msg.image) : <div className="font-semibold text-sm leading-relaxed">{msg.text}</div>}
            <div className={`text-[9px] mt-2.5 opacity-50 font-black tracking-widest uppercase ${msg.role === 'user' ? 'text-right' : ''}`}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white border border-slate-100 rounded-full px-5 py-2.5 flex gap-3 items-center shadow-md">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
            </div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sarthi is thinking...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
