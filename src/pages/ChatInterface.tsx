import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  Chip,
  Avatar,
  CircularProgress,
  Fade,
  Alert,
  Collapse,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Code as CodeIcon,
  Search as SearchIcon,
  Storage as StorageIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  OpenInNew as OpenInNewIcon,
  AutoAwesome as SparkleIcon,
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { type Message, type AgentType, type AgentConfig, type SearchResponse, type CodeResponse, type Session } from '../types/types';
import { useChatStore } from '../store/useChatStore';
import { streamChat, detectAgentFromLog } from '../api/agentService';

// ---------------------------------------------------------------------------
// Animations
// ---------------------------------------------------------------------------

const fadeSlideIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(0, 217, 255, 0.4); }
  50%       { box-shadow: 0 0 0 8px rgba(0, 217, 255, 0); }
`;

const dotBlink = keyframes`
  0%, 80%, 100% { opacity: 0; }
  40%           { opacity: 1; }
`;

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

interface MessageContainerProps { isUser: boolean; }
const MessageContainer = styled(Box)<MessageContainerProps>(({ theme, isUser }) => ({
  display: 'flex',
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(2.5),
  justifyContent: isUser ? 'flex-end' : 'flex-start',
  animation: `${fadeSlideIn} 0.25s ease-out`,
}));

interface MessageBubbleProps { isUser: boolean; }
const MessageBubble = styled(Paper)<MessageBubbleProps>(({ theme, isUser }) => ({
  padding: theme.spacing(1.75, 2.25),
  maxWidth: '72%',
  background: isUser
    ? 'linear-gradient(135deg, #00D9FF 0%, #00A8CC 100%)'
    : 'rgba(19, 24, 50, 0.75)',
  backdropFilter: isUser ? 'none' : 'blur(12px)',
  color: isUser ? '#000' : theme.palette.text.primary,
  borderRadius: isUser
    ? theme.spacing(2, 0.5, 2, 2)
    : theme.spacing(0.5, 2, 2, 2),
  border: isUser
    ? 'none'
    : '1px solid rgba(255, 255, 255, 0.07)',
  boxShadow: isUser
    ? '0 4px 16px rgba(0, 217, 255, 0.2)'
    : '0 4px 24px rgba(0, 0, 0, 0.3)',
}));

// ---------------------------------------------------------------------------
// Agent badge
// ---------------------------------------------------------------------------

const AgentBadge: React.FC<{ agent: AgentType }> = ({ agent }) => {
  const agentConfig: Record<AgentType, AgentConfig> = {
    rag: { label: 'RAG', icon: <CodeIcon sx={{ fontSize: 13 }} />, color: '#00D9FF' },
    sql: { label: 'SQL', icon: <StorageIcon sx={{ fontSize: 13 }} />, color: '#FF6B9D' },
    web: { label: 'WEB', icon: <SearchIcon sx={{ fontSize: 13 }} />, color: '#FFD700' },
  };
  const config = agentConfig[agent];
  return (
    <Chip
      icon={config.icon}
      label={config.label}
      size="small"
      sx={{
        height: 22,
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        bgcolor: `${config.color}18`,
        color: config.color,
        border: `1px solid ${config.color}35`,
        '& .MuiChip-icon': { color: config.color },
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// Blinking streaming indicator dots
// ---------------------------------------------------------------------------

const StreamingDots: React.FC = () => (
  <Box sx={{ display: 'inline-flex', gap: 0.4, alignItems: 'center', ml: 0.75 }}>
    {[0, 1, 2].map((i) => (
      <Box
        key={i}
        sx={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          animation: `${dotBlink} 1.2s ease-in-out infinite`,
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
  </Box>
);

// ---------------------------------------------------------------------------
// Message content renderer
// ---------------------------------------------------------------------------

const MessageContent: React.FC<{ message: Message }> = ({ message }) => {
  if (message.role === 'user') {
    return (
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.65 }}>
        {message.content}
      </Typography>
    );
  }

  // Empty streaming placeholder
  if (!message.content && !message.structuredContent) {
    return <StreamingDots />;
  }

  // Structured code response
  if (message.response_type === 'code' && message.structuredContent) {
    const code = message.structuredContent as CodeResponse;
    return (
      <Box>
        {code.explanation && (
          <Typography variant="body2" sx={{ mb: 1.5, opacity: 0.85, lineHeight: 1.7 }}>
            {code.explanation}
          </Typography>
        )}
        <SyntaxHighlighter
          language={code.language || 'python'}
          style={vscDarkPlus}
          customStyle={{ borderRadius: 8, fontSize: '0.83rem', margin: 0 }}
          showLineNumbers
        >
          {code.code}
        </SyntaxHighlighter>
      </Box>
    );
  }

  // Structured text / search response
  if (message.response_type === 'text' && message.structuredContent) {
    const text = message.structuredContent as SearchResponse;
    return (
      <Box>
        <Box
          sx={{
            '& p': { mt: 0, mb: 1, lineHeight: 1.75 },
            '& code': {
              bgcolor: 'rgba(0,217,255,0.08)',
              px: 0.6,
              py: 0.2,
              borderRadius: 0.5,
              fontFamily: 'monospace',
              fontSize: '0.84em',
              color: '#9ef',
            },
            '& pre': {
              bgcolor: 'rgba(0,0,0,0.45)',
              p: 1.5,
              borderRadius: 1,
              overflow: 'auto',
              border: '1px solid rgba(255,255,255,0.06)',
            },
            '& pre code': { bgcolor: 'transparent', p: 0 },
            '& h1,& h2,& h3': { mt: 2, mb: 0.75, fontWeight: 600 },
            '& ul,& ol': { pl: 2.5, mt: 0, mb: 1 },
            '& li': { mb: 0.25 },
            '& a': { color: '#00D9FF', opacity: 0.85 },
            '& blockquote': {
              borderLeft: '3px solid rgba(0,217,255,0.4)',
              pl: 1.5,
              ml: 0,
              opacity: 0.8,
            },
          }}
        >
          <ReactMarkdown>{text.answer}</ReactMarkdown>
        </Box>
        {text.source_urls?.length > 0 && (
          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <Typography variant="caption" sx={{ opacity: 0.55, display: 'block', mb: 0.75, fontWeight: 600, letterSpacing: '0.06em' }}>
              SOURCES
            </Typography>
            {text.source_urls.map((url, i) => (
              <Typography
                key={i}
                variant="caption"
                component="a"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'primary.main',
                  opacity: 0.75,
                  mb: 0.4,
                  textDecoration: 'none',
                  '&:hover': { opacity: 1, textDecoration: 'underline' },
                }}
              >
                <OpenInNewIcon sx={{ fontSize: 11 }} />
                {url}
              </Typography>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  // Fallback: plain text (plain history messages or streaming partial text)
  return (
    <Box
      sx={{
        '& p': { mt: 0, mb: 1, lineHeight: 1.75 },
        '& code': {
          bgcolor: 'rgba(0,217,255,0.08)',
          px: 0.6,
          py: 0.2,
          borderRadius: 0.5,
          fontFamily: 'monospace',
          fontSize: '0.84em',
          color: '#9ef',
        },
        '& pre': { bgcolor: 'rgba(0,0,0,0.4)', p: 1.5, borderRadius: 1, overflow: 'auto' },
        '& pre code': { bgcolor: 'transparent', p: 0 },
        '& ul,& ol': { pl: 2.5, mt: 0, mb: 1 },
      }}
    >
      <ReactMarkdown>{message.content}</ReactMarkdown>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Outlet context shape
// ---------------------------------------------------------------------------

interface AppOutletContext {
  currentSessionId: string | null;
  sessions: Session[];
  onUpdateTitle: (sessionId: string, title: string) => void;
}
export type { AppOutletContext };

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const ChatInterface: React.FC = () => {
  const { currentSessionId: sessionId, sessions, onUpdateTitle } = useOutletContext<AppOutletContext>();
  const { messages, addMessage, updateLastMessage, isStreaming, setIsStreaming, updateSessionTitle } = useChatStore();

  const [input, setInput] = useState<string>('');
  // Use a ref for currentAgent to avoid stale closure captures in callbacks
  const currentAgentRef = useRef<AgentType | null>(null);
  const [currentAgentDisplay, setCurrentAgentDisplay] = useState<AgentType | null>(null);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [showThinking, setShowThinking] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  // Reset local stream state when session changes (also resets streaming — Bug 3)
  useEffect(() => {
    setThinkingSteps([]);
    setErrorMsg(null);
    currentAgentRef.current = null;
    setCurrentAgentDisplay(null);
    setIsStreaming(false);
  }, [sessionId, setIsStreaming]);

  // Derive the display title from the sessions list
  const sessionTitle = sessions?.find((s) => s.id === sessionId)?.title ?? null;

  const handleSend = async (): Promise<void> => {
    if (!input.trim() || isStreaming || !sessionId) return;

    const userText = input.trim();
    setInput('');
    setErrorMsg(null);
    setThinkingSteps([]);
    setShowThinking(false);

    // Optimistic user message
    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);

    // Placeholder assistant message (content empty so the streaming dots render)
    const assistantPlaceholder: Message = {
      id: Date.now() + 1,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };
    addMessage(assistantPlaceholder);
    setIsStreaming(true);

    await streamChat(sessionId, userText, {
      onLog: (content) => {
        setThinkingSteps((prev) => [...prev, content]);
        setShowThinking(true);
        const detected = detectAgentFromLog(content);
        if (detected) {
          currentAgentRef.current = detected;
          setCurrentAgentDisplay(detected);
        }
      },

      onAnswer: (responseType, content) => {
        let displayText = '';
        if (responseType === 'text') {
          displayText = (content as SearchResponse).answer;
        } else if (responseType === 'code') {
          const c = content as CodeResponse;
          displayText = `\`\`\`${c.language}\n${c.code}\n\`\`\`\n\n${c.explanation}`;
        }

        // Read agent from ref — no stale closure
        updateLastMessage({
          content: displayText,
          response_type: responseType,
          structuredContent: content,
          agent: currentAgentRef.current ?? undefined,
          timestamp: new Date().toISOString(),
        });

        // Update session title after first real answer
        if (messages.filter((m) => m.role === 'user').length <= 1 && onUpdateTitle && sessionId) {
          const newTitle = userText.slice(0, 60) + (userText.length > 60 ? '...' : '');
          onUpdateTitle(sessionId, newTitle);
          updateSessionTitle(sessionId, newTitle);
        }
      },

      onTraceUrl: (url) => {
        updateLastMessage({ trace_url: url });
      },

      onError: (error) => {
        setErrorMsg(error);
        updateLastMessage({ content: `Error: ${error}`, timestamp: new Date().toISOString() });
      },

      onDone: () => {
        setIsStreaming(false);
        currentAgentRef.current = null;
        setCurrentAgentDisplay(null);
        setShowThinking(false);
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 1.75,
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(10, 14, 39, 0.8)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          minHeight: 58,
        }}
      >
        <BotIcon sx={{ color: 'primary.main', fontSize: 22, opacity: 0.9 }} />
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, flex: 1, letterSpacing: '-0.01em', color: 'text.primary' }}
        >
          {sessionTitle ?? (sessionId ? 'New Chat' : 'Select or create a chat to begin')}
        </Typography>
        {isStreaming && (
          <Fade in>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {currentAgentDisplay && <AgentBadge agent={currentAgentDisplay} />}
              <StreamingDots />
            </Box>
          </Fade>
        )}
      </Box>

      {/* Error banner */}
      {errorMsg && (
        <Alert
          severity="error"
          onClose={() => setErrorMsg(null)}
          sx={{ borderRadius: 0, borderBottom: '1px solid rgba(255,100,100,0.2)' }}
        >
          {errorMsg}
        </Alert>
      )}

      {/* Messages area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 3,
          py: 2.5,
          background:
            'radial-gradient(ellipse at 15% 60%, rgba(0, 217, 255, 0.04) 0%, transparent 55%), radial-gradient(ellipse at 85% 20%, rgba(255, 107, 157, 0.04) 0%, transparent 55%)',
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              gap: 1.5,
            }}
          >
            {/* Glow rings */}
            <Box sx={{ position: 'relative', mb: 1 }}>
              <Box
                sx={{
                  position: 'absolute',
                  inset: -20,
                  borderRadius: '50%',
                  border: '1px solid rgba(0,217,255,0.12)',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  inset: -36,
                  borderRadius: '50%',
                  border: '1px solid rgba(0,217,255,0.06)',
                }}
              />
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: 'rgba(0,217,255,0.1)',
                  border: '1px solid rgba(0,217,255,0.2)',
                }}
              >
                <SparkleIcon sx={{ fontSize: 36, color: 'primary.main' }} />
              </Avatar>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              How can I help you?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320, lineHeight: 1.7 }}>
              Ask about scikit-learn docs, query your database, or search the web
            </Typography>
            {!sessionId && (
              <Chip
                label="👈  Click New Chat in the sidebar to begin"
                size="small"
                sx={{
                  mt: 1,
                  bgcolor: 'rgba(255,215,0,0.08)',
                  color: '#FFD700',
                  border: '1px solid rgba(255,215,0,0.2)',
                  fontWeight: 500,
                }}
              />
            )}
          </Box>
        ) : (
          messages.map((message) => (
            <MessageContainer key={message.id} isUser={message.role === 'user'}>
              {message.role === 'assistant' && (
                <Avatar
                  sx={{
                    bgcolor: 'rgba(0,217,255,0.12)',
                    border: '1px solid rgba(0,217,255,0.2)',
                    width: 34,
                    height: 34,
                    flexShrink: 0,
                    mt: 0.25,
                  }}
                >
                  <BotIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                </Avatar>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxWidth: '72%' }}>
                {message.agent && <AgentBadge agent={message.agent} />}
                <MessageBubble isUser={message.role === 'user'}>
                  <MessageContent message={message} />
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.75 }}>
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.45, fontSize: '0.68rem' }}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                    {message.role === 'assistant' && message.trace_url && (
                      <Chip
                        icon={<OpenInNewIcon sx={{ fontSize: '11px !important' }} />}
                        label="Trace"
                        size="small"
                        component="a"
                        href={message.trace_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        clickable
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          bgcolor: 'rgba(255,215,0,0.1)',
                          color: '#FFD700',
                          border: '1px solid rgba(255,215,0,0.25)',
                          '& .MuiChip-icon': { color: '#FFD700' },
                          textDecoration: 'none',
                        }}
                      />
                    )}
                  </Box>
                </MessageBubble>
              </Box>

              {message.role === 'user' && (
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255,107,157,0.15)',
                    border: '1px solid rgba(255,107,157,0.25)',
                    width: 34,
                    height: 34,
                    flexShrink: 0,
                    mt: 0.25,
                  }}
                >
                  <PersonIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
                </Avatar>
              )}
            </MessageContainer>
          ))
        )}

        {/* Thinking steps panel */}
        {isStreaming && thinkingSteps.length > 0 && (
          <Box sx={{ mb: 2, ml: 5.5 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mb: 0.5 }}
              onClick={() => setShowThinking((v) => !v)}
            >
              <CircularProgress size={12} thickness={5} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                Agent reasoning…
              </Typography>
              {showThinking ? (
                <ExpandLessIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              ) : (
                <ExpandMoreIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              )}
            </Box>
            <Collapse in={showThinking}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  bgcolor: 'rgba(0,0,0,0.25)',
                  borderColor: 'rgba(255,255,255,0.06)',
                  borderRadius: 2,
                  maxHeight: 160,
                  overflow: 'auto',
                }}
              >
                {thinkingSteps.map((step, i) => (
                  <Typography
                    key={i}
                    variant="caption"
                    sx={{ display: 'block', opacity: 0.65, fontFamily: 'monospace', mb: 0.25, fontSize: '0.72rem' }}
                  >
                    {step}
                  </Typography>
                ))}
              </Paper>
            </Collapse>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input area */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(10, 14, 39, 0.8)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={5}
            placeholder={
              sessionId
                ? 'Ask anything… (Shift + Enter for new line)'
                : 'Create a new chat to start messaging'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming || !sessionId}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255,255,255,0.04)',
                borderRadius: 2,
                transition: 'box-shadow 0.2s',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.09)' },
                '&:hover fieldset': { borderColor: 'rgba(0, 217, 255, 0.25)' },
                '&.Mui-focused fieldset': { borderColor: 'rgba(0, 217, 255, 0.55)' },
                '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(0,217,255,0.08)' },
              },
              '& .MuiInputBase-input': { fontSize: '0.93rem', lineHeight: 1.65 },
            }}
          />
          <IconButton
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || !sessionId}
            sx={{
              bgcolor: input.trim() && !isStreaming && sessionId ? 'primary.main' : 'rgba(255,255,255,0.07)',
              color: input.trim() && !isStreaming && sessionId ? '#000' : 'rgba(255,255,255,0.3)',
              width: 46,
              height: 46,
              borderRadius: 2,
              flexShrink: 0,
              transition: 'background 0.2s, box-shadow 0.2s',
              animation: input.trim() && !isStreaming && sessionId ? `${pulse} 2s ease-in-out infinite` : 'none',
              '&:hover': {
                bgcolor: input.trim() && !isStreaming ? 'primary.light' : undefined,
              },
            }}
          >
            <SendIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, opacity: 0.3, fontSize: '0.68rem' }}>
          AI responses may be inaccurate. Always verify important information.
        </Typography>
      </Box>
    </Box>
  );
};

export default ChatInterface;