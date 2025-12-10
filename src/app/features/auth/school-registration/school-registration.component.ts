import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Region, Zone, ContactPerson } from '../../../core/models';
import { SelectHelmComponent, SelectOption } from '../../../shared/ui/select-helm/select-helm.component';

interface RegistrationData {
  name: string;
  zone_id?: number;
  address?: string;
  location?: string;
  mobile_no?: string;
  email?: string;
  gps_address?: string;
  date_of_establishment?: string;
  contact_persons: Partial<ContactPerson>[];
}

@Component({
  selector: 'app-school-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SelectHelmComponent],
  templateUrl: './school-registration.component.html'
})
export class SchoolRegistrationComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  // Form state
  loading = signal(false);
  submitting = signal(false);
  submitted = signal(false);
  error = signal('');

  // Form data
  schoolData = signal<RegistrationData>({
    name: '',
    contact_persons: []
  });

  // Options
  regions = signal<Region[]>([]);
  zones = signal<Zone[]>([]);
  filteredZones = signal<Zone[]>([]);

  // Selected region for filtering zones
  selectedRegionId = signal<number | null>(null);

  // Relation options for select-helm
  relationOptions: SelectOption[] = [
    { value: 'Owner', label: 'Owner' },
    { value: 'Proprietor', label: 'Proprietor' },
    { value: 'Head Teacher', label: 'Head Teacher' },
    { value: 'Administrator', label: 'Administrator' },
    { value: 'Director', label: 'Director' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Other', label: 'Other' }
  ];

  // Computed options for select-helm components
  regionOptions = computed<SelectOption[]>(() =>
    this.regions().map(r => ({ value: r.id, label: r.name || '' }))
  );

  zoneOptions = computed<SelectOption[]>(() =>
    this.filteredZones().map(z => ({ value: z.id, label: z.name || '' }))
  );

  // Computed: Check if form is valid
  isFormValid = computed(() => {
    const data = this.schoolData();
    const hasName = data.name?.trim().length > 0;
    const hasZone = !!data.zone_id;
    const hasContact = data.contact_persons.length > 0 &&
      data.contact_persons.some(cp => cp.first_name && cp.last_name && cp.mobile_no);
    return hasName && hasZone && hasContact;
  });

  ngOnInit(): void {
    this.loadRegions();
    this.loadZones();
    this.addContactPerson(); // Add one contact person by default
  }

  loadRegions(): void {
    this.loading.set(true);
    this.http.get<{ data: Region[] }>(`${this.apiUrl}/public/regions`).subscribe({
      next: (response) => {
        this.regions.set(response.data || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load regions:', err);
        this.loading.set(false);
      }
    });
  }

  loadZones(): void {
    this.http.get<{ data: Zone[] }>(`${this.apiUrl}/public/zones`).subscribe({
      next: (response) => {
        this.zones.set(response.data || []);
        this.filteredZones.set(response.data || []);
      },
      error: (err) => {
        console.error('Failed to load zones:', err);
      }
    });
  }

  onRegionChange(regionId: any): void {
    const id = regionId ? Number(regionId) : null;
    this.selectedRegionId.set(id);

    if (id) {
      this.filteredZones.set(this.zones().filter(z => z.region_id === id));
    } else {
      this.filteredZones.set(this.zones());
    }

    // Reset zone selection
    this.updateField('zone_id', undefined);
  }

  updateField(field: keyof RegistrationData, value: any): void {
    this.schoolData.update(data => ({ ...data, [field]: value }));
  }

  // Contact person management
  addContactPerson(): void {
    this.schoolData.update(data => ({
      ...data,
      contact_persons: [
        ...data.contact_persons,
        { first_name: '', last_name: '', email: '', mobile_no: '', relation: '' }
      ]
    }));
  }

  updateContactPerson(index: number, field: string, value: any): void {
    this.schoolData.update(data => {
      const contacts = [...data.contact_persons];
      contacts[index] = { ...contacts[index], [field]: value };
      return { ...data, contact_persons: contacts };
    });
  }

  removeContactPerson(index: number): void {
    this.schoolData.update(data => ({
      ...data,
      contact_persons: data.contact_persons.filter((_, i) => i !== index)
    }));
  }

  submitRegistration(): void {
    if (!this.isFormValid()) {
      this.error.set('Please fill in all required fields');
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    const data = this.schoolData();

    this.http.post(`${this.apiUrl}/public/register`, data).subscribe({
      next: () => {
        this.submitted.set(true);
        this.submitting.set(false);
      },
      error: (err) => {
        console.error('Registration failed:', err);
        this.error.set(err.error?.message || err.error?.error || 'Registration failed. Please try again.');
        this.submitting.set(false);
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
