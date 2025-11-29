// src/app/core/components/layout/side-nav.component.ts
import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavItem } from '../../../models/nav-item.model';
import { LayoutService } from '../../../services/layout.service';
import { AuthService } from '../../../services/auth.service';
import { NavItemComponent } from '../nav-item/nav-item.component';
import { ButtonHelmComponent } from '../../../../shared/ui/button-helm/button-helm.component';
import { cn } from '../../../../../lib/utils';

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [CommonModule, NavItemComponent, ButtonHelmComponent],
  templateUrl: './side-nav.component.html'
})
export class SideNavComponent {
  layoutService = inject(LayoutService);
  authService = inject(AuthService);

  // Filtered navigation items based on role
  filteredNavItems = computed(() => {
    const role = this.authService.userRole();
    return this.navItems.filter(item => item.roles.includes(role || ''));
  });

  // Base classes for fixed positioning and width - mobile-first
  baseClass = computed(() => {
    const collapsed = this.layoutService.sidebarCollapsed();
    const width = this.layoutService.sidebarWidth();
    return cn(
      'fixed bottom-0 left-0 top-20 z-30 flex flex-col border-r-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-card transition-all duration-300 sm:top-20 lg:top-24 shadow-sm',
      width,
      collapsed && 'items-center'
    );
  });

  // Close mobile menu on navigation
  onNavigate(): void {
    this.layoutService.closeMobileMenu();
  }

  // Navigation items (same as header but for desktop)
  private navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: '📊', roles: ['system_admin', 'national_admin', 'regional_admin', 'zone_admin', 'school_user'] },
    { label: 'Schools', route: '/schools', icon: '🏫', roles: ['system_admin', 'national_admin', 'regional_admin', 'zone_admin'] },
    { label: 'Payments', route: '/payments', icon: '💳', roles: ['school_user'] },
    { label: 'News', route: '/news', icon: '📰', roles: ['system_admin', 'national_admin', 'regional_admin', 'zone_admin', 'school_user'] },
    { label: 'Events', route: '/events', icon: '📅', roles: ['system_admin', 'national_admin', 'regional_admin', 'zone_admin', 'school_user'] },
    { label: 'Documents', route: '/documents', icon: '📄', roles: ['system_admin', 'national_admin', 'regional_admin', 'zone_admin', 'school_user'] },
    { label: 'Settings', route: '/settings', icon: '⚙️', roles: ['system_admin', 'national_admin', 'regional_admin', 'zone_admin'] }
  ];
}