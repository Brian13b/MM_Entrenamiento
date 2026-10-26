import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRightIcon, ChevronLeftIcon, PencilSquareIcon, NoSymbolIcon, CheckCircleIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { urlAvatar } from '../../utils/avatar';

export const UsuariosLista = ({ usuarios, isLoading, onBloquear, basePath = '/admin/usuarios' }) => {
  const navigate = useNavigate();
  const [paginaActual, setPaginaActual] = useState(1);
  const usuariosPorPagina = 10; 

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPaginaActual(1);
  }, [usuarios]);

  const indiceUltimoUsuario = paginaActual * usuariosPorPagina;
  const indicePrimerUsuario = indiceUltimoUsuario - usuariosPorPagina;
  const usuariosPaginados = usuarios.slice(indicePrimerUsuario, indiceUltimoUsuario);
  const totalPaginas = Math.ceil(usuarios.length / usuariosPorPagina);

  const handleWhatsApp = (e, telefono) => {
    e.stopPropagation(); 
    if (!telefono) return toast.error("Este usuario no tiene teléfono registrado.");
    const numeroLimpio = telefono.replace(/\D/g, '');
    window.open(`https://wa.me/${numeroLimpio}`, '_blank');
  };

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
          No se encontraron alumnos con los filtros seleccionados.
        </div>
      </section>
    );
  }

  return (
    <section className="bg-mm-surface rounded-4xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in flex flex-col">
      <ul className="divide-y divide-gray-100">
        {usuariosPaginados.map((usuario) => (
          <li 
            key={usuario.id}
            onClick={() => navigate(`${basePath}/${usuario.id}`)}
            className="p-4 sm:p-5 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-4 group"
          >
            <img
              src={urlAvatar(usuario.nombreCompleto, usuario.fotoPerfilUrl)} alt=""
              className="w-12 h-12 rounded-[0.85rem] object-cover border border-gray-100 shrink-0"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-bold text-mm-dark truncate">
                  {usuario.nombreCompleto}
                </p>
                {/* PUNTO 12: Badges con hidden sm:inline-block para ocultar en mobile */}
                {!usuario.activo && (
                  <span className="hidden sm:inline-block text-[10px] font-bold bg-red-50 text-red-800 px-2 py-0.5 rounded-full uppercase tracking-wider border border-red-100">
                    Bloqueado
                  </span>
                )}
                {usuario.deudor && (
                  <span className="hidden sm:inline-block text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-100">
                    Deudor
                  </span>
                )}
                {usuario.driveItemId && (
                  <span className="hidden sm:inline-block text-[10px] font-bold bg-sky-50 text-green-800 px-2 py-0.5 rounded-full uppercase tracking-wider border border-sky-100">
                    Plan Activo
                  </span>
                )}
                {usuario.rol === 'Profe' && (
                  <span className="hidden sm:inline-block text-[10px] font-bold bg-amber-50 text-blue-800 px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-100">
                    Profe
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">{usuario.email}</p>
            </div>

            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-wide">Créditos</span>
              <span className={`text-sm font-bold ${usuario.creditosDisponibles > 0 ? 'text-mm-purple' : 'text-gray-400'}`}>
                {usuario.creditosDisponibles || 0} disp.
              </span>
            </div>

            {/* ACCIONES RÁPIDAS */}
            <div className="flex items-center gap-1">
              
              <button 
                onClick={(e) => handleWhatsApp(e, usuario.telefono)}
                title="Abrir WhatsApp"
                className="p-2 text-gray-400 hover:text-[#25D366] hover:bg-[#25D366]/10 rounded-lg transition-colors"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/${usuario.id}`); }}
                title="Editar Perfil"
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <PencilSquareIcon className="w-5 h-5" />
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); onBloquear(usuario); }}
                title={usuario.activo ? "Bloquear" : "Desbloquear"}
                className={`p-2 rounded-lg transition-colors ${usuario.activo ? 'text-gray-400 hover:text-red-500 hover:bg-red-50' : 'text-red-500 hover:text-green-500 hover:bg-green-50'}`}
              >
                {usuario.activo ? <NoSymbolIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />}
              </button>

            </div>

            <ChevronRightIcon className="w-5 h-5 text-gray-300 ml-1 sm:ml-2" />
          </li>
        ))}
      </ul>

      {/* CONTROLES DE PAGINACIÓN */}
      {totalPaginas > 1 && (
        <div className="bg-[#F8F9FA] px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-500">
            Mostrando <span className="text-mm-dark">{indicePrimerUsuario + 1}</span> a <span className="text-mm-dark">{Math.min(indiceUltimoUsuario, usuarios.length)}</span> de <span className="text-mm-dark">{usuarios.length}</span> alumnos
          </p>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
              disabled={paginaActual === 1}
              className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-mm-dark disabled:opacity-50 transition-all shadow-sm"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            
            <div className="flex items-center px-3 text-xs font-bold text-mm-dark bg-white border border-gray-200 rounded-lg shadow-sm">
              {paginaActual} / {totalPaginas}
            </div>

            <button 
              onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
              className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-mm-dark disabled:opacity-50 transition-all shadow-sm"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};