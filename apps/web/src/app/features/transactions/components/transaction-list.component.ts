import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TransactionRowComponent } from './transaction-row.component';
import { TransactionCardComponent } from './transaction-card.component';
import type { Transaction } from '@centavo/shared-types';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [TransactionRowComponent, TransactionCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Desktop view: table -->
    <div class="table-wrapper">
      <table class="transactions-table">
        <thead>
          <tr>
            <th class="th-date">Date</th>
            <th class="th-description">Description</th>
            <th class="th-category">Category</th>
            <th class="th-account">Account</th>
            <th class="th-amount">Amount</th>
            <th class="th-actions"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          @for (transaction of transactions(); track transaction.id) {
            <app-transaction-row
              [transaction]="transaction"
              (edit)="edit.emit($event)"
              (remove)="remove.emit($event)"
            />
          }
        </tbody>
      </table>
    </div>

    <!-- Mobile view: cards -->
    <div class="cards-wrapper">
      @for (transaction of transactions(); track transaction.id) {
        <app-transaction-card
          [transaction]="transaction"
          (edit)="edit.emit($event)"
          (remove)="remove.emit($event)"
        />
      }
    </div>
  `,
  styleUrl: './transaction-list.component.scss',
})
export class TransactionListComponent {
  readonly transactions = input.required<Transaction[]>();

  readonly edit = output<Transaction>();
  readonly remove = output<Transaction>();
}