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
  templateUrl: './account-card.component.html',
  styleUrl: './account-card.component.scss',
})
export class AccountCardComponent {
  readonly account = input.required<Account>();

  readonly edit = output<Account>();
  readonly remove = output<Account>();

  protected readonly typeLabel = () => TYPE_LABELS[this.account().type];
  protected readonly icon = () => TYPE_ICONS[this.account().type];
}
