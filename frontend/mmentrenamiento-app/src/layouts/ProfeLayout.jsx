import { HomeIcon, UsersIcon, CalendarDaysIcon, UserIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeSolid, UsersIcon as UsersSolid, CalendarDaysIcon as CalendarSolid, UserIcon as UserSolid } from '@heroicons/react/24/solid';
import { PanelLayout } from './PanelLayout';
import { useAuthStore } from '../store/useAuthStore';

const ITEMS = [
  { to: '/profe', label: 'Inicio', Outline: HomeIcon, Solid: HomeSolid, exact: true },
  { to: '/profe/turnos', label: 'Turnos', Outline: CalendarDaysIcon, Solid: CalendarSolid },
  { to: '/profe/usuarios', label: 'Usuarios', Outline: UsersIcon, Solid: UsersSolid },
  { to: '/profe/perfil', label: 'Mi Perfil', labelCorto: 'Perfil', Outline: UserIcon, Solid: UserSolid },
];

export const ProfeLayout = () => {
  const esAdmin = useAuthStore((state) => state.usuario?.rol === 'Admin');

  return (
    <PanelLayout
      items={esAdmin ? [...ITEMS] : ITEMS}
      perfilPath="/profe/perfil"
      rolPorDefecto="Profesor"
      mensajeCierre="Vas a salir de tu cuenta en este dispositivo."
    />
  );
};
