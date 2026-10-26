import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  ChevronLeftIcon, ChevronRightIcon, UsersIcon, 
  CalendarDaysIcon, ViewColumnsIcon 
} from '@heroicons/react/24/outline';

import { horariosService } from '../../services/horariosService';
import { formatearHora, parsearFechaIso, esNotFound } from '../../utils/fechas';

const aFechaIso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const fmtFechaLarga = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

const turnoYaPaso = (horaFinCadena, fechaIso) => {
  const fechaTurno = parsearFechaIso(fechaIso);
  const hoy = new Date();
  
  fechaTurno.setHours(0, 0, 0, 0);
  hoy.setHours(0, 0, 0, 0);

  if (fechaTurno < hoy) return true;
  if (fechaTurno > hoy) return false;

  const ahora = new Date();
  const [hora, min] = horaFinCadena.split(':').map(Number);
  const finTurno = new Date();
  finTurno.setHours(hora, min, 0, 0);
  return ahora > finTurno;
};

// ==========================================
// VISTA: DIARIA
// ==========================================
const VistaDiaria = ({ navigate }) => {
  const [fecha, setFecha] = useState(() => sessionStorage.getItem('profeFechaDiaria') || aFechaIso(new Date()));
  const [turnos, setTurnos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hayError, setHayError] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('profeFechaDiaria', fecha);
  }, [fecha]);

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
    <>
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
            const sinInscriptos = turno.ocupacionActual === 0;
            const porcentaje = turno.cupoMaximo > 0 ? Math.min((turno.ocupacionActual / turno.cupoMaximo) * 100, 100) : 0;
            const paso = turnoYaPaso(turno.horaFin, fecha);
            
            return (
              <button
                key={turno.horarioId}
                // ¡LA CLAVE ESTÁ ACÁ! Siempre usamos horarioId en la URL
                onClick={() => navigate(`/profe/clase/${turno.horarioId}?fecha=${fecha}&hora=${turno.horaInicio}`)}
                className={`w-full text-left rounded-2xl p-4 flex items-center gap-4 border transition-all active:scale-[0.99] ${
                  paso 
                    ? 'bg-gray-50 border-gray-100 opacity-60 grayscale hover:opacity-80' 
                    : 'bg-mm-surface border-gray-100 shadow-sm hover:shadow-md hover:border-mm-purple'
                }`}
              >
                <div className={`shrink-0 w-20 text-center rounded-xl py-2 ${paso ? 'bg-gray-200' : 'bg-mm-light'}`}>
                  <p className="font-sans text-sm font-black text-mm-dark leading-none">{formatearHora(turno.horaInicio)}</p>
                  <p className="text-[10px] text-mm-dark opacity-40 mt-1">a {formatearHora(turno.horaFin)}</p>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-mm-dark">
                    <UsersIcon className="w-4 h-4 text-mm-purple" />
                    <span className="text-sm font-bold">{turno.ocupacionActual}/{turno.cupoMaximo} alumnos</span>
                  </div>
                  <div className="mt-2 w-full h-1.5 rounded-full overflow-hidden bg-gray-200">
                    <div
                      style={{ width: `${porcentaje}%` }}
                      className={`h-full rounded-full ${porcentaje >= 85 ? 'bg-red-500' : paso ? 'bg-gray-400' : 'bg-mm-purple'}`}
                    />
                  </div>
                </div>

                <span className={`shrink-0 text-xs font-bold ${paso ? 'text-gray-400' : 'text-mm-purple'}`}>
                  {sinInscriptos ? 'Turno vacío' : paso ? 'Ver asistencia' : 'Tomar asistencia'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};

// ==========================================
// VISTA: SEMANAL
// ==========================================
const VistaSemanal = ({ navigate }) => {
  const [lunesSemana, setLunesSemana] = useState(() => {
    const cached = sessionStorage.getItem('profeFechaSemanal');
    if (cached) return cached;
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    const monday = new Date(d.setDate(diff));
    return aFechaIso(monday);
  });

  const [turnosSemana, setTurnosSemana] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('profeFechaSemanal', lunesSemana);
  }, [lunesSemana]);

  const diasSemana = useMemo(() => {
    const [year, month, day] = lunesSemana.split('-').map(Number);
    return [0, 1, 2, 3, 4].map(i => {
      const d = new Date(year, month - 1, day);
      d.setDate(d.getDate() + i);
      return {
        nombre: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'][i],
        fechaIso: aFechaIso(d),
        diaMes: d.getDate(),
        mesNombre: d.toLocaleString('es', { month: 'long' })
      };
    });
  }, [lunesSemana]);

  const cargarOperativaSemanal = async () => {
    try {
      setIsLoading(true);
      const promesas = diasSemana.map(dia => 
        horariosService.getTurnosDelDia(dia.fechaIso).then(data => ({ fecha: dia.fechaIso, turnos: data || [] }))
      );
      const resultados = await Promise.all(promesas);
      const mapaTurnos = {};
      resultados.forEach(res => { mapaTurnos[res.fecha] = res.turnos; });
      setTurnosSemana(mapaTurnos);
    } catch (error) {
      toast.error("Error al cargar la semana.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarOperativaSemanal();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lunesSemana]);

  const cambiarSemana = (semanas) => {
    const [year, month, day] = lunesSemana.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + (semanas * 7));
    setLunesSemana(aFechaIso(d));
  };

  const horasAlineadas = useMemo(() => {
    const horas = new Set();
    Object.values(turnosSemana).forEach(turnosDia => {
      turnosDia.forEach(t => horas.add(t.horaInicio.slice(0, 5)));
    });
    return Array.from(horas).sort();
  }, [turnosSemana]);

  return (
    <>
      <div className="flex items-center justify-between bg-mm-surface p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <button onClick={() => cambiarSemana(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Semana del</span>
          <span className="font-display font-bold text-lg text-mm-dark text-center">
            {diasSemana[0]?.diaMes} al {diasSemana[4]?.diaMes} de {diasSemana[0]?.mesNombre}
          </span>
        </div>
        <button onClick={() => cambiarSemana(1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      </div>

      {isLoading ? (
        <div className="bg-mm-surface p-12 rounded-4xl border border-gray-100 flex justify-center text-mm-purple animate-pulse shadow-sm">
          <span className="font-bold">Cargando grilla semanal...</span>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
          <div className="min-w-200">
            
            <div className="grid grid-cols-6 bg-[#F8F9FA] border-b border-gray-200">
              <div className="p-4 flex items-center justify-center border-r border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Horario</span>
              </div>
              {diasSemana.map(dia => (
                <div key={dia.fechaIso} className="p-4 flex flex-col items-center justify-center border-r border-gray-100 last:border-0">
                  <span className="text-sm font-bold text-mm-dark">{dia.nombre}</span>
                  <span className="text-xs font-medium text-gray-500">{dia.diaMes}</span>
                </div>
              ))}
            </div>

            {horasAlineadas.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-sm font-medium">No hay clases configuradas para esta semana.</div>
            ) : (
              horasAlineadas.map(hora => (
                <div key={hora} className="grid grid-cols-6 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                  
                  <div className="p-3 flex items-center justify-center border-r border-gray-100 bg-[#F8F9FA]/50">
                    <span className="font-bold text-mm-dark text-sm">{hora}</span>
                  </div>

                  {diasSemana.map(dia => {
                    const turno = (turnosSemana[dia.fechaIso] || []).find(t => t.horaInicio.slice(0, 5) === hora);
                    
                    if (!turno) return <div key={dia.fechaIso} className="p-3 border-r border-gray-100 last:border-0"></div>;

                    const estaLleno = turno.ocupacionActual >= turno.cupoMaximo;
                    const porcentaje = turno.cupoMaximo > 0 ? Math.round((turno.ocupacionActual / turno.cupoMaximo) * 100) : 0;
                    const paso = turnoYaPaso(turno.horaFin, dia.fechaIso);
                    
                    return (
                      <div key={dia.fechaIso} className="p-2 border-r border-gray-100 last:border-0">
                        <div 
                          // ¡LA CLAVE ESTÁ ACÁ! Siempre usamos horarioId en la URL
                          onClick={() => navigate(`/profe/clase/${turno.horarioId}?fecha=${dia.fechaIso}&hora=${turno.horaInicio}`)}
                          className={`h-full p-2.5 rounded-xl cursor-pointer transition-all border flex flex-col justify-between group shadow-sm hover:shadow-md ${
                            paso 
                              ? 'bg-gray-50 border-gray-100 opacity-60 grayscale' 
                              : estaLleno ? 'bg-red-50 border-red-100 hover:border-red-300' : 'bg-white border-gray-200 hover:border-mm-purple'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <UsersIcon className={`w-3.5 h-3.5 ${estaLleno ? 'text-red-500' : paso ? 'text-gray-400' : 'text-mm-purple'}`} />
                            <span className={`text-xs font-bold ${estaLleno ? 'text-red-700' : paso ? 'text-gray-500' : 'text-mm-dark'}`}>
                              {turno.ocupacionActual}/{turno.cupoMaximo}
                            </span>
                          </div>
                          
                          <div className={`w-full rounded-full h-1 overflow-hidden ${paso ? 'bg-gray-200' : 'bg-gray-100'}`}>
                            <div 
                              className={`h-1 rounded-full transition-all duration-500 ${estaLleno ? 'bg-red-500' : paso ? 'bg-gray-400' : 'bg-mm-purple'}`} 
                              style={{ width: `${porcentaje}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

// ==========================================
// COMPONENTE PRINCIPAL (GRILLA)
// ==========================================
export const GrillaProfe = () => {
  const [vista, setVista] = useState(() => sessionStorage.getItem('profeVistaGrilla') || 'diaria');
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.setItem('profeVistaGrilla', vista);
  }, [vista]);

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-10">
      
      <header className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black text-mm-dark">Turnos</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base font-medium">Gestioná la asistencia y los cupos.</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner shrink-0 self-start sm:self-auto">
          <button 
            onClick={() => setVista('diaria')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${vista === 'diaria' ? 'bg-white shadow-sm text-mm-purple' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <CalendarDaysIcon className="w-4 h-4" /> Día
          </button>
          <button 
            onClick={() => setVista('semanal')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${vista === 'semanal' ? 'bg-white shadow-sm text-mm-purple' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <ViewColumnsIcon className="w-4 h-4" /> Semana
          </button>
        </div>
      </header>

      {vista === 'diaria' ? <VistaDiaria navigate={navigate} /> : <VistaSemanal navigate={navigate} />}
      
    </div>
  );
};