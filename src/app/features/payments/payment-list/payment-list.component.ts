import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Payment } from '../../../core/models';
import { PaymentService } from '../../../core/services/payment.service';
import { ButtonHelmComponent } from '../../../shared/ui/button-helm/button-helm.component';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, ButtonHelmComponent, BadgeComponent],
  templateUrl: './payment-list.component.html'
})
export class PaymentListComponent {
  private paymentService = inject(PaymentService);
  
  // Signals
  payments = signal<Payment[]>([]);

  constructor() {
    this.loadPayments();
  }

  loadPayments(): void {
    this.paymentService.getPayments().subscribe(payments => {
      this.payments.set(payments);
    });
  }

  makePayment(id: number): void {
    this.paymentService.makePayment(id, 'bank_transfer').subscribe(() => {
      alert('Payment processed successfully');
      this.loadPayments();
    });
  }

  downloadCertificate(id: number): void {
    window.open(`${environment.apiUrl}/payments/certificate/${id}`, '_blank');
  }
}
