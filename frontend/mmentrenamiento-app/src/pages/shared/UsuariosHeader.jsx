import { MagnifyingGlassIcon, UserPlusIcon, FunnelIcon } from '@heroicons/react/24/outline';

export const UsuariosHeader = ({ busqueda, setBusqueda, onNuevoUsuario, filtros }) => {
  return (
    <div className="mb-6">
      <header className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-black text-mm-dark">Directorio de Alumnos</h1>
          <p className="text-sm md:text-base font-medium text-mm-dark opacity-50 mt-1">
            Gestioná pagos, fichas médicas y planes de entrenamiento.
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        {/* Fila superior: Buscador y Botón */}
        <div className="flex flex-col sm:flex-row gap-3">
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

          <button 
            onClick={onNuevoUsuario}
            className="bg-mm-dark text-white px-5 py-3.5 rounded-2xl text-sm font-bold flex justify-center items-center gap-2 hover:bg-gray-800 transition-all active:scale-95 shadow-sm shrink-0"
          >
            <UserPlusIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Nuevo Usuario</span>
          </button>
        </div>

        {/* Fila inferior: Filtros */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
          <div className="flex items-center gap-2 text-gray-400 pl-1 pr-2">
            <FunnelIcon className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Filtros:</span>
          </div>

          <select 
            value={filtros.filtroRol} onChange={(e) => filtros.setFiltroRol(e.target.value)}
            className="bg-white border border-gray-200 text-sm font-bold text-gray-600 rounded-xl px-4 py-2 outline-none focus:border-mm-purple cursor-pointer shadow-sm"
          >
            <option value="Todos">Tipo: Todos</option>
            <option value="Alumno">Alumnos</option>
            <option value="Profe">Profesores</option>
            <option value="Admin">Administradores</option>
          </select>

          <select 
            value={filtros.filtroEstado} onChange={(e) => filtros.setFiltroEstado(e.target.value)}
            className="bg-white border border-gray-200 text-sm font-bold text-gray-600 rounded-xl px-4 py-2 outline-none focus:border-mm-purple cursor-pointer shadow-sm"
          >
            <option value="Todos">Estado: Todos</option>
            <option value="Activo">Activos</option>
            <option value="Inactivo">Bloqueados</option>
          </select>

          <select 
            value={filtros.filtroDeuda} onChange={(e) => filtros.setFiltroDeuda(e.target.value)}
            className="bg-white border border-gray-200 text-sm font-bold text-gray-600 rounded-xl px-4 py-2 outline-none focus:border-mm-purple cursor-pointer shadow-sm"
          >
            <option value="Todos">Cuota: Todos</option>
            <option value="AlDia">Al Día</option>
            <option value="Deben">Deudores</option>
          </select>
        </div>
      </div>

    </div>
  );
};