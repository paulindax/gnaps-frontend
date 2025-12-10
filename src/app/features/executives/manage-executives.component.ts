import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ExecutivesService, ExecutiveFormData } from '../../core/services/executives.service';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';
import { Executive, ExecutiveRole, Region, Zone, Position } from '../../core/models';

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  mobile_no: string;
  position_id: number | null;
  role: ExecutiveRole;
  region_id: number | null;
  zone_id: number | null;
  status: 'active' | 'inactive';
  bio: string;
}

@Component({
  selector: 'app-manage-executives',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './manage-executives.component.html'
})
export class ManageExecutivesComponent implements OnInit {
  private executivesService = inject(ExecutivesService);
  private settingsService = inject(SettingsService);
  private authService = inject(AuthService);

  protected readonly Math = Math;

  // Data signals
  executives = signal<Executive[]>([]);
  regions = signal<Region[]>([]);
  zones = signal<Zone[]>([]);
  filteredZones = signal<Zone[]>([]);
  positions = signal<Position[]>([]);

  // UI state signals
  loading = signal(false);
  showModal = signal(false);
  isEditing = signal(false);
  selectedExecutive = signal<Executive | null>(null);
  viewingExecutive = signal<Executive | null>(null);
  showDeleteDialog = signal(false);
  executiveToDelete = signal<Executive | null>(null);

  // Filter signals
  searchQuery = signal('');
  filterRole = signal<string | null>(null);
  filterRegion = signal<number | null>(null);
  filterZone = signal<number | null>(null);
  filterPosition = signal<number | null>(null);
  filterZonesForDropdown = signal<Zone[]>([]);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  totalPages = signal(0);

