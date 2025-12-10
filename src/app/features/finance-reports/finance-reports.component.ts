import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { AuthService } from '../../core/services/auth.service';
import { FinanceReportsService, MomoPaymentFilters, FinanceTransactionFilters, PaginatedResponse } from '../../core/services/finance-reports.service';
import { MomoPayment, FinanceTransaction } from '../../core/models';
import { DataExportComponent, ExportConfig } from '../../shared/ui/data-export/data-export.component';

interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-finance-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, DatePipe, DataExportComponent],
  templateUrl: './finance-reports.component.html'
})
export class FinanceReportsComponent implements OnInit {
  private authService = inject(AuthService);
  private financeReportsService = inject(FinanceReportsService);

  activeTab = signal<'momo' | 'transactions'>('momo');

  // Momo Payments State
  momoPayments = signal<MomoPayment[]>([]);
  momoLoading = signal(false);
  momoTotal = signal(0);
  momoPage = signal(1);
  momoLimit = signal(20);
  momoFilters = signal<MomoPaymentFilters>({});
  momoStats = signal<{ total: number; successful: number; pending: number; failed: number; total_amount: number } | null>(null);

  // Finance Transactions State
  financeTransactions = signal<FinanceTransaction[]>([]);
  transactionsLoading = signal(false);
  transactionsTotal = signal(0);
  transactionsPage = signal(1);
  transactionsLimit = signal(20);
  transactionsFilters = signal<FinanceTransactionFilters>({});
  transactionsStats = signal<{ total: number; total_income: number; total_expense: number } | null>(null);

  // Filter inputs
  momoStatusFilter: string | null = null;
  momoNetworkFilter: string | null = null;
  momoFromDate = '';
  momoToDate = '';

  transactionsFromDate = '';
  transactionsToDate = '';
  transactionsTypeFilter: string | null = null;

  // Select options
  statusOptions: SelectOption[] = [
    { value: 'success', label: 'Successful' },
    { value: 'pending', label: 'Pending' },
    { value: 'created', label: 'Created' },
    { value: 'failed', label: 'Failed' }
  ];

  networkOptions: SelectOption[] = [
    { value: 'MTN', label: 'MTN' },
    { value: 'TELECEL', label: 'Telecel' },
    { value: 'AIRTELTIGO', label: 'AirtelTigo' }
  ];

  transactionTypeOptions: SelectOption[] = [
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' }
  ];

  canViewReports = computed(() => {
    const user = this.authService.currentUserSignal();
    return user && ['system_admin', 'national_admin', 'region_admin', 'zone_admin'].includes(user.role);
  });

  momoTotalPages = computed(() => Math.ceil(this.momoTotal() / this.momoLimit()));
  transactionsTotalPages = computed(() => Math.ceil(this.transactionsTotal() / this.transactionsLimit()));

  // Export configurations
  momoExportConfig = computed<ExportConfig>(() => ({
    title: 'MoMo Payments Report',
    filename: 'momo-payments',
    summaryLine: this.momoStats()
      ? `Total Payments: ${this.momoStats()?.total || 0} | Successful: ${this.momoStats()?.successful || 0} | Total Amount: ${this.formatCurrency(this.momoStats()?.total_amount)}`
      : undefined,
    columns: [
      { key: 'id', header: 'ID', formatter: (val) => `#${val}` },
      { key: 'school_name', header: 'School' },
      { key: 'fee_name', header: 'Fee Name' },
      { key: 'amount', header: 'Amount', formatter: (val) => this.formatCurrency(val) },
      { key: 'momo_network', header: 'Network' },
      { key: 'momo_number', header: 'Phone' },
      { key: 'status', header: 'Status' },
      { key: 'created_at', header: 'Date', formatter: (val) => this.formatDate(val) }
    ]
  }));

  transactionsExportConfig = computed<ExportConfig>(() => ({
    title: 'Finance Transactions Report',
    filename: 'finance-transactions',
    summaryLine: this.transactionsStats()
      ? `Total: ${this.transactionsStats()?.total || 0} | Income: ${this.formatCurrency(this.transactionsStats()?.total_income)} | Expense: ${this.formatCurrency(this.transactionsStats()?.total_expense)}`
      : undefined,
    columns: [
      { key: 'id', header: 'ID', formatter: (val) => `#${val}` },
      { key: 'title', header: 'Title' },
      { key: 'school_name', header: 'School' },
      { key: 'finance_account_name', header: 'Account' },
      { key: 'amount', header: 'Amount', formatter: (val) => this.formatCurrency(val) },
      { key: 'receipt_voucher', header: 'Receipt/Voucher', formatter: (_, row) => row.receipt_no || row.voucher_no || 'N/A' },
      { key: 'payment_mode', header: 'Payment Mode' },
      { key: 'transaction_date', header: 'Date', formatter: (val) => this.formatDate(val) }
    ]
  }));

