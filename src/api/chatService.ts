import api from './axios';
import type { Session, Message } from '../types/types';

/**
 * chatService.ts
 * REST calls for session management and message history.
 * All requests automatically include the JWT Bearer token via the Axios interceptor.
 */

export interface SessionRead {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  preview: string | null;
}

export interface MessageRead {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  response_type: string | null;
  agent_used: string | null;
  trace_url: string | null;
  created_at: string;
}

export const chatService = {
  // ----- Session endpoints -----

  listSessions: async (): Promise<Session[]> => {
    const res = await api.get<{ sessions: SessionRead[] }>('/agent/sessions');
    return res.data.sessions.map((s) => ({
      id: s.id,
      title: s.title,
      timestamp: s.updated_at,
      preview: s.preview ?? '',
    }));
  },

  createSession: async (title = 'New Chat'): Promise<Session> => {
    const res = await api.post<SessionRead>('/agent/sessions', { title });
    return {
      id: res.data.id,
      title: res.data.title,
      timestamp: res.data.updated_at,
      preview: '',
    };
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await api.delete(`/agent/sessions/${sessionId}`);
  },

  // ----- Message endpoints -----

  getMessages: async (sessionId: string): Promise<Message[]> => {
    const res = await api.get<{ messages: MessageRead[] }>(
      `/agent/sessions/${sessionId}/messages`
    );
    return res.data.messages.map((m, i) => {
      let structuredContent: import('../types/types').SearchResponse | import('../types/types').CodeResponse | undefined;
      let response_type = (m.response_type as 'text' | 'code' | undefined) ?? undefined;
      let content = m.content;

      // Assistant messages: the backend stores the structured payload as a JSON
      // string in the content column. Parse it back so the renderer gets the
      // correct structuredContent instead of displaying raw JSON.
      if (m.role === 'assistant' && m.content) {
        try {
          const parsed = JSON.parse(m.content);
          if (parsed && typeof parsed === 'object') {
            if ('answer' in parsed) {
              // SearchResponse
              response_type = 'text';
              structuredContent = {
                answer: String(parsed.answer ?? ''),
                source_urls: Array.isArray(parsed.source_urls) ? parsed.source_urls : [],
              };
              content = String(parsed.answer ?? m.content);
            } else if ('code' in parsed) {
              // CodeResponse
              response_type = 'code';
              structuredContent = {
                language: String(parsed.language ?? 'python'),
                code: String(parsed.code ?? ''),
                explanation: String(parsed.explanation ?? ''),
              };
              content = `\`\`\`${parsed.language}\n${parsed.code}\n\`\`\`\n\n${parsed.explanation}`;
            }
          }
        } catch {
          // content is plain text — leave as-is
        }
      }

      return {
        id: i + 1,
        role: m.role as 'user' | 'assistant',
        content,
        timestamp: m.created_at,
        agent: (m.agent_used as 'rag' | 'sql' | 'web' | undefined) ?? undefined,
        response_type,
        structuredContent,
        trace_url: m.trace_url ?? undefined,
      };
    });
  },
};
