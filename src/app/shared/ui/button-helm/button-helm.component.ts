import { Component, Input, output, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-lg text-base font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-3 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md',
        outline: 'border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-14 min-h-[52px] px-6 py-3 text-base',
        sm: 'h-11 min-h-[44px] px-4 py-2 text-base',
        lg: 'h-16 min-h-[56px] px-8 py-4 text-lg',
        icon: 'h-14 w-14 min-h-[52px] min-w-[52px]'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

@Component({
  selector: 'app-button-helm',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button-helm.component.html'
})
export class ButtonHelmComponent {
  @Input() variant: ButtonVariants['variant'] = 'default';
  @Input() size: ButtonVariants['size'] = 'default';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() class = '';
  @Input({ transform: booleanAttribute }) disabled = false;

  onClick = output<Event>();

  get computedClass(): string {
    return cn(buttonVariants({ variant: this.variant, size: this.size }), this.class);
  }
}
