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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const expulsarUsuario = () => {
  useAuthStore.getState().logout();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && !esRutaAuth(config.url)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status !== 401 || !originalRequest || originalRequest._reintento || esRutaAuth(originalRequest.url)) {
      return Promise.reject(error);
    }

    if (!useAuthStore.getState().isAuthenticated) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise(function(resolve, reject) {
        failedQueue.push({ resolve, reject });
      })
      .then(token => {
        originalRequest.headers.Authorization = 'Bearer ' + token;
        return api(originalRequest);
      })
      .catch(err => {
        return Promise.reject(err);
      });
    }

    originalRequest._reintento = true;
    isRefreshing = true;

    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, null, { withCredentials: true });
      const nuevoToken = response.data.token;
      
      useAuthStore.getState().setToken(nuevoToken);
      
      processQueue(null, nuevoToken);
      
      originalRequest.headers.Authorization = 'Bearer ' + nuevoToken;
      return api(originalRequest);
    } catch (errRefresh) {
      processQueue(errRefresh, null);
      if (errRefresh.response?.status === 401) {
        expulsarUsuario();
      }
      return Promise.reject(errRefresh);
    } finally {
      isRefreshing = false;
    }
  }
);