import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { AuthService } from '../../../core/services/auth.service';
import { Event } from '../../../core/models';
import { ButtonHelmComponent } from '../../../shared/ui/button-helm/button-helm.component';
import { InputHelmComponent } from '../../../shared/ui/input-helm/input-helm.component';
import { SelectHelmComponent, SelectOption } from '../../../shared/ui/select-helm/select-helm.component';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonHelmComponent,
    InputHelmComponent,
    SelectHelmComponent,
    BadgeComponent
  ],
  templateUrl: './events-list.component.html'
})
export class EventsListComponent implements OnInit {
  private eventService = inject(EventService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signals
  events = signal<Event[]>([]);
  isLoading = signal(false);
  viewMode = signal<'calendar' | 'list'>('calendar');

  // Pagination
  currentPage = signal(1);
  pageLimit = signal(12);
  totalEvents = signal(0);

  // Filters
  searchQuery = signal('');
  selectedStatus = signal<string>('');
  selectedType = signal<string>('');  // paid/free
  selectedMonth = signal<number>(new Date().getMonth());
  selectedYear = signal<number>(new Date().getFullYear());

  // Filter options
  statusOptions: SelectOption[] = [
    { value: '', label: 'All Status' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' }
  ];

  typeOptions: SelectOption[] = [
    { value: '', label: 'All Events' },
    { value: 'paid', label: 'Paid Events' },
    { value: 'free', label: 'Free Events' }
  ];

  monthOptions: SelectOption[] = [
    { value: 0, label: 'January' },
    { value: 1, label: 'February' },
    { value: 2, label: 'March' },
    { value: 3, label: 'April' },
    { value: 4, label: 'May' },
    { value: 5, label: 'June' },
    { value: 6, label: 'July' },
    { value: 7, label: 'August' },
    { value: 8, label: 'September' },
    { value: 9, label: 'October' },
    { value: 10, label: 'November' },
    { value: 11, label: 'December' }
  ];

  // Calendar data
  calendarDays = signal<Array<{date: Date, events: Event[], isCurrentMonth: boolean}>>([]);
  currentMonthName = signal('');

  // Computed values
  thisMonthEventsCount = computed(() =>
    this.calendarDays().filter(d => d.isCurrentMonth && d.events.length > 0).length
  );

  role = this.authService.userRole;

  canManageEvents = () => {
    const userRole = this.role();
    return userRole === 'system_admin' || userRole === 'national_admin' || userRole === 'regional_admin';
  };

  ngOnInit(): void {
    this.loadEvents();
    this.generateCalendar();
  }

  loadEvents(): void {
    this.isLoading.set(true);

    const params: any = {
      page: this.currentPage(),
      limit: this.pageLimit(),
      ...(this.searchQuery() && { search: this.searchQuery() }),
      ...(this.selectedStatus() && { status: this.selectedStatus() }),
      ...(this.selectedType() && { is_paid: this.selectedType() === 'paid' })
    };

    this.eventService.getEvents(params).subscribe({
      next: (response) => {
        this.events.set(response.data);
        this.totalEvents.set(response.pagination.total);
        this.isLoading.set(false);
        this.generateCalendar();
      },
      error: (err) => {
        console.error('Failed to load events:', err);
        this.isLoading.set(false);
      }
    });
  }

  generateCalendar(): void {
    const year = this.selectedYear();
    const month = this.selectedMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Get month name
    this.currentMonthName.set(this.monthOptions.find(m => m.value === month)?.label || '');

    const days: Array<{date: Date, events: Event[], isCurrentMonth: boolean}> = [];

    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({ date, events: [], isCurrentMonth: false });
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = this.events().filter(event => {
        const eventDate = new Date(event.start_date);
        return eventDate.toDateString() === date.toDateString();
      });
      days.push({ date, events: dayEvents, isCurrentMonth: true });
    }

    // Add days from next month
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ date, events: [], isCurrentMonth: false });
    }

    this.calendarDays.set(days);
  }

  previousMonth(): void {
    const month = this.selectedMonth();
    if (month === 0) {
      this.selectedMonth.set(11);
      this.selectedYear.set(this.selectedYear() - 1);
    } else {
      this.selectedMonth.set(month - 1);
    }
    this.generateCalendar();
  }

  nextMonth(): void {
    const month = this.selectedMonth();
    if (month === 11) {
      this.selectedMonth.set(0);
      this.selectedYear.set(this.selectedYear() + 1);
    } else {
      this.selectedMonth.set(month + 1);
    }
    this.generateCalendar();
  }

  toggleViewMode(): void {
    this.viewMode.set(this.viewMode() === 'calendar' ? 'list' : 'calendar');
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.loadEvents();
  }

  onStatusChange(status: any): void {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
    this.loadEvents();
  }

  onTypeChange(type: any): void {
    this.selectedType.set(type);
    this.currentPage.set(1);
    this.loadEvents();
  }

  viewEventDetails(event: Event): void {
    this.router.navigate(['/events', event.id]);
  }

  createEvent(): void {
    this.router.navigate(['/events/create']);
  }

  editEvent(event: Event): void {
    this.router.navigate(['/events', event.id, 'edit']);
  }

  registerForEvent(event: Event): void {
    this.router.navigate(['/events', event.id, 'register']);
  }

  getStatusVariant(status?: string): 'default' | 'success' | 'destructive' | 'outline' {
    switch (status) {
      case 'published':
        return 'success';
      case 'cancelled':
        return 'destructive';
      case 'draft':
        return 'outline';
      default:
        return 'default';
    }
  }
}
