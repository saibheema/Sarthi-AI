
import { Message, ChatSession, UserProfile, RagEntry } from '../types';

const SESSIONS_KEY = 'edumentor_sessions';
const USERS_KEY = 'edumentor_users';
const RAG_KEY = 'edumentor_rag_db';

export const persistenceService = {
  saveUser: (user: UserProfile) => {
    const users = persistenceService.getAllUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getAllUsers: (): UserProfile[] => {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getUser: (id: string): UserProfile | undefined => {
    return persistenceService.getAllUsers().find(u => u.id === id);
  },

  saveSession: (session: ChatSession) => {
    const sessions = persistenceService.getAllSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  },

  getAllSessions: (): ChatSession[] => {
    const data = localStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getSession: (id: string): ChatSession | undefined => {
    return persistenceService.getAllSessions().find(s => s.id === id);
  },

  getSessionsForUser: (userId: string): ChatSession[] => {
    return persistenceService.getAllSessions().filter(s => s.userId === userId);
  },

  // RAG Management
  saveRagEntry: (entry: RagEntry) => {
    const entries = persistenceService.getAllRagEntries();
    entries.push(entry);
    localStorage.setItem(RAG_KEY, JSON.stringify(entries));
  },

  getAllRagEntries: (): RagEntry[] => {
    const data = localStorage.getItem(RAG_KEY);
    return data ? JSON.parse(data) : [];
  },

  searchGlobalRag: (query: string): string => {
    const entries = persistenceService.getAllRagEntries();
    // Simple keyword search simulation for RAG retrieval
    const keywords = query.toLowerCase().split(/\W+/).filter(k => k.length > 3);
    const results = entries.filter(entry => 
      keywords.some(k => entry.subject.toLowerCase().includes(k) || entry.content.toLowerCase().includes(k))
    );
    
    return results.map(r => `[Source: ${r.board} ${r.subject}] ${r.content}`).join("\n\n");
  },

  addSummary: (sessionId: string, summary: string) => {
    const session = persistenceService.getSession(sessionId);
    if (session) {
      // Initialize summaries array if missing to fix property access error on type ChatSession
      if (!session.summaries) {
        session.summaries = [];
      }
      session.summaries.push(summary);
      persistenceService.saveSession(session);
    }
  },

  getRelevantContext: (sessionId: string, query: string): string => {
    const session = persistenceService.getSession(sessionId);
    const globalKnowledge = persistenceService.searchGlobalRag(query);
    
    let context = "";
    if (globalKnowledge) {
      context += `GLOBAL SYLLABUS KNOWLEDGE:\n${globalKnowledge}\n\n`;
    }

    // Check if summaries exists and has content before joining to fix property access errors
    if (session && session.summaries && session.summaries.length > 0) {
      context += `CHAT HISTORY SUMMARY: ${session.summaries.join(" | ")}`;
    } else if (session) {
      const historySnippet = session.messages.slice(-3).map(m => `${m.role}: ${m.text}`).join("\n");
      context += `CHAT HISTORY:\n${historySnippet}`;
    }
    
    return context;
  }
};