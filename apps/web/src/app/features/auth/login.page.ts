import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="auth-layout">
      <div class="auth-card">
        <div class="auth-brand">
          <span class="auth-brand-mark">¢</span>
          <h1 class="auth-brand-name">Centavo</h1>
        </div>

        <h2 class="auth-title">Sign in to your account</h2>
        <p class="auth-subtitle">Welcome back. Enter your credentials to continue.</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="field">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              autocomplete="email"
              formControlName="email"
              [class.has-error]="hasError('email')"
            />
            @if (hasError('email')) {
              <span class="field-error">Please enter a valid email</span>
            }
          </div>

          <div class="field">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              autocomplete="current-password"
              formControlName="password"
              [class.has-error]="hasError('password')"
            />
            @if (hasError('password')) {
              <span class="field-error">Password is required</span>
            }
          </div>

          @if (errorMessage()) {
            <div class="form-error" role="alert">{{ errorMessage() }}</div>
          }

          <button
            type="submit"
            class="btn-primary"
            [disabled]="loading() || form.invalid"
          >
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <p class="auth-footer">
          New to Centavo?
          <a routerLink="/register">Create an account</a>
        </p>
      </div>
    </main>
  `,
  styleUrl: './auth.shared.scss',
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  hasError(field: 'email' | 'password'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.status === 401
            ? 'Invalid email or password'
            : 'Something went wrong. Please try again.',
        );
      },
    });
  }
}