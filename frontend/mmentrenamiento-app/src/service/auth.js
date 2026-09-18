import { api } from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data; 
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