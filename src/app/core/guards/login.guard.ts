import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Login Guard - Prevents authenticated users from accessing login page
 * Redirects authenticated users to dashboard
 */
export const loginGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If user is authenticated, redirect to dashboard
  // Otherwise, allow access to login page
  return authService.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
};
