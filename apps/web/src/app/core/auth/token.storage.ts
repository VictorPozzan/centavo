import { Injectable, signal } from '@angular/core';

const REFRESH_TOKEN_KEY = 'centavo:refresh-token';

@Injectable({ providedIn: 'root' })
export class TokenStorage {
  /**
   * Access token kept in memory only.
   * Per ADR-0007, never persisted to localStorage to mitigate XSS exposure.
   */
  private readonly _accessToken = signal<string | null>(null);

  readonly accessToken = this._accessToken.asReadonly();

  setAccessToken(token: string | null): void {
    this._accessToken.set(token);
  }

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  setRefreshToken(token: string | null): void {
    try {
      if (token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } catch {
      // localStorage may be unavailable (private mode, quota)
    }
  }

  clear(): void {
    this._accessToken.set(null);
    this.setRefreshToken(null);
  }
}