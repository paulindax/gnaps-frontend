import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { SettingsService } from '../../../core/services/settings.service';
import { AuthService } from '../../../core/services/auth.service';
import { Zone, Region } from '../../../core/models';
import { ButtonHelmComponent } from '../../../shared/ui/button-helm/button-helm.component';
import { DataTableComponent, TableColumn, TableAction, PaginationData } from '../../../shared/ui/data-table/data-table.component';
import { FormModalComponent } from '../../../shared/ui/form-modal/form-modal.component';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-zones',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, ButtonHelmComponent, DataTableComponent, FormModalComponent, ConfirmDialogComponent],
  templateUrl: './zones.component.html'
})
export class ZonesComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private authService = inject(AuthService);

  zones = signal<Zone[]>([]);
  regions = signal<Region[]>([]);
  loading = signal(false);
  showModal = signal(false);
  isEditing = signal(false);
  selectedZone = signal<Zone | null>(null);
  searchQuery = signal('');
  showDeleteDialog = signal(false);
  zoneToDelete = signal<Zone | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  totalPages = signal(0);

  formData = signal<{
    name: string;
    code: string;
    region_id: number | '';
  }>({
    name: '',
    code: '',
    region_id: ''
  });

  role = this.authService.userRole;

  canEdit = () => {
    const userRole = this.role();
    return userRole === 'system_admin' || userRole === 'national_admin' || userRole === 'regional_admin';
  };

  // Table configuration
  tableColumns: TableColumn<Zone>[] = [
    { header: 'Name', field: 'name' },
    { header: 'Code', field: 'code' },
    {
      header: 'Region',
      field: 'region_id',
      render: (zone) => this.getRegionName(zone.region_id)
    }
  ];

  tableActions: TableAction<Zone>[] = [
    {
      label: 'Edit',
      onClick: (zone) => this.openEditModal(zone),
      class: 'mr-2 text-primary hover:underline'
    },
    {
      label: 'Delete',
      onClick: (zone) => this.openDeleteDialog(zone),
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
    this.loadZones();
  }

  loadRegions(): void {
    this.settingsService.getRegions(1, 100).subscribe({
      next: (response) => {
        this.regions.set(response.data);
      },
      error: (error) => {
        console.error('Error loading regions:', error);
      }
    });
  }

  loadZones(): void {
    this.loading.set(true);
    this.settingsService.getZones(this.currentPage(), this.pageSize(), undefined, this.searchQuery()).subscribe({
      next: (response) => {
        this.zones.set(response.data);
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
        console.error('Error loading zones:', error);
        this.loading.set(false);
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadZones();
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1); // Reset to first page when searching
    this.loadZones();
  }

  getRegionName(regionId: number): string {
    const region = this.regions().find(r => r.id === regionId);
    return region?.name || 'Unknown';
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.formData.set({ name: '', code: '', region_id: '' });
    this.showModal.set(true);
  }

  openEditModal(zone: Zone): void {
    this.isEditing.set(true);
    this.selectedZone.set(zone);
    this.formData.set({
      name: zone.name,
      code: zone.code,
      region_id: zone.region_id
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedZone.set(null);
    this.formData.set({ name: '', code: '', region_id: '' });
  }

  onSubmit(): void {
    const data = this.formData();

    if (!data.name || !data.code || !data.region_id) {
      // Validation is now handled by the backend with flash messages
      return;
    }

    this.loading.set(true);

    // Ensure region_id is a number
    const submitData: Partial<Zone> = {
      name: data.name,
      code: data.code,
      region_id: typeof data.region_id === 'string' ? parseInt(data.region_id) : data.region_id
    };

    if (this.isEditing()) {
      const zone = this.selectedZone();
      if (zone) {
        this.settingsService.updateZone(zone.id, submitData).subscribe({
          next: () => {
            this.loadZones();
            this.closeModal();
          },
          error: (error) => {
            console.error('Error updating zone:', error);
            // Flash message is automatically shown by interceptor
            this.loading.set(false);
          }
        });
      }
    } else {
      this.settingsService.createZone(submitData).subscribe({
        next: () => {
          this.loadZones();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creating zone:', error);
          // Flash message is automatically shown by interceptor
          this.loading.set(false);
        }
      });
    }
  }

  openDeleteDialog(zone: Zone): void {
    this.zoneToDelete.set(zone);
    this.showDeleteDialog.set(true);
  }

  confirmDelete(): void {
    const zone = this.zoneToDelete();
    if (!zone) return;

    this.loading.set(true);
    this.settingsService.deleteZone(zone.id).subscribe({
      next: () => {
        this.loadZones();
        this.showDeleteDialog.set(false);
        this.zoneToDelete.set(null);
      },
      error: (error) => {
        console.error('Error deleting zone:', error);
        // Flash message is automatically shown by interceptor
        this.loading.set(false);
      }
    });
  }

  updateFormField(field: string, value: string): void {
    this.formData.update(data => ({ ...data, [field]: value }));
  }
}
