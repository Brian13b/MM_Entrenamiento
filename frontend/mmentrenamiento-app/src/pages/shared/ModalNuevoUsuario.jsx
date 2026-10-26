import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { EnvelopeIcon, LockClosedIcon, UserIcon, PhoneIcon, ArrowRightIcon, ForwardIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { authService } from '../../services/auth';
import { administracionService } from '../../services/administracionService';
import { membresiasService } from '../../services/membresiasService';
import { Modal } from '../../components/ui/Modal';
import { useConfirm } from '../../hooks/useConfirm';

export const ModalNuevoUsuario = ({ isOpen, onClose, onUsuarioCreado }) => {
  const [paso, setPaso] = useState(1); 
  const [nuevoUsuarioId, setNuevoUsuarioId] = useState(null);

  const [formData, setFormData] = useState({
    nombreCompleto: '', email: '', password: '', telefono: '', rol: 'Alumno'
  });
  
  const [membresias, setMembresias] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmar, confirmDialog] = useConfirm();

  useEffect(() => {
    if (isOpen) {
      administracionService.getMembresiasActivas()
        .then(res => setMembresias(res || []))
        .catch(err => console.error("Error cargando membresías", err));
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isLoading) return;
    onClose();
    setTimeout(() => {
      setPaso(1);
      setNuevoUsuarioId(null);
      setFormData({ nombreCompleto: '', email: '', password: '', telefono: '', rol: 'Alumno' });
    }, 300);
  };

  // --- PASO 1: CREAR USUARIO ---
  const handleCrearUsuario = async (e) => {
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
      const payload = {
        ...formData,
        telefono: formData.telefono.trim() || null
      };

      const respuesta = await authService.registrarAlumno(payload);
      toast.success(`${formData.rol} registrado con éxito.`);
      
      if (onUsuarioCreado) onUsuarioCreado();

      const idGenerado = respuesta?.usuarioId || respuesta?.id || respuesta?.data?.usuarioId || respuesta?.data?.id;

      if (formData.rol === 'Alumno' && idGenerado) {
        setNuevoUsuarioId(idGenerado);
        setPaso(2);
      } else {
        handleClose();
      }

    } catch (err) {
      toast.error(err.response?.data?.message || "Error al registrar el usuario.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- PASO 2: ASIGNAR MEMBRESÍA ---
  const handleAsignarMembresia = async (membresiaId) => {
    try {
      setIsLoading(true);
      await membresiasService.asignarMembresia({usuarioId: nuevoUsuarioId, membresiaId: Number(membresiaId)});
      toast.success('Membresía asignada correctamente.');
      if (onUsuarioCreado) onUsuarioCreado();
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al asignar la membresía.");
    } finally {
      setIsLoading(false);
    }
  };

  const rolesOpciones = ['Alumno', 'Profe', 'Admin'];

  return (
    <>
    <Modal isOpen={isOpen} onClose={handleClose} title={paso === 1 ? "Registrar Nuevo Usuario" : "Asignar Plan Inicial"}>
      
      {/* PANTALLA 1: REGISTRO */}
      {paso === 1 && (
        <form onSubmit={handleCrearUsuario} className="flex flex-col gap-4 mt-2 animate-fade-in">
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
            {isLoading ? "Procesando..." : formData.rol === 'Alumno' ? <><ArrowRightIcon className="w-4 h-4"/> Continuar</> : `Registrar ${formData.rol}`}
          </button>
        </form>
      )}

      {/* PANTALLA 2: SELECCIÓN DE MEMBRESÍA */}
      {paso === 2 && (
        <div className="flex flex-col gap-4 mt-2 animate-fade-in">
          <p className="text-sm text-gray-500 mb-2">
            El alumno <strong className="text-mm-dark">{formData.nombreCompleto}</strong> fue registrado con éxito. ¿Querés asignarle un plan ahora?
          </p>

          <div className="flex flex-col gap-3 max-h-75 overflow-y-auto pr-1">
            {membresias.map(m => (
              <button
                key={m.id}
                onClick={() => handleAsignarMembresia(m.id)}
                disabled={isLoading}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl hover:border-mm-purple hover:bg-purple-50 transition-all text-left disabled:opacity-50"
              >
                <div>
                  <p className="font-bold text-mm-dark text-sm">{m.nombre}</p>
                  <p className="text-xs text-gray-500 mt-1">{m.creditosOtorgados} clases | {m.limiteTurnosFijos} fijos</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-lg">
                    ${m.precio}
                  </span>
                  <CheckCircleIcon className="w-5 h-5 text-gray-300" />
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleClose}
            disabled={isLoading}
            className="w-full mt-2 bg-mm-light text-mm-dark font-bold rounded-xl py-3.5 text-sm hover:bg-gray-200 transition-all active:scale-95 flex justify-center items-center gap-2"
          >
            <ForwardIcon className="w-4 h-4" /> Omitir por ahora
          </button>
        </div>
      )}

    </Modal>
    {confirmDialog}
    </>
  );
};