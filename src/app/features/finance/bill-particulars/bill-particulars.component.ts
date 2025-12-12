import { Component, OnInit, signal, inject, computed } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FinanceService } from '../../../core/services/finance.service';
import { AuthService } from '../../../core/services/auth.service';
import { BillParticular, FinanceAccount } from '../../../core/models';

@Component({
  selector: 'app-bill-particulars',
  standalone: true,
  imports: [FormsModule, NgSelectModule],
  templateUrl: './bill-particulars.component.html'
})
export class BillParticularsComponent implements OnInit {
  private financeService = inject(FinanceService);
  private authService = inject(AuthService);

  // Expose Math for template
  protected readonly Math = Math;

  particulars = signal<BillParticular[]>([]);
  financeAccounts = signal<FinanceAccount[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  search = signal(''); 
  searchQuery = signal('');
  loading = signal(false);
  showModal = signal(false);
  showDeleteConfirm = signal(false);
  selectedParticular = signal<BillParticular | null>(null);
  particularToDelete = signal<BillParticular | null>(null);

  // Use a regular object for form data to work with ngModel
  formData: Partial<BillParticular> = {
    name: '',
    finance_account_id: undefined,
    priority: undefined,
    is_arrears: false
  };

  canEdit = computed(() => {
    const user = this.authService.currentUserSignal();
    return user && ['system_admin', 'national_admin'].includes(user.role);
  });

  totalPages = computed(() => Math.ceil(this.total() / this.limit()));

  ngOnInit(): void {
    this.loadParticulars();
    this.loadFinanceAccounts();
  }

  loadParticulars(): void {
    this.loading.set(true);
    this.financeService.getBillParticulars(this.page(), this.limit(), this.search())
      .subscribe({
        next: (response) => {
          this.particulars.set(response.data || []);
          this.total.set(response.pagination?.total || 0);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading bill particulars:', error);
          this.loading.set(false);
        }
      });
  }

  loadFinanceAccounts(): void {
    this.financeService.getFinanceAccounts(1, 1000, '').subscribe({
      next: (response) => {
        this.financeAccounts.set(response.data || []);
      },
      error: (error) => {
        console.error('Error loading finance accounts:', error);
      }
    });
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.search.set(query);
    this.page.set(1);
    this.loadParticulars();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.loadParticulars();
  }

  openCreateModal(): void {
    this.selectedParticular.set(null);
    this.formData = {
      name: '',
      finance_account_id: undefined,
      priority: undefined,
      is_arrears: false
    };
    this.showModal.set(true);
  }

  openEditModal(particular: BillParticular): void {
    this.selectedParticular.set(particular);
    this.formData = { ...particular };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedParticular.set(null);
  }

  saveParticular(): void {
    if (!this.formData.name) {
      return;
    }

    this.loading.set(true);
    const request = this.selectedParticular()
      ? this.financeService.updateBillParticular(this.selectedParticular()!.id, this.formData)
      : this.financeService.createBillParticular(this.formData);

    request.subscribe({
      next: () => {
        this.closeModal();
        this.loadParticulars();
      },
      error: (error) => {
        console.error('Error saving bill particular:', error);
        this.loading.set(false);
      }
    });
  }

  confirmDelete(particular: BillParticular): void {
    this.particularToDelete.set(particular);
    this.showDeleteConfirm.set(true);
  }

  deleteParticular(): void {
    const particular = this.particularToDelete();
    if (!particular) return;

    this.loading.set(true);
    this.financeService.deleteBillParticular(particular.id).subscribe({
      next: () => {
        this.showDeleteConfirm.set(false);
        this.particularToDelete.set(null);
        this.loadParticulars();
      },
      error: (error) => {
        console.error('Error deleting bill particular:', error);
        this.loading.set(false);
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.particularToDelete.set(null);
  }

  getFinanceAccountName(id?: number): string {
    if (!id) return '-';
    const account = this.financeAccounts().find(a => a.id === id);
    return account ? account.name : '-';
  }
}
