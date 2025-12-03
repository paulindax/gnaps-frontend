import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { AuthService } from '../../../core/services/auth.service';
import { Event, EventRegistration } from '../../../core/models';
import { ButtonHelmComponent } from '../../../shared/ui/button-helm/button-helm.component';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { InputHelmComponent } from '../../../shared/ui/input-helm/input-helm.component';
import { FlashMessageService } from '../../../core/services/flash-message.service';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonHelmComponent,
    BadgeComponent,
    InputHelmComponent
  ],
  templateUrl: './event-detail.component.html'
})
export class EventDetailComponent implements OnInit {
  private eventService = inject(EventService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private flashMessage = inject(FlashMessageService);

  event = signal<Event | null>(null);
  registrations = signal<EventRegistration[]>([]);
  isLoading = signal(false);
  showRegistrationForm = signal(false);
  isRegistering = signal(false);

  registrationData = signal<Partial<EventRegistration>>({
    number_of_attendees: 1
  });

  selectedRegistration = signal<EventRegistration | null>(null);
  showRegistrationDetails = signal(false);

  role = this.authService.userRole;

  canManageEvents = () => {
    const userRole = this.role();
    return userRole === 'system_admin' || userRole === 'national_admin' || userRole === 'regional_admin';
  };

  canRegister = () => {
    const userRole = this.role();
    return userRole === 'school_user';
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
    this.eventService.getEventRegistrations(eventId).subscribe({
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
}
