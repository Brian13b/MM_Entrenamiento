import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register';
import toast from 'react-hot-toast';

import './index.css'
import App from './App.jsx'

const updateSW = registerSW({
  onNeedRefresh() {
    toast.custom(
      (t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-xl rounded-2xl pointer-events-auto flex flex-col border border-gray-100 overflow-hidden`}>
          <div className="p-4">
            <h3 className="text-sm font-bold text-mm-dark">¡Nueva versión disponible!</h3>
            <p className="text-xs text-gray-500 mt-1">
              Actualizá la aplicación para obtener las últimas mejoras y correcciones.
            </p>
          </div>
          <div className="bg-gray-50 px-4 py-3 flex gap-2 justify-end border-t border-gray-100">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Más tarde
            </button>
            <button
              onClick={() => {
                updateSW(true);
                toast.dismiss(t.id);
              }}
              className="px-4 py-2 text-xs font-bold bg-mm-purple text-white hover:bg-mm-purple/80 rounded-xl transition-colors shadow-sm"
            >
              Actualizar ahora
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, id: 'pwa-update' }
    );
  },
  onOfflineReady() {
    toast.success('Aplicación actualizada.', {
      style: {
        background: '#1A1A1A',
        color: '#fff',
        borderRadius: '1rem',
        fontSize: '14px',
        fontWeight: 'bold'
      },
      iconTheme: {
        primary: '#6D28D9',
        secondary: '#fff',
      },
    });
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
