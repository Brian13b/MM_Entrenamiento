import { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { seguimientoService } from '../../../services/seguimientoService';

export const PanelRetencion = () => {
  const [alertas, setAlertas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cargarAlertas = async () => {
      try {
        const data = await seguimientoService.obtenerAlertasRetencion();
        setAlertas(data);
      } catch (error) {
        console.error("Error al cargar alertas de retención:", error);
        toast.error("No se pudieron cargar las alertas de retención.");
      } finally {
        setIsLoading(false);
      }
    };

    cargarAlertas();
  }, []);

  const formatearFecha = (fechaString) => {
    if (!fechaString) return 'Desconocida';
    const [year, month, day] = fechaString.split('-');
    return `${day}/${month}/${year}`;
  };

  const abrirWhatsApp = (telefono, nombre) => {
    if (!telefono) {
      toast.error("El alumno no tiene un teléfono registrado.");
      return;
    }
    
    const numeroLimpio = telefono.replace(/\D/g, '');
    const mensaje = encodeURIComponent(`Hola ${nombre}, ¿cómo estás? Notamos desde MM Entrenamiento que no estuviste viniendo a tus últimas clases. ¿Pasó algo en lo que te podamos ayudar?`);
    
    window.open(`https://wa.me/${numeroLimpio}?text=${mensaje}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="bg-mm-surface rounded-4xl p-6 border border-gray-100 shadow-sm animate-pulse h-full min-h-62.5 flex items-center justify-center">
        <span className="text-mm-purple font-bold text-sm">Analizando historial...</span>
      </div>
    );
  }

  if (alertas.length === 0) {
    return (
      <div className="bg-mm-surface rounded-4xl p-6 border border-gray-100 shadow-sm h-full min-h-62.5 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
          <ExclamationTriangleIcon className="w-6 h-6 text-green-500" />
        </div>
        <div>
          <h3 className="text-mm-dark font-bold">¡Todo en orden!</h3>
          <p className="text-gray-500 text-sm">No hay alumnos con cancelaciones previas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-mm-surface rounded-4xl p-6 border border-red-100 shadow-sm animate-fade-in h-full flex flex-col">
      <div className="flex items-center gap-3 mb-5 border-b border-gray-100 pb-4 shrink-0">
        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-mm-dark leading-tight">Alerta de Retención</h2>
          <p className="text-xs text-gray-500 font-medium">3 o más faltas consecutivas</p>
        </div>
        <span className="ml-auto bg-red-100 text-red-600 text-xs font-black px-2.5 py-1 rounded-lg">
          {alertas.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-62.5 lg:max-h-none">
        {alertas.map((alerta) => (
          <div key={alerta.usuarioId} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all hover:border-red-200 hover:shadow-sm">
            
            <div className="flex flex-col">
              <span className="text-sm font-bold text-mm-dark truncate max-w-35 xl:max-w-45">
                {alerta.nombreCompleto}
              </span>
              <span className="text-[11px] font-bold text-red-500 uppercase tracking-wide mt-0.5">
                {alerta.ausenciasConsecutivas} Faltas al hilo
              </span>
              <span className="text-[11px] text-gray-400 font-medium mt-1">
                Última: {formatearFecha(alerta.ultimaFechaFalta)}
              </span>
            </div>

            <button
              onClick={() => abrirWhatsApp(alerta.telefono, alerta.nombreCompleto)}
              className="w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 bg-green-50 text-green-600 rounded-xl flex items-center justify-center gap-2 hover:bg-green-500 hover:text-white transition-colors shrink-0 group"
              title="Contactar por WhatsApp"
            >
              <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
              <span className="hidden sm:block text-xs font-bold">Contactar</span>
            </button>
            
          </div>
        ))}
      </div>
    </div>
  );
};