import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, delay, map } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
}

interface ApiChatResponse {
  data: {
    message: string;
    suggestions?: string[];
  };
}

@Injectable({ providedIn: 'root' })
export class Adesua360Service {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);

  // Chat state
  messages = signal<ChatMessage[]>([]);
  isOpen = signal(false);
  isLoading = signal(false);

  // Quick suggestions based on user role
  private readonly suggestions: Record<string, string[]> = {
    system_admin: [
      'How do I add a new region?',
      'How do I manage executives?',
      'Show me payment statistics',
      'How do I create a news article?'
    ],
    national_admin: [
      'How do I view all schools?',
      'How do I manage zones?',
      'Show payment reports',
      'How do I publish an event?'
    ],
    region_admin: [
      'How do I view schools in my region?',
      'How do I manage zones?',
      'Show payment summary',
      'How do I create an event?'
    ],
    zone_admin: [
      'How do I view schools in my zone?',
      'How do I track payments?',
      'Show school statistics',
      'How do I contact support?'
    ],
    school_admin: [
      'How do I update school information?',
      'How do I view payment history?',
      'How do I submit documents?',
      'How do I contact my zone admin?'
    ],
    default: [
      'What can you help me with?',
      'How do I navigate the app?',
      'Show me available features',
      'How do I get support?'
    ]
  };

  constructor() {
    // Initialize with welcome message
    this.initializeChat();
  }

  private initializeChat(): void {
    const welcomeMessage: ChatMessage = {
      id: this.generateId(),
      role: 'assistant',
      content: `Hello! I'm Adesua360, your GNAPS assistant. I'm here to help you navigate the application and answer your questions about managing schools, regions, zones, payments, and more.\n\nHow can I assist you today?`,
      timestamp: new Date()
    };
    this.messages.set([welcomeMessage]);
  }

  toggleChat(): void {
    this.isOpen.update(open => !open);
  }

  openChat(): void {
    this.isOpen.set(true);
  }

  closeChat(): void {
    this.isOpen.set(false);
  }

  getSuggestions(): string[] {
    const userRole = this.authService.userRole() || 'default';
    return this.suggestions[userRole] || this.suggestions['default'];
  }

  sendMessage(content: string): void {
    if (!content.trim() || this.isLoading()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: this.generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };
    this.messages.update(msgs => [...msgs, userMessage]);

    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: 'typing',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true
    };
    this.messages.update(msgs => [...msgs, typingMessage]);

    this.isLoading.set(true);

    // Send to API
    const currentUser = this.authService.currentUserSignal();
    const userName = currentUser ? `${currentUser.first_name} ${currentUser.last_name}`.trim() : 'User';

    this.apiService.post<ApiChatResponse>('/chat/message', {
      message: content.trim(),
      context: {
        user_role: this.authService.userRole(),
        user_name: userName
      }
    }).subscribe({
      next: (response) => {
        // Remove typing indicator and add response
        this.messages.update(msgs => {
          const filtered = msgs.filter(m => m.id !== 'typing');
          return [...filtered, {
            id: this.generateId(),
            role: 'assistant',
            content: response.data.message,
            timestamp: new Date()
          }];
        });
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Chat error:', error);
        // Remove typing indicator and add error message
        this.messages.update(msgs => {
          const filtered = msgs.filter(m => m.id !== 'typing');
          return [...filtered, {
            id: this.generateId(),
            role: 'assistant',
            content: this.getLocalResponse(content.trim()),
            timestamp: new Date()
          }];
        });
        this.isLoading.set(false);
      }
    });
  }

  // Fallback local responses when API is unavailable
  private getLocalResponse(query: string): string {
    const lowerQuery = query.toLowerCase();

    // Navigation help
    if (lowerQuery.includes('school') && (lowerQuery.includes('add') || lowerQuery.includes('create'))) {
      return `To add a new school:\n\n1. Go to **Schools** in the sidebar menu\n2. Click the **"Add School"** button\n3. Fill in the school details (name, address, contact info)\n4. Select the appropriate Zone and Group\n5. Click **"Save"** to create the school\n\nWould you like me to explain any specific field?`;
    }

    if (lowerQuery.includes('school') && (lowerQuery.includes('view') || lowerQuery.includes('find') || lowerQuery.includes('list'))) {
      return `To view schools:\n\n1. Click on **Schools** in the sidebar\n2. Use the **filters** to narrow down by Region, Zone, or Group\n3. Use the **search bar** to find specific schools by name\n4. Click on any school to view its details\n\nYou can also export the school list using the export button.`;
    }

    if (lowerQuery.includes('payment') && (lowerQuery.includes('track') || lowerQuery.includes('view') || lowerQuery.includes('history'))) {
      return `To track payments:\n\n1. Navigate to **Payments** in the sidebar\n2. View the payment dashboard for an overview\n3. Use filters to see payments by:\n   - Date range\n   - Region/Zone\n   - Payment status\n4. Click on any payment to see full details\n\nNeed help with a specific payment issue?`;
    }

    if (lowerQuery.includes('region') && (lowerQuery.includes('add') || lowerQuery.includes('create') || lowerQuery.includes('manage'))) {
      return `To manage regions:\n\n1. Go to **Settings** > **Regions**\n2. Click **"Add Region"** to create a new region\n3. Enter the region name and code\n4. Assign a Region Admin if needed\n5. Click **"Save"**\n\nExisting regions can be edited or deactivated from the same page.`;
    }

    if (lowerQuery.includes('zone') && (lowerQuery.includes('add') || lowerQuery.includes('create') || lowerQuery.includes('manage'))) {
      return `To manage zones:\n\n1. Go to **Settings** > **Zones**\n2. Select the parent **Region** first\n3. Click **"Add Zone"** to create a new zone\n4. Enter zone details and assign a Zonal Admin\n5. Click **"Save"**\n\nZones help organize schools within regions.`;
    }

    if (lowerQuery.includes('executive') && (lowerQuery.includes('add') || lowerQuery.includes('create') || lowerQuery.includes('manage'))) {
      return `To manage executives:\n\n1. Go to **Executives** in the sidebar\n2. Click **"Add Executive"** to create a new executive\n3. Fill in personal details (name, email, phone)\n4. Select their **Role**:\n   - National Admin\n   - Regional Admin\n   - Zonal Admin\n5. Assign to the appropriate Region/Zone\n6. Click **"Save"**`;
    }

    if (lowerQuery.includes('news') || lowerQuery.includes('article') || lowerQuery.includes('announcement')) {
      return `To manage news and announcements:\n\n1. Go to **News** in the sidebar\n2. Click **"Create Article"** for new content\n3. Add a title, content, and featured image\n4. Set the publish date and visibility\n5. Click **"Publish"** to make it live\n\nYou can also save as draft to publish later.`;
    }

    if (lowerQuery.includes('event') && (lowerQuery.includes('create') || lowerQuery.includes('add'))) {
      return `To create an event:\n\n1. Go to **Events** in the sidebar\n2. Click **"Create Event"**\n3. Fill in event details:\n   - Title and description\n   - Date and time\n   - Location/venue\n   - Target audience\n4. Add event image if needed\n5. Click **"Publish"**`;
    }

    if (lowerQuery.includes('document') || lowerQuery.includes('template') || lowerQuery.includes('form')) {
      return `To work with documents:\n\n1. Go to **Document Vault** in the sidebar\n2. **Templates** tab: Create reusable form templates\n3. **Submissions** tab: View filled forms from schools\n4. To create a template:\n   - Click "Create Template"\n   - Add form fields (text, checkbox, signature, etc.)\n   - Save and publish\n\nSchools can then fill and submit these forms.`;
    }

    if (lowerQuery.includes('dashboard') || lowerQuery.includes('overview') || lowerQuery.includes('statistics')) {
      return `Your **Dashboard** provides:\n\n- **Quick Stats**: Total schools, zones, regions\n- **Payment Overview**: Recent payments and trends\n- **Recent Activity**: Latest updates across the system\n- **Charts**: Visual representation of key metrics\n\nClick on any stat card to see more details.`;
    }

    if (lowerQuery.includes('help') || lowerQuery.includes('support') || lowerQuery.includes('contact')) {
      return `For support:\n\n1. **In-app help**: Ask me any question!\n2. **Email**: support@gnaps.org\n3. **Phone**: Contact your regional administrator\n4. **Documentation**: Check the Help section in settings\n\nWhat specific issue can I help you with today?`;
    }

    if (lowerQuery.includes('login') || lowerQuery.includes('password') || lowerQuery.includes('account')) {
      return `For account issues:\n\n- **Forgot password**: Click "Forgot Password" on the login page\n- **Update profile**: Go to Settings > Profile\n- **Change password**: Settings > Security\n- **Account locked**: Contact your administrator\n\nIs there a specific account issue you're experiencing?`;
    }

    if (lowerQuery.includes('what can you') || lowerQuery.includes('help me with') || lowerQuery.includes('features')) {
      return `I can help you with:\n\n**Navigation**\n- Finding features in the app\n- Understanding different sections\n\n**Schools**\n- Adding and managing schools\n- Viewing school information\n\n**Administration**\n- Managing regions, zones, and groups\n- Executive management\n\n**Finance**\n- Payment tracking\n- Financial reports\n\n**Content**\n- News and events\n- Document templates\n\nJust ask me anything!`;
    }

    // Default response
    return `I understand you're asking about "${query}". Let me help you with that.\n\nHere are some things I can assist with:\n\n- **Schools**: Adding, viewing, and managing schools\n- **Payments**: Tracking and reporting\n- **Regions/Zones**: Administrative management\n- **Executives**: Role assignments\n- **Events & News**: Content management\n\nCould you be more specific about what you'd like to do?`;
  }

  clearChat(): void {
    this.initializeChat();
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
