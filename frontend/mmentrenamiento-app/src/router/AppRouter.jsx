import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

import { AlumnoLayout } from '../layouts/AlumnoLayout';
import { AdminLayout } from '../layouts/AdminLayout';

import { Login } from '../pages/auth/Login';
import { InicioAlumno } from '../pages/alumno/InicioAlumno';
import { InicioAdmin } from '../pages/admin/InicioAdmin';
import { AjustesAdmin } from '../pages/admin/AjustesAdmin';
import { UsuariosAdmin } from '../pages/admin/UsuariosAdmin';
import { PerfilUsuarioAdmin } from '../pages/admin/PerfilUsuarioAdmin';
import { HorariosAdmin } from '../pages/admin/HorariosAdmin';

// Mocks temporales de Layouts para estructurar las rutas
const ProfeLayout = () => <div className="h-screen bg-mm-light"><Outlet /></div>;

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<Login />} />

        {/* Zona Alumno */}
        <Route element={<ProtectedRoute allowedRoles={['Alumno']} />}>
          <Route path="/alumno" element={<AlumnoLayout />}>
            <Route index element={<InicioAlumno />} />
            <Route path="clases" element={<div className="p-4">Mis Clases</div>} />
            <Route path="perfil" element={<div className="p-4">Mi Perfil</div>} />
          </Route>
        </Route>

        {/* Zona Profe */}
        <Route element={<ProtectedRoute allowedRoles={['Profe', 'Admin']} />}>
          <Route path="/profe" element={<ProfeLayout />}>
            <Route index element={<div className="p-4">Grilla del Día (Profe)</div>} />
          </Route>
        </Route>

        {/* Zona Admin */}
        <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<InicioAdmin />} />
            <Route path="horarios" element={<HorariosAdmin />} />
            <Route path="usuarios">
              <Route index element={<UsuariosAdmin />} />
              <Route path=":id" element={<PerfilUsuarioAdmin />} />
            </Route>
            <Route path="ajustes" element={<AjustesAdmin />} />
          </Route>
        </Route>

        {/* Redirección por defecto si escribe una ruta que no existe */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};