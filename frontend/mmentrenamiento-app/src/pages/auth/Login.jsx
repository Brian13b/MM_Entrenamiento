import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon 
} from '@heroicons/react/24/outline';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const navigate = useNavigate();
  const loginUser = useAuthStore((state) => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await authService.login(email, password);
      
      let rolPrincipal = 'Alumno';
      
      if (data.roles && data.roles.length > 0) {
        if (data.roles.includes('Admin')) {
          rolPrincipal = 'Admin';
        } else if (data.roles.includes('Profe')) {
          rolPrincipal = 'Profe';
        } else {
          rolPrincipal = data.roles[0];
        }
      }

      const usuarioLogueado = {
        id: data.usuarioId,
        nombreCompleto: data.nombreCompleto,
        email: data.email,
        rol: rolPrincipal
      };

      loginUser(usuarioLogueado, data.token);
      
      toast.dismiss();
      setIsTransitioning(true);

      setTimeout(() => {
        if (rolPrincipal === 'Admin') {
          navigate('/admin', { replace: true });
        } else if (rolPrincipal === 'Profe') {
          navigate('/profe', { replace: true });
        } else {
          navigate('/alumno', { replace: true });
        }
      }, 800);

    } catch (err) {
      setIsTransitioning(false);
      setIsLoading(false);
      const mensajeError = err.response?.data?.message || 'Error al ingresar.';
      toast.error(mensajeError);
    }
  };

  return (
    <div className="relative min-h-screen bg-mm-light flex flex-col justify-center items-center p-4 overflow-hidden">
      
      <div className="bg-mm-surface w-full max-w-sm rounded-4xl p-8 shadow-sm border border-gray-100 animate-fade-in z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <img src="src\assets\Logo-MM.png" alt="Logo MM Entrenamiento" className="w-20 h-20" />
          <h1 className="font-display font-bold text-mm-dark text-xl text-center tracking-wide">
            MM Entrenamiento
          </h1>
          <p className="text-gray-400 text-sm font-medium">Ingresá a tu cuenta</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* Input Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-mm-dark text-sm font-bold ml-1">Email</label>
            <div className="relative flex items-center">
              <EnvelopeIcon className="w-5 h-5 text-gray-400 absolute left-4" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-mm-light border-transparent focus:border-mm-purple focus:bg-white focus:ring-0 rounded-2xl pl-11 pr-4 py-3.5 text-sm transition-all outline-none"
              />
            </div>
          </div>

          {/* Input Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-mm-dark text-sm font-bold ml-1">Contraseña</label>
            <div className="relative flex items-center">
              <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-4" />
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-mm-light border-transparent focus:border-mm-purple focus:bg-white focus:ring-0 rounded-2xl pl-11 pr-12 py-3.5 text-sm transition-all outline-none"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 text-gray-400 hover:text-mm-purple transition-colors rounded-full focus:outline-none focus:bg-purple-50"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Botón Submit */}
          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full bg-mm-purple text-white font-bold rounded-2xl py-4 text-sm transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-opacity-90 hover:shadow-lg active:scale-[0.98]'}`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ingresando...
              </>
            ) : (
              'Ingresar'
            )}
          </button>

          {/* Recuperar contraseña */}
          <div className="flex justify-end -mt-2 mb-2">
            <button 
              type="button" 
              onClick={() => toast('Módulo de recuperación en desarrollo', { icon: '🚧' })}
              className="text-mm-purple text-xs font-bold hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

        </form>

      </div>

      <div 
        className={`fixed inset-0 bg-mm-purple z-50 flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.645,0.045,0.355,1)] ${
          isTransitioning ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className={`font-display text-white text-5xl transition-opacity duration-500 delay-300 tracking-wide ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}>
          MM Entrenamiento
        </div>
      </div>

    </div>
  );
};