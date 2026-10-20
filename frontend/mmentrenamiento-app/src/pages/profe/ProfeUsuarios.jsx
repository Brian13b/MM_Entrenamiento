import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, ChevronRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { seguimientoService } from '../../services/seguimientoService';
import { tieneLesiones } from '../../utils/fichas';
import { urlAvatar } from '../../utils/avatar';

export const ProfeUsuarios = () => {
  const navigate = useNavigate();
  const [alumnos, setAlumnos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hayError, setHayError] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setIsLoading(true);
      setHayError(false);
      setAlumnos((await seguimientoService.getAlumnos()) || []);
    } catch (error) {
      setHayError(true);
      toast.error('No se pudo cargar el listado de alumnos.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return alumnos;
    return alumnos.filter((a) =>
      a.nombreCompleto.toLowerCase().includes(termino) || a.email.toLowerCase().includes(termino)
    );
  }, [alumnos, busqueda]);

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-10">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-display font-black text-mm-dark">Usuarios</h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base font-medium">Alumnos del gimnasio: perfil, ficha técnica y plan.</p>
      </header>

      <div className="relative flex items-center mb-5">
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4" />
        <input
          type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full bg-mm-surface border border-gray-200 focus:border-mm-purple rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none transition-colors shadow-sm"
        />
      </div>

      {isLoading ? (
        <div className="bg-mm-surface rounded-4xl p-12 text-center text-mm-purple animate-pulse font-bold">Cargando alumnos...</div>
      ) : hayError ? (
        <div className="bg-mm-surface rounded-4xl p-12 text-center">
          <p className="text-sm text-gray-500 mb-3">No pudimos cargar el listado.</p>
          <button onClick={cargar} className="bg-mm-purple text-white px-5 py-2 rounded-full font-semibold text-sm">Reintentar</button>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-mm-surface rounded-4xl p-12 text-center text-gray-500 text-sm font-medium border border-gray-100">
          {alumnos.length === 0 ? 'Todavía no hay alumnos registrados.' : 'No se encontraron alumnos con esa búsqueda.'}
        </div>
      ) : (
        <>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 px-1">{filtrados.length} alumnos</p>
          <ul className="bg-mm-surface rounded-4xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">
            {filtrados.map((alumno) => (
              <li
                key={alumno.id}
                onClick={() => navigate(`/profe/usuarios/${alumno.id}`)}
                className="p-4 sm:p-5 hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-4"
              >
                <img
                  src={urlAvatar(alumno.nombreCompleto, alumno.fotoPerfilUrl)} alt=""
                  className="w-12 h-12 rounded-[0.85rem] object-cover border border-gray-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-mm-dark truncate">{alumno.nombreCompleto}</p>
                    {!alumno.activo && (
                      <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-wider border border-red-100">Bloqueado</span>
                    )}
                    {tieneLesiones(alumno) && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100 uppercase tracking-wider">
                        <ExclamationTriangleIcon className="w-3 h-3" /> Lesión
                      </span>
                    )}
                    {alumno.tienePlan && (
                      <span className="hidden sm:inline-block text-[10px] font-bold bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full uppercase tracking-wider border border-sky-100">Plan</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{alumno.email}</p>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-300" />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
