import { Component, OnInit, signal, computed, inject } from '@angular/core';

import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FinanceAccountComponent } from './finance-account/finance-account.component';
import { BillParticularsComponent } from './bill-particulars/bill-particulars.component';
import { ManageBillComponent } from './manage-bill/manage-bill.component';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [RouterOutlet, FinanceAccountComponent, BillParticularsComponent, ManageBillComponent],
  templateUrl: './finance.component.html'
})
export class FinanceComponent implements OnInit {
  private authService = inject(AuthService);

  // Make router public so it can be accessed in the template
  router = inject(Router);

  activeTab = signal<'account' | 'particulars' | 'bills'>('account');

  canManageFinance = computed(() => {
    const user = this.authService.currentUserSignal();
    return user && ['system_admin', 'national_admin'].includes(user.role);
  });

  ngOnInit(): void {
    if (!this.canManageFinance()) {
      console.warn('User does not have permission to manage finance');
    }
  }

  setActiveTab(tab: 'account' | 'particulars' | 'bills'): void {
    this.activeTab.set(tab);
  }
}
