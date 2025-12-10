import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';
import { AuthService } from '../../../core/services/auth.service';
import { Position } from '../../../core/models';

@Component({
  selector: 'app-positions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './positions.component.html'
})
export class PositionsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private authService = inject(AuthService);

  protected readonly Math = Math;

  positions = signal<Position[]>([]);
  loading = signal(false);
  showModal = signal(false);
  isEditing = signal(false);
  selectedPosition = signal<Position | null>(null);
  searchQuery = signal('');
  showDeleteDialog = signal(false);
  positionToDelete = signal<Position | null>(null);

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  totalPages = signal(0);

  formData = signal({
    name: ''
  });

  role = this.authService.userRole;

  canEdit = () => {
    const userRole = this.role();
    return userRole !== 'school_admin';
  };

  ngOnInit(): void {
    this.loadPositions();
  }

  loadPositions(): void {
    this.loading.set(true);
    this.settingsService.getPositions(this.currentPage(), this.pageSize(), this.searchQuery()).subscribe({
      next: (response) => {
        this.positions.set(response.data);
        this.totalItems.set(response.pagination.total);
        this.totalPages.set(Math.ceil(response.pagination.total / response.pagination.limit));
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading positions:', error);
        this.loading.set(false);
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadPositions();
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1); // Reset to first page when searching
    this.loadPositions();
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.formData.set({ name: '' });
    this.showModal.set(true);
  }

  openEditModal(position: Position): void {
    this.isEditing.set(true);
    this.selectedPosition.set(position);
    this.formData.set({
      name: position.name
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedPosition.set(null);
    this.formData.set({ name: '' });
  }

  onSubmit(): void {
    const data = this.formData();

    if (!data.name) {
      // Validation is now handled by the backend with flash messages
      return;
    }

    this.loading.set(true);

    if (this.isEditing()) {
      const position = this.selectedPosition();
      console.log(position);
      if (position) {
        this.settingsService.updatePosition(position.id, data).subscribe({
          next: () => {
            this.loadPositions();
            this.closeModal();
          },
          error: (error) => {
            console.error('Error updating position:', error);
            // Flash message is automatically shown by interceptor
            this.loading.set(false);
          }
        });
      }
    } else {
      this.settingsService.createPosition(data).subscribe({
        next: () => {
          this.loadPositions();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error creating position:', error);
          // Flash message is automatically shown by interceptor
          this.loading.set(false);
        }
      });
    }
  }

  openDeleteDialog(position: Position): void {
    this.positionToDelete.set(position);
    this.showDeleteDialog.set(true);
  }

  confirmDelete(): void {
    const position = this.positionToDelete();
    if (!position) return;

    this.loading.set(true);
    this.settingsService.deletePosition(position.id).subscribe({
      next: () => {
        this.loadPositions();
        this.showDeleteDialog.set(false);
        this.positionToDelete.set(null);
      },
      error: (error) => {
        console.error('Error deleting position:', error);
        // Flash message is automatically shown by interceptor
        this.loading.set(false);
      }
    });
  }

  updateFormField(field: string, value: string): void {
    this.formData.update(data => ({ ...data, [field]: value }));
  }
}
