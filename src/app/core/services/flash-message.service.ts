import { Injectable, signal, effect } from '@angular/core';

export type FlashMessageType = 'success' | 'error' | 'warning' | 'info';

export interface FlashMessage {
  id: string;
  msg: string;
  type: FlashMessageType;
  timeout?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FlashMessageService {
  private messages = signal<FlashMessage[]>([]);
  private defaultTimeout = 5000; // 5 seconds

  // Public readonly signal for components to subscribe to
  readonly messagesSignal = this.messages.asReadonly();

  constructor() {
    // Optional: Add effect to log message changes in development
    effect(() => {
      const currentMessages = this.messages();
      if (currentMessages.length > 0) {
        console.log('[FlashMessageService] Current messages:', currentMessages);
      }
    });
  }

  /**
   * Add a new flash message
   * @param msg - The message text
   * @param type - The message type (success, error, warning, info)
   * @param timeout - Optional custom timeout in milliseconds (0 = no auto-dismiss)
   */
  add(msg: string, type: FlashMessageType = 'info', timeout?: number): void {
    const id = this.generateId();
    const message: FlashMessage = {
      id,
      msg,
      type,
      timeout: timeout !== undefined ? timeout : this.defaultTimeout
    };

    this.messages.update(messages => [...messages, message]);

    // Auto-dismiss after timeout if timeout is greater than 0
    if (message.timeout && message.timeout > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, message.timeout);
    }
  }

  /**
   * Add a success message
   */
  success(msg: string, timeout?: number): void {
    this.add(msg, 'success', timeout);
  }

  /**
   * Add an error message
   */
  error(msg: string, timeout?: number): void {
    this.add(msg, 'error', timeout);
  }

  /**
   * Add a warning message
   */
  warning(msg: string, timeout?: number): void {
    this.add(msg, 'warning', timeout);
  }

  /**
   * Add an info message
   */
  info(msg: string, timeout?: number): void {
    this.add(msg, 'info', timeout);
  }

  /**
   * Dismiss a specific message by ID
   */
  dismiss(id: string): void {
    this.messages.update(messages => messages.filter(m => m.id !== id));
  }

  /**
   * Clear all messages
   */
  clearAll(): void {
    this.messages.set([]);
  }

  /**
   * Generate a unique ID for messages
   */
  private generateId(): string {
    return `flash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set default timeout for all messages
   */
  setDefaultTimeout(timeout: number): void {
    this.defaultTimeout = timeout;
  }
}
