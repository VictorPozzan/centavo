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
  import { AccountsService } from '../../../accounts/accounts.service';
  import { CategoriesService } from '../../../categories/categories.service';
  import { fromDateInput, toDateInput } from '../../../../shared/utils/format';
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
    templateUrl: './transaction-form.component.html',
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