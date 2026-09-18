import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

export const ProtectedRoute = ({ allowedRoles }) => {
    const { isAuthenticated, usuario } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && usuario && !allowedRoles.includes(usuario?.rol)) {
        if (usuario?.rol === "Admin") {
            return <Navigate to="/admin" replace />;
        }
        if (usuario?.rol === "User") {
            return <Navigate to="/user" replace />;
        }
        return <Navigate to="/alumno" replace />;
    }

    return <Outlet />;
}