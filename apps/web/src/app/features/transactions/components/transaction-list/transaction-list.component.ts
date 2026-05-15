import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TransactionRowComponent } from '../transaction-row/transaction-row.component';
import { TransactionCardComponent } from '../transaction-card/transaction-card.component';
import type { Transaction } from '@centavo/shared-types';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [TransactionRowComponent, TransactionCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './transaction-list.component.html',
  styleUrl: './transaction-list.component.scss',
})
export class TransactionListComponent {
  readonly transactions = input.required<Transaction[]>();

  readonly edit = output<Transaction>();
  readonly remove = output<Transaction>();
}