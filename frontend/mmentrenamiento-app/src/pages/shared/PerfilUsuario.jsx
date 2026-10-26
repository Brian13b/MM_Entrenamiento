import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, CurrencyDollarIcon, ClipboardDocumentCheckIcon, 
  LinkIcon, NoSymbolIcon, PlusCircleIcon, MinusCircleIcon, 
  PhoneIcon, StarIcon, CalendarDaysIcon, TrashIcon, PencilSquareIcon 
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { seguimientoService } from '../../services/seguimientoService';
import { administracionService } from '../../services/administracionService';
import { membresiasService } from '../../services/membresiasService';
import { reservasService } from '../../services/reservasService';
import { AgregarTurnoUsuario } from '../admin/usuarios/AgregarTurnoUsuario';
import { useConfirm } from '../../hooks/useConfirm';
import { etiquetaTurno, formatearHora, nombreDiaSemana, etiquetaTipoReserva, esNotFound } from '../../utils/fechas';
import { PlanFrame } from '../../components/perfil/PlanFrame';
import { useAuthStore } from '../../store/useAuthStore';
import { urlAvatar } from '../../utils/avatar';
import { Modal } from '../../components/ui/Modal';

const TURNOS_VACIOS = { proximasClases: [], misSuscripcionesFijas: [] };

