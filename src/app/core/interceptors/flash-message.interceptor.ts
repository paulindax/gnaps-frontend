import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { FlashMessageService, FlashMessageType } from '../services/flash-message.service';

interface FlashMessageResponse {
  flash_message?: {
    msg: string;
    type: FlashMessageType;
  };
}

@Injectable()
export class FlashMessageInterceptor implements HttpInterceptor {
  private flashMessageService = inject(FlashMessageService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      tap({
        next: (event) => {
          // Check for successful responses
          if (event instanceof HttpResponse) {
            this.handleResponse(event.body);
          }
        },
        error: (error: HttpErrorResponse) => {
          // Check for error responses
          if (error.error) {
            this.handleResponse(error.error);
          }
        }
      })
    );
  }

  /**
   * Handle response and extract flash message if present
   */
  private handleResponse(body: any): void {
    if (!body) {
      return;
    }

    // Check if response has flash_message property
    const response = body as FlashMessageResponse;
    if (response.flash_message && response.flash_message.msg && response.flash_message.type) {
      const { msg, type } = response.flash_message;
      this.flashMessageService.add(msg, type);
      console.log('[FlashMessageInterceptor] Flash message detected:', { msg, type });
    }
  }
}
