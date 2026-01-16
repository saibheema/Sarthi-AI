
import React, { useState, useEffect } from 'react';
import { BotSettings as BotSettingsType, Message, ChatSession, UserProfile } from './types';
import { geminiService } from './services/gemini';
import { persistenceService } from './services/persistence';
import { analyticsService } from './services/firebase';
import ChatContainer from './components/ChatContainer';
import VoiceOverlay from './components/VoiceOverlay';
import Auth from './components/Auth';
import AnalyticsPanel from './components/AnalyticsPanel';
import StorePanel from './components/StorePanel';
import RagManager from './components/RagManager';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'analytics' | 'store' | 'rag'>('chat');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [settings, setSettings] = useState<BotSettingsType>({
    name: 'Sarthi',
    personality: 'mentor',
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const handleAuth = (profile: UserProfile) => {
    const existing = persistenceService.getUser(profile.id);
    if (existing) {
      setUser({ ...existing, role: profile.role });
      const userSessions = persistenceService.getSessionsForUser(existing.id);
      if (userSessions.length > 0) {
        const last = userSessions.sort((a,b) => b.lastUpdated - a.lastUpdated)[0];
        setSessionId(last.id);
        setMessages(last.messages);
      } else {
        startNewSession(existing.id);
      }
    } else {
      persistenceService.saveUser(profile);
      setUser(profile);
      startNewSession(profile.id);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSessionId(null);
    setMessages([]);
    setActiveTab('chat');
  };

  const startNewSession = (userId: string) => {
    const id = `session_${Date.now()}`;
    setSessionId(id);
    setMessages([]);
    persistenceService.saveSession({
      id,
      userId,
      botName: user?.customBotName || settings.name,
      messages: [],
      summaries: [],
      lastUpdated: Date.now()
    });
  };

  const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const updatedUser: UserProfile = {
      ...user,
      name: formData.get('userName') as string,
      schoolContext: {
        currentGrade: formData.get('grade') as string,
        subjects: (formData.get('subjects') as string).split(',').map(s => s.trim()),
      }
    };
    setUser(updatedUser);
    persistenceService.saveUser(updatedUser);
    setIsEditingProfile(false);
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !currentImage) || !user || !sessionId) return;

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

    const isHindi = /[\u0900-\u097F]/.test(userText);
    const isTelugu = /[\u0C00-\u0C7F]/.test(userText);
    const lang = isHindi ? 'hi' : isTelugu ? 'te' : 'en';
    analyticsService.logEvent(user.id, 'message_sent', { language: lang });

    try {
      const currentHistory = [...messages, userMsg];
      const context = persistenceService.getRelevantContext(sessionId, userText);
      
      const response = await geminiService.chat(
        userText,
        currentHistory.slice(-15),
        settings,
        user,
        userMsg.image,
        context
      );

      let updatedUser = { ...user };
      const nameMatch = userText.match(/(?:call yourself|rename yourself to|your name is|call you|name you as) (\w+)/i);
      if (nameMatch && nameMatch[1]) {
        updatedUser.customBotName = nameMatch[1];
      }
      const personaText = userText.toLowerCase();
      if (personaText.includes('be a teacher') || personaText.includes('be my teacher')) updatedUser.currentPersonality = 'teacher';
      else if (personaText.includes('be a friend') || personaText.includes('be my friend')) updatedUser.currentPersonality = 'friend';
      else if (personaText.includes('be a mentor') || personaText.includes('be my mentor')) updatedUser.currentPersonality = 'mentor';

      if (JSON.stringify(updatedUser) !== JSON.stringify(user)) {
        setUser(updatedUser);
        persistenceService.saveUser(updatedUser);
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response || "I'm focusing on your academic journey. How can I help with your studies?",
        timestamp: Date.now()
      };

      const finalMessages = [...currentHistory, botMsg];
      setMessages(finalMessages);

      if (finalMessages.length > 0 && finalMessages.length % 50 === 0) {
        const summary = await geminiService.summarize(finalMessages);
        persistenceService.addSummary(sessionId, summary);
      }

      persistenceService.saveSession({
        id: sessionId,
        userId: user.id,
        botName: updatedUser.customBotName || settings.name,
        messages: finalMessages,
        summaries: persistenceService.getSession(sessionId)?.summaries || [],
        lastUpdated: Date.now()
      });

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <Auth onAuth={handleAuth} />;

  const isAdmin = user.role === 'admin';
  const currentBotName = user.customBotName || settings.name;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 font-sans">
      {isVoiceMode && sessionId && (
        <VoiceOverlay 
          botName={currentBotName} 
          onClose={() => setIsVoiceMode(false)}
          systemInstruction={`You are ${currentBotName}, Sarthi for ${user.name}. Grade ${user.schoolContext?.currentGrade || 'N/A'}. Fluent in Hindi, Telugu, English.`}
        />
      )}

      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-serif font-bold text-2xl shadow-lg shadow-indigo-100">S</div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Sarthi AI</h1>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Logout">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>

        <nav className="px-4 pb-4 flex flex-col gap-1.5">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}
          >
            <span>💬</span> Academic Guide
          </button>
          <button 
            onClick={() => setActiveTab('store')}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'store' ? 'bg-indigo-600 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}
          >
            <span>🎒</span> Sarthi Hub (Store)
          </button>
          {isAdmin && (
            <>
              <button 
                onClick={() => setActiveTab('rag')}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'rag' ? 'bg-indigo-600 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}
              >
                <span>🔍</span> RAG Database
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-md' : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}
              >
                <span>📊</span> Admin Insights
              </button>
            </>
          )}
        </nav>

        <div className="flex-1 overflow-y-auto px-6 space-y-4">
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 relative group">
            <button 
              onClick={() => setIsEditingProfile(true)}
              className="absolute top-2 right-2 p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-white rounded-md opacity-0 group-hover:opacity-100 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <div className="flex justify-between items-start mb-1">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Profile</p>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${isAdmin ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                {user.role}
              </span>
            </div>
            <p className="text-indigo-900 font-bold truncate">{user.name}</p>
            <p className="text-[10px] text-indigo-400 truncate opacity-60">{user.email}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-2">
             <p className="text-[10px] font-bold text-slate-400 uppercase">Active Identity</p>
             <p className="text-sm font-semibold text-slate-700">{currentBotName} ({user.currentPersonality || settings.personality})</p>
          </div>

          <button 
            onClick={() => startNewSession(user.id)}
            className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-all border border-slate-200"
          >
            New Session
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 py-3 px-6 flex items-center justify-between sticky top-0 z-10">
          <div>
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
              {activeTab === 'chat' ? 'Personalized Guide' : activeTab === 'store' ? 'Unified Commerce Platform' : activeTab === 'rag' ? 'Knowledge Management' : 'Performance Dashboard'}
            </span>
            <h2 className="text-slate-800 font-bold">
              {activeTab === 'chat' ? `Consulting ${currentBotName}` : activeTab === 'store' ? 'Stationery Hub' : activeTab === 'rag' ? 'Syllabus Intelligence' : 'Student Analytics'}
            </h2>
          </div>
        </header>

        {activeTab === 'chat' ? (
          <>
            <ChatContainer messages={messages} isLoading={isLoading} />
            <div className="p-4 bg-white border-t border-slate-200">
              <div className="max-w-4xl mx-auto space-y-3">
                {currentImage && (
                  <div className="relative inline-block group animate-in fade-in zoom-in duration-200">
                    <img src={currentImage} alt="Preview" className="h-24 w-24 object-cover rounded-xl border-4 border-indigo-50 shadow-lg" />
                    <button onClick={() => setCurrentImage(null)} className="absolute -top-3 -right-3 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md border-2 border-white">✕</button>
                  </div>
                )}
                <div className="flex items-end gap-2 bg-slate-100 p-2 rounded-[28px] focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <div className="relative group">
                    <input type="file" id="image-upload" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setCurrentImage(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} className="hidden" />
                    <label htmlFor="image-upload" className="w-10 h-10 text-slate-500 rounded-full hover:bg-slate-200 cursor-pointer transition-all flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </label>
                  </div>
                  <div className="flex-1 relative flex items-center gap-1">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                      placeholder={`Ask ${currentBotName} about syllabus or math...`}
                      className="w-full pl-2 pr-2 py-2.5 bg-transparent border-none rounded-2xl resize-none focus:ring-0 outline-none text-sm min-h-[40px] max-h-32 transition-all"
                      rows={1}
                    />
                    <button
                      onClick={() => setIsVoiceMode(true)}
                      className="w-10 h-10 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all flex items-center justify-center shrink-0"
                      title="Voice Mode"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 00-3 3v8a3 3 0 006 0V5a3 3 0 00-3-3z" /></svg>
                    </button>
                    <button
                      onClick={handleSendMessage}
                      disabled={isLoading || (!inputText.trim() && !currentImage)}
                      className="w-10 h-10 bg-indigo-600 text-white rounded-full shadow-lg disabled:bg-slate-300 transition-all active:scale-90 flex items-center justify-center shrink-0"
                    >
                      <svg className="w-5 h-5 rotate-90 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'store' ? (
          <div className="flex-1 overflow-y-auto bg-slate-50">
            <StorePanel />
          </div>
        ) : activeTab === 'rag' && isAdmin ? (
          <div className="flex-1 overflow-y-auto bg-slate-50">
            <RagManager />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-slate-50/50">
            <AnalyticsPanel user={user} />
          </div>
        )}
      </main>

      {/* Profile Edit Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Update Profile</h3>
              <button onClick={() => setIsEditingProfile(false)} className="text-white/80 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Display Name</label>
                <input name="userName" type="text" defaultValue={user.name} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Grade</label>
                  <input name="grade" type="text" defaultValue={user.schoolContext?.currentGrade} placeholder="e.g. 10th" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subjects</label>
                  <input name="subjects" type="text" defaultValue={user.schoolContext?.subjects?.join(', ')} placeholder="Math, Physics" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
