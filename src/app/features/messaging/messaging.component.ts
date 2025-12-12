import { Component, signal, inject, OnInit, computed } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { MessagingService } from '../../core/services/messaging.service';
import { SettingsService } from '../../core/services/settings.service';
import { SchoolService } from '../../core/services/school.service';
import { ExecutivesService } from '../../core/services/executives.service';
import { AuthService } from '../../core/services/auth.service';
import { FlashMessageService } from '../../core/services/flash-message.service';
import { Region, Zone, School, Executive } from '../../core/models';

// Extended interface for display purposes
interface ExecutiveDisplay {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  position_name?: string;
  region_id?: number;
  region_name?: string;
  zone_id?: number;
  zone_name?: string;
}

// Extended school with region info
interface SchoolWithRegion extends School {
  region_id?: number;
}

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [FormsModule, NgSelectModule],
  templateUrl: './messaging.component.html'
})
export class MessagingComponent implements OnInit {
  private messagingService = inject(MessagingService);
  private settingsService = inject(SettingsService);
  private schoolService = inject(SchoolService);
  private executivesService = inject(ExecutivesService);
  private authService = inject(AuthService);
  private flashMessage = inject(FlashMessageService);

  // Loading states
  loading = signal(false);
  loadingRecipients = signal(false);
  sending = signal(false);

  // User info
  role = this.authService.userRole;

  // Message types (multiple selection allowed)
  selectedChannels = signal<('sms' | 'whatsapp' | 'email')[]>(['sms']);

  // Recipient type
  recipientType = signal<'schools' | 'executives'>('schools');

  // Filter options
  regions = signal<Region[]>([]);
  zones = signal<Zone[]>([]);
  filteredZones = signal<Zone[]>([]);
  schools = signal<SchoolWithRegion[]>([]);
  executives = signal<ExecutiveDisplay[]>([]);

  // Zone to Region mapping for school filtering
  private zoneRegionMap = new Map<number, number>();

  // Selected filters
  selectedRegionIds = signal<number[]>([]);
  selectedZoneIds = signal<number[]>([]);
  selectedSchoolIds = signal<number[]>([]);
  selectedExecutiveIds = signal<number[]>([]);

  // Select all toggles
  selectAllSchools = signal(false);
  selectAllExecutives = signal(false);

  // Message content
  messageContent = signal('');

  // SMS units info
  availableUnits = signal(0);

  // Computed SMS count
  smsUnitCount = computed(() => {
    const msg = this.messageContent();
    if (!msg) return 0;
    return this.messagingService.countSmsUnits(msg);
  });

  // Character count
  charCount = computed(() => this.messageContent().length);

  // Recipients count
  recipientsCount = computed(() => {
    if (this.recipientType() === 'schools') {
      if (this.selectAllSchools()) {
        return this.filteredSchools().length;
      }
      return this.selectedSchoolIds().length;
    } else {
      if (this.selectAllExecutives()) {
        return this.filteredExecutives().length;
      }
      return this.selectedExecutiveIds().length;
    }
  });

  // Total SMS units needed
  totalUnitsNeeded = computed(() => {
    return this.smsUnitCount() * this.recipientsCount();
  });

  // Filtered schools based on region/zone selection
  filteredSchools = computed(() => {
    const schools = this.schools();
    const regionIds = this.selectedRegionIds();
    const zoneIds = this.selectedZoneIds();

    if (regionIds.length === 0 && zoneIds.length === 0) {
      return schools;
    }

    return schools.filter(school => {
      // Filter by zone
      if (zoneIds.length > 0 && school.zone_id && !zoneIds.includes(school.zone_id)) {
        return false;
      }
      // Filter by region (via zone)
      if (regionIds.length > 0) {
        const schoolRegionId = school.region_id || (school.zone_id ? this.zoneRegionMap.get(school.zone_id) : undefined);
        if (!schoolRegionId || !regionIds.includes(schoolRegionId)) {
          return false;
        }
      }
      return true;
    });
  });

  // Filtered executives based on region/zone selection
  filteredExecutives = computed(() => {
    const executives = this.executives();
    const regionIds = this.selectedRegionIds();
    const zoneIds = this.selectedZoneIds();

    if (regionIds.length === 0 && zoneIds.length === 0) {
      return executives;
    }

    return executives.filter(exec => {
      if (regionIds.length > 0 && exec.region_id && !regionIds.includes(exec.region_id)) {
        return false;
      }
      if (zoneIds.length > 0 && exec.zone_id && !zoneIds.includes(exec.zone_id)) {
        return false;
      }
      return true;
    });
  });

