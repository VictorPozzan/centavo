import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { API_CONFIG } from '../../core/api/api.config';
import type {
  CreateTransactionPayload,
  ListTransactionsQuery,
  PaginatedTransactions,
  Transaction,
  UpdateTransactionPayload,
  TransactionSummary
} from '@centavo/shared-types';

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);

  private readonly _transactions = signal<Transaction[]>([]);
  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _loadingMore = signal(false);
  private readonly _summary = signal<TransactionSummary | null>(null);

  readonly transactions = this._transactions.asReadonly();
  readonly total = this._total.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loadingMore = this._loadingMore.asReadonly();
  readonly count = computed(() => this._transactions().length);
  readonly hasMore = computed(() => this.count() < this._total());
  readonly summary = this._summary.asReadonly();

  /**
   * Loads the first page of results, replacing the current list.
   */
  load(filters: ListTransactionsQuery = {}) {
    this._loading.set(true);
    return this.http
      .get<PaginatedTransactions>(`${this.apiConfig.baseUrl}/transactions`, {
        params: this.buildParams({ ...filters, offset: 0 }),
      })
      .pipe(
        tap({
          next: (result) => {
            this._transactions.set(result.data);
            this._total.set(result.total);
            this._loading.set(false);
          },
          error: () => this._loading.set(false),
        }),
      );
  }

  /**
   * Loads the next page and appends to the current list.
   */
  loadMore(filters: ListTransactionsQuery = {}) {
    this._loadingMore.set(true);
    return this.http
      .get<PaginatedTransactions>(`${this.apiConfig.baseUrl}/transactions`, {
        params: this.buildParams({ ...filters, offset: this.count() }),
      })
      .pipe(
        tap({
          next: (result) => {
            this._transactions.update((current) => [...current, ...result.data]);
            this._total.set(result.total);
            this._loadingMore.set(false);
          },
          error: () => this._loadingMore.set(false),
        }),
      );
  }

  create(payload: CreateTransactionPayload) {
    return this.http
      .post<Transaction>(`${this.apiConfig.baseUrl}/transactions`, payload)
      .pipe(
        tap((transaction) => {
          this._transactions.update((current) => [transaction, ...current]);
          this._total.update((n) => n + 1);
        }),
      );
  }

  update(id: string, payload: UpdateTransactionPayload) {
    return this.http
      .patch<Transaction>(`${this.apiConfig.baseUrl}/transactions/${id}`, payload)
      .pipe(
        tap((updated) => {
          this._transactions.update((current) =>
            current.map((t) => (t.id === id ? updated : t)),
          );
        }),
      );
  }

  remove(id: string) {
    return this.http
      .delete<void>(`${this.apiConfig.baseUrl}/transactions/${id}`)
      .pipe(
        tap(() => {
          this._transactions.update((current) => current.filter((t) => t.id !== id));
          this._total.update((n) => Math.max(0, n - 1));
        }),
      );
  }

  reset(): void {
    this._transactions.set([]);
    this._total.set(0);
  }

  private buildParams(filters: ListTransactionsQuery): HttpParams {
    let params = new HttpParams();
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.accountId) params = params.set('accountId', filters.accountId);
    if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
    if (filters.limit !== undefined) params = params.set('limit', String(filters.limit));
    if (filters.offset !== undefined) params = params.set('offset', String(filters.offset));
    return params;
  }

  loadSummary(filters: ListTransactionsQuery = {}) {
    return this.http
      .get<TransactionSummary>(`${this.apiConfig.baseUrl}/transactions/summary`, {
        params: this.buildParams({ ...filters, limit: undefined, offset: undefined }),
      })
      .pipe(
        tap((summary) => {
          this._summary.set(summary);
        }),
      );
  }
}