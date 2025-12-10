import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { News, Region, Zone, Group, School } from '../../../core/models';
import { NewsService } from '../../../core/services/news.service';
import { SettingsService } from '../../../core/services/settings.service';
import { SchoolService } from '../../../core/services/school.service';
import { AuthService } from '../../../core/services/auth.service';
import { FlashMessageService } from '../../../core/services/flash-message.service';
import { ImageUploadComponent } from '../../../shared/ui/image-upload/image-upload.component';

@Component({
  selector: 'app-news-form',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, ImageUploadComponent],
  templateUrl: './news-form.component.html'
})
export class NewsFormComponent implements OnInit {
  private newsService = inject(NewsService);
  private settingsService = inject(SettingsService);
  private schoolService = inject(SchoolService);
  private authService = inject(AuthService);
  private flashMessage = inject(FlashMessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(false);
  isEditing = signal(false);
  newsId = signal<number | null>(null);

  // Form data
  formData = signal({
    title: '',
    content: '',
    excerpt: '',
    image_url: '',
    category: '',
    status: 'draft' as 'draft' | 'published',
    featured: false,
    region_ids: [] as number[],
    zone_ids: [] as number[],
    group_ids: [] as number[],
    school_ids: [] as number[]
  });

  // Available options for targeting
  regions = signal<Region[]>([]);
  zones = signal<Zone[]>([]);
  groups = signal<Group[]>([]);
  schools = signal<School[]>([]);

  // User role
  role = this.authService.userRole;

  // Available categories
  categories = ['General', 'Events', 'Announcements', 'Updates', 'Important'];

  // Options for ng-select
  categoryOptions = [
    { value: '', label: 'Select a category' },
    ...this.categories.map(cat => ({ value: cat, label: cat }))
  ];

  statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' }
  ];

  // Character limits
  readonly TITLE_MAX_LENGTH = 200;
  readonly EXCERPT_MAX_LENGTH = 300;
  readonly CONTENT_MAX_LENGTH = 10000;

  getTitleCharCount = () => this.formData().title.length;
  getExcerptCharCount = () => this.formData().excerpt.length;
  getContentCharCount = () => this.formData().content.length;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      const numericId = parseInt(id, 10);
      this.newsId.set(numericId);
      this.loadNews(numericId);
    }
    this.loadOptions();
  }

  loadNews(id: number): void {
    this.loading.set(true);
    this.newsService.getNewsById(id).subscribe({
      next: (news) => {
        this.formData.set({
          title: news.title,
          content: news.content,
          excerpt: news.excerpt || '',
          image_url: news.image_url || '',
          category: news.category || '',
          status: news.status,
          featured: news.featured,
          region_ids: news.region_ids || [],
          zone_ids: news.zone_ids || [],
          group_ids: news.group_ids || [],
          school_ids: news.school_ids || []
        });
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading news:', error);
        this.flashMessage.error('Failed to load news');
        this.loading.set(false);
      }
    });
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
    this.settingsService.getZones(1, 100).subscribe({
      next: (response) => this.zones.set(response.data),
      error: (error) => console.error('Error loading zones:', error)
    });

    // Load groups
    this.settingsService.getGroups(1, 100).subscribe({
      next: (response) => this.groups.set(response.data),
      error: (error) => console.error('Error loading groups:', error)
    });

    // Load schools
    this.schoolService.getSchools({ page: 1, limit: 100 }).subscribe({
      next: (response) => this.schools.set(response.data),
      error: (error) => console.error('Error loading schools:', error)
    });
  }

  canSelectRegions(): boolean {
    const userRole = this.role();
    return userRole === 'system_admin' || userRole === 'national_admin';
  }

  canSelectZones(): boolean {
    const userRole = this.role();
    return userRole === 'system_admin' || userRole === 'national_admin' || userRole === 'region_admin';
  }

  canSelectGroups(): boolean {
    const userRole = this.role();
    return userRole === 'system_admin' || userRole === 'national_admin';
  }

  canSelectSchools(): boolean {
    const userRole = this.role();
    return userRole !== 'school_admin';
  }

  onRegionToggle(regionId: number): void {
    const current = this.formData().region_ids;
    const updated = current.includes(regionId)
      ? current.filter(id => id !== regionId)
      : [...current, regionId];
    this.formData.update(data => ({ ...data, region_ids: updated }));
  }

  onZoneToggle(zoneId: number): void {
    const current = this.formData().zone_ids;
    const updated = current.includes(zoneId)
      ? current.filter(id => id !== zoneId)
      : [...current, zoneId];
    this.formData.update(data => ({ ...data, zone_ids: updated }));
  }

  onGroupToggle(groupId: number): void {
    const current = this.formData().group_ids;
    const updated = current.includes(groupId)
      ? current.filter(id => id !== groupId)
      : [...current, groupId];
    this.formData.update(data => ({ ...data, group_ids: updated }));
  }

  onSchoolToggle(schoolId: number): void {
    const current = this.formData().school_ids;
    const updated = current.includes(schoolId)
      ? current.filter(id => id !== schoolId)
      : [...current, schoolId];
    this.formData.update(data => ({ ...data, school_ids: updated }));
  }

  isRegionSelected(regionId: number): boolean {
    return this.formData().region_ids.includes(regionId);
  }

  isZoneSelected(zoneId: number): boolean {
    return this.formData().zone_ids.includes(zoneId);
  }

  isGroupSelected(groupId: number): boolean {
    return this.formData().group_ids.includes(groupId);
  }

  isSchoolSelected(schoolId: number): boolean {
    return this.formData().school_ids.includes(schoolId);
  }

  updateField(field: string, value: any): void {
    this.formData.update(data => ({ ...data, [field]: value }));
  }

  onSubmit(): void {
    const data = this.formData();

    // Validate required fields
    if (!data.title || !data.content) {
      this.flashMessage.error('Title and content are required');
      return;
    }

    this.loading.set(true);

    const newsData = {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt || undefined,
      image_url: data.image_url || undefined,
      category: data.category || undefined,
      status: data.status,
      featured: data.featured,
      region_ids: data.region_ids.length > 0 ? data.region_ids : undefined,
      zone_ids: data.zone_ids.length > 0 ? data.zone_ids : undefined,
      group_ids: data.group_ids.length > 0 ? data.group_ids : undefined,
      school_ids: data.school_ids.length > 0 ? data.school_ids : undefined
    };

    if (this.isEditing()) {
      const id = this.newsId();
      if (id) {
        this.newsService.updateNews(id, newsData).subscribe({
          next: () => {
            this.router.navigate(['/news']);
          },
          error: (error) => {
            console.error('Error updating news:', error);
            this.loading.set(false);
          }
        });
      }
    } else {
      this.newsService.createNews(newsData).subscribe({
        next: () => {
          this.router.navigate(['/news']);
        },
        error: (error) => {
          console.error('Error creating news:', error);
          this.loading.set(false);
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/news']);
  }
}
