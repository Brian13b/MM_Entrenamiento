import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { reservasService } from "../../services/reservasService";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { formatearHora, esNotFound } from "../../utils/fechas";

const DAYS = ["D", "L", "M", "M", "J", "V", "S"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function buildWeekDays(anchor) {
  const days = [];
  const dow = anchor.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;

  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

function toFormatYYYYMMDD(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const GrillaReservas = () => {
  const [selected, setSelected] = useState(new Date());

  const [dayClasses, setDayClasses] = useState([]);
  const [misReservas, setMisReservas] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [classToCancel, setClassToCancel] = useState(null);

  const weekDays = buildWeekDays(selected);
  const fechaFormat = toFormatYYYYMMDD(selected);

  const cargarGrillaYMisTurnos = useCallback(async () => {
    try {
      setIsLoading(true);
      const [dataGrilla, dataMisTurnos] = await Promise.all([
        reservasService.getGrillaPorFecha(fechaFormat),
        reservasService.getMisTurnos()
      ]);

      setDayClasses(dataGrilla || []);
      setMisReservas(dataMisTurnos?.proximasClases || []);
    } catch (error) {
      if (!esNotFound(error)) {
        toast.error("Error al cargar los horarios.");
        console.error(error)
      }
      setDayClasses([]);
      setMisReservas([]);
    } finally {
      setIsLoading(false);
    }
  }, [fechaFormat]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarGrillaYMisTurnos();
  }, [cargarGrillaYMisTurnos]);

  const reservaDelDiaSeleccionado = misReservas.find(r => r.fecha === fechaFormat);
  const hasBookingToday = !!reservaDelDiaSeleccionado;

  const handleReservar = async (horarioId) => {
    try {
      setIsProcessing(true);
      const respuesta = await reservasService.reservarTurno({ horarioId: horarioId, fecha: fechaFormat });
      toast.success(respuesta?.message || "¡Turno reservado con éxito!");
      await cargarGrillaYMisTurnos();
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo reservar el turno.");
    } finally {
      setIsProcessing(false);
    }
  };

  const abrirModalCancelacion = (cls, turnoIdReal) => {
    setClassToCancel({ ...cls, turnoIdReal });
    setShowCancelModal(true);
  };

  const confirmarCancelacion = async () => {
    if (!classToCancel?.turnoIdReal) return;

    try {
      setIsProcessing(true);
      const respuesta = await reservasService.cancelarClase({
        turnoId: classToCancel.turnoIdReal,
        motivo: "Cancelado desde la app por el alumno"
      });

      toast.success(respuesta?.message || "Reserva cancelada.");
      setShowCancelModal(false);
      await cargarGrillaYMisTurnos();
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo cancelar el turno.");
      console.error(error)
    } finally {
      setIsProcessing(false);
      setClassToCancel(null);
    }
  };

  return (
    <div className="animate-fade-in pb-10 max-w-lg mx-auto">

      {/* Selector de Semanas */}
      <div className="mt-2 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] md:text-[24px] font-display font-black text-mm-dark leading-none">
            {MONTH_NAMES[selected.getMonth()]} {selected.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => { const d = new Date(selected); d.setDate(d.getDate() - 7); setSelected(d); }}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-mm-light hover:bg-gray-200"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="var(--color-mm-dark)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button
              onClick={() => { const d = new Date(selected); d.setDate(d.getDate() + 7); setSelected(d); }}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-mm-light hover:bg-gray-200"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="var(--color-mm-dark)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {weekDays.map((d, i) => {
            const isSelected = toFormatYYYYMMDD(d) === fechaFormat;
            return (
              <button
                key={i}
                onClick={() => setSelected(d)}
                className={`flex flex-col items-center gap-1 py-2 rounded-2xl transition-all duration-150 ${isSelected ? 'bg-mm-dark' : 'bg-transparent hover:bg-gray-50'}`}
              >
                <span className={`text-xs font-medium ${isSelected ? 'text-mm-light opacity-60' : 'text-mm-dark opacity-40'}`}>
                  {DAYS[d.getDay()]}
                </span>
                <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-mm-dark'}`}>
                  {d.getDate()}
                </span>
                {isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-mm-purple" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Turnos */}
      <div>
        <p className="text-xs font-medium uppercase mb-3 text-mm-dark opacity-40 tracking-[0.08em]">
          {selected.getDate()} de {MONTH_NAMES[selected.getMonth()]}
        </p>

        {isLoading ? (
          <div className="rounded-2xl p-10 text-center bg-mm-surface shadow-[0_2px_12px_rgba(31,30,46,0.06)] animate-pulse">
            <div className="w-8 h-8 border-4 border-mm-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          </div>
        ) : dayClasses.length === 0 ? (
          <div className="rounded-2xl p-10 text-center bg-mm-surface shadow-[0_2px_12px_rgba(31,30,46,0.06)]">
            <div className="text-3xl mb-2">🏋️</div>
            <p className="text-sm font-medium text-mm-dark opacity-40">No hay turnos este día</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {dayClasses.map((cls) => {
              const horaDisplay = formatearHora(cls.horaInicio);
              const miReservaEnEsteHorario = misReservas.find(r =>
                r.fecha === fechaFormat && formatearHora(r.horaInicio) === horaDisplay
              );
              const isMyBooking = !!miReservaEnEsteHorario;

              const spotsLeft = Math.max(cls.cupoMaximo - cls.ocupacionActual, 0);
              const fillPct = Math.min((cls.ocupacionActual / cls.cupoMaximo) * 100, 100);
              const isFull = cls.estaLleno || spotsLeft === 0;

              const barColor = isMyBooking ? "var(--color-mm-purple)" : (fillPct >= 85 ? "#e2574c" : "var(--color-mm-dark)");

              return (
                <div
                  key={cls.horarioId}
                  className={`rounded-2xl p-4 flex items-center gap-4 bg-mm-surface shadow-[0_2px_12px_rgba(31,30,46,0.06)] transition-all ${
                    isMyBooking ? "border-[3px] border-mm-purple" : "border-l-[3px] border-l-transparent"
                  }`}
                >
                  <div className="shrink-0 w-16 text-center rounded-xl py-2 bg-mm-light">
                    <p className="font-sans text-sm font-black text-mm-dark leading-none">
                      {horaDisplay}
                    </p>
                    <p className="text-xs text-mm-dark opacity-40 mt-0.5">
                      hs
                    </p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-[26px] font-black text-mm-dark leading-none">
                        {spotsLeft}
                      </span>
                      <span className="text-xs text-mm-dark opacity-45">
                        {spotsLeft === 1 ? "lugar disponible" : "lugares disponibles"}
                      </span>
                    </div>
                    <div className="mt-2 w-full h-1.5 rounded-full overflow-hidden bg-mm-light">
                      <div
                        style={{ width: `${fillPct}%`, backgroundColor: barColor }}
                        className="h-full rounded-full transition-all duration-300 ease-out"
                      />
                    </div>
                  </div>

                  {isMyBooking ? (
                    <button
                      onClick={() => abrirModalCancelacion(cls, miReservaEnEsteHorario.turnoId)}
                      disabled={isProcessing}
                      className="shrink-0 text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-150 bg-mm-dark text-white active:scale-95"
                    >
                      Reservado
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReservar(cls.horarioId)}
                      disabled={isFull || hasBookingToday || isProcessing}
                      className={`shrink-0 text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-150 active:scale-95 ${
                        hasBookingToday
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : isFull
                          ? "bg-[#d8d9e6] text-[#8b8b9a] cursor-not-allowed"
                          : "bg-mm-purple text-white hover:opacity-90"
                      }`}
                    >
                      {hasBookingToday ? "Bloqueado" : isFull ? "Sin cupos" : "Reservar"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showCancelModal}
        title="¿Cancelar reserva?"
        message={<>Estás por cancelar tu turno de las <strong className="text-mm-dark">{formatearHora(classToCancel?.horaInicio)} hs</strong>. Recuperarás tu crédito.</>}
        confirmText="Sí, cancelar"
        isLoading={isProcessing}
        onConfirm={confirmarCancelacion}
        onCancel={() => setShowCancelModal(false)}
      />

    </div>
  );
};