import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, BellIcon, ArrowPathIcon, BellSlashIcon } from '@heroicons/react/24/outline';
import { usuarioService } from '../../services/usuarioService';
import { authService } from '../../services/auth';
import { pushService } from '../../services/pushService';
import { FormEditarPerfil } from '../../components/perfil/FormEditarPerfil';

const inputClase = 'w-full bg-mm-light border border-transparent focus:border-mm-purple focus:bg-white rounded-2xl pl-4 pr-12 py-3.5 text-sm text-mm-dark outline-none transition-all';

export const MiPerfil = ({ titulo = 'Mi perfil' }) => {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [hayError, setHayError] = useState(false);

  const [passwords, setPasswords] = useState({ actual: '', nueva: '', confirmar: '' });
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  const [verActual, setVerActual] = useState(false);
  const [verNueva, setVerNueva] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);

  const [isSubscribing, setIsSubscribing] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setHayError(false);
      setPerfil(await usuarioService.getMiPerfil());
    } catch (error) {
      setHayError(true);
      toast.error('No se pudo cargar tu perfil.');
      console.error(error);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
    
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
  }, [cargar]);

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    if (passwords.nueva !== passwords.confirmar) return toast.error('Las contraseñas nuevas no coinciden.');
    if (passwords.nueva.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres.');

    try {
      setGuardandoPassword(true);
      const respuesta = await authService.cambiarPassword(passwords.actual, passwords.nueva);
      toast.success(respuesta?.message || 'Contraseña actualizada.');
      setPasswords({ actual: '', nueva: '', confirmar: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setGuardandoPassword(false);
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

  if (cargando && !perfil) {
    return <div className="text-center p-8 text-mm-purple animate-pulse font-bold">Cargando perfil...</div>;
  }

  if (hayError || !perfil) {
    return (
      <div className="text-center p-8">
        <p className="text-sm font-medium text-mm-dark mb-4">No pudimos cargar tu perfil.</p>
        <button onClick={cargar} className="bg-mm-purple text-white px-6 py-2 rounded-full font-semibold text-sm">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-10">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-display font-black text-mm-dark">{titulo}</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base font-medium">Actualizá tus datos personales y tu foto.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* COLUMNA IZQUIERDA */}
        <section className="bg-mm-surface p-6 rounded-4xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-mm-dark mb-4">Datos personales</h2>
          <FormEditarPerfil key={perfil.email + perfil.nombreCompleto + (perfil.fotoPerfilUrl || '')} perfil={perfil} onGuardado={setPerfil} />
        </section>

        {/* COLUMNA DERECHA (Seguridad + Notificaciones) */}
        <div className="flex flex-col gap-6">
          
          {/* TARJETA SEGURIDAD */}
          <section className="bg-mm-surface p-6 rounded-4xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-mm-dark mb-1">Seguridad</h2>
            <p className="text-xs text-gray-500 mb-4">Cambiá tu contraseña de acceso.</p>
            <form onSubmit={handleCambiarPassword} className="flex flex-col gap-4">
              
              {/* Password Actual */}
              <div className="relative flex items-center">
                <input
                  type={verActual ? "text" : "password"} required placeholder="Contraseña actual" value={passwords.actual}
                  onChange={(e) => setPasswords({ ...passwords, actual: e.target.value })} className={inputClase}
                />
                <button
                  type="button" onClick={() => setVerActual(!verActual)}
                  className="absolute right-4 text-gray-400 hover:text-mm-purple transition-colors p-1"
                >
                  {verActual ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Nueva */}
              <div className="relative flex items-center">
                <input
                  type={verNueva ? "text" : "password"} required minLength={6} placeholder="Nueva contraseña" value={passwords.nueva}
                  onChange={(e) => setPasswords({ ...passwords, nueva: e.target.value })} className={inputClase}
                />
                <button
                  type="button" onClick={() => setVerNueva(!verNueva)}
                  className="absolute right-4 text-gray-400 hover:text-mm-purple transition-colors p-1"
                >
                  {verNueva ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>

              {/* Confirmar Password */}
              <div className="relative flex items-center">
                <input
                  type={verConfirmar ? "text" : "password"} required minLength={6} placeholder="Repetí la nueva contraseña" value={passwords.confirmar}
                  onChange={(e) => setPasswords({ ...passwords, confirmar: e.target.value })} className={inputClase}
                />
                <button
                  type="button" onClick={() => setVerConfirmar(!verConfirmar)}
                  className="absolute right-4 text-gray-400 hover:text-mm-purple transition-colors p-1"
                >
                  {verConfirmar ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>

              <button
                type="submit" disabled={guardandoPassword}
                className="self-end bg-mm-dark text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-gray-800 transition-colors disabled:opacity-60 active:scale-95"
              >
                {guardandoPassword ? 'Actualizando...' : 'Cambiar contraseña'}
              </button>
            </form>
          </section>

          {/* TARJETA NOTIFICACIONES PUSH */}
          <section className="bg-mm-surface rounded-4xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                <BellIcon className="w-6 h-6 text-mm-purple" />
              </div>
              <div>
                <h3 className="text-base font-bold text-mm-dark">Notificaciones Push</h3>
                <p className="text-xs text-gray-500">Avisos y alertas directas al dispositivo.</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="font-bold text-gray-500">Usuarios de iPhone:</span> Para que funcionen, instalá la app tocando "Compartir" en Safari y luego "Agregar a Inicio".
            </p>

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
      </div>
    </div>
  );
};