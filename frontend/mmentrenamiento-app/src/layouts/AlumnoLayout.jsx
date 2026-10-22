import { HomeIcon, CalendarDaysIcon, UserIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeSolid, CalendarDaysIcon as CalendarSolid, UserIcon as UserSolid } from '@heroicons/react/24/solid';
import { PanelLayout } from './PanelLayout';

const ITEMS = [
  { to: '/alumno', label: 'Inicio', Outline: HomeIcon, Solid: HomeSolid, exact: true },
  { to: '/alumno/clases', label: 'Clases', Outline: CalendarDaysIcon, Solid: CalendarSolid },
  { to: '/alumno/perfil', label: 'Mi Perfil', labelCorto: 'Perfil', Outline: UserIcon, Solid: UserSolid },
];

export const AlumnoLayout = () => (
  <PanelLayout
    items={ITEMS}
    perfilPath="/alumno/perfil"
    rolPorDefecto="Alumno"
    mensajeCierre="Vas a salir de tu cuenta en este dispositivo."
  />
);