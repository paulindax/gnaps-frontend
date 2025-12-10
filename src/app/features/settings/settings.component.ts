import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { RegionsComponent } from './regions/regions.component';
import { ZonesComponent } from './zones/zones.component';
import { PositionsComponent } from './positions/positions.component';
import { GroupsComponent } from './groups/groups.component';

type TabType = 'regions' | 'zones' | 'positions' | 'groups';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RegionsComponent, ZonesComponent, PositionsComponent, GroupsComponent],
  templateUrl: './settings.component.html'
})
export class SettingsComponent {
  private authService = inject(AuthService);

  activeTab = signal<TabType>('regions');
  role = this.authService.userRole;

  // Define which roles can access which tabs
  canAccessRegions = computed(() => {
    const userRole = this.role();
    return userRole === 'system_admin' || userRole === 'national_admin';
  });

  canAccessZones = computed(() => {
    const userRole = this.role();
    return userRole === 'system_admin' || userRole === 'national_admin' || userRole === 'region_admin';
  });

  canAccessPositions = computed(() => {
    const userRole = this.role();
    return userRole !== 'school_admin';
  });

  canAccessGroups = computed(() => {
    const userRole = this.role();
    return userRole !== 'school_admin';
  });

  // Available tabs based on role
  availableTabs = computed(() => {
    const tabs: { id: TabType; label: string; icon: string }[] = [];

    if (this.canAccessRegions()) {
      tabs.push({ id: 'regions', label: 'Regions', icon: '🗺️' });
    }
    if (this.canAccessZones()) {
      tabs.push({ id: 'zones', label: 'Zones', icon: '📍' });
    }
    if (this.canAccessPositions()) {
      tabs.push({ id: 'positions', label: 'Positions', icon: '👔' });
    }
    if (this.canAccessGroups()) {
      tabs.push({ id: 'groups', label: 'Groups', icon: '👥' });
    }

    return tabs;
  });

  constructor() {
    // Set initial tab to first available
    const firstTab = this.availableTabs()[0];
    if (firstTab) {
      this.activeTab.set(firstTab.id);
    }
  }

  setActiveTab(tab: TabType): void {
    this.activeTab.set(tab);
  }

  isTabActive(tab: TabType): boolean {
    return this.activeTab() === tab;
  }
}
