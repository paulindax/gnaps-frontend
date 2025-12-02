import { Injectable, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface Breadcrumb {
  label: string;
  url: string;
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  breadcrumbs = signal<Breadcrumb[]>([]);

  private routeLabels: Record<string, string> = {
    '': 'Home',
    'dashboard': 'Dashboard',
    'schools': 'Schools',
    'payments': 'Payments',
    'news': 'News',
    'events': 'Events',
    'documents': 'Documents',
    'settings': 'Settings',
    'finance': 'Finance',
    'manage': 'Manage',
    'create': 'Create',
    'edit': 'Edit',
    'vault': 'Vault',
    'builder': 'Builder',
    'fill': 'Fill',
    'bills': 'Bills',
    'items': 'Items'
  };

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateBreadcrumbs();
      });
  }

  private updateBreadcrumbs(): void {
    const urlSegments = this.router.url.split('/').filter(segment => segment && segment !== '');
    const breadcrumbs: Breadcrumb[] = [
      { label: 'Home', url: '/dashboard', icon: '🏠' }
    ];

    let currentUrl = '';
    urlSegments.forEach((segment, index) => {
      // Skip numeric IDs in breadcrumbs
      if (!isNaN(Number(segment))) {
        return;
      }

      currentUrl += `/${segment}`;
      const label = this.routeLabels[segment] || this.capitalize(segment);

      // Only add if not the last segment or if it's a meaningful route
      if (index < urlSegments.length - 1 || segment !== 'dashboard') {
        breadcrumbs.push({
          label,
          url: currentUrl
        });
      }
    });

    this.breadcrumbs.set(breadcrumbs);
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
  }

  setBreadcrumbs(breadcrumbs: Breadcrumb[]): void {
    this.breadcrumbs.set(breadcrumbs);
  }
}
