import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Paper,
  Container,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/authService';
import { useAuthStore } from '../store/useAuthStore';

type ViewType = 'login' | 'register' | 'forgot';

const LoginPage: React.FC = () => {
  const [view, setView] = useState<ViewType>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const login = useAuthStore((state : any) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (view === 'login') {
        const data = await authService.login(email, password);
        login(data.access_token);
        navigate('/');
      } else if (view === 'register') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        await authService.register(email, password);
        setView('login');
        setPassword('');
        setConfirmPassword('');
        setError('Registration successful! Please login.');
      } else if (view === 'forgot') {
        // Add your forgot password logic here
        setError('Password reset link sent to your email');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const switchView = (newView: ViewType) => {
    setView(newView);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f4f6f8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 2,
            border: '1px solid #e2e8f0',
            boxShadow: '0px 10px 25px rgba(0,0,0,0.06)',
            backgroundColor: '#ffffff',
          }}
        >
          <Typography
            variant="h5"
            align="center"
            sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}
          >
            {view === 'login' && 'Login'}
            {view === 'register' && 'Register'}
            {view === 'forgot' && 'Reset Password'}
          </Typography>

          <Typography
            variant="body2"
            align="center"
            sx={{ color: '#64748b', mb: 3 }}
          >
            Welcome back 👋
          </Typography>

          {error && (
            <Alert severity={error.includes('successful') ? 'success' : 'error'} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              sx={{ backgroundColor: '#f8fafc' }}
            />

            {view !== 'forgot' && (
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                sx={{ backgroundColor: '#f8fafc' }}
              />
            )}

            {view === 'register' && (
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                required
                sx={{ backgroundColor: '#f8fafc' }}
              />
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.2,
                backgroundColor: '#334155',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: '#1e293b',
                },
              }}
            >
              {loading ? 'Loading...' : (
                <>
                  {view === 'login' && 'Login'}
                  {view === 'register' && 'Register'}
                  {view === 'forgot' && 'Send Reset Link'}
                </>
              )}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              {view === 'login' && (
                <>
                  <Link
                    component="button"
                    type="button"
                    onClick={() => switchView('forgot')}
                    sx={{ display: 'block', mb: 1, color: '#475569' }}
                  >
                    Forgot password?
                  </Link>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Don&apos;t have an account?{' '}
                    <Link
                      component="button"
                      type="button"
                      onClick={() => switchView('register')}
                    >
                      Register
                    </Link>
                  </Typography>
                </>
              )}

              {view !== 'login' && (
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Back to{' '}
                  <Link
                    component="button"
                    type="button"
                    onClick={() => switchView('login')}
                  >
                    Login
                  </Link>
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;