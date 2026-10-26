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

function yaPaso(fechaString, horaString) {
  if (!fechaString || !horaString) return false;
  const [year, month, day] = fechaString.split('-').map(Number);
  const [hours, minutes] = horaString.split(':').map(Number);
  const fechaClase = new Date(year, month - 1, day, hours, minutes);
  return fechaClase < new Date();
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
    <div className="animate-fade-in pb-10 w-full max-w-6xl mx-auto">

      {/* Selector de Semanas */}
      <div className="mt-2 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] md:text-[24px] font-display font-black text-mm-dark leading-none">
            {MONTH_NAMES[selected.getMonth()]} {selected.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => { const d = new Date(selected); d.setDate(d.getDate() - 7); setSelected(d); }}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors bg-mm-light hover:bg-gray-200"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="var(--color-mm-dark)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button
              onClick={() => { const d = new Date(selected); d.setDate(d.getDate() + 7); setSelected(d); }}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors bg-mm-light hover:bg-gray-200"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="var(--color-mm-dark)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-4">
          {weekDays.map((d, i) => {
            const isSelected = toFormatYYYYMMDD(d) === fechaFormat;
            return (
              <button
                key={i}
                onClick={() => setSelected(d)}
                className={`flex flex-col items-center justify-center gap-1 py-3 md:py-4 rounded-2xl md:rounded-3xl transition-all duration-150 ${isSelected ? 'bg-mm-dark shadow-md scale-105' : 'bg-mm-surface border border-gray-100 hover:bg-gray-50'}`}
              >
                <span className={`text-xs md:text-sm font-medium ${isSelected ? 'text-mm-light opacity-80' : 'text-gray-500'}`}>
                  {DAYS[d.getDay()]}
                </span>
                <span className={`text-sm md:text-xl font-black ${isSelected ? 'text-white' : 'text-mm-dark'}`}>
                  {d.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Turnos */}
      <div>
        <p className="text-xs md:text-sm font-medium uppercase mb-4 text-mm-dark opacity-40 tracking-[0.08em]">
          {selected.getDate()} de {MONTH_NAMES[selected.getMonth()]}
        </p>

        {isLoading ? (
          <div className="rounded-3xl p-12 text-center bg-mm-surface shadow-[0_2px_12px_rgba(31,30,46,0.06)] animate-pulse">
            <div className="w-8 h-8 border-4 border-mm-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          </div>
        ) : dayClasses.length === 0 ? (
          <div className="rounded-3xl p-12 text-center bg-mm-surface shadow-[0_2px_12px_rgba(31,30,46,0.06)] border border-gray-100">
            <div className="text-4xl mb-3">🏋️</div>
            <p className="text-base font-medium text-mm-dark opacity-40">No hay turnos este día</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dayClasses.map((cls) => {
              const horaDisplay = formatearHora(cls.horaInicio);
              const miReservaEnEsteHorario = misReservas.find(r =>
                r.fecha === fechaFormat && formatearHora(r.horaInicio) === horaDisplay
              );
              
              const isMyBooking = !!miReservaEnEsteHorario;
              const clasePasada = yaPaso(fechaFormat, cls.horaInicio);
              const spotsLeft = Math.max(cls.cupoMaximo - cls.ocupacionActual, 0);
              const fillPct = Math.min((cls.ocupacionActual / cls.cupoMaximo) * 100, 100);
              const isFull = cls.estaLleno || spotsLeft === 0;

              const barColor = clasePasada 
                ? "var(--color-mm-purple)"
                : isMyBooking 
                  ? "var(--color-mm-purple)" 
                  : (fillPct >= 85 ? "#e2574c" : "var(--color-mm-dark)");

              return (
                <div
                  key={cls.horarioId}
                  className={`rounded-3xl p-5 flex items-center gap-4 bg-mm-surface shadow-[0_2px_12px_rgba(31,30,46,0.06)] transition-all ${
                    isMyBooking 
                      ? clasePasada ? "border-2 border-gray-300 opacity-70" : "border-[3px] border-mm-purple" 
                      : clasePasada ? "border border-gray-100 opacity-60" : "border border-gray-100"
                  }`}
                >
                  <div className={`shrink-0 w-20 text-center rounded-2xl py-3 ${clasePasada ? 'bg-gray-100' : 'bg-mm-light'}`}>
                    <p className={`font-sans text-lg font-black leading-none ${clasePasada ? 'text-gray-400' : 'text-mm-dark'}`}>
                      {horaDisplay}
                    </p>
                    <p className={`text-xs font-bold mt-1 ${clasePasada ? 'text-gray-400' : 'text-mm-dark opacity-40'}`}>
                      hs
                    </p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`font-display text-3xl font-black leading-none ${clasePasada ? 'text-gray-400' : 'text-mm-dark'}`}>
                        {spotsLeft}
                      </span>
                      <span className="text-xs font-medium text-gray-500">
                        {spotsLeft === 1 ? "lugar libre" : "lugares libres"}
                      </span>
                    </div>
                    <div className="mt-3 w-full h-2 rounded-full overflow-hidden bg-gray-100">
                      <div
                        style={{ width: `${fillPct}%`, backgroundColor: barColor }}
                        className="h-full rounded-full transition-all duration-300 ease-out"
                      />
                    </div>
                  </div>

                  {/* Lógica de botones */}
                  {clasePasada ? (
                    <button
                      disabled
                      className="shrink-0 text-sm font-bold px-4 py-2.5 rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed"
                    >
                      {isMyBooking ? "Asistido" : "Finalizada"}
                    </button>
                  ) : isMyBooking ? (
                    <button
                      onClick={() => abrirModalCancelacion(cls, miReservaEnEsteHorario.turnoId)}
                      disabled={isProcessing}
                      className="shrink-0 text-sm font-bold px-4 py-2.5 rounded-xl transition-all duration-150 bg-mm-dark text-white hover:bg-gray-800 active:scale-95"
                    >
                      Reservado
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReservar(cls.horarioId)}
                      disabled={isFull || hasBookingToday || isProcessing}
                      className={`shrink-0 text-sm font-bold px-4 py-2.5 rounded-xl transition-all duration-150 active:scale-95 ${
                        hasBookingToday
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : isFull
                          ? "bg-red-50 text-red-500 cursor-not-allowed"
                          : "bg-mm-purple text-white hover:bg-mm-purple/60 shadow-sm"
                      }`}
                    >
                      {hasBookingToday ? "Bloqueado" : isFull ? "Agotado" : "Reservar"}
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