// src/app/core/components/layout/layout.component.ts
import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { SideNavComponent } from './side-nav/side-nav.component';
import { LayoutService } from '../../services/layout.service';
import { AuthService } from '../../services/auth.service';
import { cn } from '../../../../lib/utils';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SideNavComponent],
  templateUrl: './layout.component.html'
})
export class LayoutComponent {
  layoutService = inject(LayoutService);
  authService = inject(AuthService);

  isAuthenticated = this.authService.isAuthenticated;

  // Dynamic margin based on sidebar state - mobile-first approach
  mainContentClass = computed(() => {
    if (!this.isAuthenticated()) {
      // Not authenticated - no sidebar, just header offset (responsive height)
      return cn('min-h-screen bg-white dark:bg-background pt-20 transition-all duration-300 sm:pt-20 lg:pt-24 px-6 sm:px-8 lg:px-10');
    }

    // Authenticated - mobile has no sidebar margin, desktop has sidebar margin
    const sidebarMargin = this.layoutService.sidebarCollapsed() ? 'lg:ml-16' : 'lg:ml-64';
    return cn('min-h-screen bg-white dark:bg-background pt-20 transition-all duration-300 sm:pt-20 lg:pt-24 px-6 sm:px-8 lg:px-10', sidebarMargin);
  });
}