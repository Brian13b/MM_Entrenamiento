import { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { seguimientoService } from '../../../services/seguimientoService';

export const PanelRetencion = ({ tipo = 'ausencias', titulo = 'Panel de Retención' }) => {
  const [alertas, setAlertas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cargarAlertas = async () => {
      try {
        const data = await seguimientoService.obtenerAlertasRetencion();
        
        // FILTRADO DINÁMICO
        if (tipo === 'ausencias') {
          setAlertas(data.filter(a => a.ausenciasConsecutivas >= 2));
        } else if (tipo === 'cancelaciones') {
          setAlertas(data.filter(a => a.cancelacionesConsecutivas >= 3));
        } else {
          setAlertas(data);
        }
      } catch (error) {
        console.error("Error al cargar alertas de retención:", error);
        toast.error("No se pudieron cargar las alertas de retención.");
      } finally {
        setIsLoading(false);
      }
    };

    cargarAlertas();
  }, [tipo]);

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
      <div className="bg-mm-surface rounded-4xl p-6 border border-gray-100 shadow-sm animate-pulse h-full min-h-87.5 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-mm-purple border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-mm-purple font-bold text-sm">Analizando historial...</span>
      </div>
    );
  }

  if (alertas.length === 0) {
    return (
      <div className="bg-mm-surface rounded-4xl p-6 border border-gray-100 shadow-sm h-full min-h-87.5 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-2">
          <ExclamationTriangleIcon className="w-6 h-6 text-green-500" />
        </div>
        <h2 className="text-sm uppercase font-bold tracking-wider text-gray-500">{titulo}</h2>
        <div>
          <h3 className="text-mm-dark font-bold">¡Todo en orden!</h3>
          <p className="text-gray-500 text-sm">No hay alumnos en riesgo en esta categoría.</p>
        </div>
      </div>
    );
  }

  const isAusencias = tipo === 'ausencias';
  const colorBase = isAusencias ? 'red' : 'orange';

  return (
    <div className={`bg-mm-surface rounded-4xl p-6 border border-${colorBase}-100 shadow-sm animate-fade-in h-full flex flex-col min-h-87.5`}>
      <div className="flex items-center gap-3 mb-5 border-b border-gray-100 pb-4 shrink-0">
        <div className={`w-10 h-10 bg-${colorBase}-50 rounded-xl flex items-center justify-center shrink-0`}>
          <ExclamationTriangleIcon className={`w-6 h-6 text-${colorBase}-500`} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-mm-dark leading-tight">{titulo}</h2>
          <p className="text-xs text-gray-500 font-medium">
            {isAusencias ? '2 o más faltas consecutivas' : '3 o más cancelaciones seguidas'}
          </p>
        </div>
        <span className={`ml-auto bg-${colorBase}-100 text-${colorBase}-600 text-xs font-black px-2.5 py-1 rounded-lg`}>
          {alertas.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-62.5">
        {alertas.map((alerta) => (
          <div key={alerta.usuarioId} className={`bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all hover:border-${colorBase}-200 hover:shadow-sm`}>
            
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-mm-dark truncate">
                {alerta.nombreCompleto}
              </span>
              <span className={`text-[11px] font-bold text-${colorBase}-500 uppercase tracking-wide mt-0.5`}>
                {isAusencias 
                  ? `${alerta.ausenciasConsecutivas} Faltas al hilo` 
                  : `${alerta.cancelacionesConsecutivas} Cancelaciones`
                }
              </span>
              <span className="text-[11px] text-gray-400 font-medium mt-1">
                Última vez: {formatearFecha(alerta.ultimaFechaFalta)}
              </span>
            </div>

            <button
              onClick={() => abrirWhatsApp(alerta.telefono, alerta.nombreCompleto)}
              className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors shrink-0 group"
              title="Contactar por WhatsApp"
            >
              <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
            </button>
            
          </div>
        ))}
      </div>
    </div>
  );
};