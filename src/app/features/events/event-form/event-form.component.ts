import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { Event } from '../../../core/models';
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
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private flashMessage = inject(FlashMessageService);

  isEditing = signal(false);
  isSaving = signal(false);
  eventId = signal<number | null>(null);

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
    image_url: ''
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
      this.loadEvent(parseInt(id));
    }
  }

  loadEvent(id: number): void {
    this.eventService.getEventById(id).subscribe({
      next: (event) => {
        this.eventData.set(event);
      },
      error: (err) => {
        console.error('Failed to load event:', err);
        this.flashMessage.error('Failed to load event details');
        this.router.navigate(['/events']);
      }
    });
  }

  updateField(field: string, value: any): void {
    // Convert number fields from string to number
    let processedValue = value;
    if (field === 'price' || field === 'max_attendees') {
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
    const rawData = this.eventData();
    console.log('Submitting event data:', rawData);

    // Validation
    if (!rawData.title || !rawData.description || !rawData.start_date) {
      this.flashMessage.error('Please fill in all required fields');
      return;
    }

    // Sanitize data - convert number fields and handle empty values
    const data: Partial<Event> = {
      title: rawData.title,
      description: rawData.description || undefined,
      start_date: rawData.start_date,
      end_date: rawData.end_date || undefined,
      venue: rawData.venue || undefined,
      location: rawData.location || undefined,
      is_paid: rawData.is_paid || false,
      price: rawData.price ? Number(rawData.price) : undefined,
      max_attendees: rawData.max_attendees ? Number(rawData.max_attendees) : undefined,
      registration_deadline: rawData.registration_deadline || undefined,
      status: rawData.status || 'draft',
      image_url: rawData.image_url || undefined
    };

    console.log('Sanitized event data:', data);
    this.isSaving.set(true);

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
