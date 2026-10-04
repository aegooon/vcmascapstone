import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomainApiService, InvoiceRecord } from '../../core/api/domain-api.service';

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

  constructor() {
    this.api.invoices().subscribe({ next: (response) => { this.invoices = response.data.invoices; this.loading = false; }, error: () => { this.error = 'Unable to load invoices.'; this.loading = false; } });
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
      },
      error: () => { this.paymentMessage = 'Unable to record this payment.'; },
    });
  }
}
