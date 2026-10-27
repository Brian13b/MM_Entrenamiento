import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/auth';
import { useConfirm } from '../hooks/useConfirm';
import { useHidratarPerfil } from '../hooks/useHidratarPerfil';
import { urlAvatar } from '../utils/avatar';
import logo from '../assets/Logo_MM_sin_fondo.png';

// Layout compartido por Admin y Profe: Sidebar en desktop y barra inferior en mobile.
export const PanelLayout = ({ items, perfilPath, rolPorDefecto, mensajeCierre }) => {
  const { usuario, logout } = useAuthStore();
  const navigate = useNavigate();
  const [confirmar, confirmDialog] = useConfirm();
  useHidratarPerfil();

  const handleLogout = async () => {
    const ok = await confirmar({
      title: '¿Cerrar sesión?',
      message: mensajeCierre,
      confirmText: 'Cerrar sesión'
    });
    if (!ok) return;
    await authService.logout();
    logout();
    navigate('/login');
  };

  const avatar = urlAvatar(usuario?.nombreCompleto, usuario?.foto);

  return (
    <div className="min-h-screen bg-mm-light flex flex-col md:flex-row pb-20 md:pb-0">
      {confirmDialog}

      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-mm-dark text-white max-h-screen sticky top-0 shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-gray-700">
          <img src={logo} alt="Logo MM Entrenamiento" className="w-8 h-8 object-contain" />
          <span className="text-base text-mm-light font-display tracking-tight">
            MM Entrenamiento
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
          {items.map((item) => <SidebarItem key={item.to} {...item} />)}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <Link
            to={perfilPath}
            title="Mi perfil"
            className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl hover:bg-gray-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-mm-purple shrink-0">
              <img src={avatar} alt="Avatar del usuario" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate">{usuario?.nombreCompleto || rolPorDefecto}</span>
              <span className="text-[10px] text-gray-400 font-medium">Mi perfil</span>
            </div>
          </Link>
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
      <main className="flex-1 min-w-0 w-full">

        {/* Header Mobile */}
        <header className="md:hidden sticky top-0 z-40 bg-mm-light/80 backdrop-blur-md px-4 pt-6 pb-4 w-full flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo MM Entrenamiento" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold text-mm-dark font-display tracking-tight">
              MM Entrenamiento
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link to={perfilPath} title="Mi perfil" className="w-10 h-10 rounded-full overflow-hidden border-2 border-mm-purple shadow-sm bg-purple-50 flex items-center justify-center">
              <img src={avatar} alt="Avatar del usuario" className="w-full h-full object-cover" />
            </Link>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-6 h-6" />
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 w-full bg-mm-dark text-mm-surface shadow-[0_-4px_20px_rgba(0,0,0,0.1)] left-0 right-0 z-50">
        <div className="flex justify-around items-center h-20 px-4">
          {items.map((item) => <NavItem key={item.to} {...item} />)}
        </div>
      </nav>
    </div>
  );
};

const NavItem = ({ to, label, labelCorto, Outline, Solid, exact }) => (
  <NavLink
    to={to}
    end={exact}
    className={({ isActive }) =>
      `flex flex-col items-center justify-center w-16 transition-colors ${isActive ? 'text-mm-purple' : 'text-gray-400 hover:text-gray-300'}`
    }
  >
    {({ isActive }) => (
      <>
        {isActive ? <Solid className="w-6 h-6 mb-1" /> : <Outline className="w-6 h-6 mb-1" />}
        <span className="text-[10px] font-bold tracking-wide">{labelCorto || label}</span>
      </>
    )}
  </NavLink>
);

const SidebarItem = ({ to, label, Outline, Solid, exact }) => (
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
        {isActive ? <Solid className="w-5 h-5" /> : <Outline className="w-5 h-5" />}
        {label}
      </>
    )}
  </NavLink>
);
