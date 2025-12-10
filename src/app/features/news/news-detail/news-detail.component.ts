import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { News, NewsComment } from '../../../core/models';
import { NewsService } from '../../../core/services/news.service';
import { AuthService } from '../../../core/services/auth.service';
import { MediaService } from '../../../core/services/media.service';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog/confirm-dialog.component';

const DEFAULT_NEWS_IMAGE = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1600&auto=format&fit=crop&q=80';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './news-detail.component.html'
})
export class NewsDetailComponent implements OnInit {
  private newsService = inject(NewsService);
  private authService = inject(AuthService);
  private mediaService = inject(MediaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  news = signal<News | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // Comments
  comments = signal<NewsComment[]>([]);
  commentsLoading = signal(false);
  newCommentText = signal('');
  submittingComment = signal(false);

  // Comment editing
  editingCommentId = signal<number | null>(null);
  editCommentText = signal('');

  // Comment deletion
  showDeleteDialog = signal(false);
  commentToDelete = signal<NewsComment | null>(null);

  role = this.authService.userRole;

  canEdit = () => {
    const userRole = this.role();
    return userRole !== 'school_admin' && userRole !== null;
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const numericId = parseInt(id, 10);
      this.loadNews(numericId);
      this.loadComments(numericId);
    }
  }

  loadNews(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.newsService.getNewsById(id).subscribe({
      next: (news) => {
        this.news.set(news);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading news:', error);
        this.error.set('Failed to load news article');
        this.loading.set(false);
      }
    });
  }

  loadComments(newsId: number): void {
    this.commentsLoading.set(true);
    const loadMethod = this.canEdit()
      ? this.newsService.getAllComments(newsId, 1, 100)
      : this.newsService.getComments(newsId, 1, 100);

    loadMethod.subscribe({
      next: (response) => {
        this.comments.set(response.data);
        this.commentsLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading comments:', error);
        this.commentsLoading.set(false);
      }
    });
  }

  submitComment(): void {
    const text = this.newCommentText().trim();
    const newsId = this.news()?.id;

    if (!text || !newsId) return;

    this.submittingComment.set(true);

    const data: any = {
      news_id: newsId,
      content: text
    };

    this.newsService.createComment(data).subscribe({
      next: () => {
        this.newCommentText.set('');
        this.submittingComment.set(false);
        this.loadComments(newsId);
      },
      error: (error) => {
        console.error('Error posting comment:', error);
        this.submittingComment.set(false);
      }
    });
  }

  startEdit(comment: NewsComment): void {
    this.editingCommentId.set(comment.id);
    this.editCommentText.set(comment.content);
  }

  cancelEdit(): void {
    this.editingCommentId.set(null);
    this.editCommentText.set('');
  }

  saveEdit(commentId: number): void {
    const text = this.editCommentText().trim();
    if (!text) return;

    this.newsService.updateComment(commentId, text).subscribe({
      next: () => {
        this.editingCommentId.set(null);
        this.editCommentText.set('');
        const newsId = this.news()?.id;
        if (newsId) this.loadComments(newsId);
      },
      error: (error) => {
        console.error('Error updating comment:', error);
      }
    });
  }

  openDeleteDialog(comment: NewsComment): void {
    this.commentToDelete.set(comment);
    this.showDeleteDialog.set(true);
  }

  confirmDelete(): void {
    const comment = this.commentToDelete();
    if (!comment) return;

    this.newsService.deleteComment(comment.id).subscribe({
      next: () => {
        this.showDeleteDialog.set(false);
        this.commentToDelete.set(null);
        const newsId = this.news()?.id;
        if (newsId) this.loadComments(newsId);
      },
      error: (error) => {
        console.error('Error deleting comment:', error);
      }
    });
  }

  approveComment(commentId: number): void {
    this.newsService.approveComment(commentId).subscribe({
      next: () => {
        const newsId = this.news()?.id;
        if (newsId) this.loadComments(newsId);
      },
      error: (error) => {
        console.error('Error approving comment:', error);
      }
    });
  }

  formatCommentDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  navigateToEdit(): void {
    const newsItem = this.news();
    if (newsItem) {
      this.router.navigate(['/news/edit', newsItem.id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/news']);
  }

  getImageUrl(): string {
    const newsItem = this.news();
    return this.mediaService.getImageUrl(newsItem?.image_url, DEFAULT_NEWS_IMAGE);
  }
}
