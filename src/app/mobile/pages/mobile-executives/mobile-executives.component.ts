import { Component, inject, OnInit, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ExecutivesService } from '../../../core/services/executives.service';

@Component({
  selector: 'app-mobile-executives',
  standalone: true,
  imports: [],
  templateUrl: './mobile-executives.component.html',
  styleUrl: './mobile-executives.component.css'
})
export class MobileExecutivesComponent implements OnInit {
  executivesService = inject(ExecutivesService);
  location = inject(Location);

  executives = signal<any[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadExecutives();
  }

  loadExecutives(): void {
    this.executivesService.getExecutives(1, 50).subscribe({
      next: (response) => {
        this.executives.set(response.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getInitials(exec: any): string {
    const first = exec.first_name?.charAt(0) || '';
    const last = exec.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || 'E';
  }

  formatRole(role: string): string {
    const roleMap: Record<string, string> = {
      'national_admin': 'National',
      'region_admin': 'Regional',
      'zone_admin': 'Zonal'
    };
    return roleMap[role] || role;
  }

  goBack(): void {
    this.location.back();
  }
}
