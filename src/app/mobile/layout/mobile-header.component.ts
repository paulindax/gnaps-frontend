import { Component, inject, signal } from '@angular/core';

import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { DeviceService } from '../../core/services/device.service';

@Component({
  selector: 'app-mobile-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="mobile-header">
      <div class="header-inner">
        <!-- Logo -->
        <a routerLink="/m/dashboard" class="logo">
          <span class="logo-text">GNAPS</span>
        </a>

        <!-- Actions -->
        <div class="actions">
          <button (click)="toggleTheme()" class="icon-btn" aria-label="Toggle theme">
            @if (themeService.appliedTheme() === 'dark') {
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
              </svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clip-rule="evenodd" />
              </svg>
            }
          </button>

          <button (click)="toggleMenu()" class="avatar-btn">
            <span>{{ userInitials }}</span>
          </button>
        </div>
      </div>

      <!-- Dropdown -->
      @if (showMenu()) {
        <div class="menu-backdrop" (click)="showMenu.set(false)"></div>
        <div class="dropdown-menu">
          <div class="user-section">
            <div class="user-avatar">{{ userInitials }}</div>
            <div class="user-info">
              <p class="user-name">{{ authService.currentUserSignal()?.first_name }} {{ authService.currentUserSignal()?.last_name }}</p>
              <p class="user-role">{{ roleDisplay }}</p>
            </div>
          </div>
          <div class="menu-divider"></div>
          <a routerLink="/m/profile" class="menu-item" (click)="showMenu.set(false)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clip-rule="evenodd" />
            </svg>
            Profile
          </a>
          <button class="menu-item" (click)="switchToDesktop()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fill-rule="evenodd" d="M2.25 5.25a3 3 0 013-3h13.5a3 3 0 013 3V15a3 3 0 01-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 01-.53 1.28h-9a.75.75 0 01-.53-1.28l.621-.622a2.25 2.25 0 00.659-1.59V18h-3a3 3 0 01-3-3V5.25zm1.5 0v9.75A1.5 1.5 0 005.25 16.5h13.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5z" clip-rule="evenodd" />
            </svg>
            Desktop View
          </button>
          <div class="menu-divider"></div>
          <button class="menu-item danger" (click)="logout()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fill-rule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z" clip-rule="evenodd" />
            </svg>
            Sign Out
          </button>
        </div>
      }
    </header>
  `,
  styles: [`
    .mobile-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: #fff;
      padding-top: env(safe-area-inset-top);
    }

    :host-context(.dark) .mobile-header {
      background: #0a0a0a;
    }

    .header-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 60px;
      padding: 0 16px;
      border-bottom: 1px solid #f1f1f1;
    }

    :host-context(.dark) .header-inner {
      border-bottom-color: #1a1a1a;
    }

    .logo {
      text-decoration: none;
    }

    .logo-text {
      font-size: 1.5rem;
      font-weight: 700;
      color: #e11d48;
      letter-spacing: -0.02em;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .icon-btn {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .icon-btn:active {
      background: #f5f5f5;
    }

    :host-context(.dark) .icon-btn:active {
      background: #1a1a1a;
    }

    .icon-btn svg {
      width: 24px;
      height: 24px;
      color: #525252;
    }

    :host-context(.dark) .icon-btn svg {
      color: #a3a3a3;
    }

    .avatar-btn {
      width: 40px;
      height: 40px;
      min-width: 40px;
      min-height: 40px;
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: #e11d48;
      border-radius: 50%;
      cursor: pointer;
      flex-shrink: 0;
      transition: transform 0.15s, opacity 0.15s;
    }

    .avatar-btn:active {
      transform: scale(0.95);
      opacity: 0.9;
    }

    .avatar-btn span {
      font-size: 0.875rem;
      font-weight: 600;
      color: #fff;
    }

    .menu-backdrop {
      position: fixed;
      inset: 0;
      z-index: 90;
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 16px;
      width: 280px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12);
      overflow: hidden;
      z-index: 100;
      animation: slideDown 0.2s ease-out;
    }

    :host-context(.dark) .dropdown-menu {
      background: #171717;
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .user-section {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
    }

    .user-avatar {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e11d48;
      border-radius: 50%;
      font-size: 1.125rem;
      font-weight: 600;
      color: #fff;
    }

    .user-info {
      flex: 1;
      min-width: 0;
    }

    .user-name {
      font-size: 1rem;
      font-weight: 600;
      color: #171717;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    :host-context(.dark) .user-name {
      color: #fff;
    }

    .user-role {
      font-size: 0.875rem;
      color: #737373;
      margin: 2px 0 0;
    }

    :host-context(.dark) .user-role {
      color: #a3a3a3;
    }

    .menu-divider {
      height: 1px;
      background: #f1f1f1;
      margin: 4px 0;
    }

    :host-context(.dark) .menu-divider {
      background: #262626;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 14px 16px;
      border: none;
      background: none;
      text-decoration: none;
      font-size: 0.9375rem;
      color: #404040;
      cursor: pointer;
      transition: background 0.15s;
    }

    .menu-item:active {
      background: #f5f5f5;
    }

    :host-context(.dark) .menu-item {
      color: #d4d4d4;
    }

    :host-context(.dark) .menu-item:active {
      background: #262626;
    }

    .menu-item svg {
      width: 20px;
      height: 20px;
      color: #737373;
    }

    :host-context(.dark) .menu-item svg {
      color: #a3a3a3;
    }

    .menu-item.danger {
      color: #dc2626;
    }

    .menu-item.danger svg {
      color: #dc2626;
    }

    :host-context(.dark) .menu-item.danger {
      color: #f87171;
    }

    :host-context(.dark) .menu-item.danger svg {
      color: #f87171;
    }
  `]
})
export class MobileHeaderComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  deviceService = inject(DeviceService);
  router = inject(Router);

  showMenu = signal(false);

  get userInitials(): string {
    const user = this.authService.currentUserSignal();
    if (!user) return 'U';
    const first = user.first_name?.charAt(0) || '';
    const last = user.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  }

  get roleDisplay(): string {
    const role = this.authService.currentUserSignal()?.role;
    const roleMap: Record<string, string> = {
      'system_admin': 'System Admin',
      'national_admin': 'National Executive',
      'region_admin': 'Regional Executive',
      'zone_admin': 'Zonal Executive',
      'school_admin': 'School Admin'
    };
    return roleMap[role || ''] || 'Member';
  }

  toggleMenu(): void {
    this.showMenu.update(v => !v);
  }

  toggleTheme(): void {
    const current = this.themeService.appliedTheme();
    this.themeService.setThemeMode(current === 'dark' ? 'light' : 'dark');
  }

  switchToDesktop(): void {
    this.showMenu.set(false);
    this.deviceService.setDesktopPreference(true);
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.showMenu.set(false);
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
