import { Routes } from '@angular/router';
import { authenticatedGuard, clientGuard } from './core/auth/auth.guards';
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/login/login').then(({ LoginComponent }) => LoginComponent) },
  { path: 'dashboard', canActivate: [authenticatedGuard], loadComponent: () => import('./components/dashboard/dashboard').then(({ DashboardComponent }) => DashboardComponent) },
  { path: 'admin', canActivate: [authenticatedGuard], loadComponent: () => import('./components/admin/admin').then(({ AdminComponent }) => AdminComponent) },
  { path: 'inventory', canActivate: [authenticatedGuard], loadComponent: () => import('./components/inventory/inventory').then(({ InventoryComponent }) => InventoryComponent) },
  { path: 'billing', canActivate: [authenticatedGuard], loadComponent: () => import('./components/billing/billing').then(({ Billing }) => Billing) },
  { path: 'emr', canActivate: [authenticatedGuard], loadComponent: () => import('./components/emr/emr').then(({ Emr }) => Emr) },
  { path: 'scheduling', canActivate: [authenticatedGuard], loadComponent: () => import('./components/scheduling/scheduling').then(({ SchedulingComponent }) => SchedulingComponent) },
  {
    path: 'client',
    children: [
      { path: 'login', loadComponent: () => import('./components/client/client-login/client-login').then(({ ClientLoginComponent }) => ClientLoginComponent) },
      { path: 'register', loadComponent: () => import('./components/client/client-register/client-register').then(({ ClientRegisterComponent }) => ClientRegisterComponent) },
      { path: 'dashboard', canActivate: [clientGuard], loadComponent: () => import('./components/client/client-dashboard/client-dashboard').then(({ ClientDashboardComponent }) => ClientDashboardComponent) },
      { path: 'profile', canActivate: [clientGuard], loadComponent: () => import('./components/client/client-profile/client-profile').then(({ ClientProfile }) => ClientProfile) },
      { path: 'appointments', canActivate: [clientGuard], loadComponent: () => import('./components/client/client-appointments/client-appointments').then(({ ClientAppointments }) => ClientAppointments) },
      { path: 'notifications', canActivate: [clientGuard], loadComponent: () => import('./components/client/client-notifications/client-notifications').then(({ ClientNotifications }) => ClientNotifications) },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
