import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { News } from '../../../core/models';
import { MediaService } from '../../../core/services/media.service';

const DEFAULT_NEWS_IMAGE = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=60';

@Component({
  selector: 'app-news-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './news-card.component.html'
})
export class NewsCardComponent {
  private mediaService = inject(MediaService);

  // Input for news data
  news = input.required<News>();

  // Input for showing admin controls
  showAdminControls = input<boolean>(false);

  // Outputs for admin actions
  edit = output<News>();
  delete = output<News>();

  onEdit(): void {
    this.edit.emit(this.news());
  }

  onDelete(): void {
    this.delete.emit(this.news());
  }

  getExcerpt(): string {
    const newsItem = this.news();
    if (newsItem.excerpt) {
      return newsItem.excerpt;
    }
    // Generate excerpt from content (first 150 characters)
    if (newsItem.content) {
      const plainText = newsItem.content.replace(/<[^>]*>/g, '');
      return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
    }
    return '';
  }

  getImageUrl(): string {
    const newsItem = this.news();
    return this.mediaService.getImageUrl(newsItem.image_url, DEFAULT_NEWS_IMAGE);
  }
}
