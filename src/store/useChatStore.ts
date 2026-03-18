import { create } from 'zustand';
import { chatService } from '../api/chatService';
import type { Message, Session } from '../types/types';

/**
 * useChatStore.ts
 * Global Zustand store for sessions and active conversation messages.
 * Sessions are always fetched from the backend (not persisted in localStorage).
 */

type ChatStore = {
  sessions: Session[];
  currentSessionId: string | null;
  messages: Message[];
  isStreaming: boolean;

  // Actions
  fetchSessions: () => Promise<void>;
  createSession: (title?: string) => Promise<Session>;
  deleteSession: (sessionId: string) => Promise<void>;
  selectSession: (sessionId: string) => Promise<void>;
  setCurrentSessionId: (id: string | null) => void;

  // Message helpers (called during/after streaming)
  addMessage: (msg: Message) => void;
  updateLastMessage: (patch: Partial<Message>) => void;
  setIsStreaming: (v: boolean) => void;

  // Update session title locally (optimistic) after backend auto-titles it
  updateSessionTitle: (sessionId: string, title: string) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  sessions: [],
  currentSessionId: null,
  messages: [],
  isStreaming: false,

  fetchSessions: async () => {
    try {
      const sessions = await chatService.listSessions();
      set({ sessions });
    } catch {
      // silently ignore (e.g. on initial unauthenticated load)
    }
  },

  createSession: async (title = 'New Chat') => {
    const session = await chatService.createSession(title);
    set((state) => ({ sessions: [session, ...state.sessions] }));
    return session;
  },

  deleteSession: async (sessionId) => {
    await chatService.deleteSession(sessionId);
    set((state) => {
      const sessions = state.sessions.filter((s) => s.id !== sessionId);
      const currentSessionId =
        state.currentSessionId === sessionId ? null : state.currentSessionId;
      const messages = currentSessionId === null ? [] : state.messages;
      return { sessions, currentSessionId, messages };
    });
  },

  selectSession: async (sessionId) => {
    set({ currentSessionId: sessionId, messages: [], isStreaming: false });
    try {
      const messages = await chatService.getMessages(sessionId);
      set({ messages });
    } catch {
      set({ messages: [] });
    }
  },

  setCurrentSessionId: (id) => set({ currentSessionId: id }),

  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),

  updateLastMessage: (patch) =>
    set((state) => {
      const messages = [...state.messages];
      if (messages.length === 0) return {};
      messages[messages.length - 1] = { ...messages[messages.length - 1], ...patch };
      return { messages };
    }),

  setIsStreaming: (v) => set({ isStreaming: v }),

  updateSessionTitle: (sessionId, title) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, title } : s
      ),
    })),
}));
