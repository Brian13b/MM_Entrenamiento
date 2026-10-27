import { api } from './api';

export const asistenciaService = {
  getDetalleClase: async (horarioId, fecha) => {
    const queryString = fecha ? `?fecha=${fecha}` : '';
    const response = await api.get(`/asistencia/clase/${horarioId}${queryString}`);
    return response.data;
  },
  guardarAsistencia: async (datosAsistencia) => {
    const response = await api.post('/asistencia/clase/guardar', datosAsistencia);
    return response.data;
  }
};