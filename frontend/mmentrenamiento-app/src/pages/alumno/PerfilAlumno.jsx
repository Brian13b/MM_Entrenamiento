import { useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import { usuarioService } from '../../services/usuarioService';
import { authService } from '../../services/auth';
import { seguimientoService } from '../../services/seguimientoService';
import { pushService } from '../../services/pushService';
import { Modal } from '../../components/ui/Modal';
import { useConfirm } from '../../hooks/useConfirm';
import { useWhatsAppGimnasio } from '../../hooks/useWhatsAppGimnasio';
import { PlanFrame } from '../../components/perfil/PlanFrame';
import { obtenerUrlEditable } from '../../utils/onedrive';
import { 
  PencilIcon, LockClosedIcon, ArrowRightOnRectangleIcon, 
  ChevronRightIcon, ArrowTopRightOnSquareIcon, BellIcon, ArrowPathIcon, BellSlashIcon 
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
  const { abrir: whatsapp } = useWhatsAppGimnasio();
  const fileInputRef = useRef(null);

  const [resumen, setResumen] = useState(null);
  const [planDriveItem, setPlanDriveItem] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  const [modalPerfil, setModalPerfil] = useState(false);
  const [formPerfil, setFormPerfil] = useState({ nombreCompleto: '', telefono: '' });
  
  const [modalPassword, setModalPassword] = useState(false);
  const [formPassword, setFormPassword] = useState({ actual: '', nueva: '', confirmar: '' });
  
  const [modalFicha, setModalFicha] = useState(false);
  const [formFicha, setFormFicha] = useState({ objetivos: '', lesiones: '' });
  
  const [guardando, setGuardando] = useState(false);

  const [isSubscribing, setIsSubscribing] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPushEnabled(true);
    }
  }, []);

  const cargarResumen = useCallback(async () => {
    try {
      setCargando(true);
      setError(false);
      
      const [dataResumen, dataPlan] = await Promise.allSettled([
        usuarioService.getMiResumen(),
        seguimientoService.getMiPlan() 
      ]);

      if (dataResumen.status === 'rejected') {
        throw dataResumen.reason; 
      }
      
      setResumen(dataResumen.value);
      
      if (dataPlan.status === 'fulfilled') {
        setPlanDriveItem(dataPlan.value.driveItemId);
      }

      const { usuario: actual, setUsuario } = useAuthStore.getState();
      setUsuario({ 
        ...actual, 
        nombreCompleto: dataResumen.value.nombreCompleto, 
        foto: dataResumen.value.fotoPerfilUrl 
      });

    } catch (err) {
      if (err.response && err.response.status === 404) return;
      
      console.error('Error al cargar el perfil', err);
      setError(true);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarResumen();
    
    const verificarSuscripcionReal = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setPushEnabled(!!subscription);
        } catch (error) {
          console.error("Error al verificar la suscripción:", error);
          setPushEnabled(false);
        }
      }
    };

    verificarSuscripcionReal();
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

  const abrirEditarFicha = () => {
    setFormFicha({ 
      objetivos: resumen.fichaTecnica?.objetivos || '', 
      lesiones: resumen.fichaTecnica?.lesiones || '' 
    });
    setModalFicha(true);
  };

  const handleGuardarFicha = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      await seguimientoService.actualizarMiFicha({
        objetivos: formFicha.objetivos.trim() || null,
        lesiones: formFicha.lesiones.trim() || null
      });
      toast.success('Ficha técnica actualizada.');
      setModalFicha(false);
      await cargarResumen();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo actualizar la ficha técnica.');
    } finally {
      setGuardando(false);
    }
  };

  const handleActivarNotificaciones = async () => {
    setIsSubscribing(true);
    try {
      const exito = await pushService.suscribirDispositivo();
      if (exito) {
        toast.success('¡Notificaciones activadas correctamente!');
        setPushEnabled(true);
      } else {
        toast.error('Verificá los permisos del navegador.');
      }
    } catch (error) {
      toast.error('Ocurrió un error al suscribir el dispositivo.');
      console.log(error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDesactivarNotificaciones = async () => {
    setIsSubscribing(true);
    try {
      const exito = await pushService.desuscribirDispositivo();
      if (exito) {
        toast.success('Notificaciones desactivadas.');
        setPushEnabled(false);
      }
    } catch (error) {
      toast.error('Error al desactivar las notificaciones.');
      console.log(error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleLogout = async () => {
    const ok = await confirmar({
      title: '¿Cerrar sesión?',
      message: 'Vas a salir de tu cuenta en este dispositivo.',
      confirmText: 'Cerrar sesión'
    });
    if (!ok) return;
    await authService.logout();
    logout();
  };

  if (cargando) return (
    <div className="flex justify-center items-center h-[50vh] animate-fade-in">
      <div className="w-10 h-10 border-4 border-mm-purple border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error || !resumen) {
    return (
      <div className="text-center p-12 animate-fade-in bg-mm-surface rounded-4xl max-w-lg mx-auto border border-gray-100 shadow-sm">
        <p className="text-sm font-bold text-mm-dark opacity-60 mb-6">No pudimos cargar tu perfil.</p>
        <button onClick={cargarResumen} className="bg-mm-purple text-white px-8 py-3 rounded-xl font-bold text-sm shadow-sm hover:opacity-90">
          Reintentar
        </button>
      </div>
    );
  }

  const { estadisticas, plan, fichaTecnica } = resumen;
  const planTexto = textoPlan(plan);
  const inputClase = 'w-full bg-mm-light focus:border-mm-purple focus:bg-white rounded-2xl px-4 py-3.5 text-sm outline-none transition-all border border-transparent';

  return (
    <div className="max-w-6xl mx-auto pb-24 animate-fade-in font-sans">
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
          <button type="submit" disabled={guardando} className="w-full bg-mm-purple text-white font-bold rounded-xl py-3.5 text-sm hover:opacity-90 disabled:opacity-70">
            {guardando ? 'Guardando...' : 'Guardar cambios'}
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
          <button type="submit" disabled={guardando} className="w-full bg-mm-purple text-white font-bold rounded-xl py-3.5 text-sm hover:opacity-90 disabled:opacity-70">
            {guardando ? 'Guardando...' : 'Actualizar contraseña'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={modalFicha} onClose={() => !guardando && setModalFicha(false)} title="Editar Ficha Técnica">
        <form onSubmit={handleGuardarFicha} className="flex flex-col gap-4 mt-2">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tus Objetivos</label>
            <textarea
              rows={3} value={formFicha.objetivos} placeholder="Ej: Ganar masa muscular, bajar de peso..."
              onChange={(e) => setFormFicha({ ...formFicha, objetivos: e.target.value })}
              className={`${inputClase} resize-none`}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lesiones o Consideraciones</label>
            <textarea
              rows={3} value={formFicha.lesiones} placeholder="Ej: Dolor lumbar, operación de rodilla, ninguna..."
              onChange={(e) => setFormFicha({ ...formFicha, lesiones: e.target.value })}
              className={`${inputClase} resize-none`}
            />
          </div>
          <button type="submit" disabled={guardando} className="w-full bg-mm-purple text-white font-bold rounded-xl py-3.5 text-sm hover:opacity-90 disabled:opacity-70">
            {guardando ? 'Guardando...' : 'Guardar ficha'}
          </button>
        </form>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-6">
          <section className="bg-mm-surface rounded-4xl p-8 shadow-[0_2px_12px_rgba(31,30,46,0.06)] border border-gray-100 flex flex-col items-center text-center">
            <div
              className="relative w-32 h-32 rounded-full overflow-hidden mb-5 border-4 border-white shadow-md cursor-pointer group"
              onClick={() => !subiendoFoto && fileInputRef.current?.click()}
            >
              <img
                src={resumen.fotoPerfilUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(resumen.nombreCompleto)}&background=f5f6fb&color=8e57a4`}
                alt="Perfil"
                className={`w-full h-full object-cover transition-opacity ${subiendoFoto ? 'opacity-40' : 'group-hover:opacity-90'}`}
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <PencilIcon className="w-6 h-6 text-white" />
              </div>
              <input type="file" ref={fileInputRef} onChange={handleCambiarFoto} className="hidden" accept="image/*" />
            </div>

            <h2 className="text-2xl md:text-3xl font-display font-black text-mm-dark leading-tight">
              {resumen.nombreCompleto}
            </h2>
            <p className="text-gray-500 text-sm font-medium mt-1 mb-6">{resumen.email}</p>

            <button
              onClick={abrirEditarPerfil}
              className="w-full bg-mm-light text-mm-dark font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm"
            >
              Editar datos personales
            </button>
          </section>

          <section className="grid grid-cols-2 gap-4">
            <div className="bg-mm-dark rounded-3xl p-6 text-white shadow-md flex flex-col justify-between">
              <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-2">Esta semana</p>
              <div className="text-5xl font-display font-black text-mm-purple">{estadisticas.clasesAsistidasSemana}</div>
              <p className="text-sm font-medium mt-1 text-gray-300">{estadisticas.clasesAsistidasSemana === 1 ? 'clase asistida' : 'clases asistidas'}</p>
            </div>

            <div className="bg-mm-surface rounded-3xl p-6 border border-gray-100 shadow-[0_2px_12px_rgba(31,30,46,0.06)] flex flex-col justify-between">
              <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-2">Racha actual</p>
              <div className="text-5xl font-display font-black text-mm-purple">{estadisticas.rachaActual}</div>
              <p className="text-sm font-medium mt-1 text-gray-500">{estadisticas.rachaActual === 1 ? 'clase seguida' : 'clases seguidas'} 🔥</p>
            </div>
          </section>

          <section className="bg-mm-surface rounded-3xl p-3 shadow-[0_2px_12px_rgba(31,30,46,0.06)] border border-gray-100">
            <ul className="divide-y divide-gray-50">
              <li onClick={() => setModalPassword(true)} className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer rounded-2xl transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="bg-mm-light p-2.5 rounded-xl text-mm-purple group-hover:bg-purple-100 transition-colors">
                    <LockClosedIcon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-mm-dark">Cambiar contraseña</span>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-300 group-hover:text-mm-purple transition-colors" />
              </li>
            </ul>
          </section>

          {/* NUEVA SECCIÓN: NOTIFICACIONES PUSH */}
          <section className="bg-mm-surface rounded-3xl p-5 shadow-[0_2px_12px_rgba(31,30,46,0.06)] border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                <BellIcon className="w-6 h-6 text-mm-purple" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-mm-dark">Notificaciones</h3>
                <p className="text-[11px] text-gray-500">Avisos y alertas al celular.</p>
              </div>
            </div>

            {pushEnabled ? (
              <button
                type="button"
                onClick={handleDesactivarNotificaciones}
                disabled={isSubscribing}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 active:scale-95"
              >
                {isSubscribing ? (
                  <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Procesando...</>
                ) : (
                  <><BellSlashIcon className="w-5 h-5" /> Desactivar Notificaciones</>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleActivarNotificaciones}
                disabled={isSubscribing}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all bg-mm-purple text-white hover:bg-mm-purple/80 active:scale-95"
              >
                {isSubscribing ? (
                  <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Procesando...</>
                ) : (
                  <><BellIcon className="w-5 h-5" /> Activar Notificaciones</>
                )}
              </button>
            )}
          </section>
        </div>

        <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-6">
          <section className="bg-mm-surface rounded-4xl p-6 md:p-8 shadow-[0_2px_12px_rgba(31,30,46,0.06)] border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-mm-dark font-display font-black text-xl">Ficha Técnica</h3>
              <button onClick={abrirEditarFicha} className="text-sm font-bold text-mm-purple hover:bg-purple-50 px-4 py-2 rounded-xl transition-colors">
                Editar ficha
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-mm-light p-6 rounded-3xl">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Objetivos</p>
                <p className="text-sm text-mm-dark font-medium leading-relaxed">
                  {fichaTecnica.objetivos || 'Sin objetivos cargados.'}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Lesiones</p>
                <p className="text-sm text-mm-dark font-medium leading-relaxed">
                  {fichaTecnica.lesiones || 'Ninguna molestia registrada.'}
                </p>
              </div>
            </div>
          </section>

          <section className="bg-mm-surface rounded-4xl shadow-[0_2px_12px_rgba(31,30,46,0.06)] border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
              <div>
                <div className="flex items-center gap-4 mb-1">
                  <h3 className="text-mm-dark font-display font-black text-xl">Mi Plan de Entrenamiento</h3>
                  {planDriveItem && (
                    <a
                      href={obtenerUrlEditable(planDriveItem)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold text-mm-purple bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      Abrir normal <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    </a>
                  )}
                </div>
                {planTexto.valor !== null ? (
                  <p className="text-sm text-gray-500 font-medium">Membresía: <strong className="text-mm-purple">{planTexto.valor} {planTexto.detalle}</strong></p>
                ) : (
                  <p className="text-sm text-mm-purple font-bold">{planTexto.detalle}</p>
                )}
                {plan && <p className="text-xs text-gray-400 mt-1 font-medium">Vence el {formatearVencimiento(plan.vencimiento)}</p>}
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                {plan && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full text-center ${plan.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    Estado: {plan.estado}
                  </span>
                )}
                <button 
                  onClick={() => whatsapp('Hola! Quería consultar para cambiar mi plan de entrenamiento.')} 
                  className="bg-mm-light text-mm-dark px-4 py-2 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors"
                >
                  Modificar plan
                </button>
              </div>
            </div>

            <div className="p-0 bg-mm-light min-h-100 flex flex-col">
              {planDriveItem ? (
                <div className="flex-1 w-full relative">
                   <PlanFrame url={planDriveItem} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                    <span className="text-2xl">📋</span>
                  </div>
                  <p className="text-mm-dark font-bold mb-1">Aún no hay plan vinculado</p>
                  <p className="text-sm text-gray-500">Tu profesor cargará tu rutina aquí pronto.</p>
                </div>
              )}
            </div>
          </section>

          <button
            onClick={handleLogout}
            className="w-full bg-red-50 text-red-600 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold hover:bg-red-100 transition-colors mt-2"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Cerrar sesión
          </button>

        </div>
      </div>

    </div>
  );
};