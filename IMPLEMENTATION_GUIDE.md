# Data Table Implementation Guide

This guide shows how to implement the reusable data table component in settings pages.

## ✅ Completed: Regions Component

The Regions component has been successfully refactored to use the reusable components.

### Changes Made:

**regions.component.ts:**
- Added imports for `DataTableComponent`, `FormModalComponent`, and related types
- Defined `tableColumns` with custom render function for dates
- Defined `tableActions` for Edit and Delete buttons
- Created `paginationData` signal
- Replaced pagination methods with single `onPageChange()` method
- Removed `Math` property (now handled by DataTable)

**regions.component.html:**
- Reduced from **167 lines to 58 lines** (65% reduction!)
- Replaced entire table markup with `<app-data-table>` component
- Replaced modal markup with `<app-form-modal>` component
- Form fields now projected as content into the modal

### Key Benefits:
- **Less Code**: 109 fewer lines
- **Maintainable**: Changes to table behavior only need to be made once
- **Consistent**: Same UI/UX across all settings pages
- **Type-Safe**: Full TypeScript support with generics

## 🔄 To Implement in Other Components

Follow the same pattern for **Zones**, **Positions**, and **Groups** components:

### Step 1: Update TypeScript File

```typescript
// Add imports
import { DataTableComponent, TableColumn, TableAction, PaginationData } from '../../../shared/ui/data-table/data-table.component';
import { FormModalComponent } from '../../../shared/ui/form-modal/form-modal.component';

// Update component decorator
@Component({
  // ...
  imports: [CommonModule, FormsModule, ButtonHelmComponent, DataTableComponent, FormModalComponent],
  // ...
})

// Define table columns
tableColumns: TableColumn<YourType>[] = [
  { header: 'Name', field: 'name' },
  { header: 'Code', field: 'code' },
  {
    header: 'Created At',
    field: 'created_at',
    render: (item) => {
      if (!item.created_at) return '';
      return new Date(item.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }
];

// Define table actions
tableActions: TableAction<YourType>[] = [
  {
    label: 'Edit',
    onClick: (item) => this.openEditModal(item),
    class: 'mr-2 text-primary hover:underline'
  },
  {
    label: 'Delete',
    onClick: (item) => this.deleteItem(item),
    class: 'text-destructive hover:underline'
  }
];

// Add pagination data signal
paginationData = signal<PaginationData>({
  currentPage: 1,
  totalPages: 0,
  pageSize: 10,
  totalItems: 0
});

// Update load method to set pagination data
loadData(): void {
  this.loading.set(true);
  this.service.getData(this.currentPage(), this.pageSize()).subscribe({
    next: (response) => {
      this.data.set(response.data);
      this.totalItems.set(response.pagination.total);
      this.totalPages.set(Math.ceil(response.pagination.total / response.pagination.limit));

      // Update pagination data
      this.paginationData.set({
        currentPage: this.currentPage(),
        totalPages: this.totalPages(),
        pageSize: this.pageSize(),
        totalItems: this.totalItems()
      });

      this.loading.set(false);
    },
    error: (error) => {
      console.error('Error loading data:', error);
      this.loading.set(false);
    }
  });
}

// Replace pagination methods with single handler
onPageChange(page: number): void {
  this.currentPage.set(page);
  this.loadData();
}

// Remove: goToPage(), nextPage(), prevPage() methods
// Remove: Math = Math; property
```

### Step 2: Update HTML Template

Replace the entire table and modal sections with:

```html
<div>
  <!-- Header with Create Button -->
  <div class="mb-6 flex items-center justify-between">
    <h2 class="text-xl font-semibold sm:text-2xl">Your Title</h2>
    @if (canEdit()) {
      <app-button-helm (click)="openCreateModal()" [disabled]="loading()">
        + Create Item
      </app-button-helm>
    }
  </div>

  <!-- Reusable Data Table -->
  <app-data-table
    [data]="yourData()"
    [columns]="tableColumns"
    [loading]="loading()"
    [pagination]="paginationData()"
    [actions]="canEdit() ? tableActions : []"
    [showActions]="canEdit()"
    emptyMessage="No items found. Click 'Create Item' to add one."
    (pageChange)="onPageChange($event)"
  />

  <!-- Reusable Form Modal -->
  <app-form-modal
    [show]="showModal()"
    [title]="isEditing() ? 'Edit Item' : 'Create Item'"
    [loading]="loading()"
    [submitLabel]="isEditing() ? 'Update' : 'Create'"
    (close)="closeModal()"
    (submit)="onSubmit()"
  >
    <!-- Your form fields here -->
    <div class="mb-4">
      <label class="mb-2 block text-sm font-medium">Field Name *</label>
      <input
        type="text"
        [value]="formData().fieldName"
        (input)="updateFormField('fieldName', $any($event.target).value)"
        class="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="Enter value"
        required
      />
    </div>
  </app-form-modal>
</div>
```

## 📋 Checklist for Each Component

- [ ] Import `DataTableComponent`, `FormModalComponent`, and types
- [ ] Add to component's `imports` array
- [ ] Define `tableColumns` array
- [ ] Define `tableActions` array
- [ ] Add `paginationData` signal
- [ ] Update load method to set `paginationData`
- [ ] Replace pagination methods with `onPageChange()`
- [ ] Remove `Math` property
- [ ] Replace table HTML with `<app-data-table>`
- [ ] Replace modal HTML with `<app-form-modal>`
- [ ] Test create, edit, delete, and pagination

## 🎯 Special Cases

### For Zones (with Region dropdown):
```typescript
tableColumns: TableColumn<Zone>[] = [
  { header: 'Name', field: 'name' },
  { header: 'Code', field: 'code' },
  {
    header: 'Region',
    field: 'region_id',
    render: (zone) => this.getRegionName(zone.region_id)
  },
  // ... other columns
];
```

### For Groups (with Zone dropdown):
```typescript
tableColumns: TableColumn<Group>[] = [
  { header: 'Name', field: 'name' },
  {
    header: 'Zone',
    field: 'zone_id',
    render: (group) => this.getZoneName(group.zone_id)
  },
  {
    header: 'Description',
    field: 'description',
    render: (group) => group.description || '-'
  },
  // ... other columns
];
```

## 📚 Component Documentation

- [DataTable README](src/app/shared/ui/data-table/README.md)
- [FormModal README](src/app/shared/ui/form-modal/README.md)

## 🚀 Next Steps

1. Apply to Zones component
2. Apply to Positions component
3. Apply to Groups component
4. Test all CRUD operations
5. Verify role-based access control
6. Test pagination on all pages

## 💡 Tips

- Use single quotes inside `emptyMessage` attribute to avoid escaping issues
- For nested fields, use dot notation: `field: 'user.name'`
- Use `render` function for custom formatting (dates, booleans, lookups)
- Actions can be conditionally shown using the `show` property
- The table automatically handles loading states and empty states