  ngOnInit(): void {
    this.loadOptions();
    this.loadAvailableUnits();
  }

  loadOptions(): void {
    const userRole = this.role();

    // Load regions (for system/national admins)
    if (userRole === 'system_admin' || userRole === 'national_admin') {
      this.settingsService.getRegions(1, 100).subscribe({
        next: (response) => this.regions.set(response.data),
        error: (error) => console.error('Error loading regions:', error)
      });
    }

    // Load zones
    this.settingsService.getZones(1, 1000).subscribe({
      next: (response) => {
        this.zones.set(response.data);
        this.filteredZones.set(response.data);
        // Build zone to region mapping
        response.data.forEach(zone => {
          if (zone.region_id) {
            this.zoneRegionMap.set(zone.id, zone.region_id);
          }
        });
      },
      error: (error) => console.error('Error loading zones:', error)
    });

    // Load schools
    this.loadSchools();

    // Load executives
    this.loadExecutives();
  }

  loadSchools(): void {
    this.loadingRecipients.set(true);
    this.schoolService.getSchools({ page: 1, limit: 10000 }).subscribe({
      next: (response) => {
        // Add region_id to schools based on their zone
        const schoolsWithRegion: SchoolWithRegion[] = response.data.map(school => ({
          ...school,
          region_id: school.zone_id ? this.zoneRegionMap.get(school.zone_id) : undefined
        }));
        this.schools.set(schoolsWithRegion);
        this.loadingRecipients.set(false);
      },
      error: (error) => {
        console.error('Error loading schools:', error);
        this.loadingRecipients.set(false);
      }
    });
  }

  loadExecutives(): void {
    this.executivesService.getExecutives(1, 5000).subscribe({
      next: (response) => {
        // Transform executives to display format
        const displayExecs: ExecutiveDisplay[] = response.data.map(exec => ({
          id: exec.id,
          name: `${exec.first_name} ${exec.last_name}`.trim(),
          phone: exec.mobile_no,
          email: exec.email,
          position_name: exec.position_name,
          region_id: exec.region_id,
          region_name: exec.region_name,
          zone_id: exec.zone_id,
          zone_name: exec.zone_name
        }));
        this.executives.set(displayExecs);
      },
      error: (error) => console.error('Error loading executives:', error)
    });
  }

  loadAvailableUnits(): void {
    // Owner info is derived from JWT on backend
    this.messagingService.getAvailableUnits().subscribe({
      next: (response) => {
        this.availableUnits.set(response.data.available_units);
      },
      error: (error) => console.error('Error loading available units:', error)
    });
  }

  onRegionChange(): void {
    const regionIds = this.selectedRegionIds();
    if (regionIds.length === 0) {
      this.filteredZones.set(this.zones());
    } else {
      this.filteredZones.set(
        this.zones().filter(zone => regionIds.includes(zone.region_id || 0))
      );
    }
    // Reset zone selection if no longer valid
    this.selectedZoneIds.update(ids =>
      ids.filter(id => this.filteredZones().some(z => z.id === id))
    );
    // Reset school/executive selection
    this.selectedSchoolIds.set([]);
    this.selectedExecutiveIds.set([]);
    this.selectAllSchools.set(false);
    this.selectAllExecutives.set(false);
  }

  onZoneChange(): void {
    // Reset school/executive selection
    this.selectedSchoolIds.set([]);
    this.selectedExecutiveIds.set([]);
    this.selectAllSchools.set(false);
    this.selectAllExecutives.set(false);
  }

  onSelectAllSchoolsChange(): void {
    if (this.selectAllSchools()) {
      this.selectedSchoolIds.set(this.filteredSchools().map(s => s.id));
    } else {
      this.selectedSchoolIds.set([]);
    }
  }

  onSelectAllExecutivesChange(): void {
    if (this.selectAllExecutives()) {
      this.selectedExecutiveIds.set(this.filteredExecutives().map(e => e.id));
    } else {
      this.selectedExecutiveIds.set([]);
    }
  }

