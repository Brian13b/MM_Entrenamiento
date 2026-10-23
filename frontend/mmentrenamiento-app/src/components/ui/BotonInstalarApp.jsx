import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { usePwaStore } from '../../store/usePwaStore';

export const BotonInstalarApp = () => {
  const deferredPrompt = usePwaStore((state) => state.deferredPrompt);
  const clearPrompt = usePwaStore((state) => state.clearPrompt);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      clearPrompt(); 
    }
  };

  if (!deferredPrompt) return null;

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