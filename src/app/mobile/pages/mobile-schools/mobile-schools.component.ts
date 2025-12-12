import { Component, inject, OnInit, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SchoolService } from '../../../core/services/school.service';
import { ZoneService } from '../../../core/services/zone.service';
import { RegionService } from '../../../core/services/region.service';
import { GroupService } from '../../../core/services/group.service';
import { ContactPersonService } from '../../../core/services/contact-person.service';
import { FinanceService, PaymentHistoryItem } from '../../../core/services/finance.service';

@Component({
  selector: 'app-mobile-schools',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './mobile-schools.component.html',
  styleUrl: './mobile-schools.component.css'
})
export class MobileSchoolsComponent implements OnInit {
  schoolService = inject(SchoolService);
  zoneService = inject(ZoneService);
  regionService = inject(RegionService);
  groupService = inject(GroupService);
  contactPersonService = inject(ContactPersonService);
  financeService = inject(FinanceService);
  router = inject(Router);

  schools = signal<any[]>([]);
  zones = signal<any[]>([]);
  regions = signal<any[]>([]);
  groups = signal<any[]>([]);

  // Filter signals
  selectedRegion = signal<number | null>(null);
  selectedZone = signal<number | null>(null);
  selectedGroup = signal<number | null>(null);
  showRegionPicker = signal(false);
  showZoneFilter = signal(false);
  showGroupPicker = signal(false);
  regionSearchQuery = '';
  groupSearchQuery = '';
  filterZoneSearchQuery = '';
  loading = signal(true);

  // Detail view signals
  showDetail = signal(false);
  selectedSchool = signal<any>(null);
  activeTab = signal<'info' | 'contacts' | 'payments'>('info');
  contactPersons = signal<any[]>([]);
  paymentHistory = signal<PaymentHistoryItem[]>([]);
  loadingContacts = signal(false);
  loadingPayments = signal(false);

  // Contact modal signals
  showContactModal = signal(false);
  editingContact = signal<any>(null);
  savingContact = signal(false);

  contactFormData: any = {
    first_name: '',
    last_name: '',
    email: '',
    mobile_no: '',
    relation: ''
  };

  relationOptions = [
    'Owner',
    'Proprietor',
    'Head Teacher',
    'Administrator',
    'Accountant',
    'Secretary',
    'Manager',
    'Other'
  ];
  loadingMore = signal(false);
  saving = signal(false);
  totalSchools = signal(0);
  hasMore = signal(false);
  showModal = signal(false);
  showZonePicker = signal(false);
  editingSchool = signal<any>(null);

  currentPage = 1;
  pageSize = 15;
  searchQuery = '';
  zoneSearchQuery = '';
  private searchTimeout: any;

  formData: any = {
    name: '',
    zone_id: null,
    member_no: '',
    email: '',
    mobile_no: '',
    address: '',
    location: '',
    gps_address: ''
  };

  ngOnInit(): void {
    this.loadSchools();
    this.loadZones();
    this.loadRegions();
    this.loadGroups();
  }

  loadZones(): void {
    this.zoneService.getZones({ limit: 500 }).subscribe({
      next: (response) => {
        this.zones.set(response.data || []);
      }
    });
  }

  loadRegions(): void {
    this.regionService.getRegions({ limit: 100 }).subscribe({
      next: (response) => {
        this.regions.set(response.data || []);
      }
    });
  }

  loadGroups(): void {
    this.groupService.getGroups({ limit: 200 }).subscribe({
      next: (response) => {
        this.groups.set(response.data || []);
      }
    });
  }

  loadSchools(append = false): void {
    if (!append) {
      this.loading.set(true);
      this.currentPage = 1;
    } else {
      this.loadingMore.set(true);
    }

    const filters: any = {
      page: this.currentPage,
      limit: this.pageSize
    };

    if (this.searchQuery) {
      filters.name = this.searchQuery;
    }

    if (this.selectedRegion()) {
      filters.region_id = this.selectedRegion();
    }

    if (this.selectedZone()) {
      filters.zone_id = this.selectedZone();
    }

    if (this.selectedGroup()) {
      filters.school_group_id = this.selectedGroup();
    }

    this.schoolService.getSchools(filters).subscribe({
      next: (response) => {
        const newSchools = response.data || [];
        const total = response.pagination?.total || 0;

        if (append) {
          this.schools.update(current => [...current, ...newSchools]);
        } else {
          this.schools.set(newSchools);
        }

        this.totalSchools.set(total);
        this.hasMore.set(this.schools().length < total);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadingMore.set(false);
      }
    });
  }

