import { Component, inject } from '@angular/core';
import { DomainApiService, PatientRecord } from '../../core/api/domain-api.service';

@Component({
  imports: [],
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

  constructor() {
    this.api.patients().subscribe({ next: (response) => { this.patientCount = response.data.patient_count; this.patients = response.data.patients; this.loading = false; }, error: () => { this.error = 'Unable to load patient records.'; this.loading = false; } });
  }
}
