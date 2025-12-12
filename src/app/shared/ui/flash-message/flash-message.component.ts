import { Component, inject, computed } from '@angular/core';

import { FlashMessageService, FlashMessage } from '../../../core/services/flash-message.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-flash-message',
  standalone: true,
  imports: [],
  templateUrl: './flash-message.component.html',
  styleUrl: './flash-message.component.css',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class FlashMessageComponent {
  private flashMessageService = inject(FlashMessageService);

  messages = this.flashMessageService.messagesSignal;

  /**
   * Get CSS classes for message type
   */
  getMessageClasses(type: string): string {
    const baseClasses = 'flex items-start gap-3 p-4 rounded-lg shadow-lg border min-w-80 max-w-md';

    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50 border-green-200 text-green-800`;
      case 'error':
        return `${baseClasses} bg-red-50 border-red-200 text-red-800`;
      case 'warning':
        return `${baseClasses} bg-yellow-50 border-yellow-200 text-yellow-800`;
      case 'info':
        return `${baseClasses} bg-blue-50 border-blue-200 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-50 border-gray-200 text-gray-800`;
    }
  }

  /**
   * Get icon for message type
   */
  getIcon(type: string): string {
    switch (type) {
      case 'success':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'error':
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'warning':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
      case 'info':
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  /**
   * Get icon color class for message type
   */
  getIconColorClass(type: string): string {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  }

  /**
   * Get close button color class for message type
   */
  getCloseButtonClass(type: string): string {
    switch (type) {
      case 'success':
        return 'text-green-600 hover:text-green-800';
      case 'error':
        return 'text-red-600 hover:text-red-800';
      case 'warning':
        return 'text-yellow-600 hover:text-yellow-800';
      case 'info':
        return 'text-blue-600 hover:text-blue-800';
      default:
        return 'text-gray-600 hover:text-gray-800';
    }
  }

  /**
   * Dismiss a message
   */
  dismiss(id: string): void {
    this.flashMessageService.dismiss(id);
  }

  /**
   * Track messages by ID for efficient rendering
   */
  trackByMessageId(index: number, message: FlashMessage): string {
    return message.id;
  }
}
