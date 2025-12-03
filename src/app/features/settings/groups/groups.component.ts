import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';
import { AuthService } from '../../../core/services/auth.service';
import { Group } from '../../../core/models';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './groups.component.html'
})
export class GroupsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private authService = inject(AuthService);

  protected readonly Math = Math;

  groups = signal<Group[]>([]);
  loading = signal(false);
  showModal = signal(false);
  isEditing = signal(false);
  selectedGroup = signal<Group | null>(null);
  searchQuery = signal('');
  showDeleteDialog = signal(false);
  groupToDelete = signal<Group | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  totalPages = signal(0);

  formData = signal({
    name: '',
    description: ''
  });

  role = this.authService.userRole;

  canEdit = () => {
    const userRole = this.role();
    return userRole !== 'school_user';
  };

  ngOnInit(): void {
    this.loadGroups();
  }



  loadGroups(): void {
    this.loading.set(true);
    this.settingsService.getGroups(this.currentPage(), this.pageSize(), undefined, this.searchQuery()).subscribe({
      next: (response) => {
        this.groups.set(response.data);
        this.totalItems.set(response.pagination.total);
        this.totalPages.set(Math.ceil(response.pagination.total / response.pagination.limit));
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading groups:', error);
        this.loading.set(false);
      }
    });
  }



  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadGroups();
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1); // Reset to first page when searching
    this.loadGroups();
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.formData.set({ name: '', description: '' });
    this.showModal.set(true);
  }

  openEditModal(group: Group): void {
    this.isEditing.set(true);
    this.selectedGroup.set(group);
    this.formData.set({
      name: group.name,
      description: group.description || ''
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedGroup.set(null);
    this.formData.set({ name: '', description: '' });
  }

  onSubmit(): void {
    const data = this.formData();

    if (!data.name) {
      // Validation is now handled by the backend with flash messages
      return;
    }

    this.loading.set(true);

    if (this.isEditing()) {
      const group = this.selectedGroup();
      if (group) {
        this.settingsService.updateGroup(group.id, data).subscribe({
          next: () => {
            this.loadGroups();
            this.closeModal();
          },
          error: (error) => {
            console.error('Error updating group:', error);
            // Flash message is automatically shown by interceptor
            this.loading.set(false);
          }
        });
      }
    } else {
      this.settingsService.createGroup(data).subscribe({
        next: () => {
          this.loadGroups();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creating group:', error);
          // Flash message is automatically shown by interceptor
          this.loading.set(false);
        }
      });
    }
  }

  openDeleteDialog(group: Group): void {
    this.groupToDelete.set(group);
    this.showDeleteDialog.set(true);
  }

  confirmDelete(): void {
    const group = this.groupToDelete();
    if (!group) return;

    this.loading.set(true);
    this.settingsService.deleteGroup(group.id).subscribe({
      next: () => {
        this.loadGroups();
        this.showDeleteDialog.set(false);
        this.groupToDelete.set(null);
      },
      error: (error) => {
        console.error('Error deleting group:', error);
        // Flash message is automatically shown by interceptor
        this.loading.set(false);
      }
    });
  }

  updateFormField(field: string, value: string): void {
    this.formData.update(data => ({ ...data, [field]: value }));
  }
}
