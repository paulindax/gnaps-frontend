import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Event, EventRegistration } from '../models';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface EventsQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  is_paid?: boolean;
  from_date?: string;
  to_date?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiService = inject(ApiService);

  // Get all events with pagination and filters
  getEvents(params?: EventsQueryParams): Observable<PaginatedResponse<Event>> {
    return this.apiService.get<PaginatedResponse<Event>>('/events/list', params as any);
  }

  // Get single event by ID
  getEventById(id: number): Observable<Event> {
    return this.apiService.get<Event>(`/events/show/${id}`);
  }

  // Create new event
  createEvent(event: Partial<Event>): Observable<Event> {
    return this.apiService.post<Event>('/events/create', event);
  }

  // Update existing event
  updateEvent(id: number, event: Partial<Event>): Observable<Event> {
    return this.apiService.put<Event>(`/events/update/${id}`, event);
  }

  // Delete event
  deleteEvent(id: number): Observable<void> {
    return this.apiService.delete<void>(`/events/delete/${id}`);
  }

  // Get event registrations
  getEventRegistrations(eventId: number, params?: any): Observable<PaginatedResponse<EventRegistration>> {
    return this.apiService.get<PaginatedResponse<EventRegistration>>(`/events/${eventId}/registrations`, params);
  }

  // Register school for event
  registerForEvent(eventId: number, data: Partial<EventRegistration>): Observable<EventRegistration> {
    return this.apiService.post<EventRegistration>(`/events/${eventId}/register`, data);
  }

  // Cancel registration
  cancelRegistration(registrationId: number): Observable<void> {
    return this.apiService.delete<void>(`/event-registrations/${registrationId}`);
  }

  // Get my registrations (for schools)
  getMyRegistrations(params?: any): Observable<PaginatedResponse<EventRegistration>> {
    return this.apiService.get<PaginatedResponse<EventRegistration>>('/event-registrations/my', params);
  }

  // Update payment status
  updatePaymentStatus(registrationId: number, data: { payment_status: string; payment_reference?: string }): Observable<EventRegistration> {
    return this.apiService.put<EventRegistration>(`/event-registrations/${registrationId}/payment`, data);
  }
}
