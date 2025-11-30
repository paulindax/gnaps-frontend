import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PublicEventService } from '../../../core/services/public-event.service';
import { FlashMessageService } from '../../../core/services/flash-message.service';
import { Event, EventRegistration, School } from '../../../core/models';

@Component({
  selector: 'app-event-register-public',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-register-public.component.html',
  styleUrls: ['./event-register-public.component.css']
})
export class EventRegisterPublicComponent implements OnInit {
  private publicEventService = inject(PublicEventService);
  private flashMessageService = inject(FlashMessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  event = signal<Event | null>(null);
  loading = signal(true);
  isSubmitting = signal(false);
  registrationCode = signal('');

  // School search
  schoolSearchKeyword = signal('');
  searchResults = signal<School[]>([]);
  selectedSchool = signal<School | null>(null);
  isSearching = signal(false);

  // Registration data
  registrationData = signal<Partial<EventRegistration>>({
    school_id: 0,
    payment_method: undefined,
    payment_phone: '',
    number_of_attendees: 1
  });

  // Payment methods
  paymentMethods = [
    { value: 'MTN', label: 'MTN Mobile Money' },
    { value: 'TELECEL', label: 'Telecel Cash' },
    { value: 'AIRTELTIGO', label: 'AirtelTigo Money' }
  ];

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('code');
    if (code) {
      this.registrationCode.set(code);
      this.loadEvent(code);
    } else {
      this.flashMessageService.error('Invalid registration link');
      this.router.navigate(['/']);
    }
  }

  loadEvent(code: string): void {
    this.loading.set(true);
    this.publicEventService.getEventByCode(code).subscribe({
      next: (event) => {
        this.event.set(event);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading event:', err);
        this.flashMessageService.error('Event not found or registration link is invalid');
        this.loading.set(false);
        this.router.navigate(['/']);
      }
    });
  }

  searchSchools(): void {
    const keyword = this.schoolSearchKeyword();
    if (keyword.length < 2) {
      this.searchResults.set([]);
      return;
    }

    this.isSearching.set(true);
    this.publicEventService.searchSchools(keyword).subscribe({
      next: (schools) => {
        this.searchResults.set(schools);
        this.isSearching.set(false);
      },
      error: (err) => {
        console.error('Error searching schools:', err);
        this.isSearching.set(false);
      }
    });
  }

  selectSchool(school: School): void {
    this.selectedSchool.set(school);
    this.registrationData.update(data => ({ ...data, school_id: school.id }));
    this.schoolSearchKeyword.set(school.name);
    this.searchResults.set([]);
  }

  updateField(field: string, value: any): void {
    this.registrationData.update(data => ({ ...data, [field]: value }));
  }

  validateForm(): boolean {
    if (!this.selectedSchool()) {
      this.flashMessageService.warning('Please select your school');
      return false;
    }

    const event = this.event();
    if (event?.is_paid) {
      const data = this.registrationData();
      if (!data.payment_method) {
        this.flashMessageService.warning('Please select a payment method');
        return false;
      }
      if (!data.payment_phone || data.payment_phone.length < 10) {
        this.flashMessageService.warning('Please enter a valid phone number');
        return false;
      }
    }

    return true;
  }

  submitRegistration(): void {
    if (!this.validateForm()) return;

    const event = this.event();
    if (!event) return;

    this.isSubmitting.set(true);

    this.publicEventService.registerForEvent(
      this.registrationCode(),
      this.registrationData()
    ).subscribe({
      next: (registration) => {
        this.isSubmitting.set(false);
        // Flash message is automatically handled by the interceptor from backend response
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Error submitting registration:', err);
        this.isSubmitting.set(false);
        // Flash message is automatically handled by the interceptor from backend error response
        // But show a generic error if no flash message was provided
        if (!err.error?.flash_message) {
          const errorMsg = err.error?.error || 'Failed to submit registration';
          this.flashMessageService.error(errorMsg);
        }
      }
    });
  }
}
