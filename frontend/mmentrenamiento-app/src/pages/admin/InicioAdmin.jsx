import { CalendarDaysIcon, UsersIcon, ChartBarIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';

export const InicioAdmin = () => {
  const navigate = useNavigate();

  // Mocks de métricas (luego se conectarán al dashboardService)
  const metricas = {
    ocupacionSemanal: "85%",
    alumnosActivos: 142,
    clasesHoy: 8
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pt-2">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-mm-dark">Bienvenido, Admin</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">Resumen de la actividad del gimnasio.</p>
      </header>

      {/* Sección de Métricas */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-mm-surface p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Ocupación Semanal</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-display font-black text-mm-purple">{metricas.ocupacionSemanal}</span>
            <ChartBarIcon className="w-5 h-5 text-green-500 mb-1" />
          </div>
        </div>
        
        <div className="bg-mm-surface p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Alumnos Activos</p>
          <span className="text-3xl font-display font-black text-mm-dark">{metricas.alumnosActivos}</span>
        </div>

        <div className="bg-mm-surface p-5 rounded-[1.5rem] border border-gray-100 shadow-sm col-span-2 md:col-span-1">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Clases Hoy</p>
          <span className="text-3xl font-display font-black text-mm-dark">{metricas.clasesHoy}</span>
        </div>
      </section>

      {/* Accesos Rápidos */}
      <section>
        <h2 className="text-lg font-bold text-mm-dark mb-4 px-1">Gestión Principal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div 
            onClick={() => navigate('/admin/horarios')}
            className="bg-mm-surface p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center gap-5"
          >
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <CalendarDaysIcon className="w-7 h-7 text-mm-purple" />
            </div>
            <div>
              <h2 className="text-base font-bold text-mm-dark">Horarios y Grillas</h2>
              <p className="text-xs text-gray-500 mt-1">Ver ocupación, crear clases regulares o reducidas y gestionar reservas.</p>
            </div>
          </div>

          <div 
            onClick={() => navigate('/admin/usuarios')}
            className="bg-mm-surface p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-center gap-5"
          >
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <UsersIcon className="w-7 h-7 text-blue-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-mm-dark">Directorio de Usuarios</h2>
              <p className="text-xs text-gray-500 mt-1">Gestionar alumnos, renovar pagos, ver fichas médicas y asignar planes.</p>
            </div>
          </div>

        </div>
      </section>
      
    </div>
  );
};