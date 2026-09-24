import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { HomeIcon, CalendarDaysIcon, UsersIcon, Cog8ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeSolid, CalendarDaysIcon as CalendarSolid, UsersIcon as UsersSolid, Cog8ToothIcon as CogSolid } from '@heroicons/react/24/solid';

export const AdminLayout = () => {
  const { usuario, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-mm-light flex flex-col md:flex-row pb-20 md:pb-0">
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-mm-dark text-white max-h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3 border-b border-gray-700">
          <img src="src\assets\Logo_MM_sin_fondo.png" alt="Logo MM Entrenamiento" className="w-8 h-8 object-contain" />
          <span className="text-lg font-bold text-mm-light font-display tracking-tight">
              MM Entrenamiento
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
          <SidebarItem to="/admin" IconOutline={HomeIcon} IconSolid={HomeSolid} label="Panel" exact />
          <SidebarItem to="/admin/horarios" IconOutline={CalendarDaysIcon} IconSolid={CalendarSolid} label="Horarios" />
          <SidebarItem to="/admin/usuarios" IconOutline={UsersIcon} IconSolid={UsersSolid} label="Usuarios" />
          <SidebarItem to="/admin/ajustes" IconOutline={Cog8ToothIcon} IconSolid={CogSolid} label="Ajustes" />
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-mm-purple shrink-0">
               <img
                  src={usuario?.foto || `https://plus.unsplash.com/premium_photo-1689568126014-06fea9d5d341?q=80&w=80&h=80&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`}
                  alt="Avatar del usuario"
                  className="w-full h-full object-cover"
                />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate">{usuario?.nombreCompleto || 'Administrador'}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-bold"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 w-full max-w-5xl mx-auto md:max-w-none">
        
        {/* Header Mobile */}
        <header className="md:hidden sticky top-0 z-40 bg-mm-light/80 backdrop-blur-md px-4 pt-6 pb-4 w-full flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img src="src\assets\Logo_MM_sin_fondo.png" alt="Logo MM Entrenamiento" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold text-mm-dark font-display tracking-tight">
                MM Entrenamiento
            </span>
          </div>

          {/* Avatar del Usuario */}
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-mm-purple shadow-sm bg-purple-50 flex items-center justify-center">
            <img
                src={usuario?.foto || `https://plus.unsplash.com/premium_photo-1689568126014-06fea9d5d341?q=80&w=80&h=80&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`}
                alt="Avatar del usuario"
                className="w-full h-full object-cover"
            />
          </div>
        </header>

        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 w-full bg-mm-dark text-mm-surface shadow-[0_-4px_20px_rgba(0,0,0,0.1)] left-0 right-0 z-50">
        <div className="flex justify-around items-center h-20 px-4">
          <NavItem to="/admin" IconOutline={HomeIcon} IconSolid={HomeSolid} label="Inicio" exact />
          <NavItem to="/admin/horarios" IconOutline={CalendarDaysIcon} IconSolid={CalendarSolid} label="Horarios" />
          <NavItem to="/admin/usuarios" IconOutline={UsersIcon} IconSolid={UsersSolid} label="Usuarios" />
          <NavItem to="/admin/ajustes" IconOutline={Cog8ToothIcon} IconSolid={CogSolid} label="Ajustes" />
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
      `flex flex-col items-center justify-center w-16 transition-colors ${isActive ? 'text-mm-purple' : 'text-gray-400 hover:text-gray-300'}`
    }
  >
    {({ isActive }) => (
      <>
        {isActive ? <IconSolid className="w-6 h-6 mb-1" /> : <IconOutline className="w-6 h-6 mb-1" />}
        <span className="text-[10px] font-bold tracking-wide">{label}</span>
      </>
    )}
  </NavLink>
);

const SidebarItem = ({ to, IconOutline, IconSolid, label, exact }) => (
  <NavLink
    to={to}
    end={exact}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
        isActive ? 'bg-mm-purple text-white shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`
    }
  >
    {({ isActive }) => (
      <>
        {isActive ? <IconSolid className="w-5 h-5" /> : <IconOutline className="w-5 h-5" />}
        {label}
      </>
    )}
  </NavLink>
);