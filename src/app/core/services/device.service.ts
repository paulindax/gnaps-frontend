import { Injectable, signal, computed, effect } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  // Screen width signal
  private screenWidth = signal(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Mobile breakpoint (768px - tablet and below)
  private readonly MOBILE_BREAKPOINT = 768;

  // Computed signals for device type
  isMobile = computed(() => this.screenWidth() < this.MOBILE_BREAKPOINT);
  isTablet = computed(() => this.screenWidth() >= this.MOBILE_BREAKPOINT && this.screenWidth() < 1024);
  isDesktop = computed(() => this.screenWidth() >= 1024);

  // User preference for mobile view (can be toggled)
  private userPrefersDesktop = signal(false);

  // Final determination: show mobile view?
  shouldShowMobileView = computed(() => {
    if (this.userPrefersDesktop()) return false;
    return this.isMobile();
  });

  constructor(private router: Router) {
    this.initializeResizeListener();
    this.loadUserPreference();
  }

  private initializeResizeListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.screenWidth.set(window.innerWidth);
      });
    }
  }

  private loadUserPreference(): void {
    if (typeof localStorage !== 'undefined') {
      const pref = localStorage.getItem('gnaps-prefer-desktop');
      this.userPrefersDesktop.set(pref === 'true');
    }
  }

  // Allow user to switch to desktop view on mobile
  setDesktopPreference(preferDesktop: boolean): void {
    this.userPrefersDesktop.set(preferDesktop);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gnaps-prefer-desktop', String(preferDesktop));
    }
  }

  // Get current screen width
  getScreenWidth(): number {
    return this.screenWidth();
  }

  // Check if user agent indicates mobile device
  isMobileUserAgent(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Navigate to mobile or desktop route based on device
  navigateToAppropriateRoute(desktopRoute: string, mobileRoute: string): void {
    const targetRoute = this.shouldShowMobileView() ? mobileRoute : desktopRoute;
    this.router.navigate([targetRoute]);
  }
}
