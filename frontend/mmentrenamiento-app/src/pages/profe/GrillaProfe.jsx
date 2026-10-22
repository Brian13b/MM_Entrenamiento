import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeftIcon, ChevronRightIcon, UsersIcon } from '@heroicons/react/24/outline';
import { horariosService } from '../../services/horariosService';
import { formatearHora, parsearFechaIso, esNotFound } from '../../utils/fechas';

const aFechaIso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const fmtFechaLarga = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

export const GrillaProfe = () => {
  const navigate = useNavigate();
  const [fecha, setFecha] = useState(() => aFechaIso(new Date()));
  const [turnos, setTurnos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hayError, setHayError] = useState(false);

  const cargarTurnos = useCallback(async () => {
    try {
      setIsLoading(true);
      setHayError(false);
      const data = await horariosService.getTurnosDelDia(fecha);
      setTurnos(data || []);
    } catch (error) {
      setTurnos([]);
      if (!esNotFound(error)) {
        setHayError(true);
        toast.error('No se pudieron cargar los turnos del día.');
        console.error(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fecha]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarTurnos();
  }, [cargarTurnos]);

  const moverDia = (dias) => {
    const d = parsearFechaIso(fecha);
    d.setDate(d.getDate() + dias);
    setFecha(aFechaIso(d));
  };

  const esHoy = fecha === aFechaIso(new Date());
  const titulo = fmtFechaLarga.format(parsearFechaIso(fecha));

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-10">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-display font-black text-mm-dark">Turnos</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base font-medium">Turnos del gimnasio: horarios, cupos y alumnos.</p>
      </header>
      
      <div className="flex items-center justify-between bg-mm-surface p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <button onClick={() => moverDia(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{esHoy ? 'Hoy' : 'Grilla del día'}</span>
          <span className="font-display font-bold text-lg text-mm-dark capitalize">{titulo}</span>
          {!esHoy && (
            <button onClick={() => setFecha(aFechaIso(new Date()))} className="text-xs font-bold text-mm-purple hover:underline mt-0.5">
              Volver a hoy
            </button>
          )}
        </div>
        <button onClick={() => moverDia(1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl p-10 text-center bg-mm-surface shadow-sm animate-pulse">
          <div className="w-8 h-8 border-4 border-mm-purple border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : hayError ? (
        <div className="rounded-2xl p-10 text-center bg-mm-surface shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-4">No pudimos cargar los turnos.</p>
          <button onClick={cargarTurnos} className="bg-mm-purple text-white px-6 py-2 rounded-full font-semibold text-sm">Reintentar</button>
        </div>
      ) : turnos.length === 0 ? (
        <div className="rounded-2xl p-10 text-center bg-mm-surface shadow-sm">
          <div className="text-3xl mb-2">🏋️</div>
          <p className="text-sm font-medium text-mm-dark opacity-40">No hay clases este día</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {turnos.map((turno) => {
            const sinInscriptos = !turno.turnoId || turno.ocupacionActual === 0;
            const porcentaje = turno.cupoMaximo > 0 ? Math.min((turno.ocupacionActual / turno.cupoMaximo) * 100, 100) : 0;

            return (
              <button
                key={turno.horarioId}
                disabled={sinInscriptos}
                onClick={() => navigate(`/profe/clase/${turno.turnoId}`)}
                className={`w-full text-left rounded-2xl p-4 flex items-center gap-4 bg-mm-surface shadow-sm border border-gray-100 transition-all ${
                  sinInscriptos ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md hover:border-mm-purple active:scale-[0.99]'
                }`}
              >
                <div className="shrink-0 w-20 text-center rounded-xl py-2 bg-mm-light">
                  <p className="font-sans text-sm font-black text-mm-dark leading-none">{formatearHora(turno.horaInicio)}</p>
                  <p className="text-[10px] text-mm-dark opacity-40 mt-1">a {formatearHora(turno.horaFin)}</p>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-mm-dark">
                    <UsersIcon className="w-4 h-4 text-mm-purple" />
                    <span className="text-sm font-bold">{turno.ocupacionActual}/{turno.cupoMaximo} alumnos</span>
                  </div>
                  <div className="mt-2 w-full h-1.5 rounded-full overflow-hidden bg-mm-light">
                    <div
                      style={{ width: `${porcentaje}%` }}
                      className={`h-full rounded-full ${porcentaje >= 85 ? 'bg-red-500' : 'bg-mm-purple'}`}
                    />
                  </div>
                </div>

                <span className="shrink-0 text-xs font-bold text-mm-purple">
                  {sinInscriptos ? 'Sin inscriptos' : 'Tomar asistencia'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
