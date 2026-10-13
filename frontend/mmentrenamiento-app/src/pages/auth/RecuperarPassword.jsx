import { useState } from 'react';
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { authService } from '../../services/auth';
import { Modal } from '../../components/ui/Modal';

export const RecuperarPassword = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [isRecovering, setIsRecovering] = useState(false);
  
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleClose = () => {
    if (isRecovering) return;
    onClose();
    setTimeout(() => {
      setStep(1);
      setToken('');
      setNewPassword('');
      setShowPassword(false);
    }, 300);
  };

  const handleSolicitar = async (e) => {
    e.preventDefault();
    try {
      setIsRecovering(true);
      await authService.solicitarRecuperacion(email);
      toast.success("Si el email está registrado, se envió un código a tu correo.");
      setStep(2);
    } catch (err) {
      toast.error("Error al conectar con el servidor.");
      console.error(err);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleResetear = async (e) => {
    e.preventDefault();
    try {
      setIsRecovering(true);
      await authService.resetearPassword(email, token, newPassword);
      toast.success("¡Contraseña actualizada! Ya podés iniciar sesión.");
      
      if (onSuccess) onSuccess(email);
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al recuperar la contraseña. Revisá el código.");
      console.error(err);
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={step === 1 ? "Recuperar Contraseña" : "Ingresar Código"}
    >
      {step === 1 ? (
        <form onSubmit={handleSolicitar} className="flex flex-col gap-4 mt-2">
          <p className="text-sm text-gray-500">
            Ingresá tu correo electrónico y te enviaremos las instrucciones para recuperar tu clave.
          </p>
          <div className="relative flex items-center">
            <EnvelopeIcon className="w-5 h-5 text-gray-400 absolute left-4" />
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full bg-mm-light focus:border-mm-purple focus:bg-white rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none transition-all"
            />
          </div>
          <button 
            type="submit" 
            disabled={isRecovering}
            className="w-full bg-mm-dark text-white font-bold rounded-xl py-3 text-sm mt-2 disabled:opacity-70 transition-all active:scale-95"
          >
            {isRecovering ? "Procesando..." : "Enviar código"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetear} className="flex flex-col gap-4 mt-2">
          <p className="text-sm text-gray-500">
            Revisá tu correo e ingresá el código de seguridad.
          </p>
          
          <input 
            type="text" 
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Pegá el código acá"
            className="w-full bg-mm-light focus:border-mm-purple focus:bg-white rounded-2xl px-4 py-3.5 text-sm outline-none font-mono text-center tracking-widest transition-all"
          />

          <div className="relative flex items-center mt-2">
            <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-4" />
            <input 
              type={showPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nueva contraseña"
              className="w-full bg-mm-light focus:border-mm-purple focus:bg-white rounded-2xl pl-11 pr-12 py-3.5 text-sm outline-none transition-all"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 p-1 text-gray-400 hover:text-mm-purple"
            >
              {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>

          <button 
            type="submit" 
            disabled={isRecovering}
            className="w-full bg-mm-purple text-white font-bold rounded-xl py-3 text-sm mt-2 disabled:opacity-70 transition-all active:scale-95"
          >
            {isRecovering ? "Guardando..." : "Confirmar"}
          </button>
        </form>
      )}
    </Modal>
  );
};