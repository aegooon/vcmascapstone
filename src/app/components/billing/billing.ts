import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ClientRecord, DomainApiService, InvoiceRecord, PaymentRecord, PetLookupRecord } from '../../core/api/domain-api.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  selector: 'app-billing',
  styleUrl: './billing.css',
  templateUrl: './billing.html',
})
export class Billing {
  private readonly api = inject(DomainApiService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
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
  clients: ClientRecord[] = [];
  pets: PetLookupRecord[] = [];
  invoiceClientId = '';
  invoicePetId = '';
  invoiceDescription = '';
  invoiceQuantity = 1;
  invoiceUnitPrice = 0;

  get totalOutstanding(): number {
    return this.invoices.reduce((sum, invoice) => sum + Number(invoice.balance_due), 0);
  }

  get paidInvoiceCount(): number {
    return this.invoices.filter((invoice) => invoice.status === 'paid').length;
  }

  get openInvoiceCount(): number {
    return this.invoices.filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'void').length;
  }

  get currentUserName(): string {
    return this.auth.user()?.full_name ?? 'Clinic user';
  }

  get currentUserRole(): string {
    const role = this.auth.user()?.role;
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Authorized staff';
  }

  constructor() {
    this.api.invoices().subscribe({ next: (response) => { this.invoices = response.data.invoices; this.loading = false; }, error: () => { this.error = 'Unable to load invoices.'; this.loading = false; } });
    this.api.payments().subscribe({ next: ({ data }) => { this.payments = data.payments; } });
    this.api.clients().subscribe({ next: ({ data }) => { this.clients = data.clients; } });
    this.api.pets().subscribe({ next: ({ data }) => { this.pets = data.pets; } });
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

  createInvoice(): void {
    if (!this.invoiceClientId || !this.invoiceDescription.trim() || this.invoiceQuantity <= 0 || this.invoiceUnitPrice < 0) return;
    this.api.createInvoice({ client_id: this.invoiceClientId, pet_id: this.invoicePetId || undefined, lines: [{ description: this.invoiceDescription, quantity: this.invoiceQuantity, unit_price: this.invoiceUnitPrice }] }).subscribe({ next: () => { this.paymentMessage = 'Invoice created successfully.'; this.invoiceDescription = ''; this.invoiceQuantity = 1; this.invoiceUnitPrice = 0; this.api.invoices().subscribe(({ data }) => { this.invoices = data.invoices; }); }, error: () => { this.paymentMessage = 'Unable to create invoice.'; } });
  }

  voidInvoice(invoice: InvoiceRecord): void {
    this.api.voidInvoice(invoice.id).subscribe({ next: () => { invoice.status = 'void'; invoice.balance_due = '0.00'; this.paymentMessage = 'Invoice voided successfully.'; }, error: () => { this.paymentMessage = 'Unable to void invoice.'; } });
  }

  logout(): void {
    this.router.navigate(['/login']);
  }
}
