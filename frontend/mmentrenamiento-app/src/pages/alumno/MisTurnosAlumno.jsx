import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, CalendarDaysIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { reservasService } from '../../services/reservasService';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { etiquetaTurno, formatearHora, nombreDiaSemana, etiquetaTipoReserva, esNotFound } from '../../utils/fechas';

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

  // --- Dar de Baja Turno Fijo ---
  const confirmarBajaFija = async () => {
    if (!modalBajaFijo.turnoFijo) return;
    try {
      setModalBajaFijo(prev => ({ ...prev, isProcessing: true }));
      const respuesta = await reservasService.darDeBajaTurnoFijo({ turnoFijoId: modalBajaFijo.turnoFijo.turnoFijoId });
      toast.success(respuesta?.message || "Turno fijo dado de baja.");
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
      <ConfirmDialog
        isOpen={modalCancelar.isOpen}
        title="¿Cancelar clase?"
        message={<>Vas a cancelar tu turno del <strong className="text-mm-dark">{modalCancelar.clase && etiquetaTurno(modalCancelar.clase.fecha, modalCancelar.clase.horaInicio)} hs</strong>. Recuperarás tu crédito.</>}
        confirmText="Sí, cancelar"
        isLoading={modalCancelar.isProcessing}
        onConfirm={confirmarCancelacion}
        onCancel={() => setModalCancelar({ isOpen: false, clase: null, isProcessing: false })}
      />

      {/* Modal Dar de Baja Turno Fijo */}
      <ConfirmDialog
        isOpen={modalBajaFijo.isOpen}
        title="¿Liberar turno fijo?"
        message={<>Vas a liberar tu lugar fijo de todos los <strong className="text-mm-dark">{modalBajaFijo.turnoFijo && nombreDiaSemana(modalBajaFijo.turnoFijo.diaSemana)} a las {formatearHora(modalBajaFijo.turnoFijo?.horaInicio)} hs</strong>. Se cancelarán tus clases futuras de ese horario y se te devolverán los créditos.</>}
        confirmText="Sí, liberar"
        isLoading={modalBajaFijo.isProcessing}
        onConfirm={confirmarBajaFija}
        onCancel={() => setModalBajaFijo({ isOpen: false, turnoFijo: null, isProcessing: false })}
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
                    <p className="text-sm md:text-base font-bold text-mm-dark">Cada {nombreDiaSemana(fijo.diaSemana)} · {formatearHora(fijo.horaInicio)} hs</p>
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
                    <p className="text-[10px] font-bold text-mm-purple uppercase tracking-wider mb-0.5">{etiquetaTipoReserva(cls.tipoReserva)}</p>
                    <p className="text-sm md:text-base font-bold text-mm-dark">{etiquetaTurno(cls.fecha, cls.horaInicio)}</p>
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