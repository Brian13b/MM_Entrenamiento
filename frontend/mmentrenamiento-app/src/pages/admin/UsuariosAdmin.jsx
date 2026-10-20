import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

import { administracionService } from '../../services/administracionService';
import { useConfirm } from '../../hooks/useConfirm';
import { UsuariosHeader } from '../../pages/admin/usuarios/UsuariosHeader';
import { UsuariosLista } from '../../pages/admin/usuarios/UsuariosList';
import { ModalNuevoUsuario } from '../../pages/admin/usuarios/ModalNuevoUsuario';

export const UsuariosAdmin = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);
  const [confirmar, confirmDialog] = useConfirm();

  const [filtroRol, setFiltroRol] = useState('Todos');
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

  const handleBloquearRapido = async (usuario) => {
    const bloquear = usuario.activo;
    const ok = await confirmar({
      title: bloquear ? '¿Bloquear usuario?' : '¿Desbloquear usuario?',
      message: bloquear
        ? <>{usuario.nombreCompleto} no podrá reservar ni iniciar sesión hasta que lo desbloquees.</>
        : <>{usuario.nombreCompleto} volverá a tener acceso a su cuenta.</>,
      confirmText: bloquear ? 'Sí, bloquear' : 'Sí, desbloquear',
      variant: bloquear ? 'danger' : 'primary'
    });
    if (!ok) return;

    try {
      await administracionService.cambiarEstadoBloqueo(usuario.id, usuario.activo);
      setUsuarios(prev => prev.map(u =>
        u.id === usuario.id ? { ...u, activo: !usuario.activo } : u
      ));
      toast.success(`Alumno ${usuario.activo ? 'bloqueado' : 'desbloqueado'} correctamente.`);
    } catch (error) {
      toast.error("Error al cambiar estado.");
      console.error( error);
    }
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
    <div className="animate-fade-in max-w-5xl mx-auto">
      {confirmDialog}
      <UsuariosHeader
        busqueda={busqueda} setBusqueda={setBusqueda}
        onNuevoUsuario={() => setModalRegistroAbierto(true)}
        filtros={{ filtroRol, setFiltroRol, filtroEstado, setFiltroEstado, filtroDeuda, setFiltroDeuda }}
      />

      <UsuariosLista
        usuarios={usuariosFiltrados}
        isLoading={isLoading}
        onBloquear={handleBloquearRapido}
      />

      <ModalNuevoUsuario
        isOpen={modalRegistroAbierto}
        onClose={() => setModalRegistroAbierto(false)}
        onUsuarioCreado={fetchUsuarios}
      />
    </div>
  );
};