import { Component, inject, OnInit, signal } from '@angular/core';
import { Location } from '@angular/common';
import { FinanceService } from '../../../core/services/finance.service';

@Component({
  selector: 'app-mobile-payments',
  standalone: true,
  imports: [],
  templateUrl: './mobile-payments.component.html',
  styleUrl: './mobile-payments.component.css'
})
export class MobilePaymentsComponent implements OnInit {
  financeService = inject(FinanceService);
  location = inject(Location);

  payments = signal<any[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    // This would need to call a payments endpoint
    // For now, we'll simulate empty data
    setTimeout(() => {
      this.payments.set([]);
      this.loading.set(false);
    }, 500);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  goBack(): void {
    this.location.back();
  }
}
