// src/app/app.component.ts (simplified)
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { FlashMessageComponent } from './shared/ui/flash-message/flash-message.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FlashMessageComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  // Initialize theme service on app startup
  private themeService = inject(ThemeService);
}