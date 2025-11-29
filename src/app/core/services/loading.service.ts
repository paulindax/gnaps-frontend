import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingCount = 0;
  private loadingSignal = signal<boolean>(false);

  // Expose the loading state as a readonly signal
  public readonly isLoading = this.loadingSignal.asReadonly();

  show(): void {
    this.loadingCount++;
    if (this.loadingCount > 0) {
      this.loadingSignal.set(true);
    }
  }

  hide(): void {
    this.loadingCount = Math.max(0, this.loadingCount - 1);
    if (this.loadingCount === 0) {
      this.loadingSignal.set(false);
    }
  }

  reset(): void {
    this.loadingCount = 0;
    this.loadingSignal.set(false);
  }
}
