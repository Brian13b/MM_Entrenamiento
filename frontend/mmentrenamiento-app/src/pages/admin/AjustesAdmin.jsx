import { useState, useEffect } from 'react';
import { MegaphoneIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { administracionService } from '../../services/administracionService';

export const AjustesAdmin = () => {
  const [mensaje, setMensaje] = useState('');
  const [ultimaModificacion, setUltimaModificacion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar el anuncio actual al montar la pantalla
  useEffect(() => {
    const fetchAnuncio = async () => {
      try {
        setIsLoading(true);
        const data = await administracionService.getAnuncioGlobal();
        if (data) {
          setMensaje(data.mensaje || '');
          setUltimaModificacion(data.ultimaModificacion);
        }
      } catch (error) {
        toast.error('No se pudo cargar la configuración actual.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnuncio();
  }, []);

  // Guardar el nuevo anuncio
  const handleGuardarAnuncio = async () => {
    if (mensaje.trim() === '') {
      toast.error('El anuncio no puede estar vacío.');
      return;
    }

    try {
      setIsSaving(true);
      // Enviamos exactamente la estructura de ActualizarAnuncioDto
      await administracionService.actualizarAnuncioGlobal({ mensaje: mensaje.trim() });
      toast.success('¡Anuncio actualizado con éxito!');
      setUltimaModificacion(new Date().toISOString());
    } catch (error) {
      toast.error('Ocurrió un error al guardar el anuncio.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Formatear la fecha para que sea legible
  const formatearFecha = (fechaString) => {
    if (!fechaString) return 'Nunca';
    const opciones = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(fechaString).toLocaleDateString('es-AR', opciones);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-mm-purple animate-pulse">
        <span className="font-bold">Cargando ajustes...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-mm-dark">Ajustes Generales</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">Configurá los avisos y parámetros de la plataforma.</p>
      </header>

      <section className="bg-mm-surface p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-4">
        
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <MegaphoneIcon className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-mm-dark">Anuncio Global</h2>
            <p className="text-xs text-gray-500">Este mensaje aparecerá en el inicio de todos los alumnos.</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <label htmlFor="mensaje" className="text-sm font-bold text-mm-dark ml-1">
            Mensaje a mostrar
          </label>
          <textarea
            id="mensaje"
            rows="4"
            className="w-full bg-mm-light border border-gray-200 rounded-2xl p-4 text-sm text-mm-dark focus:ring-2 focus:ring-mm-purple focus:border-transparent outline-none resize-none transition-all"
            placeholder="Ej: El lunes abrimos de 9 a 15hs por el feriado..."
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
          ></textarea>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
          <span className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
            Última actualización: {formatearFecha(ultimaModificacion)}
          </span>
          
          <button
            onClick={handleGuardarAnuncio}
            disabled={isSaving}
            className="w-full sm:w-auto bg-mm-purple text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Anuncio'
            )}
          </button>
        </div>
        
      </section>
    </div>
  );
};