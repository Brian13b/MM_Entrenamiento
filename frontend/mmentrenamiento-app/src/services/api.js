import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const RUTAS_AUTH = ['/auth/login', '/auth/refresh', '/auth/logout'];
const esRutaAuth = (url = '') => RUTAS_AUTH.some((ruta) => url.includes(ruta));

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refrescando = null;

const refrescarToken = () => {
  if (!refrescando) {
    refrescando = axios
      .post(`${API_URL}/auth/refresh`, null, { withCredentials: true })
      .then(({ data }) => {
        useAuthStore.getState().setToken(data.token);
        return data.token;
      })
      .finally(() => {
        refrescando = null;
      });
  }
  return refrescando;
};

const expulsarUsuario = () => {
  useAuthStore.getState().logout();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

// Interceptor de Peticiones (Request)
api.interceptors.request.use(
  async (config) => {
    if (refrescando && !esRutaAuth(config.url)) {
      try {
        await refrescando;
      } catch {
        // Si el refresh falló, la petición sigue y el manejo de error de abajo decide qué hacer.
      }
    }

    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Respuestas (Response)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status !== 401 || !original || original._reintento || esRutaAuth(original.url)) {
      return Promise.reject(error);
    }

    if (!useAuthStore.getState().isAuthenticated) {
      return Promise.reject(error);
    }

    original._reintento = true;

    try {
      const nuevoToken = await refrescarToken();
      original.headers.Authorization = `Bearer ${nuevoToken}`;
      return api(original);
    } catch (errorRefresh) {
      if (errorRefresh.response?.status === 401) {
        expulsarUsuario();
      }
      return Promise.reject(error);
    }
  }
);
