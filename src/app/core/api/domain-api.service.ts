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
export interface InventoryTransactionRecord { id: string; type: string; quantity_delta: string; quantity_before: string; quantity_after: string; reason: string; created_at: string; item_name: string; invoice_id: string | null; }

export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  status: string;
  total: string;
  amount_paid: string;
  balance_due: string;
  created_at: string;
}
export interface PaymentRecord { id: string; invoice_id: string; invoice_number: string; amount: string; method: string; status: string; reference: string | null; paid_at: string; }

export interface PatientRecord {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  client_name: string;
  last_visit: string | null;
}
export interface EmrVisitRecord { id: string; visited_at: string; clinical_notes: string; diagnosis: string | null; treatment_plan: string | null; follow_up_instructions: string | null; author_name: string; }
export interface EmrStructuredRecords { vaccinations: Array<Record<string, string | null>>; laboratories: Array<Record<string, string | null>>; medications: Array<Record<string, string | null>>; attachments: Array<Record<string, string | null>>; audit: Array<Record<string, string | null>>; }

export interface AppointmentRecord {
  id: string;
  appointment_date: string;
  appointment_time: string;
  pet_name: string;
  breed: string | null;
  owner_name: string;
  reason: string;
  room: string;
  status: string;
}

export interface ClientRecord { id: string; full_name: string; email: string; }
export interface PetLookupRecord { id: string; client_id: string; name: string; species: string; breed: string | null; }

@Injectable({ providedIn: 'root' })
export class DomainApiService {
  private readonly http = inject(HttpClient);

  inventory(): Observable<ApiEnvelope<{ items: InventoryRecord[] }>> {
    return this.http.get<ApiEnvelope<{ items: InventoryRecord[] }>>('/api/v1/inventory');
  }

  createInventoryItem(payload: { name: string; category: string; unit: string; quantity_on_hand: number; reorder_level: number; unit_cost: number; client_price: number; chargeable: boolean }): Observable<ApiEnvelope<{ id: string }>> {
    return this.http.post<ApiEnvelope<{ id: string }>>('/api/v1/inventory/items', payload);
  }

  updateInventoryItem(id: string, payload: { name: string; category: string; unit: string; quantity_on_hand: number; reorder_level: number; unit_cost: number; client_price: number }): Observable<ApiEnvelope<{ id: string }>> {
    return this.http.patch<ApiEnvelope<{ id: string }>>(`/api/v1/inventory/items/${id}`, payload);
  }

  deleteInventoryItem(id: string): Observable<ApiEnvelope<{ id: string; deleted: boolean }>> {
    return this.http.delete<ApiEnvelope<{ id: string; deleted: boolean }>>(`/api/v1/inventory/items/${id}`);
  }

  recordInventoryTransaction(payload: { inventory_item_id: string; type: 'purchase' | 'patient_usage' | 'return' | 'wastage' | 'correction'; quantity: number; reason: string; client_request_id: string; patient_id?: string; quantity_delta?: number }): Observable<ApiEnvelope<{ transaction_id: string; invoice_id: string | null; quantity_after: number; idempotent: boolean }>> {
    return this.http.post<ApiEnvelope<{ transaction_id: string; invoice_id: string | null; quantity_after: number; idempotent: boolean }>>('/api/v1/inventory/transactions', payload);
  }

  inventoryTransactions(): Observable<ApiEnvelope<{ transactions: InventoryTransactionRecord[] }>> {
    return this.http.get<ApiEnvelope<{ transactions: InventoryTransactionRecord[] }>>('/api/v1/inventory/transactions');
  }

  invoices(): Observable<ApiEnvelope<{ invoices: InvoiceRecord[] }>> {
    return this.http.get<ApiEnvelope<{ invoices: InvoiceRecord[] }>>('/api/v1/invoices');
  }

  createInvoice(payload: { client_id: string; pet_id?: string; discount_total?: number; lines: Array<{ description: string; quantity: number; unit_price: number; tax_rate?: number; service_id?: string }> }): Observable<ApiEnvelope<{ invoice_id: string; invoice_number: string; total: number; balance_due: number }>> {
    return this.http.post<ApiEnvelope<{ invoice_id: string; invoice_number: string; total: number; balance_due: number }>>('/api/v1/invoices', payload);
  }

