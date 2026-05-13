import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CentavoCurrencyPipe } from '../../../shared/pipes/currency.pipe.';
import type { TransactionSummary } from '@centavo/shared-types';

@Component({
  selector: 'app-transactions-summary',
  standalone: true,
  imports: [CommonModule, CentavoCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (summary(); as data) {
      <section class="summary">
        <div class="summary-card summary-income">
          <span class="summary-label">Income</span>
          <span class="summary-value">{{ data.income | centavoCurrency }}</span>
          <span class="summary-count">{{ data.incomeCount }} transaction{{ data.incomeCount === 1 ? '' : 's' }}</span>
        </div>

        <div class="summary-card summary-expense">
          <span class="summary-label">Expense</span>
          <span class="summary-value">{{ data.expense | centavoCurrency }}</span>
          <span class="summary-count">{{ data.expenseCount }} transaction{{ data.expenseCount === 1 ? '' : 's' }}</span>
        </div>

        <div class="summary-card summary-net" [class.is-negative]="isNegative()">
          <span class="summary-label">Net</span>
          <span class="summary-value">{{ data.net | centavoCurrency }}</span>
          <span class="summary-count">Income − Expense</span>
        </div>
      </section>
    }
  `,
  styleUrl: './transactions-summary.component.scss',
})
export class TransactionsSummaryComponent {
  readonly summary = input<TransactionSummary | null>(null);

  protected readonly isNegative = () => {
    const data = this.summary();
    return data ? Number(data.net) < 0 : false;
  };
}