import { Component } from 'react';

// Evita la pantalla en blanco ante un error de renderizado no capturado.
export class ErrorBoundary extends Component {
  state = { hayError: false };

  static getDerivedStateFromError() {
    return { hayError: true };
  }

  componentDidCatch(error, info) {
    console.error('Error de renderizado no capturado:', error, info.componentStack);
  }

  render() {
    if (!this.state.hayError) return this.props.children;

    return (
      <div className="min-h-screen bg-mm-light flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-display font-black text-mm-dark mb-2">Algo salió mal</h1>
        <p className="text-sm text-gray-500 mb-6 max-w-xs">
          Ocurrió un error inesperado. Probá recargar la página; si el problema sigue, avisanos.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-mm-purple text-white px-6 py-3 rounded-xl font-bold text-sm active:scale-95 transition-all"
        >
          Recargar
        </button>
      </div>
    );
  }
}
