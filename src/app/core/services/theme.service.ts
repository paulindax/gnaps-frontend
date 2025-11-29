// src/app/core/services/theme.service.ts
import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'gnaps-theme-mode';

  // Current theme mode (light, dark, auto)
  themeMode = signal<ThemeMode>(this.getStoredTheme());

  // Actual applied theme (light or dark) - computed based on mode and system preference
  appliedTheme = signal<'light' | 'dark'>('light');

  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    // Initialize theme on service creation
    this.applyTheme();

    // Listen for system theme changes when in auto mode
    this.mediaQuery.addEventListener('change', (e) => {
      if (this.themeMode() === 'auto') {
        this.appliedTheme.set(e.matches ? 'dark' : 'light');
        this.updateDOM();
      }
    });

    // Watch for theme mode changes and apply them
    effect(() => {
      const mode = this.themeMode();
      this.applyTheme();
      localStorage.setItem(this.STORAGE_KEY, mode);
    });
  }

  /**
   * Set the theme mode (light, dark, or auto)
   */
  setThemeMode(mode: ThemeMode): void {
    this.themeMode.set(mode);
  }

  /**
   * Cycle through theme modes: light → dark → auto → light
   */
  cycleTheme(): void {
    const current = this.themeMode();
    const modes: ThemeMode[] = ['light', 'dark', 'auto'];
    const currentIndex = modes.indexOf(current);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.setThemeMode(modes[nextIndex]);
  }

  /**
   * Get the stored theme from localStorage or default to 'auto'
   */
  private getStoredTheme(): ThemeMode {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'auto') {
      return stored;
    }
    return 'auto';
  }

  /**
   * Apply the theme based on current mode
   */
  private applyTheme(): void {
    const mode = this.themeMode();

    if (mode === 'auto') {
      // Use system preference
      this.appliedTheme.set(this.mediaQuery.matches ? 'dark' : 'light');
    } else {
      // Use explicit mode
      this.appliedTheme.set(mode);
    }

    this.updateDOM();
  }

  /**
   * Update the DOM with the current theme
   */
  private updateDOM(): void {
    const theme = this.appliedTheme();
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  /**
   * Get icon for current theme mode
   */
  getThemeIcon(): string {
    const mode = this.themeMode();
    switch (mode) {
      case 'light':
        return 'sun';
      case 'dark':
        return 'moon';
      case 'auto':
        return 'auto';
    }
  }

  /**
   * Get label for current theme mode
   */
  getThemeLabel(): string {
    const mode = this.themeMode();
    switch (mode) {
      case 'light':
        return 'Light Mode';
      case 'dark':
        return 'Dark Mode';
      case 'auto':
        return 'Auto Mode';
    }
  }
}
