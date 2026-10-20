import { useState, useEffect } from 'react';
import { 
  MegaphoneIcon, ArrowPathIcon, LockClosedIcon, 
  BuildingStorefrontIcon, PhoneIcon, MapPinIcon 
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { administracionService } from '../../services/administracionService';

export const AjustesAdmin = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Estados Anuncio Global
  const [mensaje, setMensaje] = useState('');
  const [ultimaModificacion, setUltimaModificacion] = useState(null);
  const [isSavingAnuncio, setIsSavingAnuncio] = useState(false);

  // Estados Cambio de Contraseña (MOCK)
  const [passwords, setPasswords] = useState({ actual: '', nueva: '', confirmar: '' });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Estados Datos del Gimnasio (MOCK)
  const [datosGym, setDatosGym] = useState({
    nombre: 'MM Entrenamiento',
    telefono: '+54 9 11 1234-5678',
    direccion: 'Calle Falsa 123, CABA',
    instagram: '@mm.entrenamiento'
  });
  const [isSavingGym, setIsSavingGym] = useState(false);

  // ---------------------------------------------------------
  // CARGA INICIAL
  // ---------------------------------------------------------
  useEffect(() => {
    const fetchAnuncio = async () => {
      try {
        setIsLoading(true);
        const data = await administracionService.getAnuncioGlobal();
        if (data) {
          setMensaje(data.mensaje || '');
          setUltimaModificacion(data.ultimaModificacion);
        }
      } catch (error) {
        toast.error('No se pudo cargar la configuración actual.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnuncio();
  }, []);

  // ---------------------------------------------------------
  // HANDLERS (Con Mocks donde corresponde)
  // ---------------------------------------------------------
  
  const handleGuardarAnuncio = async () => {
    if (mensaje.trim() === '') return toast.error('El anuncio no puede estar vacío.');
    try {
      setIsSavingAnuncio(true);
      await administracionService.actualizarAnuncioGlobal({ mensaje: mensaje.trim() });
      toast.success('¡Anuncio actualizado con éxito!');
      setUltimaModificacion(new Date().toISOString());
    } catch (error) {
      toast.error('Ocurrió un error al guardar el anuncio.');
      console.error(error);
    } finally {
      setIsSavingAnuncio(false);
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    if (passwords.nueva !== passwords.confirmar) return toast.error('Las contraseñas nuevas no coinciden.');
    if (passwords.nueva.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres.');
    
    try {
      setIsSavingPassword(true);
      // MOCK: Simulación de llamada a la API
      await new Promise(resolve => setTimeout(resolve, 800)); 
      toast.success('Contraseña actualizada correctamente.');
      setPasswords({ actual: '', nueva: '', confirmar: '' });
    } catch (error) {
      toast.error('La contraseña actual es incorrecta.');
      console.error(error);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleGuardarDatosGym = async (e) => {
    e.preventDefault();
    try {
      setIsSavingGym(true);
      // MOCK: Simulación de llamada a la API
      await new Promise(resolve => setTimeout(resolve, 800)); 
      toast.success('Datos del gimnasio actualizados.');
    } catch (error) {
      toast.error('Error al actualizar datos.');
      console.error(error);
    } finally {
      setIsSavingGym(false);
    }
  };

  const formatearFecha = (fechaString) => {
    if (!fechaString) return 'Nunca';
    const opciones = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(fechaString).toLocaleDateString('es-AR', opciones);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-mm-purple animate-pulse">
        <span className="font-bold">Cargando ajustes...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-10">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-mm-dark">Ajustes Generales</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base font-medium">Configurá los avisos, seguridad y datos de tu gimnasio.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* COLUMNA IZQUIERDA: Anuncio Global y Seguridad */}
        <div className="flex flex-col gap-6">
          
          {/* ANUNCIO GLOBAL */}
          <section className="bg-mm-surface p-6 rounded-4xl border border-gray-100 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                <MegaphoneIcon className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-mm-dark">Anuncio Global</h2>
                <p className="text-xs text-gray-500">Este mensaje aparecerá en el inicio de todos los alumnos.</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <label htmlFor="mensaje" className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Mensaje a mostrar</label>
              <textarea
                id="mensaje" rows="3"
                className="w-full bg-mm-light border border-gray-200 rounded-2xl p-4 text-sm text-mm-dark focus:ring-2 focus:ring-mm-purple focus:border-transparent outline-none resize-none transition-all"
                placeholder="Ej: El lunes abrimos de 9 a 15hs por el feriado..."
                value={mensaje} onChange={(e) => setMensaje(e.target.value)}
              ></textarea>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-1">
              <span className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                Última modif: {formatearFecha(ultimaModificacion)}
              </span>
              <button
                onClick={handleGuardarAnuncio} disabled={isSavingAnuncio}
                className="w-full sm:w-auto bg-mm-dark text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
              >
                {isSavingAnuncio ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Guardando...</> : 'Publicar Anuncio'}
              </button>
            </div>
          </section>

          {/* CAMBIAR CONTRASEÑA */}
          <section className="bg-mm-surface p-6 rounded-4xl border border-gray-100 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                <LockClosedIcon className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-mm-dark">Seguridad</h2>
                <p className="text-xs text-gray-500">Actualizá tu contraseña de administrador.</p>
              </div>
            </div>

            <form onSubmit={handleCambiarPassword} className="flex flex-col gap-4 mt-2">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1 block mb-1">Contraseña Actual</label>
                <input 
                  type="password" required value={passwords.actual} onChange={e => setPasswords({...passwords, actual: e.target.value})}
                  className="w-full bg-mm-light border border-gray-200 rounded-xl p-3 text-sm text-mm-dark focus:ring-2 focus:ring-mm-purple outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1 block mb-1">Nueva Contraseña</label>
                  <input 
                    type="password" required minLength={6} value={passwords.nueva} onChange={e => setPasswords({...passwords, nueva: e.target.value})}
                    className="w-full bg-mm-light border border-gray-200 rounded-xl p-3 text-sm text-mm-dark focus:ring-2 focus:ring-mm-purple outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1 block mb-1">Repetir Nueva</label>
                  <input 
                    type="password" required minLength={6} value={passwords.confirmar} onChange={e => setPasswords({...passwords, confirmar: e.target.value})}
                    className="w-full bg-mm-light border border-gray-200 rounded-xl p-3 text-sm text-mm-dark focus:ring-2 focus:ring-mm-purple outline-none"
                  />
                </div>
              </div>
              <button 
                type="submit" disabled={isSavingPassword || !passwords.actual || !passwords.nueva || !passwords.confirmar}
                className="self-end bg-mm-dark text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-2"
              >
                {isSavingPassword ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Actualizando...</> : 'Cambiar Contraseña'}
              </button>
            </form>
          </section>

        </div>

        {/* COLUMNA DERECHA: Datos del Gimnasio */}
        <div className="flex flex-col gap-6">
          <section className="bg-mm-dark p-6 rounded-4xl shadow-sm flex flex-col gap-4 border border-gray-800 relative overflow-hidden">
            
            {/* Decal Background */}
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <BuildingStorefrontIcon className="w-40 h-40" />
            </div>

            <div className="flex items-center gap-3 border-b border-gray-700/50 pb-4 relative z-10">
              <div className="w-10 h-10 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center shrink-0">
                <BuildingStorefrontIcon className="w-5 h-5 text-mm-purple" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Datos de la Institución</h2>
                <p className="text-xs text-gray-400">Información pública visible para los alumnos.</p>
              </div>
            </div>

            <form onSubmit={handleGuardarDatosGym} className="flex flex-col gap-4 mt-2 relative z-10">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide ml-1 block mb-1">Nombre del Gimnasio</label>
                <input 
                  type="text" required value={datosGym.nombre} onChange={e => setDatosGym({...datosGym, nombre: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm text-white font-bold focus:ring-2 focus:ring-mm-purple outline-none placeholder:text-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide ml-1 block mb-1">
                    <span className="flex items-center gap-1"><PhoneIcon className="w-3 h-3" /> Teléfono / WhatsApp</span>
                  </label>
                  <input 
                    type="text" value={datosGym.telefono} onChange={e => setDatosGym({...datosGym, telefono: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-mm-purple outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide ml-1 block mb-1">
                    <span className="flex items-center gap-1">@ Instagram</span>
                  </label>
                  <input 
                    type="text" value={datosGym.instagram} onChange={e => setDatosGym({...datosGym, instagram: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-mm-purple outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide ml-1 block mb-1">
                  <span className="flex items-center gap-1"><MapPinIcon className="w-3 h-3" /> Dirección</span>
                </label>
                <input 
                  type="text" value={datosGym.direccion} onChange={e => setDatosGym({...datosGym, direccion: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-mm-purple outline-none"
                />
              </div>

              <button 
                type="submit" disabled={isSavingGym}
                className="w-full bg-mm-purple text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 mt-3"
              >
                {isSavingGym ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Guardando...</> : 'Actualizar Datos'}
              </button>
            </form>
          </section>
        </div>

      </div>
    </div>
  );
};