  loadMore(): void {
    this.currentPage++;
    this.loadSchools(true);
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadSchools();
    }, 300);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadSchools();
  }

  // Filter methods
  openRegionPicker(): void {
    this.regionSearchQuery = '';
    this.showRegionPicker.set(true);
  }

  openZoneFilterPicker(): void {
    this.filterZoneSearchQuery = '';
    this.showZoneFilter.set(true);
  }

  openGroupPicker(): void {
    this.groupSearchQuery = '';
    this.showGroupPicker.set(true);
  }

  selectFilterRegion(regionId: number | null): void {
    this.selectedRegion.set(regionId);
    this.showRegionPicker.set(false);
    // Reset zone filter when region changes (zones depend on region)
    if (regionId !== null) {
      this.selectedZone.set(null);
    }
    this.loadSchools();
  }

  selectFilterZone(zoneId: number | null): void {
    this.selectedZone.set(zoneId);
    this.showZoneFilter.set(false);
    this.loadSchools();
  }

  selectFilterGroup(groupId: number | null): void {
    this.selectedGroup.set(groupId);
    this.showGroupPicker.set(false);
    this.loadSchools();
  }

  clearAllFilters(): void {
    this.selectedRegion.set(null);
    this.selectedZone.set(null);
    this.selectedGroup.set(null);
    this.loadSchools();
  }

  hasActiveFilters(): boolean {
    return this.selectedRegion() !== null || this.selectedZone() !== null || this.selectedGroup() !== null;
  }

  getSelectedRegionName(): string {
    const region = this.regions().find(r => r.id === this.selectedRegion());
    return region?.name || '';
  }

  getSelectedFilterZoneName(): string {
    const zone = this.zones().find(z => z.id === this.selectedZone());
    return zone?.name || '';
  }

  getSelectedGroupName(): string {
    const group = this.groups().find(g => g.id === this.selectedGroup());
    return group?.name || '';
  }

  get filteredRegions(): any[] {
    if (!this.regionSearchQuery) return this.regions();
    return this.regions().filter(r =>
      r.name?.toLowerCase().includes(this.regionSearchQuery.toLowerCase())
    );
  }

  get filteredFilterZones(): any[] {
    let zones = this.zones();
    // Filter by selected region if one is selected
    if (this.selectedRegion()) {
      zones = zones.filter(z => z.region_id === this.selectedRegion());
    }
    if (!this.filterZoneSearchQuery) return zones;
    return zones.filter(z =>
      z.name?.toLowerCase().includes(this.filterZoneSearchQuery.toLowerCase())
    );
  }

  get filteredGroups(): any[] {
    if (!this.groupSearchQuery) return this.groups();
    return this.groups().filter(g =>
      g.name?.toLowerCase().includes(this.groupSearchQuery.toLowerCase())
    );
  }

  getSchoolInitial(name: string): string {
    return name?.charAt(0)?.toUpperCase() || 'S';
  }

  openCreateModal(): void {
    this.editingSchool.set(null);
    this.formData = {
      name: '',
      zone_id: null,
      member_no: '',
      email: '',
      mobile_no: '',
      address: '',
      location: '',
      gps_address: ''
    };
    this.showModal.set(true);
  }

  openEditModal(school: any): void {
    // Close detail view first to prevent overlay issues
    this.showDetail.set(false);

    this.editingSchool.set(school);
    this.formData = {
      name: school.name || '',
      zone_id: school.zone_id || school.zone?.id || null,
      member_no: school.member_no || '',
      email: school.email || '',
      mobile_no: school.mobile_no || '',
      address: school.address || '',
      location: school.location || '',
      gps_address: school.gps_address || ''
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingSchool.set(null);
  }

  onZoneChange(): void {
    if (!this.editingSchool() && this.formData.zone_id) {
      this.schoolService.getNextMemberNo(this.formData.zone_id).subscribe({
        next: (response) => {
          this.formData.member_no = response.member_no || '';
        }
      });
    }
  }

  saveSchool(): void {
    if (!this.formData.name || !this.formData.zone_id) return;

    this.saving.set(true);

    const payload: any = {
      name: this.formData.name,
      zone_id: this.formData.zone_id,
      email: this.formData.email || null,
      mobile_no: this.formData.mobile_no || null,
      address: this.formData.address || null,
      location: this.formData.location || null,
      gps_address: this.formData.gps_address || null
    };

    if (this.formData.member_no) {
      payload.member_no = this.formData.member_no;
    }

    const request = this.editingSchool()
      ? this.schoolService.updateSchool(this.editingSchool().id, payload)
      : this.schoolService.admitSchool(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.loadSchools();
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }

  openZonePicker(): void {
    this.zoneSearchQuery = '';
    this.showZonePicker.set(true);
  }

  closeZonePicker(): void {
    this.showZonePicker.set(false);
    this.zoneSearchQuery = '';
  }

  selectZone(zone: any): void {
    this.formData.zone_id = zone.id;
    this.closeZonePicker();
    this.onZoneChange();
  }

  getSelectedZoneName(): string {
    if (!this.formData.zone_id) return '';
    const zone = this.zones().find(z => z.id === this.formData.zone_id);
    return zone?.name || '';
  }

  getFilteredZones(): any[] {
    if (!this.zoneSearchQuery) return this.zones();
    const query = this.zoneSearchQuery.toLowerCase();
    return this.zones().filter(zone =>
      zone.name?.toLowerCase().includes(query) ||
      zone.code?.toLowerCase().includes(query)
    );
  }

  // School Detail Methods
  openSchoolDetail(school: any): void {
    this.selectedSchool.set(school);
    this.activeTab.set('info');
    this.contactPersons.set([]);
    this.paymentHistory.set([]);
    this.showDetail.set(true);
  }

  closeSchoolDetail(): void {
    this.showDetail.set(false);
    this.selectedSchool.set(null);
    this.activeTab.set('info');
  }

  setActiveTab(tab: 'info' | 'contacts' | 'payments'): void {
    this.activeTab.set(tab);
    const school = this.selectedSchool();
    if (!school) return;

    if (tab === 'contacts' && this.contactPersons().length === 0) {
      this.loadContactPersons(school.id);
    } else if (tab === 'payments' && this.paymentHistory().length === 0) {
      this.loadPaymentHistory(school.id);
    }
  }

  loadContactPersons(schoolId: number): void {
    this.loadingContacts.set(true);
    this.contactPersonService.getContactPersonsBySchool(schoolId).subscribe({
      next: (response) => {
        this.contactPersons.set(response.data || []);
        this.loadingContacts.set(false);
      },
      error: () => {
        this.loadingContacts.set(false);
      }
    });
  }

  loadPaymentHistory(schoolId: number): void {
    this.loadingPayments.set(true);
    this.financeService.getSchoolPaymentHistory(schoolId, 1, 50).subscribe({
      next: (response) => {
        this.paymentHistory.set(response.data || []);
        this.loadingPayments.set(false);
      },
      error: () => {
        this.loadingPayments.set(false);
      }
    });
  }

  getContactInitials(contact: any): string {
    const first = contact.first_name?.charAt(0)?.toUpperCase() || '';
    const last = contact.last_name?.charAt(0)?.toUpperCase() || '';
    return first + last || 'CP';
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  }

  // Contact Person Methods
  openAddContactModal(): void {
    this.editingContact.set(null);
    this.contactFormData = {
      first_name: '',
      last_name: '',
      email: '',
      mobile_no: '',
      relation: ''
    };
    this.showContactModal.set(true);
  }

  openEditContactModal(contact: any): void {
    this.editingContact.set(contact);
    this.contactFormData = {
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      email: contact.email || '',
      mobile_no: contact.mobile_no || '',
      relation: contact.relation || ''
    };
    this.showContactModal.set(true);
  }

  closeContactModal(): void {
    this.showContactModal.set(false);
    this.editingContact.set(null);
  }

  saveContact(): void {
    const school = this.selectedSchool();
    if (!school || !this.contactFormData.first_name || !this.contactFormData.last_name) return;

    this.savingContact.set(true);

    const payload = {
      school_id: school.id,
      first_name: this.contactFormData.first_name,
      last_name: this.contactFormData.last_name,
      email: this.contactFormData.email || null,
      mobile_no: this.contactFormData.mobile_no || null,
      relation: this.contactFormData.relation || null
    };

    const request = this.editingContact()
      ? this.contactPersonService.updateContactPerson(this.editingContact().id, payload)
      : this.contactPersonService.createContactPerson(payload);

    request.subscribe({
      next: () => {
        this.savingContact.set(false);
        this.closeContactModal();
        this.loadContactPersons(school.id);
      },
      error: () => {
        this.savingContact.set(false);
      }
    });
  }

  deleteContact(contact: any): void {
    const school = this.selectedSchool();
    if (!school || !contact?.id) return;

    if (confirm(`Delete contact ${contact.first_name} ${contact.last_name}?`)) {
      this.contactPersonService.deleteContactPerson(contact.id).subscribe({
        next: () => {
          this.loadContactPersons(school.id);
        }
      });
    }
  }
}
