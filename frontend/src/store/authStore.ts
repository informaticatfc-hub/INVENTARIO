import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Usuario } from '../types/index.ts';

interface AuthState {
  usuario: Usuario | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (usuario: Usuario, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario:      null,
      accessToken:  null,
      refreshToken: null,
      setAuth: (usuario, accessToken, refreshToken) =>
        set({ usuario, accessToken, refreshToken }),
      clearAuth: () =>
        set({ usuario: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: 'inv-auth',
      partialize: (s) => ({ usuario: s.usuario, accessToken: s.accessToken, refreshToken: s.refreshToken }),
    }
  )
);
