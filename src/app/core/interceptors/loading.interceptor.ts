import { inject, Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const loadingService = inject(LoadingService);

    // Show loading indicator
    loadingService.show();

    // Hide loading indicator when request completes (success or error)
    return next.handle(request).pipe(
      finalize(() => loadingService.hide())
    );
  }
}
