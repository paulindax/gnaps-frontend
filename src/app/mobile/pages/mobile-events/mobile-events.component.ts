import { Component, inject, OnInit, signal } from '@angular/core';

import { Router, RouterLink } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-mobile-events',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './mobile-events.component.html',
  styleUrl: './mobile-events.component.css'
})
export class MobileEventsComponent implements OnInit {
  eventService = inject(EventService);
  router = inject(Router);

  events = signal<any[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(false);
  activeFilter = signal('upcoming');

  currentPage = 1;
  pageSize = 10;

  filters = [
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'All Events', value: 'all' }
  ];

  ngOnInit(): void {
    this.loadEvents();
  }

  setFilter(filter: string): void {
    this.activeFilter.set(filter);
    this.currentPage = 1;
    this.loadEvents();
  }

  loadEvents(append = false): void {
    if (!append) {
      this.loading.set(true);
      this.currentPage = 1;
    } else {
      this.loadingMore.set(true);
    }

    this.eventService.getEvents({
      page: this.currentPage,
      limit: this.pageSize
    }).subscribe({
      next: (response) => {
        let filteredEvents = this.filterEvents(response.data || []);

        if (append) {
          this.events.update(current => [...current, ...filteredEvents]);
        } else {
          this.events.set(filteredEvents);
        }

        const total = response.pagination?.total || filteredEvents.length;
        this.hasMore.set(this.events().length < total && filteredEvents.length === this.pageSize);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadingMore.set(false);
      }
    });
  }

  private filterEvents(events: any[]): any[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    return events
      .filter((event: any) => {
        if (event.status && event.status !== 'published') return false;

        const eventDate = new Date(event.start_date);
        eventDate.setHours(0, 0, 0, 0);

        switch (this.activeFilter()) {
          case 'upcoming':
            return eventDate >= today;
          case 'today':
            return eventDate.getTime() === today.getTime();
          case 'week':
            return eventDate >= today && eventDate <= weekFromNow;
          case 'all':
          default:
            return true;
        }
      })
      .sort((a, b) => {
        const dateA = new Date(a.start_date).getTime();
        const dateB = new Date(b.start_date).getTime();
        return this.activeFilter() === 'all' ? dateB - dateA : dateA - dateB;
      });
  }

  loadMore(): void {
    this.currentPage++;
    this.loadEvents(true);
  }

  getEventDay(dateString: string): string {
    return new Date(dateString).getDate().toString();
  }

  getEventMonth(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short' });
  }

  getDaysUntil(dateString: string): number {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    return Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  isToday(dateString: string): boolean {
    return this.getDaysUntil(dateString) === 0;
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
    return `${environment.staticUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }
}
