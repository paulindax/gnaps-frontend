import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-mobile-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './mobile-profile.component.html',
  styleUrl: './mobile-profile.component.css'
})
export class MobileProfileComponent {
  authService = inject(AuthService);
  location = inject(Location);

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
      'system_admin': 'System Administrator',
      'national_admin': 'National Executive',
      'region_admin': 'Regional Executive',
      'zone_admin': 'Zonal Executive',
      'school_admin': 'School Administrator'
    };
    return roleMap[role || ''] || 'Member';
  }

  goBack(): void {
    this.location.back();
  }
}
