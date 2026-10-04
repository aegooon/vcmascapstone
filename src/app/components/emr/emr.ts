import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomainApiService, PatientRecord } from '../../core/api/domain-api.service';

@Component({
  imports: [FormsModule],
  selector: 'app-emr',
  styleUrl: './emr.css',
  templateUrl: './emr.html',
})
export class Emr {
  private readonly api = inject(DomainApiService);
  patients: PatientRecord[] = [];
  patientCount = 0;
  loading = true;
  error = '';
  searchTerm = '';

  get filteredPatients(): PatientRecord[] {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) return this.patients;
    return this.patients.filter((patient) => `${patient.name} ${patient.species} ${patient.breed ?? ''} ${patient.client_name}`.toLowerCase().includes(query));
  }

  constructor() {
    this.api.patients().subscribe({ next: (response) => { this.patientCount = response.data.patient_count; this.patients = response.data.patients; this.loading = false; }, error: () => { this.error = 'Unable to load patient records.'; this.loading = false; } });
  }
}
