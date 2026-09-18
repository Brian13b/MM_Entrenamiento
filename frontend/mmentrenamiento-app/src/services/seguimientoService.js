import { api } from './api';

export const seguimientoService = {
  getMiFicha: async () => {
    const response = await api.get('/seguimiento/mi-ficha');
    return response.data;
  },
  getMiPlan: async () => {
    const response = await api.get('/seguimiento/mi-plan');
    return response.data;
  },
  getFichaAlumno: async (usuarioId) => {
    const response = await api.get(`/seguimiento/ficha/${usuarioId}`);
    return response.data;
  },
  actualizarFichaAlumno: async (usuarioId, datos) => {
    const response = await api.put(`/seguimiento/ficha/${usuarioId}`, datos);
    return response.data;
  },
  vincularPlan: async (usuarioId, datos) => {
    const response = await api.put(`/seguimiento/vincular-plan/${usuarioId}`, datos);
    return response.data;
  },
  getReporteAsistencia: async (usuarioId, mes, anio) => {
    const response = await api.get(`/seguimiento/asistencia/${usuarioId}`, {
      params: { mes, anio }
    });
    return response.data;
  }
};