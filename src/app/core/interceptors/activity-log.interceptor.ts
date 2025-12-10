import { inject, Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivityTrackerService } from '../services/activity-tracker.service';

/**
 * HTTP Interceptor that logs API calls to the activity tracker
 * This enables system admins to see all API calls made by users
 */
@Injectable()
export class ActivityLogInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const activityTracker = inject(ActivityTrackerService);

    // Skip tracking for certain endpoints to avoid noise/loops
    const skipEndpoints = [
      '/activity_logs',  // Prevent infinite loop
      '/auth/refresh',   // Token refresh is automatic
      '/health'          // Health checks
    ];

    const shouldSkip = skipEndpoints.some(endpoint => request.url.includes(endpoint));
    if (shouldSkip) {
      return next.handle(request);
    }

    // Only track mutating operations (POST, PUT, DELETE) and significant GETs
    // Skip GET requests for list endpoints to reduce noise
    const method = request.method;
    const url = request.url;

    // Extract endpoint from full URL
    const endpoint = this.extractEndpoint(url);

    // For GET requests, only track specific views (show endpoints with IDs)
    if (method === 'GET') {
      // Check if it's a "show" request (has an ID at the end)
      const hasId = /\/\d+$/.test(endpoint) || endpoint.includes('/show');
      if (!hasId) {
        return next.handle(request);
      }
    }

    return next.handle(request).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            // Log successful API calls
            activityTracker.trackApiCall(method, endpoint, event.status);
          }
        },
        error: (error) => {
          // Log failed API calls
          const statusCode = error.status || 0;
          activityTracker.trackApiCall(method, endpoint, statusCode);
        }
      })
    );
  }

  /**
   * Extract the endpoint path from a full URL
   */
  private extractEndpoint(url: string): string {
    try {
      // Handle both absolute and relative URLs
      if (url.startsWith('http')) {
        const urlObj = new URL(url);
        return urlObj.pathname;
      }
      return url.split('?')[0]; // Remove query params
    } catch {
      return url;
    }
  }
}
