import { api } from './api';

export const reservasService = {
  reservarTurno: async (datosReserva) => {
    const response = await api.post('/reservas/reservar', datosReserva);
    return response.data;
  },
  asignarTurnoFijo: async (datos) => {
    const response = await api.post('/reservas/fijo/asignar', datos);
    return response.data;
  },
  cancelarClase: async (datosCancelacion) => {
    const response = await api.post('/reservas/cancelar-clase', datosCancelacion);
    return response.data;
  },
  darDeBajaTurnoFijo: async (datosBaja) => {
    const response = await api.post('/reservas/baja-turno-fijo', datosBaja);
    return response.data;
  },
  getGrillaPorFecha: async (fecha) => {
    const response = await api.get(`/reservas/grilla/${fecha}`);
    return response.data;
  },
  getMisTurnos: async () => {
    const response = await api.get('/reservas/mis-turnos');
    return response.data;
  }
};