  ngOnInit(): void {
    if (this.canViewReports()) {
      this.loadMomoPayments();
      this.loadMomoStats();
    }
  }

  setActiveTab(tab: 'momo' | 'transactions'): void {
    this.activeTab.set(tab);
    if (tab === 'momo' && this.momoPayments().length === 0) {
      this.loadMomoPayments();
      this.loadMomoStats();
    } else if (tab === 'transactions' && this.financeTransactions().length === 0) {
      this.loadFinanceTransactions();
      this.loadTransactionsStats();
    }
  }

  loadMomoPayments(): void {
    this.momoLoading.set(true);
    const filters: MomoPaymentFilters = {
      ...this.momoFilters(),
      page: this.momoPage(),
      limit: this.momoLimit()
    };

    this.financeReportsService.getMomoPayments(filters).subscribe({
      next: (response) => {
        this.momoPayments.set(response.data || []);
        this.momoTotal.set(response.total || 0);
        this.momoLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading momo payments:', error);
        this.momoLoading.set(false);
      }
    });
  }

  loadMomoStats(): void {
    this.financeReportsService.getMomoPaymentStats().subscribe({
      next: (stats) => this.momoStats.set(stats),
      error: (error) => console.error('Error loading momo stats:', error)
    });
  }

  loadFinanceTransactions(): void {
    this.transactionsLoading.set(true);
    const filters: FinanceTransactionFilters = {
      ...this.transactionsFilters(),
      page: this.transactionsPage(),
      limit: this.transactionsLimit()
    };

    this.financeReportsService.getFinanceTransactions(filters).subscribe({
      next: (response) => {
        this.financeTransactions.set(response.data || []);
        this.transactionsTotal.set(response.total || 0);
        this.transactionsLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading finance transactions:', error);
        this.transactionsLoading.set(false);
      }
    });
  }

  loadTransactionsStats(): void {
    this.financeReportsService.getFinanceTransactionStats().subscribe({
      next: (stats) => this.transactionsStats.set(stats),
      error: (error) => console.error('Error loading transactions stats:', error)
    });
  }

  applyMomoFilters(): void {
    const filters: MomoPaymentFilters = {};
    if (this.momoStatusFilter) filters.status = this.momoStatusFilter;
    if (this.momoNetworkFilter) filters.momo_network = this.momoNetworkFilter;
    if (this.momoFromDate) filters.from_date = this.momoFromDate;
    if (this.momoToDate) filters.to_date = this.momoToDate;

    this.momoFilters.set(filters);
    this.momoPage.set(1);
    this.loadMomoPayments();
  }

  clearMomoFilters(): void {
    this.momoStatusFilter = null;
    this.momoNetworkFilter = null;
    this.momoFromDate = '';
    this.momoToDate = '';
    this.momoFilters.set({});
    this.momoPage.set(1);
    this.loadMomoPayments();
  }

  applyTransactionsFilters(): void {
    const filters: FinanceTransactionFilters = {};
    if (this.transactionsTypeFilter) filters.finance_type = this.transactionsTypeFilter;
    if (this.transactionsFromDate) filters.from_date = this.transactionsFromDate;
    if (this.transactionsToDate) filters.to_date = this.transactionsToDate;

    this.transactionsFilters.set(filters);
    this.transactionsPage.set(1);
    this.loadFinanceTransactions();
  }

  clearTransactionsFilters(): void {
    this.transactionsFromDate = '';
    this.transactionsToDate = '';
    this.transactionsTypeFilter = null;
    this.transactionsFilters.set({});
    this.transactionsPage.set(1);
    this.loadFinanceTransactions();
  }

  goToMomoPage(page: number): void {
    if (page >= 1 && page <= this.momoTotalPages()) {
      this.momoPage.set(page);
      this.loadMomoPayments();
    }
  }

  goToTransactionsPage(page: number): void {
    if (page >= 1 && page <= this.transactionsTotalPages()) {
      this.transactionsPage.set(page);
      this.loadFinanceTransactions();
    }
  }

  getStatusBadgeClass(status: string | undefined): string {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (status?.toLowerCase()) {
      case 'success':
      case 'successful':
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case 'pending':
      case 'created':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`;
      case 'failed':
      case 'error':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400`;
    }
  }

  getNetworkBadgeClass(network: string | undefined): string {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (network?.toLowerCase()) {
      case 'mtn':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`;
      case 'telecel':
      case 'vodafone':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      case 'airteltigo':
      case 'at':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400`;
    }
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return 'GHS 0.00';
    return `GHS ${amount.toFixed(2)}`;
  }

  private formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
