import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CentavoCurrencyPipe } from '../../../../shared/pipes/currency.pipe';
import { formatDate } from '../../../../shared/utils/format';
import type { Transaction } from '@centavo/shared-types';

@Component({
  selector: 'app-transaction-row',
  standalone: true,
  imports: [CentavoCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './transaction-row.component.html',
  styleUrl: './transaction-row.component.scss',
})
export class TransactionRowComponent {
  readonly transaction = input.required<Transaction>();

  readonly edit = output<Transaction>();
  readonly remove = output<Transaction>();

  protected readonly formattedDate = () => formatDate(this.transaction().date);
}