import { Injectable, computed, inject, linkedSignal, signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../api/api';
import { TokenStore } from '../auth/token.store';
import { PagedResult } from '../models/api.model';
import { Issue, IssueListQuery, IssueStatus } from '../models/issue.model';

// אותו דפוס store כמו ProjectsStore — אבל הפעם ה-state האמיתי הוא ה-query:
// הרכיב מספר ל-store "מה המשתמש מבקש", וה-resource גוזר מזה את הבקשה.
@Injectable({ providedIn: 'root' })
export class IssuesStore {
  private readonly http = inject(HttpClient);
  private readonly tokenStore = inject(TokenStore);

  // #region step-13.3
  // ה-query הוא signal אחד. null = אין לוח על המסך, אין בקשה.
  // הרכיב כותב לכאן בכל שינוי ב-URL — וה-URL של ה-resource מחושב מחדש.
  private readonly query = signal<IssueListQuery | null>(null);

  setQuery(query: IssueListQuery): void {
    this.query.set(query);
  }

  // URL ריאקטיבי כמו ב-ProjectMembers (פרק 12), הפעם עם query string אמיתי.
  // ‏GET issues דורש Bearer מאז פרק 05 — בלי login אין בקשה, אין 401 מיותר.
  // ברירות מחדל מושמטות — ה-URL היוצא נקי בדיוק כמו ה-URL שבשורת הכתובת.
  private readonly pageResource = httpResource<PagedResult<Issue>>(() => {
    const q = this.query();
    if (!q || !this.tokenStore.isLoggedIn()) return undefined;

    const params = new URLSearchParams();
    if (q.status) params.set('status', q.status);
    if (q.search) params.set('search', q.search);
    if (q.sort !== '-created') params.set('sort', q.sort);
    if (q.page > 1) params.set('page', String(q.page));
    params.set('pageSize', String(q.pageSize));

    return `${API_BASE}/projects/${q.projectId}/issues?${params}`;
  });

  readonly loading = computed(() => this.pageResource.isLoading());

  readonly loadError = computed(() => this.pageResource.error());

  readonly total = computed(() =>
    this.pageResource.hasValue() ? this.pageResource.value().total : 0,
  );

  readonly totalPages = computed(() =>
    this.pageResource.hasValue() ? this.pageResource.value().totalPages : 0,
  );

  reload(): void {
    this.pageResource.reload();
  }
  // #endregion

  // #region step-13.4
  // linkedSignal: computed שמותר לכתוב אליו. כל תשובת שרת מאפסת אותו
  // לאמת החדשה — אבל בין תשובות, פקודה אופטימית יכולה לערוך אותו מקומית.
  readonly issues = linkedSignal<Issue[]>(() =>
    this.pageResource.hasValue() ? this.pageResource.value().items : [],
  );
  // #endregion

  // #region step-13.5
  // עדכון אופטימי: קודם מציירים, אחר כך שואלים את השרת.
  // הצלחה — reload מיישר את הדף מול האמת (סינון/מיון עשויים להשתנות).
  // כישלון — מחזירים את הרשימה הקודמת; ה-toast כבר הוצג ע"י ה-interceptor.
  async setStatus(issue: Issue, status: IssueStatus): Promise<void> {
    const before = this.issues();
    this.issues.update((list) =>
      list.map((i) => (i.id === issue.id ? { ...i, status } : i)),
    );

    try {
      await firstValueFrom(
        this.http.put(`${API_BASE}/issues/${issue.id}`, {
          title: issue.title,
          description: issue.description,
          status,
          priority: issue.priority,
        }),
      );
      this.pageResource.reload();
    } catch {
      this.issues.set(before);
    }
  }
  // #endregion
}
