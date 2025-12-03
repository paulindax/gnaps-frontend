// src/app/app.component.ts (simplified)
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { FlashMessageComponent } from './shared/ui/flash-message/flash-message.component';
import { Adesua360ChatComponent } from './shared/components/adesua360-chat/adesua360-chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FlashMessageComponent, Adesua360ChatComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  // Initialize theme service on app startup
  private themeService = inject(ThemeService);
}