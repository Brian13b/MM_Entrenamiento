import { Outlet, NavLink } from 'react-router-dom';
import { HomeIcon, CalendarDaysIcon, UserIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeSolid, CalendarDaysIcon as CalendarSolid, UserIcon as UserSolid } from '@heroicons/react/24/solid';

export const AlumnoLayout = () => {
  return (
    <div className="min-h-screen bg-mm-light pb-20">
      <main className="p-4 max-w-md mx-auto">
        <Outlet />
      </main>

      {/* Menú de Navegación Inferior */}
      <nav className="fixed bottom-0 w-full max-w-md mx-auto bg-mm-dark text-mm-surface rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] left-0 right-0 z-50">
        <div className="flex justify-around items-center h-20 px-4">
          <NavItem to="/alumno" IconOutline={HomeIcon} IconSolid={HomeSolid} label="Inicio" exact />
          <NavItem to="/alumno/clases" IconOutline={CalendarDaysIcon} IconSolid={CalendarSolid} label="Clases" />
          <NavItem to="/alumno/perfil" IconOutline={UserIcon} IconSolid={UserSolid} label="Perfil" />
        </div>
      </nav>
    </div>
  );
};

// Componente auxiliar para los botones del menú
const NavItem = ({ to, IconOutline, IconSolid, label, exact }) => (
  <NavLink 
    to={to} 
    end={exact}
    className={({ isActive }) => 
      `flex flex-col items-center justify-center w-16 transition-colors ${isActive ? 'text-mm-purple' : 'text-gray-400'}`
    }
  >
    {({ isActive }) => (
      <>
        {isActive ? <IconSolid className="w-6 h-6 mb-1" /> : <IconOutline className="w-6 h-6 mb-1" />}
        <span className="text-[10px] font-medium tracking-wide">{label}</span>
      </>
    )}
  </NavLink>
);