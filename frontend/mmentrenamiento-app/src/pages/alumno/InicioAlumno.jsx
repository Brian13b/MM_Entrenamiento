import { useState, useEffect } from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/solid';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

import { reservasService } from '../../services/reservasService';
import { membresiasService } from '../../services/membresiasService';
import { administracionService } from '../../services/administracionService';

export const InicioAlumno = () => {
  const { usuario } = useAuthStore();
  const [datosDashboard, setDatosDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);

        const [misTurnos, misCreditos, anuncio] = await Promise.all([
          reservasService.getMisTurnos().catch(() => ({ proximasClases: [], turnosFijosSemana: 0 })),
          membresiasService.getMisCreditos().catch(() => ({ creditos: 0, diasVencimiento: 0 })),
          administracionService.getAnuncioGlobal().catch(() => ({ mensaje: "No hay avisos nuevos por el momento." }))
        ]);

        setDatosDashboard({
          creditos: misCreditos.creditos || 0,
          turnosFijosSemana: misTurnos.turnosFijosSemana || 0,
          mensajeImportante: anuncio.mensaje || "No hay avisos nuevos por el momento.",
          diasVencimientoMembresia: misCreditos.diasVencimiento || 0,
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
    }
  }, [usuario]);

  const handleCancelarClase = async (idClase) => {
    try {
      await reservasService.cancelarClase({ turnoId: idClase }); 
      
      setDatosDashboard(prev => ({
        ...prev,
        proximasClases: prev.proximasClases.filter(c => c.id !== idClase),
        creditos: prev.creditos + 1 
      }));
      
      toast.success("Clase cancelada. Se te devolvió 1 crédito.");
    } catch (error) {
      toast.error(error.response?.data?.message || "No se pudo cancelar la clase.");
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
    /* Grilla general */
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-stretch animate-fade-in pt-2">
      
      {/* Widget: Créditos */}
      <div className="md:col-span-1 lg:col-span-2 bg-mm-surface rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
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
      <div className="md:col-span-1 lg:col-span-3 bg-mm-surface rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
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
          <button className="text-sm font-bold text-mm-purple hover:underline cursor-pointer">
            Ver todas
          </button>
        </div>

        {datosDashboard.proximasClases.length === 0 ? (
          <div className="bg-mm-surface rounded-[2rem] p-8 text-center shadow-sm border border-gray-100">
            <p className="text-sm md:text-base text-mm-dark opacity-50 font-medium">No tenés clases próximas reservadas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {datosDashboard.proximasClases.map((cls) => (
              <div
                key={cls.id}
                className="bg-mm-surface rounded-[1.5rem] p-4 flex items-center gap-4 shadow-sm border border-gray-100 transition-all hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-mm-light">
                  <CalendarDaysIcon className="w-6 h-6 text-mm-purple" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold mb-0.5 uppercase tracking-wider text-mm-purple truncate">
                    {cls.tipoTurno}
                  </p>
                  <p className="text-sm md:text-base font-bold text-mm-dark truncate">
                    {cls.dia} {cls.fecha} {cls.mes} · {cls.hora}
                  </p>
                </div>
                <button
                  onClick={() => handleCancelarClase(cls.id)}
                  className="text-[11px] font-bold flex-shrink-0 text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors text-center"
                >
                  Cancelar<br />Clase
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};