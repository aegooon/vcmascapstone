import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { inject } from '@angular/core';
import { ClientRecord, DomainApiService, PetLookupRecord } from '../../core/api/domain-api.service';

export interface ScheduleItem {
  id: number;
  serverId?: string;
  clientId?: string;
  petId?: string;
  time: string;
  date: string;
  petName: string;
  breed: string;
  ownerName: string;
  reason: string;
  room: string;
  status: 'Requested' | 'Scheduled' | 'Checked In' | 'In Progress' | 'Completed' | 'Cancelled';
  statusColor: string;
}

@Component({
  selector: 'app-scheduling',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './scheduling.html',
  styleUrl: './scheduling.css'
})
export class SchedulingComponent implements OnInit, OnDestroy {
  private readonly api = inject(DomainApiService);
  doctorName = 'Dr. Judit Maesa';
  currentTime: Date = new Date();

  // Real-time clock, same pattern as Dashboard/Admin/Inventory (60s tick, cleared on destroy)
  private timeInterval: any;

  // Search & Filter State
  searchTerm = '';
  selectedFilter = 'All';

  // Modal Visibility State
  isModalOpen = false;
  isEditMode = false;
  selectedScheduleId: number | null = null;
  clients: ClientRecord[] = [];
  pets: PetLookupRecord[] = [];

  // Schedule Data Store (Mock Data matching VCMAS design)
  schedules: ScheduleItem[] = [
    {
      id: 1,
      time: '09:00 AM',
      date: '2026-09-30',
      petName: 'Bella',
      breed: 'Golden Retriever',
      ownerName: 'John Doe',
      reason: 'Annual Checkup & Vaccinations',
      room: 'ROOM 1',
      status: 'Checked In',
      statusColor: 'bg-blue-600'
    },
    {
      id: 2,
      time: '10:30 AM',
      date: '2026-09-30',
      petName: 'Max',
      breed: 'Siamese Cat',
      ownerName: 'Jane Smith',
      reason: 'Urgent: Lethargy & Fever',
      room: 'ROOM 3',
      status: 'In Progress',
      statusColor: 'bg-red-600'
    },
    {
      id: 3,
      time: '11:15 AM',
      date: '2026-09-30',
      petName: 'Charlie',
      breed: 'Dachshund',
      ownerName: 'Robert Johnson',
      reason: 'Dental Cleaning',
      room: 'SURGERY',
      status: 'Scheduled',
      statusColor: 'bg-teal-600'
    },
    {
      id: 4,
      time: '02:00 PM',
      date: '2026-09-30',
      petName: 'Luna',
      breed: 'Husky',
      ownerName: 'Emily Davis',
      reason: 'Skin Allergy Follow-up',
      room: 'ROOM 2',
      status: 'Scheduled',
      statusColor: 'bg-indigo-600'
    }
  ];

  // Form Model
  formData: Omit<ScheduleItem, 'id'> = {
    time: '',
    date: new Date().toISOString().split('T')[0],
    petName: '',
    breed: '',
    ownerName: '',
    reason: '',
    room: 'ROOM 1',
    status: 'Scheduled',
    statusColor: 'bg-blue-600'
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.api.appointments().subscribe({ next: ({ data }) => { this.schedules = data.appointments.map((item, index) => ({ id: index + 1, serverId: item.id, time: item.appointment_time, date: item.appointment_date, petName: item.pet_name, breed: item.breed ?? '', ownerName: item.owner_name, reason: item.reason, room: item.room, status: this.displayStatus(item.status), statusColor: 'bg-blue-600' })); } });
    this.api.clients().subscribe({ next: ({ data }) => { this.clients = data.clients; } });
    this.api.pets().subscribe({ next: ({ data }) => { this.pets = data.pets; } });
    this.timeInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
  }

