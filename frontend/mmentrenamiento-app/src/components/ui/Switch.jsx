import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

// Interruptor accesible: encendido = tilde (verde), apagado = X (gris).
export const Switch = ({ checked, onChange, disabled = false, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50 ${
      checked ? 'bg-green-500' : 'bg-gray-300'
    }`}
  >
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow transition-transform duration-200 ${
        checked ? 'translate-x-7' : 'translate-x-1'
      }`}
    >
      {checked
        ? <CheckIcon className="h-4 w-4 text-green-600" />
        : <XMarkIcon className="h-4 w-4 text-gray-400" />}
    </span>
  </button>
);
