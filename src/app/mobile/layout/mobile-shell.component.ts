import { Component, inject } from '@angular/core';

import { RouterOutlet } from '@angular/router';
import { MobileHeaderComponent } from './mobile-header.component';
import { MobileBottomNavComponent } from './mobile-bottom-nav.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-mobile-shell',
  standalone: true,
  imports: [RouterOutlet, MobileHeaderComponent, MobileBottomNavComponent],
  template: `
    <div class="mobile-shell">
      <app-mobile-header />
      <main class="main-content">
        <router-outlet />
      </main>
      @if (authService.isAuthenticated()) {
        <app-mobile-bottom-nav />
      }
    </div>
  `,
  styles: [`
    .mobile-shell {
      min-height: 100vh;
      min-height: 100dvh;
      background: #efefef;
      display: flex;
      flex-direction: column;
    }

    :host-context(.dark) .mobile-shell {
      background: #0a0a0a;
    }

    .main-content {
      flex: 1;
      padding: 76px 16px 72px;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
  `]
})
export class MobileShellComponent {
  authService = inject(AuthService);
}
