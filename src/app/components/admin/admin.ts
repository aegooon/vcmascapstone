import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

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

interface InventoryAlertItem {
  name: string;
  detail: string;
  current: number;
  reorderAt: number;
  severity: 'critical' | 'low';
}

interface AuditLogEntry {
  text: string;
  highlight?: string;
  time: string;
  iconColor: string;
  bgColor: string;
}

interface PatientVolumeBar {
  day: string;
  value: number; // 0-100, percentage of chart height
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin.html'
})
export class AdminComponent implements OnInit, OnDestroy {

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

  // Inventory Alerts
  inventoryAlerts: InventoryAlertItem[] = [
    { name: 'Rabies Vaccine (1yr)', detail: 'Current: 12 vials · Reorder: 50', current: 12, reorderAt: 50, severity: 'critical' },
    { name: 'Gauze Pads 4x4', detail: 'Current: 2 boxes · Reorder: 10', current: 2, reorderAt: 10, severity: 'low' }
  ];

  // Patient Volume chart placeholder data
  patientVolume: PatientVolumeBar[] = [
    { day: 'MON', value: 40 },
    { day: 'TUE', value: 58 },
    { day: 'WED', value: 48 },
    { day: 'THU', value: 82 },
    { day: 'FRI', value: 65 },
    { day: 'SAT', value: 92 }
  ];

  // System Audit Log, same shape/colors as dashboard's Recent Activity
  auditLog: AuditLogEntry[] = [
    { text: 'Dr. Judit Maesa updated service pricing for ', highlight: 'Dental Cleaning', time: 'Today, 10:42 AM', iconColor: 'text-blue-600', bgColor: 'bg-blue-50' },
    { text: 'Admin created new user account for Pedro Dela Cruz', time: 'Yesterday, 2:15 PM', iconColor: 'text-teal-600', bgColor: 'bg-teal-50' },
    { text: 'System generated ', highlight: 'Low Inventory Alert', time: 'Yesterday, 8:00 AM', iconColor: 'text-amber-600', bgColor: 'bg-amber-50' }
  ];

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

  stockPercent(item: InventoryAlertItem): number {
    return Math.min(100, Math.round((item.current / item.reorderAt) * 100));
  }

  logout() {
    this.router.navigate(['/login']);
  }

  onExportReport(): void {
    // Wire up to GET /api/reports/admin-summary/ once DRF endpoint exists
    console.log('Export report clicked');
  }

  onAddNewUser(): void {
    // Open "Add New User" modal, mirroring dashboard's appointment/patient modal pattern
    console.log('Add new user clicked');
  }

  onCreatePurchaseOrder(item: InventoryAlertItem): void {
    // POST /api/inventory/purchase-orders/ with item id
    console.log('Create purchase order for', item.name);
  }
}