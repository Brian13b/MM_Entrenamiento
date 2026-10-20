import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ArrowRightOnRectangleIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/useAuthStore';
import logo from '../assets/Logo_MM_sin_fondo.png';
import { useConfirm } from '../hooks/useConfirm';

export const ProfeLayout = () => {
  const { usuario, logout } = useAuthStore();
  const navigate = useNavigate();
  const [confirmar, confirmDialog] = useConfirm();

  const handleLogout = async () => {
    const ok = await confirmar({
      title: '¿Cerrar sesión?',
      message: 'Vas a salir de tu cuenta en este dispositivo.',
      confirmText: 'Cerrar sesión'
    });
    if (!ok) return;
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-mm-light flex flex-col">
      {confirmDialog}
      <header className="sticky top-0 z-40 bg-mm-light/80 backdrop-blur-md px-4 md:px-8 pt-6 pb-4 w-full max-w-5xl mx-auto flex items-center justify-between">
        <Link to="/profe" className="flex items-center gap-3">
          <img src={logo} alt="Logo MM Entrenamiento" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="text-lg md:text-xl font-bold text-mm-dark font-display tracking-tight">MM Entrenamiento</span>
            <span className="text-xs font-medium text-gray-500">{usuario?.nombreCompleto || 'Profesor'}</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {usuario?.rol === 'Admin' && (
            <Link
              to="/admin"
              title="Volver al panel de administración"
              className="p-2.5 rounded-xl text-gray-500 hover:bg-white transition-colors"
            >
              <Squares2X2Icon className="w-5 h-5" />
            </Link>
          )}
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="p-4 md:p-8 w-full max-w-5xl mx-auto flex-1">
        <Outlet />
      </main>
    </div>
  );
};
