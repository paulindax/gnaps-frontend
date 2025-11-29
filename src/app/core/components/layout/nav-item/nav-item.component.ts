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
      'group mx-2 flex min-h-[56px] items-center rounded-lg px-5 py-4 transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-4 focus:ring-ring active:scale-98'
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