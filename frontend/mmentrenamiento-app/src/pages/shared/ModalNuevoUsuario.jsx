import { useState } from 'react';
import toast from 'react-hot-toast';
import { EnvelopeIcon, LockClosedIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { authService } from '../../services/auth';
import { Modal } from '../../components/ui/Modal';
import { useConfirm } from '../../hooks/useConfirm';

export const ModalNuevoUsuario = ({ isOpen, onClose, onUsuarioCreado }) => {
  const [formData, setFormData] = useState({
    nombreCompleto: '', email: '', password: '', telefono: '', rol: 'Alumno'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [confirmar, confirmDialog] = useConfirm();

  const handleClose = () => {
    if (isLoading) return;
    onClose();
    setTimeout(() => {
      setFormData({ nombreCompleto: '', email: '', password: '', telefono: '', rol: 'Alumno' });
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const ok = await confirmar({
      title: '¿Registrar nuevo usuario?',
      message: <>Se creará la cuenta de <strong className="text-mm-dark">{formData.nombreCompleto}</strong> con rol <strong className="text-mm-dark">{formData.rol}</strong> y el email {formData.email}.</>,
      confirmText: 'Sí, registrar',
      variant: 'primary'
    });
    if (!ok) return;

    try {
      setIsLoading(true);
      await authService.registrarAlumno({
        ...formData,
        telefono: formData.telefono.trim() || null
      });
      toast.success(`${formData.rol} registrado con éxito.`);
      if (onUsuarioCreado) onUsuarioCreado();
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al registrar el usuario.");
    } finally {
      setIsLoading(false);
    }
  };

  const rolesOpciones = ['Alumno', 'Profe', 'Admin'];

  return (
    <>
    <Modal isOpen={isOpen} onClose={handleClose} title="Registrar Nuevo Usuario">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">

        {/* Selector de Rol Tipo Botonera */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Tipo de Usuario</label>
          <div className="grid grid-cols-3 gap-2 bg-mm-light p-1 rounded-xl border border-gray-100">
            {rolesOpciones.map(rol => (
              <button
                key={rol} type="button"
                onClick={() => setFormData({...formData, rol})}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  formData.rol === rol
                    ? 'bg-white shadow-sm text-mm-purple border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {rol}
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex items-center">
          <UserIcon className="w-5 h-5 text-gray-400 absolute left-4" />
          <input
            type="text" required value={formData.nombreCompleto} onChange={(e) => setFormData({...formData, nombreCompleto: e.target.value})}
            placeholder="Nombre y Apellido"
            className="w-full bg-mm-light focus:border-mm-purple focus:bg-white rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none transition-all"
          />
        </div>

        <div className="relative flex items-center">
          <EnvelopeIcon className="w-5 h-5 text-gray-400 absolute left-4" />
          <input
            type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="correo@ejemplo.com"
            className="w-full bg-mm-light focus:border-mm-purple focus:bg-white rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none transition-all"
          />
        </div>

        <div className="relative flex items-center">
          <PhoneIcon className="w-5 h-5 text-gray-400 absolute left-4" />
          <input
            type="text" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})}
            placeholder="Teléfono (Opcional)"
            className="w-full bg-mm-light focus:border-mm-purple focus:bg-white rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none transition-all"
          />
        </div>

        <div className="relative flex items-center">
          <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-4" />
          <input
            type="text" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
            placeholder="Contraseña inicial (Ej: Mm123456!)"
            className="w-full bg-mm-light focus:border-mm-purple focus:bg-white rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none transition-all"
          />
        </div>

        <button
          type="submit" disabled={isLoading}
          className="w-full bg-mm-purple text-white font-bold rounded-xl py-3.5 text-sm mt-2 disabled:opacity-70 transition-all active:scale-95 flex justify-center items-center gap-2"
        >
          {isLoading ? "Creando..." : `Registrar ${formData.rol}`}
        </button>
      </form>
    </Modal>
    {confirmDialog}
    </>
  );
};