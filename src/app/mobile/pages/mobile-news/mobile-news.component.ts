import { Component, inject, OnInit, signal } from '@angular/core';

import { Router, RouterLink } from '@angular/router';
import { NewsService } from '../../../core/services/news.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-mobile-news',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './mobile-news.component.html',
  styleUrl: './mobile-news.component.css'
})
export class MobileNewsComponent implements OnInit {
  newsService = inject(NewsService);
  router = inject(Router);

  news = signal<any[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(false);

  currentPage = 1;
  pageSize = 10;

  ngOnInit(): void {
    this.loadNews();
  }

  loadNews(append = false): void {
    if (!append) {
      this.loading.set(true);
      this.currentPage = 1;
    } else {
      this.loadingMore.set(true);
    }

    this.newsService.getNews(this.currentPage, this.pageSize, { status: 'published' }).subscribe({
      next: (response) => {
        const newNews = response.data || [];

        if (append) {
          this.news.update(current => [...current, ...newNews]);
        } else {
          this.news.set(newNews);
        }

        const total = response.pagination?.total || newNews.length;
        this.hasMore.set(this.news().length < total && newNews.length === this.pageSize);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadingMore.set(false);
      }
    });
  }

  loadMore(): void {
    this.currentPage++;
    this.loadNews(true);
  }

  getExcerpt(content: string): string {
    if (!content) return '';
    const text = content.replace(/<[^>]*>/g, '');
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${environment.staticUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }
}
