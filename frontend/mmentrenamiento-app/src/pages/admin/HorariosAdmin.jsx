import { useState } from 'react';
import { CalendarDaysIcon, Cog8ToothIcon } from '@heroicons/react/24/outline';
import { GrillaDiaria } from '../../pages/admin/horarios/GrillaDiaria';
import { ConfiguracionPlantilla } from '../../pages/admin/horarios/ConfiguracionPlantilla';

export const HorariosAdmin = () => {
  const [vistaActiva, setVistaActiva] = useState('grilla');

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-mm-dark">Agenda y Horarios</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Administrá la ocupación diaria y la plantilla semanal.</p>
        </div>

        <div className="flex bg-mm-surface p-1 rounded-xl border border-gray-100 shadow-sm w-full sm:w-auto">
          <button 
            onClick={() => setVistaActiva('grilla')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors ${vistaActiva === 'grilla' ? 'bg-purple-50 text-mm-purple' : 'text-gray-500 hover:text-mm-dark'}`}
          >
            <CalendarDaysIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Operativa Diaria</span>
            <span className="sm:hidden">Diaria</span>
          </button>
          <button 
            onClick={() => setVistaActiva('configuracion')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-colors ${vistaActiva === 'configuracion' ? 'bg-purple-50 text-mm-purple' : 'text-gray-500 hover:text-mm-dark'}`}
          >
            <Cog8ToothIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Configurar Plantilla</span>
            <span className="sm:hidden">Plantilla</span>
          </button>
        </div>
      </header>

      {vistaActiva === 'grilla' ? <GrillaDiaria /> : <ConfiguracionPlantilla />}
    </div>
  );
};