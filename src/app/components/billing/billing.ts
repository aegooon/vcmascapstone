import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomainApiService, InvoiceRecord, PaymentRecord } from '../../core/api/domain-api.service';

@Component({
  imports: [FormsModule],
  selector: 'app-billing',
  styleUrl: './billing.css',
  templateUrl: './billing.html',
})
export class Billing {
  private readonly api = inject(DomainApiService);
  invoices: InvoiceRecord[] = [];
  loading = true;
  error = '';
  selectedInvoice: InvoiceRecord | null = null;
  paymentAmount = 0;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'gcash' | 'other' = 'cash';
  paymentMessage = '';
  payments: PaymentRecord[] = [];
  selectedPayment: PaymentRecord | null = null;
  refundReason = '';

  constructor() {
    this.api.invoices().subscribe({ next: (response) => { this.invoices = response.data.invoices; this.loading = false; }, error: () => { this.error = 'Unable to load invoices.'; this.loading = false; } });
    this.api.payments().subscribe({ next: ({ data }) => { this.payments = data.payments; } });
  }

  selectInvoice(invoice: InvoiceRecord): void {
    this.selectedInvoice = invoice;
    this.paymentAmount = Number(invoice.balance_due);
    this.paymentMessage = '';
  }

  recordPayment(): void {
    if (!this.selectedInvoice || this.paymentAmount <= 0) return;
    this.api.recordPayment({ invoice_id: this.selectedInvoice.id, amount: this.paymentAmount, method: this.paymentMethod }).subscribe({
      next: ({ data }) => {
        const invoice = this.invoices.find((candidate) => candidate.id === data.invoice_id);
        if (invoice) { invoice.amount_paid = String(data.amount_paid); invoice.balance_due = String(data.balance_due); invoice.status = data.status; }
        this.paymentMessage = 'Payment recorded successfully.';
        this.selectedInvoice = null;
        this.api.payments().subscribe(({ data: refreshed }) => { this.payments = refreshed.payments; });
      },
      error: () => { this.paymentMessage = 'Unable to record this payment.'; },
    });
  }

  selectPayment(payment: PaymentRecord): void { this.selectedPayment = payment; this.refundReason = ''; this.paymentMessage = ''; }

  refundPayment(): void {
    if (!this.selectedPayment || !this.refundReason.trim()) return;
    this.api.refundPayment(this.selectedPayment.id, { amount: Number(this.selectedPayment.amount), reason: this.refundReason, client_request_id: `refund-${this.selectedPayment.id}-${Date.now()}` }).subscribe({ next: () => { this.paymentMessage = 'Refund recorded successfully.'; this.selectedPayment = null; this.api.payments().subscribe(({ data }) => { this.payments = data.payments; }); }, error: () => { this.paymentMessage = 'Unable to record this refund.'; } });
  }
}
