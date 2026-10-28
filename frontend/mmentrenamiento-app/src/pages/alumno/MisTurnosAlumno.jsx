import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, CalendarDaysIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { reservasService } from '../../services/reservasService';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { etiquetaTurno, formatearHora, nombreDiaSemana, etiquetaTipoReserva, esNotFound, claseYaInicio } from '../../utils/fechas';
import { useWhatsAppGimnasio } from '../../hooks/useWhatsAppGimnasio';

export const MisTurnosAlumno = () => {
  const navigate = useNavigate();
  const { abrir: whatsapp } = useWhatsAppGimnasio();
  const [turnosData, setTurnosData] = useState({ proximasClases: [], misSuscripcionesFijas: [] });
  const [isLoading, setIsLoading] = useState(true);

  const [modalCancelar, setModalCancelar] = useState({ isOpen: false, clase: null, isProcessing: false });

  const cargarTurnos = async () => {
    try {
      setIsLoading(true);
      const data = await reservasService.getMisTurnos();
      setTurnosData(data || { proximasClases: [], misSuscripcionesFijas: [] });
    } catch (error) {
      if (esNotFound(error)) {
        setTurnosData({ proximasClases: [], misSuscripcionesFijas: [] });
      } else {
        toast.error("Error al cargar tus turnos.");
        console.error(error)
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarTurnos();
  }, []);

  // --- Cancelar Clase Eventual ---
  const confirmarCancelacion = async () => {
    if (!modalCancelar.clase) return;
    try {
      setModalCancelar(prev => ({ ...prev, isProcessing: true }));
      const respuesta = await reservasService.cancelarClase({ turnoId: modalCancelar.clase.turnoId });
      toast.success(respuesta?.message || "Clase cancelada exitosamente.");
      setModalCancelar({ isOpen: false, clase: null, isProcessing: false });
      cargarTurnos();
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo cancelar el turno.");
      setModalCancelar(prev => ({ ...prev, isProcessing: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
        <div className="w-10 h-10 border-4 border-mm-purple border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-mm-dark opacity-50">Cargando tu agenda...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-10 w-full max-w-6xl mx-auto mt-2">

      {/* Modal Cancelar Clase Eventual */}
      <ConfirmDialog
        isOpen={modalCancelar.isOpen}
        title="¿Cancelar clase?"
        message={<>Vas a cancelar tu turno del <strong className="text-mm-dark">{modalCancelar.clase && etiquetaTurno(modalCancelar.clase.fecha, modalCancelar.clase.horaInicio)} hs</strong>. Recuperarás tu crédito.</>}
        confirmText="Sí, cancelar"
        isLoading={modalCancelar.isProcessing}
        onConfirm={confirmarCancelacion}
        onCancel={() => setModalCancelar({ isOpen: false, clase: null, isProcessing: false })}
      />

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-mm-light rounded-full flex items-center justify-center text-mm-dark hover:bg-gray-200 transition-colors active:scale-95">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-3xl md:text-4xl font-display font-black text-mm-dark leading-none">Mis Turnos</h1>
      </div>

      {/* Turnos Fijos (Suscripciones) */}
      {turnosData.misSuscripcionesFijas?.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg md:text-xl font-bold text-mm-dark mb-4 px-1">Tus Horarios Fijos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {turnosData.misSuscripcionesFijas.map(fijo => (
              <div key={fijo.turnoFijoId} className="bg-mm-surface rounded-3xl p-5 flex items-center justify-between border border-gray-100 shadow-[0_2px_12px_rgba(31,30,46,0.06)]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-mm-light shrink-0">
                    <ArrowPathIcon className="w-6 h-6 text-mm-purple" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-mm-dark opacity-40 uppercase tracking-wider mb-0.5">Suscripción Activa</p>
                    <p className="text-sm md:text-base font-bold text-mm-dark">Cada {nombreDiaSemana(fijo.diaSemana)} · {formatearHora(fijo.horaInicio)} hs</p>
                  </div>
                </div>
                <button 
                  onClick={() => whatsapp(`Hola! Quería consultar para liberar o modificar mi turno fijo de los días ${nombreDiaSemana(fijo.diaSemana)}.`)} 
                  className="text-xs font-bold text-mm-purple hover:bg-purple-50 px-3 py-2 rounded-xl transition-colors shrink-0"
                >
                  Modificar
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reservas Eventuales (Próximas Clases) */}
      <section>
        <h2 className="text-lg md:text-xl font-bold text-mm-dark mb-4 px-1">Próximas Clases</h2>
        {turnosData.proximasClases?.length === 0 ? (
          <div className="bg-mm-surface rounded-4xl p-12 text-center shadow-sm border border-gray-100 max-w-2xl">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-base font-bold text-mm-dark opacity-40">No tenés reservas futuras.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {turnosData.proximasClases.map((cls) => (
              <div key={cls.turnoId} className="bg-mm-surface rounded-3xl p-5 flex items-center justify-between shadow-[0_2px_12px_rgba(31,30,46,0.06)] border border-gray-100 border-l-4 border-l-mm-purple">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-mm-light shrink-0">
                    <CalendarDaysIcon className="w-6 h-6 text-mm-purple" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-mm-purple uppercase tracking-wider mb-0.5">{etiquetaTipoReserva(cls.tipoReserva)}</p>
                    <p className="text-sm md:text-base font-bold text-mm-dark">{etiquetaTurno(cls.fecha, cls.horaInicio)}</p>
                  </div>
                </div>
                {claseYaInicio(cls.fecha, cls.horaInicio) ? (
                  <span className="text-xs font-bold bg-gray-100 text-gray-400 px-4 py-2.5 rounded-xl text-center shrink-0 cursor-not-allowed">
                    Clase iniciada
                  </span>
                ) : (
                  <button 
                    onClick={() => setModalCancelar({ isOpen: true, clase: cls, isProcessing: false })} 
                    className="text-xs font-bold bg-mm-dark text-white hover:bg-gray-800 px-4 py-2.5 rounded-xl transition-colors text-center shrink-0"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};