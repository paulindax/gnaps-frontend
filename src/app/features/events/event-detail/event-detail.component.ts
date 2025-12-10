import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { AuthService } from '../../../core/services/auth.service';
import { MediaService } from '../../../core/services/media.service';
import { Event, EventRegistration } from '../../../core/models';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { InputHelmComponent } from '../../../shared/ui/input-helm/input-helm.component';
import { FlashMessageService } from '../../../core/services/flash-message.service';
import { DataExportComponent, ExportConfig } from '../../../shared/ui/data-export/data-export.component';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BadgeComponent,
    InputHelmComponent,
    DataExportComponent
  ],
  templateUrl: './event-detail.component.html'
})
export class EventDetailComponent implements OnInit {
  private eventService = inject(EventService);
  private authService = inject(AuthService);
  private mediaService = inject(MediaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private flashMessage = inject(FlashMessageService);

  event = signal<Event | null>(null);
  registrations = signal<EventRegistration[]>([]);
  isLoading = signal(false);
  showRegistrationForm = signal(false);
  isRegistering = signal(false);

  // Pagination for registrations
  registrationPage = signal(1);
  registrationPageSize = signal(10);

  // Computed paginated registrations
  paginatedRegistrations = computed(() => {
    const all = this.registrations();
    const page = this.registrationPage();
    const size = this.registrationPageSize();
    const start = (page - 1) * size;
    return all.slice(start, start + size);
  });

  totalRegistrationPages = computed(() => {
    const total = this.registrations().length;
    const size = this.registrationPageSize();
    return Math.ceil(total / size);
  });

  // Total attendees across all registrations
  totalAttendees = computed(() => {
    return this.registrations().reduce((sum, reg) => sum + (reg.number_of_attendees || 0), 0);
  });

  registrationData = signal<Partial<EventRegistration>>({
    number_of_attendees: 1
  });

  selectedRegistration = signal<EventRegistration | null>(null);
  showRegistrationDetails = signal(false);

  role = this.authService.userRole;

  canManageEvents = () => {
    const userRole = this.role();
    return userRole === 'system_admin' || userRole === 'national_admin' || userRole === 'region_admin';
  };

  canRegister = () => {
    const userRole = this.role();
    return userRole === 'school_admin';
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEvent(parseInt(id));
      if (this.canManageEvents()) {
        this.loadRegistrations(parseInt(id));
      }
    }
  }

  loadEvent(id: number): void {
    this.isLoading.set(true);
    this.eventService.getEventById(id).subscribe({
      next: (event) => {
        this.event.set(event);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load event:', err);
        this.isLoading.set(false);
        this.flashMessage.error('Failed to load event details');
        this.router.navigate(['/events']);
      }
    });
  }

  loadRegistrations(eventId: number): void {
    // Fetch all registrations for client-side pagination (limit=1000)
    this.eventService.getEventRegistrations(eventId, { page: 1, limit: 1000 }).subscribe({
      next: (response) => {
        this.registrations.set(response.data);
      },
      error: (err) => {
        console.error('Failed to load registrations:', err);
      }
    });
  }

  openRegistrationForm(): void {
    this.showRegistrationForm.set(true);
  }

  closeRegistrationForm(): void {
    this.showRegistrationForm.set(false);
    this.registrationData.set({ number_of_attendees: 1 });
  }

  updateRegistrationField(field: string, value: any): void {
    // Convert number fields from string to number
    let processedValue = value;
    if (field === 'number_of_attendees') {
      processedValue = value === '' || value === null ? 1 : Number(value);
    }
    this.registrationData.update(data => ({ ...data, [field]: processedValue }));
  }

