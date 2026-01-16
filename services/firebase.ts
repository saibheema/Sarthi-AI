
import { UserProfile } from '../types';

/**
 * In a real environment:
 * import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
 * import { getFirestore, doc, setDoc } from "firebase/firestore";
 */

export const authService = {
  // Mocking Firebase Auth behavior
  login: async (email: string, pass: string): Promise<string> => {
    // Simulate API delay
    await new Promise(r => setTimeout(r, 800));
    return `uid_${btoa(email).slice(0, 10)}`;
  },
  
  register: async (email: string, name: string): Promise<string> => {
    await new Promise(r => setTimeout(r, 1000));
    return `uid_${btoa(email).slice(0, 10)}`;
  }
};

export const analyticsService = {
  logEvent: (userId: string, event: string, data: any) => {
    console.log(`[Analytics] User: ${userId} | Event: ${event}`, data);
    // In production, send to Firestore/BigQuery
    const users = JSON.parse(localStorage.getItem('edumentor_users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === userId);
    if (userIndex > -1) {
      if (event === 'message_sent') {
        users[userIndex].analytics.totalMessages += 1;
        const lang = data.language || 'en';
        users[userIndex].analytics.languagePreference[lang] = (users[userIndex].analytics.languagePreference[lang] || 0) + 1;
      }
      localStorage.setItem('edumentor_users', JSON.stringify(users));
    }
  }
};
