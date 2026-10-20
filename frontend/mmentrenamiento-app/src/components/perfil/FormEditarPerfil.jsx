import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CameraIcon } from '@heroicons/react/24/outline';
import { usuarioService } from '../../services/usuarioService';
import { useAuthStore } from '../../store/useAuthStore';
import { urlAvatar } from '../../utils/avatar';

const TAMANO_MAXIMO_FOTO = 5 * 1024 * 1024;

const inputClase = 'w-full bg-mm-light border border-transparent focus:border-mm-purple focus:bg-white rounded-2xl px-4 py-3.5 text-sm text-mm-dark outline-none transition-all';

// Formulario de datos personales del usuario logueado (Admin, Profe o Alumno):
// nombre, email, teléfono y foto, vía PUT /api/Usuarios/mi-perfil.
export const FormEditarPerfil = ({ perfil, onGuardado, onCancelar }) => {
  const [form, setForm] = useState({
    nombreCompleto: perfil.nombreCompleto || '',
    email: perfil.email || '',
    telefono: perfil.telefono || ''
  });
  const [foto, setFoto] = useState(null);
  const [previsualizacion, setPrevisualizacion] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const inputFotoRef = useRef(null);

  useEffect(() => {
    if (!foto) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrevisualizacion(null);
      return;
    }
    const url = URL.createObjectURL(foto);
    setPrevisualizacion(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  const handleElegirFoto = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) return toast.error('El archivo tiene que ser una imagen.');
    if (archivo.size > TAMANO_MAXIMO_FOTO) return toast.error('La imagen no puede pesar más de 5 MB.');

    setFoto(archivo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const datos = {
      nombreCompleto: form.nombreCompleto.trim(),
      email: form.email.trim(),
      telefono: form.telefono.trim()
    };
    if (datos.nombreCompleto.length < 2) return toast.error('Ingresá tu nombre.');

    try {
      setGuardando(true);
      const respuesta = await usuarioService.actualizarMiPerfil(datos, foto);

      // Se vuelve a leer el perfil para sincronizar el store (nombre, email y foto nueva).
      const actualizado = await usuarioService.getMiPerfil();
      const { usuario, setUsuario } = useAuthStore.getState();
      setUsuario({
        ...usuario,
        nombreCompleto: actualizado.nombreCompleto,
        email: actualizado.email,
        foto: actualizado.fotoPerfilUrl ?? null
      });

      toast.success(respuesta?.message || 'Perfil actualizado.');
      onGuardado?.(actualizado);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar el perfil.');
      console.error(error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => inputFotoRef.current?.click()}
          className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-mm-light group"
          title="Cambiar foto"
        >
          <img
            src={previsualizacion || urlAvatar(form.nombreCompleto, perfil.fotoPerfilUrl)}
            alt="Foto de perfil"
            className="w-full h-full object-cover"
          />
          <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity">
            <CameraIcon className="w-6 h-6 text-white" />
          </span>
        </button>
        <input ref={inputFotoRef} type="file" accept="image/*" className="hidden" onChange={handleElegirFoto} />
        <span className="text-xs text-gray-400 font-medium">{foto ? foto.name : 'Tocá la foto para cambiarla'}</span>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1 block mb-1">Nombre y apellido</label>
        <input
          type="text" required value={form.nombreCompleto}
          onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })}
          className={inputClase}
        />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1 block mb-1">Email</label>
        <input
          type="email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={inputClase}
        />
        <p className="text-[11px] text-gray-400 mt-1 ml-1">Es el email con el que iniciás sesión.</p>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1 block mb-1">Teléfono</label>
        <input
          type="tel" value={form.telefono} placeholder="+54 9 11 1234-5678"
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          className={inputClase}
        />
      </div>

      <div className="flex gap-3 mt-1">
        {onCancelar && (
          <button
            type="button" onClick={onCancelar} disabled={guardando}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-mm-light text-mm-dark hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit" disabled={guardando}
          className="flex-1 py-3 rounded-xl font-bold text-sm bg-mm-purple text-white hover:opacity-90 transition-all disabled:opacity-70 active:scale-95"
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
};
