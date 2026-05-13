import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { API_CONFIG } from '../../core/api/api.config';
import type {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '@centavo/shared-types';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);

  private readonly _categories = signal<Category[]>([]);
  private readonly _loading = signal(false);

  readonly categories = this._categories.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly count = computed(() => this._categories().length);

  loadAll() {
    this._loading.set(true);
    return this.http
      .get<Category[]>(`${this.apiConfig.baseUrl}/categories`)
      .pipe(
        tap({
          next: (categories) => {
            this._categories.set(categories);
            this._loading.set(false);
          },
          error: () => this._loading.set(false),
        }),
      );
  }

  create(payload: CreateCategoryPayload) {
    return this.http
      .post<Category>(`${this.apiConfig.baseUrl}/categories`, payload)
      .pipe(
        tap((category) => {
          this._categories.update((current) =>
            [...current, category].sort((a, b) => a.name.localeCompare(b.name)),
          );
        }),
      );
  }

  update(id: string, payload: UpdateCategoryPayload) {
    return this.http
      .patch<Category>(`${this.apiConfig.baseUrl}/categories/${id}`, payload)
      .pipe(
        tap((updated) => {
          this._categories.update((current) =>
            current
              .map((c) => (c.id === id ? updated : c))
              .sort((a, b) => a.name.localeCompare(b.name)),
          );
        }),
      );
  }

  remove(id: string) {
    return this.http
      .delete<void>(`${this.apiConfig.baseUrl}/categories/${id}`)
      .pipe(
        tap(() => {
          this._categories.update((current) =>
            current.filter((c) => c.id !== id),
          );
        }),
      );
  }
}