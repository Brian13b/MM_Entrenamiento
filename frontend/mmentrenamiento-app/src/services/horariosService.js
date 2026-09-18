import { api } from './api';

export const horariosService = {
  crearHorario: async (datos) => {
    const response = await api.post('/horarios/crear', datos);
    return response.data;
  },
  getHorarios: async () => {
    const response = await api.get('/horarios');
    return response.data;
  },
  crearHorariosMasivos: async (datos) => {
    const response = await api.post('/horarios/masivo', datos);
    return response.data;
  },
  configurarHorarioReducido: async (datos) => {
    const response = await api.post('/horarios/reducido', datos);
    return response.data;
  }
};