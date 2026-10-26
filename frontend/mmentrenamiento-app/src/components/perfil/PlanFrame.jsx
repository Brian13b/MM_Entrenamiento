import { useState } from 'react';
import { esUrlHttp, construirUrlEmbed } from '../../utils/onedrive';

export const PlanFrame = ({ url, alto = 'h-[70vh]' }) => {
  const [cargando, setCargando] = useState(true);

  if (!esUrlHttp(url)) {
    return <p className="text-xs text-gray-400 italic">El plan vinculado no es un enlace válido.</p>;
  }

  return (
    <div className={`relative w-full ${alto} rounded-xl border border-gray-200 bg-gray-50 overflow-hidden shadow-inner`}>
      
      {cargando && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-0">
          <div className="w-8 h-8 border-4 border-mm-purple border-t-transparent rounded-full animate-spin mb-3"></div>
          <span className="text-sm font-bold text-gray-400 animate-pulse">Cargando Excel...</span>
        </div>
      )}

      <iframe
        title="Plan de entrenamiento"
        src={construirUrlEmbed(url)}
        onLoad={() => setCargando(false)}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="relative z-10 w-full h-full"
      />

      {/* Escudo Invisible */}
      <div className="absolute top-0 left-0 right-0 bottom-11 z-20 bg-transparent cursor-default" title="Vista de solo lectura" />
      
    </div>
  );
};