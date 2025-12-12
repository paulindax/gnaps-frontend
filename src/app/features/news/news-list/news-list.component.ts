import { Component, signal, inject, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { News } from '../../../core/models';
import { NewsService } from '../../../core/services/news.service';
import { AuthService } from '../../../core/services/auth.service';
import { MediaService } from '../../../core/services/media.service';
import { ButtonHelmComponent } from '../../../shared/ui/button-helm/button-helm.component';

const DEFAULT_NEWS_IMAGE = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80';

@Component({
  selector: 'app-news-list',
  standalone: true,
  imports: [FormsModule, ButtonHelmComponent],
  templateUrl: './news-list.component.html'
})
export class NewsListComponent implements OnInit {
  private newsService = inject(NewsService);
  private authService = inject(AuthService);
  private mediaService = inject(MediaService);
  private router = inject(Router);

  protected readonly Math = Math;

  // Signals
  news = signal<News[]>([]);
  featuredNews = signal<News[]>([]);
  loading = signal(false);
  searchQuery = signal('');
  selectedCategory = signal<string>('');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(9);
  totalItems = signal(0);
  totalPages = signal(0);

  role = this.authService.userRole;

  categories = ['General', 'Events', 'Announcements', 'Updates', 'Important'];

  canManageNews = () => {
    const userRole = this.role();
    return userRole !== 'school_admin' && userRole !== null;
  };

  ngOnInit(): void {
    this.loadFeaturedNews();
    this.loadNews();
  }

  loadFeaturedNews(): void {
    this.newsService.getFeaturedNews(3).subscribe({
      next: (featured) => {
        this.featuredNews.set(featured);
      },
      error: (error) => console.error('Error loading featured news:', error)
    });
  }

  loadNews(): void {
    this.loading.set(true);
    const filters: any = { status: 'published' as const };

    if (this.searchQuery()) {
      filters.search = this.searchQuery();
    }

    if (this.selectedCategory()) {
      filters.category = this.selectedCategory();
    }

    this.newsService.getNews(this.currentPage(), this.pageSize(), filters).subscribe({
      next: (response) => {
        this.news.set(response.data);
        this.totalItems.set(response.pagination.total);
        this.totalPages.set(Math.ceil(response.pagination.total / response.pagination.limit));
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading news:', error);
        this.loading.set(false);
      }
    });
  }

  onSearchChange(): void {
    this.currentPage.set(1);
    this.loadNews();
  }

  onCategoryChange(category: string): void {
    this.selectedCategory.set(category === this.selectedCategory() ? '' : category);
    this.currentPage.set(1);
    this.loadNews();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadNews();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  viewNews(newsId: number): void {
    this.router.navigate(['/news', newsId]);
  }

  navigateToManagement(): void {
    this.router.navigate(['/news/manage']);
  }

  navigateToCreate(): void {
    this.router.navigate(['/news/create']);
  }

  getExcerpt(news: News): string {
    if (news.excerpt) return news.excerpt;
    return news.content.substring(0, 150) + '...';
  }

  getImageUrl(news: News): string {
    return this.mediaService.getImageUrl(news.image_url, DEFAULT_NEWS_IMAGE);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
