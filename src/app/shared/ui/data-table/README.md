# DataTable Component

A reusable table component with pagination, sorting, and action buttons for Angular applications.

## Features

- Generic type support - works with any data type
- Configurable columns with custom rendering
- Built-in pagination controls
- **Search functionality** with 3-second debounce and clear button
- Action buttons per row
- Loading states
- Empty state handling
- Responsive design

## Usage

### Basic Example

```typescript
import { DataTableComponent, TableColumn, TableAction, PaginationData } from '@shared/ui/data-table/data-table.component';

@Component({
  // ...
  imports: [DataTableComponent]
})
export class MyComponent {
  data = signal<MyDataType[]>([]);
  loading = signal(false);

  // Define columns
  columns: TableColumn<MyDataType>[] = [
    { header: 'Name', field: 'name' },
    { header: 'Email', field: 'email' },
    {
      header: 'Created',
      field: 'created_at',
      render: (item) => new Date(item.created_at).toLocaleDateString()
    }
  ];

  // Define actions
  actions: TableAction<MyDataType>[] = [
    {
      label: 'Edit',
      onClick: (item) => this.edit(item),
      class: 'text-primary hover:underline'
    },
    {
      label: 'Delete',
      onClick: (item) => this.delete(item),
      class: 'text-destructive hover:underline'
    }
  ];

  // Pagination data
  paginationData = signal<PaginationData>({
    currentPage: 1,
    totalPages: 10,
    pageSize: 10,
    totalItems: 100
  });

  onPageChange(page: number): void {
    // Handle page change
  }
}
```

### Template

```html
<app-data-table
  [data]="data()"
  [columns]="columns"
  [loading]="loading()"
  [pagination]="paginationData()"
  [actions]="actions"
  [showActions]="canEdit()"
  [showSearch]="true"
  [searchQuery]="searchQuery()"
  searchPlaceholder="Search by name or code..."
  [emptyMessage]="'No data found'"
  (pageChange)="onPageChange($event)"
  (searchChange)="onSearchChange($event)"
/>
```

## API

### Inputs

| Input | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `data` | `T[]` | Yes | - | Array of data items to display |
| `columns` | `TableColumn<T>[]` | Yes | - | Column configuration |
| `loading` | `boolean` | No | `false` | Loading state |
| `pagination` | `PaginationData \| null` | No | `null` | Pagination configuration |
| `actions` | `TableAction<T>[]` | No | `[]` | Action buttons per row |
| `showActions` | `boolean` | No | `true` | Show/hide actions column |
| `showSearch` | `boolean` | No | `false` | Show/hide search bar |
| `searchQuery` | `string` | No | `''` | Current search query value |
| `searchPlaceholder` | `string` | No | `'Search...'` | Search input placeholder |
| `emptyMessage` | `string` | No | `'No data found'` | Message when data is empty |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `pageChange` | `number` | Emitted when page changes |
| `createClick` | `void` | Emitted when create button is clicked |
| `searchChange` | `string` | Emitted when search query changes (debounced by 3 seconds) |

**Note:** The `searchChange` output uses a 3-second debounce, meaning it will only emit 3 seconds after the user stops typing. The Clear button bypasses the debounce and emits immediately.

### Types

#### TableColumn<T>

```typescript
interface TableColumn<T> {
  header: string;              // Column header text
  field: keyof T | string;     // Field name or nested path (e.g., 'user.name')
  render?: (item: T) => string; // Custom render function
  width?: string;              // Column width (e.g., '200px', '20%')
}
```

#### TableAction<T>

```typescript
interface TableAction<T> {
  label: string;                    // Button text
  onClick: (item: T) => void;       // Click handler
  class?: string;                   // CSS classes
  show?: (item: T) => boolean;      // Conditional visibility
}
```

#### PaginationData

```typescript
interface PaginationData {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}
```

## Examples

### With Search

```typescript
@Component({...})
export class MyComponent {
  searchQuery = signal('');

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1); // Reset to first page
    this.loadData();
  }

  loadData(): void {
    const params = {
      page: this.currentPage(),
      limit: this.pageSize(),
      search: this.searchQuery() // Pass search query to API
    };
    this.service.getData(params).subscribe({...});
  }
}
```

```html
<app-data-table
  [data]="data()"
  [columns]="columns"
  [showSearch]="true"
  [searchQuery]="searchQuery()"
  searchPlaceholder="Search by name, code, or email..."
  (searchChange)="onSearchChange($event)"
  (pageChange)="onPageChange($event)"
/>
```

### Custom Rendering

```typescript
columns: TableColumn<User>[] = [
  {
    header: 'Full Name',
    field: 'name',
    render: (user) => `${user.firstName} ${user.lastName}`
  },
  {
    header: 'Status',
    field: 'status',
    render: (user) => user.isActive ? '✅ Active' : '❌ Inactive'
  }
];
```

### Conditional Actions

```typescript
actions: TableAction<User>[] = [
  {
    label: 'Edit',
    onClick: (user) => this.edit(user),
    show: (user) => user.canEdit // Only show if user can be edited
  }
];
```

### Nested Fields

```typescript
columns: TableColumn<Order>[] = [
  { header: 'Customer Name', field: 'customer.name' },
  { header: 'Customer Email', field: 'customer.email' }
];
```

## Styling

The component uses Tailwind CSS classes. You can customize the appearance by modifying the classes in the template or by providing custom CSS.

## See Also

- [FormModal Component](../form-modal/README.md) - Reusable modal for forms
- [ButtonHelm Component](../button-helm/README.md) - Primary button component
