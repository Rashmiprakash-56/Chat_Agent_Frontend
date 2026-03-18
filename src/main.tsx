import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import App from './App';
import LoginPage from './pages/Login';
import PageNotFound from './pages/PageNotFound';
import ChatInterface from './pages/ChatInterface';
import ChatHistory from './pages/ChatHistory';
import AccountPage from './pages/AccountPage';

import RequireAuth from './components/RequireAuth';
import AuthBootstrap from './components/AuthBootstrap';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <RequireAuth >
        <App />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <ChatInterface /> },
      { path: 'history', element: <ChatHistory /> },
      { path: 'account', element: <AccountPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '*', element: <PageNotFound /> },
]);
        
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CssBaseline />
    <AuthBootstrap>
      <RouterProvider router={router} />
    </AuthBootstrap>
  </StrictMode>
);
