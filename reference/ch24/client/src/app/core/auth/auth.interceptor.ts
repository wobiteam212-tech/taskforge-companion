import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE } from '../api/api';
import { BoardConnection } from '../realtime/board-connection';
import { TokenStore } from './token.store';

// #region step-11.8
// ה-interceptor הפונקציונלי: פונקציה, לא class. רץ על כל בקשה יוצאת,
// ומצרף Bearer רק לבקשות שמיועדות ל-API שלנו — טוקן לא דולף לדומיינים זרים.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenStore).accessToken();
  // #region step-24.12
  // פרק 24: גם ה-connectionId של ה-WebSocket מצורף לכל בקשת API. השרת ישתמש בו
  // כ-origin בשידור, כך שהלקוח שיזם את הכתיבה יזהה את ההד של עצמו וידלג עליו.
  const connectionId = inject(BoardConnection).connectionId();
  // #endregion

  if (!req.url.startsWith(API_BASE)) {
    return next(req);
  }

  // בקשות הן immutable — clone עם הכותרות, לא מוטציה
  const setHeaders: Record<string, string> = {};
  if (token) setHeaders['Authorization'] = `Bearer ${token}`;
  if (connectionId) setHeaders['X-Connection-Id'] = connectionId;

  return Object.keys(setHeaders).length ? next(req.clone({ setHeaders })) : next(req);
};
// #endregion
