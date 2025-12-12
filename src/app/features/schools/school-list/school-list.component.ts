import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { NgSelectModule } from '@ng-select/ng-select';
import { SchoolService } from '../../../core/services/school.service';
import { RegionService } from '../../../core/services/region.service';
import { ZoneService } from '../../../core/services/zone.service';
import { GroupService } from '../../../core/services/group.service';
import { ContactPersonService } from '../../../core/services/contact-person.service';
import { FinanceService, PaymentHistoryItem } from '../../../core/services/finance.service';
import { AuthService } from '../../../core/services/auth.service';
import { School, ContactPerson, Zone, Region, Group, SchoolBill, SchoolPaymentRequest } from '../../../core/models';
import { ButtonHelmComponent } from '../../../shared/ui/button-helm/button-helm.component';
import { InputHelmComponent } from '../../../shared/ui/input-helm/input-helm.component';
import { SelectHelmComponent, SelectOption } from '../../../shared/ui/select-helm/select-helm.component';
import { TabsHelmComponent, TabComponent } from '../../../shared/ui/tabs-helm/tabs-helm.component';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';
import { FlashMessageService } from '../../../core/services/flash-message.service';

@Component({
  selector: 'app-school-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    ButtonHelmComponent,
    InputHelmComponent,
    SelectHelmComponent,
    TabsHelmComponent,
    TabComponent,
    BadgeComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './school-list.component.html'
})
export class SchoolListComponent implements OnInit {
  private schoolService = inject(SchoolService);
  private regionService = inject(RegionService);
  private zoneService = inject(ZoneService);
  private groupService = inject(GroupService);
  private contactPersonService = inject(ContactPersonService);
  private financeService = inject(FinanceService);
  private authService = inject(AuthService);
  private flashMessage = inject(FlashMessageService);

  // User role for stats visibility
  role = this.authService.userRole;

  // Computed: check if user can see regions stats (system_admin and national_admin only)
  canSeeRegionsStats = computed(() => {
    const userRole = this.role();
    return userRole === 'system_admin' || userRole === 'national_admin';
  });

  // Computed: check if user can see zones stats (system_admin, national_admin, and region_admin)
  canSeeZonesStats = computed(() => {
    const userRole = this.role();
    return userRole === 'system_admin' || userRole === 'national_admin' || userRole === 'region_admin';
  });

  // Signals
  schools = signal<School[]>([]);
  selectedSchool = signal<School | null>(null);
  showAdmitForm = signal(false);
  showEditSchoolModal = signal(false);
  showEditContactModal = signal(false);
  isLoading = signal(false);
  isSaving = signal(false);

  // Contact Person Modal signals
  showContactPersonModal = signal(false);
  contactPersonModalMode = signal<'add' | 'edit'>('add');
  editingContactPerson = signal<ContactPerson | null>(null);
  contactPersonFormData = signal<Partial<ContactPerson>>({});
  showDeleteContactDialog = signal(false);
  contactToDelete = signal<ContactPerson | null>(null);

  // Confirm dialog signals
  showDeleteDialog = signal(false);
  schoolToDelete = signal<School | null>(null);

  // Pay Bill Modal signals
  showPayBillModal = signal(false);
  schoolBills = signal<SchoolBill[]>([]);
  selectedBill = signal<SchoolBill | null>(null);
  loadingBills = signal(false);
  processingPayment = signal(false);
  pollingPayment = signal(false);
  paymentTransactionId = signal<number | null>(null);
  paymentStatusMessage = signal<string>('');
  paymentFormData = signal<{
    amount: number;
    payment_mode: 'Cash' | 'MoMo';
    payment_date: string;
    payment_note: string;
    momo_number: string;
    momo_network: 'MTN' | 'TELECEL' | 'AIRTELTIGO';
  }>({
    amount: 0,
    payment_mode: 'Cash',
    payment_date: new Date().toISOString().split('T')[0],
    payment_note: '',
    momo_number: '',
    momo_network: 'MTN'
  });

  // Payment History signals
  paymentHistory = signal<PaymentHistoryItem[]>([]);
  loadingPaymentHistory = signal(false);
  paymentHistoryPage = signal(1);
  paymentHistoryLimit = signal(10);
  paymentHistoryTotal = signal(0);

