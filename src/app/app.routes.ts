import { Routes } from '@angular/router';
import { clientGuard, staffGuard } from './core/auth/auth.guards';
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/login/login').then(({ LoginComponent }) => LoginComponent) },
  { path: 'dashboard', canActivate: [staffGuard], loadComponent: () => import('./components/dashboard/dashboard').then(({ DashboardComponent }) => DashboardComponent) },
  { path: 'admin', canActivate: [staffGuard], loadComponent: () => import('./components/admin/admin').then(({ AdminComponent }) => AdminComponent) },
  { path: 'inventory', canActivate: [staffGuard], loadComponent: () => import('./components/inventory/inventory').then(({ InventoryComponent }) => InventoryComponent) },
  { path: 'billing', canActivate: [staffGuard], loadComponent: () => import('./components/billing/billing').then(({ Billing }) => Billing) },
  { path: 'emr', canActivate: [staffGuard], loadComponent: () => import('./components/emr/emr').then(({ Emr }) => Emr) },
  { path: 'scheduling', canActivate: [staffGuard], loadComponent: () => import('./components/scheduling/scheduling').then(({ SchedulingComponent }) => SchedulingComponent) },
  {
    path: 'client',
    children: [
      { path: '', loadComponent: () => import('./components/client/client-landing/client-landing').then(({ ClientLandingComponent }) => ClientLandingComponent) },
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
