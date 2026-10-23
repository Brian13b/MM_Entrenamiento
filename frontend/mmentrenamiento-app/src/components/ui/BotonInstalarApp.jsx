import { useState, useEffect } from 'react';
import { ArrowDownTrayIcon, ShareIcon, PlusSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { usePwaStore } from '../../store/usePwaStore';

export const BotonInstalarApp = () => {
  const deferredPrompt = usePwaStore((state) => state.deferredPrompt);
  const clearPrompt = usePwaStore((state) => state.clearPrompt);
  
  const [showIosPrompt, setShowIosPrompt] = useState(false);

  useEffect(() => {
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);
    
    if (isIos && !isInStandaloneMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowIosPrompt(true);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      clearPrompt();
    }
  };

  if (deferredPrompt) {
    return (
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 bg-mm-dark text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-800 transition-all active:scale-95"
      >
        <ArrowDownTrayIcon className="w-5 h-5 text-mm-purple" />
        <span className="hidden sm:inline">Instalar App</span>
        <span className="sm:hidden">Instalar</span>
      </button>
    );
  }

  if (showIosPrompt) {
    return (
      <div className="bg-white p-3 rounded-2xl shadow-lg border border-gray-100 flex flex-col gap-2 relative w-65 animate-fade-in text-sm text-mm-dark">
        <button 
          onClick={() => setShowIosPrompt(false)} 
          className="absolute top-2 right-2 text-gray-400 hover:text-mm-dark transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        <p className="font-bold text-mm-purple pr-4">Instalar en iPhone</p>
        <p className="text-xs text-gray-600 leading-relaxed">
          Tocá <ShareIcon className="w-4 h-4 inline-block text-blue-500 mx-0.5" /> <strong>Compartir</strong> en la barra de Safari y luego <PlusSquareIcon className="w-4 h-4 inline-block text-gray-600 mx-0.5" /> <strong>Agregar a inicio</strong>.
        </p>
      </div>
    );
  }

  return null;
};