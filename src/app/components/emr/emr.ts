import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomainApiService, EmrStructuredRecords, EmrVisitRecord, PatientRecord } from '../../core/api/domain-api.service';

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
  records: EmrStructuredRecords | null = null;
  recordType: 'vaccination' | 'laboratory' | 'medication' = 'vaccination';
  vaccineName = '';
  testName = '';
  resultSummary = '';
  medicationName = '';
  dosage = '';
  frequency = '';
  recordMessage = '';
  attachmentFile: File | null = null;
  attachmentMessage = '';

  get filteredPatients(): PatientRecord[] {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) return this.patients;
    return this.patients.filter((patient) => `${patient.name} ${patient.species} ${patient.breed ?? ''} ${patient.client_name}`.toLowerCase().includes(query));
  }

  selectPatient(patient: PatientRecord): void {
    this.selectedPatient = patient;
    this.saveMessage = '';
    this.api.emrVisits(patient.id).subscribe({ next: ({ data }) => { this.visits = data.visits; } });
    this.api.emrRecords(patient.id).subscribe({ next: ({ data }) => { this.records = data; } });
  }

  saveVisit(): void {
    if (!this.selectedPatient || !this.clinicalNotes.trim()) return;
    this.api.createEmrVisit({ pet_id: this.selectedPatient.id, clinical_notes: this.clinicalNotes, diagnosis: this.diagnosis, treatment_plan: this.treatmentPlan, follow_up_instructions: this.followUp }).subscribe({
      next: () => { this.saveMessage = 'Clinical visit saved.'; this.clinicalNotes = ''; this.diagnosis = ''; this.treatmentPlan = ''; this.followUp = ''; if (this.selectedPatient) this.api.emrVisits(this.selectedPatient.id).subscribe(({ data }) => { this.visits = data.visits; }); },
      error: () => { this.saveMessage = 'Unable to save the clinical visit.'; },
    });
  }

  saveStructuredRecord(): void {
    if (!this.selectedPatient) return;
    const payload: Record<string, string> = { type: this.recordType };
    if (this.recordType === 'vaccination') payload['vaccine_name'] = this.vaccineName;
    if (this.recordType === 'laboratory') { payload['test_name'] = this.testName; payload['result_summary'] = this.resultSummary; }
    if (this.recordType === 'medication') { payload['medication_name'] = this.medicationName; payload['dosage'] = this.dosage; payload['frequency'] = this.frequency; }
    const required = this.recordType === 'vaccination' ? this.vaccineName : this.recordType === 'laboratory' ? this.testName : this.medicationName;
    if (!required.trim()) return;
    this.api.createEmrRecord(this.selectedPatient.id, payload).subscribe({ next: () => { this.recordMessage = 'EMR record saved.'; this.vaccineName = ''; this.testName = ''; this.resultSummary = ''; this.medicationName = ''; this.dosage = ''; this.frequency = ''; this.reloadRecords(); }, error: () => { this.recordMessage = 'Unable to save the EMR record.'; } });
  }

  private reloadRecords(): void {
    if (this.selectedPatient) this.api.emrRecords(this.selectedPatient.id).subscribe(({ data }) => { this.records = data; });
  }

  selectAttachment(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.attachmentFile = input.files?.item(0) ?? null;
    this.attachmentMessage = '';
  }

  uploadAttachment(): void {
    if (!this.selectedPatient || !this.attachmentFile) return;
    this.api.uploadEmrAttachment(this.selectedPatient.id, this.attachmentFile).subscribe({
      next: () => { this.attachmentFile = null; this.attachmentMessage = 'Attachment uploaded.'; this.reloadRecords(); },
      error: () => { this.attachmentMessage = 'Unable to upload attachment. Use PDF, PNG, or JPEG under 5 MB.'; },
    });
  }

  downloadAttachment(id: string, name: string): void {
    this.api.downloadEmrAttachment(id).subscribe({ next: (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
      URL.revokeObjectURL(url);
    }, error: () => { this.attachmentMessage = 'Unable to download attachment.'; } });
  }

  constructor() {
    this.api.patients().subscribe({ next: (response) => { this.patientCount = response.data.patient_count; this.patients = response.data.patients; this.loading = false; }, error: () => { this.error = 'Unable to load patient records.'; this.loading = false; } });
  }
}
