import { HomeIcon, UsersIcon, CalendarDaysIcon, UserIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeSolid, UsersIcon as UsersSolid, CalendarDaysIcon as CalendarSolid, UserIcon as UserSolid, Squares2X2Icon as PanelSolid } from '@heroicons/react/24/solid';
import { PanelLayout } from './PanelLayout';
import { useAuthStore } from '../store/useAuthStore';

const ITEMS = [
  { to: '/profe', label: 'Inicio', Outline: HomeIcon, Solid: HomeSolid, exact: true },
  { to: '/profe/usuarios', label: 'Usuarios', Outline: UsersIcon, Solid: UsersSolid },
  { to: '/profe/turnos', label: 'Turnos', Outline: CalendarDaysIcon, Solid: CalendarSolid },
  { to: '/profe/perfil', label: 'Mi Perfil', labelCorto: 'Perfil', Outline: UserIcon, Solid: UserSolid },
];

// Un Admin que entra a la vista del Profe necesita poder volver a su panel.
const ITEM_PANEL_ADMIN = { to: '/admin', label: 'Panel Admin', labelCorto: 'Admin', Outline: Squares2X2Icon, Solid: PanelSolid };

export const ProfeLayout = () => {
  const esAdmin = useAuthStore((state) => state.usuario?.rol === 'Admin');

  return (
    <PanelLayout
      items={esAdmin ? [...ITEMS, ITEM_PANEL_ADMIN] : ITEMS}
      perfilPath="/profe/perfil"
      rolPorDefecto="Profesor"
      mensajeCierre="Vas a salir de tu cuenta en este dispositivo."
    />
  );
};
