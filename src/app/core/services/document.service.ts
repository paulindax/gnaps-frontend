import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Document, DocumentSubmission } from '../models';

export interface DocumentListResponse {
  data: Document[];
  total: number;
  page: number;
  limit: number;
}

export interface SubmissionListResponse {
  data: DocumentSubmission[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/documents`;

  // Document CRUD
  getDocuments(params?: { page?: number; limit?: number; status?: string; category?: string }): Observable<DocumentListResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<DocumentListResponse>(`${this.baseUrl}/list`, { params: httpParams });
  }

  getDocumentById(id: number): Observable<Document> {
    return this.http.get<Document>(`${this.baseUrl}/show/${id}`);
  }

  createDocument(document: Partial<Document>): Observable<Document> {
    // Convert template_data to JSON string if it's an array
    const payload = {
      ...document,
      template_data: JSON.stringify(document.template_data || [])
    };
    return this.http.post<Document>(`${this.baseUrl}/create`, payload);
  }

  updateDocument(id: number, document: Partial<Document>): Observable<Document> {
    // Convert template_data to JSON string if it's an array
    const payload = {
      ...document,
      template_data: document.template_data ? JSON.stringify(document.template_data) : undefined
    };
    return this.http.put<Document>(`${this.baseUrl}/update/${id}`, payload);
  }

  deleteDocument(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`);
  }

  // Submission CRUD
  submitDocument(submission: Partial<DocumentSubmission>): Observable<DocumentSubmission> {
    // Convert form_data to JSON string
    const payload = {
      ...submission,
      form_data: JSON.stringify(submission.form_data || {})
    };
    return this.http.post<DocumentSubmission>(`${this.baseUrl}/submit`, payload);
  }

  getSubmissions(params?: {
    page?: number;
    limit?: number;
    document_id?: number;
    school_id?: number;
    status?: string
  }): Observable<SubmissionListResponse> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof typeof params];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<SubmissionListResponse>(`${this.baseUrl}/submissions`, { params: httpParams });
  }

  getSubmissionById(id: number): Observable<DocumentSubmission> {
    return this.http.get<DocumentSubmission>(`${this.baseUrl}/submission/${id}`);
  }

  updateSubmission(id: number, submission: Partial<DocumentSubmission>): Observable<DocumentSubmission> {
    // Convert form_data to JSON string if it's present
    const payload = {
      ...submission,
      form_data: submission.form_data ? JSON.stringify(submission.form_data) : undefined
    };
    return this.http.put<DocumentSubmission>(`${this.baseUrl}/updateSubmission/${id}`, payload);
  }

  deleteSubmission(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/deleteSubmission/${id}`);
  }

  reviewSubmission(id: number, status: string, notes?: string): Observable<DocumentSubmission> {
    return this.http.post<DocumentSubmission>(`${this.baseUrl}/reviewSubmission/${id}`, {
      status,
      review_notes: notes
    });
  }
}
