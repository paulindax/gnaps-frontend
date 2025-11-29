import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../../lib/utils';

export interface DropdownMenuItem {
  label: string;
  icon?: string;
  action: () => void;
  variant?: 'default' | 'destructive';
}

@Component({
  selector: 'app-dropdown-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown-menu.component.html'
})
export class DropdownMenuComponent {
  @Input() items: DropdownMenuItem[] = [];
  @Output() itemSelected = new EventEmitter<DropdownMenuItem>();

  isOpen = false;

  constructor(private elementRef: ElementRef) {}

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  close(): void {
    this.isOpen = false;
  }

  onItemClick(item: DropdownMenuItem): void {
    item.action();
    this.itemSelected.emit(item);
    this.close();
  }

  getItemClass(item: DropdownMenuItem): string {
    const baseClass = 'flex w-full items-center px-5 py-4 text-left text-base transition-colors min-h-[56px] rounded-md mx-1';

    if (item.variant === 'destructive') {
      return cn(baseClass, 'text-destructive hover:bg-destructive/10 font-semibold');
    }

    return cn(baseClass, 'text-foreground hover:bg-accent hover:text-accent-foreground');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }
}
