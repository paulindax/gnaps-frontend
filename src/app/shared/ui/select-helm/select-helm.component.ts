import { Component, Input, Output, EventEmitter, forwardRef, booleanAttribute, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { cn } from '../../../../lib/utils';

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select-helm',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './select-helm.component.html',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SelectHelmComponent),
    multi: true
  }]
})
export class SelectHelmComponent implements ControlValueAccessor {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  // Use signal for options to enable reactivity
  @Input() set options(val: SelectOption[]) {
    this._options.set(val);
  }
  get options(): SelectOption[] {
    return this._options();
  }
  private _options = signal<SelectOption[]>([]);

  @Input() placeholder = 'Select an option';
  @Input() class = '';
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input() label = '';
  @Input({ transform: booleanAttribute }) searchable = true;
  @Input() searchPlaceholder = 'Search...';
  @Input({ transform: booleanAttribute }) multiple = false;

  // Direct value input - bypasses ControlValueAccessor for reactive updates
  // Use this when ngModel doesn't properly detect signal changes
  @Input() set selectedValue(val: any) {
    if (val !== undefined) {
      this._value.set(val);
    }
  }

  // Custom output event for selection changes (alternative to ngModelChange)
  @Output() selectionChange = new EventEmitter<any>();

  // Use signal for value to enable reactivity
  // For multiple mode, value is an array; for single mode, it's a single value
  private _value = signal<any>('');
  get value(): any {
    return this._value();
  }
  set value(val: any) {
    this._value.set(val);
  }

  isOpen = signal(false);
  searchQuery = signal('');
  onChange: any = () => {};
  onTouched: any = () => {};

  // Filtered options based on search query
  filteredOptions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const options = this._options();
    if (!query) return options;
    return options.filter(opt => opt.label.toLowerCase().includes(query));
  });

  get computedClass(): string {
    const baseClasses = 'flex min-h-[52px] w-full justify-between rounded-md border-2 border-border bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer';
    // Use items-start for multi-select to allow chips to wrap properly, items-center for single-select
    const alignClass = this.multiple ? 'items-start' : 'items-center';
    return cn(baseClasses, alignClass, this.class);
  }

  // Computed signal for selected label - reacts to both value and options changes
  selectedLabel = computed(() => {
    const currentValue = this._value();
    const currentOptions = this._options();

    // Handle multiple selection - only used when not showing chips
    if (this.multiple) {
      if (!currentValue || !Array.isArray(currentValue) || currentValue.length === 0) {
        return this.placeholder;
      }
      const selectedLabels = currentOptions
        .filter(opt => currentValue.includes(opt.value))
        .map(opt => opt.label);
      if (selectedLabels.length === 0) return this.placeholder;
      return selectedLabels.join(', ');
    }

    // Handle single selection
    if (!currentValue) return this.placeholder;
    const option = currentOptions.find(opt => opt.value === currentValue);
    return option ? option.label : this.placeholder;
  });

  // Computed signal for selected items as objects (for multi-select chips display)
  selectedItems = computed(() => {
    const currentValue = this._value();
    const currentOptions = this._options();

    if (!this.multiple || !currentValue || !Array.isArray(currentValue) || currentValue.length === 0) {
      return [];
    }

    return currentOptions.filter(opt => currentValue.includes(opt.value));
  });

  // Remove a single item from multi-select
  removeItem(itemValue: any, event: Event): void {
    event.stopPropagation();
    if (!this.multiple) return;

    const currentValue = Array.isArray(this._value()) ? [...this._value()] : [];
    const index = currentValue.indexOf(itemValue);

    if (index > -1) {
      currentValue.splice(index, 1);
      this.value = currentValue;
      this.onChange(this.value);
      this.selectionChange.emit(this.value);
      this.onTouched();
    }
  }

  // Check if an option is selected (works for both single and multiple modes)
  isSelected(optionValue: any): boolean {
    const currentValue = this._value();
    if (this.multiple) {
      return Array.isArray(currentValue) && currentValue.includes(optionValue);
    }
    return currentValue === optionValue;
  }

  toggleDropdown(): void {
    if (!this.disabled) {
      const wasOpen = this.isOpen();
      this.isOpen.set(!wasOpen);

      // Clear search and focus input when opening
      if (!wasOpen) {
        this.searchQuery.set('');
        // Focus search input after dropdown opens
        setTimeout(() => {
          if (this.searchable && this.searchInput?.nativeElement) {
            this.searchInput.nativeElement.focus();
          }
        }, 10);
      }
    }
  }

  closeDropdown(): void {
    this.isOpen.set(false);
    this.searchQuery.set('');
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  selectOption(option: SelectOption): void {
    if (option.disabled) return;

    if (this.multiple) {
      // Multi-select mode: toggle selection
      const currentValue = Array.isArray(this._value()) ? [...this._value()] : [];
      const index = currentValue.indexOf(option.value);

      if (index > -1) {
        // Remove from selection
        currentValue.splice(index, 1);
      } else {
        // Add to selection
        currentValue.push(option.value);
      }

      this.value = currentValue;
      this.onChange(this.value);
      this.selectionChange.emit(this.value);
      this.onTouched();
      // Don't close dropdown in multi-select mode
    } else {
      // Single-select mode: select and close
      this.value = option.value;
      this.onChange(this.value);
      this.selectionChange.emit(this.value);
      this.onTouched();
      this.closeDropdown();
    }
  }

  // Clear all selections (useful for multi-select)
  clearSelection(): void {
    if (this.multiple) {
      this.value = [];
    } else {
      this.value = '';
    }
    this.onChange(this.value);
    this.selectionChange.emit(this.value);
    this.onTouched();
  }

  writeValue(value: any): void {
    if (this.multiple && !Array.isArray(value)) {
      this.value = value ? [value] : [];
    } else {
      this.value = value;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
