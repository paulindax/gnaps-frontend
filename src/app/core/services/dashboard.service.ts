import { Injectable, signal, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { DashboardStats } from '../models';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly apiService = inject(ApiService);

  // Signal for reactive stats
  private readonly statsSignal = signal<DashboardStats | null>(null);
  readonly stats = this.statsSignal.asReadonly();

  getDashboardStats(): Observable<any> {
    return this.apiService.get<any>('/dashboard/stats').pipe(
      tap(stats => this.statsSignal.set(stats.data.summary))
    );
  }

  refreshStats(): void {
    this.getDashboardStats().subscribe();
  }
}
