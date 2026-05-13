import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    inject,
    signal,
  } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { ModalComponent } from '../../shared/ui/modal/modal.component';
  import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog/confirm-dialog.component';
  import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
  import { ToastService } from '../../shared/ui/toast/toast.service';
  import { TransactionsService } from './transactions.service';
  import { TransactionListComponent } from './components/transaction-list.component';
  import { TransactionFormComponent } from './components/transaction-form.component';
  import type { CreateTransactionPayload, Transaction } from '@centavo/shared-types';
  
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
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
      <header class="page-header">
        <div>
          <h1 class="page-title">Transactions</h1>
          <p class="page-subtitle">All your income and expenses in one place.</p>
        </div>
        <button type="button" class="btn-primary" (click)="openCreate()">
          + New transaction
        </button>
      </header>
  
      @if (transactionsService.loading() && transactionsService.count() === 0) {
        <p class="loading-state">Loading transactions…</p>
      } @else if (transactionsService.count() === 0) {
        <app-empty-state
          icon="💸"
          title="No transactions yet"
          description="Start tracking your finances by recording your first transaction."
        >
          <button type="button" class="btn-primary" (click)="openCreate()">
            Add your first transaction
          </button>
        </app-empty-state>
      } @else {
        <app-transaction-list
          [transactions]="transactionsService.transactions()"
          (edit)="openEdit($event)"
          (remove)="confirmRemove($event)"
        />
  
        @if (transactionsService.hasMore()) {
          <div class="load-more">
            <button
              type="button"
              class="btn-secondary"
              (click)="loadMore()"
              [disabled]="transactionsService.loadingMore()"
            >
              {{ transactionsService.loadingMore() ? 'Loading…' : 'Load more' }}
            </button>
            <p class="load-more-count">
              Showing {{ transactionsService.count() }} of {{ transactionsService.total() }}
            </p>
          </div>
        }
      }
  
      @if (mode() !== null) {
        <app-modal
          [title]="mode() === 'create' ? 'New transaction' : 'Edit transaction'"
          (dismiss)="closeModal()"
        >
          <app-transaction-form
            [transaction]="editing()"
            [saving]="saving()"
            (submit)="onSubmit($event)"
            (cancel)="closeModal()"
          />
        </app-modal>
      }
  
      @if (toDelete()) {
        <app-confirm-dialog
          title="Delete transaction"
          [message]="
            'Delete \\'' +
            toDelete()!.description +
            '\\'? This cannot be undone.'
          "
          confirmLabel="Delete"
          [destructive]="true"
          (confirm)="performDelete()"
          (cancel)="toDelete.set(null)"
        />
      }
    `,
    styleUrl: './transactions.page.scss',
  })
  export class TransactionsPage implements OnInit {
    protected readonly transactionsService = inject(TransactionsService);
    private readonly toast = inject(ToastService);
  
    protected readonly mode = signal<Mode>(null);
    protected readonly editing = signal<Transaction | null>(null);
    protected readonly saving = signal(false);
    protected readonly toDelete = signal<Transaction | null>(null);
  
    ngOnInit(): void {
      this.transactionsService.load().subscribe({
        error: () => this.toast.error('Failed to load transactions.'),
      });
    }
  
    loadMore(): void {
      this.transactionsService.loadMore().subscribe({
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
  
    performDelete(): void {
      const transaction = this.toDelete();
      if (!transaction) return;
  
      this.transactionsService.remove(transaction.id).subscribe({
        next: () => {
          this.toast.success('Transaction deleted.');
          this.toDelete.set(null);
        },
        error: () => {
          this.toast.error('Failed to delete transaction.');
          this.toDelete.set(null);
        },
      });
    }
  }