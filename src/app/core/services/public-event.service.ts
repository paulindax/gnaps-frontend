import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Event, EventRegistration, School, SchoolBalance } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PublicEventService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/public-events`;

  // Get event by registration code (no auth required)
  getEventByCode(code: string): Observable<Event> {
    return this.http.get<Event>(`${this.baseUrl}/view/${code}`);
  }

  // Register for event (no auth required)
  registerForEvent(code: string, registration: Partial<EventRegistration>): Observable<EventRegistration> {
    return this.http.post<EventRegistration>(`${this.baseUrl}/register/${code}`, registration);
  }

  // Search schools (no auth required)
  searchSchools(keyword: string): Observable<School[]> {
    return this.http.get<School[]>(`${this.baseUrl}/schools`, {
      params: { search: keyword }
    });
  }

  // Get school balance (no auth required)
  getSchoolBalance(schoolId: number): Observable<SchoolBalance> {
    return this.http.get<SchoolBalance>(`${this.baseUrl}/school-balance/${schoolId}`);
  }
}