  recordPayment(payload: { invoice_id: string; amount: number; method: 'cash' | 'card' | 'bank_transfer' | 'gcash' | 'other'; reference?: string }): Observable<ApiEnvelope<{ payment_id: string; invoice_id: string; amount_paid: number; balance_due: number; status: string }>> {
    return this.http.post<ApiEnvelope<{ payment_id: string; invoice_id: string; amount_paid: number; balance_due: number; status: string }>>('/api/v1/payments', payload);
  }

  payments(): Observable<ApiEnvelope<{ payments: PaymentRecord[] }>> {
    return this.http.get<ApiEnvelope<{ payments: PaymentRecord[] }>>('/api/v1/payments');
  }

  voidInvoice(invoiceId: string): Observable<ApiEnvelope<{ invoice_id: string; status: string }>> {
    return this.http.post<ApiEnvelope<{ invoice_id: string; status: string }>>(`/api/v1/invoices/${invoiceId}/void`, {});
  }

  refundPayment(paymentId: string, payload: { amount: number; reason: string; client_request_id: string }): Observable<ApiEnvelope<{ refund_id: string; payment_id: string; amount: number }>> {
    return this.http.post<ApiEnvelope<{ refund_id: string; payment_id: string; amount: number }>>(`/api/v1/payments/${paymentId}/refund`, payload);
  }

  patients(): Observable<ApiEnvelope<{ patient_count: number; patients: PatientRecord[] }>> {
    return this.http.get<ApiEnvelope<{ patient_count: number; patients: PatientRecord[] }>>('/api/v1/emr');
  }

  createEmrVisit(payload: { pet_id: string; clinical_notes: string; diagnosis?: string; treatment_plan?: string; follow_up_instructions?: string }): Observable<ApiEnvelope<{ visit_id: string; pet_id: string }>> {
    return this.http.post<ApiEnvelope<{ visit_id: string; pet_id: string }>>('/api/v1/emr/visits', payload);
  }

  emrVisits(petId: string): Observable<ApiEnvelope<{ visits: EmrVisitRecord[] }>> {
    return this.http.get<ApiEnvelope<{ visits: EmrVisitRecord[] }>>(`/api/v1/pets/${petId}/visits`);
  }

  emrRecords(petId: string): Observable<ApiEnvelope<EmrStructuredRecords>> {
    return this.http.get<ApiEnvelope<EmrStructuredRecords>>(`/api/v1/pets/${petId}/records`);
  }

  createEmrRecord(petId: string, payload: Record<string, string>): Observable<ApiEnvelope<{ record_id: string; type: string }>> {
    return this.http.post<ApiEnvelope<{ record_id: string; type: string }>>(`/api/v1/pets/${petId}/records`, payload);
  }

  appointments(): Observable<ApiEnvelope<{ appointments: AppointmentRecord[] }>> {
    return this.http.get<ApiEnvelope<{ appointments: AppointmentRecord[] }>>('/api/v1/appointments');
  }

  clients(): Observable<ApiEnvelope<{ clients: ClientRecord[] }>> {
    return this.http.get<ApiEnvelope<{ clients: ClientRecord[] }>>('/api/v1/clients');
  }

  pets(): Observable<ApiEnvelope<{ pets: PetLookupRecord[] }>> {
    return this.http.get<ApiEnvelope<{ pets: PetLookupRecord[] }>>('/api/v1/pets');
  }

  createAppointment(payload: { client_id: string; pet_id: string; starts_at: string; ends_at: string; reason?: string; room?: string; veterinarian_id?: string; service_id?: string }): Observable<ApiEnvelope<{ appointment_id: string; status: string }>> {
    return this.http.post<ApiEnvelope<{ appointment_id: string; status: string }>>('/api/v1/appointments', payload);
  }

  updateAppointmentStatus(id: string, status: 'requested' | 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show', cancellation_reason?: string): Observable<ApiEnvelope<{ appointment_id: string; status: string }>> {
    return this.http.patch<ApiEnvelope<{ appointment_id: string; status: string }>>(`/api/v1/appointments/${id}`, { status, cancellation_reason });
  }

  cancelAppointment(id: string, reason = 'Cancelled by staff'): Observable<ApiEnvelope<{ appointment_id: string; status: string }>> {
    return this.http.delete<ApiEnvelope<{ appointment_id: string; status: string }>>(`/api/v1/appointments/${id}`, { body: { reason } });
  }
}
