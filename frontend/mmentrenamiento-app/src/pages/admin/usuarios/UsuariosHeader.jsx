import { MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline';

export const UsuariosHeader = ({ busqueda, setBusqueda, onNuevoUsuario }) => {
  return (
    <div className="mb-6">
      {/* Título y Descripción */}
      <header className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black text-mm-dark">
            Directorio de Alumnos
          </h1>
          <p className="text-sm md:text-base font-medium text-mm-dark opacity-50 mt-1">
            Gestioná pagos, fichas médicas y planes de entrenamiento.
          </p>
        </div>
      </header>

      {/* Controles: Buscador + Botón */}
      <div className="flex flex-col sm:flex-row gap-3">
        
        {/* Input de Búsqueda */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full bg-mm-surface border border-gray-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-mm-dark focus:ring-2 focus:ring-mm-purple focus:border-transparent outline-none shadow-sm transition-all"
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* Botón Nuevo Usuario */}
        <button 
          onClick={onNuevoUsuario}
          className="bg-mm-dark text-white px-5 py-3.5 rounded-2xl text-sm font-bold flex justify-center items-center gap-2 hover:bg-gray-800 transition-all active:scale-95 shadow-sm shrink-0"
        >
          <UserPlusIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Nuevo Usuario</span>
        </button>

      </div>
    </div>
  );
};