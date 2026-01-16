
export interface UserProfile {
  id: string; // Firebase UID
  email: string;
  name: string;
  role: 'student' | 'admin';
  customBotName?: string;
  currentPersonality?: 'friend' | 'mentor' | 'teacher';
  schoolId?: string; // Optional for multi-tenant integration
  schoolContext?: {
    currentGrade?: string;
    subjects?: string[];
    recentPerformance?: string;
  };
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
  content: string; // Syllabus / Solutions / Context
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
  summaries: string[]; // Stores periodic summaries (every 50 messages)
  lastUpdated: number;
  schoolId?: string;
}

export interface BotSettings {
  name: string;
  personality: 'friend' | 'mentor' | 'teacher';
}
