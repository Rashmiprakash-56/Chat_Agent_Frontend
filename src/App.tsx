import React, { useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './pages/Sidebar';
import { useChatStore } from './store/useChatStore';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00D9FF',
      light: '#5AECFF',
      dark: '#00A8CC',
    },
    secondary: {
      main: '#FF6B9D',
      light: '#FF9DC4',
      dark: '#CC5680',
    },
    background: {
      default: '#0A0E27',
      paper: '#131832',
    },
    text: {
      primary: '#E8EAED',
      secondary: '#8A8FA8',
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.025em' },
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600 },
    body1: { fontSize: '0.93rem', lineHeight: 1.65 },
    body2: { fontSize: '0.87rem', lineHeight: 1.65 },
    caption: { fontSize: '0.75rem' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8, letterSpacing: '0.01em' },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, letterSpacing: '0.02em' },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-input::placeholder': {
            opacity: 0.45,
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
  },
});


const App: React.FC = () => {
  const navigate = useNavigate();
  const {
    sessions,
    currentSessionId,
    fetchSessions,
    createSession,
    deleteSession,
    selectSession,
    updateSessionTitle,
  } = useChatStore();

  // Load sessions from backend on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleNewChat = async (): Promise<void> => {
    const emptySession = sessions.find((s) => s.title === 'New Chat' && !s.preview);
    if (emptySession) {
      if (currentSessionId !== emptySession.id) {
        await selectSession(emptySession.id);
        navigate('/');
      }
      return;
    }

    const session = await createSession('New Chat');
    selectSession(session.id);
    navigate('/');
  };

  const handleSelectSession = async (sessionId: string): Promise<void> => {
    await selectSession(sessionId);
    navigate('/');
  };

  const handleDeleteSession = async (sessionId: string): Promise<void> => {
    await deleteSession(sessionId);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
        />

        <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Outlet
            context={{
              sessions,
              currentSessionId,
              onUpdateTitle: updateSessionTitle,
              onSelectSession: handleSelectSession,
              onDeleteSession: handleDeleteSession,
            }}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;