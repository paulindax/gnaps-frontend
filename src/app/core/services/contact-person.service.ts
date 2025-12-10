import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ContactPerson } from '../models';
import { ApiService } from './api.service';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ContactPersonResponse {
  data: ContactPerson;
  message?: string;
}

export interface ContactPersonQueryParams {
  [key: string]: string | number | boolean | undefined;
  school_id?: number;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  mobile_no?: string;
  relation?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ContactPersonService {
  private readonly apiService = inject(ApiService);

  /**
   * Retrieves contact persons with optional filtering and pagination
   * Backend endpoint: GET /api/contact_persons/list
   */
  getContactPersons(params?: ContactPersonQueryParams): Observable<PaginatedResponse<ContactPerson>> {
    return this.apiService.get<PaginatedResponse<ContactPerson>>('/contact_persons/list', { params: params as any });
  }

  /**
   * Retrieves contact persons by school ID
   * Backend endpoint: GET /api/contact_persons/list?school_id=schoolId
   */
  getContactPersonsBySchool(schoolId: number): Observable<PaginatedResponse<ContactPerson>> {
    return this.getContactPersons({ school_id: schoolId, limit: 100 });
  }

  /**
   * Creates a new contact person
   * Backend endpoint: POST /api/contact_persons/create
   */
  createContactPerson(contactPerson: Partial<ContactPerson>): Observable<ContactPersonResponse> {
    return this.apiService.post<ContactPersonResponse>('/contact_persons/create', contactPerson);
  }

  /**
   * Retrieves a single contact person by ID
   * Backend endpoint: GET /api/contact_persons/show/:id
   */
  getContactPerson(id: number): Observable<ContactPersonResponse> {
    return this.apiService.get<ContactPersonResponse>(`/contact_persons/show/${id}`);
  }

  /**
   * Updates an existing contact person
   * Backend endpoint: PUT /api/contact_persons/update/:id
   */
  updateContactPerson(id: number, contactPerson: Partial<ContactPerson>): Observable<ContactPersonResponse> {
    return this.apiService.put<ContactPersonResponse>(`/contact_persons/update/${id}`, contactPerson);
  }

  /**
   * Deletes a contact person
   * Backend endpoint: DELETE /api/contact_persons/delete/:id
   */
  deleteContactPerson(id: number): Observable<{ message: string }> {
    return this.apiService.delete<{ message: string }>(`/contact_persons/delete/${id}`);
  }
}
