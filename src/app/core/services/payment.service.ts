import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Payment } from '../models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly apiService = inject(ApiService);
  private readonly http = inject(HttpClient); // Keep for blob download
  private readonly apiUrl = `${environment.apiUrl}/payments`;

  getPayments(): Observable<Payment[]> {
    return this.apiService.get<Payment[]>('/payments');
  }

  makePayment(paymentId: number, method: string): Observable<any> {
    return this.apiService.post('/payments', { payment_id: paymentId, method });
  }

  downloadCertificate(paymentId: number): Observable<Blob> {
    // Note: Using HttpClient directly for blob response type
    return this.http.get(`${this.apiUrl}/certificate/${paymentId}`, { responseType: 'blob' });
  }
}
