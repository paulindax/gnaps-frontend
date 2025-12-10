import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { MomoPayment, FinanceTransaction } from '../models';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface MomoPaymentFilters {
  status?: string;
  school_id?: number;
  momo_network?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

export interface FinanceTransactionFilters {
  school_id?: number;
  finance_account_id?: number;
  finance_type?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class FinanceReportsService {
  private readonly api = inject(ApiService);

  getMomoPayments(filters: MomoPaymentFilters = {}): Observable<PaginatedResponse<MomoPayment>> {
    const params: Record<string, string> = {};

    if (filters.status) params['status'] = filters.status;
    if (filters.school_id) params['school_id'] = filters.school_id.toString();
    if (filters.momo_network) params['momo_network'] = filters.momo_network;
    if (filters.from_date) params['from_date'] = filters.from_date;
    if (filters.to_date) params['to_date'] = filters.to_date;
    params['page'] = (filters.page || 1).toString();
    params['limit'] = (filters.limit || 20).toString();

    console.log('getMomoPayments filters:', filters);
    console.log('getMomoPayments params:', params);

    return this.api.get<PaginatedResponse<MomoPayment>>('/finance-reports/momo-payments', { params });
  }

  getFinanceTransactions(filters: FinanceTransactionFilters = {}): Observable<PaginatedResponse<FinanceTransaction>> {
    const params: Record<string, string> = {};

    if (filters.school_id) params['school_id'] = filters.school_id.toString();
    if (filters.finance_account_id) params['finance_account_id'] = filters.finance_account_id.toString();
    if (filters.finance_type) params['finance_type'] = filters.finance_type;
    if (filters.from_date) params['from_date'] = filters.from_date;
    if (filters.to_date) params['to_date'] = filters.to_date;
    params['page'] = (filters.page || 1).toString();
    params['limit'] = (filters.limit || 20).toString();

    console.log('getFinanceTransactions filters:', filters);
    console.log('getFinanceTransactions params:', params);

    return this.api.get<PaginatedResponse<FinanceTransaction>>('/finance-reports/transactions', { params });
  }

  getMomoPaymentStats(): Observable<{ total: number; successful: number; pending: number; failed: number; total_amount: number }> {
    return this.api.get('/finance-reports/momo-payments-stats');
  }

  getFinanceTransactionStats(): Observable<{ total: number; total_income: number; total_expense: number }> {
    return this.api.get('/finance-reports/transactions-stats');
  }

  exportMomoPayments(filters: MomoPaymentFilters = {}): Observable<Blob> {
    const params: Record<string, string | number> = {};
    if (filters.status) params['status'] = filters.status;
    if (filters.from_date) params['from_date'] = filters.from_date;
    if (filters.to_date) params['to_date'] = filters.to_date;

    return this.api.get<Blob>('/finance-reports/momo-payments/export', {
      params,
      headers: { 'Accept': 'text/csv' }
    });
  }

  exportFinanceTransactions(filters: FinanceTransactionFilters = {}): Observable<Blob> {
    const params: Record<string, string | number> = {};
    if (filters.from_date) params['from_date'] = filters.from_date;
    if (filters.to_date) params['to_date'] = filters.to_date;

    return this.api.get<Blob>('/finance-reports/transactions/export', {
      params,
      headers: { 'Accept': 'text/csv' }
    });
  }
}
