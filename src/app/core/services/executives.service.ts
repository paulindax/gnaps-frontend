import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Executive } from '../models';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

interface ApiResponse<T> {
  message?: string;
  data: T;
}

export interface ExecutiveFormData {
  first_name: string;
  last_name: string;
  email: string;
  mobile_no?: string;
  position_id?: number;
  role: 'national_admin' | 'region_admin' | 'zone_admin';
  region_id?: number;
  zone_id?: number;
  status?: 'active' | 'inactive';
  bio?: string;
}

@Injectable({ providedIn: 'root' })
export class ExecutivesService {
  private readonly apiService = inject(ApiService);

  /**
   * Get all executives with pagination and optional filters
   */
  getExecutives(
    page: number = 1,
    limit: number = 10,
    search?: string,
    role?: string,
    regionId?: number,
    zoneId?: number,
    positionId?: number
  ): Observable<PaginatedResponse<Executive>> {
    let url = `/executives/list?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    if (role) {
      url += `&role=${encodeURIComponent(role)}`;
    }
    if (regionId) {
      url += `&region_id=${regionId}`;
    }
    if (zoneId) {
      url += `&zone_id=${zoneId}`;
    }
    if (positionId) {
      url += `&position_id=${positionId}`;
    }
    return this.apiService.get<PaginatedResponse<Executive>>(url);
  }

  /**
   * Get a single executive by ID
   */
  getExecutiveById(id: number): Observable<Executive> {
    return this.apiService.get<ApiResponse<Executive>>(`/executives/show?id=${id}`)
      .pipe(map(response => response.data));
  }

  /**
   * Create a new executive
   */
  createExecutive(data: ExecutiveFormData): Observable<Executive> {
    return this.apiService.post<ApiResponse<Executive>>('/executives/create', data)
      .pipe(map(response => response.data));
  }

  /**
   * Update an existing executive
   */
  updateExecutive(id: number, data: Partial<ExecutiveFormData>): Observable<Executive> {
    return this.apiService.put<ApiResponse<Executive>>(`/executives/update?id=${id}`, data)
      .pipe(map(response => response.data));
  }

  /**
   * Delete an executive
   */
  deleteExecutive(id: number): Observable<void> {
    return this.apiService.get<void>(`/executives/delete?id=${id}`);
  }

  /**
   * Toggle executive status (active/inactive)
   */
  toggleStatus(id: number): Observable<Executive> {
    return this.apiService.post<ApiResponse<Executive>>(`/executives/toggle-status?id=${id}`, {})
      .pipe(map(response => response.data));
  }
}
