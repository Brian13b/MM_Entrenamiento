import { HomeIcon, UsersIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeSolid, UsersIcon as UsersSolid, CalendarDaysIcon as CalendarSolid } from '@heroicons/react/24/solid';
import { PanelLayout } from './PanelLayout';
import { useAuthStore } from '../store/useAuthStore';

const ITEMS = [
  { to: '/profe', label: 'Inicio', Outline: HomeIcon, Solid: HomeSolid, exact: true },
  { to: '/profe/turnos', label: 'Turnos', Outline: CalendarDaysIcon, Solid: CalendarSolid },
  { to: '/profe/usuarios', label: 'Usuarios', Outline: UsersIcon, Solid: UsersSolid },
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
