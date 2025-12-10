import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Event, EventRegistration, School, SchoolBalance } from '../models';
import { environment } from '../../../environments/environment';

export interface PaymentInitiateRequest {
  amount: number;
  phone_number: string;
  network: string;
  school_id: number;
  school_name: string;
  number_of_attendees: number;
}

export interface PaymentInitiateResponse {
  error: boolean;
  message: string;
  payment_transaction_id: number;
}

export interface PaymentStatusResponse {
  status: 'pending' | 'successful' | 'failed' | 'error';
  bank_status?: string;
  trans_status?: string;
  message: string;
  transaction_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PublicEventService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/public-events`;

  // Get event by registration code (no auth required)
  getEventByCode(code: string): Observable<Event> {
    return this.http.get<Event>(`${this.baseUrl}/view/${code}`);
  }

  // Register for event (no auth required)
  registerForEvent(code: string, registration: Partial<EventRegistration>): Observable<EventRegistration> {
    return this.http.post<EventRegistration>(`${this.baseUrl}/register/${code}`, registration);
  }

  // Search schools (no auth required)
  // If billId is provided, only returns schools that have a school_bill for that bill
  searchSchools(keyword: string, billId?: number): Observable<School[]> {
    const params: any = { search: keyword };
    if (billId) {
      params.bill_id = billId.toString();
    }
    return this.http.get<School[]>(`${this.baseUrl}/schools`, { params });
  }

  // Get school balance (no auth required)
  // If billId is provided, checks balance for that specific bill
  getSchoolBalance(schoolId: number, billId?: number): Observable<SchoolBalance> {
    const params: any = {};
    if (billId) {
      params.bill_id = billId.toString();
    }
    return this.http.get<SchoolBalance>(`${this.baseUrl}/school-balance/${schoolId}`, { params });
  }

  // Initiate MoMo payment (no auth required)
  // Payment must succeed BEFORE registration is created
  initiatePayment(code: string, request: PaymentInitiateRequest): Observable<PaymentInitiateResponse> {
    return this.http.post<PaymentInitiateResponse>(`${this.baseUrl}/initiate-payment/${code}`, request);
  }

  // Check payment status (no auth required)
  checkPaymentStatus(paymentId: number): Observable<PaymentStatusResponse> {
    return this.http.get<PaymentStatusResponse>(`${this.baseUrl}/payment-status/${paymentId}`);
  }
}
