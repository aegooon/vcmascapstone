import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, tap } from 'rxjs';
import { ApiEnvelope, ApiUser } from '../api/api.types';

const API_URL = '/api/v1';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly currentUser = signal<ApiUser | null>(null);
  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly loading = signal(false);
  readonly error = signal('');

  login(email: string, password: string): Observable<ApiUser | null> {
    this.loading.set(true);
    this.error.set('');
    return this.http.post<ApiEnvelope<{ user: ApiUser }>>(`${API_URL}/auth/login`, { email, password }, { withCredentials: true }).pipe(
      map(({ data }) => data.user),
      tap((user) => this.currentUser.set(user)),
      catchError((error: unknown) => {
        this.error.set(error instanceof Error ? error.message : 'Unable to sign in.');
        return of(null);
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  register(payload: { fullName: string; email: string; phone: string; password: string }): Observable<boolean> {
    this.loading.set(true);
    this.error.set('');
    return this.http.post<ApiEnvelope<{ message: string }>>(`${API_URL}/auth/register`, payload, { withCredentials: true }).pipe(
      map(() => true),
      catchError((error: unknown) => {
        this.error.set(error instanceof Error ? error.message : 'Unable to register.');
        return of(false);
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  restoreSession(): Observable<ApiUser | null> {
    return this.http.get<ApiEnvelope<{ user: ApiUser }>>(`${API_URL}/auth/me`, { withCredentials: true }).pipe(
      map(({ data }) => data.user),
      tap((user) => this.currentUser.set(user)),
      catchError(() => {
        this.currentUser.set(null);
        return of(null);
      }),
    );
  }

  logout(): Observable<boolean> {
    return this.http.post(`${API_URL}/auth/logout`, {}, { withCredentials: true }).pipe(
      map(() => true),
      tap(() => this.currentUser.set(null)),
      catchError(() => {
        this.currentUser.set(null);
        return of(false);
      }),
    );
  }
}
