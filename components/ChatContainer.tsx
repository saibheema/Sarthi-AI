// Add React import to fix namespace errors
import React, { useRef, useEffect } from 'react';
import { Message } from '../types';

interface Props {
  messages: Message[];
  isLoading: boolean;
}

// Fix: Now uses the React namespace properly
const ChatContainer: React.FC<Props> = ({ messages, isLoading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const parseA2UI = (text: string) => {
    // Fix: React.ReactNode now found
    const elements: React.ReactNode[] = [];
    
    const problemRegex = /\[PROBLEM_START\]([\s\S]*?)\[PROBLEM_END\]/g;
    const stepRegex = /\[STEP_(\d+):\s*(.*?)\]([\s\S]*?)\[STEP_END\]/g;
    const formulaRegex = /\[FORMULA\]([\s\S]*?)\[FORMULA_END\]/g;
    const conclusionRegex = /\[CONCLUSION_START\]([\s\S]*?)\[CONCLUSION_END\]/g;

    if (!text.includes('[PROBLEM_START]') && !text.includes('[STEP_')) {
      return <div className="space-y-2 whitespace-pre-wrap leading-relaxed">{text}</div>;
    }

    let problemMatch;
    while ((problemMatch = problemRegex.exec(text)) !== null) {
      elements.push(
        <div key={`prob-${problemMatch.index}`} className="mb-6 bg-indigo-50/50 border-l-4 border-indigo-500 p-5 rounded-r-2xl shadow-sm">
          <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            Analyzing Topic
          </div>
          <div className="text-slate-800 font-medium">{problemMatch[1].trim()}</div>
        </div>
      );
    }

    let stepMatch;
    while ((stepMatch = stepRegex.exec(text)) !== null) {
      const stepNum = stepMatch[1];
      const stepTitle = stepMatch[2];
      const stepContent = stepMatch[3];
      
      const contentParts: React.ReactNode[] = [];
      let formulaParts = stepContent.split(/(\[FORMULA\][\s\S]*?\[FORMULA_END\])/g);
      
      formulaParts.forEach((part, i) => {
        if (part.startsWith('[FORMULA]')) {
          const formulaText = part.replace('[FORMULA]', '').replace('[FORMULA_END]', '').trim();
          contentParts.push(
            <div key={`formula-${i}`} className="my-4 py-5 bg-indigo-600 text-white flex items-center justify-center font-mono text-xl rounded-2xl shadow-lg border-2 border-indigo-400">
              {formulaText}
            </div>
          );
        } else {
          contentParts.push(<span key={`text-${i}`} className="block leading-relaxed text-slate-700 py-1">{part.trim()}</span>);
        }
      });

      elements.push(
        <div key={`step-${stepMatch.index}`} className="relative pl-12 mb-10 group">
          <div className="absolute left-[20px] top-10 bottom-[-40px] w-1 bg-gradient-to-b from-indigo-100 to-transparent group-last:hidden"></div>
          
          <div className="absolute left-0 top-0 w-10 h-10 bg-white border-2 border-indigo-600 rounded-2xl flex items-center justify-center text-indigo-600 font-extrabold shadow-md z-10 transition-transform group-hover:scale-110">
            {stepNum}
          </div>
          
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-indigo-100/50 hover:shadow-xl transition-all border-t-4 border-t-indigo-500">
            <h4 className="text-xs font-black text-indigo-900 mb-3 uppercase tracking-wider">{stepTitle}</h4>
            <div className="text-sm space-y-1">
              {contentParts}
            </div>
          </div>
        </div>
      );
    }

    let conclusionMatch;
    while ((conclusionMatch = conclusionRegex.exec(text)) !== null) {
      elements.push(
        <div key={`conc-${conclusionMatch.index}`} className="mt-8 bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-6 rounded-[32px] shadow-2xl shadow-indigo-200 text-center border-4 border-white">
          <div className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-2">Sarthi's Final Conclusion</div>
          <div className="text-xl font-black">{conclusionMatch[1].trim().replace(/\*\*/g, '')}</div>
        </div>
      );
    }

    return <div className="space-y-2">{elements}</div>;
  };

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth bg-slate-50/30"
    >
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-8 text-slate-400">
          <div className="relative">
            <div className="w-32 h-32 bg-white rounded-[48px] flex items-center justify-center text-6xl shadow-2xl shadow-slate-200 animate-bounce-slow">
              ✨
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg border-4 border-white">🎓</div>
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">I'm here to help!</h3>
            <p className="max-w-sm text-sm leading-relaxed text-slate-500 font-medium">
              I can help with <span className="text-indigo-600 font-bold">any subject</span> for CBSE, AP, or Telangana boards up to Class 12. 
              <br/><br/>
              Ask a question, upload a picture of your homework, or let's brainstorm a project together.
            </p>
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}
        >
          <div
            className={`max-w-[98%] md:max-w-[88%] rounded-[36px] transition-all ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white px-6 py-4 rounded-tr-none shadow-xl shadow-indigo-100'
                : 'bg-transparent text-slate-800'
            }`}
          >
            {msg.image && (
              <div className="mb-6 rounded-[32px] overflow-hidden border-8 border-white bg-slate-900 shadow-2xl max-w-md mx-auto transform -rotate-1 hover:rotate-0 transition-transform">
                <img 
                  src={msg.image} 
                  alt="Academic Content" 
                  className="max-h-96 w-full object-contain"
                />
              </div>
            )}
            
            <div className={`${msg.role === 'model' ? 'w-full' : ''}`}>
              {msg.role === 'model' ? (
                <div className="space-y-4">
                   {parseA2UI(msg.text)}
                </div>
              ) : (
                <div className="text-[16px] font-semibold leading-relaxed tracking-tight">
                  {msg.text}
                </div>
              )}
            </div>

            <div className={`text-[10px] mt-4 flex items-center justify-end gap-2 ${msg.role === 'user' ? 'text-indigo-100 opacity-80' : 'text-slate-400'}`}>
              {msg.role === 'model' && (
                <span className="bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-tighter shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Sarthi Assistant
                </span>
              )}
              <span className="font-bold">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white border border-slate-200 rounded-3xl px-6 py-4 flex gap-3 items-center shadow-xl border-b-4 border-b-indigo-500">
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
            </div>
            <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Generating Solution...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;