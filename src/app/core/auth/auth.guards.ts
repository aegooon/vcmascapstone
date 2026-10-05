import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authenticatedGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? true : inject(Router).createUrlTree(['/login']);
};

export const clientGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.user()?.role === 'client' ? true : inject(Router).createUrlTree(['/client/login']);
};

export const staffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.user()?.role !== 'client' && auth.user() !== null
    ? true
    : inject(Router).createUrlTree(['/login']);
};
