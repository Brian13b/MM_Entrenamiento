import { AppRouter } from './router/AppRouter';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <AppRouter />
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