import { api } from './api';

export const membresiasService = {
  asignarMembresia: async (datos) => {
    const response = await api.post('/membresias/asignar', datos);
    return response.data;
  },
  getMisCreditos: async () => {
    const response = await api.get('/membresias/mis-creditos');
    return response.data;
  },
  renovarMesActual: async () => {
    const response = await api.post('/membresias/renovar-mes');
    return response.data;
  },
  otorgarCreditosExtra: async (datosCredito) => {
    const response = await api.post('/membresias/otorgar-creditos', datosCredito);
    return response.data;
  }
};