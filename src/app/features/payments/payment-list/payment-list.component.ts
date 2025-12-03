import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Payment } from '../../../core/models';
import { PaymentService } from '../../../core/services/payment.service';
import { ButtonHelmComponent } from '../../../shared/ui/button-helm/button-helm.component';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { environment } from '../../../../environments/environment';
import { FlashMessageService } from '../../../core/services/flash-message.service';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, ButtonHelmComponent, BadgeComponent],
  templateUrl: './payment-list.component.html'
})
export class PaymentListComponent {
  private paymentService = inject(PaymentService);
  private flashMessage = inject(FlashMessageService);

  // Signals
  payments = signal<Payment[]>([]);
  isLoading = signal(true);

  // Financial statistics computed signals
  statistics = computed(() => {
    const allPayments = this.payments();
    const completed = allPayments.filter(p => p.status === 'completed');
    const pending = allPayments.filter(p => p.status === 'pending');

    return {
      total: allPayments.length,
      completed: completed.length,
      pending: pending.length,
      totalAmount: allPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      completedAmount: completed.reduce((sum, p) => sum + (p.amount || 0), 0),
      pendingAmount: pending.reduce((sum, p) => sum + (p.amount || 0), 0)
    };
  });

  constructor() {
    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading.set(true);
    this.paymentService.getPayments().subscribe({
      next: (payments) => {
        this.payments.set(payments);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load payments:', err);
        this.isLoading.set(false);
      }
    });
  }

  makePayment(id: number): void {
    this.paymentService.makePayment(id, 'bank_transfer').subscribe({
      next: () => {
        this.flashMessage.success('Payment processed successfully');
        this.loadPayments();
      },
      error: (err) => {
        console.error('Failed to process payment:', err);
        this.flashMessage.error('Failed to process payment. Please try again.');
      }
    });
  }

  downloadCertificate(id: number): void {
    window.open(`${environment.apiUrl}/payments/certificate/${id}`, '_blank');
  }

  getStatusVariant(status: string): 'success' | 'warning' | 'destructive' | 'default' {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'destructive';
      default:
        return 'default';
    }
  }
}
