import { Component, inject, OnInit, signal } from '@angular/core';

import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { EventService } from '../../../core/services/event.service';
import { NewsService } from '../../../core/services/news.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-mobile-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './mobile-dashboard.component.html',
  styleUrl: './mobile-dashboard.component.css'
})
export class MobileDashboardComponent implements OnInit {
  authService = inject(AuthService);
  dashboardService = inject(DashboardService);
  eventService = inject(EventService);
  newsService = inject(NewsService);
  router = inject(Router);

  stats = signal<any[]>([]);
  upcomingEvents = signal<any[]>([]);
  latestNews = signal<any[]>([]);
  eventsLoading = signal(true);
  newsLoading = signal(true);

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadUpcomingEvents();
    this.loadLatestNews();
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  private loadDashboardData(): void {
    const userRole = this.authService.currentUserSignal()?.role || '';

    if (['system_admin', 'national_admin', 'region_admin', 'zone_admin'].includes(userRole)) {
      this.dashboardService.getDashboardStats().subscribe({
        next: (response) => {
          const data = response.data || response;
          const summary = data.summary || data;
          this.stats.set([
            { label: 'Schools', value: summary.total_schools || 0 },
            { label: 'Events', value: summary.total_events || 0 },
            { label: 'News', value: summary.total_news || 0 },
            { label: 'Executives', value: summary.total_executives || 0 }
          ]);
        },
        error: () => {
          this.stats.set([
            { label: 'Schools', value: '-' },
            { label: 'Events', value: '-' },
            { label: 'News', value: '-' },
            { label: 'Executives', value: '-' }
          ]);
        }
      });
    } else {
      this.stats.set([]);
    }
  }

  private loadUpcomingEvents(): void {
    this.eventsLoading.set(true);
    this.eventService.getEvents({ limit: 50 }).subscribe({
      next: (response) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const events = (response.data || [])
          .filter((event: any) => {
            if (event.status && event.status !== 'published') return false;
            const eventDate = new Date(event.start_date);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate >= today;
          })
          .sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
          .slice(0, 3);

        this.upcomingEvents.set(events);
        this.eventsLoading.set(false);
      },
      error: () => {
        this.eventsLoading.set(false);
      }
    });
  }

  private loadLatestNews(): void {
    this.newsLoading.set(true);
    this.newsService.getNews(1, 3, { status: 'published' }).subscribe({
      next: (response) => {
        this.latestNews.set(response.data || []);
        this.newsLoading.set(false);
      },
      error: () => {
        this.newsLoading.set(false);
      }
    });
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

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${environment.staticUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }
}
