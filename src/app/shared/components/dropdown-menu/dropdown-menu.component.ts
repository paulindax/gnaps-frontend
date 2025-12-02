import { Component, Input, Output, EventEmitter, AfterViewInit, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropdownMenuItem {
  label: string;
  icon: string; // SVG path
  action: string;
  variant?: 'default' | 'destructive' | 'success';
  dividerBefore?: boolean;
  show?: boolean; // conditional rendering
}

@Component({
  selector: 'app-dropdown-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown-menu.component.html',
  styles: [`
    .dropdown-menu.dropup {
      top: auto !important;
      bottom: 100%;
      margin-top: 0;
      margin-bottom: 0.5rem;
    }
  `]
})
export class DropdownMenuComponent implements AfterViewInit, OnChanges {
  @Input() isOpen = false;
  @Input() items: DropdownMenuItem[] = [];
  @Input() triggerElement?: HTMLElement;

  @Output() close = new EventEmitter<void>();
  @Output() itemClick = new EventEmitter<string>();

  @ViewChild('dropdownMenu') dropdownMenu?: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    this.updatePosition();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      setTimeout(() => this.updatePosition(), 0);
    }
  }

  updatePosition(): void {
    if (!this.triggerElement || !this.dropdownMenu) return;

    const button = this.triggerElement;
    const dropdown = this.dropdownMenu.nativeElement;

    const rect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = dropdown.offsetHeight;

    if (spaceBelow < dropdownHeight + 20 && rect.top > dropdownHeight) {
      dropdown.classList.add('dropup');
    } else {
      dropdown.classList.remove('dropup');
    }
  }

  onBackdropClick(): void {
    this.close.emit();
  }

  onItemClick(action: string, event: Event): void {
    event.stopPropagation();
    this.itemClick.emit(action);
    this.close.emit();
  }

  getItemClasses(item: DropdownMenuItem): string {
    const baseClasses = 'w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2';

    if (item.variant === 'destructive') {
      return `${baseClasses} text-red-600 dark:text-red-400`;
    } else if (item.variant === 'success') {
      return `${baseClasses} text-green-600 dark:text-green-400`;
    }

    return baseClasses;
  }

  shouldShowItem(item: DropdownMenuItem): boolean {
    return item.show !== false;
  }
}
