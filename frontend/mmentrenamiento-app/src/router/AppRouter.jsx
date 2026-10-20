import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

import { AlumnoLayout } from '../layouts/AlumnoLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProfeLayout } from '../layouts/ProfeLayout';

import { Login } from '../pages/auth/Login';

import { InicioAlumno } from '../pages/alumno/InicioAlumno';
import { GrillaReservas } from '../pages/alumno/GrillaReservas';
import { MisTurnosAlumno } from '../pages/alumno/MisTurnosAlumno';
import { PerfilAlumno } from '../pages/alumno/PerfilAlumno';

import { InicioAdmin } from '../pages/admin/InicioAdmin';
import { AjustesAdmin } from '../pages/admin/AjustesAdmin';
import { UsuariosAdmin } from '../pages/admin/UsuariosAdmin';
import { PerfilUsuarioAdmin } from '../pages/admin/usuarios/PerfilUsuarioAdmin';
import { HorariosAdmin } from '../pages/admin/HorariosAdmin';

import { GrillaProfe } from '../pages/profe/GrillaProfe';
import { AsistenciaClase } from '../pages/profe/AsistenciaClase';
import { ProfeInicio } from '../pages/profe/ProfeInicio';
import { ProfeUsuarios } from '../pages/profe/ProfeUsuarios';
import { PerfilAlumnoProfe } from '../pages/profe/PerfilAlumnoProfe';
import { MiPerfil } from '../pages/shared/MiPerfil';

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
            <Route path="clases" element={<GrillaReservas />} />
            <Route path="mis-turnos" element={<MisTurnosAlumno />} />
            <Route path="perfil" element={<PerfilAlumno />} />
          </Route>
        </Route>

        {/* Zona Profe */}
        <Route element={<ProtectedRoute allowedRoles={['Profe', 'Admin']} />}>
          <Route path="/profe" element={<ProfeLayout />}>
            <Route index element={<ProfeInicio />} />
            <Route path="turnos" element={<GrillaProfe />} /> 
            <Route path="clase/:turnoId" element={<AsistenciaClase />} />
            <Route path="usuarios" element={<ProfeUsuarios />} />
            <Route path="usuarios/:id" element={<PerfilAlumnoProfe />} />
            <Route path="perfil" element={<MiPerfil />} />
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