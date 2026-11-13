import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDaysIcon, UsersIcon, ChartBarIcon, CurrencyDollarIcon, MegaphoneIcon, PlusCircleIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { administracionService } from '../../services/administracionService';
import { useAuthStore } from '../../store/useAuthStore';
import { nombreDiaPorIndice } from '../../utils/fechas';
import { ModalNuevoUsuario } from '../shared/ModalNuevoUsuario';
import { PanelRetencion } from '../admin/inicio/PanelRetencion';

export const InicioAdmin = () => {
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [busquedaPago, setBusquedaPago] = useState('');
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);
  
  // ESTADO NUEVO: Para expandir la lista de deudores
  const [mostrarMasDeudores, setMostrarMasDeudores] = useState(false);

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

  const usuariosFiltrados = useMemo(() => {
    if (!busquedaPago) return [];
    return usuarios
      .filter(u => u.nombreCompleto.toLowerCase().includes(busquedaPago.toLowerCase()))
      .slice(0, 4);
  }, [usuarios, busquedaPago]);

  const irAlPerfilDelAlumno = (id) => {
    navigate(`/admin/usuarios/${id}`);
  };

  const deudores = usuarios.filter(u => u.deudor);

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-10">

      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-display font-black text-mm-dark">Bienvenido, {nombreAdmin || 'Admin'}</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base font-medium">Panel de control y accesos rápidos.</p>
      </header>

      {/* Seccion de metricas y graficos */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-start">
        
        {/* Gráfico de Ocupación */}
        <section className="lg:col-span-1 bg-mm-surface p-6 rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col min-h-87.5">
          <div className="flex items-center justify-between mb-8">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Ocupación por día</p>
            {errorMetricas && (
              <button onClick={cargarMetricas} className="text-xs font-bold text-mm-purple hover:underline">Reintentar</button>
            )}
          </div>
          {!metricas ? (
            <p className="text-sm text-gray-400 font-medium pb-4 flex-1">{errorMetricas ? 'Error en datos.' : 'Cargando...'}</p>
          ) : metricas.ocupacionPorDia.length === 0 ? (
            <p className="text-sm text-gray-400 font-medium pb-4 flex-1">Sin horarios configurados.</p>
          ) : (
            <div className="flex items-end justify-between flex-1 min-h-64 gap-2 pt-2 pb-1">
              {metricas.ocupacionPorDia.map((t) => (
                <div key={t.fecha} className="flex flex-col items-center justify-end h-full w-full group relative">
                  <span className="text-[10px] font-bold text-gray-500 mb-1.5 shrink-0 transition-opacity">
                    {t.porcentaje}%
                  </span>
                  <div className="flex-1 w-full max-w-10 bg-mm-light rounded-t-xl overflow-hidden flex flex-col justify-end">
                    <div
                      className={`w-full transition-all duration-700 ease-out rounded-t-xl ${t.porcentaje >= 95 ? 'bg-red-500' : 'bg-mm-purple'}`}
                      style={{ height: `${t.porcentaje}%`, minHeight: t.porcentaje > 0 ? '4px' : '0' }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-mm-dark mt-2.5 shrink-0 uppercase tracking-wider">
                    {nombreDiaPorIndice(t.diaSemana).substring(0, 3)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Paneles de Retención Separados */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
          <PanelRetencion tipo="ausencias" titulo="Faltas Consecutivas" />
          <PanelRetencion tipo="cancelaciones" titulo="Racha de Cancelaciones" />
        </div>

      </div>

      {/* SECCIÓN DEUDORES EXPANDIBLE Y CON SCROLL */}
      <section className="mb-8">
        <div className="bg-white rounded-4xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-mm-dark flex items-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5 text-red-500" />
              Alumnos que deben el mes
            </h2>
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
              {deudores.length} pendientes
            </span>
          </div>

          {deudores.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 text-center">
              <p className="text-sm font-bold text-gray-400">¡Excelente! Todos los alumnos están al día.</p>
            </div>
          ) : (
            <>
              <div className={`flex flex-col gap-3 transition-all ${mostrarMasDeudores ? 'max-h-95 overflow-y-auto pr-2' : ''}`}>
                {deudores
                  .slice(0, mostrarMasDeudores ? deudores.length : 3)
                  .map(deudor => (
                    <div key={deudor.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between gap-3 transition-colors hover:border-red-200">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-mm-dark truncate">{deudor.nombreCompleto}</p>
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-0.5">Falta Pago</p>
                      </div>
                      <button 
                        onClick={() => irAlPerfilDelAlumno(deudor.id)}
                        className="shrink-0 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                      >
                        Cobrar
                      </button>
                    </div>
                ))}
              </div>

              {/* Botón de Mostrar Más */}
              {!mostrarMasDeudores && deudores.length > 3 && (
                <button 
                  onClick={() => setMostrarMasDeudores(true)}
                  className="w-full mt-4 py-3 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  Ver todos los deudores
                </button>
              )}
            </>
          )}
        </div>
      </section>

      {/* Accesos Rápidos y Buscador */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Buscador de Cobro Rápido */}
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
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-11 pr-10 py-3.5 text-sm outline-none focus:border-mm-surface transition-colors placeholder:text-gray-500"
              />
              
              {busquedaPago && (
                <button
                  onClick={() => setBusquedaPago('')}
                  className="absolute right-4 flex items-center text-gray-500 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Resultados */}
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

        {/* Botones de acción rápida */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <ModalNuevoUsuario
        isOpen={modalRegistroAbierto}
        onClose={() => setModalRegistroAbierto(false)}
        onUsuarioCreado={cargarUsuarios}
      />
    </div>
  );
};