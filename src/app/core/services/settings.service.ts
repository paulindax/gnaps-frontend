import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Region, Zone, Position, Group } from '../models';

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

/**
 * Settings Service for managing Regions, Zones, and Positions
 * Provides CRUD operations for organizational hierarchy
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly apiService = inject(ApiService);

  // ==================== REGIONS ====================

  /**
   * Get all regions with pagination and optional search
   */
  getRegions(page: number = 1, limit: number = 10, search?: string): Observable<PaginatedResponse<Region>> {
    let url = `/regions/list?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    console.log('[SettingsService] getRegions URL:', url, 'search param:', search);
    return this.apiService.get<PaginatedResponse<Region>>(url);
  } 

  /**
   * Get a single region by ID
   */
  getRegionById(id: number): Observable<Region> {
    return this.apiService.get<ApiResponse<Region>>(`/regions/show?id=${id}`)
      .pipe(map(response => response.data));
  }

  /**
   * Create a new region
   */
  createRegion(data: Partial<Region>): Observable<Region> {
    return this.apiService.post<ApiResponse<Region>>('/regions/create', data)
      .pipe(map(response => response.data));
  }

  /**
   * Update an existing region
   */
  updateRegion(id: number, data: Partial<Region>): Observable<Region> {
    return this.apiService.put<ApiResponse<Region>>(`/regions/update?id=${id}`, data)
      .pipe(map(response => response.data));
  }

  /**
   * Delete a region
   */
  deleteRegion(id: number): Observable<void> {
    return this.apiService.get<void>(`/regions/delete?id=${id}`);
  }

  // ==================== ZONES ====================

  /**
   * Get all zones with pagination and optional search
   */
  getZones(page: number = 1, limit: number = 10, regionId?: number, search?: string): Observable<PaginatedResponse<Zone>> {
    let url = `/zones/list?page=${page}&limit=${limit}`;
    if (regionId) {
      url += `&region_id=${regionId}`;
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return this.apiService.get<PaginatedResponse<Zone>>(url);
  }

  /**
   * Get zones by region ID
   */
  getZonesByRegion(regionId: number): Observable<Zone[]> {
    return this.getZones(1, 100, regionId)
      .pipe(map(response => response.data));
  }

  /**
   * Get a single zone by ID
   */
  getZoneById(id: number): Observable<Zone> {
    return this.apiService.get<ApiResponse<Zone>>(`/zones/show?id=${id}`)
      .pipe(map(response => response.data));
  }

  /**
   * Create a new zone
   */
  createZone(data: Partial<Zone>): Observable<Zone> {
    return this.apiService.post<ApiResponse<Zone>>('/zones/create', data)
      .pipe(map(response => response.data));
  }

  /**
   * Update an existing zone
   */
  updateZone(id: number, data: Partial<Zone>): Observable<Zone> {
    return this.apiService.put<ApiResponse<Zone>>(`/zones/update?id=${id}`, data)
      .pipe(map(response => response.data));
  }

  /**
   * Delete a zone
   */
  deleteZone(id: number): Observable<void> {
    return this.apiService.get<void>(`/zones/delete?id=${id}`);
  }

  // ==================== POSITIONS ====================

  /**
   * Get all positions with pagination and optional search
   */
  getPositions(page: number = 1, limit: number = 10, search?: string): Observable<PaginatedResponse<Position>> {
    let url = `/positions/list?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return this.apiService.get<PaginatedResponse<Position>>(url);
  }

  /**
   * Get a single position by ID
   */
  getPositionById(id: number): Observable<Position> {
    return this.apiService.get<ApiResponse<Position>>(`/positions/show?id=${id}`)
      .pipe(map(response => response.data));
  }

  /**
   * Create a new position
   */
  createPosition(data: Partial<Position>): Observable<Position> {
    return this.apiService.post<ApiResponse<Position>>('/positions/create', data)
      .pipe(map(response => response.data));
  }

  /**
   * Update an existing position
   */
  updatePosition(id: number, data: Partial<Position>): Observable<Position> {
    return this.apiService.put<ApiResponse<Position>>(`/positions/update?id=${id}`, data)
      .pipe(map(response => response.data));
  }

  /**
   * Delete a position
   */
  deletePosition(id: number): Observable<void> {
    return this.apiService.get<void>(`/positions/delete?id=${id}`);
  }

  // ==================== GROUPS ====================

  /**
   * Get all groups with pagination, optional zone filter, and optional search
   */
  getGroups(page: number = 1, limit: number = 10, zoneId?: number, search?: string): Observable<PaginatedResponse<Group>> {
    let url = `/groups/list?page=${page}&limit=${limit}`;
    if (zoneId) {
      url += `&zone_id=${zoneId}`;
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return this.apiService.get<PaginatedResponse<Group>>(url);
  }

  /**
   * Get groups by zone ID
   */
  getGroupsByZone(zoneId: number): Observable<Group[]> {
    return this.getGroups(1, 100, zoneId)
      .pipe(map(response => response.data));
  }

  /**
   * Get a single group by ID
   */
  getGroupById(id: number): Observable<Group> {
    return this.apiService.get<ApiResponse<Group>>(`/groups/show?id=${id}`)
      .pipe(map(response => response.data));
  }

  /**
   * Create a new group
   */
  createGroup(data: Partial<Group>): Observable<Group> {
    return this.apiService.post<ApiResponse<Group>>('/groups/create', data)
      .pipe(map(response => response.data));
  }

  /**
   * Update an existing group
   */
  updateGroup(id: number, data: Partial<Group>): Observable<Group> {
    return this.apiService.put<ApiResponse<Group>>(`/groups/update?id=${id}`, data)
      .pipe(map(response => response.data));
  }

  /**
   * Delete a group
   */
  deleteGroup(id: number): Observable<void> {
    return this.apiService.get<void>(`/groups/delete?id=${id}`);
  }
}
