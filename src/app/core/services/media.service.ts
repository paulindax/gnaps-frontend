import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface MediaUploadResponse {
  success: boolean;
  url: string;
  filename: string;
}

interface ApiMediaUploadResponse {
  success: boolean;
  data: {
    url: string;
    filename: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  uploadImage(file: File): Observable<MediaUploadResponse> {
    return this.uploadMedia(file);
  }

  uploadMedia(file: File): Observable<MediaUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiMediaUploadResponse>(`${this.baseUrl}/media/upload`, formData).pipe(
      map(response => ({
        success: response.success,
        url: response.data.url,
        filename: response.data.filename
      }))
    );
  }

  /**
   * Converts a relative image path to a full URL
   * Use this method for all image URLs from the backend
   * @param path - The image path (e.g., '/uploads/image.jpg' or full URL)
   * @param fallback - Optional fallback URL if path is empty
   * @returns Full image URL
   */
  getImageUrl(path: string | undefined | null, fallback?: string): string {
    if (!path) return fallback || '';

    // If path already contains http, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // For any relative path, prepend the static URL
    const staticUrl = this.baseUrl.replace('/api', '');
    return `${staticUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }
}
