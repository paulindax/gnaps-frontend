import { Component, inject, OnInit, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NewsService } from '../../../core/services/news.service';

@Component({
  selector: 'app-mobile-news-detail',
  standalone: true,
  imports: [],
  templateUrl: './mobile-news-detail.component.html',
  styleUrl: './mobile-news-detail.component.css'
})
export class MobileNewsDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  location = inject(Location);
  newsService = inject(NewsService);

  article = signal<any>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadArticle(id);
    }
  }

  loadArticle(id: string): void {
    this.loading.set(true);
    this.newsService.getNewsById(+id).subscribe({
      next: (response: any) => {
        this.article.set(response.data || response);
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

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:3020${path.startsWith('/') ? '' : '/'}${path}`;
  }

  share(platform: string): void {
    const url = window.location.href;
    const title = this.article()?.title || 'GNAPS News';

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(title + ' - ' + url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url).then(() => {
          alert('Link copied to clipboard!');
        });
        break;
    }
  }
}
