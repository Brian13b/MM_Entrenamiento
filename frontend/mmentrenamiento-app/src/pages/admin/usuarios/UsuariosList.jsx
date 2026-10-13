import { useNavigate } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

export const UsuariosLista = ({ usuarios, isLoading }) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <section className="bg-mm-surface rounded-4xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
        <div className="p-12 flex justify-center text-mm-purple animate-pulse">
          <span className="font-bold">Cargando directorio...</span>
        </div>
      </section>
    );
  }

  if (usuarios.length === 0) {
    return (
      <section className="bg-mm-surface rounded-4xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
        <div className="p-12 text-center text-gray-500 text-sm font-medium">
          No se encontraron alumnos.
        </div>
      </section>
    );
  }

  return (
    <section className="bg-mm-surface rounded-4xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
      <ul className="divide-y divide-gray-100">
        {usuarios.map((usuario) => (
          <li 
            key={usuario.id}
            onClick={() => navigate(`/admin/usuarios/${usuario.id}`)}
            className="p-4 sm:p-5 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-4 group"
          >
            {/* Avatar / Inicial */}
            <div className="w-12 h-12 bg-[#F8F9FA] rounded-[0.85rem] flex items-center justify-center shrink-0 border border-gray-100 text-mm-dark font-display font-bold shadow-sm">
              {usuario.nombreCompleto?.charAt(0).toUpperCase() || '?'}
            </div>
            
            {/* Datos Personales */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-bold text-mm-dark truncate">
                  {usuario.nombreCompleto}
                </p>
                {!usuario.activo && (
                  <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-wider border border-red-100">
                    Bloqueado
                  </span>
                )}
                {/* Indicador visual rápido si tiene un plan vinculado (OneDrive) */}
                {usuario.driveItemId && (
                  <span className="hidden sm:inline-block text-[10px] font-bold bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full uppercase tracking-wider border border-sky-100">
                    Plan Activo
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">{usuario.email}</p>
            </div>

            {/* Créditos */}
            <div className="hidden sm:flex flex-col items-end mr-4">
              <span className="text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-wide">Créditos</span>
              <span className={`text-sm font-bold ${usuario.creditosDisponibles > 0 ? 'text-mm-purple' : 'text-gray-400'}`}>
                {usuario.creditosDisponibles || 0} disp.
              </span>
            </div>

            <ChevronRightIcon className="w-5 h-5 text-gray-300 group-hover:text-mm-purple transition-colors" />
          </li>
        ))}
      </ul>
    </section>
  );
};