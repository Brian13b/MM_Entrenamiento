import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="relative bg-mm-surface rounded-4xl p-6 w-full max-w-sm shadow-2xl scale-100 transition-transform">
        {title && (
          <h3 className="font-display text-xl font-bold text-mm-dark mb-2">
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};