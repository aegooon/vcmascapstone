import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AppointmentRecord, DomainApiService, PetLookupRecord } from '../../../core/api/domain-api.service';
import { AuthService } from '../../../core/auth/auth.service';

interface ClientAppointment {
  id: string;
  service: string;
  petName: string;
  room: string;
  date: string;
  time: string;
  status: string;
}

@Component({
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  selector: 'app-client-appointments',
  styleUrl: './client-appointments.css',
  templateUrl: './client-appointments.html',
})
export class ClientAppointments {
  private readonly api = inject(DomainApiService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly bookingBusy = signal(false);
  readonly bookingError = signal('');
  readonly bookingMessage = signal('');
  readonly appointments = signal<ClientAppointment[]>([]);
  readonly pets = signal<PetLookupRecord[]>([]);

  currentTime = new Date();
  isSidebarOpen = false;
  unreadNotifications = 3;
  minDate = new Date().toISOString().slice(0, 10);
  bookingForm = {
    petId: '',
    serviceId: '20000000-0000-4000-8000-000000000002',
    date: '',
    time: '09:00',
    notes: '',
  };

  readonly serviceOptions = [
    { id: '20000000-0000-4000-8000-000000000001', name: 'Consultation' },
    { id: '20000000-0000-4000-8000-000000000002', name: 'Vaccination & Deworming' },
    { id: '20000000-0000-4000-8000-000000000003', name: 'Grooming' },
  ];
  readonly timeOptions = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

  constructor() {
    this.api.pets().subscribe({
      next: ({ data }) => {
        this.pets.set(data.pets);
        if (!this.bookingForm.petId && data.pets.length > 0) this.bookingForm.petId = data.pets[0].id;
      },
      error: () => this.bookingError.set('Unable to load your pets. Please refresh and try again.'),
    });
    this.api.appointments().subscribe({
      next: ({ data }) => {
        this.appointments.set(data.appointments.map((appointment) => this.mapAppointment(appointment)));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.bookingError.set('Unable to load your appointments. Please refresh and try again.');
      },
    });
  }

  get ownerName(): string {
    return this.auth.user()?.full_name ?? 'Maria Santos';
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  bookAppointment(): void {
    this.bookingError.set('');
    this.bookingMessage.set('');
    const { petId, serviceId, date, time, notes } = this.bookingForm;
    const service = this.serviceOptions.find((option) => option.id === serviceId);
    if (!petId || !service || !date || !time) {
      this.bookingError.set('Choose a pet, service, date, and time before submitting.');
      return;
    }

    const startsAt = `${date} ${time}:00`;
    const endsAt = this.addHour(date, time);
    this.bookingBusy.set(true);
    this.api.createAppointment({
      pet_id: petId,
      starts_at: startsAt,
      ends_at: endsAt,
      reason: notes.trim() || service.name,
      room: 'Room 1',
      service_id: service.id,
    }).subscribe({
      next: () => {
        this.bookingBusy.set(false);
        this.bookingMessage.set('Appointment request submitted. The clinic will confirm your visit.');
        this.bookingForm.date = '';
        this.bookingForm.time = '09:00';
        this.bookingForm.notes = '';
        this.reloadAppointments();
      },
      error: (error: unknown) => {
        this.bookingBusy.set(false);
        const message = this.getApiError(error);
        this.bookingError.set(message || 'Unable to submit the appointment request. Please choose another time.');
      },
    });
  }

  requestReschedule(appointment: ClientAppointment): void {
    this.bookingMessage.set(`Reschedule request noted for ${appointment.petName}'s appointment. Please contact the clinic to confirm a new time.`);
  }

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/client/login']));
  }

  private reloadAppointments(): void {
    this.api.appointments().subscribe({
      next: ({ data }) => this.appointments.set(data.appointments.map((appointment) => this.mapAppointment(appointment))),
    });
  }

  private mapAppointment(appointment: AppointmentRecord): ClientAppointment {
    return {
      id: appointment.id,
      service: appointment.reason || 'General appointment',
      petName: appointment.pet_name,
      room: appointment.room,
      date: this.formatDate(appointment.appointment_date),
      time: appointment.appointment_time,
      status: appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1).replace('_', ' '),
    };
  }

  private formatDate(value: string): string {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  private addHour(date: string, time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const endHour = String(hours + 1).padStart(2, '0');
    return `${date} ${endHour}:${String(minutes).padStart(2, '0')}:00`;
  }

  private getApiError(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const payload = (error as { error?: { error?: { message?: string } } }).error;
      return payload?.error?.message ?? '';
    }
    return '';
  }
}
