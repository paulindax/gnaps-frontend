import { Component, inject } from '@angular/core';

import { LoadingService } from '../../../services/loading.service';

@Component({
  selector: 'app-loading-bar',
  standalone: true,
  imports: [],
  templateUrl: './loading-bar.component.html',
  styleUrls: ['./loading-bar.component.css']
})
export class LoadingBarComponent {
  private loadingService = inject(LoadingService);

  isLoading = this.loadingService.isLoading;
}
