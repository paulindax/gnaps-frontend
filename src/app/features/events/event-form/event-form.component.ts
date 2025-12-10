import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { FinanceService } from '../../../core/services/finance.service';
import { Event, Bill } from '../../../core/models';
import { SelectHelmComponent, SelectOption } from '../../../shared/ui/select-helm/select-helm.component';
import { ImageUploadComponent } from '../../../shared/ui/image-upload/image-upload.component';
import { FlashMessageService } from '../../../core/services/flash-message.service';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectHelmComponent,
    ImageUploadComponent
  ],
  templateUrl: './event-form.component.html'
})
export class EventFormComponent implements OnInit {
  private eventService = inject(EventService);
  private financeService = inject(FinanceService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private flashMessage = inject(FlashMessageService);

  isEditing = signal(false);
  isSaving = signal(false);
  eventId = signal<number | null>(null);

  // Bills for selection
  bills = signal<Bill[]>([]);
  billOptions = signal<SelectOption[]>([]);

  // Computed signal for bill_id display value - ensures proper reactivity when both event and bills load
  billIdDisplay = computed(() => {
    const billId = this.eventData().bill_id;
    const options = this.billOptions();
    // Only return the string value if we have options loaded (to ensure proper matching)
    if (options.length > 0 && billId) {
      return billId.toString();
    }
    return '';
  });

  eventData = signal<Partial<Event>>({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    venue: '',
    location: '',
    is_paid: false,
    price: 0,
    max_attendees: 0,
    registration_deadline: '',
    status: 'draft',
    image_url: '',
    bill_id: undefined
  });
  
  statusOptions: SelectOption[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      this.eventId.set(parseInt(id));
      // When editing, load bills first, then load event to ensure bill select works
      this.loadBillsThenEvent(parseInt(id));
    } else {
      // When creating, just load bills
      this.loadBills();
    }
  }

  loadBills(): void {
    this.financeService.getBills(1, 100, '', { is_approved: true }).subscribe({
      next: (response) => {
        this.setBillOptions(response);
      },
      error: (err) => {
        console.error('Failed to load bills:', err);
      }
    });
  }

  // Load bills first, then load event - ensures bill options are available for select
  private loadBillsThenEvent(eventId: number): void {
    this.financeService.getBills(1, 100, '', { is_approved: true }).subscribe({
      next: (response) => {
        this.setBillOptions(response);
        // Now load event after bills are ready
        this.loadEvent(eventId);
      },
      error: (err) => {
        console.error('Failed to load bills:', err);
        // Still try to load event even if bills fail
        this.loadEvent(eventId);
      }
    });
  }

  private setBillOptions(response: any): void {
    const billsList = response.data || response || [];
    this.bills.set(billsList);
    // Create options with "None" option first
    const options: SelectOption[] = [
      { value: '', label: 'None (No bill required)' },
      ...billsList.map((bill: Bill) => ({
        value: bill.id.toString(),
        label: bill.name
      }))
    ];
    this.billOptions.set(options);
  }

  loadEvent(id: number): void {
    this.eventService.getEventById(id).subscribe({
      next: (event) => {
        // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
        const formattedEvent = {
          ...event,
          start_date: this.formatDateForInput(event.start_date),
          end_date: this.formatDateForInput(event.end_date),
          registration_deadline: this.formatDateForInput(event.registration_deadline)
        };
        this.eventData.set(formattedEvent);
      },
      error: (err) => {
        console.error('Failed to load event:', err);
        this.flashMessage.error('Failed to load event details');
        this.router.navigate(['/events']);
      }
    });
  }

  // Convert ISO date string to datetime-local format (YYYY-MM-DDTHH:mm)
  private formatDateForInput(dateString?: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      // Format as YYYY-MM-DDTHH:mm for datetime-local input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  }

  // Convert datetime-local format back to ISO format for backend
  private formatDateForApi(dateString?: string): string | undefined {
    if (!dateString) return undefined;
    try {
      // datetime-local format is YYYY-MM-DDTHH:mm, convert to ISO
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return undefined;
      return date.toISOString();
    } catch {
      return undefined;
    }
  }

  updateField(field: string, value: any): void {
    // Convert number fields from string to number
    let processedValue = value;
    if (field === 'price' || field === 'max_attendees') {
      processedValue = value === '' || value === null ? null : Number(value);
    }
    // Convert bill_id from string to number or null
    if (field === 'bill_id') {
      processedValue = value === '' || value === null ? null : Number(value);
    }
    this.eventData.update(data => ({ ...data, [field]: processedValue }));
  }

  togglePaidEvent(): void {
    const currentValue = this.eventData().is_paid;
    this.eventData.update(data => ({
      ...data,
      is_paid: !currentValue,
      price: !currentValue ? data.price || 0 : 0
    }));
  }

  onSubmit(): void {
    // Prevent double submission
    if (this.isSaving()) {
      return;
    }

    const rawData = this.eventData();
    console.log('Submitting event data:', rawData);

    // Validation
    if (!rawData.title || !rawData.description || !rawData.start_date) {
      this.flashMessage.error('Please fill in all required fields');
      return;
    }

    // Set saving flag immediately after validation to prevent double clicks
    this.isSaving.set(true);

    // Sanitize data - convert number fields, dates, and handle empty values
    const data: Partial<Event> = {
      title: rawData.title,
      description: rawData.description || undefined,
      start_date: this.formatDateForApi(rawData.start_date) || rawData.start_date,
      end_date: this.formatDateForApi(rawData.end_date),
      venue: rawData.venue || undefined,
      location: rawData.location || undefined,
      is_paid: rawData.is_paid || false,
      price: rawData.price ? Number(rawData.price) : undefined,
      max_attendees: rawData.max_attendees ? Number(rawData.max_attendees) : undefined,
      registration_deadline: this.formatDateForApi(rawData.registration_deadline),
      status: rawData.status || 'draft',
      image_url: rawData.image_url || undefined,
      bill_id: rawData.bill_id ? Number(rawData.bill_id) : undefined
    };

    console.log('Sanitized event data:', data);

    const observable = this.isEditing()
      ? this.eventService.updateEvent(this.eventId()!, data)
      : this.eventService.createEvent(data);

    observable.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.flashMessage.success(`Event ${this.isEditing() ? 'updated' : 'created'} successfully!`);
        this.router.navigate(['/events']);
      },
      error: (err) => {
        console.error('Failed to save event:', err);
        this.isSaving.set(false);
        this.flashMessage.error(`Failed to ${this.isEditing() ? 'update' : 'create'} event. Please try again.`);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/events']);
  }

  // Get registration link
  getRegistrationLink(): string {
    const code = this.eventData().registration_code;
    if (!code) return '';
    return `${window.location.origin}/event-register/${code}`;
  }

  // Copy link to clipboard
  copyLink(input: HTMLInputElement): void {
    input.select();
    document.execCommand('copy');
    this.flashMessage.success('Registration link copied to clipboard!');
  }
}
