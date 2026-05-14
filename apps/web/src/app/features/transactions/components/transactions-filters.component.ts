import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    inject,
    input,
    output,
    signal,
    computed,
  } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormsModule } from '@angular/forms';
  import { AccountsService } from '../../accounts/accounts.service';
  import { CategoriesService } from '../../categories/categories.service';
  import {
    endOfMonth,
    fromDateInput,
    startOfMonth,
    toDateInput,
  } from '../../../shared/utils/format';
  import type {
    ListTransactionsQuery,
    TransactionType,
  } from '@centavo/shared-types';
  
  type Preset = 'this-month' | 'last-month' | 'last-30-days' | 'last-3-months' | 'all' | 'custom';
  type TypeFilter = 'ALL' | TransactionType;
  
  @Component({
    selector: 'app-transactions-filters',
    standalone: true,
    imports: [CommonModule, FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
      <section class="filters">
        <div class="filter-group">
          <label for="period">Period</label>
          <select id="period" [ngModel]="preset()" (ngModelChange)="onPresetChange($event)">
            <option value="this-month">This month</option>
            <option value="last-month">Last month</option>
            <option value="last-30-days">Last 30 days</option>
            <option value="last-3-months">Last 3 months</option>
            <option value="all">All time</option>
            <option value="custom">Custom range</option>
          </select>
        </div>
  
        @if (preset() === 'custom') {
          <div class="filter-group">
            <label for="start-date">From</label>
            <input
              id="start-date"
              type="date"
              [ngModel]="customStart()"
              (ngModelChange)="onCustomStartChange($event)"
            />
          </div>
          <div class="filter-group">
            <label for="end-date">To</label>
            <input
              id="end-date"
              type="date"
              [ngModel]="customEnd()"
              (ngModelChange)="onCustomEndChange($event)"
            />
          </div>
        }
  
        <div class="filter-group">
          <label>Type</label>
          <div class="type-segmented">
            <button
              type="button"
              class="segment-btn"
              [class.is-active]="typeFilter() === 'ALL'"
              (click)="onTypeChange('ALL')"
            >
              All
            </button>
            <button
              type="button"
              class="segment-btn"
              [class.is-active]="typeFilter() === 'INCOME'"
              (click)="onTypeChange('INCOME')"
            >
              Income
            </button>
            <button
              type="button"
              class="segment-btn"
              [class.is-active]="typeFilter() === 'EXPENSE'"
              (click)="onTypeChange('EXPENSE')"
            >
              Expense
            </button>
          </div>
        </div>
  
        <div class="filter-group">
          <label for="account-filter">Account</label>
          <select
            id="account-filter"
            [ngModel]="accountFilter()"
            (ngModelChange)="onAccountChange($event)"
          >
            <option [ngValue]="null">All accounts</option>
            @for (account of accountsService.accounts(); track account.id) {
              <option [value]="account.id">{{ account.name }}</option>
            }
          </select>
        </div>
  
        <div class="filter-group">
          <label for="category-filter">Category</label>
          <select
            id="category-filter"
            [ngModel]="categoryFilter()"
            (ngModelChange)="onCategoryChange($event)"
          >
            <option [ngValue]="null">All categories</option>
            @for (category of categoriesService.categories(); track category.id) {
              <option [value]="category.id">{{ category.name }}</option>
            }
          </select>
        </div>
      </section>
    `,
    styleUrl: './transactions-filters.component.scss',
  })
  export class TransactionsFiltersComponent implements OnInit {
    protected readonly accountsService = inject(AccountsService);
    protected readonly categoriesService = inject(CategoriesService);
  
    readonly initial = input<ListTransactionsQuery>({});
  
    readonly filtersChange = output<ListTransactionsQuery>();
  
    protected readonly preset = signal<Preset>('this-month');
    protected readonly typeFilter = signal<TypeFilter>('ALL');
    protected readonly accountFilter = signal<string | null>(null);
    protected readonly categoryFilter = signal<string | null>(null);
    protected readonly customStart = signal<string>(toDateInput(startOfMonth()));
    protected readonly customEnd = signal<string>(toDateInput(endOfMonth()));
  
    protected readonly currentQuery = computed<ListTransactionsQuery>(() => {
      const range = this.resolveRange();
      return {
        ...(range.start && { startDate: range.start }),
        ...(range.end && { endDate: range.end }),
        ...(this.typeFilter() !== 'ALL' && { type: this.typeFilter() as TransactionType }),
        ...(this.accountFilter() && { accountId: this.accountFilter()! }),
        ...(this.categoryFilter() && { categoryId: this.categoryFilter()! }),
      };
    });
  
    ngOnInit(): void {
      // Ensure accounts/categories are available for the dropdowns
      if (this.accountsService.count() === 0) {
        this.accountsService.loadAll().subscribe();
      }
      if (this.categoriesService.count() === 0) {
        this.categoriesService.loadAll().subscribe();
      }
  
      // Emit initial query so parent loads filtered data on mount
      this.emit();
    }
  
    onPresetChange(preset: Preset): void {
      this.preset.set(preset);
      if (preset !== 'custom') {
        this.emit();
      }
    }
  
    onCustomStartChange(value: string): void {
      this.customStart.set(value);
      this.emit();
    }
  
    onCustomEndChange(value: string): void {
      this.customEnd.set(value);
      this.emit();
    }
  
    onTypeChange(type: TypeFilter): void {
      this.typeFilter.set(type);
      this.emit();
    }
  
    onAccountChange(accountId: string | null): void {
      this.accountFilter.set(accountId || null);
      this.emit();
    }
  
    onCategoryChange(categoryId: string | null): void {
      this.categoryFilter.set(categoryId || null);
      this.emit();
    }
  
    private emit(): void {
      this.filtersChange.emit(this.currentQuery());
    }
  
    private resolveRange(): { start: string | null; end: string | null } {
      const now = new Date();
      switch (this.preset()) {
        case 'this-month':
          return {
            start: startOfMonth(now).toISOString(),
            end: endOfMonth(now).toISOString(),
          };
        case 'last-month': {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return {
            start: startOfMonth(lastMonth).toISOString(),
            end: endOfMonth(lastMonth).toISOString(),
          };
        }
        case 'last-30-days': {
          const start = new Date(now);
          start.setDate(start.getDate() - 30);
          return { start: start.toISOString(), end: now.toISOString() };
        }
        case 'last-3-months': {
          const start = new Date(now);
          start.setMonth(start.getMonth() - 3);
          return { start: start.toISOString(), end: now.toISOString() };
        }
        case 'all':
          return { start: null, end: null };
        case 'custom':
          return {
            start: this.customStart() ? fromDateInput(this.customStart()) : null,
            end: this.customEnd() ? fromDateInput(this.customEnd()) : null,
          };
      }
    }
  }