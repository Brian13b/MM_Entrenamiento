import { useState, useEffect } from 'react';
import { ClockIcon, UsersIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { horariosService } from '../../../services/horariosService';

export const GrillaDiaria = () => {
  const [fechaOperativa, setFechaOperativa] = useState(new Date().toISOString().split('T')[0]);
  const [turnosDelDia, setTurnosDelDia] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const cargarOperativaDiaria = async (fecha) => {
    try {
      setIsLoading(true);
      const data = await horariosService.getTurnosDelDia(fecha);
      setTurnosDelDia(data || []);
    } catch (error) {
      toast.error("No se pudieron cargar los turnos del día.");
      console.error(error);
      setTurnosDelDia([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarOperativaDiaria(fechaOperativa);
  }, [fechaOperativa]);

  const cambiarDia = (dias) => {
    const fechaActual = new Date(fechaOperativa + 'T12:00:00');
    fechaActual.setDate(fechaActual.getDate() + dias);
    setFechaOperativa(fechaActual.toISOString().split('T')[0]);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between bg-mm-surface p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <button onClick={() => cambiarDia(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Fecha Operativa</span>
          <input 
            type="date" 
            value={fechaOperativa}
            onChange={(e) => setFechaOperativa(e.target.value)}
            className="font-display font-bold text-lg text-mm-dark bg-transparent outline-none text-center cursor-pointer"
          />
        </div>
        <button onClick={() => cambiarDia(1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      </div>

      {isLoading ? (
        <div className="bg-mm-surface p-12 rounded-[2rem] border border-gray-100 flex justify-center text-mm-purple animate-pulse">
          <span className="font-bold">Cargando turnos del día...</span>
        </div>
      ) : turnosDelDia.length === 0 ? (
        <div className="bg-mm-surface p-12 rounded-[2rem] border border-gray-100 text-center text-gray-500 font-medium">
          No hay turnos configurados para esta fecha.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {turnosDelDia.map((turno) => {
            const porcentaje = turno.cupoMaximo > 0 ? Math.round((turno.ocupacionActual / turno.cupoMaximo) * 100) : 0;
            const estaLleno = turno.ocupacionActual >= turno.cupoMaximo;
            
            return (
              <div key={turno.horarioId} className="flex flex-col bg-white border border-gray-200 p-5 rounded-[1.5rem] shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#F8F9FA] rounded-[0.85rem] flex items-center justify-center border border-gray-100">
                      <ClockIcon className="w-6 h-6 text-mm-purple" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-mm-dark leading-none">
                        {turno.horaInicio.slice(0,5)} - {turno.horaFin.slice(0,5)}
                      </span>
                    </div>
                  </div>
                  
                  {estaLleno ? (
                    <span className="bg-red-50 text-red-600 px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide">Lleno</span>
                  ) : (
                    <span className="bg-green-50 text-green-600 px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide">Disponible</span>
                  )}
                </div>

                <div className="mt-auto">
                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-1.5">
                    <span>Ocupación</span>
                    <span className={estaLleno ? 'text-red-500' : 'text-mm-purple'}>
                      {turno.ocupacionActual} / {turno.cupoMaximo}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${estaLleno ? 'bg-red-500' : 'bg-mm-purple'}`} 
                      style={{ width: `${porcentaje}%` }}
                    ></div>
                  </div>
                </div>
                
                <button className="w-full mt-5 bg-[#F8F9FA] text-gray-600 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-100 border border-gray-200 transition-colors flex items-center justify-center gap-2">
                  <UsersIcon className="w-4 h-4" /> Ver Alumnos
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};