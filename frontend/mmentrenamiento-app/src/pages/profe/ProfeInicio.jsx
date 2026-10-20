import { useNavigate } from 'react-router-dom';
import { CalendarDaysIcon, UsersIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/useAuthStore';

export const ProfeInicio = () => {
  const navigate = useNavigate();
  const nombreProfe = useAuthStore((state) => state.usuario?.nombreCompleto);

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-10">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-black text-mm-dark">Bienvenido, {nombreProfe || 'Profe'}</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base font-medium">Panel de control y accesos rápidos.</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Turnos */}
        <button
          onClick={() => navigate('/profe/turnos')}
          className="bg-mm-surface p-6 rounded-4xl border border-gray-100 shadow-sm hover:shadow-md hover:border-mm-purple transition-all group flex flex-col items-start text-left"
        >
          <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <CalendarDaysIcon className="w-7 h-7 text-mm-purple" />
          </div>
          <h2 className="text-lg font-bold text-mm-dark">Grilla de Turnos</h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">Ver las clases del día y tomar asistencia.</p>
        </button>

        {/* Usuarios */}
        <button
          onClick={() => navigate('/profe/usuarios')}
          className="bg-mm-surface p-6 rounded-4xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group flex flex-col items-start text-left"
        >
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UsersIcon className="w-7 h-7 text-blue-500" />
          </div>
          <h2 className="text-lg font-bold text-mm-dark">Alumnos</h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">Buscar alumnos y revisar sus fichas técnicas.</p>
        </button>

        {/* Mi Perfil */}
        <button
          onClick={() => navigate('/profe/perfil')}
          className="bg-mm-surface p-6 rounded-4xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group flex flex-col items-start text-left"
        >
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UserCircleIcon className="w-7 h-7 text-orange-500" />
          </div>
          <h2 className="text-lg font-bold text-mm-dark">Mi Perfil</h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">Actualizar tus datos personales y foto.</p>
        </button>
      </section>
    </div>
  );
};