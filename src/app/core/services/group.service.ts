import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Group } from '../models';
import { ApiService } from './api.service';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface GroupResponse {
  data: Group;
  message?: string;
}

export interface GroupsQueryParams {
  [key: string]: string | number | boolean | undefined;
  zone_id?: number;
  name?: string;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class GroupService {
  private readonly apiService = inject(ApiService);

  /**
   * Retrieves all groups with optional filtering and pagination
   * Backend endpoint: GET /api/groups/list
   */
  getGroups(params?: GroupsQueryParams): Observable<PaginatedResponse<Group>> {
    return this.apiService.get<PaginatedResponse<Group>>('/groups/list', { params: params as any });
  }

  /**
   * Creates a new group
   * Backend endpoint: POST /api/groups/create
   */
  createGroup(group: Partial<Group>): Observable<GroupResponse> {
    return this.apiService.post<GroupResponse>('/groups/create', group);
  }

  /**
   * Retrieves a single group by ID
   * Backend endpoint: GET /api/groups/show/:id
   */
  getGroup(id: number): Observable<GroupResponse> {
    return this.apiService.get<GroupResponse>(`/groups/show/${id}`);
  }

  /**
   * Updates an existing group
   * Backend endpoint: PUT /api/groups/update/:id
   */
  updateGroup(id: number, group: Partial<Group>): Observable<GroupResponse> {
    return this.apiService.put<GroupResponse>(`/groups/update/${id}`, group);
  }

  /**
   * Soft deletes a group
   * Backend endpoint: DELETE /api/groups/delete/:id
   */
  deleteGroup(id: number): Observable<{ message: string }> {
    return this.apiService.delete<{ message: string }>(`/groups/delete/${id}`);
  }

  /**
   * Gets groups by zone
   * Backend endpoint: GET /api/groups/list?zone_id=zoneId
   */
  getGroupsByZone(zoneId: number, page: number = 1, limit: number = 100): Observable<PaginatedResponse<Group>> {
    return this.getGroups({ zone_id: zoneId, page, limit });
  }

  /**
   * Searches groups by name
   * Backend endpoint: GET /api/groups/list?search=searchTerm
   */
  searchGroups(searchTerm: string, page: number = 1, limit: number = 10): Observable<PaginatedResponse<Group>> {
    return this.getGroups({ search: searchTerm, page, limit });
  }
}
