import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';

export const mobileRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/mobile-shell.component').then(m => m.MobileShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/mobile-dashboard/mobile-dashboard.component').then(m => m.MobileDashboardComponent),
        title: 'Dashboard - GNAPS'
      },
      {
        path: 'schools',
        loadComponent: () => import('./pages/mobile-schools/mobile-schools.component').then(m => m.MobileSchoolsComponent),
        title: 'Schools - GNAPS'
      },
      {
        path: 'events',
        loadComponent: () => import('./pages/mobile-events/mobile-events.component').then(m => m.MobileEventsComponent),
        title: 'Events - GNAPS'
      },
      {
        path: 'events/:id',
        loadComponent: () => import('./pages/mobile-event-detail/mobile-event-detail.component').then(m => m.MobileEventDetailComponent),
        title: 'Event Details - GNAPS'
      },
      {
        path: 'news',
        loadComponent: () => import('./pages/mobile-news/mobile-news.component').then(m => m.MobileNewsComponent),
        title: 'News - GNAPS'
      },
      {
        path: 'news/:id',
        loadComponent: () => import('./pages/mobile-news-detail/mobile-news-detail.component').then(m => m.MobileNewsDetailComponent),
        title: 'News Article - GNAPS'
      },
      {
        path: 'more',
        loadComponent: () => import('./pages/mobile-more/mobile-more.component').then(m => m.MobileMoreComponent),
        title: 'More - GNAPS'
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/mobile-profile/mobile-profile.component').then(m => m.MobileProfileComponent),
        title: 'Profile - GNAPS'
      },
      {
        path: 'documents',
        loadComponent: () => import('./pages/mobile-documents/mobile-documents.component').then(m => m.MobileDocumentsComponent),
        title: 'Documents - GNAPS'
      },
      {
        path: 'executives',
        loadComponent: () => import('./pages/mobile-executives/mobile-executives.component').then(m => m.MobileExecutivesComponent),
        title: 'Executives - GNAPS'
      },
      {
        path: 'payments',
        loadComponent: () => import('./pages/mobile-payments/mobile-payments.component').then(m => m.MobilePaymentsComponent),
        title: 'Payments - GNAPS'
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/mobile-settings/mobile-settings.component').then(m => m.MobileSettingsComponent),
        title: 'Settings - GNAPS'
      }
    ]
  }
];
