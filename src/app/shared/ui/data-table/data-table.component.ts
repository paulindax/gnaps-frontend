import { Component, input, output, computed, signal, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface TableColumn<T> {
  header: string;
  field?: keyof T | string;
  render?: (item: T) => string;
  width?: string;
}

export interface TableAction<T> {
  label: string;
  onClick: (item: T) => void;
  class?: string;
  show?: (item: T) => boolean;
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
export class DataTableComponent<T extends Record<string, any>> implements OnDestroy {
  // Inputs
  data = input.required<T[]>();
  columns = input.required<TableColumn<T>[]>();
  loading = input<boolean>(false);
  pagination = input<PaginationData | null>(null);
  actions = input<TableAction<T>[]>([]);
  emptyMessage = input<string>('No data found');
  showActions = input<boolean>(true);
  showSearch = input<boolean>(false);
  searchPlaceholder = input<string>('Search...');
  searchQuery = input<string>('');

  // Outputs
  pageChange = output<number>();
  createClick = output<void>();
  searchChange = output<string>();

  // Local search input value
  localSearchValue = signal<string>('');

  // Subject for debounced search
  private searchSubject = new Subject<string>();

  constructor() {
    // Sync local search value with parent's searchQuery
    effect(() => {
      const parentQuery = this.searchQuery();
      console.log('[DataTable] Parent searchQuery changed to:', parentQuery);
      this.localSearchValue.set(parentQuery);
    });

    // Setup debounced search (3 seconds)
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchValue => {
      console.log('[DataTable] Debounced search emitting:', searchValue);
      this.searchChange.emit(searchValue);
    });
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  // Expose Math for template
  Math = Math;

  // Computed properties
  hasActions = computed(() => this.showActions() && this.actions().length > 0);
  totalColumns = computed(() => this.columns().length + (this.hasActions() ? 1 : 0));

  getCellValue(item: T, column: TableColumn<T>): string {
    if (column.render) {
      return column.render(item);
    }

    if (!column.field) {
      return '';
    }

    const field = column.field as string;
    const value = this.getNestedValue(item, field);

    return value !== null && value !== undefined ? String(value) : '';
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  shouldShowAction(action: TableAction<T>, item: T): boolean {
    return action.show ? action.show(item) : true;
  }

  handleAction(action: TableAction<T>, item: T): void {
    action.onClick(item);
  }

  goToPage(page: number): void {
    const paginationData = this.pagination();
    if (paginationData && page >= 1 && page <= paginationData.totalPages) {
      this.pageChange.emit(page);
    }
  }

  nextPage(): void {
    const paginationData = this.pagination();
    if (paginationData && paginationData.currentPage < paginationData.totalPages) {
      this.pageChange.emit(paginationData.currentPage + 1);
    }
  }

  prevPage(): void {
    const paginationData = this.pagination();
    if (paginationData && paginationData.currentPage > 1) {
      this.pageChange.emit(paginationData.currentPage - 1);
    }
  }

  getPageNumbers(): number[] {
    const paginationData = this.pagination();
    if (!paginationData) return [];

    const { currentPage, totalPages } = paginationData;
    const pages: number[] = [];

    for (let i = 1; i <= totalPages; i++) {
      // Always show first page, last page, current page, and adjacent pages
      if (
        i === 1 ||
        i === totalPages ||
        i === currentPage ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i);
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        // Add ellipsis indicator
        pages.push(-1);
      }
    }

    return pages;
  }

  onCreateClick(): void {
    this.createClick.emit();
  }

  onSearchInput(): void {
    const value = this.localSearchValue();
    console.log('[DataTable] Search input changed:', value);
    this.searchSubject.next(value);
  }

  clearSearch(): void {
    console.log('[DataTable] Clear search clicked');
    this.localSearchValue.set('');
    // Clear search should happen immediately, not debounced
    this.searchChange.emit('');
  }
}
