import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../../../lib/utils';

@Component({
  selector: 'app-card-helm',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card-helm.component.html'
})
export class CardHelmComponent {
  @Input() title = '';
  @Input() value: any = '';
  @Input() icon = '';
  @Input() class = '';

  get computedClass(): string {
    return cn(
      'rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md',
      this.class
    );
  }
}
