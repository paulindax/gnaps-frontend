import { Component, inject, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Adesua360Service, ChatMessage } from '../../../core/services/adesua360.service';

@Component({
  selector: 'app-adesua360-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './adesua360-chat.component.html'
})
export class Adesua360ChatComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  protected readonly chatService = inject(Adesua360Service);

  messageText = signal('');
  showSuggestions = signal(true);
  private shouldScrollToBottom = false;

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  get isOpen() {
    return this.chatService.isOpen;
  }

  get messages() {
    return this.chatService.messages;
  }

  get isLoading() {
    return this.chatService.isLoading;
  }

  get suggestions() {
    return this.chatService.getSuggestions();
  }

  toggleChat(): void {
    this.chatService.toggleChat();
    if (this.chatService.isOpen()) {
      setTimeout(() => {
        this.messageInput?.nativeElement?.focus();
        this.scrollToBottom();
      }, 100);
    }
  }

  closeChat(): void {
    this.chatService.closeChat();
  }

  sendMessage(): void {
    const text = this.messageText().trim();
    if (!text) return;

    this.chatService.sendMessage(text);
    this.messageText.set('');
    this.showSuggestions.set(false);
    this.shouldScrollToBottom = true;
  }

  sendSuggestion(suggestion: string): void {
    this.chatService.sendMessage(suggestion);
    this.showSuggestions.set(false);
    this.shouldScrollToBottom = true;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat(): void {
    this.chatService.clearChat();
    this.showSuggestions.set(true);
  }

  formatMessage(content: string): string {
    // Convert markdown-like formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }
}
