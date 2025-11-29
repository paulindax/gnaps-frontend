# Search Implementation Guide

## Overview

The DataTable component now includes built-in search functionality with:
- Search input field with icon
- Clear button (shown when there's a search query)
- **3-second debounced search** to reduce API calls
- Loading state integration

## ✅ What Was Added

### DataTable Component Updates:

**New Inputs:**
- `showSearch`: boolean - Show/hide search bar (default: `false`)
- `searchQuery`: string - Current search query value
- `searchPlaceholder`: string - Placeholder text (default: `'Search...'`)

**New Output:**
- `searchChange`: string - Emitted when search query changes (debounced by 3 seconds)

**UI Features:**
- Search icon (magnifying glass) in input
- Clear button when search has value (bypasses debounce for immediate clear)
- 3-second debounce to reduce API calls
- Responsive design

## 🚀 How to Implement Search

### Step 1: Add Search Signal to Component

```typescript
import { Component, signal } from '@angular/core';

export class RegionsComponent {
  searchQuery = signal('');

  // ... other properties
}
```

### Step 2: Update Load Method

Add search parameter to your API call:

```typescript
loadRegions(): void {
  this.loading.set(true);

  this.settingsService.getRegions(
    this.currentPage(),
    this.pageSize(),
    this.searchQuery() // Pass search query to API
  ).subscribe({
    next: (response) => {
      this.regions.set(response.data);
      this.totalItems.set(response.pagination.total);
      this.totalPages.set(Math.ceil(response.pagination.total / response.pagination.limit));

      this.paginationData.set({
        currentPage: this.currentPage(),
        totalPages: this.totalPages(),
        pageSize: this.pageSize(),
        totalItems: this.totalItems()
      });

      this.loading.set(false);
    },
    error: (error) => {
      console.error('Error loading regions:', error);
      this.loading.set(false);
    }
  });
}
```

### Step 3: Add Search Handler

```typescript
onSearchChange(query: string): void {
  this.searchQuery.set(query);
  this.currentPage.set(1); // Reset to first page when searching
  this.loadRegions();
}
```

### Step 4: Update Service Method

Update your service to accept search parameter:

```typescript
// settings.service.ts
getRegions(page: number = 1, limit: number = 10, search?: string): Observable<PaginatedResponse<Region>> {
  let url = `/regions/list?page=${page}&limit=${limit}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  return this.apiService.get<PaginatedResponse<Region>>(url);
}
```

### Step 5: Update Template

Add search properties to data-table:

```html
<app-data-table
  [data]="regions()"
  [columns]="tableColumns"
  [loading]="loading()"
  [pagination]="paginationData()"
  [actions]="canEdit() ? tableActions : []"
  [showActions]="canEdit()"
  [showSearch]="true"
  [searchQuery]="searchQuery()"
  searchPlaceholder="Search regions by name or code..."
  emptyMessage="No regions found. Click 'Create Region' to add one."
  (pageChange)="onPageChange($event)"
  (searchChange)="onSearchChange($event)"
/>
```

## 🎯 Backend Implementation

The backend should handle the search parameter in the controller:

```go
// RegionsController.go
func (r *RegionsController) list(c *fiber.Ctx) error {
    var regions []models.Region

    query := DB.Where("is_deleted = ?", false)

    // Search functionality
    if search := c.Query("search"); search != "" {
        searchPattern := "%" + search + "%"
        query = query.Where("name LIKE ? OR code LIKE ?", searchPattern, searchPattern)
    }

    // Pagination
    page, _ := strconv.Atoi(c.Query("page", "1"))
    limit, _ := strconv.Atoi(c.Query("limit", "10"))
    offset := (page - 1) * limit

    var total int64
    query.Model(&models.Region{}).Count(&total)

    result := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&regions)

    // Return results
    return c.JSON(fiber.Map{
        "data": regions,
        "pagination": fiber.Map{
            "page":  page,
            "limit": limit,
            "total": total,
        },
    })
}
```

## ⚡ Advanced: Debounced Search

For better performance, you can debounce the search:

```typescript
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export class RegionsComponent implements OnInit, OnDestroy {
  private searchSubject = new Subject<string>();
  searchQuery = signal('');

  ngOnInit(): void {
    this.loadRegions();

    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(300), // Wait 300ms after user stops typing
      distinctUntilChanged() // Only emit when value changes
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(1);
      this.loadRegions();
    });
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }
}
```

## 📋 Complete Example

Here's a full example for the Regions component:

**regions.component.ts:**
```typescript
import { Component, signal, inject, OnInit } from '@angular/core';
import { DataTableComponent, TableColumn, TableAction, PaginationData } from '../../../shared/ui/data-table/data-table.component';

