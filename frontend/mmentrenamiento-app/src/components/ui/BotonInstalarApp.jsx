import { useState, useEffect } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export const BotonInstalarApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e); 
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    
    setDeferredPrompt(null);
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
  };

  if (!isInstallable) return null;

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
};