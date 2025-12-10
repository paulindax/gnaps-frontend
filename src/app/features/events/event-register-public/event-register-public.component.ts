import { Component, signal, inject, OnInit, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { PublicEventService, PaymentStatusResponse } from '../../../core/services/public-event.service';
import { FlashMessageService } from '../../../core/services/flash-message.service';
import { MediaService } from '../../../core/services/media.service';
import { Event, EventRegistration, School, SchoolBalance } from '../../../core/models';
import { Subscription, interval } from 'rxjs';
import { takeWhile, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-event-register-public',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './event-register-public.component.html',
  styleUrls: ['./event-register-public.component.css']
})
export class EventRegisterPublicComponent implements OnInit, OnDestroy {
  private publicEventService = inject(PublicEventService);
  private flashMessageService = inject(FlashMessageService);
  private mediaService = inject(MediaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Payment polling subscription
  private paymentPollingSubscription: Subscription | null = null;
  private readonly PAYMENT_POLL_INTERVAL = 10000; // 10 seconds
  private readonly PAYMENT_TIMEOUT = 120000; // 2 minutes timeout

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
  registrationBlocked = signal(false);
  blockedMessage = signal('');

  // Payment status
  paymentCompleted = signal(false);
  paymentFailed = signal(false);
  isProcessingPayment = signal(false);
  showPaymentModal = signal(false);
  paymentTransactionId = signal<number | null>(null);
  paymentStatusMessage = signal('Initiating payment...');
  paymentTimeRemaining = signal(120); // seconds remaining

  // Registration completion
  registrationComplete = signal(false);
  registrationId = signal<number | null>(null);

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

    // If event has a bill_id, filter schools by that bill
    const eventBillId = this.event()?.bill_id;

    this.publicEventService.searchSchools(keyword, eventBillId).subscribe({
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

    // Check school balance - pass event's bill_id if available
    const eventBillId = this.event()?.bill_id;
    this.loadSchoolBalance(school.id, eventBillId);
  }

  loadSchoolBalance(schoolId: number, billId?: number): void {
    this.isLoadingBalance.set(true);
    this.registrationBlocked.set(false);
    this.blockedMessage.set('');

    this.publicEventService.getSchoolBalance(schoolId, billId).subscribe({
      next: (balance) => {
        this.schoolBalance.set(balance);
        this.isLoadingBalance.set(false);

        // Check if registration is blocked (school not in billing system)
        if (balance.blocked) {
          this.registrationBlocked.set(true);
          this.blockedMessage.set(balance.message || 'Your school is not registered in the billing system. Please contact your Zone Admin.');
          this.flashMessageService.error(this.blockedMessage());
          return;
        }

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

    // Check if registration is blocked
    if (this.registrationBlocked()) {
      this.flashMessageService.error(this.blockedMessage() || 'Registration is blocked. Please contact your Zone Admin.');
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

  ngOnDestroy(): void {
    this.stopPaymentPolling();
  }

  processPayment(): void {
    if (!this.validateForm()) return;

    const school = this.selectedSchool();
    const data = this.registrationData();
    if (!school) return;

    // Reset payment state
    this.paymentCompleted.set(false);
    this.paymentFailed.set(false);
    this.paymentStatusMessage.set('Initiating payment...');
    this.paymentTimeRemaining.set(120);

    // Show payment modal
    this.showPaymentModal.set(true);
    this.isProcessingPayment.set(true);

    // Directly initiate payment - registration will be created after payment succeeds
    this.initiatePaymentRequest(school, data);
  }

  private initiatePaymentRequest(school: School, data: Partial<EventRegistration>): void {
    this.paymentStatusMessage.set('Sending payment request to your phone...');

    this.publicEventService.initiatePayment(this.registrationCode(), {
      amount: this.totalPayment(),
      phone_number: data.payment_phone || '',
      network: data.payment_method || '',
      school_id: school.id,
      school_name: school.name,
      number_of_attendees: data.number_of_attendees || 1
    }).subscribe({
      next: (response) => {
        if (response.error) {
          this.handlePaymentError(response.message);
          return;
        }

        this.paymentTransactionId.set(response.payment_transaction_id);
        this.paymentStatusMessage.set('Please approve the payment on your phone...');

        // Start polling for payment status
        this.startPaymentPolling(response.payment_transaction_id);
      },
      error: (err) => {
        console.error('Error initiating payment:', err);
        this.handlePaymentError(err.error?.message || 'Failed to initiate payment');
      }
    });
  }

  private startPaymentPolling(paymentId: number): void {
    const startTime = Date.now();
    let pollCount = 0;

    // Update countdown timer
    const timerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((this.PAYMENT_TIMEOUT - elapsed) / 1000));
      this.paymentTimeRemaining.set(remaining);

      if (remaining <= 0) {
        clearInterval(timerInterval);
      }
    }, 1000);

    // Poll for payment status every 5 seconds for up to 1 minute
    this.paymentPollingSubscription = interval(this.PAYMENT_POLL_INTERVAL).pipe(
      takeWhile(() => {
        const elapsed = Date.now() - startTime;
        return elapsed < this.PAYMENT_TIMEOUT && this.isProcessingPayment();
      }),
      switchMap(() => this.publicEventService.checkPaymentStatus(paymentId))
    ).subscribe({
      next: (status: PaymentStatusResponse) => {
        pollCount++;
        console.log(`Payment status check #${pollCount}:`, status);

        if (status.status === 'successful') {
          this.handlePaymentSuccess();
          clearInterval(timerInterval);
        } else if (status.status === 'failed') {
          this.handlePaymentError(status.message || 'Payment was declined');
          clearInterval(timerInterval);
        } else {
          // Still pending
          this.paymentStatusMessage.set(status.message || 'Waiting for payment confirmation...');
        }
      },
      error: (err) => {
        console.error('Error checking payment status:', err);
        // Don't fail on polling errors, just continue
      },
      complete: () => {
        clearInterval(timerInterval);
        // If polling completed without success/failure, check one more time
        if (this.isProcessingPayment() && !this.paymentCompleted() && !this.paymentFailed()) {
          this.publicEventService.checkPaymentStatus(paymentId).subscribe({
            next: (status) => {
              if (status.status === 'successful') {
                this.handlePaymentSuccess();
              } else {
                this.handlePaymentTimeout();
              }
            },
            error: () => {
              this.handlePaymentTimeout();
            }
          });
        }
      }
    });
  }

  private stopPaymentPolling(): void {
    if (this.paymentPollingSubscription) {
      this.paymentPollingSubscription.unsubscribe();
      this.paymentPollingSubscription = null;
    }
  }

  private handlePaymentSuccess(): void {
    this.stopPaymentPolling();
    this.isProcessingPayment.set(false);
    this.paymentCompleted.set(true);
    this.showPaymentModal.set(false);
    this.registrationComplete.set(true);

    this.flashMessageService.success(
      `Payment of GH₵${this.totalPayment().toFixed(2)} completed successfully! Your registration is confirmed.`
    );
  }

  private handlePaymentError(message: string): void {
    this.stopPaymentPolling();
    this.isProcessingPayment.set(false);
    this.paymentFailed.set(true);
    this.showPaymentModal.set(false);
    this.flashMessageService.error(message);
  }

  private handlePaymentTimeout(): void {
    this.stopPaymentPolling();
    this.isProcessingPayment.set(false);
    this.paymentFailed.set(true);
    this.showPaymentModal.set(false);
    this.flashMessageService.warning(
      'Payment verification timed out. If you approved the payment, please check your registration status or contact support.'
    );
  }

  retryPayment(): void {
    this.paymentFailed.set(false);
    this.paymentCompleted.set(false);
    this.paymentTransactionId.set(null);

    const school = this.selectedSchool();
    const data = this.registrationData();

    if (school) {
      this.showPaymentModal.set(true);
      this.isProcessingPayment.set(true);
      this.paymentTimeRemaining.set(120);
      this.initiatePaymentRequest(school, data);
    }
  }

  submitRegistration(): void {
    if (!this.validateForm()) return;

    // If payment is required, use processPayment flow instead
    if (this.requiresPayment()) {
      if (!this.paymentCompleted()) {
        this.processPayment();
        return;
      }
    }

    // For free events, submit directly
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
      },
      error: (err) => {
        console.error('Error submitting registration:', err);
        this.isSubmitting.set(false);
        if (!err.error?.flash_message) {
          const errorMsg = err.error?.error || 'Failed to submit registration';
          this.flashMessageService.error(errorMsg);
        }
      }
    });
  }

  // Get full image URL with backend base
  getImageUrl(imageUrl?: string): string {
    return this.mediaService.getImageUrl(imageUrl);
  }
}
