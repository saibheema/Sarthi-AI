
import React, { useState, useEffect, useRef } from 'react';
import { BotSettings as BotSettingsType, Message, ChatSession, UserProfile } from './types';
import { geminiService } from './services/gemini';
import { persistenceService } from './services/persistence';
import { firestoreService } from './services/firebase';
import ChatContainer from './components/ChatContainer';
import VoiceOverlay from './components/VoiceOverlay';
import Auth from './components/Auth';
import AnalyticsPanel from './components/AnalyticsPanel';
import StorePanel from './components/StorePanel';
import RagManager from './components/RagManager';
import ProjectReport from './components/ProjectReport';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'analytics' | 'store' | 'rag' | 'report'>('chat');
  const [settings, setSettings] = useState<BotSettingsType>({
    name: 'SARATHI',
    personality: 'mentor',
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Prevention of duplicate calls
  const isRequesting = useRef(false);

  useEffect(() => {
    if ((window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
    }
  }, []);

  const handleAuth = async (profile: UserProfile) => {
    const existing = persistenceService.getUser(profile.id);
    const userToUse = existing ? { ...existing, role: profile.role } : profile;
    setUser(userToUse);
    persistenceService.saveUser(userToUse);

    const userSessions = await firestoreService.getSessions(userToUse.id);
    if (userSessions.length > 0) {
      const last = userSessions[0];
      setSessionId(last.id);
      setMessages(last.messages);
    } else {
      startNewSession(userToUse);
    }
  };

  const finalizeSession = async () => {
    if (!sessionId || !user || messages.length < 3) return;
    
    setIsLoading(true);
    try {
      const summary = await geminiService.summarizeSession(messages);
      const updatedTraits = await geminiService.learnFromUser(messages, user.learnedTraits || '');
      
      const sessionUpdate: ChatSession = {
        id: sessionId,
        userId: user.id,
        botName: settings.name,
        messages: messages,
        summary: summary,
        lastUpdated: Date.now()
      };

      await firestoreService.saveSession(sessionUpdate);
      await firestoreService.updateUserProfile(user.id, { 
        learnedTraits: updatedTraits 
      });
      
      setUser(prev => prev ? { ...prev, learnedTraits: updatedTraits } : null);
    } catch (e) {
      console.error("Session finalization error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await finalizeSession();
    setUser(null);
    setSessionId(null);
    setMessages([]);
    setActiveTab('chat');
  };

  const startNewSession = async (currUser: UserProfile) => {
    if (sessionId) await finalizeSession();
    
    const id = `session_${Date.now()}`;
    setSessionId(id);
    setMessages([]);
    
    const newSession: ChatSession = {
      id,
      userId: currUser.id,
      botName: settings.name,
      messages: [],
      lastUpdated: Date.now()
    };
    await firestoreService.saveSession(newSession);
  };

  const handleVoiceTurnComplete = (userText: string, modelText: string) => {
    const userMsg: Message = {
      id: `voice_u_${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: Date.now(),
    };
    const botMsg: Message = {
      id: `voice_m_${Date.now()}`,
      role: 'model',
      text: modelText,
      timestamp: Date.now(),
    };

    setMessages(prev => {
      const updated = [...prev, userMsg, botMsg];
      if (sessionId && user) {
        firestoreService.saveSession({
          id: sessionId,
          userId: user.id,
          botName: settings.name,
          messages: updated,
          lastUpdated: Date.now()
        });
      }
      return updated;
    });
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !currentImage) || !user || !sessionId || isRequesting.current) return;

    isRequesting.current = true;
    const userText = inputText.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: Date.now(),
      image: currentImage || undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setCurrentImage(null);
    setIsLoading(true);

    try {
      const prevSessions = await firestoreService.getSessions(user.id);
      const summaries = prevSessions
        .filter(s => s.id !== sessionId && s.summary)
        .slice(-3)
        .map(s => `Session (${new Date(s.lastUpdated).toLocaleDateString()}): ${s.summary}`)
        .join('\n');

      const response = await geminiService.chat(
        userText,
        messages.slice(-8),
        settings,
        user,
        userMsg.image,
        summaries
      );

      const visualRegex = /\[VISUAL: (.*?)\]/;
      const visualMatch = response.match(visualRegex);
      
      let generatedImage = undefined;
      if (visualMatch) {
        try {
          generatedImage = await geminiService.generateImage(visualMatch[1]);
        } catch (imgError) {}
      }

      const botMsg: Message = {
        id: Date.now().toString(),
        role: 'model',
        text: response,
        timestamp: Date.now(),
        image: generatedImage
      };

      const finalMessages = [...messages, userMsg, botMsg];
      setMessages(finalMessages);
      
      firestoreService.saveSession({
        id: sessionId,
        userId: user.id,
        botName: settings.name,
        messages: finalMessages,
        lastUpdated: Date.now()
      });

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      isRequesting.current = false;
    }
  };

  if (!user) return <Auth onAuth={handleAuth} />;

  const isAdmin = user.role === 'admin';

  return (
    <div className={`flex flex-col md:flex-row h-[100dvh] w-full bg-white overflow-hidden ${isStandalone ? 'pt-safe' : ''}`}>
      {isVoiceMode && (
        <VoiceOverlay 
          botName={settings.name} 
          onClose={() => setIsVoiceMode(false)}
          systemInstruction={`Academic mentor for ${user.name}. ${user.learnedTraits}`}
          onTurnComplete={handleVoiceTurnComplete}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 bg-white border-r border-slate-200 flex-col shrink-0 shadow-sm overflow-hidden">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-serif font-bold text-xl shadow-lg shrink-0">S</div>
            <h1 className="text-xl font-black text-slate-800">SARATHI</h1>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 rounded-xl transition-all">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <div className="py-4">
            <div className="bg-indigo-50 p-4 rounded-3xl border border-indigo-100">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Student Profile</p>
              <p className="text-sm font-bold text-indigo-900 truncate">{user.name}</p>
              <p className="text-[9px] text-indigo-400 font-medium leading-tight mt-1 opacity-80">{user.learnedTraits || 'Learning your style...'}</p>
            </div>
          </div>
          
          <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
            <span>💬</span> Chat
          </button>
          {isAdmin && (
            <>
              <button onClick={() => setActiveTab('report')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'report' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                <span>💼</span> Executive Suite
              </button>
              <button onClick={() => setActiveTab('store')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'store' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                <span>🎒</span> Store
              </button>
              <button onClick={() => setActiveTab('rag')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'rag' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                <span>🔍</span> RAG DB
              </button>
              <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                <span>📊</span> Analytics
              </button>
            </>
          )}
        </nav>

        <div className="p-6 space-y-3 shrink-0">
          <button onClick={() => startNewSession(user)} className="w-full py-3 bg-slate-50 text-slate-500 rounded-2xl text-xs font-black hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100 uppercase tracking-widest">
            New Session
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-white border-b border-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-serif font-bold text-xs">S</div>
            <h1 className="text-sm font-black text-slate-800 tracking-tight">SARATHI AI</h1>
          </div>
          <div className="text-[9px] font-black text-indigo-400 uppercase tracking-tighter">Academic Charioteer</div>
      </div>

      <main className="flex-1 flex flex-col min-w-0 min-h-0 relative overflow-hidden bg-white">
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          {activeTab === 'chat' ? (
            <>
              <ChatContainer messages={messages} isLoading={isLoading} />
              <div className="shrink-0 px-2 pb-2 md:p-6 bg-white">
                <div className="max-w-4xl mx-auto space-y-2">
                  {currentImage && (
                    <div className="relative inline-block ml-4">
                      <img src={currentImage} alt="Preview" className="h-12 w-12 object-cover rounded-xl border border-slate-200" />
                      <button onClick={() => setCurrentImage(null)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px]">✕</button>
                    </div>
                  )}
                  <div className="flex items-end gap-1 bg-slate-50 p-1 md:p-2 rounded-[24px] md:rounded-[40px] border border-slate-200 shadow-sm focus-within:border-indigo-300">
                    <div className="relative shrink-0">
                      <input type="file" id="img-up" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setCurrentImage(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} className="hidden" />
                      <label htmlFor="img-up" className="w-10 h-10 md:w-14 md:h-14 text-slate-400 hover:text-indigo-600 flex items-center justify-center cursor-pointer transition-colors">
                        <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </label>
                    </div>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                      placeholder="Ask your doubt..."
                      className="flex-1 bg-transparent border-none py-3 px-2 outline-none resize-none text-sm md:text-base min-h-[44px] max-h-32"
                      rows={1}
                    />
                    <button onClick={() => setIsVoiceMode(true)} className="w-10 h-10 md:w-14 md:h-14 text-indigo-600 flex items-center justify-center shrink-0 hover:bg-white rounded-full transition-all">
                      <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 00-3 3v8a3 3 0 006 0V5a3 3 0 00-3-3z" /></svg>
                    </button>
                    <button onClick={handleSendMessage} disabled={isLoading || (!inputText.trim() && !currentImage)} className="w-10 h-10 md:w-14 md:h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center disabled:bg-slate-200 transition-all shrink-0">
                      <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'report' && <ProjectReport />}
              {activeTab === 'store' && <StorePanel />}
              {activeTab === 'rag' && <RagManager />}
              {activeTab === 'analytics' && <AnalyticsPanel user={user} />}
            </div>
          )}
        </div>

        {/* Mobile Nav */}
        <nav className="md:hidden flex items-center justify-around bg-white border-t border-slate-100 px-4 py-2 pb-safe shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center gap-0.5 p-2 rounded-xl ${activeTab === 'chat' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <span className="text-lg">💬</span>
            <span className="text-[8px] font-black uppercase tracking-tighter">Study</span>
          </button>
          {isAdmin && (
            <button onClick={() => setActiveTab('report')} className={`flex flex-col items-center gap-0.5 p-2 rounded-xl ${activeTab === 'report' ? 'text-indigo-600' : 'text-slate-400'}`}>
              <span className="text-lg">💼</span>
              <span className="text-[8px] font-black uppercase tracking-tighter">Plans</span>
            </button>
          )}
          <button onClick={() => startNewSession(user)} className="flex flex-col items-center gap-0.5 p-2 text-slate-400 rounded-xl">
            <span className="text-lg">🔄</span>
            <span className="text-[8px] font-black uppercase tracking-tighter">Reset</span>
          </button>
          <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 p-2 text-slate-400 rounded-xl">
            <span className="text-lg">🚪</span>
            <span className="text-[8px] font-black uppercase tracking-tighter">Exit</span>
          </button>
        </nav>
      </main>
    </div>
  );
};

export default App;
