import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';
import { AuthService } from '../../../core/services/auth.service';
import { Region } from '../../../core/models';
import { ButtonHelmComponent } from '../../../shared/ui/button-helm/button-helm.component';
import { DataTableComponent, TableColumn, TableAction, PaginationData } from '../../../shared/ui/data-table/data-table.component';
import { FormModalComponent } from '../../../shared/ui/form-modal/form-modal.component';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-regions',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonHelmComponent, DataTableComponent, FormModalComponent, ConfirmDialogComponent],
  templateUrl: './regions.component.html'
})
export class RegionsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private authService = inject(AuthService);

  regions = signal<Region[]>([]);
  loading = signal(false);
  showModal = signal(false);
  isEditing = signal(false);
  selectedRegion = signal<Region | null>(null);
  searchQuery = signal('');
  showDeleteDialog = signal(false);
  regionToDelete = signal<Region | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  totalPages = signal(0);

  formData = signal({
    name: '',
    code: ''
  });

  role = this.authService.userRole;

  canEdit = () => {
    const userRole = this.role();
    return userRole === 'system_admin' || userRole === 'national_admin';
  };

  // Table configuration
  tableColumns: TableColumn<Region>[] = [
    { header: 'Name', field: 'name' },
    { header: 'Code', field: 'code' },
    // {
    //   header: 'Created At',
    //   field: 'created_at',
    //   render: (item) => {
    //     if (!item.created_at) return '';
    //     return new Date(item.created_at).toLocaleDateString('en-US', {
    //       year: 'numeric',
    //       month: 'short',
    //       day: 'numeric'
    //     });
    //   }
    // }
  ];

  tableActions: TableAction<Region>[] = [
    {
      label: 'Edit',
      onClick: (region) => this.openEditModal(region),
      class: 'mr-2 text-primary hover:underline'
    },
    {
      label: 'Delete',
      onClick: (region) => this.openDeleteDialog(region),
      class: 'text-destructive hover:underline'
    }
  ];

  paginationData = signal<PaginationData>({
    currentPage: 1,
    totalPages: 0,
    pageSize: 10,
    totalItems: 0
  });

  ngOnInit(): void {
    this.loadRegions();
  }

  loadRegions(): void {
    this.loading.set(true);
    const searchQuery = this.searchQuery();
    console.log('[Regions] loadRegions called with:', {
      page: this.currentPage(),
      pageSize: this.pageSize(),
      search: searchQuery
    });
    this.settingsService.getRegions(this.currentPage(), this.pageSize(), searchQuery).subscribe({
      next: (response) => {
        console.log('[Regions] Received response:', response);
        this.regions.set(response.data);
        this.totalItems.set(response.pagination.total);
        this.totalPages.set(Math.ceil(response.pagination.total / response.pagination.limit));

        // Update pagination data
        this.paginationData.set({
          currentPage: this.currentPage(),
          totalPages: this.totalPages(),
          pageSize: this.pageSize(),
          totalItems: this.totalItems()
        });

        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading regions:', error);
        this.loading.set(false);
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadRegions();
  }

  onSearchChange(query: string): void {
    console.log('[Regions] Search query received:', query);
    this.searchQuery.set(query);
    this.currentPage.set(1); // Reset to first page when searching
    console.log('[Regions] Calling loadRegions with search:', this.searchQuery());
    this.loadRegions();
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.formData.set({ name: '', code: '' });
    this.showModal.set(true);
  }

  openEditModal(region: Region): void {
    this.isEditing.set(true);
    this.selectedRegion.set(region);
    this.formData.set({
      name: region.name,
      code: region.code
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedRegion.set(null);
    this.formData.set({ name: '', code: '' });
  }

  onSubmit(): void {
    const data = this.formData();

    if (!data.name || !data.code) {
      // Validation is now handled by the backend with flash messages
      return;
    }

    this.loading.set(true);

    if (this.isEditing()) {
      const region = this.selectedRegion();
      if (region) {
        this.settingsService.updateRegion(region.id, data).subscribe({
          next: () => {
            this.loadRegions();
            this.closeModal();
          },
          error: (error) => {
            console.error('Error updating region:', error);
            // Flash message is automatically shown by interceptor
            this.loading.set(false);
          }
        });
      }
    } else {
      this.settingsService.createRegion(data).subscribe({
        next: () => {
          this.loadRegions();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creating region:', error);
          // Flash message is automatically shown by interceptor
          this.loading.set(false);
        }
      });
    }
  }

  openDeleteDialog(region: Region): void {
    this.regionToDelete.set(region);
    this.showDeleteDialog.set(true);
  }

  confirmDelete(): void {
    const region = this.regionToDelete();
    if (!region) return;

    this.loading.set(true);
    this.settingsService.deleteRegion(region.id).subscribe({
      next: () => {
        this.loadRegions();
        this.showDeleteDialog.set(false);
        this.regionToDelete.set(null);
      },
      error: (error) => {
        console.error('Error deleting region:', error);
        // Flash message is automatically shown by interceptor
        this.loading.set(false);
      }
    });
  }

  updateFormField(field: string, value: string): void {
    this.formData.update(data => ({ ...data, [field]: value }));
  }
}
