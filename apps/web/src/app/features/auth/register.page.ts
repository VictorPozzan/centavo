import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-register-page',
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

        <h2 class="auth-title">Create your account</h2>
        <p class="auth-subtitle">Start tracking your finances in minutes.</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="field">
            <label for="name">Name</label>
            <input
              id="name"
              type="text"
              autocomplete="name"
              formControlName="name"
              [class.has-error]="hasError('name')"
            />
            @if (hasError('name')) {
              <span class="field-error">Name must be at least 2 characters</span>
            }
          </div>

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
              autocomplete="new-password"
              formControlName="password"
              [class.has-error]="hasError('password')"
            />
            <span class="field-hint">
              At least 8 characters with uppercase, lowercase and a number.
            </span>
            @if (hasError('password')) {
              <span class="field-error">{{ passwordErrorMessage() }}</span>
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
            {{ loading() ? 'Creating account…' : 'Create account' }}
          </button>
        </form>

        <p class="auth-footer">
          Already have an account?
          <a routerLink="/login">Sign in</a>
        </p>
      </div>
    </main>
  `,
  styleUrl: './auth.shared.scss',
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
      ],
    ],
  });

  hasError(field: 'name' | 'email' | 'password'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  passwordErrorMessage(): string {
    const control = this.form.controls.password;
    if (control.hasError('required')) return 'Password is required';
    if (control.hasError('minlength')) return 'Password must be at least 8 characters';
    if (control.hasError('pattern'))
      return 'Password must include uppercase, lowercase and a number';
    return 'Invalid password';
  }

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.status === 409
            ? 'An account with this email already exists'
            : 'Something went wrong. Please try again.',
        );
      },
    });
  }
}