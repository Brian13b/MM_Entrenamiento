import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

import { administracionService } from '../../services/administracionService';
import { UsuariosHeader } from '../shared/UsuariosHeader';
import { UsuariosLista } from '../shared/UsuariosList';
import { ModalNuevoUsuario } from '../shared/ModalNuevoUsuario';

export const ProfeUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);

  const [filtroRol, setFiltroRol] = useState('Alumno');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroDeuda, setFiltroDeuda] = useState('Todos');

  const fetchUsuarios = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await administracionService.getUsuarios();
      setUsuarios(data || []);
    } catch (error) {
      toast.error("Error al cargar la lista de alumnos.");
      console.error("Error fetching usuarios:", error);
      setUsuarios([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleAccionRestringida = () => {
    toast.error("Solo los administradores tienen permiso para realizar esta acción.");
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      const matchBusqueda = !busqueda ||
        (u.nombreCompleto && u.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(busqueda.toLowerCase()));

      const matchEstado = filtroEstado === 'Todos' ||
        (filtroEstado === 'Activo' && u.activo) ||
        (filtroEstado === 'Inactivo' && !u.activo);

      const matchDeuda = filtroDeuda === 'Todos' ||
        (filtroDeuda === 'AlDia' && !u.deudor) ||
        (filtroDeuda === 'Deben' && u.deudor);

      const matchRol = filtroRol === 'Todos' || u.rol === filtroRol;

      return matchBusqueda && matchEstado && matchDeuda && matchRol;
    });
  }, [usuarios, busqueda, filtroEstado, filtroDeuda, filtroRol]);

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <UsuariosHeader
        busqueda={busqueda} setBusqueda={setBusqueda}
        onNuevoUsuario={() => setModalRegistroAbierto(true)}
        filtros={{ filtroRol, setFiltroRol, filtroEstado, setFiltroEstado, filtroDeuda, setFiltroDeuda }}
      />

      <UsuariosLista
        usuarios={usuariosFiltrados}
        isLoading={isLoading}
        onBloquear={handleAccionRestringida}
        basePath="/profe/usuarios"
      />

      <ModalNuevoUsuario
        isOpen={modalRegistroAbierto}
        onClose={() => setModalRegistroAbierto(false)}
        onUsuarioCreado={fetchUsuarios}
      />
    </div>
  );
};