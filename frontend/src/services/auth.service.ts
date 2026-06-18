import api from './api.ts';
import type { Usuario } from '../types/index.ts';

export interface LoginResponse {
  ok: boolean;
  accessToken: string;
  refreshToken: string;
  usuario: Usuario;
}

export const authService = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),

  me: () =>
    api.get<{ ok: boolean; usuario: Usuario }>('/auth/me').then((r) => r.data),
};
