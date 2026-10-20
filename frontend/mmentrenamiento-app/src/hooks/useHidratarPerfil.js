import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { usuarioService } from '../services/usuarioService';

// Tras el login el store solo conoce id, nombre, email y rol. Este hook completa la foto de perfil
// (una única vez) para que los avatares de los layouts se vean desde el primer momento.
export const useHidratarPerfil = () => {
  const usuarioId = useAuthStore((state) => state.usuario?.id);
  const hidratado = useAuthStore((state) => state.usuario?.foto !== undefined);

  useEffect(() => {
    if (!usuarioId || hidratado) return;

    let cancelado = false;
    usuarioService.getMiPerfil()
      .then((perfil) => {
        if (cancelado) return;
        const { usuario, setUsuario } = useAuthStore.getState();
        setUsuario({ ...usuario, nombreCompleto: perfil.nombreCompleto, email: perfil.email, foto: perfil.fotoPerfilUrl ?? null });
      })
      .catch((error) => console.error('No se pudo cargar el perfil', error));

    return () => { cancelado = true; };
  }, [usuarioId, hidratado]);
};
