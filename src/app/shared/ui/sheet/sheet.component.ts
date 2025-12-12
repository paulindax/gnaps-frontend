// src/app/shared/ui/sheet.component.ts
import { Component, Input, Output, EventEmitter, booleanAttribute } from '@angular/core';

import { ButtonHelmComponent } from '../button-helm/button-helm.component';
import { cn } from '../../../../lib/utils';

@Component({
  selector: 'app-sheet',
  standalone: true,
  imports: [ButtonHelmComponent],
  templateUrl: './sheet.component.html'
})
export class SheetComponent {
  @Input({ transform: booleanAttribute }) open = false;
  @Input() title = '';
  @Input() side: 'left' | 'right' = 'left';
  @Output() close = new EventEmitter<void>();

  get overlayClass(): string {
    return cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
    );
  } 

  get sheetClass(): string {
    const sideClasses = this.side === 'left'
      ? 'inset-y-0 left-0 data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0'
      : 'inset-y-0 right-0 data-[state=closed]:translate-x-full data-[state=open]:translate-x-0';

    return cn(
      'fixed z-50 w-full max-w-sm bg-background shadow-lg transition-transform duration-300 ease-in-out',
      sideClasses,
      this.open ? 'translate-x-0' : (this.side === 'left' ? '-translate-x-full' : 'translate-x-full')
    );
  }
}