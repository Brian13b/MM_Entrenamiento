import { useState, useEffect } from 'react';
import { MegaphoneIcon, ArrowPathIcon, BuildingStorefrontIcon, PhoneIcon, MapPinIcon, StarIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { administracionService } from '../../services/administracionService';

export const AjustesAdmin = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Estados Anuncio Global
  const [mensaje, setMensaje] = useState('');
  const [ultimaModificacion, setUltimaModificacion] = useState(null);
  const [isSavingAnuncio, setIsSavingAnuncio] = useState(false);

  // Estados Datos del Gimnasio
  const [datosGym, setDatosGym] = useState({ nombre: '', telefono: '', direccion: '', instagram: '' });
  const [isSavingGym, setIsSavingGym] = useState(false);

  // Estados Membresías
  const [membresias, setMembresias] = useState([]);
  const [nuevaMembresia, setNuevaMembresia] = useState({ nombre: '', precio: '', creditosOtorgados: '', limiteTurnosFijos: '' });
  const [isSavingMembresia, setIsSavingMembresia] = useState(false);

  useEffect(() => {
    const fetchAjustes = async () => {
      try {
        setIsLoading(true);
        const [anuncio, config, listaMembresias] = await Promise.all([
          administracionService.getAnuncioGlobal(),
          administracionService.getConfiguracion(),
          administracionService.getMembresiasActivas()
        ]);
        
        if (anuncio) {
          setMensaje(anuncio.mensaje || '');
          setUltimaModificacion(anuncio.ultimaModificacion);
        }
        
        setDatosGym({
          nombre: config.nombre || '',
          telefono: config.telefono || '',
          direccion: config.direccion || '',
          instagram: config.instagram || ''
        });

        setMembresias(listaMembresias || []);

      } catch (error) {
        toast.error('No se pudo cargar la configuración actual.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAjustes();
  }, []);

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

  const handleGuardarDatosGym = async (e) => {
    e.preventDefault();
    try {
      setIsSavingGym(true);
      const respuesta = await administracionService.actualizarConfiguracion({
        nombre: datosGym.nombre.trim(),
        telefono: datosGym.telefono.trim() || null,
        direccion: datosGym.direccion.trim() || null,
        instagram: datosGym.instagram.trim() || null
      });
      toast.success(respuesta?.message || 'Datos del gimnasio actualizados.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar datos.');
      console.error(error);
    } finally {
      setIsSavingGym(false);
    }
  };

  const handleCrearMembresia = async (e) => {
    e.preventDefault();
    try {
      setIsSavingMembresia(true);
      
      const payload = {
        nombre: nuevaMembresia.nombre.trim(),
        precio: Number(nuevaMembresia.precio),
        creditosOtorgados: Number(nuevaMembresia.creditosOtorgados),
        limiteTurnosFijos: Number(nuevaMembresia.limiteTurnosFijos)
      };

      const respuesta = await administracionService.crearMembresia(payload);
      toast.success(respuesta?.message || 'Membresía creada con éxito.');
      
      // Recargar lista y limpiar form
      const actualizadas = await administracionService.getMembresiasActivas();
      setMembresias(actualizadas || []);
      setNuevaMembresia({ nombre: '', precio: '', creditosOtorgados: '', limiteTurnosFijos: '' });

    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear la membresía.');
      console.error(error);
    } finally {
      setIsSavingMembresia(false);
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
    <div className="animate-fade-in max-w-6xl mx-auto pb-10">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-mm-dark">Ajustes Generales</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base font-medium">Configurá los avisos, planes y datos de tu gimnasio.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* COLUMNA IZQUIERDA: Anuncio Global y Datos Gym */}
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

          {/* DATOS DEL GIMNASIO */}
          <section className="bg-mm-dark p-6 rounded-4xl shadow-sm flex flex-col gap-4 border border-gray-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <BuildingStorefrontIcon className="w-40 h-40" />
            </div>

            <div className="flex items-center gap-3 border-b border-gray-700/50 pb-4 relative z-10">
              <div className="w-10 h-10 bg-mm-purple/30 border border-mm-purple/30 rounded-xl flex items-center justify-center shrink-0">
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
                className="w-full bg-mm-purple text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-mm-purple/60 transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 mt-3"
              >
                {isSavingGym ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Guardando...</> : 'Actualizar Datos'}
              </button>
            </form>
          </section>
        </div>

        {/* COLUMNA DERECHA: Membresías */}
        <div className="flex flex-col gap-6">
          <section className="bg-mm-surface p-6 rounded-4xl border border-gray-100 shadow-sm flex flex-col gap-4 h-full">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                <StarIcon className="w-6 h-6 text-mm-purple" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-mm-dark">Planes y Membresías</h2>
                <p className="text-xs text-gray-500">Creá nuevos planes o visualizá los vigentes.</p>
              </div>
            </div>

            {/* FORMULARIO CREAR MEMBRESÍA */}
            <form onSubmit={handleCrearMembresia} className="flex flex-col gap-4 mt-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Crear Nuevo Plan</h3>
              
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-1 block mb-1">Nombre del Plan</label>
                <input
                  type="text" required placeholder="Ej: Pase Libre Mensual"
                  value={nuevaMembresia.nombre} onChange={e => setNuevaMembresia({...nuevaMembresia, nombre: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-mm-dark focus:ring-2 focus:ring-mm-purple outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-1 block mb-1">Precio ($)</label>
                  <input
                    type="number" required placeholder="0" min="0"
                    value={nuevaMembresia.precio} onChange={e => setNuevaMembresia({...nuevaMembresia, precio: e.target.value})}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-mm-dark focus:ring-2 focus:ring-mm-purple outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-1 block mb-1">Clases x Mes</label>
                  <input
                    type="number" required placeholder="12" min="1"
                    value={nuevaMembresia.creditosOtorgados} onChange={e => setNuevaMembresia({...nuevaMembresia, creditosOtorgados: e.target.value})}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-mm-dark focus:ring-2 focus:ring-mm-purple outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-1 block mb-1">Turnos Fijos</label>
                  <input
                    type="number" required placeholder="3" min="0"
                    value={nuevaMembresia.limiteTurnosFijos} onChange={e => setNuevaMembresia({...nuevaMembresia, limiteTurnosFijos: e.target.value})}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-mm-dark focus:ring-2 focus:ring-mm-purple outline-none"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={isSavingMembresia}
                className="w-full bg-mm-purple text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-mm-purple/80 transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 mt-1"
              >
                {isSavingMembresia ? <><ArrowPathIcon className="w-4 h-4 animate-spin" /> Creando...</> : <><PlusCircleIcon className="w-4 h-4"/> Crear Plan</>}
              </button>
            </form>

            {/* LISTA DE MEMBRESÍAS ACTUALES */}
            <div className="mt-4 flex-1">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Planes Activos ({membresias.length})</h3>
              
              {membresias.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center p-4">No hay planes creados aún.</p>
              ) : (
                <div className="flex flex-col gap-2 max-h-87.5 overflow-y-auto pr-2">
                  {membresias.map(m => (
                    <div key={m.id} className="flex justify-between items-center bg-white border border-gray-200 p-4 rounded-2xl shadow-sm hover:border-mm-purple transition-colors">
                      <div>
                        <p className="font-bold text-sm text-mm-dark">{m.nombre}</p>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                          {m.creditosOtorgados} clases totales | {m.limiteTurnosFijos} turnos fijos
                        </p>
                      </div>
                      <span className="text-xs font-black text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-lg">
                        ${m.precio}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </section>
        </div>

      </div>
    </div>
  );
};