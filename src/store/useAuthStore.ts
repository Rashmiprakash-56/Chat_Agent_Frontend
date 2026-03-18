import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';

type AuthStore = {
  isAuthenticated: boolean;
  isAuthChecked: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  verifyAuth: () => Promise<void>;
};


export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get : any) => ({
      //  ## change this auth in start and the verify auth
      isAuthenticated: false,  
      isAuthChecked: false,
      token: null,

      login: (token) =>
        set({
          isAuthenticated: true,
          isAuthChecked: true,
          token,
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          isAuthChecked: true,
          token: null,
        }),

      verifyAuth: async () => {
            const token = get().token;

            if (!token) {
              set({ isAuthenticated: false, isAuthChecked: true });
              return;
            }

            try {
              await api.get('/users/me');
              set({ isAuthenticated: true, isAuthChecked: true });
            } catch {
              set({ isAuthenticated: false, isAuthChecked: true, token: null });
            }
          },
    }),
    {
      name: 'auth-storage',
    }
  )
);
