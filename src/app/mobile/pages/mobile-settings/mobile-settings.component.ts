import { Component, inject, OnInit, signal } from '@angular/core';
import { Location } from '@angular/common';
import { RegionService } from '../../../core/services/region.service';
import { ZoneService } from '../../../core/services/zone.service';

@Component({
  selector: 'app-mobile-settings',
  standalone: true,
  imports: [],
  templateUrl: './mobile-settings.component.html',
  styleUrl: './mobile-settings.component.css'
})
export class MobileSettingsComponent implements OnInit {
  regionService = inject(RegionService);
  zoneService = inject(ZoneService);
  location = inject(Location);

  activeTab = signal<'regions' | 'zones'>('regions');
  regions = signal<any[]>([]);
  zones = signal<any[]>([]);
  regionsLoading = signal(true);
  zonesLoading = signal(true);

  ngOnInit(): void {
    this.loadRegions();
    this.loadZones();
  }

  loadRegions(): void {
    this.regionService.getRegions({ limit: 50 }).subscribe({
      next: (response) => {
        this.regions.set(response.data || []);
        this.regionsLoading.set(false);
      },
      error: () => {
        this.regionsLoading.set(false);
      }
    });
  }

  loadZones(): void {
    this.zoneService.getZones({ limit: 100 }).subscribe({
      next: (response) => {
        this.zones.set(response.data || []);
        this.zonesLoading.set(false);
      },
      error: () => {
        this.zonesLoading.set(false);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}
