import { useState, useEffect, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, UsersIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { horariosService } from '../../../services/horariosService';
import { ModalGestionTurno } from './ModalGestionTurno';

// Función helper para formatear fechas a YYYY-MM-DD en horario LOCAL (evita desfases UTC)
const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const GrillaDiaria = () => {
  // Calculamos el lunes pero usando la zona horaria local
  const [lunesSemana, setLunesSemana] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar al lunes
    const monday = new Date(d.setDate(diff));
    return getLocalDateString(monday);
  });

  const [turnosSemana, setTurnosSemana] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const [modalTurnoAbierto, setModalTurnoAbierto] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [fechaTurnoSeleccionado, setFechaTurnoSeleccionado] = useState('');

  // Generamos los 5 días sumando días al lunes de forma segura
  const diasSemana = useMemo(() => {
    // Parseamos el string "YYYY-MM-DD" a números para evitar saltos raros de JS
    const [year, month, day] = lunesSemana.split('-').map(Number);

    return [0, 1, 2, 3, 4].map(i => {
      const d = new Date(year, month - 1, day);
      d.setDate(d.getDate() + i);
      
      return {
        nombre: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'][i],
        fechaIso: getLocalDateString(d), // Usamos el helper local
        diaMes: d.getDate(),
        mesNombre: d.toLocaleString('es', { month: 'long' })
      };
    });
  }, [lunesSemana]);

  const cargarOperativaSemanal = async () => {
    try {
      setIsLoading(true);
      const promesas = diasSemana.map(dia => 
        horariosService.getTurnosDelDia(dia.fechaIso).then(data => ({ fecha: dia.fechaIso, turnos: data || [] }))
      );
      
      const resultados = await Promise.all(promesas);
      const mapaTurnos = {};
      resultados.forEach(res => { mapaTurnos[res.fecha] = res.turnos; });
      setTurnosSemana(mapaTurnos);
    } catch (error) {
      toast.error("Error al cargar la semana.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarOperativaSemanal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lunesSemana]);

  const cambiarSemana = (semanas) => {
    const [year, month, day] = lunesSemana.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + (semanas * 7));
    setLunesSemana(getLocalDateString(d));
  };

  const abrirModalTurno = (turno, fecha) => {
    setTurnoSeleccionado(turno);
    setFechaTurnoSeleccionado(fecha);
    setModalTurnoAbierto(true);
  };

  const horasAlineadas = useMemo(() => {
    const horas = new Set();
    Object.values(turnosSemana).forEach(turnosDia => {
      turnosDia.forEach(t => horas.add(t.horaInicio.slice(0, 5)));
    });
    return Array.from(horas).sort();
  }, [turnosSemana]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between bg-mm-surface p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <button onClick={() => cambiarSemana(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Semana del</span>
          <span className="font-display font-bold text-lg text-mm-dark">
            {diasSemana[0]?.diaMes} al {diasSemana[4]?.diaMes} de {diasSemana[0]?.mesNombre}
          </span>
        </div>
        <button onClick={() => cambiarSemana(1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      </div>

      {isLoading ? (
        <div className="bg-mm-surface p-12 rounded-4xl border border-gray-100 flex justify-center text-mm-purple animate-pulse">
          <span className="font-bold">Cargando grilla semanal...</span>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
          <div className="min-w-200">
            
            <div className="grid grid-cols-6 bg-[#F8F9FA] border-b border-gray-200">
              <div className="p-4 flex items-center justify-center border-r border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Horario</span>
              </div>
              {diasSemana.map(dia => (
                <div key={dia.fechaIso} className="p-4 flex flex-col items-center justify-center border-r border-gray-100 last:border-0">
                  <span className="text-sm font-bold text-mm-dark">{dia.nombre}</span>
                  <span className="text-xs font-medium text-gray-500">{dia.diaMes}</span>
                </div>
              ))}
            </div>

            {horasAlineadas.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-sm font-medium">No hay clases configuradas para esta semana.</div>
            ) : (
              horasAlineadas.map(hora => (
                <div key={hora} className="grid grid-cols-6 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                  
                  <div className="p-3 flex items-center justify-center border-r border-gray-100 bg-[#F8F9FA]/50">
                    <span className="font-bold text-mm-dark text-sm">{hora}</span>
                  </div>

                  {diasSemana.map(dia => {
                    const turno = (turnosSemana[dia.fechaIso] || []).find(t => t.horaInicio.slice(0, 5) === hora);
                    
                    if (!turno) return <div key={dia.fechaIso} className="p-3 border-r border-gray-100 last:border-0"></div>;

                    const estaLleno = turno.ocupacionActual >= turno.cupoMaximo;
                    const porcentaje = turno.cupoMaximo > 0 ? Math.round((turno.ocupacionActual / turno.cupoMaximo) * 100) : 0;

                    return (
                      <div key={dia.fechaIso} className="p-2 border-r border-gray-100 last:border-0">
                        <div 
                          onClick={() => abrirModalTurno(turno, dia.fechaIso)}
                          className={`h-full p-2.5 rounded-xl cursor-pointer transition-all border flex flex-col justify-between group shadow-sm hover:shadow-md ${
                            estaLleno ? 'bg-red-50 border-red-100 hover:border-red-300' : 'bg-white border-gray-200 hover:border-mm-purple'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <UsersIcon className={`w-3.5 h-3.5 ${estaLleno ? 'text-red-500' : 'text-mm-purple'}`} />
                            <span className={`text-xs font-bold ${estaLleno ? 'text-red-700' : 'text-mm-dark'}`}>
                              {turno.ocupacionActual}/{turno.cupoMaximo}
                            </span>
                          </div>
                          
                          <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                            <div 
                              className={`h-1 rounded-full transition-all duration-500 ${estaLleno ? 'bg-red-500' : 'bg-mm-purple'}`} 
                              style={{ width: `${porcentaje}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <ModalGestionTurno 
        isOpen={modalTurnoAbierto}
        onClose={() => setModalTurnoAbierto(false)}
        turno={turnoSeleccionado}
        fechaOperativa={fechaTurnoSeleccionado}
        onReservaExitosa={cargarOperativaSemanal} 
      />
    </div>
  );
};