  // Active tab tracking
  activeTab = signal('info');

  // Computed: Payment mode options
  paymentModeOptions: SelectOption[] = [
    { value: 'Cash', label: 'Cash' },
    { value: 'MoMo', label: 'Mobile Money (MoMo)' }
  ];

  // MoMo Network options
  momoNetworkOptions: SelectOption[] = [
    { value: 'MTN', label: 'MTN Mobile Money' },
    { value: 'TELECEL', label: 'Telecel Cash' },
    { value: 'AIRTELTIGO', label: 'AirtelTigo Money' }
  ];

  // Computed: Bill options for select
  billOptions = computed<SelectOption[]>(() =>
    this.schoolBills()
      .filter(b => (b.balance || 0) > 0)
      .map(b => ({
        value: b.id,
        label: `${b.bill_name || 'Bill #' + b.bill_id} - Balance: GH₵${(b.balance || 0).toFixed(2)}`
      }))
  );

  // Pagination
  currentPage = signal(1);
  pageLimit = signal(10);
  totalSchools = signal(0);

  // Filters
  searchQuery = signal('');
  selectedRegion = signal<any>('');
  selectedZone = signal<any>('');
  selectedGroup = signal<any>('');

  // Filter options loaded from API
  regions = signal<SelectOption[]>([{ value: '', label: 'All Regions' }]);
  zones = signal<SelectOption[]>([{ value: '', label: 'All Zones' }]);
  groups = signal<SelectOption[]>([{ value: '', label: 'All Groups' }]);

  // Raw data for ng-select (without "All" options)
  rawRegions = signal<Region[]>([]);
  rawZones = signal<Zone[]>([]);
  rawGroups = signal<Group[]>([]);

  // Admit form specific signals
  admitSelectedRegion = signal<number | null>(null);
  admitFilteredZones = signal<Zone[]>([]);

  // Computed options for admit form select-helm components
  admitRegionOptions = computed(() =>
    this.rawRegions().map(region => ({ value: region.id, label: region.name }))
  );
  admitZoneOptions = computed(() =>
    this.admitFilteredZones().map(zone => ({ value: zone.id, label: zone.name }))
  );

  // Computed options for edit form select-helm (zones without "All Zones" option)
  editZoneOptions = computed(() =>
    this.rawZones().map(zone => ({ value: zone.id, label: zone.name }))
  );

  // Computed options for form group selection (multi-select)
  formGroupOptions = computed(() =>
    this.rawGroups().map(group => ({ value: group.id, label: group.name || 'Unnamed Group' }))
  );

