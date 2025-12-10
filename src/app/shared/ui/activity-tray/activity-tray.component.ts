import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ActivityTrackerService, Activity, ActivityType } from '../../../core/services/activity-tracker.service';

@Component({
  selector: 'app-activity-tray',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity-tray.component.html'
})
export class ActivityTrayComponent {
  activityTracker = inject(ActivityTrackerService);
  private router = inject(Router);

  // Close on escape key
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.activityTracker.isOpen()) {
      this.activityTracker.closeTray();
    }
  }

  // Navigate to activity URL if available
  navigateToActivity(activity: Activity): void {
    if (activity.url) {
      this.activityTracker.closeTray();
      this.router.navigateByUrl(activity.url);
    }
  }

  // Get icon path for activity type
  getIconPath(type: ActivityType): string {
    return this.activityTracker.getActivityConfig(type).icon;
  }

  // Get icon color for activity type
  getIconColor(type: ActivityType): string {
    return this.activityTracker.getActivityConfig(type).color;
  }

  // Format relative time
  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    });
  }

  // Format full timestamp
  formatFullTime(date: Date): string {
    return new Date(date).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Close tray when clicking backdrop
  onBackdropClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('backdrop')) {
      this.activityTracker.closeTray();
    }
  }

  // Clear all activities with confirmation
  clearAllActivities(): void {
    if (confirm('Clear all activity history? This cannot be undone.')) {
      this.activityTracker.clearAll();
    }
  }

  // Refresh activities from backend (system admin only)
  refreshActivities(): void {
    this.activityTracker.loadRecentFromBackend(24);
  }

  // Get user initials from username
  getUserInitials(username: string): string {
    if (!username) return '?';
    const parts = username.split(/[._\s-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  }

  // Format role for display
  formatRole(role: string): string {
    if (!role) return '';
    const roleMap: Record<string, string> = {
      'system_admin': 'Admin',
      'national_admin': 'National',
      'region_admin': 'Regional',
      'zone_admin': 'Zone',
      'school_admin': 'School'
    };
    return roleMap[role] || role.replace(/_/g, ' ');
  }

  // View activities for a specific user
  viewUserActivities(event: Event, activity: Activity): void {
    event.stopPropagation(); // Prevent navigating to activity URL
    if (activity.user_id && activity.username) {
      this.activityTracker.loadUserActivities(activity.user_id, activity.username);
    }
  }

  // Clear user filter
  clearUserFilter(): void {
    this.activityTracker.clearUserFilter();
  }
}
