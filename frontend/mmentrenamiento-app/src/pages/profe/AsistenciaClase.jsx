import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, ExclamationTriangleIcon, CheckIcon, XMarkIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { asistenciaService } from '../../services/asistenciaService';
import { seguimientoService } from '../../services/seguimientoService';
import { administracionService } from '../../services/administracionService';
import { reservasService } from '../../services/reservasService';
import { etiquetaTurno, formatearHora, esNotFound } from '../../utils/fechas';
import { PlanFrame } from '../../components/perfil/PlanFrame';

// ==========================================
// DETALLE Y ASISTENCIA DE LA CLASE
// ==========================================
const tieneLesiones = (ficha) => {
  const texto = ficha?.lesiones?.trim();
  return !!texto && !/^(ninguna?|no|-|n\/a)$/i.test(texto);
};

const PanelDetalles = ({ alumno, ficha }) => {
  if (!alumno) return null;
  const lesion = tieneLesiones(ficha);
  
  return (
    <div className="animate-fade-in bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="hidden lg:flex gap-6 border-b border-gray-100 pb-3 mb-6">
        <span className="font-bold text-mm-dark border-b-2 border-mm-purple pb-3 -mb-3">{alumno.nombreCompleto}</span>
      </div>

      {ficha === undefined ? (
        <p className="text-sm text-gray-400">Cargando datos...</p>
      ) : ficha === null ? (
        <p className="text-sm text-red-500 font-medium">No se pudo cargar la ficha técnica.</p>
      ) : (
        <div className="flex flex-col gap-8 flex-1">
          <div>
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Ficha Técnica</h3>
            <div className="bg-gray-50 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                <span className="text-sm font-medium text-gray-500">Objetivos</span>
                <span className="text-sm font-bold text-mm-dark text-right">{ficha.objetivos || 'Sin objetivos cargados'}</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                <span className="text-sm font-medium text-gray-500">Lesiones</span>
                <span className={`text-sm font-bold text-right ${lesion ? 'text-amber-600' : 'text-mm-dark'}`}>{ficha.lesiones || 'Ninguna'}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Plan de Entrenamiento (OneDrive)</h3>
            <div className="flex-1 min-h-100 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 relative">
              {ficha.driveItemId ? (
                <PlanFrame driveItemId={ficha.driveItemId} />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  <span className="text-4xl mb-2">📋</span>
                  <p className="text-sm font-bold text-gray-400">Sin plan vinculado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const AsistenciaClase = () => {
  // Ahora tratamos el ID de la URL directamente como HorarioId
  const { turnoId: horarioIdUrl } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [detalle, setDetalle] = useState(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [hayError, setHayError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [asistencia, setAsistencia] = useState({});
  const [fichas, setFichas] = useState({});
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);

  const [busquedaAlumno, setBusquedaAlumno] = useState('');
  const [usuariosSistema, setUsuariosSistema] = useState([]);
  const [isBuscando, setIsBuscando] = useState(false);

  useEffect(() => {
    administracionService.getUsuarios().then(res => setUsuariosSistema(res || []));
  }, []);

  const cargar = useCallback(async () => {
    try {
      setIsLoading(true);
      setHayError(false);
      setNoEncontrado(false);

      const fecha = searchParams.get('fecha');
      
      // Le mandamos el HorarioId al backend, que es lo que realmente espera
      const data = await asistenciaService.getDetalleClase(horarioIdUrl, fecha);
      
      if (fecha) data.fecha = fecha;
      setDetalle(data);

      const inicial = {};
      data.alumnosPresentes.forEach((a) => { inicial[a.reservaId] = a.estado !== 'Ausente'; });
      setAsistencia(inicial);

      const resultados = await Promise.allSettled(
        data.alumnosPresentes.map((a) => seguimientoService.getFichaAlumno(a.usuarioId))
      );
      const mapa = {};
      data.alumnosPresentes.forEach((a, i) => {
        mapa[a.usuarioId] = resultados[i].status === 'fulfilled' ? resultados[i].value : null;
      });
      setFichas(mapa);
      
      if (data.alumnosPresentes.length > 0 && !alumnoSeleccionado) {
        setAlumnoSeleccionado(data.alumnosPresentes[0].reservaId);
      }
      
    } catch (error) {
      if (esNotFound(error)) {
        setDetalle({
          turnoId: null,
          horarioId: horarioIdUrl, 
          fecha: searchParams.get('fecha'),
          horaInicio: searchParams.get('hora') || '00:00:00',
          alumnosPresentes: [],
          alumnosQueAvisaron: []
        });
        setAsistencia({});
        setFichas({});
      } else {
        setHayError(true);
        toast.error('No se pudo cargar la clase.');
      }
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horarioIdUrl, searchParams]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const marcar = (e, reservaId, presente) => {
    e.stopPropagation();
    setAsistencia((prev) => ({ ...prev, [reservaId]: presente }));
  };

  const handleGuardar = async () => {
    try {
      setIsSaving(true);
      const idReal = detalle.turnoId || horarioIdUrl; 
      
      const respuesta = await asistenciaService.guardarAsistencia({
        turnoId: Number(idReal),
        asistencias: detalle.alumnosPresentes.map((a) => ({ reservaId: a.reservaId, asistio: !!asistencia[a.reservaId] }))
      });
      toast.success(respuesta?.message || 'Asistencia guardada.');
      await cargar();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo guardar la asistencia.');
    } finally {
      setIsSaving(false);
    }
  };

  const anotarAlumnoRapido = async (usuarioId, nombre) => {
    try {
      setIsBuscando(true);
      await reservasService.reservarTurnoEventual({
        horarioId: detalle.horarioId, 
        fecha: detalle.fecha,
        usuarioId: usuarioId
      });
      toast.success(`${nombre} anotado a la clase.`);
      setBusquedaAlumno('');
      await cargar();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo anotar al alumno.');
    } finally {
      setIsBuscando(false);
    }
  };

  const volver = () => navigate(-1);

  if (isLoading && !detalle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] animate-pulse">
        <div className="w-10 h-10 border-4 border-mm-purple border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-mm-dark opacity-50">Cargando clase...</p>
      </div>
    );
  }

  if (noEncontrado || hayError || !detalle) {
    return (
      <div className="max-w-lg mx-auto text-center bg-mm-surface rounded-4xl p-8 shadow-sm border border-gray-100 mt-10">
        <p className="text-sm font-bold text-mm-dark opacity-60 mb-4">
          {noEncontrado ? 'No encontramos esa clase.' : 'No pudimos cargar la clase.'}
        </p>
        <button onClick={volver} className="bg-mm-light text-mm-dark px-6 py-2 rounded-full font-semibold text-sm">Volver a la grilla</button>
      </div>
    );
  }

  const alumnos = detalle.alumnosPresentes;
  const presentes = alumnos.filter((a) => asistencia[a.reservaId]).length;
  const alumnoActivo = alumnos.find(a => a.reservaId === alumnoSeleccionado);
  const fichaActiva = alumnoActivo ? fichas[alumnoActivo.usuarioId] : null;

  const idsPresentes = alumnos.map(a => a.usuarioId);
  const resultadosBusqueda = busquedaAlumno 
    ? usuariosSistema
        .filter(u => u.rol === 'Alumno' && !idsPresentes.includes(u.id) && u.nombreCompleto.toLowerCase().includes(busquedaAlumno.toLowerCase()))
        .slice(0, 3)
    : [];

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <button onClick={volver} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-mm-dark shadow-sm hover:bg-gray-50 transition-colors active:scale-95">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black text-mm-dark leading-none">
            Turno de las {formatearHora(detalle.horaInicio)} hs
          </h1>
          <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-wider">{etiquetaTurno(detalle.fecha, detalle.horaInicio)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-4 flex flex-col gap-4">

          {/* BUSCADOR RÁPIDO PARA ANOTAR */}
          <div className="relative z-20">
            <div className="relative flex items-center">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4" />
              <input
                type="text"
                placeholder="Anotar alumno a la clase..."
                value={busquedaAlumno}
                onChange={(e) => setBusquedaAlumno(e.target.value)}
                className="w-full bg-white border border-mm-purple text-mm-dark rounded-2xl pl-11 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-mm-purple/20 transition-all shadow-sm"
              />
            </div>
            
            {busquedaAlumno && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
                {resultadosBusqueda.length > 0 ? (
                  resultadosBusqueda.map(u => (
                    <button
                      key={u.id}
                      onClick={() => anotarAlumnoRapido(u.id, u.nombreCompleto)}
                      disabled={isBuscando}
                      className="w-full text-left px-4 py-3 text-sm font-bold text-mm-dark hover:bg-purple-50 border-b border-gray-50 last:border-0 transition-colors flex justify-between items-center group"
                    >
                      {u.nombreCompleto}
                      <span className="flex items-center gap-1 text-[10px] bg-purple-100 text-mm-purple px-2 py-1 rounded-md">
                        <PlusIcon className="w-3 h-3" /> Anotar
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center font-medium">No se encontraron alumnos disponibles.</div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-2 mb-2 mt-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Asistencia ({presentes}/{alumnos.length})</span>
          </div>

          {alumnos.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100">
              <p className="text-sm font-bold text-mm-dark opacity-40">No hay alumnos inscriptos.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {alumnos.map((alumno) => {
                const ficha = fichas[alumno.usuarioId];
                const lesion = tieneLesiones(ficha);
                const isSelected = alumnoSeleccionado === alumno.reservaId;
                const presente = !!asistencia[alumno.reservaId];
                const iniciales = alumno.nombreCompleto.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                return (
                  <div key={alumno.reservaId} className="flex flex-col gap-2">
                    <div 
                      onClick={() => setAlumnoSeleccionado(alumno.reservaId)}
                      className={`cursor-pointer rounded-2xl p-3 flex items-center gap-3 transition-all duration-200 border-2 ${
                        isSelected 
                          ? 'bg-white border-mm-purple shadow-md scale-[1.02]' 
                          : 'bg-white border-transparent shadow-sm hover:border-purple-100'
                      } ${!presente ? 'opacity-60 grayscale-30' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${isSelected ? 'bg-purple-100 text-mm-purple' : 'bg-gray-100 text-gray-500'}`}>
                        {iniciales}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm truncate ${!presente ? 'text-gray-500 line-through' : 'text-mm-dark'}`}>
                          {alumno.nombreCompleto}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {lesion && <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-500" />}
                          {alumno.primeraClase && <span className="w-2 h-2 rounded-full bg-sky-400" title="Primera Clase"></span>}
                        </div>
                      </div>

                      <div className="flex items-center bg-gray-50 rounded-xl p-1 shrink-0 border border-gray-100">
                        <button
                          onClick={(e) => marcar(e, alumno.reservaId, true)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${presente ? 'bg-mm-purple text-white shadow-sm' : 'text-gray-300 hover:text-mm-purple'}`}
                        >
                          <CheckIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => marcar(e, alumno.reservaId, false)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${!presente ? 'bg-mm-dark text-white shadow-sm' : 'text-gray-300 hover:text-mm-dark'}`}
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="lg:hidden mt-2 mb-4">
                         <PanelDetalles alumno={alumnoActivo} ficha={fichaActiva} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {detalle.alumnosQueAvisaron.length > 0 && (
            <div className="mt-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2">Avisaron que no vienen</span>
              <div className="flex flex-col gap-2 mt-3">
                {detalle.alumnosQueAvisaron.map((a) => (
                  <div key={a.usuarioId} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm opacity-60">
                    <p className="font-bold text-sm text-gray-500 line-through">{a.nombreCompleto}</p>
                    {a.motivo && <p className="text-xs text-gray-400 mt-0.5">{a.motivo}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {alumnos.length > 0 && (
             <div className="mt-6 pb-6">
               <button
                onClick={handleGuardar} disabled={isSaving}
                className="w-full bg-mm-purple text-white font-bold rounded-2xl py-4 text-sm shadow-sm disabled:opacity-70 active:scale-95 transition-all hover:bg-mm-purple/80"
              >
                {isSaving ? 'Guardando...' : 'Guardar asistencia'}
              </button>
             </div>
          )}
        </div>

        {/* COLUMNA DERECHA: Ficha y Plan */}
        <div className="hidden lg:block lg:col-span-8">
          {alumnoActivo ? (
            <PanelDetalles alumno={alumnoActivo} ficha={fichaActiva} />
          ) : (
             <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm text-center h-full flex flex-col items-center justify-center">
                <span className="text-5xl mb-4 opacity-50">👈</span>
                <p className="text-lg font-bold text-gray-400">Seleccioná un alumno de la lista para ver su ficha y plan.</p>
             </div>
          )}
        </div>

      </div>
    </div>
  );
};