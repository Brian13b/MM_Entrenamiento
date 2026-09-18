import { api } from './api';

export const asistenciaService = {
  getDetalleClase: async (turnoId) => {
    const response = await api.get(`/asistencia/clase/${turnoId}`);
    return response.data;
  },
  guardarAsistencia: async (datosAsistencia) => {
    const response = await api.post('/asistencia/clase/guardar', datosAsistencia);
    return response.data;
  }
};