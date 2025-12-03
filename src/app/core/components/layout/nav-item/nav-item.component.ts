// src/app/core/components/layout/nav-item.component.ts
import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { CommonModule} from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../../../services/layout.service';
import { NavItem } from '../../../models/nav-item.model';
import { cn } from '../../../../../lib/utils';

@Component({
  selector: 'app-nav-item',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './nav-item.component.html'
})
export class NavItemComponent {

  @Input() item!: NavItem;

  @Output() navigate = new EventEmitter<void>();

  layoutService = inject(LayoutService);

  // Local expanded state for dropdowns
  expanded = signal(false);

  // Check if icon is emoji or SVG path
  iconIsEmoji = computed(() => {
    return this.item.icon.length < 4; // Simple emoji detection
  });

  get linkClass(): string {
    return cn(
      'group flex min-h-[56px] items-center rounded-xl px-4 py-3 transition-all duration-200',
      'hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5',
      'hover:shadow-sm hover:translate-x-1',
      'focus:outline-none focus:ring-2 focus:ring-primary/50',
      'active:scale-[0.98]'
    );
  }

  onClick(): void {
    if (this.item.children?.length) {
      this.expanded.set(!this.expanded());
    } else {
      this.navigate.emit();
      this.layoutService.closeMobileMenu();
    }
  }

  onChildNavigate(): void {
    this.layoutService.closeMobileMenu();
  }
}