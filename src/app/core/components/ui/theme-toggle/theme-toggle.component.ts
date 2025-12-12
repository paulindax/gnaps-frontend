// src/app/core/components/ui/theme-toggle.component.ts
import { Component, inject } from '@angular/core';

import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [],
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.css']
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);

  toggleTheme(): void {
    this.themeService.cycleTheme();
  }

  getNextThemeLabel(): string {
    const current = this.themeService.themeMode();
    switch (current) {
      case 'light':
        return 'Dark Mode';
      case 'dark':
        return 'Auto Mode';
      case 'auto':
        return 'Light Mode';
      default:
        return 'Unknown Mode';
    }
  }
}
