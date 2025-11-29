import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Zone } from '../models';
import { ApiService } from './api.service';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ZoneResponse {
  data: Zone;
  message?: string;
}

export interface ZonesQueryParams {
  [key: string]: string | number | boolean | undefined;
  region_id?: number;
  name?: string;
  code?: string;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ZoneService {
  private readonly apiService = inject(ApiService);

  /**
   * Retrieves all zones with optional filtering and pagination
   * Backend endpoint: GET /api/zones/list
   */
  getZones(params?: ZonesQueryParams): Observable<PaginatedResponse<Zone>> {
    return this.apiService.get<PaginatedResponse<Zone>>('/zones/list', { params: params as any });
  }

  /**
   * Creates a new zone
   * Backend endpoint: POST /api/zones/create
   */
  createZone(zone: Partial<Zone>): Observable<ZoneResponse> {
    return this.apiService.post<ZoneResponse>('/zones/create', zone);
  }

  /**
   * Retrieves a single zone by ID
   * Backend endpoint: GET /api/zones/show/:id
   */
  getZone(id: number): Observable<ZoneResponse> {
    return this.apiService.get<ZoneResponse>(`/zones/show/${id}`);
  }

  /**
   * Updates an existing zone
   * Backend endpoint: PUT /api/zones/update/:id
   */
  updateZone(id: number, zone: Partial<Zone>): Observable<ZoneResponse> {
    return this.apiService.put<ZoneResponse>(`/zones/update/${id}`, zone);
  }

  /**
   * Soft deletes a zone
   * Backend endpoint: DELETE /api/zones/delete/:id
   */
  deleteZone(id: number): Observable<{ message: string }> {
    return this.apiService.delete<{ message: string }>(`/zones/delete/${id}`);
  }

  /**
   * Gets zones by region
   * Backend endpoint: GET /api/zones/list?region_id=regionId
   */
  getZonesByRegion(regionId: number, page: number = 1, limit: number = 100): Observable<PaginatedResponse<Zone>> {
    return this.getZones({ region_id: regionId, page, limit });
  }

  /**
   * Searches zones by name or code
   * Backend endpoint: GET /api/zones/list?search=searchTerm
   */
  searchZones(searchTerm: string, page: number = 1, limit: number = 10): Observable<PaginatedResponse<Zone>> {
    return this.getZones({ search: searchTerm, page, limit });
  }
}
