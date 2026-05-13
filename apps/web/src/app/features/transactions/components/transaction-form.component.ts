import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    inject,
    input,
    output,
    signal,
    effect,
  } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
  import { AccountsService } from '../../accounts/accounts.service';
  import { CategoriesService } from '../../categories/categories.service';
  import { fromDateInput, toDateInput } from '../../../shared/utils/format';
  import type {
    CreateTransactionPayload,
    Transaction,
    TransactionType,
  } from '@centavo/shared-types';
  
  @Component({
    selector: 'app-transaction-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-row">
          <div class="form-group">
            <label>Type</label>
            <div class="type-toggle">
              <button
                type="button"
                class="type-btn"
                [class.is-active]="form.value.type === 'EXPENSE'"
                [class.type-expense]="form.value.type === 'EXPENSE'"
                (click)="form.patchValue({ type: 'EXPENSE' })"
              >
                Expense
              </button>
              <button
                type="button"
                class="type-btn"
                [class.is-active]="form.value.type === 'INCOME'"
                [class.type-income]="form.value.type === 'INCOME'"
                (click)="form.patchValue({ type: 'INCOME' })"
              >
                Income
              </button>
            </div>
          </div>
        </div>
  
        <div class="form-group">
          <label for="tx-description">Description</label>
          <input
            id="tx-description"
            type="text"
            formControlName="description"
            [class.has-error]="hasError('description')"
            placeholder="e.g. Lunch, Salary, Netflix"
            autocomplete="off"
          />
          @if (hasError('description')) {
            <span class="field-error">Description is required</span>
          }
        </div>
  
        <div class="form-row form-row-2">
          <div class="form-group">
            <label for="tx-amount">Amount</label>
            <input
              id="tx-amount"
              type="number"
              step="0.01"
              min="0.01"
              formControlName="amount"
              [class.has-error]="hasError('amount')"
              placeholder="0.00"
            />
            @if (hasError('amount')) {
              <span class="field-error">Amount must be greater than 0</span>
            }
          </div>
  
          <div class="form-group">
            <label for="tx-date">Date</label>
            <input
              id="tx-date"
              type="date"
              formControlName="date"
              [class.has-error]="hasError('date')"
            />
          </div>
        </div>
  
        <div class="form-group">
          <label for="tx-account">Account</label>
          <select
            id="tx-account"
            formControlName="accountId"
            [class.has-error]="hasError('accountId')"
          >
            <option value="" disabled>Select an account</option>
            @for (account of accountsService.accounts(); track account.id) {
              <option [value]="account.id">{{ account.name }}</option>
            }
          </select>
          @if (accountsService.count() === 0) {
            <span class="field-hint">
              You need to create an account first.
            </span>
          }
        </div>
  
        <div class="form-group">
          <label for="tx-category">Category <span class="optional">(optional)</span></label>
          <select id="tx-category" formControlName="categoryId">
            <option [ngValue]="null">No category</option>
            @for (category of categoriesService.categories(); track category.id) {
              <option [value]="category.id">{{ category.name }}</option>
            }
          </select>
        </div>
  
        <div class="form-group">
          <label for="tx-notes">Notes <span class="optional">(optional)</span></label>
          <textarea
            id="tx-notes"
            formControlName="notes"
            rows="2"
            placeholder="Any extra detail…"
          ></textarea>
        </div>
  
        <div class="form-actions">
          <button type="button" class="btn-ghost" (click)="cancel.emit()">
            Cancel
          </button>
          <button
            type="submit"
            class="btn-primary"
            [disabled]="form.invalid || saving() || accountsService.count() === 0"
          >
            {{ saving() ? 'Saving…' : submitLabel() }}
          </button>
        </div>
      </form>
    `,
    styleUrl: './transaction-form.component.scss',
  })
  export class TransactionFormComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    protected readonly accountsService = inject(AccountsService);
    protected readonly categoriesService = inject(CategoriesService);
  
    readonly transaction = input<Transaction | null>(null);
    readonly saving = input<boolean>(false);
  
    readonly submit = output<CreateTransactionPayload>();
    readonly cancel = output<void>();
  
    protected readonly submitLabel = signal('Create');
  
    protected readonly form = this.fb.nonNullable.group({
      type: ['EXPENSE' as TransactionType, Validators.required],
      description: ['', [Validators.required, Validators.minLength(1)]],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      date: [toDateInput(new Date()), Validators.required],
      accountId: ['', Validators.required],
      categoryId: [null as string | null],
      notes: [''],
    });
  
    constructor() {
      effect(() => {
        const tx = this.transaction();
        if (tx) {
          this.form.patchValue({
            type: tx.type,
            description: tx.description,
            amount: Number(tx.amount),
            date: toDateInput(tx.date),
            accountId: tx.accountId,
            categoryId: tx.categoryId,
            notes: tx.notes ?? '',
          });
          this.submitLabel.set('Save changes');
        } else {
          this.form.reset({
            type: 'EXPENSE',
            description: '',
            amount: 0,
            date: toDateInput(new Date()),
            accountId: '',
            categoryId: null,
            notes: '',
          });
          this.submitLabel.set('Create');
        }
      });
    }
  
    ngOnInit(): void {
      // Garante que accounts e categories estão carregados (caso usuário
      // venha direto de /transactions sem ter passado nas outras páginas)
      if (this.accountsService.count() === 0) {
        this.accountsService.loadAll().subscribe();
      }
      if (this.categoriesService.count() === 0) {
        this.categoriesService.loadAll().subscribe();
      }
    }
  
    hasError(field: 'description' | 'amount' | 'date' | 'accountId'): boolean {
      const control = this.form.controls[field];
      return control.invalid && (control.dirty || control.touched);
    }
  
    onSubmit(): void {
      if (this.form.invalid) return;
  
      const value = this.form.getRawValue();
      const payload: CreateTransactionPayload = {
        type: value.type,
        description: value.description,
        amount: Number(value.amount),
        date: fromDateInput(value.date),
        accountId: value.accountId,
        ...(value.categoryId && { categoryId: value.categoryId }),
        ...(value.notes && { notes: value.notes }),
      };
  
      this.submit.emit(payload);
    }
  }