  private displayStatus(status: string): ScheduleItem['status'] {
    const values: Record<string, ScheduleItem['status']> = { requested: 'Requested', scheduled: 'Scheduled', checked_in: 'Checked In', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled', no_show: 'Cancelled' };
    return values[status] ?? 'Scheduled';
  }

  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  // Filtered schedules list
  get filteredSchedules(): ScheduleItem[] {
    return this.schedules.filter(item => {
      const matchesSearch =
        item.petName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.ownerName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.breed.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.reason.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus =
        this.selectedFilter === 'All' || item.status === this.selectedFilter;

      return matchesSearch && matchesStatus;
    });
  }

  // Stat card getters
  get todayCount(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.schedules.filter(s => s.date === today).length;
  }

  get checkedInCount(): number {
    return this.schedules.filter(s => s.status === 'Checked In').length;
  }

  get inProgressCount(): number {
    return this.schedules.filter(s => s.status === 'In Progress').length;
  }

  // CREATE: Open modal for new schedule entry
  openCreateModal(): void {
    this.isEditMode = false;
    this.selectedScheduleId = null;
    this.formData = {
      time: '09:00 AM',
      date: new Date().toISOString().split('T')[0],
      petName: '',
      breed: '',
      ownerName: '',
      reason: '',
      room: 'ROOM 1',
      status: 'Scheduled',
      statusColor: 'bg-blue-600'
    };
    this.isModalOpen = true;
  }

  // UPDATE: Open modal to edit existing schedule entry
  openEditModal(item: ScheduleItem): void {
    this.isEditMode = true;
    this.selectedScheduleId = item.id;
    this.formData = { ...item };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  // SAVE (Create / Update handling)
  saveSchedule(): void {
    if (this.isEditMode && this.selectedScheduleId !== null) {
      // Update
      const index = this.schedules.findIndex(s => s.id === this.selectedScheduleId);
      if (index !== -1) {
        const item = this.schedules[index];
        if (item.serverId) this.api.updateAppointmentStatus(item.serverId, this.apiStatus(this.formData.status)).subscribe({ next: () => { this.schedules[index] = { id: this.selectedScheduleId as number, serverId: item.serverId, ...this.formData }; this.closeModal(); } });
      }
    } else if (this.formData.clientId && this.formData.petId) {
      const start = `${this.formData.date} ${this.to24Hour(this.formData.time)}:00`;
      const end = `${this.formData.date} ${this.to24Hour(this.formData.time, 30)}:00`;
      this.api.createAppointment({ client_id: this.formData.clientId, pet_id: this.formData.petId, starts_at: start, ends_at: end, reason: this.formData.reason, room: this.formData.room }).subscribe({ next: () => { this.closeModal(); this.api.appointments().subscribe(({ data }) => { this.schedules = data.appointments.map((item, index) => ({ id: index + 1, serverId: item.id, time: item.appointment_time, date: item.appointment_date, petName: item.pet_name, breed: item.breed ?? '', ownerName: item.owner_name, reason: item.reason, room: item.room, status: this.displayStatus(item.status), statusColor: 'bg-blue-600' })); }); } });
    } else {
      // Create
      const newId = this.schedules.length > 0
        ? Math.max(...this.schedules.map(s => s.id)) + 1
        : 1;

      this.schedules.push({
        id: newId,
        ...this.formData
      });
    }
    this.closeModal();
  }

  // DELETE
  deleteSchedule(id: number): void {
    const item = this.schedules.find(schedule => schedule.id === id);
    if (item?.serverId) this.api.cancelAppointment(item.serverId).subscribe({ next: () => { this.schedules = this.schedules.map(schedule => schedule.id === id ? { ...schedule, status: 'Cancelled' } : schedule); } });
  }

  approveSchedule(item: ScheduleItem): void {
    if (!item.serverId) return;
    this.api.updateAppointmentStatus(item.serverId, 'scheduled').subscribe({
      next: () => { item.status = 'Scheduled'; },
    });
  }

  private apiStatus(status: ScheduleItem['status']): 'requested' | 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' {
    const values: Record<ScheduleItem['status'], 'requested' | 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'> = { Requested: 'requested', Scheduled: 'scheduled', 'Checked In': 'checked_in', 'In Progress': 'in_progress', Completed: 'completed', Cancelled: 'cancelled' };
    return values[status];
  }

  selectPet(petId: string): void {
    this.formData.petId = petId;
    this.formData.petName = this.pets.find((pet) => pet.id === petId)?.name ?? '';
  }

  selectClient(clientId: string): void {
    this.formData.clientId = clientId;
    this.formData.ownerName = this.clients.find((client) => client.id === clientId)?.full_name ?? '';
  }

  private to24Hour(value: string, addMinutes = 0): string {
    const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return '09:00';
    let hours = Number(match[1]) % 12;
    hours += match[3].toUpperCase() === 'PM' ? 12 : 0;
    const date = new Date(2000, 0, 1, hours, Number(match[2]));
    date.setMinutes(date.getMinutes() + addMinutes);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  // Helper for status badge styling
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Checked In':
        return 'bg-blue-100 text-blue-700';
      case 'In Progress':
        return 'bg-amber-100 text-amber-700';
      case 'Requested':
        return 'bg-violet-100 text-violet-700';
      case 'Completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}
