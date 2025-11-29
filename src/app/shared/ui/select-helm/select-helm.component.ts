import { Component, Input, forwardRef, booleanAttribute, signal } from '@angular/core';
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
  @Input() options: SelectOption[] = [];
  @Input() placeholder = 'Select an option';
  @Input() class = '';
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input() label = '';

  value: any = '';
  isOpen = signal(false);
  onChange: any = () => {};
  onTouched: any = () => {};

  get computedClass(): string {
    return cn(
      'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm cursor-pointer',
      this.class
    );
  }

  get selectedLabel(): string {
    if (!this.value) return this.placeholder;
    const option = this.options.find(opt => opt.value === this.value);
    return option ? option.label : this.placeholder;
  }

  toggleDropdown(): void {
    if (!this.disabled) {
      this.isOpen.set(!this.isOpen());
    }
  }

  selectOption(option: SelectOption): void {
    if (!option.disabled) {
      this.value = option.value;
      this.onChange(this.value);
      this.onTouched();
      this.isOpen.set(false);
    }
  }

  writeValue(value: any): void {
    this.value = value;
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
