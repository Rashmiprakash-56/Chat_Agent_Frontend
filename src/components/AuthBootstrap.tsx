import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';

const AuthBootstrap = ({ children }: { children: React.ReactNode }) => {
  const verifyAuth = useAuthStore((state: any) => state.verifyAuth);

  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  return <>{children}</>;
};

export default AuthBootstrap;
