import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Account } from '@centavo/shared-types';

const TYPE_LABELS: Record<Account['type'], string> = {
  CHECKING: 'Checking',
  SAVINGS: 'Savings',
  CREDIT_CARD: 'Credit Card',
  CASH: 'Cash',
  INVESTMENT: 'Investment',
};

const TYPE_ICONS: Record<Account['type'], string> = {
  CHECKING: '🏦',
  SAVINGS: '💰',
  CREDIT_CARD: '💳',
  CASH: '💵',
  INVESTMENT: '📈',
};

@Component({
  selector: 'app-account-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="account-card">
      <div class="account-card-icon">{{ icon() }}</div>
      <div class="account-card-info">
        <h3 class="account-card-name">{{ account().name }}</h3>
        <p class="account-card-type">{{ typeLabel() }}</p>
      </div>
      <div class="account-card-actions">
        <button
          type="button"
          class="action-btn"
          (click)="edit.emit(account())"
          aria-label="Edit account"
        >
          ✎
        </button>
        <button
          type="button"
          class="action-btn action-btn-danger"
          (click)="remove.emit(account())"
          aria-label="Delete account"
        >
          🗑
        </button>
      </div>
    </article>
  `,
  styles: [
    `
      .account-card {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-4);
        background-color: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        transition: var(--transition-fast);

        &:hover {
          border-color: var(--color-border-strong);
        }
      }

      .account-card-icon {
        font-size: var(--text-2xl);
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--color-surface-2);
        border-radius: var(--radius-md);
        flex-shrink: 0;
      }

      .account-card-info {
        flex: 1;
        min-width: 0;
      }

      .account-card-name {
        font-size: var(--text-base);
        font-weight: 600;
        margin-bottom: var(--space-1);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .account-card-type {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
      }

      .account-card-actions {
        display: flex;
        gap: var(--space-2);
        flex-shrink: 0;
      }

      .action-btn {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--color-surface-2);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        color: var(--color-text-muted);
        font-size: var(--text-sm);
        transition: var(--transition-fast);

        &:hover {
          background-color: var(--color-surface-3);
          color: var(--color-text);
        }
      }

      .action-btn-danger:hover {
        color: var(--color-expense);
        border-color: var(--color-expense);
      }
    `,
  ],
})
export class AccountCardComponent {
  readonly account = input.required<Account>();

  readonly edit = output<Account>();
  readonly remove = output<Account>();

  protected readonly typeLabel = () => TYPE_LABELS[this.account().type];
  protected readonly icon = () => TYPE_ICONS[this.account().type];
}