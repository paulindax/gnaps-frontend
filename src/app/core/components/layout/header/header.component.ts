// src/app/core/components/layout/header.component.ts
import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { LayoutService } from '../../../services/layout.service';
import { ButtonHelmComponent } from '../../../../shared/ui/button-helm/button-helm.component';
import { SheetComponent } from '../../../../shared/ui/sheet/sheet.component';
import { NavItem } from '../../../models/nav-item.model';
import { NavItemComponent } from '../nav-item/nav-item.component';
import { ThemeToggleComponent } from '../../ui/theme-toggle/theme-toggle.component';
import { DropdownMenuComponent, DropdownMenuItem } from '../../../../shared/ui/dropdown-menu/dropdown-menu.component';
import { LoadingBarComponent } from '../loading-bar/loading-bar.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule,SheetComponent,ButtonHelmComponent,NavItemComponent,ThemeToggleComponent,DropdownMenuComponent],
  providers: [ButtonHelmComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  layoutService = inject(LayoutService);

  user = this.authService.currentUserSignal;

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
  userMenuItems: DropdownMenuItem[] = [
    {
      label: 'Profile',
      icon: '👤',
      action: () => this.navigateToProfile()
    },
    {
      label: 'Change Password',
      icon: '🔒',
      action: () => this.navigateToChangePassword()
    },
    {
      label: 'Logout',
      icon: '🚪',
      action: () => this.logout(),
      variant: 'destructive'
    }
  ];

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
      { label: 'Settings', route: '/settings', icon: '⚙️', roles: ['system_admin', 'national_admin', 'regional_admin', 'zone_admin'] }
    ];
  }
}