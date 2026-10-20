import { HomeIcon, CalendarDaysIcon, UsersIcon, Cog8ToothIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeSolid, CalendarDaysIcon as CalendarSolid, UsersIcon as UsersSolid, Cog8ToothIcon as CogSolid } from '@heroicons/react/24/solid';
import { PanelLayout } from './PanelLayout';

const ITEMS = [
  { to: '/admin', label: 'Panel', labelCorto: 'Inicio', Outline: HomeIcon, Solid: HomeSolid, exact: true },
  { to: '/admin/horarios', label: 'Horarios', Outline: CalendarDaysIcon, Solid: CalendarSolid },
  { to: '/admin/usuarios', label: 'Usuarios', Outline: UsersIcon, Solid: UsersSolid },
  { to: '/admin/ajustes', label: 'Ajustes', Outline: Cog8ToothIcon, Solid: CogSolid },
];

export const AdminLayout = () => (
  <PanelLayout
    items={ITEMS}
    perfilPath="/admin/perfil"
    rolPorDefecto="Administrador"
    mensajeCierre="Vas a salir del panel de administración."
  />
);
