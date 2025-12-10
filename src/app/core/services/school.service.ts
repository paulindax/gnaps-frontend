import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { School } from '../models';
import { ApiService } from './api.service';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface SchoolResponse {
  data: School;
  message?: string;
}

export interface SchoolsQueryParams {
  [key: string]: string | number | boolean | undefined;
  zone_id?: number;
  name?: string;
  member_no?: string;
  email?: string;
  mobile_no?: string;
  school_group_id?: number;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class SchoolService {
  private readonly apiService = inject(ApiService);

  /**
   * Retrieves all schools with optional filtering and pagination
   * Backend endpoint: GET /api/schools/list
   */
  getSchools(params?: SchoolsQueryParams): Observable<PaginatedResponse<School>> {
    return this.apiService.get<PaginatedResponse<School>>('/schools/list', { params: params as any });
  }

  /**
   * Creates a new school (admission)
   * Backend endpoint: POST /api/schools/create
   */
  admitSchool(school: Partial<School>): Observable<SchoolResponse> {
    return this.apiService.post<SchoolResponse>('/schools/create', school);
  }

  /**
   * Retrieves a single school by ID
   * Backend endpoint: GET /api/schools/show/:id
   */
  getSchool(id: number): Observable<SchoolResponse> {
    return this.apiService.get<SchoolResponse>(`/schools/show/${id}`);
  }

  /**
   * Updates an existing school
   * Backend endpoint: PUT /api/schools/update/:id
   */
  updateSchool(id: number, school: Partial<School>): Observable<SchoolResponse> {
    return this.apiService.put<SchoolResponse>(`/schools/update/${id}`, school);
  }

  /**
   * Soft deletes a school
   * Backend endpoint: DELETE /api/schools/delete/:id
   */
  deleteSchool(id: number): Observable<{ message: string }> {
    return this.apiService.delete<{ message: string }>(`/schools/delete/${id}`);
  }

  /**
   * Searches schools by name
   * Backend endpoint: GET /api/schools/list?name=searchTerm
   */
  searchSchools(searchTerm: string, page: number = 1, limit: number = 10): Observable<PaginatedResponse<School>> {
    return this.getSchools({ name: searchTerm, page, limit });
  }

  /**
   * Gets schools by zone
   * Backend endpoint: GET /api/schools/list?zone_id=zoneId
   */
  getSchoolsByZone(zoneId: number, page: number = 1, limit: number = 10): Observable<PaginatedResponse<School>> {
    return this.getSchools({ zone_id: zoneId, page, limit });
  }

  /**
   * Gets the next available member number for a zone
   * Backend endpoint: GET /api/schools/next_member_no?zone_id=zoneId
   */
  getNextMemberNo(zoneId: number): Observable<{ member_no: string }> {
    return this.apiService.get<{ member_no: string }>('/schools/next_member_no', { params: { zone_id: zoneId } });
  }
}
