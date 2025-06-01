
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'error';
  content: string | React.ReactNode; // ReactNode for haiku card
  timestamp: number;
  type?: 'text' | 'haiku'; // For special formatting
}

export interface UserPreferences {
  tone: 'Formal' | 'Guiding' | 'Concise';
  answerLength: 'Detailed' | 'Moderate' | 'Brief';
  bushidoInterest: 'High' | 'Moderate' | 'Low';
}

export interface TTSSettings {
  enabled: boolean;
  voiceURI: string | null;
}

export interface QuizData {
  tone: UserPreferences['tone'];
  answerLength: UserPreferences['answerLength'];
  bushidoInterest: UserPreferences['bushidoInterest'];
}
