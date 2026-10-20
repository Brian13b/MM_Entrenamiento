import { api } from './api';

export const usuarioService = {
  getMiPerfil: async () => {
    const response = await api.get('/usuarios/mi-perfil');
    return response.data;
  },
  getMiResumen: async () => {
    const response = await api.get('/usuarios/mi-resumen');
    return response.data;
  },
  // Con `foto` se envía multipart/form-data (todo en una sola llamada); sin foto, JSON.
  actualizarMiPerfil: async ({ nombreCompleto, email, telefono }, foto = null) => {
    if (foto) {
      const formData = new FormData();
      formData.append('nombreCompleto', nombreCompleto);
      formData.append('email', email);
      formData.append('telefono', telefono || '');
      formData.append('foto', foto);

      const response = await api.put('/usuarios/mi-perfil', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    }

    const response = await api.put('/usuarios/mi-perfil', { nombreCompleto, email, telefono: telefono || null });
    return response.data;
  },
  subirFotoPerfil: async (archivoFoto) => {
    const formData = new FormData();
    formData.append('foto', archivoFoto);
    
    const response = await api.post('/usuarios/mi-perfil/foto', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};