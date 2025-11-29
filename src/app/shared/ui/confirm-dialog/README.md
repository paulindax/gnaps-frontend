# ConfirmDialog Component

A reusable confirmation dialog component for Angular applications. Replaces browser's native `confirm()` with a styled, consistent modal dialog.

## Features

- Customizable title, message, and button labels
- Support for different button styles (danger, primary, etc.)
- Modal overlay with backdrop
- Signal-based API
- Type-safe event emissions
- Accessible and responsive design

## Usage

### Basic Example

```typescript
import { ConfirmDialogComponent } from '@shared/ui/confirm-dialog/confirm-dialog.component';

@Component({
  // ...
  imports: [ConfirmDialogComponent]
})
export class MyComponent {
  showDialog = signal(false);
  itemToDelete = signal<Item | null>(null);

  openDialog(item: Item): void {
    this.itemToDelete.set(item);
    this.showDialog.set(true);
  }

  confirmAction(): void {
    const item = this.itemToDelete();
    if (item) {
      this.service.delete(item.id).subscribe({
        next: () => this.loadData(),
        error: (err) => console.error(err)
      });
    }
    this.showDialog.set(false);
  }

  cancelAction(): void {
    this.showDialog.set(false);
    this.itemToDelete.set(null);
  }
}
```

### Template

```html
<!-- Trigger button -->
<button (click)="openDialog(item)">Delete</button>

<!-- Confirm dialog -->
<app-confirm-dialog
  [show]="showDialog()"
  title="Delete Item"
  [message]="'Are you sure you want to delete \"' + itemToDelete()?.name + '\"?'"
  confirmLabel="Delete"
  confirmClass="bg-destructive text-destructive-foreground hover:bg-destructive/90"
  (confirm)="confirmAction()"
  (cancel)="cancelAction()"
/>
```

## API

### Inputs

| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `show` | `boolean` | No | `false` | Whether to show the dialog |
| `title` | `string` | No | `'Confirm Action'` | Dialog title |
| `message` | `string` | No | `'Are you sure you want to proceed?'` | Dialog message/content |
| `confirmLabel` | `string` | No | `'Confirm'` | Label for the confirm button |
| `cancelLabel` | `string` | No | `'Cancel'` | Label for the cancel button |
| `confirmClass` | `string` | No | `'bg-primary text-primary-foreground hover:bg-primary/90'` | CSS classes for confirm button styling |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `confirm` | `void` | Emitted when user confirms the action |
| `cancel` | `void` | Emitted when user cancels the action |

## Examples

### Delete Confirmation (Danger Style)

```typescript
@Component({...})
export class RegionsComponent {
  showDeleteDialog = signal(false);
  regionToDelete = signal<Region | null>(null);

  openDeleteDialog(region: Region): void {
    this.regionToDelete.set(region);
    this.showDeleteDialog.set(true);
  }

  confirmDelete(): void {
    const region = this.regionToDelete();
    if (region) {
      this.settingsService.deleteRegion(region.id).subscribe({
        next: () => this.loadRegions(),
        error: (error) => alert('Error deleting region: ' + error.message)
      });
    }
    this.showDeleteDialog.set(false);
  }
}
```

```html
<app-confirm-dialog
  [show]="showDeleteDialog()"
  title="Delete Region"
  [message]="'Are you sure you want to delete the region \"' + regionToDelete()?.name + '\"? This action cannot be undone.'"
  confirmLabel="Delete"
  cancelLabel="Cancel"
  confirmClass="bg-destructive text-destructive-foreground hover:bg-destructive/90"
  (confirm)="confirmDelete()"
  (cancel)="showDeleteDialog.set(false)"
/>
```

### Primary Action Confirmation

```typescript
@Component({...})
export class MyComponent {
  showSubmitDialog = signal(false);

  confirmSubmit(): void {
    this.service.submit().subscribe(...);
    this.showSubmitDialog.set(false);
  }
}
```

```html
<app-confirm-dialog
  [show]="showSubmitDialog()"
  title="Submit Form"
  message="Are you sure you want to submit this form?"
  confirmLabel="Submit"
  confirmClass="bg-primary text-primary-foreground hover:bg-primary/90"
  (confirm)="confirmSubmit()"
  (cancel)="showSubmitDialog.set(false)"
/>
```

### Custom Styling

You can customize the confirm button appearance for different action types:

```typescript
// Danger/Destructive (red)
confirmClass="bg-destructive text-destructive-foreground hover:bg-destructive/90"

// Primary (blue)
confirmClass="bg-primary text-primary-foreground hover:bg-primary/90"

// Warning (yellow)
confirmClass="bg-yellow-500 text-white hover:bg-yellow-600"

// Success (green)
confirmClass="bg-green-500 text-white hover:bg-green-600"
```

## Migration from Browser confirm()

### Before (using browser confirm)

```typescript
deleteRegion(region: Region): void {
  if (!confirm(`Are you sure you want to delete the region "${region.name}"?`)) {
    return;
  }

  this.loading.set(true);
  this.settingsService.deleteRegion(region.id).subscribe({
    next: () => this.loadRegions(),
    error: (error) => {
      alert('Error deleting region: ' + error.message);
      this.loading.set(false);
    }
  });
}
```

### After (using ConfirmDialog)

```typescript
showDeleteDialog = signal(false);
regionToDelete = signal<Region | null>(null);

openDeleteDialog(region: Region): void {
  this.regionToDelete.set(region);
  this.showDeleteDialog.set(true);
}

confirmDelete(): void {
  const region = this.regionToDelete();
  if (!region) return;

  this.loading.set(true);
  this.settingsService.deleteRegion(region.id).subscribe({
    next: () => this.loadRegions(),
    error: (error) => {
      alert('Error deleting region: ' + error.message);
      this.loading.set(false);
    }
  });
  this.showDeleteDialog.set(false);
}
```

```html
<!-- In actions -->
<button (click)="openDeleteDialog(region)">Delete</button>

<!-- At bottom of template -->
<app-confirm-dialog
  [show]="showDeleteDialog()"
  title="Delete Region"
  [message]="'Are you sure you want to delete the region \"' + regionToDelete()?.name + '\"?'"
  confirmLabel="Delete"
  confirmClass="bg-destructive text-destructive-foreground hover:bg-destructive/90"
  (confirm)="confirmDelete()"
  (cancel)="showDeleteDialog.set(false)"
/>
```

## Styling

The component uses Tailwind CSS classes and follows the app's design system. The modal includes:
- Backdrop overlay with 50% black opacity
- Card background with rounded corners and shadow
- Responsive padding and sizing
- Consistent button styles

## See Also

- [DataTable Component](../data-table/README.md) - Reusable table with actions
- [FormModal Component](../form-modal/README.md) - Reusable modal for forms
- [ButtonHelm Component](../button-helm/README.md) - Primary button component
