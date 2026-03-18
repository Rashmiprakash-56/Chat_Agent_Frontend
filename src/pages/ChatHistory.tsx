import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Card,
  CardContent,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  ChatBubbleOutline as ChatIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { type Session } from '../types/types';
import { useChatStore } from '../store/useChatStore';

interface SessionGroups {
  today: Session[];
  yesterday: Session[];
  lastWeek: Session[];
  older: Session[];
}

const ChatHistory: React.FC = () => {
  const navigate = useNavigate();
  const { sessions, selectSession, deleteSession } = useChatStore();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, session: Session): void => {
    setAnchorEl(event.currentTarget);
    setSelectedSession(session);
  };

  const handleMenuClose = (): void => {
    setAnchorEl(null);
    setSelectedSession(null);
  };

  const handleDelete = async (): Promise<void> => {
    if (selectedSession) {
      await deleteSession(selectedSession.id);
    }
    handleMenuClose();
  };

  const handleSelectSession = async (sessionId: string) => {
    await selectSession(sessionId);
    navigate('/');
  };

  const filteredSessions = sessions.filter(
    (session) =>
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupSessionsByDate = (sessions: Session[]): SessionGroups => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups: SessionGroups = {
      today: [],
      yesterday: [],
      lastWeek: [],
      older: [],
    };

    sessions.forEach((session) => {
      const sessionDate = new Date(session.timestamp);
      sessionDate.setHours(0, 0, 0, 0);

      if (sessionDate.getTime() === today.getTime()) {
        groups.today.push(session);
      } else if (sessionDate.getTime() === yesterday.getTime()) {
        groups.yesterday.push(session);
      } else if (sessionDate > lastWeek) {
        groups.lastWeek.push(session);
      } else {
        groups.older.push(session);
      }
    });

    return groups;
  };

  const groupedSessions = groupSessionsByDate(filteredSessions);

  const SessionCard: React.FC<{ session: Session }> = ({ session }) => (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0, 217, 255, 0.15)',
          borderColor: 'rgba(0, 217, 255, 0.3)',
        },
      }}
      onClick={() => handleSelectSession(session.id)}
    >
      <CardContent sx={{ flex: 1 }}>
        <Box
          sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}
        >
          <ChatIcon sx={{ color: 'primary.main', mr: 1 }} />
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuOpen(e, session);
            }}
          >
            <MoreIcon fontSize="small" />
          </IconButton>
        </Box>

        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, fontSize: '1.1rem' }}>
          {session.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {session.preview || 'No preview available'}
        </Typography>

        <Chip
          icon={<ScheduleIcon sx={{ fontSize: 14 }} />}
          label={new Date(session.timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
          size="small"
          sx={{
            bgcolor: 'rgba(255, 107, 157, 0.1)',
            color: 'secondary.main',
            fontWeight: 600,
          }}
        />
      </CardContent>
    </Card>
  );

  const SessionGroup: React.FC<{ title: string; sessions: Session[] }> = ({ title, sessions }) => {
    if (sessions.length === 0) return null;

    return (
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            fontWeight: 700,
            color: 'primary.main',
            textTransform: 'uppercase',
            fontSize: '0.875rem',
            letterSpacing: '0.1em',
          }}
        >
          {title}
        </Typography>
        <Grid container spacing={2}>
          {sessions.map((session) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={session.id}>
              <SessionCard session={session} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(90deg, #131832 0%, #1A1F3A 100%)',
        }}
      >
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
          Chat History
        </Typography>
        <TextField
          fullWidth
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{
            maxWidth: 500,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.paper',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(0, 217, 255, 0.3)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
              },
            },
          }}
        />
      </Paper>

      {/* Sessions Grid */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 3,
          background:
            'radial-gradient(circle at 20% 50%, rgba(0, 217, 255, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 107, 157, 0.03) 0%, transparent 50%)',
        }}
      >
        {filteredSessions.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
            }}
          >
            <ChatIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.3 }} />
            <Typography variant="h6" color="text.secondary">
              {searchQuery ? 'No conversations found' : 'No chat history yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {searchQuery ? 'Try a different search term' : 'Start a new chat to begin'}
            </Typography>
          </Box>
        ) : (
          <>
            <SessionGroup title="Today" sessions={groupedSessions.today} />
            <SessionGroup title="Yesterday" sessions={groupedSessions.yesterday} />
            <SessionGroup title="Last 7 Days" sessions={groupedSessions.lastWeek} />
            <SessionGroup title="Older" sessions={groupedSessions.older} />
          </>
        )}
      </Box>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ChatHistory;