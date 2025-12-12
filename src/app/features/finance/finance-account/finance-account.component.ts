import { Component, OnInit, signal, inject, computed } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FinanceService } from '../../../core/services/finance.service';
import { AuthService } from '../../../core/services/auth.service';
import { FinanceAccount } from '../../../core/models';

@Component({
  selector: 'app-finance-account',
  standalone: true,
  imports: [FormsModule, NgSelectModule],
  templateUrl: './finance-account.component.html'
})
export class FinanceAccountComponent implements OnInit {
  private financeService = inject(FinanceService);
  private authService = inject(AuthService);

  // Expose Math for template
  protected readonly Math = Math;

  accounts = signal<FinanceAccount[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  search = signal('');
  searchQuery = signal('');
  loading = signal(false);
  showModal = signal(false);
  showDeleteConfirm = signal(false);
  selectedAccount = signal<FinanceAccount | null>(null);
  accountToDelete = signal<FinanceAccount | null>(null);

  // Use a regular object for form data to work with ngModel
  formData: Partial<FinanceAccount> = {
    name: '',
    code: '',
    description: '',
    account_type: 'cash',
    is_income: false
  };

  // Account type options for ng-select
  accountTypes = [
    { value: 'revenue', label: 'Revenue' },
    { value: 'expense', label: 'Expenditure' },
    { value: 'current_assets', label: 'Current Assets' },
    { value: 'non_current_assets', label: 'Non-Current Assets' },
    { value: 'current_liabilities', label: 'Current Liabilities' },
    { value: 'non_current_liabilities', label: 'Non-Current Liabilities' },
    { value: 'equity', label: 'Equity' },
    { value: 'cash', label: 'Cash' }
  ];

  canEdit = computed(() => {
    const user = this.authService.currentUserSignal();
    return user && ['system_admin', 'national_admin'].includes(user.role);
  });

  totalPages = computed(() => Math.ceil(this.total() / this.limit()));

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading.set(true);
    this.financeService.getFinanceAccounts(this.page(), this.limit(), this.search())
      .subscribe({
        next: (response) => {
          this.accounts.set(response.data || []);
          this.total.set(response.pagination?.total || 0);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading finance accounts:', error);
          this.loading.set(false);
        }
      });
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.search.set(query);
    this.page.set(1);
    this.loadAccounts();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.loadAccounts();
  }

  openCreateModal(): void {
    this.selectedAccount.set(null);
    this.formData = {
      name: '',
      code: '',
      description: '',
      account_type: 'cash',
      is_income: false
    };
    this.showModal.set(true);
  }

  openEditModal(account: FinanceAccount): void {
    this.selectedAccount.set(account);
    this.formData = { ...account };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedAccount.set(null);
  }

  saveAccount(): void {
    if (!this.formData.name || !this.formData.code) {
      return;
    }

    this.loading.set(true);
    const request = this.selectedAccount()
      ? this.financeService.updateFinanceAccount(this.selectedAccount()!.id, this.formData)
      : this.financeService.createFinanceAccount(this.formData);

    request.subscribe({
      next: () => {
        this.closeModal();
        this.loadAccounts();
      },
      error: (error) => {
        console.error('Error saving finance account:', error);
        this.loading.set(false);
      }
    });
  }

  confirmDelete(account: FinanceAccount): void {
    this.accountToDelete.set(account);
    this.showDeleteConfirm.set(true);
  }

  deleteAccount(): void {
    const account = this.accountToDelete();
    if (!account) return;

    this.loading.set(true);
    this.financeService.deleteFinanceAccount(account.id).subscribe({
      next: () => {
        this.showDeleteConfirm.set(false);
        this.accountToDelete.set(null);
        this.loadAccounts();
      },
      error: (error) => {
        console.error('Error deleting finance account:', error);
        this.loading.set(false);
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.accountToDelete.set(null);
  }
}
