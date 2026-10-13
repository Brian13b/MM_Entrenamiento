import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, CalendarDaysIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { reservasService } from '../../services/reservasService';
import { Modal } from '../../components/ui/Modal'; 

export const MisTurnosAlumno = () => {
  const navigate = useNavigate();
  const [turnosData, setTurnosData] = useState({ proximasClases: [], misSuscripcionesFijas: [] });
  const [isLoading, setIsLoading] = useState(true);
  
  const [modalCancelar, setModalCancelar] = useState({ isOpen: false, clase: null, isProcessing: false });
  const [modalBajaFijo, setModalBajaFijo] = useState({ isOpen: false, turnoFijo: null, isProcessing: false });

  const cargarTurnos = async () => {
    try {
      setIsLoading(true);
      const data = await reservasService.getMisTurnos();
      setTurnosData(data || { proximasClases: [], misSuscripcionesFijas: [] });
    } catch (error) {
      toast.error("Error al cargar tus turnos.");
      console.error(error)
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
      await reservasService.cancelarClase({ turnoId: modalCancelar.clase.turnoId }); 
      toast.success("Clase cancelada exitosamente. Recuperaste tu crédito.");
      setModalCancelar({ isOpen: false, clase: null, isProcessing: false });
      cargarTurnos();
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo cancelar el turno.");
      setModalCancelar(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // --- Dar de Baja Turno Fijo ---
  const confirmarBajaFija = async () => {
    if (!modalBajaFijo.turnoFijo) return;
    try {
      setModalBajaFijo(prev => ({ ...prev, isProcessing: true }));
      await reservasService.darDeBajaTurnoFijo({ turnoFijoId: modalBajaFijo.turnoFijo.turnoFijoId }); 
      toast.success("Turno fijo dado de baja.");
      setModalBajaFijo({ isOpen: false, turnoFijo: null, isProcessing: false });
      cargarTurnos();
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo dar de baja el turno fijo.");
      setModalBajaFijo(prev => ({ ...prev, isProcessing: false }));
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
    <div className="animate-fade-in pb-10 max-w-lg mx-auto mt-2 px-4 md:px-0">
      
      {/* Modal Cancelar Clase Eventual */}
      <Modal isOpen={modalCancelar.isOpen} onClose={() => !modalCancelar.isProcessing && setModalCancelar({ isOpen: false, clase: null, isProcessing: false })} title="¿Cancelar clase?">
        <p className="text-sm text-gray-500 mb-6">Vas a cancelar tu turno del <strong className="text-mm-dark">{modalCancelar.clase?.dia} a las {modalCancelar.clase?.hora} hs</strong>.</p>
        <div className="flex gap-3">
          <button onClick={() => setModalCancelar({ isOpen: false, clase: null, isProcessing: false })} disabled={modalCancelar.isProcessing} className="flex-1 py-3 rounded-xl font-bold text-sm bg-mm-light text-mm-dark hover:bg-gray-200 transition-colors">Volver</button>
          <button onClick={confirmarCancelacion} disabled={modalCancelar.isProcessing} className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors">{modalCancelar.isProcessing ? "Procesando..." : "Sí, cancelar"}</button>
        </div>
      </Modal>

      {/* Modal Dar de Baja Turno Fijo */}
      <Modal isOpen={modalBajaFijo.isOpen} onClose={() => !modalBajaFijo.isProcessing && setModalBajaFijo({ isOpen: false, turnoFijo: null, isProcessing: false })} title="¿Liberar turno fijo?">
        <p className="text-sm text-gray-500 mb-6">Vas a liberar tu lugar fijo de todos los <strong className="text-mm-dark">{modalBajaFijo.turnoFijo?.diaSemana} a las {modalBajaFijo.turnoFijo?.horaInicio?.substring(0,5)} hs</strong>.</p>
        <div className="flex gap-3">
          <button onClick={() => setModalBajaFijo({ isOpen: false, turnoFijo: null, isProcessing: false })} disabled={modalBajaFijo.isProcessing} className="flex-1 py-3 rounded-xl font-bold text-sm bg-mm-light text-mm-dark hover:bg-gray-200 transition-colors">Volver</button>
          <button onClick={confirmarBajaFija} disabled={modalBajaFijo.isProcessing} className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors">{modalBajaFijo.isProcessing ? "Procesando..." : "Sí, liberar"}</button>
        </div>
      </Modal>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-mm-light rounded-full flex items-center justify-center text-mm-dark hover:bg-gray-200 transition-colors active:scale-95">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-3xl md:text-4xl font-display font-black text-mm-dark leading-none">Mis Turnos</h1>
      </div>

      {/* Turnos Fijos (Suscripciones) */}
      {turnosData.misSuscripcionesFijas?.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-mm-dark mb-4 px-1">Tus Horarios Fijos</h2>
          <div className="flex flex-col gap-3">
            {turnosData.misSuscripcionesFijas.map(fijo => (
              <div key={fijo.turnoFijoId} className="bg-mm-surface rounded-[1.25rem] p-4 flex items-center justify-between border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-mm-light">
                    <ArrowPathIcon className="w-6 h-6 text-mm-purple" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-mm-dark opacity-40 uppercase tracking-wider mb-0.5">Suscripción Activa</p>
                    <p className="text-sm md:text-base font-bold text-mm-dark">Cada {fijo.diaSemana} · {fijo.horaInicio.substring(0,5)} hs</p>
                  </div>
                </div>
                <button onClick={() => setModalBajaFijo({ isOpen: true, turnoFijo: fijo, isProcessing: false })} className="text-[11px] font-bold text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors">
                  Liberar
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reservas Eventuales (Próximas Clases) */}
      <section>
        <h2 className="text-lg font-bold text-mm-dark mb-4 px-1">Próximas Clases</h2>
        {turnosData.proximasClases?.length === 0 ? (
          <div className="bg-mm-surface rounded-4xl p-8 text-center shadow-sm border border-gray-100">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm font-bold text-mm-dark opacity-40">No tenés reservas futuras.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {turnosData.proximasClases.map((cls) => (
              <div key={cls.turnoId} className="bg-mm-surface rounded-[1.25rem] p-4 flex items-center justify-between shadow-sm border border-gray-100 border-l-4 border-l-mm-purple">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-mm-light">
                    <CalendarDaysIcon className="w-6 h-6 text-mm-purple" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-mm-purple uppercase tracking-wider mb-0.5">{cls.tipoReserva}</p>
                    <p className="text-sm md:text-base font-bold text-mm-dark">{cls.dia} {cls.fecha} {cls.mes} · {cls.hora}</p>
                  </div>
                </div>
                <button onClick={() => setModalCancelar({ isOpen: true, clase: cls, isProcessing: false })} className="text-[11px] font-bold text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors text-center">
                  Cancelar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};