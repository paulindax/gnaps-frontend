import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { NewsService } from '../../core/services/news.service';
import { News } from '../../core/models';
import { CardHelmComponent } from '../../shared/ui/card-helm/card-helm.component';
import { ButtonHelmComponent } from '../../shared/ui/button-helm/button-helm.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardHelmComponent, ButtonHelmComponent, RouterLink],
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
}
