import { useAuthStore } from '../store/useAuthStore';
import type { AgentType } from '../types/types';

/**
 * agentService.ts
 * SSE streaming call to POST /agent/chat/stream.
 * Uses native fetch (Axios does not support ReadableStream on all browsers).
 */

export interface SearchResponse {
  answer: string;
  source_urls: string[];
}

export interface CodeResponse {
  language: string;
  code: string;
  explanation: string;
}

export interface AgentEvent {
  type: 'log' | 'answer' | 'error';
  content?: string | SearchResponse | CodeResponse | Record<string, unknown>;
  response_type?: 'text' | 'code';
  detail?: string;
}

export interface StreamCallbacks {
  onLog: (content: string) => void;
  onAnswer: (responseType: 'text' | 'code', content: SearchResponse | CodeResponse) => void;
  onError: (error: string) => void;
  onDone: () => void;
  /** Called when the backend emits a LangSmith trace URL for this run */
  onTraceUrl?: (url: string) => void;
}

/**
 * Detect which agent was used from log message content.
 */
export function detectAgentFromLog(log: string): AgentType | null {
  const lower = log.toLowerCase();
  if (lower.includes('using tool: rag_tool')) return 'rag';
  if (lower.includes('using tool: sql_agent_tool')) return 'sql';
  if (
    lower.includes('using tool: search_tool') ||
    lower.includes('using tool: extract_tool') ||
    lower.includes('using tool: crawl_tool') ||
    lower.includes('using tool: map_tool') ||
    lower.includes('using tool: research_tool') ||
    lower.includes('using tool: get_research_tool')
  )
    return 'web';
  return null;
}

export async function streamChat(
  sessionId: string,
  message: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const token = useAuthStore.getState().token;

  const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  const response = await fetch(`${baseUrl}/agent/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, session_id: sessionId }),
  });

  if (!response.ok) {
    callbacks.onError(`HTTP ${response.status}: ${response.statusText}`);
    callbacks.onDone();
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError('No readable stream available');
    callbacks.onDone();
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  // Guard: ensure onDone is called exactly once even if the [DONE] sentinel
  // arrives AND the finally block both try to call it.
  let doneFired = false;
  const fireDone = () => {
    if (!doneFired) {
      doneFired = true;
      callbacks.onDone();
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Keep the last (potentially incomplete) line in the buffer
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;

        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') {
          fireDone();
          return;
        }

        try {
          const event: AgentEvent = JSON.parse(payload);
          if (event.type === 'log') {
            const logContent = String(event.content ?? '');
            // Intercept the special trace URL sentinel emitted by the backend
            if (logContent.startsWith('__trace_url__:')) {
              const url = logContent.slice('__trace_url__:'.length);
              callbacks.onTraceUrl?.(url);
            } else {
              callbacks.onLog(logContent);
            }
          } else if (event.type === 'answer') {
            callbacks.onAnswer(
              event.response_type!,
              event.content as SearchResponse | CodeResponse
            );
          } else if (event.type === 'error') {
            callbacks.onError(String(event.content ?? 'Unknown error'));
          }
        } catch {
          // malformed JSON line — skip
        }
      }
    }
  } finally {
    reader.releaseLock();
    fireDone();
  }
}
