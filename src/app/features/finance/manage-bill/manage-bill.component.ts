import { Component, OnInit, signal, inject, computed } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../../core/services/finance.service';
import { AuthService } from '../../../core/services/auth.service';
import { Bill } from '../../../core/models';
import { BillItemsComponent } from '../bill-items/bill-items.component';
import { DropdownMenuComponent, DropdownMenuItem } from '../../../shared/components/dropdown-menu/dropdown-menu.component';

@Component({
  selector: 'app-manage-bill',
  standalone: true,
  imports: [FormsModule, BillItemsComponent, DropdownMenuComponent],
  templateUrl: './manage-bill.component.html'
})
export class ManageBillComponent implements OnInit {
  private financeService = inject(FinanceService);
  private authService = inject(AuthService);

  // Expose Math for template
  protected readonly Math = Math;

  // View management
  currentView = signal<'list' | 'items'>('list');
  billForItems = signal<Bill | null>(null);

  bills = signal<Bill[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  search = signal('');
  searchQuery = signal('');
  loading = signal(false);
  showModal = signal(false);
  showDeleteConfirm = signal(false);
  selectedBill = signal<Bill | null>(null);
  billToDelete = signal<Bill | null>(null);
  openDropdownId = signal<number | null>(null);
  dropdownTrigger = signal<HTMLElement | undefined>(undefined);

  // Use a regular object for form data to work with ngModel
  formData: Partial<Bill> = {
    name: '',
    description: ''
  };

  canEdit = computed(() => {
    const user = this.authService.currentUserSignal();
    return user && ['system_admin', 'national_admin'].includes(user.role);
  });

  totalPages = computed(() => Math.ceil(this.total() / this.limit()));

  ngOnInit(): void {
    this.loadBills();
  }

  loadBills(): void {
    this.loading.set(true);
    this.financeService.getBills(this.page(), this.limit(), this.search())
      .subscribe({
        next: (response) => {
          this.bills.set(response.data || []);
          this.total.set(response.pagination?.total || 0);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading bills:', error);
          this.loading.set(false);
        }
      });
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.search.set(query);
    this.page.set(1);
    this.loadBills();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.loadBills();
  }

  openCreateModal(): void {
    this.selectedBill.set(null);
    this.formData = {
      name: '',
      description: ''
    };
    this.showModal.set(true);
  }

  openEditModal(bill: Bill): void {
    this.selectedBill.set(bill);
    this.formData = { ...bill };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedBill.set(null);
  }

  saveBill(): void {
    if (!this.formData.name) {
      return;
    }

    this.loading.set(true);
    const request = this.selectedBill()
      ? this.financeService.updateBill(this.selectedBill()!.id, this.formData)
      : this.financeService.createBill(this.formData);

    request.subscribe({
      next: () => {
        this.closeModal();
        this.loadBills();
      },
      error: (error) => {
        console.error('Error saving bill:', error);
        this.loading.set(false);
      }
    });
  }

  confirmDelete(bill: Bill): void {
    this.billToDelete.set(bill);
    this.showDeleteConfirm.set(true);
  }

  deleteBill(): void {
    const bill = this.billToDelete();
    if (!bill) return;

    this.loading.set(true);
    this.financeService.deleteBill(bill.id).subscribe({
      next: () => {
        this.showDeleteConfirm.set(false);
        this.billToDelete.set(null);
        this.loadBills();
      },
      error: (error) => {
        console.error('Error deleting bill:', error);
        this.loading.set(false);
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.billToDelete.set(null);
  }

  viewItems(bill: Bill): void {
    this.billForItems.set(bill);
    this.currentView.set('items');
  }

  backToBillsList(): void {
    this.currentView.set('list');
    this.billForItems.set(null);
  }

  toggleDropdown(billId: number, event: Event): void {
    if (this.openDropdownId() === billId) {
      this.openDropdownId.set(null);
      this.dropdownTrigger.set(undefined);
    } else {
      this.openDropdownId.set(billId);
      this.dropdownTrigger.set(event.currentTarget as HTMLElement);
    }
  }

  closeDropdown(): void {
    this.openDropdownId.set(null);
    this.dropdownTrigger.set(undefined);
  }

  getMenuItems(bill: Bill): DropdownMenuItem[] {
    return [
      {
        label: 'Edit',
        icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
        action: 'edit'
      },
      {
        label: 'Delete',
        icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
        action: 'delete',
        variant: 'destructive'
      },
      {
        label: 'Manage Items',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
        action: 'manage-items',
        dividerBefore: true
      },
      {
        label: 'Bill Structure',
        icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
        action: 'bill-structure'
      },
      {
        label: 'Generate Bills',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        action: 'generate-bills'
      },
      {
        label: 'Approve Bill',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        action: 'approve',
        variant: 'success',
        dividerBefore: true,
        show: !bill.is_approved
      }
    ];
  }

  handleDropdownAction(action: string, bill: Bill): void {
    switch (action) {
      case 'edit':
        this.openEditModal(bill);
        break;
      case 'delete':
        this.confirmDelete(bill);
        break;
      case 'manage-items':
        this.viewItems(bill);
        break;
      case 'manage-discounts':
        this.manageDiscounts(bill);
        break;
      case 'bill-structure':
        this.viewBillStructure(bill);
        break;
      case 'generate-bills':
        this.generateBills(bill);
        break;
      case 'approve':
        this.approveBill(bill);
        break;
    }
  }

  manageDiscounts(bill: Bill): void {
    console.log('Manage discounts for bill:', bill);
    // TODO: Implement discounts management
  }

  viewBillStructure(bill: Bill): void {
    console.log('View bill structure:', bill);
    // TODO: Implement bill structure view
  }

  generateBills(bill: Bill): void {
    console.log('Generate bills for:', bill);
    // TODO: Implement bill generation
  }

  approveBill(bill: Bill): void {
    console.log('Approve bill:', bill);
    // TODO: Implement bill approval
  }
}
