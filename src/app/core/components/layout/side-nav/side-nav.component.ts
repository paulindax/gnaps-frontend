// src/app/core/components/layout/side-nav.component.ts
import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavItem } from '../../../models/nav-item.model';
import { LayoutService } from '../../../services/layout.service';
import { AuthService } from '../../../services/auth.service';
import { NavItemComponent } from '../nav-item/nav-item.component';
import { ButtonHelmComponent } from '../../../../shared/ui/button-helm/button-helm.component';
import { cn } from '../../../../../lib/utils';

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [CommonModule, NavItemComponent, ButtonHelmComponent],
  templateUrl: './side-nav.component.html'
})
export class SideNavComponent {
  layoutService = inject(LayoutService);
  authService = inject(AuthService);

  user = this.authService.currentUserSignal;

  // Categorized navigation sections
  navSections = computed<NavSection[]>(() => {
    const role = this.authService.userRole();
    const allItems = this.navItems.filter(item => item.roles.includes(role || ''));

    const sections: NavSection[] = [
      {
        title: 'Main',
        items: allItems.filter(item =>
          ['Dashboard', 'Schools', 'Payments', 'Executives'].includes(item.label)
        )
      },
      {
        title: 'Content',
        items: allItems.filter(item =>
          ['News', 'Events', 'Documents'].includes(item.label)
        )
      },
      {
        title: 'System',
        items: allItems.filter(item =>
          ['Finance', 'Finance Reports', 'Messaging', 'Settings'].includes(item.label)
        )
      }
    ];

    // Filter out empty sections
    return sections.filter(section => section.items.length > 0);
  });

  // Base classes for fixed positioning and width - mobile-first
  baseClass = computed(() => {
    const collapsed = this.layoutService.sidebarCollapsed();
    const width = this.layoutService.sidebarWidth();
    return cn(
      'fixed bottom-0 left-0 top-20 z-30 flex flex-col border-r-2 border-gray-200 dark:border-gray-600 bg-gradient-to-b from-white via-white to-gray-50/30 dark:from-card dark:via-card dark:to-card/95 transition-all duration-300 sm:top-20 lg:top-24 shadow-lg',
      width,
      collapsed && 'items-center'
    );
  });

  // Role display name
  roleDisplay = computed(() => {
    const role = this.authService.userRole();
    const map: Record<string, string> = {
      system_admin: 'System Admin',
      national_admin: 'National Admin',
      region_admin: 'Regional Admin',
      zone_admin: 'Zone Admin',
      school_admin: 'School User'
    };
    return map[role || ''] || 'User';
  });

  // Close mobile menu on navigation
  onNavigate(): void {
    this.layoutService.closeMobileMenu();
  }

  // Navigation items
  private navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: '📊', roles: ['system_admin', 'national_admin', 'region_admin', 'zone_admin', 'school_admin'] },
    { label: 'Schools', route: '/schools', icon: '🏫', roles: ['system_admin', 'national_admin', 'region_admin', 'zone_admin'] },
    { label: 'Payments', route: '/payments', icon: '💳', roles: ['school_admin'] },
    { label: 'Executives', route: '/executives', icon: '👔', roles: ['system_admin', 'national_admin', 'region_admin', 'zone_admin'] },
    { label: 'News', route: '/news', icon: '📰', roles: ['system_admin', 'national_admin', 'region_admin', 'zone_admin', 'school_admin'] },
    { label: 'Events', route: '/events', icon: '📅', roles: ['system_admin', 'national_admin', 'region_admin', 'zone_admin', 'school_admin'] },
    { label: 'Documents', route: '/documents', icon: '📄', roles: ['system_admin', 'national_admin', 'region_admin', 'zone_admin', 'school_admin'] },
    { label: 'Finance', route: '/finance', icon: '💰', roles: ['system_admin', 'national_admin', 'region_admin', 'zone_admin'] },
    { label: 'Finance Reports', route: '/finance-reports', icon: '📈', roles: ['system_admin', 'national_admin', 'region_admin', 'zone_admin'] },
    { label: 'Messaging', route: '/messaging', icon: '💬', roles: ['system_admin', 'national_admin', 'region_admin', 'zone_admin'] },
    { label: 'Settings', route: '/settings', icon: '⚙️', roles: ['system_admin', 'national_admin', 'region_admin', 'zone_admin'] }
  ];
}
