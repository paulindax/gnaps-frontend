import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { PublicEventService } from '../../../core/services/public-event.service';
import { FlashMessageService } from '../../../core/services/flash-message.service';
import { Event, EventRegistration, School, SchoolBalance } from '../../../core/models';

@Component({
  selector: 'app-event-register-public',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
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

  // School balance
  schoolBalance = signal<SchoolBalance | null>(null);
  isLoadingBalance = signal(false);

  // Payment status
  paymentCompleted = signal(false);
  isProcessingPayment = signal(false);
  showPaymentModal = signal(false);

  // Registration completion
  registrationComplete = signal(false);

  // Registration data
  registrationData = signal<Partial<EventRegistration>>({
    school_id: 0,
    payment_method: undefined,
    payment_phone: '',
    number_of_attendees: 1
  });

  // Calculate total payment amount (event fee + school balance)
  totalPayment = computed(() => {
    const event = this.event();
    const balance = this.schoolBalance();

    let total = 0;

    // Add event fee if the event is paid
    if (event?.is_paid && event?.price) {
      const attendees = this.registrationData().number_of_attendees || 1;
      total += event.price * attendees;
    }

    // Add school balance if exists
    if (balance && balance.has_balance) {
      total += balance.balance;
    }

    return total;
  });

  // Check if payment is required
  requiresPayment = computed(() => {
    const event = this.event();
    const balance = this.schoolBalance();
    return event?.is_paid || (balance && balance.has_balance);
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

    // Check school balance
    this.loadSchoolBalance(school.id);
  }

  loadSchoolBalance(schoolId: number): void {
    this.isLoadingBalance.set(true);
    this.publicEventService.getSchoolBalance(schoolId).subscribe({
      next: (balance) => {
        this.schoolBalance.set(balance);
        this.isLoadingBalance.set(false);

        // Show notification if school has outstanding balance
        if (balance.has_balance && balance.balance > 0) {
          this.flashMessageService.info(
            `This school has an outstanding balance of GH₵${balance.balance.toFixed(2)} which will be added to the payment.`
          );
        }
      },
      error: (err) => {
        console.error('Error loading school balance:', err);
        this.isLoadingBalance.set(false);
        // Set balance to null if there's an error (fail gracefully)
        this.schoolBalance.set(null);
      }
    });
  }

  updateField(field: string, value: any): void {
    this.registrationData.update(data => ({ ...data, [field]: value }));
  }

  validateForm(): boolean {
    if (!this.selectedSchool()) {
      this.flashMessageService.warning('Please select your school');
      return false;
    }

    // If payment is required (either event is paid or school has balance)
    if (this.requiresPayment()) {
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

  processPayment(): void {
    if (!this.validateForm()) return;

    // Show payment modal
    this.showPaymentModal.set(true);
    this.isProcessingPayment.set(true);

    // Simulate payment processing (replace with actual payment API call)
    // In production, this would call a payment gateway API
    setTimeout(() => {
      // Simulate successful payment after 3 seconds
      this.isProcessingPayment.set(false);
      this.paymentCompleted.set(true);
      this.showPaymentModal.set(false);

      this.flashMessageService.success(
        `Payment of GH₵${this.totalPayment().toFixed(2)} processed successfully! You can now complete your registration.`
      );
    }, 3000);
  }

  submitRegistration(): void {
    if (!this.validateForm()) return;

    // Check if payment is required but not completed
    if (this.requiresPayment() && !this.paymentCompleted()) {
      this.flashMessageService.warning('Please complete payment before submitting registration');
      return;
    }

    const event = this.event();
    if (!event) return;

    this.isSubmitting.set(true);

    this.publicEventService.registerForEvent(
      this.registrationCode(),
      this.registrationData()
    ).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.registrationComplete.set(true);
        // Flash message is automatically handled by the interceptor from backend response
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
