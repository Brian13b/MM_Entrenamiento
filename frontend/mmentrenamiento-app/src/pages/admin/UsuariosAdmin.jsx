import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
// import { administracionService } from '../../services/administracionService';

export const UsuariosAdmin = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Simulamos la carga de usuarios (Acá conectarás con el endpoint real de tu API)
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setIsLoading(true);
        // const data = await administracionService.getUsuarios();
        
        // Mock de datos basados en tu PerfilUsuarioDto
        const mockUsuarios = [
          { id: '1', nombreCompleto: 'Juan Pérez', email: 'juan@email.com', telefono: '3434555666', activo: true, creditos: 2 },
          { id: '2', nombreCompleto: 'María Gómez', email: 'maria@email.com', telefono: '3434111222', activo: true, creditos: 0 },
          { id: '3', nombreCompleto: 'Carlos López', email: 'carlos@email.com', telefono: null, activo: false, creditos: 0 },
        ];
        
        setTimeout(() => {
          setUsuarios(mockUsuarios);
          setIsLoading(false);
        }, 500);

      } catch (error) {
        toast.error("Error al cargar la lista de usuarios.");
        console.log(error);
        setIsLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  // Filtro de búsqueda optimizado
  const usuariosFiltrados = useMemo(() => {
    if (!busqueda) return usuarios;
    const lowerBusqueda = busqueda.toLowerCase();
    return usuarios.filter(u => 
      u.nombreCompleto.toLowerCase().includes(lowerBusqueda) || 
      u.email.toLowerCase().includes(lowerBusqueda)
    );
  }, [usuarios, busqueda]);

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-mm-dark">Directorio de Alumnos</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Gestioná pagos, fichas médicas y membresías.</p>
        </div>
      </header>

      {/* Barra de Búsqueda */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="w-full bg-mm-surface border border-gray-200 rounded-2xl py-3 pl-11 pr-4 text-sm text-mm-dark focus:ring-2 focus:ring-mm-purple focus:border-transparent outline-none shadow-sm transition-all"
          placeholder="Buscar por nombre o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Lista de Usuarios */}
      <section className="bg-mm-surface rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center text-mm-purple animate-pulse">
            <span className="font-bold">Cargando directorio...</span>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm font-medium">
            No se encontraron alumnos con esa búsqueda.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {usuariosFiltrados.map((usuario) => (
              <li 
                key={usuario.id}
                onClick={() => navigate(`/admin/usuarios/${usuario.id}`)}
                className="p-4 sm:p-5 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0 border border-purple-100 text-mm-purple font-bold">
                  {usuario.nombreCompleto.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-mm-dark truncate">
                      {usuario.nombreCompleto}
                    </p>
                    {!usuario.activo && (
                      <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        Bloqueado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{usuario.email}</p>
                </div>

                <div className="hidden sm:flex flex-col items-end mr-4">
                  <span className="text-xs font-bold text-gray-400 mb-0.5">Créditos</span>
                  <span className={`text-sm font-bold ${usuario.creditos > 0 ? 'text-mm-purple' : 'text-gray-400'}`}>
                    {usuario.creditos} disp.
                  </span>
                </div>

                <ChevronRightIcon className="w-5 h-5 text-gray-300 group-hover:text-mm-purple transition-colors" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};