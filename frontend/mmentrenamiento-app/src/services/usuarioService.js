import { api } from './api';

export const usuarioService = {
  getMiPerfil: async () => {
    const response = await api.get('/usuarios/mi-perfil');
    return response.data;
  },
  actualizarMiPerfil: async (datos) => {
    const response = await api.put('/usuarios/mi-perfil', datos);
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