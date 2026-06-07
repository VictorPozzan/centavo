import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { API_CONFIG } from '../../core/api/api.config';
import type { DashboardData, DashboardQuery } from '@centavo/shared-types';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);

  private readonly _data = signal<DashboardData | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly data = this._data.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  load(query: DashboardQuery = {}) {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (query.startDate) params = params.set('startDate', query.startDate);
    if (query.endDate) params = params.set('endDate', query.endDate);

    return this.http
      .get<DashboardData>(`${this.apiConfig.baseUrl}/dashboard`, { params })
      .pipe(
        tap({
          next: (data) => {
            this._data.set(data);
            this._loading.set(false);
          },
          error: () => {
            this._loading.set(false);
            this._error.set('Failed to load dashboard data.');
          },
        }),
      );
  }
}