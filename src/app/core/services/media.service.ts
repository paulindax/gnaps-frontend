import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MediaUploadResponse {
  success: boolean;
  url: string;
  filename: string;
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

    return this.http.post<MediaUploadResponse>(`${this.baseUrl}/media/upload`, formData);
  }

  getImageUrl(path: string): string {
    if (!path) return '';

    // If path already contains http, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // If path starts with /uploads, prepend API base URL (without /api)
    if (path.startsWith('/uploads')) {
      const apiBase = this.baseUrl.replace('/api', '');
      return `${apiBase}${path}`;
    }

    return path;
  }
}
