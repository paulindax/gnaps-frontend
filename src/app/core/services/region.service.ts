import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Region } from '../models';
import { ApiService } from './api.service';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface RegionResponse {
  data: Region;
  message?: string;
}

export interface RegionsQueryParams {
  [key: string]: string | number | boolean | undefined;
  name?: string;
  code?: string;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class RegionService {
  private readonly apiService = inject(ApiService);

  /**
   * Retrieves all regions with optional filtering and pagination
   * Backend endpoint: GET /api/regions/list
   */
  getRegions(params?: RegionsQueryParams): Observable<PaginatedResponse<Region>> {
    return this.apiService.get<PaginatedResponse<Region>>('/regions/list', { params: params as any });
  }

  /**
   * Creates a new region
   * Backend endpoint: POST /api/regions/create
   */
  createRegion(region: Partial<Region>): Observable<RegionResponse> {
    return this.apiService.post<RegionResponse>('/regions/create', region);
  }

  /**
   * Retrieves a single region by ID
   * Backend endpoint: GET /api/regions/show/:id
   */
  getRegion(id: number): Observable<RegionResponse> {
    return this.apiService.get<RegionResponse>(`/regions/show/${id}`);
  }

  /**
   * Updates an existing region
   * Backend endpoint: PUT /api/regions/update/:id
   */
  updateRegion(id: number, region: Partial<Region>): Observable<RegionResponse> {
    return this.apiService.put<RegionResponse>(`/regions/update/${id}`, region);
  }

  /**
   * Soft deletes a region
   * Backend endpoint: DELETE /api/regions/delete/:id
   */
  deleteRegion(id: number): Observable<{ message: string }> {
    return this.apiService.delete<{ message: string }>(`/regions/delete/${id}`);
  }

  /**
   * Searches regions by name or code
   * Backend endpoint: GET /api/regions/list?search=searchTerm
   */
  searchRegions(searchTerm: string, page: number = 1, limit: number = 10): Observable<PaginatedResponse<Region>> {
    return this.getRegions({ search: searchTerm, page, limit });
  }
}