  submitRegistration(): void {
    const event = this.event();
    if (!event) return;

    const rawData = this.registrationData();

    // Sanitize data - ensure number_of_attendees is a number
    const data: Partial<EventRegistration> = {
      school_id: rawData.school_id,
      number_of_attendees: rawData.number_of_attendees ? Number(rawData.number_of_attendees) : 1
    };

    console.log('Submitting registration data:', data);
    this.isRegistering.set(true);

    this.eventService.registerForEvent(event.id, data).subscribe({
      next: () => {
        this.isRegistering.set(false);
        this.flashMessage.success('Registration successful!');
        this.closeRegistrationForm();
        this.loadEvent(event.id);
      },
      error: (err) => {
        console.error('Failed to register:', err);
        this.isRegistering.set(false);
        this.flashMessage.error('Failed to register for event. Please try again.');
      }
    });
  }

  editEvent(): void {
    const event = this.event();
    if (event) {
      this.router.navigate(['/events', event.id, 'edit']);
    }
  }

  goBack(): void {
    this.router.navigate(['/events']);
  }

  getStatusVariant(status?: string): 'default' | 'success' | 'destructive' | 'outline' {
    switch (status) {
      case 'published':
        return 'success';
      case 'cancelled':
        return 'destructive';
      case 'draft':
        return 'outline';
      default:
        return 'default';
    }
  }

  // Get registration link
  getRegistrationLink(): string {
    const event = this.event();
    const code = event?.registration_code;
    if (!code) return '';
    return `${window.location.origin}/event-register/${code}`;
  }

  // Copy link to clipboard
  copyLink(input: HTMLInputElement): void {
    const link = this.getRegistrationLink();
    navigator.clipboard.writeText(link).then(() => {
      this.flashMessage.success('Registration link copied to clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      input.select();
      document.execCommand('copy');
      this.flashMessage.success('Registration link copied to clipboard!');
    });
  }

  // View registration details
  viewRegistrationDetails(registration: EventRegistration): void {
    this.selectedRegistration.set(registration);
    this.showRegistrationDetails.set(true);
  }

  closeRegistrationDetails(): void {
    this.showRegistrationDetails.set(false);
    this.selectedRegistration.set(null);
  }

  // Copy to clipboard helper
  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.flashMessage.success('Copied to clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.flashMessage.success('Copied to clipboard!');
    });
  }

  // Get full image URL with backend base
  getImageUrl(imageUrl?: string): string {
    return this.mediaService.getImageUrl(imageUrl);
  }

  // Pagination methods
  nextRegistrationPage(): void {
    if (this.registrationPage() < this.totalRegistrationPages()) {
      this.registrationPage.update(p => p + 1);
    }
  }

  previousRegistrationPage(): void {
    if (this.registrationPage() > 1) {
      this.registrationPage.update(p => p - 1);
    }
  }

  goToRegistrationPage(page: number): void {
    if (page >= 1 && page <= this.totalRegistrationPages()) {
      this.registrationPage.set(page);
    }
  }

  getPageNumbers(): number[] {
    const total = this.totalRegistrationPages();
    const current = this.registrationPage();
    const pages: number[] = [];

    // Show max 5 page numbers
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Helper for pagination display - calculates the end index for "Showing X - Y of Z"
  getRegistrationEndIndex(): number {
    return Math.min(this.registrationPage() * this.registrationPageSize(), this.registrations().length);
  }

  // Export configuration for registrations
  registrationExportConfig = computed<ExportConfig>(() => {
    const event = this.event();
    return {
      title: `Event Registrations - ${event?.title || 'Event'}`,
      filename: `event-registrations-${event?.id || 'export'}`,
      summaryLine: `Total Registrations: ${this.registrations().length} | Total Attendees: ${this.totalAttendees()}`,
      columns: [
        { key: 'school_name', header: 'School Name' },
        { key: 'number_of_attendees', header: 'Attendees' },
        {
          key: 'registration_date',
          header: 'Registration Date',
          formatter: (value: string) => value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'
        },
        {
          key: 'payment_status',
          header: 'Payment Status',
          formatter: (value: string) => value ? value.toUpperCase() : 'N/A'
        },
        { key: 'payment_reference', header: 'Payment Reference' },
        { key: 'payment_phone', header: 'Payment Phone' }
      ]
    };
  });
}
