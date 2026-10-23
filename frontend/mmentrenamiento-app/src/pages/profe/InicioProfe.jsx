import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDaysIcon, UsersIcon, UserCircleIcon, CurrencyDollarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/useAuthStore';
import { administracionService } from '../../services/administracionService';

export const InicioProfe = () => {
  const navigate = useNavigate();
  const nombreProfe = useAuthStore((state) => state.usuario?.nombreCompleto);

  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  const cargarUsuarios = async () => {
    try {
      // El Profe tiene acceso a este endpoint gracias a las configuraciones previas
      const data = await administracionService.getUsuarios();
      setUsuarios(data || []);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarUsuarios();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    if (!busqueda) return [];
    return usuarios
      .filter(u => u.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()))
      .slice(0, 4);
  }, [usuarios, busqueda]);

  const irAlPerfilDelAlumno = (id) => {
    navigate(`/profe/usuarios/${id}`);
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-10">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-black text-mm-dark">Bienvenido, {nombreProfe || 'Profe'}</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base font-medium">Panel de control y accesos rápidos.</p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Buscador Rápido (Diseño oscuro, igual al de pagos) */}
        <div className="lg:col-span-1 bg-mm-dark p-6 rounded-4xl shadow-sm relative flex flex-col h-full min-h-75">
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-4xl">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <CurrencyDollarIcon className="w-32 h-32" />
            </div>
          </div>

          <h2 className="text-lg font-bold text-white mb-1 relative z-10">Búsqueda Rápida</h2>
          <p className="text-gray-400 text-xs font-medium mb-4 relative z-10">Accedé a la ficha técnica de un alumno.</p>

          <div className="relative z-10 flex-1">
            <div className="relative flex items-center">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4" />
              <input
                type="text"
                placeholder="Nombre del alumno..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-11 pr-4 py-3.5 text-sm outline-none focus:border-mm-surface transition-colors placeholder:text-gray-500"
              />
            </div>

            {/* Resultados de la búsqueda */}
            {busqueda && (
              <div className="mt-2 bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 absolute w-full z-20">
                {usuariosFiltrados.length > 0 ? (
                  usuariosFiltrados.map(u => (
                    <button
                      key={u.id}
                      onClick={() => irAlPerfilDelAlumno(u.id)}
                      className="w-full text-left px-4 py-3 text-sm font-bold text-mm-dark hover:bg-purple-50 border-b border-gray-50 last:border-0 transition-colors flex justify-between items-center group"
                    >
                      {u.nombreCompleto}
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-md group-hover:bg-mm-purple group-hover:text-white transition-colors">
                        Ver Perfil
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center font-medium">No se encontraron alumnos.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* BOTONES DE ACCIÓN (Mismo estilo que el Admin) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">

          {/* Grilla de Turnos (Reserva) */}
          <button
            onClick={() => navigate('/profe/turnos')}
            className="bg-mm-surface p-5 rounded-4xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group flex flex-col items-start text-left h-full"
          >
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <CalendarDaysIcon className="w-6 h-6 text-orange-500" />
            </div>
            <h2 className="text-base font-bold text-mm-dark">Grilla de Turnos</h2>
            <p className="text-xs text-gray-500 mt-1 font-medium">Ver las clases del día y tomar asistencia.</p>
          </button>

          {/* Alumnos */}
          <button
            onClick={() => navigate('/profe/usuarios')}
            className="bg-mm-surface p-5 rounded-4xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group flex flex-col items-start text-left h-full"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <UsersIcon className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-base font-bold text-mm-dark">Alumnos</h2>
            <p className="text-xs text-gray-500 mt-1 font-medium">Buscar alumnos y revisar sus fichas técnicas.</p>
          </button>

          {/* Mi Perfil (Ancho completo) */}
          <button
            onClick={() => navigate('/profe/perfil')}
            className="bg-mm-surface p-5 rounded-4xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group flex flex-col items-start text-left sm:col-span-2"
          >
            <div className="flex items-center gap-4 w-full">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <UserCircleIcon className="w-6 h-6 text-mm-purple" />
              </div>
              <div>
                <h2 className="text-base font-bold text-mm-dark">Mi Perfil</h2>
                <p className="text-xs text-gray-500 mt-1 font-medium">Actualizar tus datos personales y foto de perfil.</p>
              </div>
            </div>
          </button>

        </div>
      </section>
    </div>
  );
};