import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

import { administracionService } from '../../services/administracionService';
import { UsuariosHeader } from '../../pages/admin/usuarios/UsuariosHeader';
import { UsuariosLista } from '../../pages/admin/usuarios/UsuariosList';
import { ModalNuevoUsuario } from '../../pages/admin/usuarios/ModalNuevoUsuario';

export const UsuariosAdmin = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);

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

  const usuariosFiltrados = useMemo(() => {
    if (!busqueda) return usuarios;
    const lowerBusqueda = busqueda.toLowerCase();
    return usuarios.filter(u => 
      (u.nombreCompleto && u.nombreCompleto.toLowerCase().includes(lowerBusqueda)) || 
      (u.email && u.email.toLowerCase().includes(lowerBusqueda))
    );
  }, [usuarios, busqueda]);

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <UsuariosHeader 
        busqueda={busqueda} 
        setBusqueda={setBusqueda} 
        onNuevoUsuario={() => setModalRegistroAbierto(true)}
      />

      <UsuariosLista 
        usuarios={usuariosFiltrados} 
        isLoading={isLoading} 
      />

      <ModalNuevoUsuario 
        isOpen={modalRegistroAbierto} 
        onClose={() => setModalRegistroAbierto(false)} 
        onUsuarioCreado={fetchUsuarios}
      />
    </div>
  );
};