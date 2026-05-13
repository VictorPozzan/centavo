import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CentavoCurrencyPipe } from '../../../shared/pipes/currency.pipe.';
import { formatDate } from '../../../shared/utils/format';
import type { Transaction } from '@centavo/shared-types';

@Component({
  selector: 'app-transaction-row',
  standalone: true,
  imports: [CentavoCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tr class="transaction-row" [attr.data-type]="transaction().type">
      <td class="cell-date">{{ formattedDate() }}</td>
      <td class="cell-description">
        <div class="description-main">{{ transaction().description }}</div>
        @if (transaction().notes) {
          <div class="description-notes">{{ transaction().notes }}</div>
        }
      </td>
      <td class="cell-category">
        @if (transaction().category) {
          <span class="category-chip">
            <span
              class="category-dot"
              [style.background-color]="transaction().category!.color"
              aria-hidden="true"
            ></span>
            {{ transaction().category!.name }}
          </span>
        } @else {
          <span class="category-empty">Uncategorized</span>
        }
      </td>
      <td class="cell-account">{{ transaction().account?.name ?? '—' }}</td>
      <td class="cell-amount">
        <span class="amount" [class.amount-expense]="transaction().type === 'EXPENSE'">
          {{ transaction().type === 'EXPENSE' ? '-' : '+' }}{{ transaction().amount | centavoCurrency }}
        </span>
      </td>
      <td class="cell-actions">
        <button
          type="button"
          class="action-btn"
          (click)="edit.emit(transaction())"
          aria-label="Edit transaction"
        >
          ✎
        </button>
        <button
          type="button"
          class="action-btn action-btn-danger"
          (click)="remove.emit(transaction())"
          aria-label="Delete transaction"
        >
          🗑
        </button>
      </td>
    </tr>
  `,
  styleUrl: './transaction-row.component.scss',
})
export class TransactionRowComponent {
  readonly transaction = input.required<Transaction>();

  readonly edit = output<Transaction>();
  readonly remove = output<Transaction>();

  protected readonly formattedDate = () => formatDate(this.transaction().date);
}