import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../../core/api/api.config';
import type {
  CommitImportResult,
  ImportPreviewResult,
} from '@centavo/shared-types';

export interface CommitPayload {
  accountId: string;
  items: {
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    date: string;
    externalId: string;
    categoryId: string | null;
  }[];
}

@Injectable({ providedIn: 'root' })
export class ImportService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);

  preview(file: File): Observable<ImportPreviewResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ImportPreviewResult>(
      `${this.apiConfig.baseUrl}/transactions/import/preview`,
      formData,
    );
  }

  commit(payload: CommitPayload): Observable<CommitImportResult> {
    return this.http.post<CommitImportResult>(
      `${this.apiConfig.baseUrl}/transactions/import/commit`,
      payload,
    );
  }
}