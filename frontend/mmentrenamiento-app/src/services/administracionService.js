import { api } from './api';

export const administracionService = {
  getUsuarioById: async (id) => {
    const response = await api.get(`/administracion/usuarios/${id}`);
    return response.data;
  },
  getUsuarios: async () => {
    const response = await api.get('/administracion/usuarios');
    return response.data;
  },
  getConfiguracion: async () => {
    const response = await api.get('/administracion/configuracion');
    return response.data;
  },
  actualizarConfiguracion: async (datos) => {
    const response = await api.put('/administracion/configuracion', datos);
    return response.data;
  },
  getMetricas: async () => {
    const response = await api.get('/administracion/metricas');
    return response.data;
  },
  getPagosUsuario: async (usuarioId) => {
    const response = await api.get(`/administracion/pagos/${usuarioId}`);
    return response.data;
  },
  actualizarPerfilUsuario: async (usuarioId, datos) => {
    const response = await api.put(`/administracion/usuarios/${usuarioId}/perfil`, datos);
    return response.data;
  },
  crearMembresia: async (datos) => {
    const response = await api.post('/administracion/membresias', datos);
    return response.data;
  },
  actualizarMembresia: async (id, datos) => {
    const response = await api.put(`/administracion/membresias/${id}`, datos);
    return response.data;
  },
  eliminarMembresia: async (id) => {
    const response = await api.delete(`/administracion/membresias/${id}`);
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
  },

};