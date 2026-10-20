import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

const HOME_POR_ROL = {
    Admin: "/admin",
    Profe: "/profe",
    Alumno: "/alumno",
};

export const ProtectedRoute = ({ allowedRoles }) => {
    const { isAuthenticated, usuario } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && usuario && !allowedRoles.includes(usuario.rol)) {
        return <Navigate to={HOME_POR_ROL[usuario.rol] ?? "/alumno"} replace />;
    }

    return <Outlet />;
}
