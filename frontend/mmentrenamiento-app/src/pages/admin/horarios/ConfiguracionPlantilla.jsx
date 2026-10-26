import { useState, useEffect } from 'react';
import { PlusIcon, ClockIcon, TrashIcon, ExclamationTriangleIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { horariosService } from '../../../services/horariosService';
import { useConfirm } from '../../../hooks/useConfirm';
import { parsearFechaIso } from '../../../utils/fechas';

export const ConfiguracionPlantilla = () => {
  const [horarios, setHorarios] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalidad, setModalidad] = useState('masivo');
  const [confirmar, confirmDialog] = useConfirm();

  const [formMasivo, setFormMasivo] = useState({ diasSemana: [], horaInicio: '', horaFin: '', cupoMaximo: '' });
  const [formUnico, setFormUnico] = useState({ diaSemana: 1, horaInicio: '', horaFin: '', cupoMaximo: '' });
  const [formFeriado, setFormFeriado] = useState({ fechaFeriado: '', nuevaHoraInicio: '', nuevaHoraFin: '' });

  const [editandoId, setEditandoId] = useState(null);
  const [nuevoCupo, setNuevoCupo] = useState('');

  const diasSemana = [
    { id: 1, nombre: 'Lunes' }, { id: 2, nombre: 'Martes' },
    { id: 3, nombre: 'Miércoles' }, { id: 4, nombre: 'Jueves' },
    { id: 5, nombre: 'Viernes' }, { id: 6, nombre: 'Sábado' },
    { id: 0, nombre: 'Domingo' }
  ];

  const cargarPlantilla = async (mostrarLoader = true) => {
    try {
      if (mostrarLoader) setIsLoading(true);
      const data = await horariosService.getHorarios();
      setHorarios(data || []);
    } catch (error) {
      toast.error("No se pudo conectar con el servidor.");
      console.error(error);
      setHorarios([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarPlantilla(true);
  }, []);

  const handleCrearMasivo = async (e) => {
    e.preventDefault();
    if (formMasivo.diasSemana.length === 0) return toast.error("Seleccioná al menos un día.");
    try {
      setIsSaving(true);
      await horariosService.crearHorariosMasivos({
        diasSemana: formMasivo.diasSemana.map(Number),
        horaInicio: formMasivo.horaInicio,
        horaFin: formMasivo.horaFin,
        cupoMaximo: Number(formMasivo.cupoMaximo)
      });
      toast.success("Turnos creados correctamente.");
      cargarPlantilla(false);
    } catch (error) {
      toast.error("Error al crear horarios masivos.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCrearUnico = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await horariosService.crearHorario({
        diaSemana: Number(formUnico.diaSemana),
        horaInicio: formUnico.horaInicio,
        horaFin: formUnico.horaFin,
        cupoMaximo: Number(formUnico.cupoMaximo)
      });
      toast.success("Bloque horario creado.");
      cargarPlantilla(false);
    } catch (error) {
      toast.error("Error al crear el bloque.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfigurarFeriado = async (e) => {
    e.preventDefault();
    if (!formFeriado.fechaFeriado) return toast.error("Seleccioná una fecha.");

    const ok = await confirmar({
      title: '¿Reemplazar la grilla de ese día?',
      message: <>Se eliminarán los turnos del <strong className="text-mm-dark">{parsearFechaIso(formFeriado.fechaFeriado).toLocaleDateString('es-AR')}</strong> y se crearán nuevos con el horario reducido ({formFeriado.nuevaHoraInicio} a {formFeriado.nuevaHoraFin}). Las reservas existentes se cancelarán y se devolverán los créditos: cada alumno deberá volver a anotarse.</>,
      confirmText: 'Sí, reemplazar'
    });
    if (!ok) return;
    try {
      setIsSaving(true);
      const respuesta = await horariosService.configurarHorarioReducido({
        fechaFeriado: formFeriado.fechaFeriado,
        nuevaHoraInicio: formFeriado.nuevaHoraInicio,
        nuevaHoraFin: formFeriado.nuevaHoraFin
      });
      toast.success(respuesta?.message || "Feriado configurado.", { duration: 6000 });
      setFormFeriado({ ...formFeriado, fechaFeriado: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al configurar el feriado.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEliminarHorario = async (id) => {
    const ok = await confirmar({
      title: '¿Eliminar este horario?',
      message: 'Se quitará de la plantilla semanal. Esta acción no se puede deshacer.',
      confirmText: 'Sí, eliminar'
    });
    if (!ok) return;

    try {
      const respuesta = await horariosService.eliminarHorario(id);
      setHorarios(prev => prev.filter(h => h.id !== id));
      toast.success(respuesta?.mensaje || respuesta?.message || "Horario eliminado.", { duration: 6000 });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al eliminar el horario.");
      console.error(error);
    }
  };

  const iniciarEdicion = (clase) => {
    setEditandoId(clase.id);
    setNuevoCupo(clase.cupoMaximo);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setNuevoCupo('');
  };

  const handleActualizarCupo = async (id) => {
    if (!nuevoCupo || nuevoCupo <= 0) return toast.error("El cupo debe ser mayor a 0");
    try {
      await horariosService.actualizarHorario(id, Number(nuevoCupo));
      toast.success("Cupo actualizado.");
      setHorarios(prev => prev.map(h => h.id === id ? { ...h, cupoMaximo: Number(nuevoCupo) } : h));
      cancelarEdicion();
    } catch (error) {
      toast.error("Error al actualizar el cupo.");
      console.error(error);
    }
  };

  const toggleDiaMasivo = (idDia) => {
    setFormMasivo(prev => {
      const currentDias = prev?.diasSemana || [];
      const dias = currentDias.includes(idDia)
        ? currentDias.filter(d => d !== idDia)
        : [...currentDias, idDia];
      return { ...prev, diasSemana: dias };
    });
  };

  const horariosAgrupados = horarios.reduce((acc, horario) => {
    if (!acc[horario.diaSemana]) acc[horario.diaSemana] = [];
    acc[horario.diaSemana].push(horario);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in">
      {confirmDialog}
      <div className="lg:col-span-1 lg:sticky lg:top-24">
        <section className="bg-mm-surface p-6 rounded-4xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
              <PlusIcon className="w-6 h-6 text-mm-purple" />
            </div>
            <h2 className="text-lg font-bold text-mm-dark">Crear Horario</h2>
          </div>

          <div className="flex bg-mm-light p-1 rounded-xl mb-5">
            <button onClick={() => setModalidad('masivo')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${modalidad === 'masivo' ? 'bg-white shadow-sm text-mm-purple' : 'text-gray-500 hover:text-gray-700'}`}>Masivo (1h)</button>
            <button onClick={() => setModalidad('unico')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${modalidad === 'unico' ? 'bg-white shadow-sm text-mm-purple' : 'text-gray-500 hover:text-gray-700'}`}>Bloque</button>
            <button onClick={() => setModalidad('feriado')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${modalidad === 'feriado' ? 'bg-white shadow-sm text-mm-purple' : 'text-gray-500 hover:text-gray-700'}`}>Feriado</button>
          </div>

          {modalidad === 'masivo' && (
            <form onSubmit={handleCrearMasivo} className="flex flex-col gap-4 animate-fade-in">
              <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 mb-1">
                <p className="text-[11px] text-mm-purple/60 font-medium leading-relaxed">Genera <span className="font-bold">turnos de 1 hora</span> automáticamente en este rango.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Días</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {diasSemana.map(dia => (
                    <button
                      key={dia.id}
                      type="button"
                      onClick={() => toggleDiaMasivo(dia.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                        formMasivo?.diasSemana?.includes(dia.id)
                          ? 'bg-purple-50 border-mm-purple text-mm-purple'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {dia.nombre.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Inicio</label>
                  <input type="time" required className="w-full mt-1 bg-mm-light border border-gray-200 rounded-xl p-3 text-sm text-mm-dark outline-none focus:ring-2 focus:ring-mm-purple" value={formMasivo?.horaInicio || ''} onChange={(e) => setFormMasivo({...formMasivo, horaInicio: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Fin</label>
                  <input type="time" required className="w-full mt-1 bg-mm-light border border-gray-200 rounded-xl p-3 text-sm text-mm-dark outline-none focus:ring-2 focus:ring-mm-purple" value={formMasivo?.horaFin || ''} onChange={(e) => setFormMasivo({...formMasivo, horaFin: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Cupo (Por turno)</label>
                <input type="number" min="1" required className="w-full mt-1 bg-mm-light border border-gray-200 rounded-xl p-3 text-sm text-mm-dark outline-none focus:ring-2 focus:ring-mm-purple" value={formMasivo?.cupoMaximo || ''} onChange={(e) => setFormMasivo({...formMasivo, cupoMaximo: e.target.value})} />
              </div>

              <button type="submit" disabled={isSaving || !formMasivo?.diasSemana?.length} className="w-full bg-mm-purple text-white py-3 rounded-xl font-bold text-sm hover:bg-mm-purple/60 transition-colors mt-2 disabled:opacity-70 active:scale-95">
                {isSaving ? 'Creando...' : 'Generar Turnos'}
              </button>
            </form>
          )}

          {modalidad === 'unico' && (
            <form onSubmit={handleCrearUnico} className="flex flex-col gap-4 animate-fade-in">
              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 mb-1">
                <p className="text-[11px] text-blue-800 font-medium leading-relaxed">Crea un <span className="font-bold">bloque exacto</span> (Ej: un turno de 30 min o de 4 horas enteras).</p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Día de la semana</label>
                <select className="w-full mt-1 bg-mm-light border border-gray-200 rounded-xl p-3 text-sm text-mm-dark outline-none focus:ring-2 focus:ring-mm-purple" value={formUnico?.diaSemana || 1} onChange={(e) => setFormUnico({...formUnico, diaSemana: e.target.value})}>
                  {diasSemana.map(dia => (
                    <option key={dia.id} value={dia.id}>{dia.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Inicio Exacto</label>
                  <input type="time" required className="w-full mt-1 bg-mm-light border border-gray-200 rounded-xl p-3 text-sm text-mm-dark outline-none focus:ring-2 focus:ring-mm-purple" value={formUnico?.horaInicio || ''} onChange={(e) => setFormUnico({...formUnico, horaInicio: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Fin Exacto</label>
                  <input type="time" required className="w-full mt-1 bg-mm-light border border-gray-200 rounded-xl p-3 text-sm text-mm-dark outline-none focus:ring-2 focus:ring-mm-purple" value={formUnico?.horaFin || ''} onChange={(e) => setFormUnico({...formUnico, horaFin: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Cupo Máximo</label>
                <input type="number" min="1" required className="w-full mt-1 bg-mm-light border border-gray-200 rounded-xl p-3 text-sm text-mm-dark outline-none focus:ring-2 focus:ring-mm-purple" value={formUnico?.cupoMaximo || ''} onChange={(e) => setFormUnico({...formUnico, cupoMaximo: e.target.value})} />
              </div>

              <button type="submit" disabled={isSaving} className="w-full bg-mm-purple text-white py-3 rounded-xl font-bold text-sm hover:bg-mm-purple/60 transition-colors mt-2 disabled:opacity-70 active:scale-95">
                {isSaving ? 'Guardando...' : 'Crear Bloque'}
              </button>
            </form>
          )}

          {modalidad === 'feriado' && (
            <form onSubmit={handleConfigurarFeriado} className="flex flex-col gap-4 animate-fade-in">
              <div className="bg-orange-50/50 p-3 rounded-xl flex gap-3 border border-orange-100 mb-1">
                <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 shrink-0" />
                <p className="text-[11px] text-orange-800 font-medium">Reemplazará los turnos regulares de la fecha elegida por este nuevo rango reducido.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Fecha del Feriado</label>
                <input type="date" required className="w-full mt-1 bg-mm-light border border-gray-200 rounded-xl p-3 text-sm text-mm-dark outline-none focus:ring-2 focus:ring-mm-purple" value={formFeriado?.fechaFeriado || ''} onChange={(e) => setFormFeriado({...formFeriado, fechaFeriado: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Inicio (Reducido)</label>
                  <input type="time" required className="w-full mt-1 bg-mm-light border border-gray-200 rounded-xl p-3 text-sm text-mm-dark outline-none focus:ring-2 focus:ring-mm-purple" value={formFeriado?.nuevaHoraInicio || ''} onChange={(e) => setFormFeriado({...formFeriado, nuevaHoraInicio: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Fin (Reducido)</label>
                  <input type="time" required className="w-full mt-1 bg-mm-light border border-gray-200 rounded-xl p-3 text-sm text-mm-dark outline-none focus:ring-2 focus:ring-mm-purple" value={formFeriado?.nuevaHoraFin || ''} onChange={(e) => setFormFeriado({...formFeriado, nuevaHoraFin: e.target.value})} />
                </div>
              </div>

              <button type="submit" disabled={isSaving} className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors mt-2 disabled:opacity-70 active:scale-95">
                {isSaving ? 'Aplicando...' : 'Aplicar Feriado'}
              </button>
            </form>
          )}
        </section>
      </div>

      <div className="lg:col-span-2 flex flex-col gap-6">
        {isLoading ? (
          <div className="bg-mm-surface p-12 rounded-4xl border border-gray-100 flex justify-center text-mm-purple animate-pulse">
            <span className="font-bold">Cargando plantilla...</span>
          </div>
        ) : horarios.length === 0 ? (
          <div className="bg-mm-surface p-12 rounded-4xl border border-gray-100 text-center text-gray-500 font-medium">
            No hay horarios configurados en la base de datos.
          </div>
        ) : (
          diasSemana.map(dia => {
            const clasesDelDia = horariosAgrupados[dia.id];
            if (!clasesDelDia || clasesDelDia.length === 0) return null;

            return (
              <section key={dia.id} className="bg-mm-surface p-6 rounded-4xl border border-gray-100 shadow-sm animate-fade-in">
                <h3 className="text-lg font-display font-bold text-mm-dark mb-4 border-b border-gray-100 pb-3">
                  {dia.nombre}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clasesDelDia.sort((a,b) => a.horaInicio.localeCompare(b.horaInicio)).map(clase => (
                    <div key={clase.id} className="flex items-center justify-between bg-[#F8F9FA] border border-gray-200/60 p-2.5 pr-4 rounded-2xl group transition-all hover:border-gray-300">
                      
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-[0.85rem] flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                          <ClockIcon className="w-6 h-6 text-mm-purple" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[15px] font-bold text-mm-dark leading-tight mb-0.5">
                            {clase.horaInicio.slice(0,5)} - {clase.horaFin.slice(0,5)}
                          </span>
                          
                          {/* MODO EDICIÓN VS MODO LECTURA */}
                          {editandoId === clase.id ? (
                            <div className="flex items-center mt-0.5">
                              <input
                                type="number"
                                min="1"
                                autoFocus
                                value={nuevoCupo}
                                onChange={(e) => setNuevoCupo(e.target.value)}
                                className="w-14 bg-white border border-mm-purple rounded-md px-1 py-0.5 text-[11px] font-bold text-mm-dark outline-none"
                              />
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 tracking-wide uppercase">
                              {clase.cupoMaximo} LUGARES
                            </span>
                          )}

                        </div>
                      </div>
                      
                      {/* BOTONES */}
                      <div className="flex gap-2">
                        {editandoId === clase.id ? (
                          <>
                            <button
                              onClick={() => handleActualizarCupo(clase.id)}
                              className="text-green-500 hover:text-green-600 transition-colors bg-green-50 p-1.5 rounded-lg"
                              title="Guardar"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelarEdicion}
                              className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 p-1.5 rounded-lg"
                              title="Cancelar"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => iniciarEdicion(clase)}
                              className="text-gray-300 hover:text-blue-500 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                              title="Editar cupo"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleEliminarHorario(clase.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                              title="Eliminar horario"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
};