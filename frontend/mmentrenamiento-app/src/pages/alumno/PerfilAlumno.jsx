import { useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import { usuarioService } from '../../services/usuarioService';
import { authService } from '../../services/auth';
import { seguimientoService } from '../../services/seguimientoService';
import { Modal } from '../../components/ui/Modal';
import { useConfirm } from '../../hooks/useConfirm';
import {
  PencilIcon,
  LockClosedIcon,
  CloudIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const formatearVencimiento = (fechaIso) => {
  if (!fechaIso) return '';
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
};

const textoPlan = (plan) => {
  if (!plan) return { valor: '—', detalle: 'Sin plan asignado' };
  if (plan.vecesPorSemana > 0) return { valor: plan.vecesPorSemana, detalle: 'veces por semana' };
  return { valor: null, detalle: 'Turnos Eventuales' };
};

export const PerfilAlumno = () => {
  const logout = useAuthStore((state) => state.logout);
  const [confirmar, confirmDialog] = useConfirm();
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const fileInputRef = useRef(null);

  const [subiendoFoto, setSubiendoFoto] = useState(false);

  const [modalPerfil, setModalPerfil] = useState(false);
  const [formPerfil, setFormPerfil] = useState({ nombreCompleto: '', telefono: '' });
  const [modalPassword, setModalPassword] = useState(false);
  const [formPassword, setFormPassword] = useState({ actual: '', nueva: '', confirmar: '' });
  const [guardando, setGuardando] = useState(false);

  const cargarResumen = useCallback(async () => {
    try {
      setCargando(true);
      setError(false);
      const data = await usuarioService.getMiResumen();
      setResumen(data);

      const { usuario: actual, setUsuario } = useAuthStore.getState();
      setUsuario({ ...actual, nombreCompleto: data.nombreCompleto, foto: data.fotoPerfilUrl });
    } catch (err) {
      console.error('Error al cargar el resumen del perfil', err);
      setError(true);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarResumen();
  }, [cargarResumen]);

  const handleCambiarFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setSubiendoFoto(true);
      const { url } = await usuarioService.subirFotoPerfil(file);
      setResumen(prev => ({ ...prev, fotoPerfilUrl: url }));
      const { usuario: actual, setUsuario } = useAuthStore.getState();
      setUsuario({ ...actual, foto: url });
      toast.success('Foto actualizada correctamente.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al subir la foto de perfil.');
      console.error(err);
    } finally {
      setSubiendoFoto(false);
      e.target.value = '';
    }
  };

  const abrirEditarPerfil = () => {
    setFormPerfil({ nombreCompleto: resumen.nombreCompleto, telefono: resumen.telefono || '' });
    setModalPerfil(true);
  };

  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      await usuarioService.actualizarMiPerfil({
        nombreCompleto: formPerfil.nombreCompleto.trim(),
        telefono: formPerfil.telefono.trim() || null
      });
      toast.success('Perfil actualizado.');
      setModalPerfil(false);
      await cargarResumen();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo actualizar el perfil.');
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    if (formPassword.nueva !== formPassword.confirmar) return toast.error('Las contraseñas nuevas no coinciden.');
    try {
      setGuardando(true);
      await authService.cambiarPassword(formPassword.actual, formPassword.nueva);
      toast.success('Contraseña actualizada.');
      setModalPassword(false);
      setFormPassword({ actual: '', nueva: '', confirmar: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setGuardando(false);
    }
  };

  const handleVerPlan = async () => {
    try {
      const plan = await seguimientoService.getMiPlan();
      if (/^https?:\/\//i.test(plan.driveItemId)) {
        window.open(plan.driveItemId, '_blank', 'noopener');
      } else {
        toast.error('El plan vinculado no tiene un enlace válido. Consultá con tu profe.');
      }
    } catch (err) {
      if (err.response?.status === 404) toast('Todavía no tenés un plan de entrenamiento vinculado.');
      else toast.error('No se pudo abrir el plan.');
    }
  };

  const handleLogout = async () => {
    const ok = await confirmar({
      title: '¿Cerrar sesión?',
      message: 'Vas a salir de tu cuenta en este dispositivo.',
      confirmText: 'Cerrar sesión'
    });
    if (ok) logout();
  };

  if (cargando) return <div className="text-center p-8 text-gray-500 animate-fade-in">Cargando perfil...</div>;

  if (error || !resumen) {
    return (
      <div className="text-center p-8 animate-fade-in">
        <p className="text-sm font-medium text-gray-500 mb-4">No pudimos cargar tu perfil.</p>
        <button onClick={cargarResumen} className="bg-mm-purple text-white px-6 py-2 rounded-full font-semibold text-sm">
          Reintentar
        </button>
      </div>
    );
  }

  const { estadisticas, plan, fichaTecnica } = resumen;
  const planTexto = textoPlan(plan);
  const inputClase = 'w-full bg-mm-light focus:border-mm-purple focus:bg-white rounded-2xl px-4 py-3.5 text-sm outline-none transition-all';

  return (
    <div className="max-w-md mx-auto bg-mm-light min-h-screen pb-24 p-4 space-y-4 animate-fade-in font-sans">
      {confirmDialog}

      <Modal isOpen={modalPerfil} onClose={() => !guardando && setModalPerfil(false)} title="Editar perfil">
        <form onSubmit={handleGuardarPerfil} className="flex flex-col gap-4 mt-2">
          <input
            type="text" required value={formPerfil.nombreCompleto} placeholder="Nombre y Apellido"
            onChange={(e) => setFormPerfil({ ...formPerfil, nombreCompleto: e.target.value })}
            className={inputClase}
          />
          <input
            type="tel" value={formPerfil.telefono} placeholder="Teléfono"
            onChange={(e) => setFormPerfil({ ...formPerfil, telefono: e.target.value })}
            className={inputClase}
          />
          <button type="submit" disabled={guardando} className="w-full bg-mm-purple text-white font-bold rounded-xl py-3.5 text-sm disabled:opacity-70">
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={modalPassword} onClose={() => !guardando && setModalPassword(false)} title="Cambiar contraseña">
        <form onSubmit={handleCambiarPassword} className="flex flex-col gap-4 mt-2">
          <input
            type="password" required value={formPassword.actual} placeholder="Contraseña actual"
            onChange={(e) => setFormPassword({ ...formPassword, actual: e.target.value })}
            className={inputClase}
          />
          <input
            type="password" required value={formPassword.nueva} placeholder="Nueva contraseña"
            onChange={(e) => setFormPassword({ ...formPassword, nueva: e.target.value })}
            className={inputClase}
          />
          <input
            type="password" required value={formPassword.confirmar} placeholder="Repetí la nueva contraseña"
            onChange={(e) => setFormPassword({ ...formPassword, confirmar: e.target.value })}
            className={inputClase}
          />
          <button type="submit" disabled={guardando} className="w-full bg-mm-purple text-white font-bold rounded-xl py-3.5 text-sm disabled:opacity-70">
            {guardando ? 'Guardando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </Modal>

      {/* TARJETA PRINCIPAL: Info del Usuario */}
      <section className="bg-mm-surface rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
        <div
          className="relative w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-mm-light cursor-pointer group"
          onClick={() => !subiendoFoto && fileInputRef.current?.click()}
        >
          <img
            src={resumen.fotoPerfilUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(resumen.nombreCompleto)}&background=f5f6fb&color=8e57a4`}
            alt="Perfil"
            className={`w-full h-full object-cover ${subiendoFoto ? 'opacity-40' : ''}`}
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <PencilIcon className="w-6 h-6 text-white" />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCambiarFoto}
            className="hidden"
            accept="image/*"
          />
        </div>

        <h2 className="text-2xl font-display font-bold text-mm-dark tracking-wider">
          {resumen.nombreCompleto}
        </h2>
        <p className="text-gray-500 text-sm mb-4">{resumen.email}</p>

        <button
          onClick={abrirEditarPerfil}
          className="bg-mm-purple/10 text-mm-purple px-6 py-2 rounded-full font-semibold text-sm hover:bg-mm-purple/20 transition-colors"
        >
          Editar perfil
        </button>
      </section>

      {/* MÉTRICAS: Semana y Racha */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-mm-dark rounded-3xl p-5 text-white shadow-sm flex flex-col justify-between">
          <p className="text-gray-400 text-sm font-medium mb-1">Esta semana</p>
          <div className="text-4xl font-display font-bold mb-1 text-mm-purple">{estadisticas.clasesAsistidasSemana}</div>
          <p className="text-sm font-medium">{estadisticas.clasesAsistidasSemana === 1 ? 'clase asistida' : 'clases asistidas'}</p>
        </div>

        <div className="bg-mm-surface rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
          <p className="text-gray-500 text-sm font-medium mb-1">Racha actual</p>
          <div className="text-4xl font-display font-bold mb-1 text-mm-purple">{estadisticas.rachaActual}</div>
          <p className="text-sm font-medium text-gray-700">{estadisticas.rachaActual === 1 ? 'clase seguida' : 'clases seguidas'} 🔥</p>
        </div>
      </section>

      {/* PLAN ACTUAL */}
      <h3 className="text-gray-500 text-xs font-bold tracking-wider uppercase mb-4 pt-2">Mi Plan</h3>
      <section className="bg-mm-surface rounded-3xl p-5 shadow-sm border border-gray-100">
        <div className="flex justify-between items-stretch">

          <div className="flex flex-col justify-end">
            {planTexto.valor !== null ? (
              <>
                <div className="text-3xl font-display font-bold text-mm-purple mb-1">{planTexto.valor}</div>
                <span className="text-base font-normal text-black">{planTexto.detalle}</span>
              </>
            ) : (
              <span className="text-xl font-display font-bold text-mm-purple">{planTexto.detalle}</span>
            )}
            {plan && (
              <p className="text-sm text-gray-500 mt-1">Vence el {formatearVencimiento(plan.vencimiento)}</p>
            )}
          </div>

          <div className="flex flex-col items-end justify-between gap-6">
            {plan && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${plan.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {plan.estado}
              </span>
            )}
            <button className="bg-mm-purple/10 text-mm-purple px-4 py-2 rounded-full font-semibold text-sm hover:bg-mm-purple/20 transition-colors">
              Cambiar
            </button>
          </div>

        </div>
      </section>

      {/* FICHA TÉCNICA */}
      <h3 className="text-gray-500 text-xs font-bold tracking-wider uppercase mb-4 pt-2">Ficha Técnica</h3>
      <section className="bg-mm-surface rounded-3xl p-5 shadow-sm border border-gray-100">
        <div className="space-y-4">
          <div className="flex items-start gap-4 pb-4 border-b border-gray-50">
            <span className="text-sm font-semibold text-gray-700 w-20 shrink-0 mt-1">Objetivos</span>
            <p className="text-sm text-mm-dark flex-1 leading-snug">
              {fichaTecnica.objetivos || 'Sin objetivos cargados.'}
            </p>
            <button className="bg-mm-light p-2 rounded-full text-mm-purple hover:bg-mm-purple/10 transition-colors">
              <PencilIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <span className="text-sm font-semibold text-gray-700 w-20 shrink-0">Lesiones</span>
            <p className="text-sm text-mm-dark flex-1 font-medium">
              {fichaTecnica.lesiones || 'Ninguna'}
            </p>
            <button className="bg-mm-light p-2 rounded-full text-mm-purple hover:bg-mm-purple/10 transition-colors">
              <PencilIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* CONFIGURACIÓN Y SESIÓN */}
      <h3 className="text-gray-500 text-xs font-bold tracking-wider uppercase mb-4 pt-2">Configuración</h3>
      <section className="bg-mm-surface rounded-3xl p-2 shadow-sm border border-gray-100 mb-6">
        <ul className="divide-y divide-gray-50">

          <li
            onClick={() => setModalPassword(true)}
            className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer rounded-2xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-mm-light p-2 rounded-full text-mm-purple">
                <LockClosedIcon className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-mm-dark">Cambiar contraseña</span>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          </li>

          <li
            onClick={handleVerPlan}
            className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer rounded-2xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-mm-light p-2 rounded-full text-mm-purple">
                <CloudIcon className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-mm-dark">Ver el plan de OneDrive</span>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          </li>

        </ul>
      </section>

      <button
        onClick={handleLogout}
        className="w-full bg-red-50 text-red-600 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold hover:bg-red-100 transition-colors mt-8"
      >
        <ArrowRightOnRectangleIcon className="w-5 h-5" />
        Cerrar sesión
      </button>

    </div>
  );
};
