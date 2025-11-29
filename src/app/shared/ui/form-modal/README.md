# FormModal Component

A reusable modal component for forms with consistent styling and behavior.

## Features

- Content projection for flexible form layouts
- Loading state handling
- Backdrop click to close
- Configurable submit and cancel buttons
- Consistent styling across the application

## Usage

### Basic Example

```typescript
import { FormModalComponent } from '@shared/ui/form-modal/form-modal.component';

@Component({
  // ...
  imports: [FormModalComponent, FormsModule]
})
export class MyComponent {
  showModal = signal(false);
  loading = signal(false);
  isEditing = signal(false);

  formData = signal({
    name: '',
    email: ''
  });

  openModal(): void {
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onSubmit(): void {
    const data = this.formData();
    // Handle form submission
  }

  updateField(field: string, value: string): void {
    this.formData.update(data => ({ ...data, [field]: value }));
  }
}
```

### Template

```html
<app-form-modal
  [show]="showModal()"
  [title]="isEditing() ? 'Edit Item' : 'Create Item'"
  [loading]="loading()"
  [submitLabel]="isEditing() ? 'Update' : 'Create'"
  [cancelLabel]="'Cancel'"
  (close)="closeModal()"
  (submit)="onSubmit()"
>
  <!-- Your form fields here -->
  <div class="mb-4">
    <label class="mb-2 block text-sm font-medium">Name *</label>
    <input
      type="text"
      [value]="formData().name"
      (input)="updateField('name', $any($event.target).value)"
      class="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
      placeholder="Enter name"
      required
    />
  </div>

  <div class="mb-4">
    <label class="mb-2 block text-sm font-medium">Email *</label>
    <input
      type="email"
      [value]="formData().email"
      (input)="updateField('email', $any($event.target).value)"
      class="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
      placeholder="Enter email"
      required
    />
  </div>
</app-form-modal>
```

## API

### Inputs

| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `show` | `boolean` | Yes | - | Controls modal visibility |
| `title` | `string` | Yes | - | Modal title |
| `loading` | `boolean` | No | `false` | Disables buttons during loading |
| `submitLabel` | `string` | No | `'Submit'` | Submit button text |
| `cancelLabel` | `string` | No | `'Cancel'` | Cancel button text |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `close` | `void` | Emitted when modal should close |
| `submit` | `void` | Emitted when form is submitted |

## Features

### Backdrop Click

Clicking outside the modal (on the backdrop) will close it automatically.

### Loading State

When `loading` is `true`:
- Both submit and cancel buttons are disabled
- Modal cannot be closed by clicking backdrop or cancel button

### Form Validation

The modal wraps content in a `<form>` tag, so you can use native HTML5 validation:

```html
<app-form-modal ...>
  <input type="text" required />
  <input type="email" required />
</app-form-modal>
```

## Examples

### Create/Edit Pattern

```typescript
@Component({...})
export class RegionsComponent {
  showModal = signal(false);
  isEditing = signal(false);
  selectedItem = signal<Region | null>(null);

  openCreateModal(): void {
    this.isEditing.set(false);
    this.formData.set({ name: '', code: '' });
    this.showModal.set(true);
  }

  openEditModal(item: Region): void {
    this.isEditing.set(true);
    this.selectedItem.set(item);
    this.formData.set({ name: item.name, code: item.code });
    this.showModal.set(true);
  }

  onSubmit(): void {
    if (this.isEditing()) {
      // Update logic
    } else {
      // Create logic
    }
  }
}
```

```html
<app-form-modal
  [show]="showModal()"
  [title]="isEditing() ? 'Edit Region' : 'Create Region'"
  [submitLabel]="isEditing() ? 'Update' : 'Create'"
  (close)="closeModal()"
  (submit)="onSubmit()"
>
  <!-- Form fields -->
</app-form-modal>
```

### With Dropdown/Select

```html
<app-form-modal [show]="showModal()" [title]="'Create Zone'" (close)="closeModal()" (submit)="onSubmit()">
  <div class="mb-4">
    <label class="mb-2 block text-sm font-medium">Name *</label>
    <input type="text" [value]="formData().name" ... />
  </div>

  <div class="mb-4">
    <label class="mb-2 block text-sm font-medium">Region *</label>
    <select
      [value]="formData().region_id"
      (change)="updateField('region_id', $any($event.target).value)"
      class="w-full rounded-md border border-border bg-background px-3 py-2"
      required
    >
      <option value="">Select a region</option>
      @for (region of regions(); track region.id) {
        <option [value]="region.id">{{ region.name }}</option>
      }
    </select>
  </div>
</app-form-modal>
```

## Styling

The modal uses Tailwind CSS with a backdrop blur effect and centered positioning. The content is projected, so you can style your form fields however you need.

## Accessibility

- Modal uses z-50 for proper stacking
- Backdrop prevents interaction with underlying content
- Form submission is handled with native form events

## See Also

- [DataTable Component](../data-table/README.md) - Reusable table component
- [ButtonHelm Component](../button-helm/README.md) - Primary button component
