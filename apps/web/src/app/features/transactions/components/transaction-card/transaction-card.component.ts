import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CentavoCurrencyPipe } from '../../../../shared/pipes/currency.pipe';
import { formatDate } from '../../../../shared/utils/format';
import type { Transaction } from '@centavo/shared-types';

@Component({
  selector: 'app-transaction-card',
  standalone: true,
  imports: [CentavoCurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './transaction-card.component.html',
  styleUrl: './transaction-card.component.scss',
})
export class TransactionCardComponent {
  readonly transaction = input.required<Transaction>();

  readonly edit = output<Transaction>();
  readonly remove = output<Transaction>();

  protected readonly formattedDate = () => formatDate(this.transaction().date);
}