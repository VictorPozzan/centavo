import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, EMPTY } from 'rxjs';
import { API_CONFIG } from '../api/api.config';
import { TokenStorage } from './token.storage';
import type {
  AuthResponse,
  AuthTokens,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from './auth.types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenStorage = inject(TokenStorage);
  private readonly apiConfig = inject(API_CONFIG);

  private readonly _user = signal<AuthUser | null>(null);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiConfig.baseUrl}/auth/login`, payload)
      .pipe(tap((response) => this.handleAuthSuccess(response)));
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiConfig.baseUrl}/auth/register`, payload)
      .pipe(tap((response) => this.handleAuthSuccess(response)));
  }

  refresh(): Observable<AuthTokens> {
    const refreshToken = this.tokenStorage.getRefreshToken();

    if (!refreshToken) {
      this.logout();
      return EMPTY;
    }

    return this.http
      .post<AuthTokens>(`${this.apiConfig.baseUrl}/auth/refresh`, {
        refreshToken,
      })
      .pipe(
        tap((tokens) => {
          this.tokenStorage.setAccessToken(tokens.accessToken);
          this.tokenStorage.setRefreshToken(tokens.refreshToken);
        }),
        catchError((err) => {
          this.logout();
          return throwError(() => err);
        }),
      );
  }

  logout(): void {
    const token = this.tokenStorage.accessToken();
    if (token) {
      this.http
        .post(`${this.apiConfig.baseUrl}/auth/logout`, {})
        .subscribe({ error: () => {} }); // fire-and-forget
    }
    this.tokenStorage.clear();
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private handleAuthSuccess(response: AuthResponse): void {
    this.tokenStorage.setAccessToken(response.accessToken);
    this.tokenStorage.setRefreshToken(response.refreshToken);
    this._user.set(response.user);
  }
}