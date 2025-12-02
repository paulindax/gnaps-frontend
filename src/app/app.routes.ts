// src/app/app.routes.ts (modified)
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { loginGuard } from './core/guards/login.guard';
import { roleGuard } from './core/guards/role.guard';
import { LayoutComponent } from './core/components/layout/layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { SchoolListComponent } from './features/schools/school-list/school-list.component';
import { PaymentListComponent } from './features/payments/payment-list/payment-list.component';
import { NewsListComponent } from './features/news/news-list/news-list.component';
import { NewsDetailComponent } from './features/news/news-detail/news-detail.component';
import { NewsFormComponent } from './features/news/news-form/news-form.component';
import { NewsManageComponent } from './features/news/news-manage/news-manage.component';
import { EventsListComponent } from './features/events/events-list/events-list.component';
import { EventDetailComponent } from './features/events/event-detail/event-detail.component';
import { EventFormComponent } from './features/events/event-form/event-form.component';
import { EventRegisterPublicComponent } from './features/events/event-register-public/event-register-public.component';
import { DocumentVaultComponent } from './features/documents/document-vault/document-vault.component';
import { DocumentBuilderComponent } from './features/documents/document-builder/document-builder.component';
import { DocumentFillComponent } from './features/documents/document-fill/document-fill.component';
import { SettingsComponent } from './features/settings/settings.component';
import { FinanceComponent } from './features/finance/finance.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  { path: 'event-register/:code', component: EventRegisterPublicComponent }, // Public route, no auth required
  { 
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      {
        path: 'schools',
        component: SchoolListComponent,
        canActivate: [roleGuard(['system_admin', 'national_admin', 'regional_admin', 'zone_admin'])]
      },
      {
        path: 'payments',
        component: PaymentListComponent,
        canActivate: [roleGuard(['school_user'])]
      },
      {
        path: 'news',
        children: [
          { path: '', component: NewsListComponent },
          { path: 'manage', component: NewsManageComponent, canActivate: [roleGuard(['system_admin', 'national_admin', 'regional_admin', 'zone_admin'])] },
          { path: 'create', component: NewsFormComponent, canActivate: [roleGuard(['system_admin', 'national_admin', 'regional_admin', 'zone_admin'])] },
          { path: 'edit/:id', component: NewsFormComponent, canActivate: [roleGuard(['system_admin', 'national_admin', 'regional_admin', 'zone_admin'])] },
          { path: ':id', component: NewsDetailComponent }
        ]
      },
      {
        path: 'events',
        children: [
          { path: '', component: EventsListComponent },
          { path: 'create', component: EventFormComponent, canActivate: [roleGuard(['system_admin', 'national_admin', 'regional_admin'])] },
          { path: ':id', component: EventDetailComponent },
          { path: ':id/edit', component: EventFormComponent, canActivate: [roleGuard(['system_admin', 'national_admin', 'regional_admin'])] }
        ]
      },
      {
        path: 'documents',
        children: [
          { path: 'vault', component: DocumentVaultComponent },
          { path: 'builder', component: DocumentBuilderComponent, canActivate: [roleGuard(['system_admin', 'national_admin', 'regional_admin'])] },
          { path: 'builder/:id', component: DocumentBuilderComponent, canActivate: [roleGuard(['system_admin', 'national_admin', 'regional_admin'])] },
          { path: 'fill/:id', component: DocumentFillComponent },
          { path: '', redirectTo: 'vault', pathMatch: 'full' }
        ]
      }, 
      {
        path: 'settings',
        component: SettingsComponent,
        canActivate: [roleGuard(['system_admin', 'national_admin', 'regional_admin', 'zone_admin'])]
      },
      {
        path: 'finance',
        component: FinanceComponent,
        canActivate: [roleGuard(['system_admin', 'national_admin'])],
        children: [
          {
            path: 'bills',
            loadComponent: () => import('./features/finance/manage-bill/manage-bill.component').then(m => m.ManageBillComponent)
          },
          {
            path: 'bills/:id/items',
            loadComponent: () => import('./features/finance/bill-items/bill-items.component').then(m => m.BillItemsComponent)
          }
        ]
      },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];