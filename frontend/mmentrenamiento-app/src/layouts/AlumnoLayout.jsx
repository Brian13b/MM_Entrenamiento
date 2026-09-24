import { Outlet, NavLink } from 'react-router-dom';
import { HomeIcon, CalendarDaysIcon, UserIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeSolid, CalendarDaysIcon as CalendarSolid, UserIcon as UserSolid } from '@heroicons/react/24/solid';
import { useAuthStore } from '../store/useAuthStore';

export const AlumnoLayout = () => {
  const { usuario } = useAuthStore();

  return (
    <div className="min-h-screen bg-mm-light pb-20 flex flex-col">
      
      {/* Header Superior */}
      <header className="sticky top-0 z-40 bg-mm-light/80 backdrop-blur-md px-4 md:px-8 pt-6 pb-4 w-full max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="src\assets\Logo_MM_sin_fondo.png" alt="Logo MM Entrenamiento" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
          <span className="text-lg md:text-xl font-bold text-mm-dark font-display tracking-tight">
            MM Entrenamiento
          </span>
        </div>

        {/* Avatar del Usuario */}
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-mm-purple shadow-sm bg-purple-50 flex items-center justify-center">
          <img
            src={usuario?.foto || `https://plus.unsplash.com/premium_photo-1689568126014-06fea9d5d341?q=80&w=80&h=80&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`}
            alt="Avatar del usuario"
            className="w-full h-full object-cover"
          />
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="p-4 md:p-8 w-full max-w-5xl mx-auto flex-1">
        <Outlet />
      </main>

      {/* Menú de Navegación Inferior */}
      <nav className="fixed bottom-0 w-full bg-mm-dark text-mm-surface shadow-[0_-4px_20px_rgba(0,0,0,0.1)] left-0 right-0 z-50">
        <div className="flex justify-around items-center h-20 px-4 max-w-5xl mx-auto">
          <NavItem to="/alumno" IconOutline={HomeIcon} IconSolid={HomeSolid} label="Inicio" exact />
          <NavItem to="/alumno/clases" IconOutline={CalendarDaysIcon} IconSolid={CalendarSolid} label="Clases" />
          <NavItem to="/alumno/perfil" IconOutline={UserIcon} IconSolid={UserSolid} label="Perfil" />
        </div>
      </nav>
      
    </div>
  );
};

const NavItem = ({ to, IconOutline, IconSolid, label, exact }) => (
  <NavLink 
    to={to} 
    end={exact}
    className={({ isActive }) => 
      `flex flex-col items-center justify-center w-20 transition-colors ${isActive ? 'text-mm-purple' : 'text-gray-400 hover:text-gray-300'}`
    }
  >
    {({ isActive }) => (
      <>
        {isActive ? <IconSolid className="w-6 h-6 md:w-7 md:h-7 mb-1" /> : <IconOutline className="w-6 h-6 md:w-7 md:h-7 mb-1" />}
        <span className="text-[10px] md:text-xs font-bold tracking-wide">{label}</span>
      </>
    )}
  </NavLink>
);