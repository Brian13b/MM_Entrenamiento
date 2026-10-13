import { useState } from 'react';
import toast from 'react-hot-toast';
import { EnvelopeIcon, LockClosedIcon, UserIcon, IdentificationIcon } from '@heroicons/react/24/outline';
import { authService } from '../../../services/auth';
import { Modal } from '../../../components/ui//Modal'; 

export const ModalNuevoUsuario = ({ isOpen, onClose, onUsuarioCreado }) => {
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    password: '',
    rol: 'Alumno'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    if (isLoading) return;
    onClose();
    setTimeout(() => {
      setFormData({ nombreCompleto: '', email: '', password: '', rol: 'Alumno' });
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await authService.registrarUsuario(formData);
      
      toast.success(`${formData.rol} registrado con éxito.`);
      if (onUsuarioCreado) onUsuarioCreado(); 
      handleClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al registrar el usuario.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Registrar Nuevo Usuario">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
        
        {/* Nombre Completo */}
        <div className="relative flex items-center">
          <UserIcon className="w-5 h-5 text-gray-400 absolute left-4" />
          <input 
            type="text" 
            required
            value={formData.nombreCompleto}
            onChange={(e) => setFormData({...formData, nombreCompleto: e.target.value})}
            placeholder="Nombre y Apellido"
            className="w-full bg-mm-light focus:border-mm-purple focus:bg-white rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none transition-all"
          />
        </div>

        {/* Email */}
        <div className="relative flex items-center">
          <EnvelopeIcon className="w-5 h-5 text-gray-400 absolute left-4" />
          <input 
            type="email" 
            required
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="correo@ejemplo.com"
            className="w-full bg-mm-light focus:border-mm-purple focus:bg-white rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none transition-all"
          />
        </div>

        {/* Contraseña */}
        <div className="relative flex items-center">
          <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-4" />
          <input 
            type="text"
            required
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            placeholder="Contraseña inicial (Ej: Mm123456!)"
            className="w-full bg-mm-light focus:border-mm-purple focus:bg-white rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none transition-all"
          />
        </div>

        {/* Selector de Rol */}
        <div className="relative flex items-center">
          <IdentificationIcon className="w-5 h-5 text-gray-400 absolute left-4 pointer-events-none" />
          <select
            value={formData.rol}
            onChange={(e) => setFormData({...formData, rol: e.target.value})}
            className="w-full bg-mm-light focus:border-mm-purple focus:bg-white rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="Alumno">Alumno</option>
            <option value="Profe">Profesor</option>
            <option value="Admin">Administrador</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-mm-purple text-white font-bold rounded-xl py-3.5 text-sm mt-2 disabled:opacity-70 transition-all active:scale-95 flex justify-center items-center gap-2"
        >
          {isLoading ? "Creando..." : "Registrar Usuario"}
        </button>
      </form>
    </Modal>
  );
};