import { Component, inject, OnInit, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../core/services/event.service';

@Component({
  selector: 'app-mobile-event-detail',
  standalone: true,
  imports: [],
  templateUrl: './mobile-event-detail.component.html',
  styleUrl: './mobile-event-detail.component.css'
})
export class MobileEventDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  location = inject(Location);
  eventService = inject(EventService);

  event = signal<any>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEvent(id);
    }
  }

  loadEvent(id: string): void {
    this.loading.set(true);
    this.eventService.getEventById(+id).subscribe({
      next: (response: any) => {
        this.event.set(response.data || response);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  isToday(): boolean {
    if (!this.event()?.start_date) return false;
    const eventDate = new Date(this.event().start_date);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  }

  getEventDay(dateString: string): string {
    return new Date(dateString).getDate().toString();
  }

  getEventMonth(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short' });
  }

  formatTime(time: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:3020${path.startsWith('/') ? '' : '/'}${path}`;
  }

  register(): void {
    const event = this.event();
    if (event?.registration_link) {
      window.open(event.registration_link, '_blank');
    } else if (event?.registration_code) {
      this.router.navigate(['/event-register', event.registration_code]);
    }
  }
}
