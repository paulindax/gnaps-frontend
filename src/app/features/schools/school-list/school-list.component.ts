import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SchoolService } from '../../../core/services/school.service';
import { RegionService } from '../../../core/services/region.service';
import { ZoneService } from '../../../core/services/zone.service';
import { GroupService } from '../../../core/services/group.service';
import { School } from '../../../core/models';
import { ButtonHelmComponent } from '../../../shared/ui/button-helm/button-helm.component';
import { InputHelmComponent } from '../../../shared/ui/input-helm/input-helm.component';
import { SelectHelmComponent, SelectOption } from '../../../shared/ui/select-helm/select-helm.component';
import { TabsHelmComponent, TabComponent } from '../../../shared/ui/tabs-helm/tabs-helm.component';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';

@Component({
  selector: 'app-school-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonHelmComponent,
    InputHelmComponent,
    SelectHelmComponent,
    TabsHelmComponent,
    TabComponent,
    BadgeComponent
  ],
  templateUrl: './school-list.component.html'
})
export class SchoolListComponent implements OnInit {
  private schoolService = inject(SchoolService);
  private regionService = inject(RegionService);
  private zoneService = inject(ZoneService);
  private groupService = inject(GroupService);

  // Signals
  schools = signal<School[]>([]);
  selectedSchool = signal<School | null>(null);
  showAdmitForm = signal(false);
  showEditSchoolModal = signal(false);
  showEditContactModal = signal(false);
  isLoading = signal(false);
  isSaving = signal(false);

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

  newSchool: Partial<School> = {};
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
    const params = regionId ? { region_id: regionId, page: 1, limit: 100 } : { page: 1, limit: 100 };
    this.zoneService.getZones(params).subscribe({
      next: (response) => {
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
    const params = zoneId ? { zone_id: zoneId, page: 1, limit: 100 } : { page: 1, limit: 100 };
    this.groupService.getGroups(params).subscribe({
      next: (response) => {
        const groupOptions: SelectOption[] = [
          { value: '', label: 'All Groups' },
          ...response.data.map(group => ({
            value: group.id,
            label: group.name
          }))
        ];
        this.groups.set(groupOptions);
      },
      error: (err) => console.error('Failed to load groups:', err)
    });
  }

  loadSchools(): void {
    this.isLoading.set(true);

    const params = {
      page: this.currentPage(),
      limit: this.pageLimit(),
      ...(this.searchQuery() && { name: this.searchQuery() }),
      ...(this.selectedZone() && { zone_id: this.selectedZone() })
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

  admitSchool(): void {
    this.schoolService.admitSchool(this.newSchool).subscribe({
      next: () => {
        this.showAdmitForm.set(false);
        this.newSchool = {};
        this.loadSchools();
        alert('School admitted successfully!');
      },
      error: (err) => {
        console.error('Failed to admit school:', err);
        alert('Failed to admit school. Please try again.');
      }
    });
  }

  openEditSchoolModal(school: School): void {
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
      joining_date: school.joining_date
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
        alert('School updated successfully!');
      },
      error: (err) => {
        console.error('Failed to update school:', err);
        this.isSaving.set(false);
        alert('Failed to update school. Please try again.');
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
        alert('Contact information updated successfully!');
      },
      error: (err) => {
        console.error('Failed to update contact:', err);
        this.isSaving.set(false);
        alert('Failed to update contact. Please try again.');
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

  deleteSchool(school: School): void {
    if (confirm(`Are you sure you want to delete ${school.name}?`)) {
      this.schoolService.deleteSchool(school.id).subscribe({
        next: () => {
          this.loadSchools();
          alert('School deleted successfully!');
        },
        error: (err) => {
          console.error('Failed to delete school:', err);
          alert('Failed to delete school. Please try again.');
        }
      });
    }
  }

  billSchool(schoolId: number): void {
    // TODO: Implement billing functionality
    console.log('Create bill for school ID:', schoolId);
    alert('Billing functionality coming soon!');
  }
}
