import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, tap, catchError } from 'rxjs';
import { User } from '../models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiService = inject(ApiService);

  // Signals for reactive state
  private readonly currentUser = signal<User | null>(null);
  private readonly tokenSignal = signal<string | null>(null);

  // Computed values
  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly userRole = computed(() => this.currentUser()?.role ?? null);
  readonly currentUserSignal = computed(() => this.currentUser());

  constructor() {
    // Initialize from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      this.tokenSignal.set(token);
      this.decodeToken(token);
    }
  }

  login(username: string, password: string): Observable<{ token: string; user: User }> {
    return this.apiService.post<{ token: string; user: User }>('/auth/login', { username, password })
      .pipe(
        tap(({ token, user }) => {
          this.tokenSignal.set(token);
          this.currentUser.set(user);
          localStorage.setItem('token', token);
        }),
        catchError(err => {
          this.logout();
          throw err;
        })
      );
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.currentUser.set(null);
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  private decodeToken(token: string): void {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.currentUser.set({
        id: payload.user_id,
        email: payload.email || '',
        username: payload.username,
        role: payload.role,
        first_name: payload.first_name || '',
        last_name: payload.last_name || ''
      });
    } catch {
      this.logout();
    }
  }
}
