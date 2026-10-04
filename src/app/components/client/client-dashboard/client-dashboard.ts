import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Pet {
  id: number;
  name: string;
  species: string;
  breed: string;
  age?: string;
}

interface UpcomingAppointment {
  petName: string;
  service: string;
  date: string;   // display string, e.g. "Sept 22, 2026"
  time: string;    // display string, e.g. "9:00 AM"
  vet: string;
  room?: string;
}

interface NotificationPreview {
  text: string;
  time: string;
  read: boolean;
  iconColor: string;
  bgColor: string;
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './client-dashboard.html'
})
export class ClientDashboardComponent implements OnInit, OnDestroy {

  private timeInterval: any;
  currentTime: Date = new Date();

  ownerName = 'Maria Santos';

  // Mobile off-canvas sidebar
  isSidebarOpen = false;

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  pets: Pet[] = [
    { id: 1, name: 'Bella', species: 'Dog', breed: 'Golden Retriever', age: '3 yrs' },
    { id: 2, name: 'Milo', species: 'Cat', breed: 'British Shorthair', age: '2 yrs' }
  ];

  nextAppointment: UpcomingAppointment = {
    petName: 'Bella',
    service: 'Annual Checkup & Vaccinations',
    date: 'Sept 22, 2026',
    time: '9:00 AM',
    vet: 'Dr. Judit Maesa',
    room: 'Room 1'
  };

  stats = {
    totalPets: 2,
    upcomingAppointments: 1,
    unreadNotifications: 3
  };
  actionMessage = '';
  pendingDeletePetId: number | null = null;

  recentNotifications: NotificationPreview[] = [
    { text: 'Your appointment for Bella is confirmed.', time: '10 mins ago', read: false, iconColor: 'text-blue-600', bgColor: 'bg-blue-50' },
    { text: 'Lab results are ready for Milo.', time: '2 hrs ago', read: false, iconColor: 'text-teal-600', bgColor: 'bg-teal-50' },
    { text: 'Reminder: Rabies booster due next month.', time: 'Yesterday', read: true, iconColor: 'text-amber-600', bgColor: 'bg-amber-50' }
  ];

  // ---------- Manage Pets Modal ----------
  isManagePetsOpen = false;
  isEditingPet = false;
  petForm: Pet = this.getEmptyPet();

  openManagePets(): void {
    this.isManagePetsOpen = true;
    this.resetPetForm();
  }

  closeManagePets(): void {
    this.isManagePetsOpen = false;
    this.resetPetForm();
  }

  resetPetForm(): void {
    this.isEditingPet = false;
    this.petForm = this.getEmptyPet();
  }

  startEditPet(pet: Pet): void {
    this.isEditingPet = true;
    this.petForm = { ...pet };
  }

  savePet(): void {
    if (!this.petForm.name || !this.petForm.species) return;

    if (this.isEditingPet) {
      const index = this.pets.findIndex(p => p.id === this.petForm.id);
      if (index !== -1) {
        this.pets[index] = { ...this.petForm };
      }
    } else {
      this.petForm.id = Date.now();
      this.pets.push({ ...this.petForm });
    }

    this.stats.totalPets = this.pets.length;
    this.resetPetForm();
  }

  deletePet(id: number): void {
    this.pendingDeletePetId = id;
  }

  cancelDeletePet(): void {
    this.pendingDeletePetId = null;
  }

  confirmDeletePet(): void {
    if (this.pendingDeletePetId === null) return;
    this.pets = this.pets.filter(p => p.id !== this.pendingDeletePetId);
    this.stats.totalPets = this.pets.length;
    this.actionMessage = 'Pet removed from the profile.';
    this.pendingDeletePetId = null;
  }

  private getEmptyPet(): Pet {
    return { id: 0, name: '', species: '', breed: '', age: '' };
  }

  // ---------- View Details Modal ----------
  isViewDetailsOpen = false;

  openViewDetails(): void {
    this.isViewDetailsOpen = true;
  }

  closeViewDetails(): void {
    this.isViewDetailsOpen = false;
  }

  // ---------- Reschedule Modal ----------
  isRescheduleOpen = false;
  rescheduleForm = { date: '', time: '' };

  openReschedule(): void {
    this.rescheduleForm = { date: '', time: '' };
    this.isRescheduleOpen = true;
  }

  closeReschedule(): void {
    this.isRescheduleOpen = false;
  }

  confirmReschedule(): void {
    if (!this.rescheduleForm.date || !this.rescheduleForm.time) return;

    const parsedDate = new Date(this.rescheduleForm.date + 'T' + this.rescheduleForm.time);
    this.nextAppointment.date = parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    this.nextAppointment.time = parsedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    this.closeReschedule();
    this.actionMessage = `Your appointment has been rescheduled to ${this.nextAppointment.date} at ${this.nextAppointment.time}.`;
  }

  constructor(private router: Router) {}

  ngOnInit() {
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
    this.router.navigate(['/client/login']);
  }
}
