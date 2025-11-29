import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { News } from '../../../core/models';
import { NewsService } from '../../../core/services/news.service';
import { AuthService } from '../../../core/services/auth.service';
import { ButtonHelmComponent } from '../../../shared/ui/button-helm/button-helm.component';
import { DataTableComponent, TableColumn, TableAction, PaginationData } from '../../../shared/ui/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-news-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, ButtonHelmComponent, DataTableComponent, ConfirmDialogComponent],
  templateUrl: './news-manage.component.html'
})
export class NewsManageComponent implements OnInit {
  private newsService = inject(NewsService);
  private authService = inject(AuthService);
  private router = inject(Router);

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

  // Table configuration
  tableColumns: TableColumn<News>[] = [
    { header: 'Title', field: 'title' },
    {
      header: 'Status',
      render: (item) => {
        const statusClass = item.status === 'published'
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        return `<span class="inline-block rounded-full px-2 py-1 text-xs font-medium ${statusClass}">${item.status}</span>`;
      }
    },
    { header: 'Category', field: 'category' },
    {
      header: 'Featured',
      render: (item) => item.featured
        ? '<span class="text-amber-500">★ Featured</span>'
        : ''
    },
    {
      header: 'Created',
      render: (item) => new Date(item.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  ];

  tableActions: TableAction<News>[] = [
    {
      label: 'View',
      onClick: (news) => this.viewNews(news),
      class: 'mr-2 text-primary hover:underline'
    },
    {
      label: 'Edit',
      onClick: (news) => this.editNews(news),
      class: 'mr-2 text-primary hover:underline'
    },
    {
      label: 'Delete',
      onClick: (news) => this.openDeleteDialog(news),
      class: 'text-destructive hover:underline'
    }
  ];

  paginationData = signal<PaginationData>({
    currentPage: 1,
    totalPages: 0,
    pageSize: 10,
    totalItems: 0
  });

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

        this.paginationData.set({
          currentPage: this.currentPage(),
          totalPages: this.totalPages(),
          pageSize: this.pageSize(),
          totalItems: this.totalItems()
        });

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