export const PerfilUsuario = ({ basePath = '/admin/usuarios' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const usuarioLogueado = useAuthStore(state => state.usuario);
  const esStaff = ['Admin', 'Profe'].includes(usuarioLogueado?.rol);
  
  // PUNTO 9: Verificamos si es un Admin puro para los permisos destructivos
  const esAdmin = usuarioLogueado?.rol === 'Admin';

  const [isLoading, setIsLoading] = useState(true);
  const [confirmar, confirmDialog] = useConfirm();
  const [usuario, setUsuario] = useState(null);

  // Estados de Edición de Perfil
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [datosEdicion, setDatosEdicion] = useState({ nombreCompleto: '', telefono: '', rol: 'Alumno' });
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  // Estados de Ficha y Plan
  const [ficha, setFicha] = useState({ objetivos: '', lesiones: '' });
  const [planLink, setPlanLink] = useState('');

  // Estados de Membresía y Créditos
  const [creditosAOtorgar, setCreditosAOtorgar] = useState(1);
  const [membresiasDisponibles, setMembresiasDisponibles] = useState([]);
  const [membresiaSeleccionada, setMembresiaSeleccionada] = useState('');

  // Estados de Pagos
  const [pago, setPago] = useState({ monto: '', metodo: 'Transferencia', mes: new Date().getMonth() + 1 });
  const [historialPagos, setHistorialPagos] = useState([]);

  // Estados de Turnos
  const [turnosData, setTurnosData] = useState({ proximasClases: [], misSuscripcionesFijas: [] });

  const cargarTurnos = useCallback(async () => {
    try {
      return await reservasService.getTurnosDeUsuario(id);
    } catch (error) {
      if (esNotFound(error)) return TURNOS_VACIOS;
      throw error;
    }
  }, [id]);

  const recargarUsuario = async () => {
    const datosUsuario = await administracionService.getUsuarioById(id);
    setUsuario(datosUsuario);
    setMembresiaSeleccionada(datosUsuario.membresiaId ?? '');
  };

  const recargarPagos = async () => {
    if (!esStaff) return;
    const pagos = await administracionService.getPagosUsuario(id);
    setHistorialPagos(pagos || []);
  };

  const recargarTurnos = async () => {
    setTurnosData((await cargarTurnos()) || TURNOS_VACIOS);
  };

  useEffect(() => {
    const fetchDatosCRM = async () => {
      try {
        setIsLoading(true);
        const promesas = [
          administracionService.getUsuarioById(id),
          seguimientoService.getFichaAlumno(id),
          cargarTurnos()
        ];
        
        if (esStaff) {
          promesas.push(administracionService.getMembresiasActivas());
          promesas.push(administracionService.getPagosUsuario(id));
        }

        const [datosUsuario, datosFicha, datosTurnos, listaMembresias, datosPagos] = await Promise.all(promesas);

        setUsuario(datosUsuario);
        // PUNTO 9: Cargamos el rol actual en el estado de edición
        setDatosEdicion({ 
          nombreCompleto: datosUsuario.nombreCompleto || '', 
          telefono: datosUsuario.telefono || '',
          rol: datosUsuario.rol || 'Alumno' 
        });
        setTurnosData(datosTurnos || TURNOS_VACIOS);
        
        if (esStaff) {
          setMembresiasDisponibles(listaMembresias || []);
          setMembresiaSeleccionada(datosUsuario.membresiaId ?? '');
          setHistorialPagos(datosPagos || []);
        }

        if (datosFicha) {
          setFicha({
            objetivos: datosFicha.objetivos || '',
            lesiones: datosFicha.lesiones || ''
          });
          setPlanLink(datosFicha.driveItemId || '');
        }

      } catch (error) {
        toast.error("Error al cargar el perfil del alumno.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchDatosCRM();
  }, [id, esStaff, cargarTurnos]);

  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    try {
      setGuardandoPerfil(true);
      
      await administracionService.actualizarPerfilUsuario(id, {
        nombreCompleto: datosEdicion.nombreCompleto.trim(),
        telefono: datosEdicion.telefono.trim() || null
      });

      if (datosEdicion.rol !== usuario.rol) {
        await administracionService.cambiarRolUsuario(id, datosEdicion.rol);
      }

      setUsuario(prev => ({ 
        ...prev, 
        nombreCompleto: datosEdicion.nombreCompleto.trim(), 
        telefono: datosEdicion.telefono.trim() || null,
        rol: datosEdicion.rol
      }));
      
      toast.success("Perfil actualizado correctamente.");
      setModalEditarAbierto(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al actualizar el perfil.");
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const handleEliminarUsuario = async () => {
    const ok = await confirmar({
      title: '¿Eliminar usuario definitivamente?',
      message: `Esta acción es irreversible. Se borrarán los datos, turnos y ficha de ${usuario.nombreCompleto}.`,
      confirmText: 'Sí, eliminar',
      variant: 'danger'
    });
    if (!ok) return;

    try {
      setIsLoading(true);
      await administracionService.eliminarUsuario(id);
      toast.success('Usuario eliminado del sistema.');
      navigate(basePath); 
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo eliminar el usuario.");
      setIsLoading(false);
    }
  };

  const handleActualizarFicha = async () => {
    try {
      await seguimientoService.actualizarFichaAlumno(id, ficha);
      toast.success("Ficha médica actualizada.");
    } catch (error) {
      toast.error("Error al actualizar ficha.");
      console.error(error);
    }
  };

  const handleBuscarPestanas = async () => {
    if (!planLink) return toast.error("Ingresá un link de OneDrive primero.");
    toast.error("La lectura de hojas de OneDrive aún no está disponible. Podés guardar el vínculo igualmente.");
  };

  const handleVincularPlan = async () => {
    if (!planLink.trim()) return toast.error("Ingresá el link o ID del plan.");
    try {
      await seguimientoService.vincularPlan(id, { driveItemId: planLink.trim() });
      toast.success("Plan vinculado correctamente.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al vincular el plan.");
    }
  };

  const handleBajaTurnoFijo = async (turnoFijoId) => {
    const ok = await confirmar({
      title: '¿Dar de baja el turno fijo?',
      message: 'Se cancelarán todas sus clases futuras de este horario y se devolverán los créditos.',
      confirmText: 'Sí, dar de baja'
    });
    if (!ok) return;
    try {
      const respuesta = await reservasService.darDeBajaTurnoFijo({ usuarioId: id, turnoFijoId });
      toast.success(respuesta?.message || "Turno fijo dado de baja.");
      await Promise.all([recargarTurnos(), recargarUsuario()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo dar de baja el turno fijo.");
    }
  };

  const handleCancelarClase = async (turnoId) => {
    const ok = await confirmar({
      title: '¿Cancelar la clase?',
      message: 'Se cancelará la reserva del alumno y se le devolverá el crédito.',
      confirmText: 'Sí, cancelar'
    });
    if (!ok) return;
    try {
      const respuesta = await reservasService.cancelarClase({ usuarioId: id, turnoId });
      toast.success(respuesta?.message || "Clase cancelada.");
      await Promise.all([recargarTurnos(), recargarUsuario()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo cancelar la clase.");
    }
  };

  const handleRegistrarPago = async () => {
    if (!pago.monto) return toast.error("Ingresá un monto.");
    try {
      await administracionService.registrarPagoManual({
        usuarioId: id, mes: Number(pago.mes), anio: new Date().getFullYear(),
        montoAbonado: parseFloat(pago.monto), metodoPago: pago.metodo
      });
      toast.success("Pago registrado con éxito.");
      await Promise.all([recargarPagos(), recargarUsuario()]);
      setPago({ ...pago, monto: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al registrar el pago.");
    }
  };

  const handleOtorgarCreditos = async (cantidad) => {
    if (cantidad === 0) return;

    const ok = await confirmar({
      title: cantidad > 0 ? '¿Sumar créditos?' : '¿Restar créditos?',
      message: <>Se {cantidad > 0 ? 'sumarán' : 'restarán'} <strong className="text-mm-dark">{Math.abs(cantidad)}</strong> créditos a {usuario.nombreCompleto}.</>,
      confirmText: cantidad > 0 ? 'Sí, sumar' : 'Sí, restar',
      variant: cantidad > 0 ? 'primary' : 'danger'
    });
    if (!ok) return;

    try {
      await membresiasService.otorgarCreditosExtra({ usuarioId: id, cantidadCreditos: cantidad });
      await recargarUsuario();
      toast.success(`Se ${cantidad > 0 ? 'sumaron' : 'restaron'} ${Math.abs(cantidad)} créditos.`);
      setCreditosAOtorgar(0);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al modificar créditos.");
    }
  };

  const handleCambiarMembresia = async () => {
    if (!membresiaSeleccionada) return toast.error("Seleccioná una membresía.");

    const membresia = membresiasDisponibles.find((m) => String(m.id) === String(membresiaSeleccionada));
    const ok = await confirmar({
      title: '¿Asignar membresía?',
      message: <>Se asignará el plan <strong className="text-mm-dark">{membresia?.nombre}</strong> a {usuario.nombreCompleto}.</>,
      confirmText: 'Sí, asignar',
      variant: 'primary'
    });
    if (!ok) return;
    try {
      await membresiasService.asignarMembresia({ usuarioId: id, membresiaId: Number(membresiaSeleccionada) });
      toast.success("Membresía actualizada correctamente.");
      await recargarUsuario();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al cambiar membresía.");
    }
  };

  const handleBloquear = async () => {
    const suspender = usuario.activo;

    const ok = await confirmar({
      title: suspender ? '¿Bloquear usuario?' : '¿Desbloquear usuario?',
      message: suspender
        ? <>{usuario.nombreCompleto} no podrá reservar ni iniciar sesión hasta que lo desbloquees.</>
        : <>{usuario.nombreCompleto} volverá a tener acceso a su cuenta.</>,
      confirmText: suspender ? 'Sí, bloquear' : 'Sí, desbloquear',
      variant: suspender ? 'danger' : 'primary'
    });
    if (!ok) return;

    try {
      await administracionService.cambiarEstadoBloqueo(id, suspender);
      setUsuario(prev => ({ ...prev, activo: !suspender }));
      toast.success(`Alumno ${suspender ? 'bloqueado' : 'desbloqueado'}.`);
    } catch (error) {
      toast.error("Error al cambiar estado.");
      console.error(error);
    }
  };

  const abrirWhatsApp = () => {
    if (!usuario.telefono) return toast.error("El usuario no tiene teléfono registrado.");
    const numeroLimpio = usuario.telefono.replace(/\D/g, '');
    window.open(`https://wa.me/${numeroLimpio}`, '_blank');
  };

  const inputClase = 'w-full bg-mm-light focus:border-mm-purple focus:bg-white rounded-2xl px-4 py-3.5 text-sm outline-none transition-all border border-transparent';

  if (isLoading || !usuario) {
    return (
      <div className="flex justify-center p-12">
        <span className="text-mm-purple animate-pulse font-bold">Cargando perfil...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-6xl mx-auto pb-10 relative">
      {confirmDialog}

      {/* HEADER */}
      <header className="mb-6">
        <button
          onClick={() => navigate(basePath)}
          className="flex items-center gap-2 text-gray-500 hover:text-mm-purple transition-colors text-sm font-bold mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Volver al directorio
        </button>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-mm-surface p-6 rounded-4xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-5">
            <img
              src={urlAvatar(usuario.nombreCompleto, usuario.fotoPerfilUrl)} alt=""
              className="w-12 h-12 rounded-[0.85rem] object-cover border border-gray-100 shrink-0"
            />
            <div>
              <h1 className="text-2xl font-display font-bold text-mm-dark flex items-center gap-3 mb-1 tracking-tight">
                {usuario.nombreCompleto}
                {/* Etiqueta de ROL (si es Staff) */}
                {esStaff && usuario.rol !== 'Alumno' && (
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md uppercase tracking-wider border border-blue-100">
                    {usuario.rol}
                  </span>
                )}
                {!usuario.activo && (
                  <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2.5 py-1 rounded-md uppercase tracking-wider border border-red-100">
                    Bloqueado
                  </span>
                )}
                {usuario.deudor && (
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-md uppercase tracking-wider border border-amber-100">
                    Deudor
                  </span>
                )}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 font-medium">
                <span>{usuario.email}</span>
                {usuario.telefono && (
                  <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 text-gray-600">
                    <PhoneIcon className="w-4 h-4" /> {usuario.telefono}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <button
              onClick={() => setModalEditarAbierto(true)}
              className="flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <PencilSquareIcon className="w-4 h-4" /> Editar
            </button>
            <button
              onClick={abrirWhatsApp}
              className="flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-colors"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.418-.099.824z"/></svg>
              WhatsApp
            </button>
            {esStaff && (
              <button
                onClick={handleBloquear}
                className={`flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors border ${
                  usuario.activo ? 'bg-white border-orange-100 text-orange-500 hover:bg-orange-50' : 'bg-white border-green-100 text-green-600 hover:bg-green-50'
                }`}
              >
                <NoSymbolIcon className="w-4 h-4" />
                {usuario.activo ? 'Bloquear' : 'Desbloquear'}
              </button>
            )}
            {esAdmin && (
              <button
                onClick={handleEliminarUsuario}
                className="flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-red-500 border border-red-100 hover:bg-red-50 transition-colors"
              >
                <TrashIcon className="w-4 h-4" /> Eliminar
              </button>
            )}
          </div>
        </div>
      </header>

      <div className={`grid grid-cols-1 ${esStaff ? 'lg:grid-cols-2' : 'max-w-3xl mx-auto'} gap-6`}>
        
        {/* COLUMNA IZQUIERDA: Entrenamiento y Turnos */}
        <div className="flex flex-col gap-6">
          <section className="bg-mm-surface p-6 rounded-4xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <ClipboardDocumentCheckIcon className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-lg font-bold text-mm-dark">Ficha Técnica</h2>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Objetivos</label>
                <textarea
                  className="w-full mt-1 bg-mm-light border border-gray-200 rounded-xl p-3 text-sm text-mm-dark focus:ring-2 focus:ring-mm-purple outline-none resize-none"
                  rows="2" value={ficha.objetivos} onChange={(e) => setFicha({...ficha, objetivos: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Lesiones / Cuidados</label>
                <textarea
                  className="w-full mt-1 bg-mm-light border border-gray-200 rounded-xl p-3 text-sm text-mm-dark focus:ring-2 focus:ring-mm-purple outline-none resize-none"
                  rows="2" value={ficha.lesiones} onChange={(e) => setFicha({...ficha, lesiones: e.target.value})}
                />
              </div>
              <button onClick={handleActualizarFicha} className="w-full bg-blue-50 text-blue-600 py-3 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors">
                Guardar Ficha
              </button>
            </div>
          </section>

          <section className="bg-mm-surface p-6 rounded-4xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
                  <LinkIcon className="w-5 h-5 text-sky-500" />
                </div>
                <h2 className="text-lg font-bold text-mm-dark">Plan de Entrenamiento</h2>
              </div>
              {ficha?.driveItemId ? <PlanFrame url={ficha.driveItemId} colapsable /> : <p className="text-sm text-gray-400 italic">Este alumno todavía no tiene un plan vinculado.</p>}
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  type="text" placeholder="Pegar ID o link del Drive..."
                  className="w-full bg-mm-light border border-gray-200 rounded-xl p-3 text-sm text-mm-dark focus:ring-2 focus:ring-mm-purple outline-none"
                  value={planLink} onChange={(e) => setPlanLink(e.target.value)}
                />
                <button onClick={handleBuscarPestanas} disabled={!planLink} className="bg-mm-dark text-white px-4 rounded-xl font-bold text-xs hover:bg-gray-800 disabled:opacity-50 whitespace-nowrap">
                  Leer Hojas
                </button>
              </div>
              <button onClick={handleVincularPlan} disabled={!planLink.trim()} className="w-full bg-sky-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-sky-600 transition-colors disabled:opacity-50">
                Guardar Vínculo
              </button>
            </div>
          </section>

          <section className="bg-mm-surface p-6 rounded-4xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                <CalendarDaysIcon className="w-5 h-5 text-orange-500" />
              </div>
              <h2 className="text-lg font-bold text-mm-dark">Agenda del Alumno</h2>
            </div>

            <AgregarTurnoUsuario usuarioId={id} onAgregado={() => Promise.all([recargarTurnos(), recargarUsuario()])} />

            <div className="flex flex-col gap-5 mt-5">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Suscripciones Fijas</h3>
                {turnosData.misSuscripcionesFijas.length === 0 ? (
                  <p className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded-xl border border-gray-100">No tiene turnos fijos.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {turnosData.misSuscripcionesFijas.map(fijo => (
                      <div key={fijo.turnoFijoId} className="flex justify-between items-center bg-purple-50 border border-purple-100 p-3 rounded-xl">
                        <div>
                          <p className="font-bold text-sm text-mm-dark">Todos los {nombreDiaSemana(fijo.diaSemana)}</p>
                          <p className="text-xs font-bold text-mm-purple">{formatearHora(fijo.horaInicio)} hs</p>
                        </div>
                        <button onClick={() => handleBajaTurnoFijo(fijo.turnoFijoId)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Próximas Clases</h3>
                {turnosData.proximasClases.length === 0 ? (
                  <p className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded-xl border border-gray-100">No tiene reservas próximas.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                    {turnosData.proximasClases.map(clase => (
                      <div key={clase.turnoId} className="flex justify-between items-center bg-white border border-gray-200 p-3 rounded-xl">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-mm-dark">{etiquetaTurno(clase.fecha, clase.horaInicio)} hs</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wide ${clase.tipoReserva === 'Fija' ? 'text-mm-purple' : 'text-blue-500'}`}>
                            {etiquetaTipoReserva(clase.tipoReserva)}
                          </span>
                        </div>
                        <button onClick={() => handleCancelarClase(clase.turnoId)} className="text-gray-400 hover:text-red-500 text-xs font-bold underline">
                          Cancelar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA: Pagos y Membresías */}
        {esStaff && (
          <div className="flex flex-col gap-6">
            <section className="bg-mm-dark p-6 rounded-4xl shadow-sm text-white relative overflow-hidden border border-gray-800">
              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-mm-purple/45 rounded-xl flex items-center justify-center shrink-0 border border-mm-purple/30">
                    <StarIcon className="w-5 h-5 text-mm-purple" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Membresía</h2>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Plan Asignado</label>
                  <div className="flex gap-2">
                    <select
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-mm-purple"
                      value={membresiaSeleccionada} onChange={(e) => setMembresiaSeleccionada(e.target.value)}
                    >
                      <option value="">Sin membresía asignada</option>
                      {membresiasDisponibles.map((m) => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                    </select>
                    <button onClick={handleCambiarMembresia} className="bg-mm-purple text-white px-4 rounded-xl font-bold text-xs hover:bg-mm-purple/80 transition-colors shadow-sm">
                      Actualizar
                    </button>
                  </div>
                </div>
                <div className="border-t border-gray-700/50 pt-5">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Créditos Disponibles</h2>
                  <div className="text-5xl font-display font-black text-mm-purple mb-5">
                    {usuario.creditosDisponibles} <span className="text-lg font-medium text-gray-500">créditos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number" placeholder="0"
                      className="w-20 bg-gray-800 border border-gray-700 rounded-xl p-3 text-center text-lg font-bold text-white outline-none focus:border-mm-purple [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={creditosAOtorgar} onChange={(e) => setCreditosAOtorgar(Number(e.target.value))}
                    />
                    <button onClick={() => handleOtorgarCreditos(creditosAOtorgar)} className="flex items-center gap-1 bg-green-500/20 text-green-400 px-4 py-3 rounded-xl font-bold text-sm hover:bg-green-500/30 transition-colors flex-1 justify-center">
                      <PlusCircleIcon className="w-5 h-5" /> Sumar
                    </button>
                    <button onClick={() => handleOtorgarCreditos(-Math.abs(creditosAOtorgar))} className="flex items-center gap-1 bg-red-500/20 text-red-400 px-4 py-3 rounded-xl font-bold text-sm hover:bg-red-500/30 transition-colors flex-1 justify-center">
                      <MinusCircleIcon className="w-5 h-5" /> Restar
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-mm-surface p-6 rounded-4xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                  <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
                </div>
                <h2 className="text-lg font-bold text-mm-dark">Pagos</h2>
              </div>
              <div className="flex flex-col gap-4 mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mes a abonar</label>
                    <select
                      className="w-full mt-1 bg-mm-light border border-gray-200 rounded-xl p-3 text-sm font-medium text-mm-dark outline-none focus:ring-2 focus:ring-mm-purple"
                      value={pago.mes} onChange={(e) => setPago({...pago, mes: e.target.value})}
                    >
                      {[...Array(12)].map((_, i) => (
                        <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('es', { month: 'long' }).toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Método</label>
                    <select
                      className="w-full mt-1 bg-mm-light border border-gray-200 rounded-xl p-3 text-sm font-medium text-mm-dark outline-none focus:ring-2 focus:ring-mm-purple"
                      value={pago.metodo} onChange={(e) => setPago({...pago, metodo: e.target.value})}
                    >
                      <option value="Transferencia">Transferencia</option>
                      <option value="Efectivo">Efectivo</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Monto ($)</label>
                  <input
                    type="number" placeholder="Ej: 15000"
                    className="w-full mt-1 bg-mm-light border border-gray-200 rounded-xl p-3 text-sm text-mm-dark focus:ring-2 focus:ring-green-500 outline-none"
                    value={pago.monto} onChange={(e) => setPago({...pago, monto: e.target.value})}
                  />
                </div>
                <button onClick={handleRegistrarPago} className="w-full bg-green-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-600 transition-colors shadow-sm active:scale-95 flex justify-center items-center gap-2">
                  <PlusCircleIcon className="w-5 h-5" /> Registrar Nuevo Pago
                </button>
              </div>
              <div className="border-t border-gray-100 pt-5">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Últimos Pagos Registrados</h3>
                {historialPagos.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No hay pagos recientes.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {historialPagos.slice(0, 5).map((hp) => (
                      <div key={hp.id} className="flex justify-between items-center bg-gray-50 border border-gray-100 p-3 rounded-xl">
                        <div>
                          <p className="font-bold text-sm text-mm-dark">${hp.monto}</p>
                          <p className="text-[10px] text-gray-500 font-medium">{new Date(hp.fechaPago).toLocaleDateString('es-AR')} {hp.metodoPago}</p>
                        </div>
                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md uppercase tracking-wider">
                          {new Date(hp.anioAbonado, hp.mesAbonado - 1).toLocaleString('es', { month: 'long' })} {hp.anioAbonado}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* MODAL DE EDICIÓN CON SELECTOR DE ROL */}
      <Modal isOpen={modalEditarAbierto} onClose={() => !guardandoPerfil && setModalEditarAbierto(false)} title="Editar Perfil">
        <form onSubmit={handleGuardarPerfil} className="flex flex-col gap-4 mt-2">
          
          {esAdmin && (
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Rol en el sistema</label>
              <select
                className={inputClase}
                value={datosEdicion.rol}
                onChange={(e) => setDatosEdicion({ ...datosEdicion, rol: e.target.value })}
              >
                <option value="Alumno">Alumno</option>
                <option value="Profe">Profesor</option>
                <option value="Admin">Administrador</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Nombre Completo</label>
            <input
              type="text" required value={datosEdicion.nombreCompleto} placeholder="Nombre y Apellido"
              onChange={(e) => setDatosEdicion({ ...datosEdicion, nombreCompleto: e.target.value })}
              className={inputClase}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">Teléfono (WhatsApp)</label>
            <input
              type="tel" value={datosEdicion.telefono} placeholder="Teléfono"
              onChange={(e) => setDatosEdicion({ ...datosEdicion, telefono: e.target.value })}
              className={inputClase}
            />
          </div>

          <button type="submit" disabled={guardandoPerfil} className="w-full bg-mm-purple text-white font-bold rounded-xl py-3.5 text-sm hover:opacity-90 disabled:opacity-70 mt-2">
            {guardandoPerfil ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </Modal>
      
    </div>
  );
};