import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ButtonHelmComponent } from '../../../shared/ui/button-helm/button-helm.component';
import { InputHelmComponent } from '../../../shared/ui/input-helm/input-helm.component';
import { cn } from '../../../../lib/utils';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonHelmComponent, InputHelmComponent],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  username = '';
  password = '';
  loading = signal(false);
  error = signal('');

  private authService = inject(AuthService);
  private router = inject(Router);

  get errorClass(): string {
    return cn(
      'rounded-md bg-destructive/10 p-3 text-center text-sm font-medium text-destructive'
    );
  }

  onSubmit(): void {
    this.loading.set(true);
    this.error.set('');

    this.authService.login(this.username, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(err.message || 'Invalid credentials');
        this.loading.set(false);
      }
    });
  }
}
