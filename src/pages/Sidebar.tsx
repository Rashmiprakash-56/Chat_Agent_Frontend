import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Box,
  Button,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  ChatBubbleOutline as ChatIcon,
  History as HistoryIcon,
  AccountCircle as AccountIcon,
  Delete as DeleteIcon,
  AutoAwesome as SparkleIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { type Session } from '../types/types';

const DRAWER_WIDTH = 272;

interface MenuItem {
  text: string;
  icon: React.ReactElement;
  path: string;
}

interface SidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { text: 'Chat', icon: <ChatIcon />, path: '/' },
    { text: 'History', icon: <HistoryIcon />, path: '/history' },
    { text: 'Account', icon: <AccountIcon />, path: '/account' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #0A0E27 0%, #0D1128 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Brand / Logo */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: 'rgba(0,217,255,0.12)',
            border: '1px solid rgba(0,217,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <SparkleIcon sx={{ fontSize: 20, color: 'primary.main' }} />
        </Box>
        <Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.01em',
              background: 'linear-gradient(135deg, #00D9FF 0%, #FF6B9D 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.2,
            }}
          >
            AI Agent
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.4, fontSize: '0.68rem' }}>
            Multi-agent chat
          </Typography>
        </Box>
      </Box>

      {/* New Chat Button */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onNewChat}
          sx={{
            py: 1.1,
            fontSize: '0.875rem',
            background: 'linear-gradient(135deg, #00D9FF 0%, #00A8CC 100%)',
            boxShadow: '0 4px 16px rgba(0, 217, 255, 0.2)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5AECFF 0%, #00D9FF 100%)',
              boxShadow: '0 6px 22px rgba(0, 217, 255, 0.3)',
            },
          }}
        >
          New Chat
        </Button>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)', mx: 2 }} />

      {/* Navigation */}
      <List sx={{ px: 1.5, pt: 1.5, pb: 0.5 }}>
        {menuItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                selected={active}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  py: 0.85,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': active ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    height: '60%',
                    width: 3,
                    borderRadius: '0 3px 3px 0',
                    bgcolor: 'primary.main',
                  } : {},
                  '&.Mui-selected': {
                    bgcolor: 'rgba(0, 217, 255, 0.08)',
                    '&:hover': { bgcolor: 'rgba(0, 217, 255, 0.12)' },
                  },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                }}
              >
                <ListItemIcon sx={{ color: active ? 'primary.main' : 'text.secondary', minWidth: 38 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: active ? 600 : 400,
                    color: active ? 'text.primary' : 'text.secondary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)', mx: 2, mt: 0.5 }} />

      {/* Section label */}
      <Box sx={{ px: 2.5, pt: 1.75, pb: 0.75 }}>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.08em' }}
        >
          RECENT CHATS
        </Typography>
      </Box>

      {/* Session list */}
      <List sx={{ px: 1.5, flex: 1, overflow: 'auto', pb: 2 }}>
        {sessions.slice(0, 20).map((session) => {
          const active = currentSessionId === session.id;
          return (
            <ListItem
              key={session.id}
              disablePadding
              sx={{ mb: 0.25 }}
              secondaryAction={
                <Tooltip title="Delete" placement="right">
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    sx={{
                      opacity: 0,
                      color: 'text.secondary',
                      width: 28,
                      height: 28,
                      transition: 'opacity 0.15s',
                      '.MuiListItem-root:hover &': { opacity: 1 },
                      '&:hover': { color: 'error.light', bgcolor: 'rgba(255,100,100,0.08)' },
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              }
            >
              <ListItemButton
                selected={active}
                onClick={() => onSelectSession(session.id)}
                sx={{
                  borderRadius: 2,
                  py: 0.9,
                  pr: 4,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': active ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    height: '60%',
                    width: 3,
                    borderRadius: '0 3px 3px 0',
                    bgcolor: 'secondary.main',
                  } : {},
                  '&.Mui-selected': {
                    bgcolor: 'rgba(255, 107, 157, 0.08)',
                    '&:hover': { bgcolor: 'rgba(255, 107, 157, 0.12)' },
                  },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <ChatIcon
                    fontSize="small"
                    sx={{ fontSize: 15, color: active ? 'secondary.main' : 'text.secondary', opacity: active ? 1 : 0.6 }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={session.title || 'New Chat'}
                  secondary={session.preview || new Date(session.timestamp).toLocaleDateString()}
                  primaryTypographyProps={{
                    fontSize: '0.825rem',
                    fontWeight: active ? 600 : 400,
                    noWrap: true,
                    color: active ? 'text.primary' : 'text.secondary',
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.72rem',
                    noWrap: true,
                    sx: { opacity: 0.5 },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}

        {sessions.length === 0 && (
          <Box sx={{ px: 1.5, py: 2, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ opacity: 0.4 }}>
              No chats yet
            </Typography>
          </Box>
        )}
      </List>
    </Drawer>
  );
};

export default Sidebar;