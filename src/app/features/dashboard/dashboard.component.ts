import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { NewsService } from '../../core/services/news.service';
import { EventService } from '../../core/services/event.service';
import { News, Event } from '../../core/models';
import { ButtonHelmComponent } from '../../shared/ui/button-helm/button-helm.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ButtonHelmComponent, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private newsService = inject(NewsService);
  private eventService = inject(EventService);
  private router = inject(Router);

  // Signals
  role = this.authService.userRole;
  stats = this.dashboardService.stats;
  recentNews = signal<News[]>([]);
  newsLoading = signal<boolean>(true);
  newsError = signal<boolean>(false);

  // Upcoming Events
  upcomingEvents = signal<Event[]>([]);
  eventsLoading = signal<boolean>(true);
  eventsError = signal<boolean>(false);

  constructor() {
    // Auto-load stats when role is available
    effect(() => {
      if (this.role()) {
        this.dashboardService.refreshStats();
      }
    });

    // Load recent news (latest 3)
    this.loadRecentNews();

    // Load upcoming events
    this.loadUpcomingEvents();
  }

  private loadRecentNews(): void {
    this.newsLoading.set(true);
    this.newsError.set(false);

    this.newsService.getNews(1, 10, { status: 'published' }).subscribe({
      next: (response) => {
        // Get the 3 most recent news items
        const sortedNews = response.data
          .sort((a: News, b: News) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3);
        this.recentNews.set(sortedNews);
        this.newsLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading news:', error);
        this.newsError.set(true);
        this.newsLoading.set(false);
      }
    });
  }

  private loadUpcomingEvents(): void {
    this.eventsLoading.set(true);
    this.eventsError.set(false);

    // Get today's date at midnight (local time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch events without status filter (same as events page)
    // Then filter client-side for published/upcoming events
    this.eventService.getEvents({
      limit: 50
    }).subscribe({
      next: (response) => {
        // Filter for published events today or in the future, then get the 4 nearest
        const sortedEvents = response.data
          .filter((event: Event) => {
            // Only show published events (or events without status set)
            if (event.status && event.status !== 'published') {
              return false;
            }
            const eventDate = new Date(event.start_date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate >= today;
          })
          .sort((a: Event, b: Event) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
          .slice(0, 4);
        this.upcomingEvents.set(sortedEvents);
        this.eventsLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.eventsError.set(true);
        this.eventsLoading.set(false);
      }
    });
  }

  // Event helper methods
  formatEventDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getEventDay(dateString: string): string {
    return new Date(dateString).getDate().toString();
  }

  getEventMonth(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short' });
  }

  getEventYear(dateString: string): string {
    return new Date(dateString).getFullYear().toString();
  }

  getDaysUntilEvent(dateString: string): number {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getEventTimeStatus(dateString: string): string {
    const days = this.getDaysUntilEvent(dateString);
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days <= 7) return `In ${days} days`;
    if (days <= 30) return `In ${Math.ceil(days / 7)} weeks`;
    return `In ${Math.ceil(days / 30)} months`;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getRoleDisplayName(role: string): string {
    const roleNames: Record<string, string> = {
      'system_admin': 'System Administrator',
      'national_admin': 'National Administrator',
      'region_admin': 'Regional Administrator',
      'zone_admin': 'Zone Administrator',
      'school_admin': 'School Administrator'
    };
    return roleNames[role] || role;
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
