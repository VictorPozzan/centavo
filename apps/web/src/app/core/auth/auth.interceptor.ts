import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { TokenStorage } from './token.storage';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorage);
  const authService = inject(AuthService);

  const accessToken = tokenStorage.accessToken();
  const authReq = accessToken ? addAuthHeader(req, accessToken) : req;

  return next(authReq).pipe(
    catchError((err) => {
      // Only attempt refresh on 401 from non-auth endpoints
      const isAuthEndpoint = req.url.includes('/auth/');
      if (err.status === 401 && !isAuthEndpoint) {
        return authService.refresh().pipe(
          switchMap((tokens) => next(addAuthHeader(req, tokens.accessToken))),
          catchError((refreshErr) => throwError(() => refreshErr)),
        );
      }
      return throwError(() => err);
    }),
  );
};

function addAuthHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}