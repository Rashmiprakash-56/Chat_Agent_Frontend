export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;               // plain text (for user msgs or text answers)
  agent?: 'rag' | 'sql' | 'web';
  timestamp: string;
  sources?: string[];
  response_type?: 'text' | 'code'; // only for assistant messages
  structuredContent?: SearchResponse | CodeResponse; // parsed answer payload
  trace_url?: string;            // LangSmith trace link (assistant only)
}

export interface Session {
  id: string;
  title: string;
  timestamp: string;
  preview: string;
}

export interface UserProfile {
  name: string;
  email: string;
  bio: string;
}

export interface UserSettings {
  streamResponses: boolean;
  showAgentBadges: boolean;
  darkMode: boolean;
  notifications: boolean;
}

export interface UsageStats {
  totalChats: number;
  totalMessages: number;
  averageResponseTime: string;
  favoriteAgent: string;
}

export type AgentType = 'rag' | 'sql' | 'web';

export interface AgentConfig {
  label: string;
  icon: React.ReactElement;
  color: string;
}

export interface WebSocketMessage {
  type: 'token' | 'agent_start' | 'done' | 'error';
  content?: string;
  agent?: AgentType;
  error?: string;
}

// Structured response types matching the backend agent schemas
export interface SearchResponse {
  answer: string;
  source_urls: string[];
}

export interface CodeResponse {
  language: string;
  code: string;
  explanation: string;
}