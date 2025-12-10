import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface SendMessageRequest {
  message: string;
  message_type: 'sms' | 'whatsapp' | 'email';
  recipient_type: 'schools' | 'executives';
  recipients: string[];
  free?: boolean;
  // Filters
  region_ids?: number[];
  zone_ids?: number[];
  school_ids?: number[];
}

export interface SendMessageResponse {
  data: {
    recipients_count: number;
    message: string;
  };
  message: string;
}

export interface AvailableUnitsResponse {
  data: {
    owner_type: string;
    owner_id: number;
    available_units: number;
  };
  message: string;
}

export interface MessageLog {
  id: number;
  created_at: string;
  msg_type: string;
  message: string;
  recipient: string;
  owner_type: string;
  owner_id: number;
  gateway_response: string;
  units: number;
}

export interface MessageLogsResponse {
  data: MessageLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

@Injectable({ providedIn: 'root' })
export class MessagingService {
  private readonly api = inject(ApiService);

  /**
   * Send SMS to recipients
   * Owner info is derived from JWT on backend
   */
  sendSms(request: {
    message: string;
    recipients: string[];
    free?: boolean;
  }): Observable<SendMessageResponse> {
    return this.api.post<SendMessageResponse>('/sms/send_bulk', {
      message: request.message,
      recipients: request.recipients,
      free: request.free || false
    });
  }

  /**
   * Send single SMS
   * Owner info is derived from JWT on backend
   */
  sendSingleSms(request: {
    message: string;
    recipient: string;
    free?: boolean;
  }): Observable<SendMessageResponse> {
    return this.api.post<SendMessageResponse>('/sms/send', {
      message: request.message,
      recipient: request.recipient,
      free: request.free || false
    });
  }

  /**
   * Get available SMS units for current user's organization
   * Owner info is derived from JWT on backend
   */
  getAvailableUnits(): Observable<AvailableUnitsResponse> {
    return this.api.get<AvailableUnitsResponse>('/sms/available_units');
  }

  /**
   * Get message logs for current user's organization
   * Owner info is derived from JWT on backend
   */
  getMessageLogs(page = 1, limit = 20): Observable<MessageLogsResponse> {
    return this.api.get<MessageLogsResponse>('/sms/logs', {
      params: { page, limit }
    });
  }

  /**
   * Count SMS units for a message
   */
  countSmsUnits(message: string): number {
    // GSM 7-bit character set (basic)
    const gsm7bitChars = "@\u00A3$\u00A5\u00E8\u00E9\u00F9\u00EC\u00F2\u00C7\n\u00D8\u00F8\r\u00C5\u00E5\u0394_\u03A6\u0393\u039B\u03A9\u03A0\u03A8\u03A3\u0398\u039E\u00C6\u00E6\u00DF\u00C9 !\"#\u00A4%&'()*+,-./0123456789:;<=>?\u00A1ABCDEFGHIJKLMNOPQRSTUVWXYZ\u00C4\u00D6\u00D1\u00DC\u00A7\u00BFabcdefghijklmnopqrstuvwxyz\u00E4\u00F6\u00F1\u00FC\u00E0";
    const gsm7bitExChars = "^{}\\[~]|\u20AC";

    let length = 0;
    let encoding = 'gsm7bit';

    for (const char of message) {
      if (gsm7bitChars.includes(char)) {
        length += 1;
      } else if (gsm7bitExChars.includes(char)) {
        length += 2; // Extended chars take 2 bytes
        encoding = 'gsm7bit_ex';
      } else {
        encoding = 'utf16';
        break;
      }
    }

    if (encoding === 'utf16') {
      length = message.length;
    }

    // Calculate segments
    const singleMessageLength = encoding === 'utf16' ? 70 : 160;
    const multiMessageLength = encoding === 'utf16' ? 67 : 153;

    if (length <= singleMessageLength) {
      return 1;
    }

    return Math.ceil(length / multiMessageLength);
  }
}
