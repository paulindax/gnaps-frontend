import { Component, Input, Output, EventEmitter, signal, contentChildren, AfterContentInit } from '@angular/core';

import { cn } from '../../../../lib/utils';

@Component({
  selector: 'app-tab',
  standalone: true,
  imports: [],
  template: `
    @if (isActive()) {
      <div class="animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out">
        <ng-content></ng-content>
      </div>
    }
  `
})
export class TabComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() icon = '';
  @Output() tabActivated = new EventEmitter<void>();

  isActive = signal(false);

  activate(): void {
    this.isActive.set(true);
    this.tabActivated.emit();
  }

  deactivate(): void {
    this.isActive.set(false);
  }
}

@Component({
  selector: 'app-tabs-helm',
  standalone: true,
  imports: [],
  templateUrl: './tabs-helm.component.html'
})
export class TabsHelmComponent implements AfterContentInit {
  @Input() defaultValue = '';
  @Input() class = '';

  tabs = contentChildren(TabComponent);
  activeTab = signal('');

  ngAfterContentInit(): void {
    const tabsList = this.tabs();
    if (tabsList.length > 0) {
      const initialTab = this.defaultValue || tabsList[0].value;
      this.selectTab(initialTab);
    }
  }

  selectTab(value: string): void {
    this.activeTab.set(value);
    this.tabs().forEach(tab => {
      if (tab.value === value) {
        tab.activate();
      } else {
        tab.deactivate();
      }
    });
  }

  get computedClass(): string {
    return cn('w-full', this.class);
  }
}
