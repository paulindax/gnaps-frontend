import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { News } from '../../../core/models';
import { NewsService } from '../../../core/services/news.service';
import { AuthService } from '../../../core/services/auth.service';
import { ButtonHelmComponent } from '../../../shared/ui/button-helm/button-helm.component';

@Component({
  selector: 'app-news-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, ButtonHelmComponent],
  templateUrl: './news-manage.component.html'
})
export class NewsManageComponent implements OnInit {
  private newsService = inject(NewsService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Expose Math for template
  protected readonly Math = Math;

  news = signal<News[]>([]);
  loading = signal(false);
  searchQuery = signal('');
  selectedStatus = signal<'draft' | 'published' | ''>('');
  selectedCategory = signal('');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  totalPages = signal(0);

  // Delete dialog
  showDeleteDialog = signal(false);
  newsToDelete = signal<News | null>(null);

  role = this.authService.userRole;

  categories = ['General', 'Events', 'Announcements', 'Updates', 'Important'];

  // Options for ng-select
  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' }
  ];

  categoryOptions = [
    { value: '', label: 'All Categories' },
    ...this.categories.map(cat => ({ value: cat, label: cat }))
  ];

  ngOnInit(): void {
    this.loadNews();
  }

  loadNews(): void {
    this.loading.set(true);
    const filters: any = {};

    if (this.searchQuery()) {
      filters.search = this.searchQuery();
    }

    if (this.selectedStatus()) {
      filters.status = this.selectedStatus();
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

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadNews();
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.loadNews();
  }

  onStatusFilter(status: 'draft' | 'published' | ''): void {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.loadNews();
  }

  onCategoryFilter(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
    this.loadNews();
  }

  viewNews(news: News): void {
    this.router.navigate(['/news', news.id]);
  }

  editNews(news: News): void {
    this.router.navigate(['/news/edit', news.id]);
  }

  createNews(): void {
    this.router.navigate(['/news/create']);
  }

  openDeleteDialog(news: News): void {
    this.newsToDelete.set(news);
    this.showDeleteDialog.set(true);
  }

  confirmDelete(): void {
    const news = this.newsToDelete();
    if (!news) return;

    this.loading.set(true);
    this.newsService.deleteNews(news.id).subscribe({
      next: () => {
        this.loadNews();
        this.showDeleteDialog.set(false);
        this.newsToDelete.set(null);
      },
      error: (error) => {
        console.error('Error deleting news:', error);
        this.loading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/news']);
  }
}
