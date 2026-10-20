import { useState, useRef, useCallback } from 'react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

// Reemplazo de window.confirm basado en promesas:
//
//   const [confirmar, confirmDialog] = useConfirm();
//   if (!(await confirmar({ title: '...', message: '...', confirmText: '...' }))) return;
//   ...
//   return (<>{...}{confirmDialog}</>);
export const useConfirm = () => {
  const [abierto, setAbierto] = useState(false);
  const [opciones, setOpciones] = useState({});
  const resolverRef = useRef(null);

  const confirmar = useCallback((nuevasOpciones = {}) => new Promise((resolve) => {
    resolverRef.current = resolve;
    setOpciones(nuevasOpciones);
    setAbierto(true);
  }), []);

  const cerrar = useCallback((resultado) => {
    resolverRef.current?.(resultado);
    resolverRef.current = null;
    setAbierto(false);
  }, []);

  const dialogo = (
    <ConfirmDialog
      {...opciones}
      isOpen={abierto}
      onConfirm={() => cerrar(true)}
      onCancel={() => cerrar(false)}
    />
  );

  return [confirmar, dialogo];
};
