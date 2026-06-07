import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CentavoCurrencyPipe } from '../../../../shared/pipes/currency.pipe';
import type { DashboardTotals } from '@centavo/shared-types';

@Component({
  selector: 'app-kpi-cards',
  standalone: true,
  imports: [CentavoCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="kpi-grid">
      <article class="kpi-card kpi-income">
        <span class="kpi-label">Income</span>
        <span class="kpi-value">{{ totals().income | centavoCurrency }}</span>
        <span class="kpi-hint">Money in</span>
      </article>

      <article class="kpi-card kpi-expense">
        <span class="kpi-label">Expense</span>
        <span class="kpi-value">{{ totals().expense | centavoCurrency }}</span>
        <span class="kpi-hint">Money out</span>
      </article>

      <article
        class="kpi-card kpi-net"
        [class.is-negative]="isNetNegative()"
      >
        <span class="kpi-label">Net</span>
        <span class="kpi-value">{{ totals().net | centavoCurrency }}</span>
        <span class="kpi-hint">Income − Expense</span>
      </article>

      <article
        class="kpi-card kpi-savings"
        [class.is-negative]="isSavingsNegative()"
      >
        <span class="kpi-label">Savings rate</span>
        <span class="kpi-value">{{ savingsRateDisplay() }}</span>
        <span class="kpi-hint">{{ savingsHint() }}</span>
      </article>
    </section>
  `,
  styleUrl: './kpi-cards.component.scss',
})
export class KpiCardsComponent {
  readonly totals = input.required<DashboardTotals>();

  protected readonly isNetNegative = computed(
    () => Number(this.totals().net) < 0,
  );

  protected readonly isSavingsNegative = computed(() => {
    const rate = this.totals().savingsRate;
    return rate !== null && rate < 0;
  });

  protected readonly savingsRateDisplay = computed(() => {
    const rate = this.totals().savingsRate;
    if (rate === null) return '—';
    return `${(rate * 100).toFixed(1)}%`;
  });

  protected readonly savingsHint = computed(() => {
    const rate = this.totals().savingsRate;
    if (rate === null) return 'No income recorded';
    if (rate < 0) return 'Spending more than earning';
    if (rate < 0.1) return 'Below 10% — try to save more';
    if (rate < 0.2) return 'Decent';
    return 'Great rate';
  });
}