  // Form data
  formData = signal<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    mobile_no: '',
    position_id: null,
    role: 'national_admin',
    region_id: null,
    zone_id: null,
    status: 'active',
    bio: ''
  });

  role = this.authService.userRole;

  // Role options for dropdown
  roleOptions: { value: ExecutiveRole; label: string }[] = [
    { value: 'national_admin', label: 'National Admin' },
    { value: 'region_admin', label: 'Region Admin' },
    { value: 'zone_admin', label: 'Zonal Admin' }
  ];

  // Computed: check if user can edit
  canEdit = computed(() => {
    const userRole = this.role();
    return userRole === 'system_admin' || userRole === 'national_admin';
  });

  // Computed: check if user can see national admin stats
  canSeeNationalAdminStats = computed(() => {
    const userRole = this.role();
    return userRole === 'system_admin' || userRole === 'national_admin';
  });

  // Computed: check if user can see regional admin stats
  canSeeRegionalAdminStats = computed(() => {
    const userRole = this.role();
    return userRole === 'system_admin' || userRole === 'national_admin' || userRole === 'region_admin';
  });

  // Computed: check if user can see zonal admin stats (all admin roles can see this)
  canSeeZonalAdminStats = computed(() => {
    const userRole = this.role();
    return userRole === 'system_admin' || userRole === 'national_admin' || userRole === 'region_admin' || userRole === 'zone_admin';
  });

  // Computed: counts by role
  nationalAdminCount = computed(() =>
    this.executives().filter(e => e.role === 'national_admin').length
  );

  regionalAdminCount = computed(() =>
    this.executives().filter(e => e.role === 'region_admin').length
  );

  zonalAdminCount = computed(() =>
    this.executives().filter(e => e.role === 'zone_admin').length
  );

  // Computed: check if region field should show
  showRegionField = computed(() => {
    const formRole = this.formData().role;
    return formRole === 'region_admin' || formRole === 'zone_admin';
  });

  // Computed: check if zone field should show
  showZoneField = computed(() => {
    const formRole = this.formData().role;
    return formRole === 'zone_admin';
  });

  // Computed: form validation
  isFormValid = computed(() => {
    const data = this.formData();
    const basicValid = !!data.first_name && !!data.role;

    if (data.role === 'region_admin') {
      return basicValid && !!data.region_id;
    }
    if (data.role === 'zone_admin') {
      return basicValid && !!data.region_id && !!data.zone_id;
    }
    return basicValid;
  });

  ngOnInit(): void {
    this.loadExecutives();
    this.loadRegions();
    this.loadPositions();
  }

  loadExecutives(): void {
    this.loading.set(true);
    const search = this.searchQuery();
    const role = this.filterRole();
    const regionId = this.filterRegion();
    const zoneId = this.filterZone();
    const positionId = this.filterPosition();

    this.executivesService.getExecutives(
      this.currentPage(),
      this.pageSize(),
      search || undefined,
      role || undefined,
      regionId || undefined,
      zoneId || undefined,
      positionId || undefined
    ).subscribe({
      next: (response) => {
        this.executives.set(response.data);
        this.totalItems.set(response.pagination.total);
        this.totalPages.set(Math.ceil(response.pagination.total / response.pagination.limit));
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading executives:', error);
        this.loading.set(false);
      }
    });
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

  loadPositions(): void {
    this.settingsService.getPositions(1, 100).subscribe({
      next: (response) => {
        this.positions.set(response.data);
      },
      error: (error) => {
        console.error('Error loading positions:', error);
      }
    });
  }

  loadZonesByRegion(regionId: number): void {
    this.settingsService.getZonesByRegion(regionId).subscribe({
      next: (zones) => {
        this.filteredZones.set(zones);
      },
      error: (error) => {
        console.error('Error loading zones:', error);
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.viewingExecutive.set(null);
    this.loadExecutives();
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.viewingExecutive.set(null);
    this.loadExecutives();
  }

  onFilterRoleChange(role: string): void {
    this.filterRole.set(role);
    this.currentPage.set(1);
    this.viewingExecutive.set(null);
    this.loadExecutives();
  }

  onFilterRegionChange(regionId: number | null): void {
    this.filterRegion.set(regionId);
    this.filterZone.set(null); // Reset zone when region changes
    this.filterZonesForDropdown.set([]);
    this.currentPage.set(1);
    this.viewingExecutive.set(null);

    if (regionId) {
      this.loadFilterZones(regionId);
    }
    this.loadExecutives();
  }

  onFilterZoneChange(zoneId: number | null): void {
    this.filterZone.set(zoneId);
    this.currentPage.set(1);
    this.viewingExecutive.set(null);
    this.loadExecutives();
  }

  onFilterPositionChange(positionId: number | null): void {
    this.filterPosition.set(positionId);
    this.currentPage.set(1);
    this.viewingExecutive.set(null);
    this.loadExecutives();
  }

  loadFilterZones(regionId: number): void {
    this.settingsService.getZonesByRegion(regionId).subscribe({
      next: (zones) => {
        this.filterZonesForDropdown.set(zones);
      },
      error: (error) => {
        console.error('Error loading zones for filter:', error);
      }
    });
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.filterRole.set('');
    this.filterRegion.set(null);
    this.filterZone.set(null);
    this.filterPosition.set(null);
    this.filterZonesForDropdown.set([]);
    this.currentPage.set(1);
    this.viewingExecutive.set(null);
    this.loadExecutives();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery() || this.filterRole() || this.filterRegion() || this.filterZone() || this.filterPosition());
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.formData.set({
      first_name: '',
      last_name: '',
      email: '',
      mobile_no: '',
      position_id: null,
      role: 'national_admin',
      region_id: null,
      zone_id: null,
      status: 'active',
      bio: ''
    });
    this.filteredZones.set([]);
    this.showModal.set(true);
  }

  openEditModal(executive: Executive): void {
    this.isEditing.set(true);
    this.selectedExecutive.set(executive);
    this.formData.set({
      first_name: executive.first_name,
      last_name: executive.last_name,
      email: executive.email,
      mobile_no: executive.mobile_no || '',
      position_id: executive.position_id || null,
      role: executive.role,
      region_id: executive.region_id || null,
      zone_id: executive.zone_id || null,
      status: executive.status,
      bio: executive.bio || ''
    });

    // Load zones if region is set
    if (executive.region_id) {
      this.loadZonesByRegion(executive.region_id);
    }

    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedExecutive.set(null);
    this.filteredZones.set([]);
  }

  onRoleChange(role: ExecutiveRole): void {
    this.formData.update(data => ({
      ...data,
      role,
      // Reset dependent fields when role changes
      region_id: role === 'national_admin' ? null : data.region_id,
      zone_id: role !== 'zone_admin' ? null : data.zone_id
    }));
  }

  onRegionChange(regionId: number | null): void {
    this.formData.update(data => ({
      ...data,
      region_id: regionId,
      zone_id: null // Reset zone when region changes
    }));

    if (regionId) {
      this.loadZonesByRegion(regionId);
    } else {
      this.filteredZones.set([]);
    }
  }

  onSubmit(): void {
    const data = this.formData();

    if (!this.isFormValid()) {
      return;
    }

    this.loading.set(true);

    const submitData: ExecutiveFormData = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      mobile_no: data.mobile_no || undefined,
      position_id: data.position_id || undefined,
      role: data.role,
      region_id: data.region_id || undefined,
      zone_id: data.zone_id || undefined,
      status: data.status,
      bio: data.bio || undefined
    };

    if (this.isEditing()) {
      const executive = this.selectedExecutive();
      if (executive) {
        this.executivesService.updateExecutive(executive.id, submitData).subscribe({
          next: () => {
            this.loadExecutives();
            this.closeModal();
          },
          error: (error) => {
            console.error('Error updating executive:', error);
            this.loading.set(false);
          }
        });
      }
    } else {
      this.executivesService.createExecutive(submitData).subscribe({
        next: () => {
          this.loadExecutives();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creating executive:', error);
          this.loading.set(false);
        }
      });
    }
  }

  openDeleteDialog(executive: Executive): void {
    this.executiveToDelete.set(executive);
    this.showDeleteDialog.set(true);
  }

  confirmDelete(): void {
    const executive = this.executiveToDelete();
    if (!executive) return;

    this.loading.set(true);
    this.executivesService.deleteExecutive(executive.id).subscribe({
      next: () => {
        this.loadExecutives();
        this.showDeleteDialog.set(false);
        this.executiveToDelete.set(null);
      },
      error: (error) => {
        console.error('Error deleting executive:', error);
        this.loading.set(false);
      }
    });
  }

  updateFormField(field: string, value: any): void {
    this.formData.update(data => ({ ...data, [field]: value }));
  }

  getRoleBadgeClass(role: ExecutiveRole): string {
    switch (role) {
      case 'national_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'region_admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'zone_admin':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  }

  getRoleLabel(role: ExecutiveRole): string {
    switch (role) {
      case 'national_admin':
        return 'National Admin';
      case 'region_admin':
        return 'Region Admin';
      case 'zone_admin':
        return 'Zonal Admin';
      default:
        return role;
    }
  }

  getStatusBadgeClass(status: string): string {
    return status === 'active'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  }

  getInitials(executive: Executive): string {
    return `${executive.first_name?.[0] || ''}${executive.last_name?.[0] || ''}`.toUpperCase();
  }

  selectExecutive(executive: Executive): void {
    this.viewingExecutive.set(executive);
  }

  closeProfile(): void {
    this.viewingExecutive.set(null);
  }

  isSelected(executive: Executive): boolean {
    return this.viewingExecutive()?.id === executive.id;
  }
}
