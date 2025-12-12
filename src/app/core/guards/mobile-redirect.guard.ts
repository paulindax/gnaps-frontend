import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DeviceService } from '../services/device.service';

/**
 * Guard that redirects mobile users to mobile routes
 * Use this on desktop routes to automatically redirect mobile users
 */
export const mobileRedirectGuard: CanActivateFn = (route, state) => {
  const deviceService = inject(DeviceService);
  const router = inject(Router);

  // Check if user should see mobile view
  if (deviceService.shouldShowMobileView()) {
    // Map desktop routes to mobile routes
    const mobileRoute = mapToMobileRoute(state.url);
    if (mobileRoute) {
      router.navigate([mobileRoute]);
      return false;
    }
  }

  return true;
};

/**
 * Maps desktop routes to their mobile equivalents
 */
function mapToMobileRoute(desktopUrl: string): string | null {
  // Remove query params for matching
  const path = desktopUrl.split('?')[0];

  // Route mapping
  const routeMap: Record<string, string> = {
    '/dashboard': '/m/dashboard',
    '/schools': '/m/schools',
    '/events': '/m/events',
    '/news': '/m/news',
    '/executives': '/m/executives',
    '/documents': '/m/documents',
    '/documents/vault': '/m/documents',
    '/settings': '/m/settings',
    '/finance': '/m/more',
    '/payments': '/m/payments'
  };

  // Check for exact matches
  if (routeMap[path]) {
    return routeMap[path];
  }

  // Check for pattern matches (like /news/123 -> /m/news/123)
  if (path.startsWith('/news/')) {
    return '/m' + path;
  }
  if (path.startsWith('/events/')) {
    return '/m' + path;
  }

  // Default to mobile dashboard for authenticated routes
  if (path === '/' || path === '') {
    return '/m/dashboard';
  }

  return null;
}
