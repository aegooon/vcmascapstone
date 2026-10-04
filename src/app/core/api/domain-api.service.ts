import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEnvelope } from './api.types';

export interface InventoryRecord {
  id: string;
  sku: string | null;
  name: string;
  category: string;
  unit: string;
  quantity_on_hand: string;
  reorder_level: string;
  unit_cost: string;
  client_price: string;
  chargeable: boolean;
  active: boolean;
  updated_at: string;
}

export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  status: string;
  total: string;
  amount_paid: string;
  balance_due: string;
  created_at: string;
}

export interface PatientRecord {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  client_name: string;
  last_visit: string | null;
}

@Injectable({ providedIn: 'root' })
export class DomainApiService {
  private readonly http = inject(HttpClient);

  inventory(): Observable<ApiEnvelope<{ items: InventoryRecord[] }>> {
    return this.http.get<ApiEnvelope<{ items: InventoryRecord[] }>>('/api/v1/inventory');
  }

  invoices(): Observable<ApiEnvelope<{ invoices: InvoiceRecord[] }>> {
    return this.http.get<ApiEnvelope<{ invoices: InvoiceRecord[] }>>('/api/v1/invoices');
  }

  patients(): Observable<ApiEnvelope<{ patient_count: number; patients: PatientRecord[] }>> {
    return this.http.get<ApiEnvelope<{ patient_count: number; patients: PatientRecord[] }>>('/api/v1/emr');
  }
}
