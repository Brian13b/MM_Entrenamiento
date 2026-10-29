import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

import { authService } from '../../services/auth';
import logoMM from '../../assets/Logo-MM.png';

const inputClase = 'w-full bg-mm-light border-transparent focus:border-mm-purple focus:bg-white focus:ring-0 rounded-2xl pl-11 pr-12 py-3.5 text-sm transition-all outline-none';

export const RestablecerPassword = () => {
  const [params] = useSearchParams();
  const email = params.get('email');
  const token = params.get('token');

  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const navigate = useNavigate();
  const enlaceValido = Boolean(email && token);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (nuevaPassword.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres.');
    if (nuevaPassword !== confirmacion) return toast.error('Las contraseñas no coinciden.');

    try {
      setGuardando(true);
      await authService.resetearPassword(email, token, nuevaPassword);
      toast.success('¡Contraseña actualizada! Ya podés iniciar sesión.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo restablecer la contraseña.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-mm-light flex flex-col justify-center items-center p-4">
      <div className="bg-mm-surface w-full max-w-sm rounded-4xl p-8 shadow-sm border border-gray-100 animate-fade-in">
        <div className="flex flex-col items-center mb-8 gap-3">
          <img src={logoMM} alt="Logo MM Entrenamiento" className="w-20 h-20" />
          <h1 className="font-display font-bold text-mm-dark text-xl text-center tracking-wide">Nueva contraseña</h1>
          {enlaceValido && <p className="text-gray-400 text-sm font-medium text-center break-all">{email}</p>}
        </div>

        {!enlaceValido ? (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-sm text-gray-500">El enlace es inválido o está incompleto. Pedí uno nuevo desde el inicio de sesión.</p>
            <Link to="/login" className="w-full bg-mm-purple text-white font-bold rounded-2xl py-4 text-sm">Ir a iniciar sesión</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-mm-dark text-sm font-bold ml-1">Nueva contraseña</label>
              <div className="relative flex items-center">
                <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-4" />
                <input
                  type={mostrar ? 'text' : 'password'} required autoComplete="new-password"
                  value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)}
                  placeholder="••••••••" className={inputClase}
                />
                <button
                  type="button" onClick={() => setMostrar(!mostrar)}
                  className="absolute right-3 p-1 text-gray-400 hover:text-mm-purple transition-colors rounded-full focus:outline-none"
                >
                  {mostrar ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-mm-dark text-sm font-bold ml-1">Repetí la contraseña</label>
              <div className="relative flex items-center">
                <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-4" />
                <input
                  type={mostrar ? 'text' : 'password'} required autoComplete="new-password"
                  value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)}
                  placeholder="••••••••" className={inputClase}
                />
              </div>
            </div>

            <button
              type="submit" disabled={guardando}
              className={`w-full bg-mm-purple text-white font-bold rounded-2xl py-4 text-sm transition-all ${guardando ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg active:scale-[0.98]'}`}
            >
              {guardando ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
