
export interface UserProfile {
  id: string; // Firebase UID
  email: string;
  name: string;
  role: 'student' | 'admin';
  customBotName?: string;
  currentPersonality?: 'friend' | 'mentor' | 'teacher';
  schoolId?: string;
  schoolContext?: {
    currentGrade?: string;
    subjects?: string[];
    recentPerformance?: string;
  };
  learnedTraits?: string; // Long-term "memory" of the student's behavior
  analytics: {
    totalSessions: number;
    totalMessages: number;
    quizScores: number[];
    commonTopics: string[];
    languagePreference: { [key: string]: number };
  };
}

export interface RagEntry {
  id: string;
  subject: string;
  board: 'CBSE' | 'AP' | 'Telangana';
  content: string;
  sourceUrls: string[];
  timestamp: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  image?: string;
  isSummary?: boolean;
}

export interface ChatSession {
  id: string;
  userId: string;
  botName: string;
  messages: Message[];
  summary?: string; // Condensed version of this specific session
  // Added summaries array to fix TypeScript errors in persistence service
  summaries?: string[];
  lastUpdated: number;
  schoolId?: string;
}

export interface BotSettings {
  name: string;
  personality: 'friend' | 'mentor' | 'teacher';
}