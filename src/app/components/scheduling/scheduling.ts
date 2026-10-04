import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

export interface ScheduleItem {
  id: number;
  time: string;
  date: string;
  petName: string;
  breed: string;
  ownerName: string;
  reason: string;
  room: string;
  status: 'Scheduled' | 'Checked In' | 'In Progress' | 'Completed' | 'Cancelled';
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
    this.timeInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
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
        this.schedules[index] = {
          id: this.selectedScheduleId,
          ...this.formData
        };
      }
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
    if (confirm('Are you sure you want to delete this schedule entry?')) {
      this.schedules = this.schedules.filter(s => s.id !== id);
    }
  }

  // Helper for status badge styling
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Checked In':
        return 'bg-blue-100 text-blue-700';
      case 'In Progress':
        return 'bg-amber-100 text-amber-700';
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