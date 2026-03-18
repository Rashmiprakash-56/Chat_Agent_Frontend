import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
} from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const AccountPage: React.FC = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(90deg, #131832 0%, #1A1F3A 100%)',
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Account
        </Typography>
      </Paper>

      <Box sx={{ p: 3, maxWidth: 520, mx: 'auto' }}>
        <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            py: 1.5,
            fontWeight: 600,
            borderColor: 'rgba(244,67,54,0.5)',
            '&:hover': {
              borderColor: '#f44336',
              bgcolor: 'rgba(244,67,54,0.08)',
            },
          }}
        >
          Log Out
        </Button>
      </Box>
    </Box>
  );
};

export default AccountPage;