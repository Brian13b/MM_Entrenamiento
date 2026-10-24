import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { usuarioService } from '../../services/usuarioService';
import { authService } from '../../services/auth';
import { FormEditarPerfil } from '../../components/perfil/FormEditarPerfil';

const inputClase = 'w-full bg-mm-light border border-transparent focus:border-mm-purple focus:bg-white rounded-2xl px-4 py-3.5 text-sm text-mm-dark outline-none transition-all';

// "Mi perfil" para Admin y Profe: datos personales + foto + cambio de contraseña.
export const MiPerfil = ({ titulo = 'Mi perfil' }) => {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [hayError, setHayError] = useState(false);

  const [passwords, setPasswords] = useState({ actual: '', nueva: '', confirmar: '' });
  const [guardandoPassword, setGuardandoPassword] = useState(false);

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
        <section className="bg-mm-surface p-6 rounded-4xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-mm-dark mb-4">Datos personales</h2>
          <FormEditarPerfil key={perfil.email + perfil.nombreCompleto + (perfil.fotoPerfilUrl || '')} perfil={perfil} onGuardado={setPerfil} />
        </section>

        <section className="bg-mm-surface p-6 rounded-4xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-mm-dark mb-1">Seguridad</h2>
          <p className="text-xs text-gray-500 mb-4">Cambiá tu contraseña de acceso.</p>
          <form onSubmit={handleCambiarPassword} className="flex flex-col gap-4">
            <input
              type="password" required placeholder="Contraseña actual" value={passwords.actual}
              onChange={(e) => setPasswords({ ...passwords, actual: e.target.value })} className={inputClase}
            />
            <input
              type="password" required minLength={6} placeholder="Nueva contraseña" value={passwords.nueva}
              onChange={(e) => setPasswords({ ...passwords, nueva: e.target.value })} className={inputClase}
            />
            <input
              type="password" required minLength={6} placeholder="Repetí la nueva contraseña" value={passwords.confirmar}
              onChange={(e) => setPasswords({ ...passwords, confirmar: e.target.value })} className={inputClase}
            />
            <button
              type="submit" disabled={guardandoPassword}
              className="self-end bg-mm-dark text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-gray-800 transition-colors disabled:opacity-60 active:scale-95"
            >
              {guardandoPassword ? 'Actualizando...' : 'Cambiar contraseña'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
