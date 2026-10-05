import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppointmentRecord, DomainApiService } from '../../core/api/domain-api.service';

interface StaffMember {
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'Active' | 'On Leave';
}

interface ServicePriceItem {
  name: string;
  category: string;
  price: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin.html'
})
export class AdminComponent implements OnInit, OnDestroy {

  private readonly api = inject(DomainApiService);
  readonly pendingRequests = signal<AppointmentRecord[]>([]);
  readonly requestActionMessage = signal('');

  // Real-time clock, same pattern as DashboardComponent
  private timeInterval: any;
  currentTime: Date = new Date();
  // Header stats
  stats = {
    totalPatients: { value: '49', trend: '+ 12%' },
    servicesRendered: { value: '49', trend: '+ 5%' },
    inventoryStatus: { value: '89%', badge: '8 Low' }
  };

  // Staff & Veterinarians table
  staff: StaffMember[] = [
    { name: 'Dr. Judit Maesa', email: 'adminveterinary@gmail.com', role: 'Lead Veterinarian', department: 'Surgery', status: 'Active' },
    { name: 'Juan Dela Cruz', email: 'juandelacruz@gmail.com', role: 'Senior Vet Tech', department: 'General Care', status: 'Active' },
    { name: 'Pedro Dela Cruz', email: 'pedrodelacruz@gmail.com', role: 'Receptionist', department: 'Front Desk', status: 'On Leave' }
  ];

  // Clinic Settings quick links
  clinicSettingsLinks = [
    { label: 'Clinic Profile & Details' },
    { label: 'Operating Hours' },
    { label: 'Roles & Permissions' },
    { label: 'Billing & Taxes' }
  ];

  // Service Pricing
  servicePricing: ServicePriceItem[] = [
    { name: 'Annual Wellness Exam', category: 'General Checkup', price: '₱85.00' },
    { name: 'Feline Vaccines (Core)', category: 'Preventative', price: '₱120.00' },
    { name: 'Dental Cleaning', category: 'Surgery/Anesthesia', price: '₱350.00' }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadPendingRequests();
    this.timeInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  logout() {
    this.router.navigate(['/login']);
  }

  approveAppointment(appointment: AppointmentRecord): void {
    this.api.updateAppointmentStatus(appointment.id, 'scheduled').subscribe({
      next: () => {
        this.pendingRequests.update((requests) => requests.filter((request) => request.id !== appointment.id));
        this.requestActionMessage.set(`${appointment.pet_name}'s appointment has been approved.`);
      },
      error: () => this.requestActionMessage.set('Unable to approve this request. Sign in with a staff or administrator account.'),
    });
  }

  declineAppointment(appointment: AppointmentRecord): void {
    this.api.updateAppointmentStatus(appointment.id, 'cancelled', 'Declined by clinic').subscribe({
      next: () => {
        this.pendingRequests.update((requests) => requests.filter((request) => request.id !== appointment.id));
        this.requestActionMessage.set(`${appointment.pet_name}'s appointment request was declined.`);
      },
      error: () => this.requestActionMessage.set('Unable to decline this request. Sign in with a staff or administrator account.'),
    });
  }

  private loadPendingRequests(): void {
    this.api.appointments().subscribe({
      next: ({ data }) => this.pendingRequests.set(data.appointments.filter((appointment) => appointment.status === 'requested')),
    });
  }

}
