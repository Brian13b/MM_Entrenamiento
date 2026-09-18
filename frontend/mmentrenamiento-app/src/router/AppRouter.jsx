import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

import { Login } from '../pages/auth/Login';
import { InicioAlumno } from '../pages/alumno/InicioAlumno';
import { AlumnoLayout } from '../layouts/AlumnoLayout';

// Mocks temporales de Layouts para estructurar las rutas
const ProfeLayout = () => <div className="h-screen bg-mm-light"><Outlet /></div>;
const AdminLayout = () => <div className="h-screen bg-mm-light flex"><Outlet /></div>;

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
            <Route index element={<div className="p-4">Panel de Administración</div>} />
          </Route>
        </Route>

        {/* Redirección por defecto si escribe una ruta que no existe */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};