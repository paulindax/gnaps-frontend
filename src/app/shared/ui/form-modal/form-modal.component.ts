import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-modal.component.html',
  styleUrls: ['./form-modal.component.css']
})
export class FormModalComponent {
  // Inputs
  show = input.required<boolean>();
  title = input.required<string>();
  loading = input<boolean>(false);
  submitLabel = input<string>('Submit');
  cancelLabel = input<string>('Cancel');

  // Outputs
  close = output<void>();
  submit = output<void>();

  // Flag to prevent double submissions
  private isSubmitting = signal(false);

  onClose(): void {
    if (!this.loading()) {
      this.close.emit();
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    // Prevent double submissions
    if (this.loading() || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.submit.emit();

    // Reset the flag after a short delay to allow for re-submission if needed
    setTimeout(() => {
      this.isSubmitting.set(false);
    }, 1000);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
