import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({ baseURL: BASE, timeout: 15000 });

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('inv-auth');
  if (raw) {
    const token = JSON.parse(raw)?.state?.accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const raw = localStorage.getItem('inv-auth');
        const refreshToken = raw ? JSON.parse(raw)?.state?.refreshToken : null;
        const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken });

        const stored = JSON.parse(localStorage.getItem('inv-auth') || '{}');
        stored.state.accessToken  = data.accessToken;
        stored.state.refreshToken = data.refreshToken;
        localStorage.setItem('inv-auth', JSON.stringify(stored));

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('inv-auth');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
