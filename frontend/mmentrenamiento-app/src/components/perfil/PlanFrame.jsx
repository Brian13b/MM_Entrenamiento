import { useState } from 'react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const esUrlHttp = (valor) => /^https?:\/\//i.test(valor || '');

const construirUrlEmbed = (url) => {
  let nuevaUrl = url;
  
  if (!/[?&]action=embedview/i.test(nuevaUrl)) {
    nuevaUrl += nuevaUrl.includes('?') ? '&action=embedview' : '?action=embedview';
  }
  
  if (!/wdAllowInteractivity/i.test(nuevaUrl)) {
    nuevaUrl += '&wdAllowInteractivity=True&wdHideHeaders=True';
  }

  return nuevaUrl;
};

export const PlanFrame = ({ url, colapsable = false, alto = 'h-[70vh]' }) => {
  const [visible, setVisible] = useState(!colapsable);

  if (!esUrlHttp(url)) {
    return <p className="text-xs text-gray-400 italic">El plan vinculado no es un enlace válido. Consultá con tu profe.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        {colapsable && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg border border-sky-100 transition-colors"
          >
            {visible ? 'Ocultar plan' : 'Ver plan aquí'}
          </button>
        )}
        <a
          href={url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-bold text-mm-purple hover:underline"
        >
          Abrir en una pestaña nueva <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        </a>
      </div>

      {visible && (
        <>
          <iframe
            title="Plan de entrenamiento"
            src={construirUrlEmbed(url)}
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-popups"
            className={`w-full ${alto} rounded-xl border border-gray-200 bg-white shadow-inner`}
          />
          <p className="text-[11px] text-gray-400">Vista de solo lectura (podés navegar por las pestañas inferiores). Si no carga, abrilo en una pestaña nueva.</p>
        </>
      )}
    </div>
  );
};