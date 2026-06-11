import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../api/api';
import { AuthSession } from '../models/auth.model';
import { TokenStore } from './token.store';

// #region step-11.11
// פעולות זהות הן ציוויות (פקודה, לא מצב) — ולכן HttpClient רגיל
// עם await, לא httpResource. ה-store שומר את התוצאה; השירות רק מתווך.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStore = inject(TokenStore);

  async login(email: string, password: string): Promise<void> {
    const session = await firstValueFrom(
      this.http.post<AuthSession>(`${API_BASE}/auth/login`, { email, password }),
    );
    this.tokenStore.setSession(session);
  }

  logout(): void {
    // ביטול ה-refresh token בשרת (rotation) מגיע בפרק ההקשחה —
    // בינתיים ניקוי מקומי מספיק כדי לצאת.
    this.tokenStore.clear();
  }
}
// #endregion
