import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ClientProfileRecord, DomainApiService } from '../../../core/api/domain-api.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  selector: 'app-client-profile',
  styleUrl: './client-profile.css',
  templateUrl: './client-profile.html',
})
export class ClientProfile {
  private readonly api = inject(DomainApiService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly profile = signal<ClientProfileRecord | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly unreadNotifications = signal(0);

  currentTime = new Date();
  isSidebarOpen = false;
  form = { fullName: '', email: '', phone: '', address: '' };

  constructor() {
    this.api.profile().subscribe({
      next: ({ data }) => {
        this.profile.set(data.profile);
        this.form = {
          fullName: data.profile.full_name,
          email: data.profile.email,
          phone: data.profile.phone ?? '',
          address: data.profile.address ?? '',
        };
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Unable to load your profile. Please refresh and try again.');
      },
    });
    this.api.notifications().subscribe({
      next: ({ data }) => this.unreadNotifications.set(data.unread_count),
    });
  }

  get ownerName(): string {
    return this.profile()?.full_name ?? this.auth.user()?.full_name ?? 'Pet Owner';
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  saveProfile(): void {
    this.message.set('');
    this.error.set('');
    if (!this.form.fullName.trim()) {
      this.error.set('Enter your full name before saving.');
      return;
    }
    this.saving.set(true);
    this.api.updateProfile({
      full_name: this.form.fullName.trim(),
      phone: this.form.phone.trim(),
      address: this.form.address.trim(),
    }).subscribe({
      next: ({ data }) => {
        this.profile.set(data.profile);
        this.form = {
          fullName: data.profile.full_name,
          email: data.profile.email,
          phone: data.profile.phone ?? '',
          address: data.profile.address ?? '',
        };
        this.saving.set(false);
        this.message.set('Your profile has been updated.');
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Unable to save your profile. Please try again.');
      },
    });
  }

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/client/login']));
  }
}