  // Statistics computed signals
  statistics = computed(() => ({
    total: this.totalSchools(),
    active: this.schools().filter(s => s.status === 'active' || !s.status).length,
    regions: this.regions().length - 1, // Subtract "All Regions" option
    zones: this.zones().length - 1 // Subtract "All Zones" option
  }));

  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.searchQuery()) count++;
    if (this.selectedRegion() && this.selectedRegion() !== '') count++;
    if (this.selectedZone() && this.selectedZone() !== '') count++;
    if (this.selectedGroup() && this.selectedGroup() !== '') count++;
    return count;
  });

  newSchool: Partial<School> = {};
  newSchoolContacts = signal<Partial<ContactPerson>[]>([]);
  editSchoolData = signal<Partial<School>>({});
  editContactData = signal<{
    contact_person_name?: string;
    contact_person_email?: string;
    contact_person_phone?: string;
  }>({});

  ngOnInit(): void {
    this.loadRegions();
    this.loadZones();
    this.loadGroups();
    this.loadSchools();
  }

  loadRegions(): void {
    this.regionService.getRegions({ page: 1, limit: 100 }).subscribe({
      next: (response) => {
        // Set raw regions for ng-select
        this.rawRegions.set(response.data);

        // Set region options for app-select-helm (filters)
        const regionOptions: SelectOption[] = [
          { value: '', label: 'All Regions' },
          ...response.data.map(region => ({
            value: region.id,
            label: region.name
          }))
        ];
        this.regions.set(regionOptions);
      },
      error: (err) => console.error('Failed to load regions:', err)
    });
  }

  loadZones(regionId?: number): void {
    const params = regionId ? { region_id: regionId, page: 1, limit: 1000 } : { page: 1, limit: 1000 };
    this.zoneService.getZones(params).subscribe({
      next: (response) => {
        // Set raw zones for ng-select
        this.rawZones.set(response.data);

        // Set zone options for app-select-helm (filters)
        const zoneOptions: SelectOption[] = [
          { value: '', label: 'All Zones' },
          ...response.data.map(zone => ({
            value: zone.id,
            label: zone.name
          }))
        ];
        this.zones.set(zoneOptions);
      },
      error: (err) => console.error('Failed to load zones:', err)
    });
  }

  loadGroups(zoneId?: number): void {
    const params = zoneId ? { zone_id: zoneId, page: 1, limit: 1000 } : { page: 1, limit: 1000 };
    this.groupService.getGroups(params).subscribe({
      next: (response) => {
        // Set raw groups for form multi-select
        this.rawGroups.set(response.data);

        // Set group options for app-select-helm (filters)
        const groupOptions: SelectOption[] = [
          { value: '', label: 'All Groups' },
          ...response.data.map(group => ({
            value: group.id,
            label: group.name || 'Unnamed Group'
          }))
        ];
        this.groups.set(groupOptions);
      },
      error: (err) => {
        console.error('Failed to load groups:', err);
        this.flashMessage.error('Failed to load groups. Please refresh the page.');
      }
    });
  }

  loadSchools(): void {
    this.isLoading.set(true);

    const params = {
      page: this.currentPage(),
      limit: this.pageLimit(),
      ...(this.searchQuery() && { name: this.searchQuery() }),
      ...(this.selectedRegion() && this.selectedRegion() !== '' && { region_id: this.selectedRegion() }),
      ...(this.selectedZone() && this.selectedZone() !== '' && { zone_id: this.selectedZone() }),
      ...(this.selectedGroup() && this.selectedGroup() !== '' && { school_group_id: this.selectedGroup() })
    };

    this.schoolService.getSchools(params).subscribe({
      next: (response) => {
        this.schools.set(response.data);
        this.totalSchools.set(response.pagination.total);
        this.isLoading.set(false);

        if (response.data.length > 0 && !this.selectedSchool()) {
          this.selectedSchool.set(response.data[0]);
        }
      },
      error: (err) => {
        console.error('Failed to load schools:', err);
        this.isLoading.set(false);
      }
    });
  }

  onSchoolClick(school: School): void {
    this.selectedSchool.set(school);
    // Reload the active tab's data
    this.reloadActiveTab(school);
  }

  onTabChange(tabValue: string): void {
    this.activeTab.set(tabValue);
    const school = this.selectedSchool();
    if (school && tabValue === 'payments') {
      this.loadPaymentHistory(school.id);
    }
  }

  private reloadActiveTab(school: School): void {
    const tab = this.activeTab();
    switch (tab) {
      case 'payments':
        this.paymentHistoryPage.set(1); // Reset to first page
        this.loadPaymentHistory(school.id);
        break;
      // Add more cases as needed for other tabs that need data loading
    }
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1); // Reset to first page on search
    this.loadSchools();
  }

  onRegionChange(regionId: any): void {
    const id = regionId && regionId !== '' ? parseInt(regionId) : undefined;
    this.selectedRegion.set(regionId);
    this.selectedZone.set(''); // Reset zone when region changes
    if (id) {
      this.loadZones(id);
    } else {
      this.loadZones();
    }
    this.currentPage.set(1);
    this.loadSchools();
  }

  onZoneChange(zoneId: any): void {
    const id = zoneId && zoneId !== '' ? parseInt(zoneId) : undefined;
    this.selectedZone.set(zoneId);
    this.selectedGroup.set(''); // Reset group when zone changes
    if (id) {
      this.loadGroups(id);
    } else {
      this.loadGroups();
    }
    this.currentPage.set(1);
    this.loadSchools();
  }

  onGroupChange(groupId: any): void {
    this.selectedGroup.set(groupId);
    this.currentPage.set(1);
    this.loadSchools();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadSchools();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedRegion.set('');
    this.selectedZone.set('');
    this.selectedGroup.set('');
    this.currentPage.set(1);
    this.loadSchools();
  }

  admitSchool(): void {
    this.isSaving.set(true);

    // Prepare school data with proper types
    const schoolData: Partial<School> = {
      name: this.newSchool.name,
      member_no: this.newSchool.member_no,
      zone_id: this.newSchool.zone_id ? Number(this.newSchool.zone_id) : undefined,
      school_group_ids: this.newSchool.school_group_ids,
      address: this.newSchool.address || undefined,
      location: this.newSchool.location || undefined,
      mobile_no: this.newSchool.mobile_no || undefined,
      email: this.newSchool.email || undefined,
      gps_address: this.newSchool.gps_address || undefined,
    };

    // Convert dates to ISO format if provided
    if (this.newSchool.joining_date) {
      schoolData.joining_date = new Date(this.newSchool.joining_date).toISOString();
    }
    if (this.newSchool.date_of_establishment) {
      schoolData.date_of_establishment = new Date(this.newSchool.date_of_establishment).toISOString();
    }

    this.schoolService.admitSchool(schoolData).subscribe({
      next: (response) => {
        const schoolId = response.data?.id;
        const contacts = this.newSchoolContacts();

        if (schoolId && contacts.length > 0) {
          // Create contact persons for the new school
          const contactRequests = contacts.map(contact =>
            this.contactPersonService.createContactPerson({
              ...contact,
              school_id: schoolId
            })
          );

          forkJoin(contactRequests).subscribe({
            next: () => {
              this.showAdmitForm.set(false);
              this.newSchool = {};
              this.newSchoolContacts.set([]);
              this.admitSelectedRegion.set(null);
              this.admitFilteredZones.set([]);
              this.loadSchools();
              this.isSaving.set(false);
              this.flashMessage.success('School admitted with contact persons successfully!');
            },
            error: (err) => {
              console.error('Failed to create contact persons:', err);
              this.showAdmitForm.set(false);
              this.newSchool = {};
              this.newSchoolContacts.set([]);
              this.admitSelectedRegion.set(null);
              this.admitFilteredZones.set([]);
              this.loadSchools();
              this.isSaving.set(false);
              this.flashMessage.warning('School admitted but some contact persons could not be added.');
            }
          });
        } else {
          this.showAdmitForm.set(false);
          this.newSchool = {};
          this.newSchoolContacts.set([]);
          this.admitSelectedRegion.set(null);
          this.admitFilteredZones.set([]);
          this.loadSchools();
          this.isSaving.set(false);
          this.flashMessage.success('School admitted successfully!');
        }
      },
      error: (err) => {
        console.error('Failed to admit school:', err);
        this.isSaving.set(false);
        this.flashMessage.error('Failed to admit school. Please try again.');
      }
    });
  }

  // Method to open the admit form with 2 initial contact persons
  openAdmitForm(): void {
    // Reset form data
    this.newSchool = {};
    this.admitSelectedRegion.set(null);
    this.admitFilteredZones.set([]);

    // Initialize with 2 empty contact person forms
    this.newSchoolContacts.set([
      { first_name: '', last_name: '', email: '', mobile_no: '', relation: '' },
      { first_name: '', last_name: '', email: '', mobile_no: '', relation: '' }
    ]);

    // Open the modal
    this.showAdmitForm.set(true);
  }

  // Method to close and reset the admit form
  closeAdmitForm(): void {
    this.showAdmitForm.set(false);
    this.newSchool = {};
    this.newSchoolContacts.set([]);
    this.admitSelectedRegion.set(null);
    this.admitFilteredZones.set([]);
  }

  // Method to handle region change in admit form - loads zones for that region
  onAdmitRegionChange(regionId: any): void {
    this.admitSelectedRegion.set(regionId);
    // Reset zone and member number when region changes
    this.newSchool.zone_id = undefined;
    this.newSchool.member_no = '';
    this.admitFilteredZones.set([]);

    if (regionId && regionId !== '') {
      // Fetch zones for the selected region
      this.zoneService.getZones({ region_id: Number(regionId), page: 1, limit: 1000 }).subscribe({
        next: (response) => {
          this.admitFilteredZones.set(response.data);
        },
        error: (err) => {
          console.error('Failed to load zones for region:', err);
        }
      });
    }
  }

  // Method to handle zone change in admit form and auto-generate member number
  onNewSchoolZoneChange(zoneId: any): void {
    this.newSchool.zone_id = zoneId;
    if (zoneId && zoneId !== '') {
      // Fetch next member number for the selected zone
      this.schoolService.getNextMemberNo(Number(zoneId)).subscribe({
        next: (response) => {
          this.newSchool.member_no = response.member_no;
        },
        error: (err) => {
          console.error('Failed to get next member number:', err);
        }
      });
    } else {
      this.newSchool.member_no = '';
    }
  }

  // Methods for managing new school contacts during admission
  addNewSchoolContact(): void {
    this.newSchoolContacts.update(contacts => [
      ...contacts,
      { first_name: '', last_name: '', email: '', mobile_no: '', relation: '' }
    ]);
  }

  updateNewSchoolContact(index: number, field: string, value: any): void {
    this.newSchoolContacts.update(contacts => {
      const updated = [...contacts];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  removeNewSchoolContact(index: number): void {
    this.newSchoolContacts.update(contacts => contacts.filter((_, i) => i !== index));
  }

  openEditSchoolModal(school: School): void {
    // Parse school_group_ids - handle both array and JSON string formats
    let groupIds: number[] = [];
    if (school.school_group_ids) {
      if (Array.isArray(school.school_group_ids)) {
        groupIds = school.school_group_ids;
      } else if (typeof school.school_group_ids === 'string') {
        try {
          groupIds = JSON.parse(school.school_group_ids);
        } catch {
          groupIds = [];
        }
      }
    }

    this.editSchoolData.set({
      id: school.id,
      name: school.name,
      member_no: school.member_no,
      zone_id: school.zone_id,
      address: school.address,
      location: school.location,
      mobile_no: school.mobile_no,
      email: school.email,
      gps_address: school.gps_address,
      date_of_establishment: school.date_of_establishment,
      joining_date: school.joining_date,
      school_group_ids: groupIds
    });
    this.showEditSchoolModal.set(true);
  }

  openEditContactModal(school: School): void {
    this.editContactData.set({
      contact_person_name: school.contact_person_name,
      contact_person_email: school.contact_person_email,
      contact_person_phone: school.contact_person_phone
    });
    this.showEditContactModal.set(true);
  }

  saveSchoolEdit(): void {
    const rawData = this.editSchoolData();
    if (!rawData.id) return;

    // Sanitize data - ensure zone_id is a number
    const schoolData: Partial<School> = {
      ...rawData,
      zone_id: rawData.zone_id ? Number(rawData.zone_id) : undefined
    };

    console.log('Updating school data:', schoolData);
    this.isSaving.set(true);
    this.schoolService.updateSchool(schoolData.id!, schoolData).subscribe({
      next: () => {
        this.loadSchools();
        this.showEditSchoolModal.set(false);
        this.isSaving.set(false);
        this.flashMessage.success('School updated successfully!');
      },
      error: (err) => {
        console.error('Failed to update school:', err);
        this.isSaving.set(false);
        this.flashMessage.error('Failed to update school. Please try again.');
      }
    });
  }

  saveContactEdit(): void {
    const school = this.selectedSchool();
    const contactData = this.editContactData();
    if (!school) return;

    this.isSaving.set(true);
    this.schoolService.updateSchool(school.id, contactData).subscribe({
      next: () => {
        this.loadSchools();
        this.showEditContactModal.set(false);
        this.isSaving.set(false);
        this.flashMessage.success('Contact information updated successfully!');
      },
      error: (err) => {
        console.error('Failed to update contact:', err);
        this.isSaving.set(false);
        this.flashMessage.error('Failed to update contact. Please try again.');
      }
    });
  }

  closeEditSchoolModal(): void {
    this.showEditSchoolModal.set(false);
    this.editSchoolData.set({});
  }

  closeEditContactModal(): void {
    this.showEditContactModal.set(false);
    this.editContactData.set({});
  }

  updateEditSchoolField(field: string, value: any): void {
    // Convert number fields from string to number
    let processedValue = value;
    if (field === 'zone_id') {
      processedValue = value === '' || value === null ? undefined : Number(value);
    }
    this.editSchoolData.update(data => ({ ...data, [field]: processedValue }));
  }

  updateEditContactField(field: string, value: any): void {
    this.editContactData.update(data => ({ ...data, [field]: value }));
  }

  openDeleteDialog(school: School): void {
    this.schoolToDelete.set(school);
    this.showDeleteDialog.set(true);
  }

  confirmDelete(): void {
    const school = this.schoolToDelete();
    if (school) {
      this.schoolService.deleteSchool(school.id).subscribe({
        next: () => {
          this.loadSchools();
          this.flashMessage.success('School deleted successfully!');
        },
        error: (err) => {
          console.error('Failed to delete school:', err);
          this.flashMessage.error('Failed to delete school. Please try again.');
        }
      });
    }
    this.showDeleteDialog.set(false);
    this.schoolToDelete.set(null);
  }

  billSchool(schoolId: number): void {
    // TODO: Implement billing functionality
    console.log('Create bill for school ID:', schoolId);
    this.flashMessage.info('Billing functionality coming soon!');
  }

  // Contact Person Modal Methods
  openAddContactModal(school: School): void {
    this.contactPersonModalMode.set('add');
    this.editingContactPerson.set(null);
    this.contactPersonFormData.set({
      school_id: school.id
    });
    this.showContactPersonModal.set(true);
  }

  openEditContactPersonModal(contact: ContactPerson): void {
    this.contactPersonModalMode.set('edit');
    this.editingContactPerson.set(contact);
    this.contactPersonFormData.set({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      mobile_no: contact.mobile_no,
      relation: contact.relation,
      school_id: contact.school_id
    });
    this.showContactPersonModal.set(true);
  }

  closeContactPersonModal(): void {
    this.showContactPersonModal.set(false);
    this.contactPersonFormData.set({});
    this.editingContactPerson.set(null);
  }

  updateContactPersonFormField(field: string, value: any): void {
    this.contactPersonFormData.update(data => ({ ...data, [field]: value }));
  }

  saveContactPerson(): void {
    const formData = this.contactPersonFormData();
    const mode = this.contactPersonModalMode();

    if (!formData.first_name || !formData.last_name) {
      this.flashMessage.error('First name and last name are required');
      return;
    }

    this.isSaving.set(true);

    if (mode === 'add') {
      this.contactPersonService.createContactPerson(formData).subscribe({
        next: () => {
          this.flashMessage.success('Contact person added successfully!');
          this.closeContactPersonModal();
          this.loadSchools(); // Refresh to get updated contact persons
          this.isSaving.set(false);
        },
        error: (err) => {
          console.error('Failed to create contact person:', err);
          this.flashMessage.error(err.error?.error || 'Failed to add contact person. Please try again.');
          this.isSaving.set(false);
        }
      });
    } else {
      const contact = this.editingContactPerson();
      if (!contact) return;

      this.contactPersonService.updateContactPerson(contact.id, formData).subscribe({
        next: () => {
          this.flashMessage.success('Contact person updated successfully!');
          this.closeContactPersonModal();
          this.loadSchools(); // Refresh to get updated contact persons
          this.isSaving.set(false);
        },
        error: (err) => {
          console.error('Failed to update contact person:', err);
          this.flashMessage.error(err.error?.error || 'Failed to update contact person. Please try again.');
          this.isSaving.set(false);
        }
      });
    }
  }

  deleteContactPerson(contact: ContactPerson): void {
    this.contactToDelete.set(contact);
    this.showDeleteContactDialog.set(true);
  }

  confirmDeleteContactPerson(): void {
    const contact = this.contactToDelete();
    if (!contact) return;

    this.contactPersonService.deleteContactPerson(contact.id).subscribe({
      next: () => {
        this.flashMessage.success('Contact person deleted successfully!');
        this.loadSchools(); // Refresh to get updated contact persons
      },
      error: (err) => {
        console.error('Failed to delete contact person:', err);
        this.flashMessage.error('Failed to delete contact person. Please try again.');
      }
    });

    this.showDeleteContactDialog.set(false);
    this.contactToDelete.set(null);
  }

  cancelDeleteContactPerson(): void {
    this.showDeleteContactDialog.set(false);
    this.contactToDelete.set(null);
  }

  // Helper method to format date for HTML date input (YYYY-MM-DD format)
  formatDateForInput(date: string | undefined | null): string {
    if (!date) return '';
    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    // Handle ISO date format (e.g., "2024-01-15T00:00:00Z")
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  }

  // Relation options for dropdown
  relationOptions: SelectOption[] = [
    { value: '', label: 'Select Relation' },
    { value: 'Owner', label: 'Owner' },
    { value: 'Proprietor', label: 'Proprietor' },
    { value: 'Head Teacher', label: 'Head Teacher' },
    { value: 'Administrator', label: 'Administrator' },
    { value: 'Director', label: 'Director' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Other', label: 'Other' }
  ];

  // Pay Bill Modal Methods
  openPayBillModal(school: School): void {
    this.selectedSchool.set(school);
    this.showPayBillModal.set(true);
    this.loadSchoolBills(school.id);
    this.resetPaymentForm();
  }

  closePayBillModal(): void {
    this.showPayBillModal.set(false);
    this.schoolBills.set([]);
    this.selectedBill.set(null);
    this.resetPaymentForm();
  }

  resetPaymentForm(): void {
    this.paymentFormData.set({
      amount: 0,
      payment_mode: 'Cash',
      payment_date: new Date().toISOString().split('T')[0],
      payment_note: '',
      momo_number: '',
      momo_network: 'MTN'
    });
    this.selectedBill.set(null);
    this.pollingPayment.set(false);
    this.paymentTransactionId.set(null);
    this.paymentStatusMessage.set('');
  }

  loadSchoolBills(schoolId: number): void {
    this.loadingBills.set(true);
    this.financeService.getSchoolBills(schoolId).subscribe({
      next: (response) => {
        const bills = response.data || [];
        this.schoolBills.set(bills);
        this.loadingBills.set(false);

        // Auto-select the most recent bill with outstanding balance
        const billsWithBalance = bills.filter(b => (b.balance || 0) > 0);
        if (billsWithBalance.length > 0) {
          this.selectedBill.set(billsWithBalance[0]);
        }
      },
      error: (err) => {
        console.error('Failed to load school bills:', err);
        this.flashMessage.error('Failed to load bills. Please try again.');
        this.loadingBills.set(false);
      }
    });
  }

  onBillSelect(billId: any): void {
    const bill = this.schoolBills().find(b => b.id === billId);
    if (bill) {
      this.selectedBill.set(bill);
      // Pre-fill the amount with the balance
      this.paymentFormData.update(data => ({
        ...data,
        amount: bill.balance || 0
      }));
    } else {
      this.selectedBill.set(null);
      this.paymentFormData.update(data => ({ ...data, amount: 0 }));
    }
  }

  updatePaymentField(field: string, value: any): void {
    this.paymentFormData.update(data => ({ ...data, [field]: value }));
  }

  processPayment(): void {
    const school = this.selectedSchool();
    const bill = this.selectedBill();
    const formData = this.paymentFormData();

    if (!school || !bill) {
      this.flashMessage.error('Please select a bill to pay.');
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      this.flashMessage.error('Please enter a valid payment amount.');
      return;
    }

    if (formData.amount > (bill.balance || 0)) {
      this.flashMessage.error('Payment amount cannot exceed the bill balance.');
      return;
    }

    if (formData.payment_mode === 'MoMo') {
      if (!formData.momo_number) {
        this.flashMessage.error('Please enter the MoMo number.');
        return;
      }
      if (!formData.momo_network) {
        this.flashMessage.error('Please select the MoMo network.');
        return;
      }
    }

    this.processingPayment.set(true);

    const paymentRequest: SchoolPaymentRequest = {
      school_id: school.id,
      school_name: school.name,
      school_bill_id: bill.id,
      amount: formData.amount,
      payment_mode: formData.payment_mode,
      payment_date: formData.payment_date,
      payment_note: formData.payment_note || undefined,
      momo_number: formData.payment_mode === 'MoMo' ? formData.momo_number : undefined,
      momo_network: formData.payment_mode === 'MoMo' ? formData.momo_network : undefined
    };

    this.financeService.recordSchoolPayment(paymentRequest).subscribe({
      next: (response) => {
        if (response.payment_method === 'MoMo' && response.data?.payment_transaction_id) {
          // MoMo payment initiated - start polling
          this.paymentTransactionId.set(response.data.payment_transaction_id);
          this.pollingPayment.set(true);
          this.paymentStatusMessage.set('Payment initiated. Please approve on your phone...');
          this.flashMessage.info('MoMo payment initiated. Please approve on your phone.');
          this.processingPayment.set(false);
          this.startPaymentStatusPolling(response.data.payment_transaction_id);
        } else {
          // Cash payment - success
          this.flashMessage.success('Payment recorded successfully!');
          this.closePayBillModal();
          this.processingPayment.set(false);
        }
      },
      error: (err) => {
        console.error('Failed to process payment:', err);
        this.flashMessage.error(err.error?.error || 'Failed to process payment. Please try again.');
        this.processingPayment.set(false);
      }
    });
  }

  private paymentPollingInterval: any = null;

  startPaymentStatusPolling(paymentTransactionId: number): void {
    // Poll every 5 seconds
    let pollCount = 0;
    const maxPolls = 120; // Max 10 minutes (120 * 5 seconds)

    this.paymentPollingInterval = setInterval(() => {
      if (!this.pollingPayment()) {
        this.stopPaymentStatusPolling();
        return;
      }

      pollCount++;
      if (pollCount > maxPolls) {
        this.stopPaymentStatusPolling();
        this.paymentStatusMessage.set('Payment verification timeout. Please check your payment status.');
        this.flashMessage.warning('Payment verification timeout. Please check your payment history.');
        return;
      }

      this.financeService.checkPaymentStatus(paymentTransactionId).subscribe({
        next: (status) => {
          if (status.status === 'successful') {
            this.stopPaymentStatusPolling();
            this.pollingPayment.set(false);
            this.paymentStatusMessage.set('Payment successful!');
            this.flashMessage.success('Payment completed successfully!');
            // Reload school bills to reflect updated balance
            const school = this.selectedSchool();
            if (school) {
              this.loadSchoolBills(school.id);
            }
            // Close modal after a short delay
            setTimeout(() => {
              this.closePayBillModal();
            }, 2000);
          } else if (status.status === 'failed') {
            this.stopPaymentStatusPolling();
            this.pollingPayment.set(false);
            this.paymentStatusMessage.set(status.message || 'Payment failed. Please try again.');
            this.flashMessage.error(status.message || 'Payment failed. Please try again.');
          } else {
            // Still pending
            this.paymentStatusMessage.set(status.message || 'Waiting for payment approval...');
          }
        },
        error: (err) => {
          console.error('Error checking payment status:', err);
          // Continue polling on error
        }
      });
    }, 5000);
  }

  stopPaymentStatusPolling(): void {
    if (this.paymentPollingInterval) {
      clearInterval(this.paymentPollingInterval);
      this.paymentPollingInterval = null;
    }
  }

  cancelMoMoPayment(): void {
    this.stopPaymentStatusPolling();
    this.pollingPayment.set(false);
    this.paymentTransactionId.set(null);
    this.paymentStatusMessage.set('');
    this.flashMessage.info('Payment cancelled. You can try again.');
  }

  // Payment History Methods
  loadPaymentHistory(schoolId: number): void {
    this.loadingPaymentHistory.set(true);
    this.financeService.getSchoolPaymentHistory(
      schoolId,
      this.paymentHistoryPage(),
      this.paymentHistoryLimit()
    ).subscribe({
      next: (response) => {
        this.paymentHistory.set(response.data || []);
        this.paymentHistoryTotal.set(response.total);
        this.loadingPaymentHistory.set(false);
      },
      error: (err) => {
        console.error('Failed to load payment history:', err);
        this.flashMessage.error('Failed to load payment history.');
        this.loadingPaymentHistory.set(false);
      }
    });
  }

  onPaymentHistoryPageChange(page: number): void {
    this.paymentHistoryPage.set(page);
    const school = this.selectedSchool();
    if (school) {
      this.loadPaymentHistory(school.id);
    }
  }

  // Computed: Payment history pagination
  paymentHistoryTotalPages = computed(() =>
    Math.ceil(this.paymentHistoryTotal() / this.paymentHistoryLimit())
  );

  // Format currency for display
  formatCurrency(amount: number): string {
    return `GH₵${amount.toFixed(2)}`;
  }

  // Get payment mode badge class
  getPaymentModeBadgeClass(mode: string): string {
    switch (mode?.toLowerCase()) {
      case 'momo':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cash':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }
}
