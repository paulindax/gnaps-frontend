import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Configuration options for API requests
 */
export interface ApiRequestOptions {
  /** Additional headers to include in the request */
  headers?: HttpHeaders | { [header: string]: string | string[] };
  /** URL query parameters */
  params?: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> };
  /** Whether to include credentials in the request */
  withCredentials?: boolean;
  /** Number of retry attempts for failed requests (default: 0) */
  retryAttempts?: number;
}

/**
 * Generic API Service for handling HTTP requests
 *
 * This service provides a centralized way to make HTTP requests to the backend API.
 * It automatically handles:
 * - Base URL configuration from environment
 * - Error handling and transformation
 * - Optional request retries
 * - Type-safe responses with TypeScript generics
 *
 * Authentication tokens are automatically added by the JwtInterceptor.
 *
 * @example
 * // Inject the service
 * private apiService = inject(ApiService);
 *
 * // Make a GET request
 * this.apiService.get<User[]>('/users').subscribe(users => {
 *   console.log(users);
 * });
 *
 * // Make a POST request
 * this.apiService.post<User>('/users', { name: 'John', email: 'john@example.com' })
 *   .subscribe(user => {
 *     console.log('Created user:', user);
 *   });
 *
 * // Make a PUT request
 * this.apiService.put<User>('/users/123', { name: 'John Updated' })
 *   .subscribe(user => {
 *     console.log('Updated user:', user);
 *   });
 *
 * // Make a DELETE request
 * this.apiService.delete<void>('/users/123')
 *   .subscribe(() => {
 *     console.log('User deleted');
 *   });
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Performs a GET request to the specified endpoint
   *
   * @template T - The expected response type
   * @param endpoint - The API endpoint (relative to baseUrl, e.g., '/users' or '/users/123')
   * @param options - Optional request configuration
   * @returns Observable of the response data
   *
   * @example
   * // Simple GET request
   * get<User[]>('/users').subscribe(users => console.log(users));
   *
   * // GET with query parameters
   * get<User[]>('/users', { params: { role: 'admin', active: true } })
   *   .subscribe(users => console.log(users));
   *
   * // GET with retry on failure
   * get<Dashboard>('/dashboard', { retryAttempts: 2 })
   *   .subscribe(data => console.log(data));
   */
  get<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);
    const retryCount = options?.retryAttempts ?? 0;

    return (this.http.get<T>(url, httpOptions) as Observable<T>).pipe(
      retry(retryCount),
      catchError((error) => this.handleError(error, 'GET', endpoint))
    );
  }

  /**
   * Performs a POST request to the specified endpoint
   *
   * @template T - The expected response type
   * @param endpoint - The API endpoint (relative to baseUrl)
   * @param body - The request payload/body
   * @param options - Optional request configuration
   * @returns Observable of the response data
   *
   * @example
   * // Simple POST request
   * post<User>('/users', { name: 'John', email: 'john@example.com' })
   *   .subscribe(user => console.log('Created:', user));
   *
   * // POST with custom headers
   * post<Response>('/submit', data, {
   *   headers: { 'X-Custom-Header': 'value' }
   * }).subscribe(response => console.log(response));
   *
   * // POST with retry on failure
   * post<Payment>('/payments', paymentData, { retryAttempts: 1 })
   *   .subscribe(payment => console.log(payment));
   */
  post<T>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);
    const retryCount = options?.retryAttempts ?? 0;

    return (this.http.post<T>(url, body, httpOptions) as Observable<T>).pipe(
      retry(retryCount),
      catchError((error) => this.handleError(error, 'POST', endpoint))
    );
  }

  /**
   * Performs a PUT request to the specified endpoint
   *
   * @template T - The expected response type
   * @param endpoint - The API endpoint (relative to baseUrl)
   * @param body - The request payload/body
   * @param options - Optional request configuration
   * @returns Observable of the response data
   *
   * @example
   * // Simple PUT request
   * put<User>('/users/123', { name: 'John Updated', email: 'john@example.com' })
   *   .subscribe(user => console.log('Updated:', user));
   *
   * // PUT with custom headers
   * put<Response>('/resources/456', data, {
   *   headers: { 'X-Custom-Header': 'value' }
   * }).subscribe(response => console.log(response));
   *
   * // PUT with retry on failure
   * put<Item>('/items/789', itemData, { retryAttempts: 1 })
   *   .subscribe(item => console.log(item));
   */
  put<T>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);
    const retryCount = options?.retryAttempts ?? 0;

    return (this.http.put<T>(url, body, httpOptions) as Observable<T>).pipe(
      retry(retryCount),
      catchError((error) => this.handleError(error, 'PUT', endpoint))
    );
  }

  /**
   * Performs a DELETE request to the specified endpoint
   *
   * @template T - The expected response type
   * @param endpoint - The API endpoint (relative to baseUrl)
   * @param options - Optional request configuration
   * @returns Observable of the response data
   *
   * @example
   * // Simple DELETE request
   * delete<void>('/users/123').subscribe(() => console.log('Deleted'));
   *
   * // DELETE with query parameters
   * delete<Response>('/items/456', { params: { soft: true } })
   *   .subscribe(response => console.log(response));
   *
   * // DELETE with retry on failure
   * delete<void>('/resources/789', { retryAttempts: 1 })
   *   .subscribe(() => console.log('Resource deleted'));
   */
  delete<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);
    const retryCount = options?.retryAttempts ?? 0;

    return (this.http.delete<T>(url, httpOptions) as Observable<T>).pipe(
      retry(retryCount),
      catchError((error) => this.handleError(error, 'DELETE', endpoint))
    );
  }

  /**
   * Builds the full URL by combining base URL and endpoint
   * Handles cases where endpoint already includes the base URL
   */
  private buildUrl(endpoint: string): string {
    // If endpoint already starts with http:// or https://, return as-is
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // Remove trailing slash from base URL if present
    const normalizedBaseUrl = this.baseUrl.endsWith('/')
      ? this.baseUrl.slice(0, -1)
      : this.baseUrl;

    return `${normalizedBaseUrl}${normalizedEndpoint}`;
  }

  /**
   * Builds HTTP options from ApiRequestOptions
   */
  private buildHttpOptions(options?: ApiRequestOptions): any {
    if (!options) {
      return {};
    }

    const httpOptions: any = {};

    if (options.headers) {
      httpOptions.headers = options.headers;
    }

    if (options.params) {
      httpOptions.params = options.params;
    }

    if (options.withCredentials !== undefined) {
      httpOptions.withCredentials = options.withCredentials;
    }

    return httpOptions;
  }

  /**
   * Centralized error handling for API requests
   * Transforms HttpErrorResponse into a user-friendly error message
   */
  private handleError(error: HttpErrorResponse, method: string, endpoint: string): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful response code
      if (error.status === 0) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (error.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.';
      } else if (error.status === 403) {
        errorMessage = 'Forbidden. You do not have permission to access this resource.';
      } else if (error.status === 404) {
        errorMessage = 'Resource not found.';
      } else if (error.status === 500) {
        errorMessage = 'Internal server error. Please try again later.';
      } else if (error.status >= 400 && error.status < 500) {
        // Try to extract error message from response
        errorMessage = error.error?.message || error.error?.error || `Request failed with status ${error.status}`;
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
    }

    // Log error details for debugging (can be removed in production)
    console.error(`API ${method} Error [${endpoint}]:`, {
      status: error.status,
      message: errorMessage,
      details: error.error,
      url: error.url
    });

    return throwError(() => ({
      status: error.status,
      message: errorMessage,
      originalError: error
    }));
  }
}
