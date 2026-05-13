import {
    ChangeDetectionStrategy,
    Component,
    inject,
    input,
    output,
    signal,
    effect,
  } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
  import type { Account, AccountType, CreateAccountPayload } from '@centavo/shared-types';
  
  const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
    { value: 'CHECKING', label: 'Checking' },
    { value: 'SAVINGS', label: 'Savings' },
    { value: 'CREDIT_CARD', label: 'Credit Card' },
    { value: 'CASH', label: 'Cash' },
    { value: 'INVESTMENT', label: 'Investment' },
  ];
  
  @Component({
    selector: 'app-account-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="account-name">Name</label>
          <input
            id="account-name"
            type="text"
            formControlName="name"
            [class.has-error]="hasError('name')"
            autocomplete="off"
            placeholder="e.g. Nubank, Main Checking"
          />
          @if (hasError('name')) {
            <span class="field-error">Name is required</span>
          }
        </div>
  
        <div class="form-group">
          <label for="account-type">Type</label>
          <select
            id="account-type"
            formControlName="type"
            [class.has-error]="hasError('type')"
          >
            @for (option of accountTypes; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>
        </div>
  
        <div class="form-actions">
          <button type="button" class="btn-ghost" (click)="cancel.emit()">
            Cancel
          </button>
          <button
            type="submit"
            class="btn-primary"
            [disabled]="form.invalid || saving()"
          >
            {{ saving() ? 'Saving…' : submitLabel() }}
          </button>
        </div>
      </form>
    `,
  })
  export class AccountFormComponent {
    private readonly fb = inject(FormBuilder);
  
    readonly account = input<Account | null>(null);
    readonly saving = input<boolean>(false);
  
    readonly submit = output<CreateAccountPayload>();
    readonly cancel = output<void>();
  
    protected readonly accountTypes = ACCOUNT_TYPES;
  
    protected readonly form = this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      type: ['CHECKING' as AccountType, Validators.required],
    });
  
    protected readonly submitLabel = signal('Create');
  
    constructor() {
      effect(() => {
        const account = this.account();
        if (account) {
          this.form.patchValue({ name: account.name, type: account.type });
          this.submitLabel.set('Save changes');
        } else {
          this.form.reset({ name: '', type: 'CHECKING' });
          this.submitLabel.set('Create');
        }
      });
    }
  
    hasError(field: 'name' | 'type'): boolean {
      const control = this.form.controls[field];
      return control.invalid && (control.dirty || control.touched);
    }
  
    onSubmit(): void {
      if (this.form.invalid) return;
      this.submit.emit(this.form.getRawValue());
    }
  }