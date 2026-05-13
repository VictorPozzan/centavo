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
  import { AccountsService } from './accounts.service';
  import { AccountFormComponent } from './components/account-form.component';
  import { AccountCardComponent } from './components/account-card.component';
  import type { Account, CreateAccountPayload } from '@centavo/shared-types';
  
  type Mode = 'create' | 'edit' | null;
  
  @Component({
    selector: 'app-accounts-page',
    standalone: true,
    imports: [
      CommonModule,
      ModalComponent,
      ConfirmDialogComponent,
      EmptyStateComponent,
      AccountFormComponent,
      AccountCardComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
      <header class="page-header">
        <div>
          <h1 class="page-title">Accounts</h1>
          <p class="page-subtitle">
            Manage where your money lives — checking, savings, cards, cash.
          </p>
        </div>
        <button type="button" class="btn-primary" (click)="openCreate()">
          + New account
        </button>
      </header>
  
      @if (accountsService.loading() && accountsService.count() === 0) {
        <p class="loading-state">Loading accounts…</p>
      } @else if (accountsService.count() === 0) {
        <app-empty-state
          icon="🏦"
          title="No accounts yet"
          description="Add your first account to start tracking transactions."
        >
          <button type="button" class="btn-primary" (click)="openCreate()">
            Create your first account
          </button>
        </app-empty-state>
      } @else {
        <div class="accounts-grid">
          @for (account of accountsService.accounts(); track account.id) {
            <app-account-card
              [account]="account"
              (edit)="openEdit($event)"
              (remove)="confirmRemove($event)"
            />
          }
        </div>
      }
  
      @if (mode() !== null) {
        <app-modal
          [title]="mode() === 'create' ? 'New account' : 'Edit account'"
          (dismiss)="closeModal()"
        >
          <app-account-form
            [account]="editing()"
            [saving]="saving()"
            (submit)="onSubmit($event)"
            (cancel)="closeModal()"
          />
        </app-modal>
      }
  
      @if (toDelete()) {
        <app-confirm-dialog
          title="Delete account"
          [message]="
            'Delete the account ' +
            toDelete()!.name +
            '? All related transactions will also be deleted. This cannot be undone.'
          "
          confirmLabel="Delete"
          [destructive]="true"
          (confirm)="performDelete()"
          (cancel)="toDelete.set(null)"
        />
      }
    `,
    styleUrl: './accounts.page.scss',
  })
  export class AccountsPage implements OnInit {
    protected readonly accountsService = inject(AccountsService);
    private readonly toast = inject(ToastService);
  
    protected readonly mode = signal<Mode>(null);
    protected readonly editing = signal<Account | null>(null);
    protected readonly saving = signal(false);
    protected readonly toDelete = signal<Account | null>(null);
  
    ngOnInit(): void {
      this.accountsService.loadAll().subscribe({
        error: () => this.toast.error('Failed to load accounts.'),
      });
    }
  
    openCreate(): void {
      this.editing.set(null);
      this.mode.set('create');
    }
  
    openEdit(account: Account): void {
      this.editing.set(account);
      this.mode.set('edit');
    }
  
    closeModal(): void {
      this.mode.set(null);
      this.editing.set(null);
    }
  
    onSubmit(payload: CreateAccountPayload): void {
      this.saving.set(true);
  
      const operation = this.editing()
        ? this.accountsService.update(this.editing()!.id, payload)
        : this.accountsService.create(payload);
  
      operation.subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success(
            this.editing() ? 'Account updated.' : 'Account created.',
          );
          this.closeModal();
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('Something went wrong. Please try again.');
        },
      });
    }
  
    confirmRemove(account: Account): void {
      this.toDelete.set(account);
    }
  
    performDelete(): void {
      const account = this.toDelete();
      if (!account) return;
  
      this.accountsService.remove(account.id).subscribe({
        next: () => {
          this.toast.success('Account deleted.');
          this.toDelete.set(null);
        },
        error: () => {
          this.toast.error('Failed to delete account.');
          this.toDelete.set(null);
        },
      });
    }
  }