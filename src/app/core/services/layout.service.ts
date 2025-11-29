// src/app/core/services/layout.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { NavItem } from '../models/nav-item.model';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  // Mobile menu state
  private _mobileMenuOpen = signal(false);
  readonly mobileMenuOpen = this._mobileMenuOpen.asReadonly();

  // Sidebar collapse state
  private _sidebarCollapsed = signal(false);
  readonly sidebarCollapsed = this._sidebarCollapsed.asReadonly();

  // Computed: sidebar width class
  readonly sidebarWidth = computed(() => 
    this._sidebarCollapsed() ? 'w-32' : 'w-64'
  );

  // Toggle methods
  toggleMobileMenu(): void {
    this._mobileMenuOpen.set(!this._mobileMenuOpen());
  }

  closeMobileMenu(): void {
    this._mobileMenuOpen.set(false);
  }

  toggleSidebar(): void {
    this._sidebarCollapsed.set(!this._sidebarCollapsed());
  }
}