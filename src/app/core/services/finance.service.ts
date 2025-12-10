import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FinanceAccount, BillParticular, Bill, BillItem, BillAssignment, SchoolBill, SchoolPaymentRequest, PaymentStatusResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // Finance Accounts
  getFinanceAccounts(page: number = 1, limit: number = 10, search: string = ''): Observable<any> {
    return this.http.get(`${this.baseUrl}/finance_accounts/list`, {
      params: { page: page.toString(), limit: limit.toString(), search }
    });
  }

  getFinanceAccount(id: number): Observable<FinanceAccount> {
    return this.http.get<FinanceAccount>(`${this.baseUrl}/finance_accounts/view/${id}`);
  }

  createFinanceAccount(data: Partial<FinanceAccount>): Observable<FinanceAccount> {
    return this.http.post<FinanceAccount>(`${this.baseUrl}/finance_accounts/create`, data);
  }

  updateFinanceAccount(id: number, data: Partial<FinanceAccount>): Observable<FinanceAccount> {
    return this.http.put<FinanceAccount>(`${this.baseUrl}/finance_accounts/update/${id}`, data);
  }

  deleteFinanceAccount(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/finance_accounts/delete/${id}`);
  }

  validateAccountCode(code: string): Observable<{ available: boolean }> {
    return this.http.get<{ available: boolean }>(`${this.baseUrl}/finance_accounts/validate-code`, {
      params: { code }
    });
  }

  // Bill Particulars
  getBillParticulars(page: number = 1, limit: number = 10, search: string = '', financeAccountId?: number): Observable<any> {
    let params: any = { page: page.toString(), limit: limit.toString(), search };
    if (financeAccountId) {
      params.finance_account_id = financeAccountId.toString();
    }
    return this.http.get(`${this.baseUrl}/bill_particulars/list`, { params });
  }

  getBillParticular(id: number): Observable<BillParticular> {
    return this.http.get<BillParticular>(`${this.baseUrl}/bill_particulars/view/${id}`);
  }

  createBillParticular(data: Partial<BillParticular>): Observable<BillParticular> {
    return this.http.post<BillParticular>(`${this.baseUrl}/bill_particulars/create`, data);
  }

  updateBillParticular(id: number, data: Partial<BillParticular>): Observable<BillParticular> {
    return this.http.put<BillParticular>(`${this.baseUrl}/bill_particulars/update/${id}`, data);
  }

  deleteBillParticular(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/bill_particulars/delete/${id}`);
  }

  updateBillParticularPriority(id: number, priority: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/bill_particulars/update-priority/${id}`, { priority });
  }

  // Bills
  getBills(page: number = 1, limit: number = 10, search: string = '', filters?: any): Observable<any> {
    let params: any = { page: page.toString(), limit: limit.toString(), search };
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params[key] = filters[key];
        }
      });
    }
    return this.http.get(`${this.baseUrl}/bills/list`, { params });
  }

  getBill(id: number): Observable<Bill> {
    return this.http.get<Bill>(`${this.baseUrl}/bills/show/${id}`);
  }

  createBill(data: Partial<Bill>): Observable<Bill> {
    return this.http.post<Bill>(`${this.baseUrl}/bills/create`, data);
  }

  updateBill(id: number, data: Partial<Bill>): Observable<Bill> {
    return this.http.put<Bill>(`${this.baseUrl}/bills/update/${id}`, data);
  }

  deleteBill(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/bills/delete/${id}`);
  }

  // Bill Items
  getBillItems(billId: number, page?: number, limit?: number, search?: string): Observable<any> {
    let params = '';
    if (page !== undefined && limit !== undefined) {
      params = `?page=${page}&limit=${limit}`;
      if (search) {
        params += `&search=${encodeURIComponent(search)}`;
      }
    }
    return this.http.get(`${this.baseUrl}/bills/items/${billId}${params}`);
  }

  createBillItem(data: Partial<BillItem>): Observable<BillItem> {
    return this.http.post<BillItem>(`${this.baseUrl}/bills/create-item`, data);
  }

  updateBillItem(id: number, data: Partial<BillItem>): Observable<BillItem> {
    return this.http.put<BillItem>(`${this.baseUrl}/bills/update-item/${id}`, data);
  }

  deleteBillItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/bills/delete-item/${id}`);
  }

  // Bill Assignments
  getBillItemAssignments(billItemId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/bills/item-assignments/${billItemId}`);
  }

  createBillAssignments(billItemId: number, assignments: Partial<BillAssignment>[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/bills/create-assignments`, {
      bill_item_id: billItemId,
      assignments
    });
  }

  deleteBillAssignment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/bills/delete-assignment/${id}`);
  }

  // School Bills
  getSchoolBills(schoolId: number): Observable<{ data: SchoolBill[] }> {
    return this.http.get<{ data: SchoolBill[] }>(`${this.baseUrl}/school-bills/list`, {
      params: { school_id: schoolId.toString() }
    });
  }

  getSchoolBillBalance(schoolBillId: number): Observable<{ balance: number; bill_name?: string }> {
    return this.http.get<{ balance: number; bill_name?: string }>(`${this.baseUrl}/school-bills/balance/${schoolBillId}`);
  }

  // School Payments
  recordSchoolPayment(payment: SchoolPaymentRequest): Observable<{ message: string; payment_method?: string; data?: any }> {
    return this.http.post<{ message: string; payment_method?: string; data?: any }>(`${this.baseUrl}/school-payments/record`, payment);
  }

  checkPaymentStatus(paymentTransactionId: number): Observable<PaymentStatusResponse> {
    return this.http.get<PaymentStatusResponse>(`${this.baseUrl}/school-payments/status/${paymentTransactionId}`);
  }

  // Payment History
  getSchoolPaymentHistory(schoolId: number, page: number = 1, limit: number = 20): Observable<{
    data: PaymentHistoryItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.http.get<{
      data: PaymentHistoryItem[];
      total: number;
      page: number;
      limit: number;
    }>(`${this.baseUrl}/school-bills/payment-history`, {
      params: {
        school_id: schoolId.toString(),
        page: page.toString(),
        limit: limit.toString()
      }
    });
  }
}

export interface PaymentHistoryItem {
  id: number;
  title: string;
  description: string;
  amount: number;
  transaction_date: string;
  payment_mode: string;
  mode_info: string;
  receipt_no: string;
  reference_no: string;
  finance_type: string;
  created_at: string;
}
