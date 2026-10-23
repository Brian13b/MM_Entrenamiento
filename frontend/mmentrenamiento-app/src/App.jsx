import { AppRouter } from './router/AppRouter';
import { useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { usePwaStore } from './store/usePwaStore';

function App() {
  const setDeferredPrompt = usePwaStore((state) => state.setDeferredPrompt);
  const clearPrompt = usePwaStore((state) => state.clearPrompt);

  useEffect(() => {
    // Red de seguridad: una promesa rechazada sin catch no debe fallar en silencio.
    const alRechazar = (evento) => {
      console.error('Promesa rechazada sin capturar:', evento.reason);
      toast.error('Ocurrió un error inesperado.');
    };
    window.addEventListener('unhandledrejection', alRechazar);
    return () => window.removeEventListener('unhandledrejection', alRechazar);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); 
      setDeferredPrompt(e); 
    };

    const handleAppInstalled = () => {
      clearPrompt(); 
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [setDeferredPrompt, clearPrompt]);

  return (
    <>
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#1f1e2e',
            color: '#fff',
            borderRadius: '1rem',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#8e57a4',
              secondary: '#fff',
            },
          },
          error: {
            style: {
              background: '#fee2e2', 
              color: '#ef4444',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  )
}

export default App;