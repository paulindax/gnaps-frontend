import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { News, NewsComment } from '../models';
import { ApiService } from './api.service';
import { PaginatedResponse } from './settings.service';

interface ApiResponse<T> {
  message?: string;
  data: T;
}

/**
 * News Service for managing news articles
 * Provides CRUD operations and filtering for news management
 */
@Injectable({ providedIn: 'root' })
export class NewsService {
  private readonly apiService = inject(ApiService);

  // ==================== NEWS CRUD OPERATIONS ====================

  /**
   * Get all news with pagination and optional filters
   */
  getNews(
    page: number = 1,
    limit: number = 10,
    filters?: {
      status?: 'draft' | 'published';
      category?: string;
      featured?: boolean;
      search?: string;
    }
  ): Observable<PaginatedResponse<News>> {
    let url = `/news/list?page=${page}&limit=${limit}`;

    if (filters?.status) {
      url += `&status=${filters.status}`;
    }
    if (filters?.category) {
      url += `&category=${encodeURIComponent(filters.category)}`;
    }
    if (filters?.featured !== undefined) {
      url += `&featured=${filters.featured}`;
    }
    if (filters?.search) {
      url += `&title=${encodeURIComponent(filters.search)}`;
    }

    return this.apiService.get<PaginatedResponse<News>>(url);
  }

  /**
   * Get a single news article by ID
   */
  getNewsById(id: number): Observable<News> {
    return this.apiService.get<ApiResponse<News>>(`/news/show?id=${id}`)
      .pipe(map(response => response.data));
  }

  /**
   * Create a new news article
   */
  createNews(data: Partial<News>): Observable<News> {
    return this.apiService.post<ApiResponse<News>>('/news/create', data)
      .pipe(map(response => response.data));
  }

  /**
   * Update an existing news article
   */
  updateNews(id: number, data: Partial<News>): Observable<News> {
    return this.apiService.put<ApiResponse<News>>(`/news/update?id=${id}`, data)
      .pipe(map(response => response.data));
  }

  /**
   * Delete a news article
   */
  deleteNews(id: number): Observable<void> {
    return this.apiService.get<void>(`/news/delete?id=${id}`);
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get featured news
   */
  getFeaturedNews(limit: number = 5): Observable<News[]> {
    return this.getNews(1, limit, { featured: true, status: 'published' })
      .pipe(map(response => response.data));
  }

  /**
   * Get published news only
   */
  getPublishedNews(page: number = 1, limit: number = 10): Observable<PaginatedResponse<News>> {
    return this.getNews(page, limit, { status: 'published' });
  }

  /**
   * Search news by title or content
   */
  searchNews(query: string, page: number = 1, limit: number = 10): Observable<PaginatedResponse<News>> {
    return this.getNews(page, limit, { search: query, status: 'published' });
  }

  /**
   * Get news by category
   */
  getNewsByCategory(category: string, page: number = 1, limit: number = 10): Observable<PaginatedResponse<News>> {
    return this.getNews(page, limit, { category, status: 'published' });
  }

  // ==================== COMMENTS OPERATIONS ====================

  /**
   * Get comments for a news article
   */
  getComments(newsId: number, page: number = 1, limit: number = 20): Observable<PaginatedResponse<NewsComment>> {
    let url = `/news/list_comments?news_id=${newsId}&page=${page}&limit=${limit}&is_approved=true`;
    return this.apiService.get<PaginatedResponse<NewsComment>>(url);
  }

  /**
   * Get all comments (for admin - includes unapproved)
   */
  getAllComments(newsId: number, page: number = 1, limit: number = 20): Observable<PaginatedResponse<NewsComment>> {
    let url = `/news/list_comments?news_id=${newsId}&page=${page}&limit=${limit}`;
    return this.apiService.get<PaginatedResponse<NewsComment>>(url);
  }

  /**
   * Create a new comment
   */
  createComment(data: { news_id: number; content: string; user_id?: string }): Observable<NewsComment> {
    return this.apiService.post<ApiResponse<NewsComment>>('/news/create_comment', data)
      .pipe(map(response => response.data));
  }

  /**
   * Update a comment
   */
  updateComment(id: number, content: string): Observable<NewsComment> {
    return this.apiService.put<ApiResponse<NewsComment>>(`/news/update_comment?id=${id}`, { content })
      .pipe(map(response => response.data));
  }

  /**
   * Delete a comment
   */
  deleteComment(id: number): Observable<void> {
    return this.apiService.get<void>(`/news/delete_comment?id=${id}`);
  }

  /**
   * Approve a comment (admin only)
   */
  approveComment(id: number): Observable<NewsComment> {
    return this.apiService.get<ApiResponse<NewsComment>>(`/news/approve_comment?id=${id}`)
      .pipe(map(response => response.data));
  }
}
