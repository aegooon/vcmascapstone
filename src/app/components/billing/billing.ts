import { Component, inject } from '@angular/core';
import { DomainApiService, InvoiceRecord } from '../../core/api/domain-api.service';

@Component({
  imports: [],
  selector: 'app-billing',
  styleUrl: './billing.css',
  templateUrl: './billing.html',
})
export class Billing {
  private readonly api = inject(DomainApiService);
  invoices: InvoiceRecord[] = [];
  loading = true;
  error = '';

  constructor() {
    this.api.invoices().subscribe({ next: (response) => { this.invoices = response.data.invoices; this.loading = false; }, error: () => { this.error = 'Unable to load invoices.'; this.loading = false; } });
  }
}
