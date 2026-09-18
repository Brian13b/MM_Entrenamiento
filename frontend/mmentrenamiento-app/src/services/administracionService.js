import { api } from './api';

export const administracionService = {
  crearMembresia: async (datos) => {
    const response = await api.post('/administracion/membresias', datos);
    return response.data;
  },
  getMembresiasActivas: async () => {
    const response = await api.get('/administracion/membresias');
    return response.data;
  },
  registrarPagoManual: async (datos) => {
    const response = await api.post('/administracion/pagos', datos);
    return response.data;
  },
  cambiarEstadoBloqueo: async (usuarioId, suspender) => {
    const response = await api.put(`/administracion/usuarios/${usuarioId}/bloqueo`, null, { 
      params: { suspender } 
    });
    return response.data;
  },
  getAnuncioGlobal: async () => {
    const response = await api.get('/administracion/anuncio');
    return response.data;
  },
  actualizarAnuncioGlobal: async (datos) => {
    const response = await api.put('/administracion/anuncio', datos);
    return response.data;
  }
};