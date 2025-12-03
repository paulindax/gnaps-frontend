import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { NewsService } from '../../core/services/news.service';
import { News } from '../../core/models';
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
  private router = inject(Router);

  // Signals
  role = this.authService.userRole;
  stats = this.dashboardService.stats;
  recentNews = signal<News[]>([]);
  newsLoading = signal<boolean>(true);
  newsError = signal<boolean>(false); 

  constructor() {
    // Auto-load stats when role is available
    effect(() => {
      if (this.role()) {
        this.dashboardService.refreshStats();
      }
    });

    // Load recent news (latest 3) 
    this.loadRecentNews();
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getRoleDisplayName(role: string): string {
    const roleNames: Record<string, string> = {
      'system_admin': 'System Administrator',
      'national_admin': 'National Administrator',
      'regional_admin': 'Regional Administrator',
      'zone_admin': 'Zone Administrator',
      'school_user': 'School Administrator'
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
