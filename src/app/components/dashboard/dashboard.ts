import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common'; // 1. Added this import
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ], // 2. Added CommonModule and FormsModule here
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit, OnDestroy {

  get isModalOpen(): boolean {
    return this.isAppointmentModalOpen;
  }
  set isModalOpen(value: boolean) {
    this.isAppointmentModalOpen = value;
  } 

  isAppointmentModalOpen = false;
  isPatientModalOpen = false;

  appointmentData = {
    petName: '',
    species: '',
    breed: '',
    ownerName: '',
    serviceType: 'Annual Check-up',
    date: '',
    time: ''
  };

  patientData = {
  petName: '',
  species: '',
  breed: '',
  age: '',
  ownerName: ''
};

  // Add these method aliases to satisfy openModal() and closeModal() in dashboard.html
  openModal(): void {
    this.openAppointmentModal();
  }

  closeModal(): void {
    this.closeAppointmentModal();
  }

  // Appointment Modal Handlers
  openAppointmentModal(): void {
    this.isAppointmentModalOpen = true;
  }

  closeAppointmentModal(): void {
    this.isAppointmentModalOpen = false;
  }

  confirmAppointment(): void {
    console.log('Appointment Scheduled:', this.appointmentData);
    this.closeAppointmentModal();
  }

  // 1. Add this method to open the patient modal
  openPatientModal(): void {
    this.isPatientModalOpen = true;
  }

  // 2. Add this method to close the patient modal
  closePatientModal(): void {
    this.isPatientModalOpen = false;
  }

  // 3. Add this method to handle registering the patient
  registerPatient(): void {
    console.log('Patient Registered:', this.patientData);
    this.closePatientModal();
  }

  // Real-time clock interval
  private timeInterval: any;
  currentTime: Date = new Date();

  // Dynamic User Data
  doctorName = 'Dr. Judit Maesa';
  appointmentCount = 8;
  nextAppointmentTime = '45 minutes';

  // Dynamic Dashboard Stats
  stats = {
    totalPatients: { value: '49', trend: '+ 12%', trendUp: true },
    todaysAppointments: { value: '12' },
    pendingRecords: { value: '15' },
    revenue: { value: '₱26,250', trend: '+ 4%', trendUp: true }
  };

  // Daily Schedule Data
  schedule = [
    { time: '09:00 AM', statusColor: 'bg-blue-600', petName: 'Bella', breed: 'Golden Retriever', reason: 'Annual Checkup & Vaccinations', room: 'ROOM 1' },
    { time: '10:30 AM', statusColor: 'bg-red-600', petName: 'Max', breed: 'Siamese Cat', reason: 'Urgent: Lethargy & Fever', room: 'ROOM 3' },
    { time: '11:15 AM', statusColor: 'bg-teal-600', petName: 'Charlie', breed: 'Dachshund', reason: 'Dental Cleaning', room: 'SURGERY' }
  ];

  // Recent Activity Data
  activities = [
    { text: 'Luna (Husky) checked in.', time: '2 mins ago', iconColor: 'text-teal-600', bgColor: 'bg-teal-50' },
    { text: 'Lab results uploaded for Oliver.', time: '15 mins ago', iconColor: 'text-blue-600', bgColor: 'bg-blue-50' },
    { text: 'Low stock alert: Rabies Vaccine.', time: '1 hr ago', iconColor: 'text-amber-600', bgColor: 'bg-amber-50' },
    { text: 'Surgery completed for Milo.', time: '2 hrs ago', iconColor: 'text-teal-600', bgColor: 'bg-teal-50' }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    // Simulating a real-time data subscription (e.g., ticking clock)
    this.timeInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 60000); // Updates every minute
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  // Functional Action Handlers
  logout() {
    // Clear tokens here when backend is connected
    this.router.navigate(['/login']);
  }

  triggerEmergency() {
    alert('Emergency Protocol Activated!');
  }
}