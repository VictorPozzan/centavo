import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="placeholder">
      <h1>Welcome back, {{ authService.user()?.name }}.</h1>
      <p>Your dashboard will appear here. For now, explore the menu.</p>
    </div>
  `,
  styles: [
    `
      .placeholder {
        text-align: center;
        padding: var(--space-12) var(--space-4);
      }
      h1 {
        font-size: var(--text-3xl);
        margin-bottom: var(--space-2);
      }
      p {
        color: var(--color-text-muted);
      }
    `,
  ],
})
export class DashboardPage {
  protected readonly authService = inject(AuthService);
}