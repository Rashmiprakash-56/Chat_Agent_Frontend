import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import type { JSX } from 'react';

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isAuthChecked } = useAuthStore();

  if (!isAuthChecked) return null; 

  return isAuthenticated
    ? children
    : <Navigate to="/login" replace />;
};

export default RequireAuth;
