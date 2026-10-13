import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CurrencyDollarIcon, ClipboardDocumentCheckIcon, LinkIcon, NoSymbolIcon, PlusCircleIcon, MinusCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { seguimientoService } from '../../../services/seguimientoService';
import { administracionService } from '../../../services/administracionService';
import { membresiasService } from '../../../services/membresiasService';

export const PerfilUsuarioAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [usuario, setUsuario] = useState(null);
  
  const [ficha, setFicha] = useState({ objetivos: '', lesiones: '' });
  const [pago, setPago] = useState({ monto: '', metodo: 'Transferencia', mes: new Date().getMonth() + 1 });
  const [creditosAOtorgar, setCreditosAOtorgar] = useState(0);
  
  const [planLink, setPlanLink] = useState('');
  const [pestanasDisponibles, setPestanasDisponibles] = useState([]);
  const [pestanaSeleccionada, setPestanaSeleccionada] = useState('');
  const [buscandoPestanas, setBuscandoPestanas] = useState(false);

  useEffect(() => {
    const fetchDatosCRM = async () => {
      try {
        setIsLoading(true);
        const [datosUsuario, datosFicha] = await Promise.all([
          administracionService.getUsuarioById(id),
          seguimientoService.getFichaAlumno(id)
        ]);

        setUsuario(datosUsuario);
        
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
  }, [id]);

  const handleActualizarFicha = async () => {
    try {
      await seguimientoService.actualizarFichaAlumno(id, ficha);
      toast.success("Ficha médica actualizada.");
    } catch (error) {
      toast.error("Error al actualizar ficha.");
      console.error(error);
    }
  };

  const handleRegistrarPago = async () => {
    if (!pago.monto) return toast.error("Ingresá un monto.");
    try {
      await administracionService.registrarPagoManual({
        usuarioId: id,
        mes: Number(pago.mes),
        anio: new Date().getFullYear(),
        montoAbonado: parseFloat(pago.monto),
        metodoPago: pago.metodo
      });
      toast.success("Pago registrado con éxito.");
      setPago({ ...pago, monto: '' });
    } catch (error) {
      toast.error("Error al registrar el pago."); 
      console.error(error);
    }
  };

  const handleBloquear = async () => {
    const suspender = usuario.activo;
    try {
      await administracionService.cambiarEstadoBloqueo(id, suspender);
      setUsuario(prev => ({ ...prev, activo: !suspender }));
      toast.success(`Alumno ${suspender ? 'bloqueado' : 'desbloqueado'} correctamente.`);
    } catch (error) {
      toast.error("Error al cambiar estado.");
      console.error(error);
    }
  };

  const handleOtorgarCreditos = async (cantidad) => {
    if (cantidad === 0) return;
    try {
      await membresiasService.otorgarCreditosExtra({ 
        usuarioId: id, 
        cantidadCreditos: cantidad 
      });
      setUsuario(prev => ({ ...prev, creditosDisponibles: prev.creditosDisponibles + cantidad }));
      toast.success(`Se ${cantidad > 0 ? 'sumaron' : 'restaron'} ${Math.abs(cantidad)} créditos.`);
      setCreditosAOtorgar(0);
    } catch (error) {
      toast.error("Error al modificar créditos.");
      console.error(error);
    }
  };

  const handleBuscarPestanas = async () => {
    if (!planLink) return toast.error("Ingresá un link de OneDrive primero.");
    try {
      setBuscandoPestanas(true);
      setTimeout(() => {
        setPestanasDisponibles(['Meso 18', 'Meso 17', 'Meso 16', 'Meso 15']);
        setPestanaSeleccionada('Meso 18');
        setBuscandoPestanas(false);
        toast.success("Pestañas encontradas.");
      }, 1000);
    } catch (error) {
      toast.error("Error al leer el archivo de OneDrive.");
      setBuscandoPestanas(false);
      console.error(error);
    }
  };

  const handleVincularPlan = async () => {
    if (!planLink || !pestanaSeleccionada) return toast.error("Faltan datos del plan.");
    try {
      await seguimientoService.vincularPlan(id, { 
        driveItemId: planLink, 
        nombrePestaña: pestanaSeleccionada 
      });
      toast.success(`Plan vinculado a la pestaña: ${pestanaSeleccionada}`);
      setPestanasDisponibles([]);
    } catch (error) {
      toast.error("Error al vincular el plan.");
      console.error(error)
    }
  };

  if (isLoading || !usuario) {
    return (
      <div className="flex justify-center p-12">
        <span className="text-mm-purple animate-pulse font-bold">Cargando perfil...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <header className="mb-6">
        <button 
          onClick={() => navigate('/admin/usuarios')}
          className="flex items-center gap-2 text-gray-500 hover:text-mm-purple transition-colors text-sm font-bold mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Volver al directorio
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#F8F9FA] rounded-2xl flex items-center justify-center text-2xl text-mm-dark font-display font-black border border-gray-100 shadow-sm">
              {usuario.nombreCompleto.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-mm-dark flex items-center gap-2">
                {usuario.nombreCompleto}
                {!usuario.activo && (
                  <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-wider border border-red-100">
                    Bloqueado
                  </span>
                )}
              </h1>
              <p className="text-sm text-gray-500">{usuario.email} {usuario.telefono ? `• ${usuario.telefono}` : ''}</p>
            </div>
          </div>
          
          <button 
            onClick={handleBloquear}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors border ${
              usuario.activo 
                ? 'bg-white border-red-100 text-red-500 hover:bg-red-50' 
                : 'bg-white border-green-100 text-green-600 hover:bg-green-50'
            }`}
          >
            <NoSymbolIcon className="w-4 h-4" />
            {usuario.activo ? 'Bloquear Alumno' : 'Desbloquear'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMNA IZQUIERDA: Entrenamiento */}
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
                  rows="2"
                  value={ficha.objetivos}
                  onChange={(e) => setFicha({...ficha, objetivos: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Lesiones / Cuidados</label>
                <textarea
                  className="w-full mt-1 bg-mm-light border border-gray-200 rounded-xl p-3 text-sm text-mm-dark focus:ring-2 focus:ring-mm-purple outline-none resize-none"
                  rows="2"
                  value={ficha.lesiones}
                  onChange={(e) => setFicha({...ficha, lesiones: e.target.value})}
                />
              </div>
              <button 
                onClick={handleActualizarFicha}
                className="w-full bg-blue-50 text-blue-600 py-3 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors"
              >
                Guardar Ficha
              </button>
            </div>
          </section>

          <section className="bg-mm-surface p-6 rounded-4xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
                <LinkIcon className="w-5 h-5 text-sky-500" />
              </div>
              <h2 className="text-lg font-bold text-mm-dark">Plan OneDrive</h2>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Pegar ID o link del Drive..."
                  className="w-full bg-mm-light border border-gray-200 rounded-xl p-3 text-sm text-mm-dark focus:ring-2 focus:ring-mm-purple outline-none"
                  value={planLink}
                  onChange={(e) => setPlanLink(e.target.value)}
                />
                <button 
                  onClick={handleBuscarPestanas}
                  disabled={!planLink || buscandoPestanas}
                  className="bg-mm-dark text-white px-4 rounded-xl font-bold text-xs hover:bg-gray-800 disabled:opacity-50 whitespace-nowrap"
                >
                  {buscandoPestanas ? 'Buscando...' : 'Leer Hojas'}
                </button>
              </div>

              {pestanasDisponibles.length > 0 && (
                <div className="animate-fade-in bg-sky-50 p-4 rounded-xl border border-sky-100 mt-2">
                  <label className="text-xs font-bold text-sky-800 uppercase tracking-wide block mb-2">Seleccionar Pestaña</label>
                  <select 
                    className="w-full bg-white border border-sky-200 rounded-xl p-3 text-sm text-mm-dark outline-none mb-3 focus:ring-2 focus:ring-sky-500"
                    value={pestanaSeleccionada}
                    onChange={(e) => setPestanaSeleccionada(e.target.value)}
                  >
                    {pestanasDisponibles.map((p, idx) => (
                      <option key={idx} value={p}>{p}</option>
                    ))}
                  </select>
                  <button 
                    onClick={handleVincularPlan}
                    className="w-full bg-sky-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-sky-600 transition-colors"
                  >
                    Confirmar Vinculación
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA: Administración */}
        <div className="flex flex-col gap-6">
          <section className="bg-mm-dark p-6 rounded-4xl shadow-sm text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <CurrencyDollarIcon className="w-24 h-24" />
            </div>
            
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wide mb-1 relative z-10">Balance Actual</h2>
            <div className="text-5xl font-display font-black text-mm-purple mb-6 relative z-10">
              {usuario.creditosDisponibles} <span className="text-lg font-medium text-gray-400">créditos</span>
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <input
                type="number"
                placeholder="0"
                className="w-20 bg-gray-800 border border-gray-700 rounded-xl p-3 text-center text-lg font-bold text-white outline-none focus:border-mm-purple"
                value={creditosAOtorgar}
                onChange={(e) => setCreditosAOtorgar(Number(e.target.value))}
              />
              <button 
                onClick={() => handleOtorgarCreditos(creditosAOtorgar)}
                className="flex items-center gap-1 bg-green-500/20 text-green-400 px-4 py-3 rounded-xl font-bold text-sm hover:bg-green-500/30 transition-colors flex-1 justify-center"
              >
                <PlusCircleIcon className="w-5 h-5" /> Sumar
              </button>
              <button 
                onClick={() => handleOtorgarCreditos(-Math.abs(creditosAOtorgar))}
                className="flex items-center gap-1 bg-red-500/20 text-red-400 px-4 py-3 rounded-xl font-bold text-sm hover:bg-red-500/30 transition-colors flex-1 justify-center"
              >
                <MinusCircleIcon className="w-5 h-5" /> Restar
              </button>
            </div>
          </section>

          <section className="bg-mm-surface p-6 rounded-4xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
              </div>
              <h2 className="text-lg font-bold text-mm-dark">Registrar Pago</h2>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mes a abonar</label>
                  <select 
                    className="w-full mt-1 bg-mm-light border border-gray-200 rounded-xl p-3 text-sm font-medium text-mm-dark outline-none focus:ring-2 focus:ring-mm-purple"
                    value={pago.mes}
                    onChange={(e) => setPago({...pago, mes: e.target.value})}
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
                    value={pago.metodo}
                    onChange={(e) => setPago({...pago, metodo: e.target.value})}
                  >
                    <option value="Transferencia">Transferencia</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="MercadoPago">MercadoPago</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Monto ($)</label>
                <input
                  type="number"
                  className="w-full mt-1 bg-mm-light border border-gray-200 rounded-xl p-3 text-sm text-mm-dark focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Ej: 15000"
                  value={pago.monto}
                  onChange={(e) => setPago({...pago, monto: e.target.value})}
                />
              </div>

              <button 
                onClick={handleRegistrarPago}
                className="w-full bg-green-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-600 transition-colors shadow-sm active:scale-95 mt-2"
              >
                Confirmar Pago
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};