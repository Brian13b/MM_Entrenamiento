import { api } from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data; 
  },

  // Revoca el refresh token en el servidor y borra la cookie. Nunca debe bloquear el cierre local.
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Sin conexión o servidor caído: igual se cierra la sesión local.
    }
  },

  registrarAlumno: async (datos) => {
    const response = await api.post('/auth/register', datos);
    return response.data;
  },

  obtenerMiPerfil: async () => {
    const response = await api.get('/usuarios/mi-perfil');
    return response.data;
  },

  cambiarPassword: async (passwordActual, nuevaPassword) => {
    const response = await api.post('/auth/cambiar-password', { passwordActual, nuevaPassword });
    return response.data;
  },

  solicitarRecuperacion: async (email) => {
    const response = await api.post('/auth/recuperar/solicitar', { email });
    return response.data;
  },

  resetearPassword: async (email, token, nuevaPassword) => {
    const response = await api.post('/auth/recuperar/resetear', { email, token, nuevaPassword });
    return response.data;
  }
};