@Component({
  selector: 'app-regions',
  standalone: true,
  imports: [DataTableComponent, FormModalComponent, ButtonHelmComponent],
  templateUrl: './regions.component.html'
})
export class RegionsComponent implements OnInit {
  private settingsService = inject(SettingsService);

  regions = signal<Region[]>([]);
  loading = signal(false);
  searchQuery = signal('');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  totalPages = signal(0);

  paginationData = signal<PaginationData>({
    currentPage: 1,
    totalPages: 0,
    pageSize: 10,
    totalItems: 0
  });

  tableColumns: TableColumn<Region>[] = [
    { header: 'Name', field: 'name' },
    { header: 'Code', field: 'code' },
    {
      header: 'Created At',
      field: 'created_at',
      render: (item) => new Date(item.created_at).toLocaleDateString()
    }
  ];

  ngOnInit(): void {
    this.loadRegions();
  }

  loadRegions(): void {
    this.loading.set(true);
    this.settingsService.getRegions(
      this.currentPage(),
      this.pageSize(),
      this.searchQuery()
    ).subscribe({
      next: (response) => {
        this.regions.set(response.data);
        this.totalItems.set(response.pagination.total);
        this.totalPages.set(Math.ceil(response.pagination.total / response.pagination.limit));

        this.paginationData.set({
          currentPage: this.currentPage(),
          totalPages: this.totalPages(),
          pageSize: this.pageSize(),
          totalItems: this.totalItems()
        });

        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading regions:', error);
        this.loading.set(false);
      }
    });
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1); // Reset to first page
    this.loadRegions();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadRegions();
  }
}
```

**regions.component.html:**
```html
<div>
  <div class="mb-6 flex items-center justify-between">
    <h2 class="text-xl font-semibold sm:text-2xl">Regions Management</h2>
    @if (canEdit()) {
      <app-button-helm (click)="openCreateModal()" [disabled]="loading()">
        + Create Region
      </app-button-helm>
    }
  </div>

  <app-data-table
    [data]="regions()"
    [columns]="tableColumns"
    [loading]="loading()"
    [pagination]="paginationData()"
    [actions]="canEdit() ? tableActions : []"
    [showActions]="canEdit()"
    [showSearch]="true"
    [searchQuery]="searchQuery()"
    searchPlaceholder="Search regions by name or code..."
    emptyMessage="No regions found."
    (pageChange)="onPageChange($event)"
    (searchChange)="onSearchChange($event)"
  />
</div>
```

## 🎨 Search UI Features

- **Search Icon**: Visual indicator of search functionality
- **Clear Button**: Appears when there's a search query, clears on click
- **Disabled State**: Search input disabled during loading
- **Placeholder**: Customizable placeholder text
- **Responsive**: Works on all screen sizes

## 📝 Notes

- Search always resets to page 1
- Empty search query shows all results
- Backend should implement case-insensitive search
- Consider debouncing for large datasets
- Search works with pagination seamlessly

## ✅ Checklist for Implementation

- [ ] Add `searchQuery` signal to component
- [ ] Update service method to accept search parameter
- [ ] Implement `onSearchChange()` handler
- [ ] Update `loadData()` to use search query
- [ ] Reset to page 1 on search
- [ ] Add search properties to template
- [ ] Update backend to handle search parameter
- [ ] Test search with various queries
- [ ] Test search + pagination combination
- [ ] Test clear button functionality

## 🔗 Related Documentation

- [DataTable README](src/app/shared/ui/data-table/README.md)
- [Implementation Guide](IMPLEMENTATION_GUIDE.md)
