import { useEffect } from 'react';
import { Modal } from './Modal';

const ESTILOS_CONFIRMAR = {
  danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  primary: 'bg-mm-purple text-white hover:opacity-90',
};

export const ConfirmDialog = ({
  isOpen,
  title = '¿Estás seguro?',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Volver',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const alPresionar = (e) => { if (e.key === 'Escape' && !isLoading) onCancel(); };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [isOpen, isLoading, onCancel]);

  return (
    <Modal isOpen={isOpen} onClose={() => !isLoading && onCancel()} title={title}>
      {message && <div className="text-sm text-gray-500 mb-6">{message}</div>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 py-3 rounded-xl font-bold text-sm bg-mm-light text-mm-dark hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 ${ESTILOS_CONFIRMAR[variant] ?? ESTILOS_CONFIRMAR.danger}`}
        >
          {isLoading ? 'Procesando...' : confirmText}
        </button>
      </div>
    </Modal>
  );
};
