import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { API_CONFIG } from '../../core/api/api.config';
import type {
  Account,
  CreateAccountPayload,
  UpdateAccountPayload,
} from '@centavo/shared-types';

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);

  private readonly _accounts = signal<Account[]>([]);
  private readonly _loading = signal(false);

  readonly accounts = this._accounts.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly count = computed(() => this._accounts().length);

  loadAll() {
    this._loading.set(true);
    return this.http
      .get<Account[]>(`${this.apiConfig.baseUrl}/accounts`)
      .pipe(
        tap({
          next: (accounts) => {
            this._accounts.set(accounts);
            this._loading.set(false);
          },
          error: () => this._loading.set(false),
        }),
      );
  }

  create(payload: CreateAccountPayload) {
    return this.http
      .post<Account>(`${this.apiConfig.baseUrl}/accounts`, payload)
      .pipe(
        tap((account) => {
          this._accounts.update((current) => [...current, account]);
        }),
      );
  }

  update(id: string, payload: UpdateAccountPayload) {
    return this.http
      .patch<Account>(`${this.apiConfig.baseUrl}/accounts/${id}`, payload)
      .pipe(
        tap((updated) => {
          this._accounts.update((current) =>
            current.map((a) => (a.id === id ? updated : a)),
          );
        }),
      );
  }

  remove(id: string) {
    return this.http
      .delete<void>(`${this.apiConfig.baseUrl}/accounts/${id}`)
      .pipe(
        tap(() => {
          this._accounts.update((current) => current.filter((a) => a.id !== id));
        }),
      );
  }
}