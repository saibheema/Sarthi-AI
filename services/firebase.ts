
import { UserProfile, ChatSession } from '../types';

/**
 * Mocking Firestore logic. 
 * Transitioning to actual Firestore would involve using Firebase SDK.
 */

export const firestoreService = {
  async saveSession(session: ChatSession): Promise<void> {
    const allSessions = JSON.parse(localStorage.getItem('firestore_sessions') || '[]');
    const index = allSessions.findIndex((s: any) => s.id === session.id);
    
    // Ensure we don't duplicate messages during save
    const uniqueMessages = Array.from(new Map(session.messages.map(m => [m.id, m])).values());
    const sessionToSave = { ...session, messages: uniqueMessages };

    if (index >= 0) allSessions[index] = sessionToSave;
    else allSessions.push(sessionToSave);
    
    localStorage.setItem('firestore_sessions', JSON.stringify(allSessions));
  },

  async getSessions(userId: string): Promise<ChatSession[]> {
    const allSessions = JSON.parse(localStorage.getItem('firestore_sessions') || '[]');
    // Return sorted by recency
    return allSessions
      .filter((s: any) => s.userId === userId)
      .sort((a: any, b: any) => b.lastUpdated - a.lastUpdated);
  },

  async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    const stored = localStorage.getItem('edumentor_users');
    const users = stored ? JSON.parse(stored) : [];
    const index = users.findIndex((u: any) => u.id === userId);
    if (index >= 0) {
      users[index] = { ...users[index], ...data };
      localStorage.setItem('edumentor_users', JSON.stringify(users));
    }
  }
};

export const authService = {
  login: async (email: string, pass: string): Promise<string> => {
    await new Promise(r => setTimeout(r, 800));
    return `uid_${btoa(email).slice(0, 10)}`;
  },
  
  register: async (email: string, name: string): Promise<string> => {
    await new Promise(r => setTimeout(r, 1000));
    return `uid_${btoa(email).slice(0, 10)}`;
  },

  signInWithGoogle: async (): Promise<{uid: string, email: string, name: string}> => {
    await new Promise(r => setTimeout(r, 1200));
    return {
      uid: `google_uid_${Math.random().toString(36).slice(2, 11)}`,
      email: "student@school.edu",
      name: "Google Student"
    };
  }
};

export const analyticsService = {
  logEvent: (userId: string, event: string, data: any) => {
    const storedUsers = localStorage.getItem('edumentor_users');
    const users = storedUsers ? JSON.parse(storedUsers) : [];
    const userIndex = users.findIndex((u: any) => u.id === userId);
    
    if (userIndex > -1) {
      if (event === 'message_sent') {
        users[userIndex].analytics.totalMessages += 1;
      }
      localStorage.setItem('edumentor_users', JSON.stringify(users));
    }
  }
};
