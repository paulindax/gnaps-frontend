// src/app/core/components/layout/header.component.ts
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { LayoutService } from '../../../services/layout.service';
import { BreadcrumbService } from '../../../services/breadcrumb.service';
import { ButtonHelmComponent } from '../../../../shared/ui/button-helm/button-helm.component';
import { SheetComponent } from '../../../../shared/ui/sheet/sheet.component';
import { NavItem } from '../../../models/nav-item.model';
import { NavItemComponent } from '../nav-item/nav-item.component';
import { ThemeToggleComponent } from '../../ui/theme-toggle/theme-toggle.component';
import { DropdownMenuComponent, DropdownMenuItem } from '../../../../shared/components/dropdown-menu/dropdown-menu.component';
import { LoadingBarComponent } from '../loading-bar/loading-bar.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, SheetComponent, ButtonHelmComponent, NavItemComponent, ThemeToggleComponent, DropdownMenuComponent],
  providers: [ButtonHelmComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  layoutService = inject(LayoutService);
  breadcrumbService = inject(BreadcrumbService);

  user = this.authService.currentUserSignal;
  breadcrumbs = this.breadcrumbService.breadcrumbs;

  // Dropdown state
  profileDropdownOpen = signal(false);
  dropdownTrigger = signal<HTMLElement | undefined>(undefined);

  // Role display name mapping
  roleDisplay = computed(() => {
    const role = this.authService.userRole();
    const map: Record<string, string> = {
      system_admin: 'System Admin',
      national_admin: 'National Admin',
      regional_admin: 'Regional Admin',
      zone_admin: 'Zone Admin',
      school_user: 'School User'
    };
    return map[role || ''] || 'User';
  });

  // Navigation items for mobile
  navItems = computed(() => {
    const role = this.authService.userRole();
    return this.getNavItems().filter(item => item.roles.includes(role || ''));
  });

  // User dropdown menu items
  getUserMenuItems(): DropdownMenuItem[] {
    return [
      {
        label: 'Profile',
        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
        action: 'profile'
      },
      {
        label: 'Change Password',
        icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
        action: 'change-password'
      },
      {
        label: 'Logout',
        icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
        action: 'logout',
        variant: 'destructive',
        dividerBefore: true
      }
    ];
  }

  toggleProfileDropdown(event: Event): void {
    this.profileDropdownOpen.update(v => !v);
    if (this.profileDropdownOpen()) {
      this.dropdownTrigger.set(event.currentTarget as HTMLElement);
    } else {
      this.dropdownTrigger.set(undefined);
    }
  }

  closeProfileDropdown(): void {
    this.profileDropdownOpen.set(false);
    this.dropdownTrigger.set(undefined);
  }

  handleProfileMenuAction(action: string): void {
    switch (action) {
      case 'profile':
        this.navigateToProfile();
        break;
      case 'change-password':
        this.navigateToChangePassword();
        break;
      case 'logout':
        this.logout();
        break;
    }
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  navigateToChangePassword(): void {
    this.router.navigate(['/change-password']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private getNavItems(): NavItem[] {
    return [
      { label: 'Dashboard', route: '/dashboard', icon: '📊', roles: ['system_admin', 'national_admin', 'regional_admin', 'zone_admin', 'school_user'] },
      { label: 'Schools', route: '/schools', icon: '🏫', roles: ['system_admin', 'national_admin', 'regional_admin', 'zone_admin'] },
      { label: 'Payments', route: '/payments', icon: '💳', roles: ['school_user'] },
      { label: 'News', route: '/news', icon: '📰', roles: ['system_admin', 'national_admin', 'regional_admin', 'zone_admin', 'school_user'] },
      { label: 'Events', route: '/events', icon: '📅', roles: ['system_admin', 'national_admin', 'regional_admin', 'zone_admin', 'school_user'] },
      { label: 'Documents', route: '/documents', icon: '📄', roles: ['system_admin', 'national_admin', 'regional_admin', 'zone_admin', 'school_user'] },
      { label: 'Finance', route: '/finance', icon: '💰', roles: ['system_admin', 'national_admin'] },
      { label: 'Settings', route: '/settings', icon: '⚙️', roles: ['system_admin', 'national_admin', 'regional_admin', 'zone_admin'] }
    ];
  }
}
