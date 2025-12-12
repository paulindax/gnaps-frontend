import { Component, inject, signal, computed, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

interface Activity {
  id: number;
  type: string;
  title: string;
  description?: string;
  url?: string;
  created_at: string;
  user_id: number;
  username?: string;
  role?: string;
  method?: string;
  endpoint?: string;
  status_code?: number;
  resource_type?: string;
  resource_id?: number;
  ip_address?: string;
  user_agent?: string;
}

interface PaginatedResponse {
  data: Activity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './activity-logs.component.html'
})
export class ActivityLogsComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  // State
  activities = signal<Activity[]>([]);
  isLoading = signal(false);
  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = signal(25);

  // Filters
  searchQuery = signal('');
  userSearch = signal('');
  selectedType = signal('');
  selectedUserId = signal('');
  selectedUsername = signal('');
  dateFrom = signal('');
  dateTo = signal('');

  // Available filter options
  activityTypes = [
    { value: '', label: 'All Types' },
    { value: 'navigation', label: 'Navigation' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
    { value: 'view', label: 'View' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'export', label: 'Export' },
    { value: 'upload', label: 'Upload' },
    { value: 'download', label: 'Download' },
    { value: 'payment', label: 'Payment' },
    { value: 'register', label: 'Register' },
    { value: 'api_call', label: 'API Call' }
  ];

  // Computed
  totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));
  hasFilters = computed(() =>
    this.searchQuery() || this.userSearch() || this.selectedType() || this.selectedUserId() || this.dateFrom() || this.dateTo()
  );

  // Activity type icons and colors
  private typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
    navigation: { icon: 'M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-blue-600', bg: 'bg-blue-100' },
    create: { icon: 'M12 4v16m8-8H4', color: 'text-green-600', bg: 'bg-green-100' },
    update: { icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'text-amber-600', bg: 'bg-amber-100' },
    delete: { icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', color: 'text-red-600', bg: 'bg-red-100' },
    login: { icon: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1', color: 'text-emerald-600', bg: 'bg-emerald-100' },
    logout: { icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1', color: 'text-gray-600', bg: 'bg-gray-100' },
    view: { icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', color: 'text-indigo-600', bg: 'bg-indigo-100' },
    export: { icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'text-purple-600', bg: 'bg-purple-100' },
    upload: { icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', color: 'text-cyan-600', bg: 'bg-cyan-100' },
    download: { icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', color: 'text-teal-600', bg: 'bg-teal-100' },
    payment: { icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', color: 'text-rose-600', bg: 'bg-rose-100' },
    register: { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-lime-600', bg: 'bg-lime-100' },
    api_call: { icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'text-orange-600', bg: 'bg-orange-100' }
  };

  ngOnInit(): void {
    // Check if user is system admin
    if (this.authService.userRole() !== 'system_admin') {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadActivities();
  }

  loadActivities(): void {
    this.isLoading.set(true);
    const token = this.authService.getToken();

    const params: Record<string, string> = {
      page: this.currentPage().toString(),
      limit: this.pageSize().toString()
    };

    if (this.searchQuery()) params['search'] = this.searchQuery();
    if (this.userSearch()) params['username'] = this.userSearch();
    if (this.selectedType()) params['type'] = this.selectedType();
    if (this.selectedUserId()) params['user_id'] = this.selectedUserId();
    if (this.dateFrom()) params['from_date'] = this.dateFrom();
    if (this.dateTo()) params['to_date'] = this.dateTo();

    this.http.get<PaginatedResponse>(
      `${environment.apiUrl}/activity_logs/list`,
      {
        params,
        headers: { Authorization: `Bearer ${token}` }
      }
    ).pipe(
      catchError(err => {
        console.error('Failed to load activities:', err);
        return of({ data: [], pagination: { page: 1, limit: 25, total: 0 } });
      })
    ).subscribe(response => {
      this.activities.set(response.data || []);
      this.totalCount.set(response.pagination?.total || 0);
      this.isLoading.set(false);
    });
  }

  // Filter methods
  applyFilters(): void {
    this.currentPage.set(1);
    this.loadActivities();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.userSearch.set('');
    this.selectedType.set('');
    this.selectedUserId.set('');
    this.selectedUsername.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.currentPage.set(1);
    this.loadActivities();
  }

  filterByUser(userId: number, username: string): void {
    this.selectedUserId.set(userId.toString());
    this.selectedUsername.set(username);
    this.currentPage.set(1);
    this.loadActivities();
  }

  // Pagination
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadActivities();
    }
  }

  previousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  // Helper methods
  getTypeConfig(type: string): { icon: string; color: string; bg: string } {
    return this.typeConfig[type] || this.typeConfig['navigation'];
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  getUserInitials(username: string): string {
    if (!username) return '?';
    const parts = username.split(/[._\s-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  }

  formatRole(role: string): string {
    if (!role) return '';
    const roleMap: Record<string, string> = {
      'system_admin': 'System Admin',
      'national_admin': 'National Admin',
      'region_admin': 'Regional Admin',
      'zone_admin': 'Zone Admin',
      'school_admin': 'School Admin'
    };
    return roleMap[role] || role.replace(/_/g, ' ');
  }

  getMethodColor(method: string): string {
    const colors: Record<string, string> = {
      'GET': 'bg-green-100 text-green-700',
      'POST': 'bg-blue-100 text-blue-700',
      'PUT': 'bg-amber-100 text-amber-700',
      'DELETE': 'bg-red-100 text-red-700'
    };
    return colors[method] || 'bg-gray-100 text-gray-700';
  }

  getStatusColor(status: number): string {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-700';
    if (status >= 300 && status < 400) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  }

  navigateToUrl(url: string | undefined): void {
    if (url) {
      this.router.navigateByUrl(url);
    }
  }

  // Page numbers for pagination
  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push(-1); // ellipsis

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (current < total - 2) pages.push(-1); // ellipsis
      pages.push(total);
    }

    return pages;
  }

  // Helper for template - get end index for pagination display
  getEndIndex(): number {
    return Math.min(this.currentPage() * this.pageSize(), this.totalCount());
  }
}
