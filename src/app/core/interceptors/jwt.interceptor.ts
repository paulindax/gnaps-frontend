import { inject, Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const authService = inject(AuthService);
    const token = authService.getToken();

    // Check if token is expired before making the request
    if (token && authService.isTokenExpired(token)) {
      authService.forceLogout('Your session has expired. Please login again.');
      return throwError(() => new Error('Token expired'));
    }

    // Add Authorization header if token exists
    if (token) {
      request = request.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }

    // Handle the request and catch 401 errors
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token is invalid or expired - force logout
          authService.forceLogout('Your session has expired. Please login again.');
        }
        return throwError(() => error);
      })
    );
  }
}
