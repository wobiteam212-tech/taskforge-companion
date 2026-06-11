import { Injectable, computed, signal } from '@angular/core';
import { AuthSession, AuthUser } from '../models/auth.model';

const STORAGE_KEY = 'taskforge-auth';

// #region step-11.10
// אותו דפוס store, הפעם לזהות: ה-session חי כ-signal, נשמר ב-localStorage,
// ונחשף לקריאה בלבד. ההחלטה "מי מחובר" מתקבלת במקום אחד — לא בכל רכיב.
@Injectable({ providedIn: 'root' })
export class TokenStore {
  private readonly _session = signal<AuthSession | null>(restoreSession());

  readonly accessToken = computed(() => this._session()?.accessToken ?? null);

  readonly user = computed<AuthUser | null>(() => this._session()?.user ?? null);

  readonly isLoggedIn = computed(() => this._session() !== null);

  setSession(session: AuthSession): void {
    this._session.set(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  clear(): void {
    this._session.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }
}

/** שחזור session מרענון קודם — ערך פגום נזרק בשקט, לא מפיל את האפליקציה */
function restoreSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}
// #endregion
