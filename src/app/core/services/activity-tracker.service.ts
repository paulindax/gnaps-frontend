import { Injectable, signal, computed, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { filter, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export type ActivityType =
  | 'navigation'
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'view'
  | 'export'
  | 'upload'
  | 'download'
  | 'payment'
  | 'register'
  | 'api_call';

export interface Activity {
  id: string | number;
  type: ActivityType;
  title: string;
  description?: string;
  url?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  // User info (for backend activities)
  user_id?: number;
  username?: string;
  role?: string;
  // API call details
  method?: string;
  endpoint?: string;
  status_code?: number;
  // Resource reference
  resource_type?: string;
  resource_id?: number;
}

export interface GroupedActivities {
  label: string;
  activities: Activity[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const STORAGE_KEY = 'gnaps_user_activities';
const MAX_ACTIVITIES = 100;

@Injectable({
  providedIn: 'root'
})
export class ActivityTrackerService {
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  // Core state
  private activitiesSignal = signal<Activity[]>([]);
  private isOpenSignal = signal(false);
  private isLoadingSignal = signal(false);
  private totalCountSignal = signal(0);
  private filteredUserSignal = signal<{ id: number; username: string } | null>(null);

  // Public readonly signals
  activities = this.activitiesSignal.asReadonly();
  isOpen = this.isOpenSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();
  totalCount = this.totalCountSignal.asReadonly();
  filteredUser = this.filteredUserSignal.asReadonly();

  // Check if current user is system admin
  isSystemAdmin = computed(() => this.authService.userRole() === 'system_admin');

  // Computed: grouped by date
  groupedActivities = computed<GroupedActivities[]>(() => {
    const activities = this.activitiesSignal();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups: Record<string, Activity[]> = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Older': []
    };

    activities.forEach(activity => {
      const activityDate = new Date(activity.timestamp);
      const activityDay = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());

      if (activityDay.getTime() === today.getTime()) {
        groups['Today'].push(activity);
      } else if (activityDay.getTime() === yesterday.getTime()) {
        groups['Yesterday'].push(activity);
      } else if (activityDay.getTime() >= weekAgo.getTime()) {
        groups['This Week'].push(activity);
      } else {
        groups['Older'].push(activity);
      }
    });

    return Object.entries(groups)
      .filter(([_, acts]) => acts.length > 0)
      .map(([label, acts]) => ({ label, activities: acts }));
  });

  // Computed: recent count (last 24 hours)
  recentCount = computed(() => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return this.activitiesSignal().filter(a => new Date(a.timestamp).getTime() > dayAgo).length;
  });

  // Activity type configuration
  private activityConfig: Record<ActivityType, { icon: string; color: string }> = {
    navigation: { icon: 'M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-blue-500' },
    create: { icon: 'M12 4v16m8-8H4', color: 'text-green-500' },
    update: { icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'text-amber-500' },
    delete: { icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', color: 'text-red-500' },
    login: { icon: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1', color: 'text-emerald-500' },
    logout: { icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1', color: 'text-gray-500' },
    view: { icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', color: 'text-indigo-500' },
    export: { icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'text-purple-500' },
    upload: { icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', color: 'text-cyan-500' },
    download: { icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', color: 'text-teal-500' },
    payment: { icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', color: 'text-rose-500' },
    register: { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-lime-500' },
    api_call: { icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'text-orange-500' }
  };

  // Route labels for navigation tracking
  private routeLabels: Record<string, string> = {
    'dashboard': 'Dashboard',
    'schools': 'Schools',
    'payments': 'Payments',
    'news': 'News',
    'events': 'Events',
    'documents': 'Documents',
    'settings': 'Settings',
    'finance': 'Finance',
    'profile': 'Profile',
    'vault': 'Document Vault',
    'builder': 'Template Builder',
    'bills': 'Bills',
    'create': 'Create',
    'edit': 'Edit'
  };

  constructor() {
    this.loadFromStorage();
    this.setupNavigationTracking();
  }

  // Load activities from localStorage (for non-system admins) or backend (for system admins)
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const activities = JSON.parse(stored).map((a: any) => ({
          ...a,
          timestamp: new Date(a.timestamp)
        }));
        this.activitiesSignal.set(activities);
      }
    } catch (e) {
      console.warn('Failed to load activities from storage:', e);
    }
  }

  // Save activities to localStorage
  private saveToStorage(): void {
    try {
      const activities = this.activitiesSignal().slice(0, MAX_ACTIVITIES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    } catch (e) {
      console.warn('Failed to save activities to storage:', e);
    }
  }

  // Load activities from backend (system admin only)
  loadFromBackend(page: number = 1, limit: number = 50): void {
    if (!this.isSystemAdmin()) return;

    this.isLoadingSignal.set(true);
    const token = this.authService.getToken();

    this.http.get<PaginatedResponse<Activity>>(
      `${environment.apiUrl}/activity_logs/list`,
      {
        params: { page: page.toString(), limit: limit.toString() },
        headers: { Authorization: `Bearer ${token}` }
      }
    ).pipe(
      catchError(err => {
        console.warn('Failed to load activities from backend:', err);
        return of({ data: [], pagination: { page: 1, limit: 50, total: 0 } });
      })
    ).subscribe(response => {
      const activities = (response.data || []).map(a => ({
        ...a,
        timestamp: new Date(a.timestamp || (a as any).created_at)
      }));

      if (page === 1) {
        this.activitiesSignal.set(activities);
      } else {
        this.activitiesSignal.update(existing => [...existing, ...activities]);
      }

      this.totalCountSignal.set(response.pagination?.total || 0);
      this.isLoadingSignal.set(false);
    });
  }

  // Load recent activities from backend (system admin only)
  loadRecentFromBackend(hours: number = 24): void {
    if (!this.isSystemAdmin()) return;

    this.isLoadingSignal.set(true);
    this.filteredUserSignal.set(null); // Clear filter when loading all recent
    const token = this.authService.getToken();

    this.http.get<PaginatedResponse<Activity>>(
      `${environment.apiUrl}/activity_logs/recent`,
      {
        params: { hours: hours.toString(), limit: '100' },
        headers: { Authorization: `Bearer ${token}` }
      }
    ).pipe(
      catchError(err => {
        console.warn('Failed to load recent activities:', err);
        return of({ data: [], pagination: { page: 1, limit: 100, total: 0 } });
      })
    ).subscribe(response => {
      const activities = (response.data || []).map(a => ({
        ...a,
        timestamp: new Date(a.timestamp || (a as any).created_at)
      }));
      this.activitiesSignal.set(activities);
      this.totalCountSignal.set(response.pagination?.total || 0);
      this.isLoadingSignal.set(false);
    });
  }

  // Load activities for a specific user (system admin only)
  loadUserActivities(userId: number, username: string): void {
    if (!this.isSystemAdmin()) return;

    this.isLoadingSignal.set(true);
    this.filteredUserSignal.set({ id: userId, username });
    const token = this.authService.getToken();

    this.http.get<PaginatedResponse<Activity>>(
      `${environment.apiUrl}/activity_logs/list`,
      {
        params: { user_id: userId.toString(), limit: '100' },
        headers: { Authorization: `Bearer ${token}` }
      }
    ).pipe(
      catchError(err => {
        console.warn('Failed to load user activities:', err);
        return of({ data: [], pagination: { page: 1, limit: 100, total: 0 } });
      })
    ).subscribe(response => {
      const activities = (response.data || []).map(a => ({
        ...a,
        timestamp: new Date(a.timestamp || (a as any).created_at)
      }));
      this.activitiesSignal.set(activities);
      this.totalCountSignal.set(response.pagination?.total || 0);
      this.isLoadingSignal.set(false);
    });
  }

  // Clear user filter and show all activities
  clearUserFilter(): void {
    this.filteredUserSignal.set(null);
    this.loadRecentFromBackend(24);
  }

  // Setup automatic navigation tracking
  private setupNavigationTracking(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        // Skip login/logout pages and empty routes
        if (url === '/login' || url === '/logout' || url === '/') return;

        const segments = url.split('/').filter(s => s && !this.isNumericId(s));
        const lastSegment = segments[segments.length - 1] || 'dashboard';
        const label = this.routeLabels[lastSegment] || this.capitalize(lastSegment);

        this.track({
          type: 'navigation',
          title: `Visited ${label}`,
          url
        });
      });
  }

  private isNumericId(segment: string): boolean {
    return /^\d+$/.test(segment);
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
  }

  // Generate unique ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Save activity to backend
  private saveToBackend(activity: Partial<Activity>): void {
    const token = this.authService.getToken();
    if (!token) return;

    this.http.post(
      `${environment.apiUrl}/activity_logs/create`,
      activity,
      { headers: { Authorization: `Bearer ${token}` } }
    ).pipe(
      catchError(err => {
        console.warn('Failed to save activity to backend:', err);
        return of(null);
      })
    ).subscribe();
  }

  // Public API: Track an activity
  track(activity: Omit<Activity, 'id' | 'timestamp'>, syncToBackend: boolean = true): void {
    const newActivity: Activity = {
      ...activity,
      id: this.generateId(),
      timestamp: new Date()
    };

    // Always update local state
    this.activitiesSignal.update(activities => {
      const updated = [newActivity, ...activities].slice(0, MAX_ACTIVITIES);
      return updated;
    });
    this.saveToStorage();

    // Sync to backend if enabled
    if (syncToBackend) {
      this.saveToBackend(activity);
    }
  }

  // Track API call (called by interceptor)
  trackApiCall(method: string, endpoint: string, statusCode: number): void {
    // Skip activity_logs endpoint to prevent infinite loop
    if (endpoint.includes('activity_logs')) return;

    // Determine activity title based on method
    let title = `${method} ${this.getEndpointLabel(endpoint)}`;

    this.track({
      type: 'api_call',
      title,
      method,
      endpoint,
      status_code: statusCode
    }, true); // Always sync API calls to backend
  }

  // Get human-readable label for endpoint
  private getEndpointLabel(endpoint: string): string {
    const parts = endpoint.split('/').filter(p => p && !this.isNumericId(p));
    const resource = parts[parts.length - 1] || 'resource';
    return this.capitalize(resource.replace(/_/g, ' '));
  }

  // Public API: Get activity icon config
  getActivityConfig(type: ActivityType): { icon: string; color: string } {
    return this.activityConfig[type] || this.activityConfig.navigation;
  }

  // Public API: Toggle tray
  toggleTray(): void {
    const willOpen = !this.isOpenSignal();
    this.isOpenSignal.set(willOpen);

    // Load from backend when opening tray (for system admins)
    if (willOpen && this.isSystemAdmin()) {
      this.loadRecentFromBackend(24);
    }
  }

  openTray(): void {
    this.isOpenSignal.set(true);
    if (this.isSystemAdmin()) {
      this.loadRecentFromBackend(24);
    }
  }

  closeTray(): void {
    this.isOpenSignal.set(false);
  }

  // Public API: Clear all activities
  clearAll(): void {
    this.activitiesSignal.set([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  // Public API: Clear activities older than X days
  clearOlderThan(days: number): void {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    this.activitiesSignal.update(activities =>
      activities.filter(a => new Date(a.timestamp).getTime() > cutoff)
    );
    this.saveToStorage();
  }

  // Convenience methods for common actions
  trackCreate(entity: string, name?: string, url?: string, resourceType?: string, resourceId?: number): void {
    this.track({
      type: 'create',
      title: `Created ${entity}`,
      description: name,
      url,
      resource_type: resourceType,
      resource_id: resourceId
    });
  }

  trackUpdate(entity: string, name?: string, url?: string, resourceType?: string, resourceId?: number): void {
    this.track({
      type: 'update',
      title: `Updated ${entity}`,
      description: name,
      url,
      resource_type: resourceType,
      resource_id: resourceId
    });
  }

  trackDelete(entity: string, name?: string, resourceType?: string, resourceId?: number): void {
    this.track({
      type: 'delete',
      title: `Deleted ${entity}`,
      description: name,
      resource_type: resourceType,
      resource_id: resourceId
    });
  }

  trackView(entity: string, name?: string, url?: string, resourceType?: string, resourceId?: number): void {
    this.track({
      type: 'view',
      title: `Viewed ${entity}`,
      description: name,
      url,
      resource_type: resourceType,
      resource_id: resourceId
    });
  }

  trackExport(entity: string, format?: string): void {
    this.track({
      type: 'export',
      title: `Exported ${entity}`,
      description: format ? `as ${format.toUpperCase()}` : undefined
    });
  }

  trackLogin(): void {
    this.track({
      type: 'login',
      title: 'Logged in',
      description: 'Session started'
    });
  }

  trackLogout(): void {
    this.track({
      type: 'logout',
      title: 'Logged out',
      description: 'Session ended'
    });
  }

  trackPayment(amount: number, status: string): void {
    this.track({
      type: 'payment',
      title: 'Payment processed',
      description: `GH₵${amount.toFixed(2)} - ${status}`,
      metadata: { amount, status }
    });
  }

  trackRegister(event: string): void {
    this.track({
      type: 'register',
      title: 'Event registration',
      description: event
    });
  }
}
