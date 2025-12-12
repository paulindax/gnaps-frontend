import { Component, OnInit, Input, signal, inject, computed } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { FinanceService } from '../../../core/services/finance.service';
import { RegionService } from '../../../core/services/region.service';
import { ZoneService } from '../../../core/services/zone.service';
import { GroupService } from '../../../core/services/group.service';
import { SchoolService } from '../../../core/services/school.service';
import { AuthService } from '../../../core/services/auth.service';
import { Bill, BillItem, BillParticular, BillAssignment, Region, Zone, Group, School } from '../../../core/models';

@Component({
  selector: 'app-bill-items',
  standalone: true,
  imports: [FormsModule, NgSelectModule],
  templateUrl: './bill-items.component.html'
})
export class BillItemsComponent implements OnInit {
  // Inputs for embedded usage
  @Input() billId?: number;
  @Input() onBack?: () => void;

  private financeService = inject(FinanceService);
  private regionService = inject(RegionService);
  private zoneService = inject(ZoneService);
  private groupService = inject(GroupService);
  private schoolService = inject(SchoolService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Expose Math for template
  protected readonly Math = Math;

  billIdSignal = signal<number>(0);
  bill = signal<Bill | null>(null);
  billItems = signal<BillItem[]>([]);
  billParticulars = signal<BillParticular[]>([]);
  total = signal(0);
  page = signal(1);
  limit = signal(10);
  search = signal('');
  searchQuery = signal('');
  loading = signal(false);
  showModal = signal(false);
  showDeleteConfirm = signal(false);
  showAssignmentModal = signal(false);
  selectedItem = signal<BillItem | null>(null);
  itemToDelete = signal<BillItem | null>(null);

  // Assignment data
  regions = signal<Region[]>([]);
  zones = signal<Zone[]>([]);
  groups = signal<Group[]>([]);
  schools = signal<School[]>([]);
  currentAssignments = signal<BillAssignment[]>([]);

  // Use a regular object for form data to work with ngModel
  formData: Partial<BillItem> = {
    bill_particular_id: undefined,
    amount: 0
  };

  assignmentData = {
    selectedRegions: [] as number[],
    selectedZones: [] as number[],
    selectedGroups: [] as number[],
    selectedSchools: [] as number[]
  };

  canEdit = computed(() => {
    const user = this.authService.currentUserSignal();
    return user && ['system_admin', 'national_admin'].includes(user.role);
  });

  totalPages = computed(() => Math.ceil(this.total() / this.limit()));

  calculateTotal(): string {
    const total = this.billItems().reduce((sum, item) => sum + (item.amount || 0), 0);
    return total.toFixed(2);
  }

  getAssignmentText(item: BillItem): string {
    const lines: string[] = [];

    // Priority 1: If school IDs exist, show school names
    if (item.school_ids && item.school_ids.length > 0) {
      const schoolNames = item.school_ids
        .map(id => this.schools().find(s => s.id === id)?.name).filter(name => name) as string[];

      if (schoolNames.length > 0) {
        return schoolNames.join('\n');
      } else {
        return `Deleted School`;
      }
    }

    // Priority 2: If school group IDs exist, show group names with headings
    if (item.school_group_ids && item.school_group_ids.length > 0) {
      const groupNames = item.school_group_ids
        .map(id => this.groups().find(g => g.id === id)?.name)
        .filter(name => name) as string[];

      if (groupNames.length > 0) {
        lines.push('Groups:');
        lines.push(...groupNames);
      } else {
        lines.push('Deleted Group');
      }

      // Check and add regions if any
      if (item.region_ids && item.region_ids.length > 0) {
        const regionNames = item.region_ids
          .map(id => this.regions().find(r => r.id === id)?.name)
          .filter(name => name) as string[];

        if (regionNames.length > 0) {
          lines.push('Regions:');
          lines.push(...regionNames);
        } else {
          lines.push('Deleted Region');
        }
      }

      // Check and add zones if any
      if (item.zone_ids && item.zone_ids.length > 0) {
        const zoneNames = item.zone_ids
          .map(id => this.zones().find(z => z.id === id)?.name)
          .filter(name => name) as string[];

        if (zoneNames.length > 0) {
          lines.push('Zones:');
          lines.push(...zoneNames);
        } else {
          lines.push('Deleted Zone');
        }
      }

      if (lines.length > 0) {
        return lines.join('\n');
      }
    }

    // Priority 3: If zone IDs exist, show zone names
    if (item.zone_ids && item.zone_ids.length > 0) {
      const zoneNames = item.zone_ids
        .map(id => this.zones().find(z => z.id === id)?.name)
        .filter(name => name) as string[];

      if (zoneNames.length > 0) {
        return zoneNames.join('\n');
      } else {
        return `Deleted Zone`;
      }
    }

    // Priority 4: If region IDs exist, show region names
    if (item.region_ids && item.region_ids.length > 0) {
      const regionNames = item.region_ids
        .map(id => this.regions().find(r => r.id === id)?.name)
        .filter(name => name) as string[];

      if (regionNames.length > 0) {
        return regionNames.join('\n');
      } else {
        return `Deleted Region`;
      }
    }

    // Priority 5: Default if nothing assigned
    return 'Assigned to all Schools';
  }

  ngOnInit(): void {
    // Use input billId if provided (embedded usage), otherwise get from route
    if (this.billId) {
      this.billIdSignal.set(this.billId);
      this.loadBill();
      this.loadBillItems();
      this.loadBillParticulars();
      this.loadEntities();
    } else {
      this.route.params.subscribe(params => {
        const id = +params['id'];
        if (id) {
          this.billIdSignal.set(id);
          this.loadBill();
          this.loadBillItems();
          this.loadBillParticulars();
          this.loadEntities();
        }
      });
    }
  }

  loadBill(): void {
    this.financeService.getBill(this.billIdSignal()).subscribe({
      next: (response: any) => {
        this.bill.set(response.data);
      },
      error: (error) => {
        console.error('Error loading bill:', error);
      }
    });
  }

  loadBillItems(): void {
    this.loading.set(true);
    this.financeService.getBillItems(this.billIdSignal(), this.page(), this.limit(), this.search()).subscribe({
      next: (response) => {
        this.billItems.set(response.data || []);
        this.total.set(response.pagination?.total || 0);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading bill items:', error);
        this.loading.set(false);
      }
    });
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.search.set(query);
    this.page.set(1);
    this.loadBillItems();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.loadBillItems();
  }

  loadBillParticulars(): void {
    this.financeService.getBillParticulars(1, 1000, '').subscribe({
      next: (response) => {
        this.billParticulars.set(response.data || []);
      },
      error: (error) => {
        console.error('Error loading bill particulars:', error);
      }
    });
  }

  loadEntities(): void {
    // Load regions
    this.regionService.getRegions({ page: 1, limit: 1000 }).subscribe({
      next: (response) => {
        this.regions.set(response.data || []);
      }
    });

    // Load zones
    this.zoneService.getZones({ page: 1, limit: 1000 }).subscribe({
      next: (response) => {
        this.zones.set(response.data || []);
      }
    });

    // Load groups
    this.groupService.getGroups({ page: 1, limit: 1000 }).subscribe({
      next: (response) => {
        this.groups.set(response.data || []);
      }
    });

    // Load schools
    this.schoolService.getSchools({ page: 1, limit: 10000 }).subscribe({
      next: (response) => {
        this.schools.set(response.data || []);
      }
    });
  }

  openCreateModal(): void {
    this.selectedItem.set(null);
    this.formData = {
      bill_id: this.billIdSignal(),
      bill_particular_id: undefined,
      amount: 0
    };
    // Reset assignment data
    this.assignmentData = {
      selectedRegions: [],
      selectedZones: [],
      selectedGroups: [],
      selectedSchools: []
    };
    this.showModal.set(true);
  }

  openEditModal(item: BillItem): void {
    this.selectedItem.set(item);
    this.formData = { ...item };
    // Load current assignments from the item
    this.assignmentData = {
      selectedRegions: item.region_ids || [],
      selectedZones: item.zone_ids || [],
      selectedGroups: item.school_group_ids || [],
      selectedSchools: item.school_ids || []
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedItem.set(null);
  }

  saveItem(): void {
    if (!this.formData.bill_particular_id || !this.formData.amount) {
      return;
    }

    this.formData.bill_id = this.billIdSignal();

    // Include assignment data in formData
    this.formData.region_ids = this.assignmentData.selectedRegions;
    this.formData.zone_ids = this.assignmentData.selectedZones;
    this.formData.school_group_ids = this.assignmentData.selectedGroups;
    this.formData.school_ids = this.assignmentData.selectedSchools;

    this.loading.set(true);

    const request = this.selectedItem()
      ? this.financeService.updateBillItem(this.selectedItem()!.id, this.formData)
      : this.financeService.createBillItem(this.formData);

    request.subscribe({
      next: () => {
        this.closeModal();
        this.loadBillItems();
      },
      error: (error) => {
        console.error('Error saving bill item:', error);
        this.loading.set(false);
      }
    });
  }

  confirmDelete(item: BillItem): void {
    this.itemToDelete.set(item);
    this.showDeleteConfirm.set(true);
  }

  deleteItem(): void {
    const item = this.itemToDelete();
    if (!item) return;

    this.loading.set(true);
    this.financeService.deleteBillItem(item.id).subscribe({
      next: () => {
        this.showDeleteConfirm.set(false);
        this.itemToDelete.set(null);
        this.loadBillItems();
      },
      error: (error) => {
        console.error('Error deleting bill item:', error);
        this.loading.set(false);
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.itemToDelete.set(null);
  }

  openAssignmentModal(item: BillItem): void {
    this.selectedItem.set(item);
    this.assignmentData = {
      selectedRegions: [],
      selectedZones: [],
      selectedGroups: [],
      selectedSchools: []
    };

    // Load current assignments
    this.financeService.getBillItemAssignments(item.id).subscribe({
      next: (response) => {
        const assignments = response.data || [];
        this.currentAssignments.set(assignments);

        // Pre-select current assignments
        assignments.forEach((assignment: BillAssignment) => {
          if (assignment.entity_type === 'region') {
            this.assignmentData.selectedRegions.push(assignment.entity_id);
          } else if (assignment.entity_type === 'zone') {
            this.assignmentData.selectedZones.push(assignment.entity_id);
          } else if (assignment.entity_type === 'group') {
            this.assignmentData.selectedGroups.push(assignment.entity_id);
          } else if (assignment.entity_type === 'school') {
            this.assignmentData.selectedSchools.push(assignment.entity_id);
          }
        });

        this.showAssignmentModal.set(true);
      },
      error: (error) => {
        console.error('Error loading assignments:', error);
      }
    });
  }

  closeAssignmentModal(): void {
    this.showAssignmentModal.set(false);
    this.selectedItem.set(null);
  }

  saveAssignments(): void {
    const item = this.selectedItem();
    if (!item) return;

    const assignments: Partial<BillAssignment>[] = [];

    // Add region assignments
    this.assignmentData.selectedRegions.forEach(id => {
      assignments.push({
        entity_type: 'region',
        entity_id: id
      });
    });

    // Add zone assignments
    this.assignmentData.selectedZones.forEach(id => {
      assignments.push({
        entity_type: 'zone',
        entity_id: id
      });
    });

    // Add group assignments
    this.assignmentData.selectedGroups.forEach(id => {
      assignments.push({
        entity_type: 'group',
        entity_id: id
      });
    });

    // Add school assignments
    this.assignmentData.selectedSchools.forEach(id => {
      assignments.push({
        entity_type: 'school',
        entity_id: id
      });
    });

    this.loading.set(true);
    this.financeService.createBillAssignments(item.id, assignments).subscribe({
      next: () => {
        this.closeAssignmentModal();
        this.loadBillItems();
      },
      error: (error) => {
        console.error('Error saving assignments:', error);
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    // Use onBack callback if provided (embedded usage), otherwise navigate
    if (this.onBack) {
      this.onBack();
    } else {
      this.router.navigate(['/finance/bills']);
    }
  }
}
