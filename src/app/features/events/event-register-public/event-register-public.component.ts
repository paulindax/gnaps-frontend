import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PublicEventService } from '../../../core/services/public-event.service';
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
      alert('Invalid registration link');
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
        alert('Event not found or registration link is invalid');
        this.loading.set(false);
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
      alert('Please select your school');
      return false;
    }

    const event = this.event();
    if (event?.is_paid) {
      const data = this.registrationData();
      if (!data.payment_method) {
        alert('Please select a payment method');
        return false;
      }
      if (!data.payment_phone || data.payment_phone.length < 10) {
        alert('Please enter a valid phone number');
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
        if (event.is_paid) {
          alert('Registration submitted! Please complete payment using the provided mobile money number.');
        } else {
          alert('Registration successful! We look forward to seeing you at the event.');
        }
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Error submitting registration:', err);
        this.isSubmitting.set(false);
        const errorMsg = err.error?.error || 'Failed to submit registration';
        alert(errorMsg);
      }
    });
  }
}
