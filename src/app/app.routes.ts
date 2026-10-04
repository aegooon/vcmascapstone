import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { AdminComponent } from './components/admin/admin';
import { InventoryComponent } from './components/inventory/inventory';
import { ClientLoginComponent } from './components/client/client-login/client-login';
import { ClientDashboardComponent } from './components/client/client-dashboard/client-dashboard';
import { SchedulingComponent } from './components/scheduling/scheduling'; 
import { ClientRegisterComponent } from './components/client/client-register/client-register';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'inventory', component: InventoryComponent },
  { path: 'client-login', component: ClientLoginComponent },
  { path: 'client-dashboard', component: ClientDashboardComponent },
  { path: 'scheduling', component: SchedulingComponent },
  { path: 'client-register', component: ClientRegisterComponent },
  { path: '**', redirectTo: 'login' }
];