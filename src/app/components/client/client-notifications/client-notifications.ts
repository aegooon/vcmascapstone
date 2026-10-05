import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ClientNotification, DomainApiService } from '../../../core/api/domain-api.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  imports: [CommonModule, RouterLink, RouterLinkActive],
  selector: 'app-client-notifications',
  styleUrl: './client-notifications.css',
  templateUrl: './client-notifications.html',
})
export class ClientNotifications {
  private readonly api = inject(DomainApiService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly notifications = signal<ClientNotification[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly markingId = signal('');
  readonly unreadNotifications = computed(() => this.notifications().filter((notification) => !notification.read_at).length);

  currentTime = new Date();
  isSidebarOpen = false;

  constructor() {
    this.api.notifications().subscribe({
      next: ({ data }) => {
        this.notifications.set(data.notifications);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Unable to load notifications. Please refresh and try again.');
      },
    });
  }

  get ownerName(): string {
    return this.auth.user()?.full_name ?? 'Pet Owner';
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/client/login']));
  }

  markAsRead(notification: ClientNotification): void {
    if (notification.read_at || this.markingId() !== '') return;
    this.error.set('');
    this.markingId.set(notification.id);
    this.api.markNotificationRead(notification.id).subscribe({
      next: ({ data }) => {
        this.notifications.update((items) => items.map((item) => item.id === notification.id ? { ...item, read_at: data.read_at } : item));
        this.markingId.set('');
      },
      error: () => {
        this.markingId.set('');
        this.error.set('Unable to mark this notification as read. Please try again.');
      },
    });
  }

  notificationTitle(type: string): string {
    if (type === 'appointment_approved') return 'Appointment request approved';
    if (type === 'appointment_declined') return 'Appointment request declined';
    return 'Clinic notification';
  }

  formatDate(value: string): string {
    const normalized = value.replace(' ', 'T').replace(/(\.\d{3})\d+$/, '$1');
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}
