import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE } from '../api/api';
import { TokenStore } from './token.store';

// #region step-11.8
// ה-interceptor הפונקציונלי: פונקציה, לא class. רץ על כל בקשה יוצאת,
// ומצרף Bearer רק לבקשות שמיועדות ל-API שלנו — טוקן לא דולף לדומיינים זרים.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenStore).accessToken();

  if (!token || !req.url.startsWith(API_BASE)) {
    return next(req);
  }

  // בקשות הן immutable — clone עם הכותרת, לא מוטציה
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
// #endregion
