import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomainApiService, EmrVisitRecord, PatientRecord } from '../../core/api/domain-api.service';

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
  selectedPatient: PatientRecord | null = null;
  clinicalNotes = '';
  diagnosis = '';
  treatmentPlan = '';
  followUp = '';
  saveMessage = '';
  visits: EmrVisitRecord[] = [];

  get filteredPatients(): PatientRecord[] {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) return this.patients;
    return this.patients.filter((patient) => `${patient.name} ${patient.species} ${patient.breed ?? ''} ${patient.client_name}`.toLowerCase().includes(query));
  }

  selectPatient(patient: PatientRecord): void {
    this.selectedPatient = patient;
    this.saveMessage = '';
    this.api.emrVisits(patient.id).subscribe({ next: ({ data }) => { this.visits = data.visits; } });
  }

  saveVisit(): void {
    if (!this.selectedPatient || !this.clinicalNotes.trim()) return;
    this.api.createEmrVisit({ pet_id: this.selectedPatient.id, clinical_notes: this.clinicalNotes, diagnosis: this.diagnosis, treatment_plan: this.treatmentPlan, follow_up_instructions: this.followUp }).subscribe({
      next: () => { this.saveMessage = 'Clinical visit saved.'; this.clinicalNotes = ''; this.diagnosis = ''; this.treatmentPlan = ''; this.followUp = ''; if (this.selectedPatient) this.api.emrVisits(this.selectedPatient.id).subscribe(({ data }) => { this.visits = data.visits; }); },
      error: () => { this.saveMessage = 'Unable to save the clinical visit.'; },
    });
  }

  constructor() {
    this.api.patients().subscribe({ next: (response) => { this.patientCount = response.data.patient_count; this.patients = response.data.patients; this.loading = false; }, error: () => { this.error = 'Unable to load patient records.'; this.loading = false; } });
  }
}
