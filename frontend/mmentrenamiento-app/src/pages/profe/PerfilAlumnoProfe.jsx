import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PhoneIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { seguimientoService } from '../../services/seguimientoService';
import { PlanFrame } from '../../components/perfil/PlanFrame';
import { tieneLesiones } from '../../utils/fichas';
import { urlAvatar } from '../../utils/avatar';

export const PerfilAlumnoProfe = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [alumno, setAlumno] = useState(null);
  const [ficha, setFicha] = useState(null);
  const [reporte, setReporte] = useState(null);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [hayError, setHayError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      setIsLoading(true);
      setHayError(false);
      setNoEncontrado(false);

      const hoy = new Date();
      const [alumnos, datosFicha, datosReporte] = await Promise.all([
        seguimientoService.getAlumnos(),
        seguimientoService.getFichaAlumno(id),
        seguimientoService.getReporteAsistencia(id, hoy.getMonth() + 1, hoy.getFullYear())
      ]);

      const encontrado = alumnos.find((a) => a.id === id);
      if (!encontrado) {
        setNoEncontrado(true);
        return;
      }

      setAlumno(encontrado);
      setFicha(datosFicha);
      setReporte(datosReporte);
    } catch (error) {
      setHayError(true);
      toast.error('No se pudo cargar el perfil del alumno.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const volver = () => navigate('/profe/usuarios');

  const abrirWhatsApp = () => {
    const digitos = (alumno.telefono || '').replace(/\D/g, '');
    if (!digitos) return toast.error('Este alumno no tiene teléfono registrado.');
    window.open(`https://wa.me/${digitos}`, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return <div className="text-center p-8 text-mm-purple animate-pulse font-bold">Cargando perfil...</div>;
  }

  if (noEncontrado || hayError || !alumno) {
    return (
      <div className="max-w-lg mx-auto text-center bg-mm-surface rounded-4xl p-8 shadow-sm border border-gray-100">
        <p className="text-sm font-bold text-mm-dark opacity-60 mb-4">
          {noEncontrado ? 'No encontramos a ese alumno.' : 'No pudimos cargar el perfil.'}
        </p>
        <div className="flex gap-2 justify-center">
          {hayError && <button onClick={cargar} className="bg-mm-purple text-white px-6 py-2 rounded-full font-semibold text-sm">Reintentar</button>}
          <button onClick={volver} className="bg-mm-light text-mm-dark px-6 py-2 rounded-full font-semibold text-sm">Volver al listado</button>
        </div>
      </div>
    );
  }

  const lesion = tieneLesiones(ficha);

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-10">
      <button onClick={volver} className="flex items-center gap-2 text-gray-500 hover:text-mm-purple transition-colors text-sm font-bold mb-4">
        <ArrowLeftIcon className="w-4 h-4" /> Volver al listado
      </button>

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-mm-surface p-6 rounded-4xl border border-gray-100 shadow-sm mb-6">
        <div className="flex items-center gap-5 min-w-0">
          <img src={urlAvatar(alumno.nombreCompleto, alumno.fotoPerfilUrl)} alt="" className="w-20 h-20 rounded-3xl object-cover border border-gray-200 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-2xl font-display font-bold text-mm-dark flex flex-wrap items-center gap-3 mb-1">
              {alumno.nombreCompleto}
              {!alumno.activo && (
                <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2.5 py-1 rounded-md uppercase tracking-wider border border-red-100">Bloqueado</span>
              )}
            </h1>
            <p className="text-sm text-gray-500 font-medium truncate">{alumno.email}</p>
            {alumno.telefono && (
              <p className="flex items-center gap-1.5 text-sm text-gray-500 font-medium mt-1"><PhoneIcon className="w-4 h-4" /> {alumno.telefono}</p>
            )}
          </div>
        </div>
        <button
          onClick={abrirWhatsApp}
          className="flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-colors"
        >
          WhatsApp
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col gap-6">
          <section className={`bg-mm-surface p-6 rounded-4xl border shadow-sm ${lesion ? 'border-amber-200' : 'border-gray-100'}`}>
            <h2 className="text-lg font-bold text-mm-dark mb-4">Ficha técnica</h2>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Objetivos</p>
                <p className="text-sm text-mm-dark">{ficha?.objetivos || 'Sin objetivos cargados.'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Lesiones</p>
                <p className={`flex items-start gap-2 text-sm ${lesion ? 'text-amber-700 font-bold' : 'text-mm-dark'}`}>
                  {lesion && <ExclamationTriangleIcon className="w-4 h-4 mt-0.5 shrink-0" />}
                  {ficha?.lesiones || 'Ninguna.'}
                </p>
              </div>
            </div>
          </section>

          <section className="bg-mm-surface p-6 rounded-4xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-mm-dark mb-4">Asistencia del mes</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <Dato valor={reporte.asistenciasTotales} etiqueta="Asistencias" />
              <Dato valor={reporte.ausenciasTotales} etiqueta="Ausencias" />
              <Dato valor={reporte.clasesCanceladas} etiqueta="Canceladas" />
              <Dato valor={`${Math.round(reporte.porcentajeAsistencia)}%`} etiqueta="Asistencia" destacado />
            </div>
          </section>
        </div>

        <section className="bg-mm-surface p-6 rounded-4xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-mm-dark mb-4">Plan de entrenamiento</h2>
          {ficha?.driveItemId
            ? <PlanFrame url={ficha.driveItemId} colapsable />
            : <p className="text-sm text-gray-400 italic">Este alumno todavía no tiene un plan vinculado.</p>}
        </section>
      </div>
    </div>
  );
};

const Dato = ({ valor, etiqueta, destacado = false }) => (
  <div className={`rounded-2xl p-4 ${destacado ? 'bg-mm-dark text-white' : 'bg-mm-light'}`}>
    <p className={`text-2xl font-display font-black ${destacado ? 'text-mm-purple' : 'text-mm-dark'}`}>{valor}</p>
    <p className={`text-[11px] font-bold uppercase tracking-wide mt-1 ${destacado ? 'text-gray-300' : 'text-gray-500'}`}>{etiqueta}</p>
  </div>
);
