import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { administracionService } from '../services/administracionService';
import { construirLinkWhatsApp } from '../utils/whatsapp';

let configuracionEnCache = null;

export const useWhatsAppGimnasio = () => {
  const [telefono, setTelefono] = useState(configuracionEnCache?.telefono ?? null);

  useEffect(() => {
    if (configuracionEnCache) return;

    let cancelado = false;
    administracionService.getConfiguracion()
      .then((config) => {
        configuracionEnCache = config;
        if (!cancelado) setTelefono(config.telefono ?? '');
      })
      .catch((error) => console.error('No se pudo cargar la configuración del gimnasio', error));

    return () => { cancelado = true; };
  }, []);

  const abrir = useCallback((mensaje) => {
    if (telefono === null) {
      toast('Un segundo, estamos cargando el contacto del gimnasio. Probá de nuevo.');
      return;
    }

    const link = construirLinkWhatsApp(telefono, mensaje);
    if (!link) {
      toast.error('El gimnasio todavía no cargó su número de WhatsApp.');
      return;
    }

    window.open(link, '_blank', 'noopener,noreferrer');
  }, [telefono]);

  return { abrir };
};
