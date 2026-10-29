import { useState } from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { authService } from '../../services/auth';
import { Modal } from '../../components/ui/Modal';

export const RecuperarPassword = ({ isOpen, onClose }) => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [email, setEmail] = useState('');

  const handleClose = () => {
    if (isRecovering) return;
    onClose();
    setTimeout(() => setEnviado(false), 300);
  };

  const handleSolicitar = async (e) => {
    e.preventDefault();
    try {
      setIsRecovering(true);
      await authService.solicitarRecuperacion(email);
      setEnviado(true);
    } catch (err) {
      if (err.response?.status === 429) {
        toast.error(err.response.data?.message || 'Demasiados intentos. Probá de nuevo en unos minutos.');
      } else {
        toast.error('Error al conectar con el servidor.');
      }
      console.error(err);
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Recuperar Contraseña">
      {enviado ? (
        <div className="flex flex-col gap-4 mt-2">
          <p className="text-sm text-gray-500">
            Si <span className="font-bold text-mm-dark">{email}</span> está registrado, te enviamos un enlace para elegir una nueva contraseña.
            Revisá también la carpeta de spam.
          </p>
          <button
            type="button" onClick={handleClose}
            className="w-full bg-mm-dark text-white font-bold rounded-xl py-3 text-sm transition-all active:scale-95"
          >
            Entendido
          </button>
        </div>
      ) : (
        <form onSubmit={handleSolicitar} className="flex flex-col gap-4 mt-2">
          <p className="text-sm text-gray-500">
            Ingresá tu correo electrónico y te enviaremos un enlace para recuperar tu clave.
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
            {isRecovering ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>
      )}
    </Modal>
  );
};