  canSelectRegions(): boolean {
    const userRole = this.role();
    return userRole === 'system_admin' || userRole === 'national_admin';
  }

  canSelectZones(): boolean {
    const userRole = this.role();
    return userRole === 'system_admin' || userRole === 'national_admin' || userRole === 'region_admin';
  }

  getRecipientPhones(): string[] {
    const phones: string[] = [];

    if (this.recipientType() === 'schools') {
      const schoolIds = this.selectAllSchools()
        ? this.filteredSchools().map(s => s.id)
        : this.selectedSchoolIds();

      this.schools()
        .filter(s => schoolIds.includes(s.id))
        .forEach(school => {
          // Get school contact phone (mobile_no)
          if (school.mobile_no) {
            phones.push(school.mobile_no);
          }
          // Also get contact persons if available
          if (school.contact_persons) {
            school.contact_persons.forEach((cp) => {
              if (cp.mobile_no) phones.push(cp.mobile_no);
            });
          }
        });
    } else {
      const execIds = this.selectAllExecutives()
        ? this.filteredExecutives().map(e => e.id)
        : this.selectedExecutiveIds();

      this.executives()
        .filter(e => execIds.includes(e.id))
        .forEach(exec => {
          if (exec.phone) {
            phones.push(exec.phone);
          }
        });
    }

    // Remove duplicates
    return [...new Set(phones)];
  }

  // Toggle channel selection
  toggleChannel(channel: 'sms' | 'whatsapp' | 'email'): void {
    this.selectedChannels.update(channels => {
      if (channels.includes(channel)) {
        // Don't allow deselecting if it's the only channel
        if (channels.length === 1) return channels;
        return channels.filter(c => c !== channel);
      } else {
        return [...channels, channel];
      }
    });
  }

  // Check if a channel is selected
  isChannelSelected(channel: 'sms' | 'whatsapp' | 'email'): boolean {
    return this.selectedChannels().includes(channel);
  }

  // Check if SMS is among selected channels (for showing SMS-specific UI)
  hasSmsSelected(): boolean {
    return this.selectedChannels().includes('sms');
  }

  sendMessage(): void {
    const message = this.messageContent().trim();
    if (!message) {
      this.flashMessage.error('Please enter a message');
      return;
    }

    const recipients = this.getRecipientPhones();
    if (recipients.length === 0) {
      this.flashMessage.error('No recipients selected or no phone numbers available');
      return;
    }

    const channels = this.selectedChannels();
    if (channels.length === 0) {
      this.flashMessage.error('Please select at least one message channel');
      return;
    }

    // Check SMS units if SMS is selected
    if (channels.includes('sms')) {
      const unitsNeeded = this.smsUnitCount() * recipients.length;
      if (unitsNeeded > this.availableUnits()) {
        this.flashMessage.error(`Insufficient SMS units. Need ${unitsNeeded}, have ${this.availableUnits()}`);
        return;
      }
    }

    this.sending.set(true);

    // Send via each selected channel
    const sendPromises: string[] = [];

    if (channels.includes('sms')) {
      // Owner info is derived from JWT on backend
      this.messagingService.sendSms({
        message,
        recipients
      }).subscribe({
        next: () => {
          sendPromises.push('SMS');
          this.checkSendComplete(sendPromises, channels, recipients.length);
        },
        error: (error) => {
          console.error('Error sending SMS:', error);
          this.flashMessage.error(error.message || 'Failed to send SMS');
          this.sending.set(false);
        }
      });
    }

    if (channels.includes('whatsapp')) {
      this.flashMessage.info('WhatsApp messaging coming soon');
      sendPromises.push('WhatsApp');
    }

    if (channels.includes('email')) {
      this.flashMessage.info('Email messaging coming soon');
      sendPromises.push('Email');
    }

    // If only non-SMS channels were selected
    if (!channels.includes('sms')) {
      this.sending.set(false);
    }
  }

  private checkSendComplete(completed: string[], channels: string[], recipientCount: number): void {
    if (completed.length >= channels.filter(c => c === 'sms').length) {
      const channelNames = completed.join(', ');
      this.flashMessage.success(`Message sent successfully via ${channelNames} to ${recipientCount} recipients`);
      this.messageContent.set('');
      this.loadAvailableUnits();
      this.sending.set(false);
    }
  }
}
