import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon, ChevronDownIcon, ExclamationTriangleIcon, CheckIcon, XMarkIcon
} from '@heroicons/react/24/outline';
import { asistenciaService } from '../../services/asistenciaService';
import { seguimientoService } from '../../services/seguimientoService';
import { etiquetaTurno, etiquetaTipoReserva, esNotFound } from '../../utils/fechas';

// Una lesión "vacía" no debe disparar la alerta.
const tieneLesiones = (ficha) => {
  const texto = ficha?.lesiones?.trim();
  return !!texto && !/^(ninguna?|no|-|n\/a)$/i.test(texto);
};

export const AsistenciaClase = () => {
  const { turnoId } = useParams();
  const navigate = useNavigate();

  const [detalle, setDetalle] = useState(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [hayError, setHayError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // reservaId -> true (presente) / false (ausente)
  const [asistencia, setAsistencia] = useState({});
  // usuarioId -> { objetivos, lesiones } | null si no se pudo cargar
  const [fichas, setFichas] = useState({});
  const [expandido, setExpandido] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setIsLoading(true);
      setHayError(false);
      setNoEncontrado(false);

      const data = await asistenciaService.getDetalleClase(turnoId);
      setDetalle(data);

      // Lo ya guardado se respeta; las reservas todavía activas arrancan como presentes.
      const inicial = {};
      data.alumnosPresentes.forEach((a) => { inicial[a.reservaId] = a.estado !== 'Ausente'; });
      setAsistencia(inicial);

      // Las fichas se precargan para avisar de las lesiones antes de la clase.
      const resultados = await Promise.allSettled(
        data.alumnosPresentes.map((a) => seguimientoService.getFichaAlumno(a.usuarioId))
      );
      const mapa = {};
      data.alumnosPresentes.forEach((a, i) => {
        mapa[a.usuarioId] = resultados[i].status === 'fulfilled' ? resultados[i].value : null;
      });
      setFichas(mapa);
    } catch (error) {
      if (esNotFound(error)) {
        setNoEncontrado(true);
      } else {
        setHayError(true);
        toast.error('No se pudo cargar la clase.');
        console.error(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [turnoId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const marcar = (reservaId, presente) => setAsistencia((prev) => ({ ...prev, [reservaId]: presente }));

  const handleGuardar = async () => {
    try {
      setIsSaving(true);
      const respuesta = await asistenciaService.guardarAsistencia({
        turnoId: Number(turnoId),
        asistencias: detalle.alumnosPresentes.map((a) => ({ reservaId: a.reservaId, asistio: !!asistencia[a.reservaId] }))
      });
      toast.success(respuesta?.message || 'Asistencia guardada.');
      await cargar();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo guardar la asistencia.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const volver = () => navigate('/profe');

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
      <div className="max-w-lg mx-auto text-center bg-mm-surface rounded-4xl p-8 shadow-sm border border-gray-100">
        <p className="text-sm font-bold text-mm-dark opacity-60 mb-4">
          {noEncontrado ? 'No encontramos esa clase.' : 'No pudimos cargar la clase.'}
        </p>
        <div className="flex gap-2 justify-center">
          {hayError && (
            <button onClick={cargar} className="bg-mm-purple text-white px-6 py-2 rounded-full font-semibold text-sm">Reintentar</button>
          )}
          <button onClick={volver} className="bg-mm-light text-mm-dark px-6 py-2 rounded-full font-semibold text-sm">Volver a la grilla</button>
        </div>
      </div>
    );
  }

  const alumnos = detalle.alumnosPresentes;
  const presentes = alumnos.filter((a) => asistencia[a.reservaId]).length;

  return (
    <div className="animate-fade-in max-w-lg mx-auto pb-28">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={volver} className="w-10 h-10 bg-mm-surface rounded-full flex items-center justify-center text-mm-dark hover:bg-gray-200 transition-colors active:scale-95">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-black text-mm-dark leading-none">Asistencia</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">{etiquetaTurno(detalle.fecha, detalle.horaInicio)} hs</p>
        </div>
      </div>

      {alumnos.length === 0 ? (
        <div className="bg-mm-surface rounded-4xl p-8 text-center shadow-sm border border-gray-100">
          <p className="text-sm font-bold text-mm-dark opacity-40">No hay alumnos inscriptos en esta clase.</p>
        </div>
      ) : (
        <>
          <p className="text-xs font-medium text-gray-500 mb-3 px-1">
            Todos arrancan como presentes: marcá a quienes faltaron. <strong className="text-mm-dark">{presentes}/{alumnos.length}</strong> presentes.
          </p>

          <div className="flex flex-col gap-3">
            {alumnos.map((alumno) => {
              const ficha = fichas[alumno.usuarioId];
              const lesion = tieneLesiones(ficha);
              const abierto = expandido === alumno.reservaId;
              const presente = !!asistencia[alumno.reservaId];

              return (
                <div key={alumno.reservaId} className={`bg-mm-surface rounded-2xl shadow-sm border ${lesion ? 'border-amber-200' : 'border-gray-100'} overflow-hidden`}>
                  <div className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-mm-dark truncate">{alumno.nombreCompleto}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${alumno.tipoReserva === 'Fija' ? 'text-mm-purple' : 'text-blue-600'}`}>
                          {etiquetaTipoReserva(alumno.tipoReserva)}
                        </span>
                        {alumno.primeraClase && (
                          <span className="text-[10px] font-bold bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full border border-sky-100 uppercase tracking-wider">Primera clase</span>
                        )}
                        {lesion && (
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100 uppercase tracking-wider">
                            <ExclamationTriangleIcon className="w-3 h-3" /> Lesión
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex bg-mm-light rounded-xl p-1 shrink-0">
                      <button
                        onClick={() => marcar(alumno.reservaId, true)}
                        title="Presente"
                        className={`p-2 rounded-lg transition-colors ${presente ? 'bg-green-500 text-white shadow-sm' : 'text-gray-400 hover:text-green-600'}`}
                      >
                        <CheckIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => marcar(alumno.reservaId, false)}
                        title="Ausente"
                        className={`p-2 rounded-lg transition-colors ${!presente ? 'bg-red-500 text-white shadow-sm' : 'text-gray-400 hover:text-red-600'}`}
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>

                    <button
                      onClick={() => setExpandido(abierto ? null : alumno.reservaId)}
                      title="Ver ficha técnica"
                      className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors"
                    >
                      <ChevronDownIcon className={`w-5 h-5 transition-transform ${abierto ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {abierto && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-50 animate-fade-in">
                      {ficha === undefined ? (
                        <p className="text-xs text-gray-400 pt-3">Cargando ficha...</p>
                      ) : ficha === null ? (
                        <p className="text-xs text-red-500 font-medium pt-3">No se pudo cargar la ficha técnica.</p>
                      ) : (
                        <div className="flex flex-col gap-3 pt-3">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Objetivos</p>
                            <p className="text-sm text-mm-dark">{ficha.objetivos || 'Sin objetivos cargados.'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Lesiones</p>
                            <p className={`text-sm ${lesion ? 'text-amber-700 font-bold' : 'text-mm-dark'}`}>{ficha.lesiones || 'Ninguna.'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {detalle.alumnosQueAvisaron.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 px-1">Avisaron que no vienen</h2>
          <div className="flex flex-col gap-2">
            {detalle.alumnosQueAvisaron.map((a) => (
              <div key={a.usuarioId} className="bg-mm-surface rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className="font-bold text-sm text-mm-dark">{a.nombreCompleto}</p>
                {a.motivo && <p className="text-xs text-gray-500 mt-0.5">{a.motivo}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {alumnos.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-mm-light via-mm-light to-transparent">
          <button
            onClick={handleGuardar} disabled={isSaving}
            className="w-full max-w-lg mx-auto block bg-mm-purple text-white font-bold rounded-2xl py-4 text-sm shadow-lg disabled:opacity-70 active:scale-95 transition-all"
          >
            {isSaving ? 'Guardando...' : 'Guardar asistencia'}
          </button>
        </div>
      )}
    </div>
  );
};
