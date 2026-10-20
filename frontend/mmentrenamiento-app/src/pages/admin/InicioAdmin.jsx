import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDaysIcon, UsersIcon, ChartBarIcon,
  CurrencyDollarIcon, MegaphoneIcon, PlusCircleIcon, MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { administracionService } from '../../services/administracionService';
import { useAuthStore } from '../../store/useAuthStore';
import { nombreDiaPorIndice } from '../../utils/fechas';
import { ModalNuevoUsuario } from './usuarios/ModalNuevoUsuario';

export const InicioAdmin = () => {
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [busquedaPago, setBusquedaPago] = useState('');
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);

  const nombreAdmin = useAuthStore((state) => state.usuario?.nombreCompleto);

  const [metricas, setMetricas] = useState(null);
  const [errorMetricas, setErrorMetricas] = useState(false);

  const cargarMetricas = async () => {
    try {
      setErrorMetricas(false);
      setMetricas(await administracionService.getMetricas());
    } catch (error) {
      setErrorMetricas(true);
      toast.error("No se pudieron cargar las métricas.");
      console.error("Error cargando métricas:", error);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const data = await administracionService.getUsuarios();
      setUsuarios(data || []);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarUsuarios();
    cargarMetricas();
  }, []);

  // Filtro en tiempo real para el buscador de pagos
  const usuariosFiltrados = useMemo(() => {
    if (!busquedaPago) return [];
    return usuarios
      .filter(u => u.nombreCompleto.toLowerCase().includes(busquedaPago.toLowerCase()))
      .slice(0, 4);
  }, [usuarios, busquedaPago]);

  const irAlPerfilDelAlumno = (id) => {
    navigate(`/admin/usuarios/${id}`);
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-10">

      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-display font-black text-mm-dark">Bienvenido, {nombreAdmin || 'Admin'}</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base font-medium">Panel de control y accesos rápidos.</p>
      </header>

      {/* ==============================================
          1. SECCIÓN DE MÉTRICAS Y GRÁFICOS
          ============================================== */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">

        {/* Card: Usuarios Activos */}
        <div className="bg-mm-surface p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <UsersIcon className="w-5 h-5 text-blue-500" />
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Alumnos Activos</p>
          </div>
          <span className="text-4xl font-display font-black text-mm-dark">{metricas ? metricas.alumnosActivos : '—'}</span>
        </div>

        {/* Card: Ocupación Semanal */}
        <div className="bg-mm-surface p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="w-5 h-5 text-mm-purple" />
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Ocupación Semanal</p>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-4xl font-display font-black text-mm-purple">{metricas ? `${metricas.ocupacionSemanal}%` : '—'}</span>
          </div>
        </div>

        {/* Card: Pagos Pendientes */}
        <div className="bg-mm-surface p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <CurrencyDollarIcon className="w-5 h-5 text-red-500" />
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Pagos Pendientes</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-display font-black text-red-500">{metricas ? metricas.pagosPendientes : '—'}</span>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">Alumnos</span>
          </div>
        </div>
      </section>

      {/* Ocupación por turno (semana en curso) */}
      <section className="bg-mm-surface p-5 rounded-3xl border border-gray-100 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Ocupación por día · semana en curso</p>
          {errorMetricas && (
            <button onClick={cargarMetricas} className="text-xs font-bold text-mm-purple hover:underline">Reintentar</button>
          )}
        </div>
        {!metricas ? (
          <p className="text-sm text-gray-400 font-medium">{errorMetricas ? 'No se pudieron cargar los datos.' : 'Cargando...'}</p>
        ) : metricas.ocupacionPorDia.length === 0 ? (
          <p className="text-sm text-gray-400 font-medium">No hay horarios configurados.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {metricas.ocupacionPorDia.map((t) => (
              <div key={t.fecha} className="flex items-center gap-3">
                <span className="w-24 text-xs font-bold text-mm-dark">{nombreDiaPorIndice(t.diaSemana)}</span>
                <div className="flex-1 h-2.5 rounded-full bg-mm-light overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${t.porcentaje >= 85 ? 'bg-red-500' : 'bg-mm-purple'}`}
                    style={{ width: `${t.porcentaje}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs font-bold text-gray-500">{t.porcentaje}%</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ==============================================
          2. ACCESOS RÁPIDOS Y BUSCADOR DE PAGOS
          ============================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BUSCADOR DE COBRO RÁPIDO */}
        <div className="lg:col-span-1 bg-mm-dark p-6 rounded-4xl shadow-sm relative flex flex-col">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-4xl">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <CurrencyDollarIcon className="w-32 h-32" />
            </div>
          </div>

          <h2 className="text-lg font-bold text-white mb-1 relative z-10">Cobro Rápido</h2>
          <p className="text-gray-400 text-xs font-medium mb-4 relative z-10">Buscá un alumno para registrarle un pago.</p>

          <div className="relative z-10 flex-1">
            <div className="relative flex items-center">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4" />
              <input
                type="text"
                placeholder="Nombre del alumno..."
                value={busquedaPago}
                onChange={(e) => setBusquedaPago(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-11 pr-4 py-3.5 text-sm outline-none focus:border-mm-surface transition-colors placeholder:text-gray-500"
              />
            </div>

            {/* Resultados de la búsqueda */}
            {busquedaPago && (
              <div className="mt-2 bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 absolute w-full z-20">
                {usuariosFiltrados.length > 0 ? (
                  usuariosFiltrados.map(u => (
                    <button
                      key={u.id}
                      onClick={() => irAlPerfilDelAlumno(u.id)}
                      className="w-full text-left px-4 py-3 text-sm font-bold text-mm-dark hover:bg-green-50 border-b border-gray-50 last:border-0 transition-colors flex justify-between items-center group"
                    >
                      {u.nombreCompleto}
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-md group-hover:bg-green-100 group-hover:text-green-700">Cobrar</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center font-medium">No se encontraron alumnos.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Reserva Rápida */}
          <button
            onClick={() => navigate('/admin/horarios')}
            className="bg-mm-surface p-5 rounded-4xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group flex flex-col items-start text-left"
          >
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <CalendarDaysIcon className="w-6 h-6 text-orange-500" />
            </div>
            <h2 className="text-base font-bold text-mm-dark">Reserva Rápida</h2>
            <p className="text-xs text-gray-500 mt-1 font-medium">Anotá a un alumno en un turno eventual o fijo.</p>
          </button>

          {/* Nuevo Usuario */}
          <button
            onClick={() => setModalRegistroAbierto(true)}
            className="bg-mm-surface p-5 rounded-4xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group flex flex-col items-start text-left"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <PlusCircleIcon className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-base font-bold text-mm-dark">Nuevo Usuario</h2>
            <p className="text-xs text-gray-500 mt-1 font-medium">Registrá rápidamente un alumno o profesor.</p>
          </button>

          {/* Anuncio Global */}
          <button
            onClick={() => navigate('/admin/ajustes')}
            className="bg-mm-surface p-5 rounded-4xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group flex flex-col items-start text-left sm:col-span-2"
          >
            <div className="flex items-center gap-4 w-full">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <MegaphoneIcon className="w-6 h-6 text-mm-purple" />
              </div>
              <div>
                <h2 className="text-base font-bold text-mm-dark">Crear Aviso Global</h2>
                <p className="text-xs text-gray-500 mt-1 font-medium">Publicá un anuncio que verán todos los alumnos en su panel de inicio.</p>
              </div>
            </div>
          </button>

        </div>


      </section>

      {/* Inyectamos el Modal de Nuevo Usuario */}
      <ModalNuevoUsuario
        isOpen={modalRegistroAbierto}
        onClose={() => setModalRegistroAbierto(false)}
        onUsuarioCreado={cargarUsuarios}
      />

    </div>
  );
};