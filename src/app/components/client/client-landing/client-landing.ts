import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClinicSettings, DomainApiService } from '../../../core/api/domain-api.service';

interface LandingService {
  name: string;
  description: string;
  symbol: string;
}

@Component({
  host: { '(document:keydown.escape)': 'closeMenu()' },
  imports: [CommonModule, RouterLink],
  selector: 'app-client-landing',
  styleUrl: './client-landing.css',
  templateUrl: './client-landing.html',
})
export class ClientLandingComponent {
  private readonly api = inject(DomainApiService);

  readonly services: readonly LandingService[] = [
    { name: 'Consultation', description: 'Personalized veterinary assessment and care planning.', symbol: '✚' },
    { name: 'Vaccination & Deworming', description: 'Preventive care that keeps pets protected and healthy.', symbol: '✦' },
    { name: 'Surgeries', description: 'Safe surgical care with attentive recovery support.', symbol: '⚕' },
    { name: 'Treatment Laboratories', description: 'Diagnostic testing to guide accurate treatment decisions.', symbol: '⌁' },
    { name: 'Grooming', description: 'Comfortable grooming for a healthier, happier pet.', symbol: '✿' },
    { name: 'Pet Supplies', description: 'Trusted essentials for everyday pet care.', symbol: '▦' },
    { name: 'Boarding', description: 'A secure, caring stay while you are away.', symbol: '⌂' },
    { name: 'Confinement', description: 'Monitored care for pets who need closer observation.', symbol: '♡' },
  ];

  readonly fallbackClinic: ClinicSettings = {
    clinic_name: 'VCMAS Veterinary Clinic',
    address: '195 Rt. Aglipay St., Brgy. Poblacion, Mandaluyong City',
    mobile_number: '09311318670',
    telephone_number: '86717479',
    opening_time: '09:00:00',
    closing_time: '18:30:00',
    timezone: 'Asia/Manila',
  };
  readonly clinic = signal<ClinicSettings>(this.fallbackClinic);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly copyMessage = signal('');
  isMenuOpen = false;

  constructor() {
    this.api.clinic().subscribe({
      next: ({ data }) => {
        if (data.clinic) this.clinic.set(data.clinic);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Clinic details are temporarily unavailable. Showing the published clinic information.');
      },
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  formatTime(value: string): string {
    const [hourText, minuteText] = value.split(':');
    const hour = Number(hourText);
    const minute = Number(minuteText);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
  }

  copyAddress(): void {
    if (!navigator.clipboard) {
      this.copyMessage.set('Select the address to copy it.');
      return;
    }
    navigator.clipboard.writeText(this.clinic().address).then(() => {
      this.copyMessage.set('Address copied.');
    }).catch(() => {
      this.copyMessage.set('Select the address to copy it.');
    });
  }
}
