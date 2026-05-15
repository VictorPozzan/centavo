import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ModalComponent } from '../../shared/ui/modal/modal.component';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { TransactionsService } from './transactions.service';
import { TransactionListComponent } from './components/transaction-list/transaction-list.component';
import { TransactionFormComponent } from './components/transaction-form/transaction-form.component';
import { TransactionsFiltersComponent } from './components/transactions-filters/transactions-filters.component';
import { TransactionsSummaryComponent } from './components/transactions-summary/transactions-summary.component';
import { ImportModalComponent } from './import/import-modal.component';
import type {
  CreateTransactionPayload,
  ListTransactionsQuery,
  Transaction,
} from '@centavo/shared-types';

type Mode = 'create' | 'edit' | null;

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    ConfirmDialogComponent,
    EmptyStateComponent,
    TransactionListComponent,
    TransactionFormComponent,
    TransactionsFiltersComponent,
    TransactionsSummaryComponent,
    ImportModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './transactions.page.html',
  styleUrl: './transactions.page.scss',
})
export class TransactionsPage {
  protected readonly transactionsService = inject(TransactionsService);
  private readonly toast = inject(ToastService);

  protected readonly mode = signal<Mode>(null);
  protected readonly editing = signal<Transaction | null>(null);
  protected readonly saving = signal(false);
  protected readonly toDelete = signal<Transaction | null>(null);
  protected readonly currentFilters = signal<ListTransactionsQuery>({});
  protected readonly showImport = signal(false);

  protected readonly emptyDescription = () => {
    const filters = this.currentFilters();
    const hasFilters =
      filters.startDate || filters.endDate || filters.type || filters.accountId || filters.categoryId;
    return hasFilters
      ? 'No transactions match the current filters. Try adjusting them.'
      : 'Start tracking your finances by recording your first transaction.';
  };

  onFiltersChange(filters: ListTransactionsQuery): void {
    this.currentFilters.set(filters);
    this.reload();
  }

  reload(): void {
    forkJoin({
      list: this.transactionsService.load(this.currentFilters()),
      summary: this.transactionsService.loadSummary(this.currentFilters()),
    }).subscribe({
      error: () => this.toast.error('Failed to load transactions.'),
    });
  }

  loadMore(): void {
    this.transactionsService.loadMore(this.currentFilters()).subscribe({
      error: () => this.toast.error('Failed to load more transactions.'),
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.mode.set('create');
  }

  openEdit(transaction: Transaction): void {
    this.editing.set(transaction);
    this.mode.set('edit');
  }

  closeModal(): void {
    this.mode.set(null);
    this.editing.set(null);
  }

  onSubmit(payload: CreateTransactionPayload): void {
    this.saving.set(true);

    const operation = this.editing()
      ? this.transactionsService.update(this.editing()!.id, payload)
      : this.transactionsService.create(payload);

    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(
          this.editing() ? 'Transaction updated.' : 'Transaction created.',
        );
        this.closeModal();
        // Refresh summary since totals changed
        this.transactionsService.loadSummary(this.currentFilters()).subscribe();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Something went wrong. Please try again.');
      },
    });
  }

  confirmRemove(transaction: Transaction): void {
    this.toDelete.set(transaction);
  }

  protected deleteMessage(): string {
    const transaction = this.toDelete();
    return transaction
      ? `Delete '${transaction.description}'? This cannot be undone.`
      : 'Delete this transaction? This cannot be undone.';
  }

  performDelete(): void {
    const transaction = this.toDelete();
    if (!transaction) return;

    this.transactionsService.remove(transaction.id).subscribe({
      next: () => {
        this.toast.success('Transaction deleted.');
        this.toDelete.set(null);
        // Refresh summary since totals changed
        this.transactionsService.loadSummary(this.currentFilters()).subscribe();
      },
      error: () => {
        this.toast.error('Failed to delete transaction.');
        this.toDelete.set(null);
      },
    });
  }

  openImport(): void {
    this.showImport.set(true);
  }

  onImported(count: number): void {
    this.showImport.set(false);
    // Reload the list and summary to reflect the imported transactions
    this.reload();
  }
}