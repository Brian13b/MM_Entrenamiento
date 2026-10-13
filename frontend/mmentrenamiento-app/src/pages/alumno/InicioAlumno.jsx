import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDaysIcon } from '@heroicons/react/24/solid';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

import { reservasService } from '../../services/reservasService';
import { membresiasService } from '../../services/membresiasService';
import { administracionService } from '../../services/administracionService';
import { Modal } from '../../components/ui/Modal';

export const InicioAlumno = () => {
  const navigate = useNavigate();
  const { usuario } = useAuthStore();
  
  const [datosDashboard, setDatosDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [classToCancel, setClassToCancel] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);

        const [misTurnos, respuestaCreditos, anuncio] = await Promise.all([
          reservasService.getMisTurnos().catch(() => ({ proximasClases: [], turnosFijosActivos: 0 })),
          membresiasService.getMisCreditos().catch(() => []), 
          administracionService.getAnuncioGlobal().catch(() => ({ mensaje: "No hay avisos nuevos por el momento." }))
        ]);

        const fechaHoy = new Date();
        const mesActual = fechaHoy.getMonth() + 1;
        const anioActual = fechaHoy.getFullYear();

        let creditosDisponibles = 0;
        if (Array.isArray(respuestaCreditos)) {
          const billeteraMesActual = respuestaCreditos.find(
            (b) => b.mes === mesActual && b.anio === anioActual
          );
          
          if (billeteraMesActual) {
            creditosDisponibles = billeteraMesActual.totalDisponibles;
          }
        }

        setDatosDashboard({
          creditos: creditosDisponibles,
          turnosFijosSemana: misTurnos.turnosFijosActivos || 0,
          mensajeImportante: anuncio.mensaje || "No hay avisos nuevos por el momento.",
          diasVencimientoMembresia: 0,
          proximasClases: misTurnos.proximasClases || [] 
        });

      } catch (error) {
        toast.error("Error al cargar tu información.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (usuario?.id) {
      fetchDashboard();
    } else if (usuario === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
    }
  }, [usuario]);

  const abrirModalCancelacion = (cls) => {
    setClassToCancel(cls);
    setShowCancelModal(true);
  };

  const confirmarCancelacion = async () => {
    if (!classToCancel) return;
    
    try {
      setIsProcessing(true);
      await reservasService.cancelarClase({ turnoId: classToCancel.turnoId }); 
      
      setDatosDashboard(prev => ({
        ...prev,
        proximasClases: prev.proximasClases.filter(c => c.turnoId !== classToCancel.turnoId),
        creditos: prev.creditos + 1 
      }));
      
      toast.success("Clase cancelada. Se te devolvió 1 crédito.");
      setShowCancelModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo cancelar la clase.");
    } finally {
      setIsProcessing(false);
      setClassToCancel(null);
    }
  };

  if (isLoading || !datosDashboard) {
    return (
      <div className="flex justify-center items-center h-64 text-mm-purple animate-pulse">
        <span className="font-bold text-lg">Cargando tu información...</span>
      </div>
    );
  }

  return (
    <>
      <Modal 
        isOpen={showCancelModal} 
        onClose={() => !isProcessing && setShowCancelModal(false)}
        title="¿Cancelar reserva?"
      >
        <p className="text-sm text-gray-500 mb-6">
          Estás por cancelar tu turno del <strong className="text-mm-dark">{classToCancel?.dia} a las {classToCancel?.hora} hs</strong>. Recuperarás tu crédito para usarlo en otro momento.
        </p>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowCancelModal(false)}
            disabled={isProcessing}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-mm-light text-mm-dark hover:bg-gray-200 transition-colors"
          >
            Volver
          </button>
          <button 
            onClick={confirmarCancelacion}
            disabled={isProcessing}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {isProcessing ? "Cancelando..." : "Sí, cancelar"}
          </button>
        </div>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-stretch animate-fade-in pt-2">
        
        {/* Widget: Créditos */}
        <div className="md:col-span-1 lg:col-span-2 bg-mm-surface rounded-4xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-1">
            <span className="text-sm font-medium tracking-wide uppercase text-mm-dark opacity-50">
              Tus Créditos
            </span>
            <div className="text-xs px-3 py-1 rounded-full font-bold bg-purple-50 text-mm-purple">
              Activo
            </div>
          </div>

          <div className="flex items-end gap-4 mt-2 mb-4">
            <span className="text-[72px] sm:text-[88px] font-display font-black text-mm-purple leading-none tracking-tighter">
              {datosDashboard.creditos}
            </span>
            <div className="pb-3 flex flex-col">
              <span className="text-sm font-medium text-mm-dark opacity-60">créditos</span>
              <span className="text-sm font-medium text-mm-dark opacity-60">disponibles</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl px-4 py-3 bg-mm-light">
            <span className="text-sm md:text-base font-medium text-mm-dark">
              Tienes <span className="text-mm-purple font-bold">{datosDashboard.turnosFijosSemana} turnos fijos</span> esta semana
            </span>
          </div>
        </div>
        
        {/* Widget: Información y Membresía */}
        <div className="md:col-span-1 lg:col-span-3 bg-mm-surface rounded-4xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <span className="text-sm font-medium tracking-wide uppercase text-mm-dark opacity-50">
              Información importante
            </span>
            <p className="text-sm md:text-base font-semibold my-4 text-mm-dark leading-relaxed">
              {datosDashboard.mensajeImportante}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 rounded-2xl px-4 py-4 bg-mm-dark mt-auto">
            <p className="text-sm font-medium text-mm-light text-center">
              Tu membresía vence en <span className="text-mm-purple font-bold">{datosDashboard.diasVencimientoMembresia}</span> días.
            </p>
            <span className="h-px w-full sm:h-5 sm:w-px bg-gray-600 my-1 sm:my-0" />
            <p className="text-sm font-medium text-mm-light text-center">
              <span className="text-mm-purple font-bold">Renovala</span> para no perder tus turnos.
            </p>
          </div>
        </div>

        {/* Lista: Próximas Clases */}
        <div className="md:col-span-2 lg:col-span-5 mt-4 pb-6">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg md:text-xl font-bold text-mm-dark">Próximas Clases</h2>
            <button 
              onClick={() => navigate('/alumno/mis-turnos')}
              className="text-sm font-bold text-mm-purple hover:underline cursor-pointer"
            >
              Ver todas
            </button>
          </div>

          {datosDashboard.proximasClases.length === 0 ? (
            <div className="bg-mm-surface rounded-4xl p-8 text-center shadow-sm border border-gray-100">
              <p className="text-sm md:text-base text-mm-dark opacity-50 font-medium">No tenés clases próximas reservadas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {datosDashboard.proximasClases.map((cls) => (
                <div
                  key={cls.turnoId}
                  className="bg-mm-surface rounded-3xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 transition-all hover:shadow-md"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-mm-light">
                    <CalendarDaysIcon className="w-6 h-6 text-mm-purple" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold mb-0.5 uppercase tracking-wider text-mm-purple truncate">
                      {cls.tipoReserva}
                    </p>
                    <p className="text-sm md:text-base font-bold text-mm-dark truncate">
                      {cls.dia} {cls.fecha} {cls.mes} · {cls.hora}
                    </p>
                  </div>
                  <button
                    onClick={() => abrirModalCancelacion(cls)}
                    className="text-[11px] font-bold shrink-0 text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors text-center"
                  >
                    Cancelar<br />Clase
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};