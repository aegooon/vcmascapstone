import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/login/login').then(({ LoginComponent }) => LoginComponent) },
  { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard').then(({ DashboardComponent }) => DashboardComponent) },
  { path: 'admin', loadComponent: () => import('./components/admin/admin').then(({ AdminComponent }) => AdminComponent) },
  { path: 'inventory', loadComponent: () => import('./components/inventory/inventory').then(({ InventoryComponent }) => InventoryComponent) },
  { path: 'billing', loadComponent: () => import('./components/billing/billing').then(({ Billing }) => Billing) },
  { path: 'emr', loadComponent: () => import('./components/emr/emr').then(({ Emr }) => Emr) },
  { path: 'scheduling', loadComponent: () => import('./components/scheduling/scheduling').then(({ SchedulingComponent }) => SchedulingComponent) },
  {
    path: 'client',
    children: [
      { path: 'login', loadComponent: () => import('./components/client/client-login/client-login').then(({ ClientLoginComponent }) => ClientLoginComponent) },
      { path: 'register', loadComponent: () => import('./components/client/client-register/client-register').then(({ ClientRegisterComponent }) => ClientRegisterComponent) },
      { path: 'dashboard', loadComponent: () => import('./components/client/client-dashboard/client-dashboard').then(({ ClientDashboardComponent }) => ClientDashboardComponent) },
      { path: 'profile', loadComponent: () => import('./components/client/client-profile/client-profile').then(({ ClientProfile }) => ClientProfile) },
      { path: 'appointments', loadComponent: () => import('./components/client/client-appointments/client-appointments').then(({ ClientAppointments }) => ClientAppointments) },
      { path: 'notifications', loadComponent: () => import('./components/client/client-notifications/client-notifications').then(({ ClientNotifications }) => ClientNotifications) },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
