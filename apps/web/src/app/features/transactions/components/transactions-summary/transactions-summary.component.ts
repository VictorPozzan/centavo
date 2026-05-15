import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CentavoCurrencyPipe } from '../../../../shared/pipes/currency.pipe';
import type { TransactionSummary } from '@centavo/shared-types';

@Component({
  selector: 'app-transactions-summary',
  standalone: true,
  imports: [CommonModule, CentavoCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './transactions-summary.component.html',
  styleUrl: './transactions-summary.component.scss',
})
export class TransactionsSummaryComponent {
  readonly summary = input<TransactionSummary | null>(null);

  protected readonly isNegative = () => {
    const data = this.summary();
    return data ? Number(data.net) < 0 : false;
  };
}