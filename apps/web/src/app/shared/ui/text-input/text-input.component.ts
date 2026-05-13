import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state">
      <div class="empty-state-icon">{{ icon() }}</div>
      <h3 class="empty-state-title">{{ title() }}</h3>
      <p class="empty-state-description">{{ description() }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-12) var(--space-4);
        text-align: center;
      }

      .empty-state-icon {
        font-size: 3rem;
        margin-bottom: var(--space-4);
        opacity: 0.5;
      }

      .empty-state-title {
        font-size: var(--text-lg);
        font-weight: 600;
        margin-bottom: var(--space-2);
      }

      .empty-state-description {
        color: var(--color-text-muted);
        margin-bottom: var(--space-6);
        max-width: 360px;
      }
    `,
  ],
})
export class EmptyStateComponent {
  readonly icon = input<string>('📭');
  readonly title = input.required<string>();
  readonly description = input.required<string>();
}