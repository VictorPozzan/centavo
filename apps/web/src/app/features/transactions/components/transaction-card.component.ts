import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CentavoCurrencyPipe } from '../../../shared/pipes/currency.pipe';
import { formatDate } from '../../../shared/utils/format';
import type { Transaction } from '@centavo/shared-types';

@Component({
  selector: 'app-transaction-card',
  standalone: true,
  imports: [CentavoCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="transaction-card"
      [attr.data-type]="transaction().type"
      (click)="edit.emit(transaction())"
    >
      <div class="card-main">
        <div class="card-info">
          <p class="card-description">{{ transaction().description }}</p>
          <p class="card-meta">
            @if (transaction().category) {
              <span class="card-category">
                <span
                  class="category-dot"
                  [style.background-color]="transaction().category!.color"
                ></span>
                {{ transaction().category!.name }}
              </span>
              <span class="meta-separator">·</span>
            }
            <span>{{ formattedDate() }}</span>
          </p>
        </div>
        <div class="card-amount">
          <span class="amount" [class.amount-expense]="transaction().type === 'EXPENSE'">
            {{ transaction().type === 'EXPENSE' ? '-' : '+' }}{{ transaction().amount | centavoCurrency }}
          </span>
          <button
            type="button"
            class="card-delete"
            (click)="$event.stopPropagation(); remove.emit(transaction())"
            aria-label="Delete transaction"
          >
            🗑
          </button>
        </div>
      </div>
    </article>
  `,
  styleUrl: './transaction-card.component.scss',
})
export class TransactionCardComponent {
  readonly transaction = input.required<Transaction>();

  readonly edit = output<Transaction>();
  readonly remove = output<Transaction>();

  protected readonly formattedDate = () => formatDate(this.transaction().date);
}