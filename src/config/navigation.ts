import { UserRole } from '@/types/roles';

export interface NavigationItem {
  label: string;
  route: string;
  icon?: string;
  enabled?: boolean;
}

export const guestNavigation: NavigationItem[] = [
  {
    label: 'Iniciar sesión',
    route: '/login',
  },
  {
    label: 'Health Check',
    route: '/health',
  },
];

const dashboardItem: NavigationItem = {
  label: 'Dashboard',
  route: '/',
};

//Modulos futuros 
export const adminNavigation: NavigationItem[] = [
  dashboardItem,
  //Administracion
  {
    label: 'Usuarios',
    route: '/admin/usuarios',
    enabled: false,
  },
  {
    label: 'Institutos',
    route: '/admin/institutos',
    enabled: true,
  },
  {
    label: 'Carreras',
    route: '/admin/carreras',
    enabled: true,
  },

  //Gestion academica
  {
    label: 'Materias',
    route: '/materias',
    enabled: false,
  },
  {
    label: 'Auditoría',
    route: '/admin/auditoria',
    enabled: true,
  },
];

export const teacherNavigation: NavigationItem[] = [
  dashboardItem,

  {
    label: 'Materias',
    route: '/materias',
    enabled: false,
  },

  {
    label: 'Materiales',
    route: '/materiales',
    enabled: false,
  },
];

export const studentNavigation: NavigationItem[] = [
  dashboardItem,

  {
    label: 'Materiales',
    route: '/materiales',
    enabled: false,
  },
];

export const navigationByRole: Record<UserRole, NavigationItem[]> = {
  [UserRole.ADMIN]: adminNavigation,
  [UserRole.DOCENTE]: teacherNavigation,
  [UserRole.ESTUDIANTE]: studentNavigation,
};