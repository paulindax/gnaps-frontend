import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable confirmation dialog component
 *
 * @example
 * ```typescript
 * showDeleteDialog = signal(false);
 * itemToDelete = signal<Item | null>(null);
 *
 * openDeleteDialog(item: Item) {
 *   this.itemToDelete.set(item);
 *   this.showDeleteDialog.set(true);
 * }
 *
 * confirmDelete() {
 *   const item = this.itemToDelete();
 *   if (item) {
 *     this.service.delete(item.id).subscribe(...);
 *   }
 *   this.showDeleteDialog.set(false);
 * }
 * ```
 *
 * @example
 * ```html
 * <app-confirm-dialog
 *   [show]="showDeleteDialog()"
 *   title="Delete Item"
 *   [message]="'Are you sure you want to delete \"' + itemToDelete()?.name + '\"?'"
 *   confirmLabel="Delete"
 *   confirmClass="bg-destructive text-destructive-foreground hover:bg-destructive/90"
 *   (confirm)="confirmDelete()"
 *   (cancel)="showDeleteDialog.set(false)"
 * />
 * ```
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html'
})
export class ConfirmDialogComponent {
  /** Whether to show the dialog */
  show = input<boolean>(false);

  /** Dialog title */
  title = input<string>('Confirm Action');

  /** Dialog message/content */
  message = input<string>('Are you sure you want to proceed?');

  /** Label for the confirm button */
  confirmLabel = input<string>('Confirm');

  /** Label for the cancel button */
  cancelLabel = input<string>('Cancel');

  /** CSS classes for the confirm button (for styling danger/primary actions) */
  confirmClass = input<string>('bg-primary text-primary-foreground hover:bg-primary/90');

  /** Emitted when user confirms the action */
  confirm = output<void>();

  /** Emitted when user cancels the action */
  cancel = output<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
