import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../api/api';
import { TokenStore } from '../auth/token.store';
import { PagedResult } from '../models/api.model';
import { Issue, IssueListQuery, IssueStatus } from '../models/issue.model';
import { EntityStore, optimistic } from './entity-store';

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

  clearQuery(): void {
    this.query.set(null);
  }

  // URL ריאקטיבי כמו ב-ProjectMembers (פרק 12), הפעם עם query string אמיתי.
  // ‏GET issues דורש Bearer מאז פרק 05 — בלי login אין בקשה, אין 401 מיותר.
  // ברירות מחדל מושמטות — ה-URL היוצא ל-API נשאר נקי ויציב.
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

  // #region step-17.8
  // ה-linkedSignal מפרק 13 התבגר ל-EntityStore (הבסיס מ-17.6, שבנוי על אותו
  // linkedSignal): ה-source הוא items מתשובת השרת, ו-issues() קורא את הרשימה
  // הנגזרת. המעטפת הציבורית לא השתנתה — הרכיבים עדיין קוראים issues() כמו קודם,
  // אבל עכשיו יש patch/snapshot/restore ממוקדים שהפקודות האופטימיות נשענות עליהם.
  private readonly entities = new EntityStore<Issue>(() =>
    this.pageResource.hasValue() ? this.pageResource.value().items : [],
  );

  readonly issues = this.entities.all;
  // #endregion

  // #region step-13.5
  // עדכון אופטימי דרך ה-helper המשותף (17.7): patch מצייר מיד, ה-PUT מתמיד,
  // וכישלון משחזר את הצילום. הצלחה — reload מיישר את הדף מול האמת
  // (סינון/מיון עשויים להזיז את ה-issue אל מחוץ לעמוד).
  async setStatus(issue: Issue, status: IssueStatus): Promise<void> {
    const before = this.entities.snapshot();
    const ok = await optimistic(
      () => this.entities.patch(issue.id, { status }),
      () =>
        firstValueFrom(
          this.http.put(`${API_BASE}/issues/${issue.id}`, {
            title: issue.title,
            description: issue.description,
            status,
            priority: issue.priority,
          }),
        ),
      () => this.entities.restore(before),
    );
    if (ok) this.pageResource.reload();
  }
  // #endregion

  // #region step-17.9
  // reorder: אותו דפוס אופטימי, פעולה ממוקדת אחת. ה-PATCH ל-/rank נושא רק את
  // הסטטוס החדש (העמודה) ואת ה-Rank שהקליינט חישב (נקודת אמצע בין השכנים).
  // בניגוד ל-setStatus אין reload בהצלחה: כבר ציירנו את המיקום הסופי וה-rank
  // המקומי תואם למה שהשרת שמר — reload רק היה מהבהב את הלוח לחינם.
  async reorder(issue: Issue, status: IssueStatus, rank: number): Promise<boolean> {
    const before = this.entities.snapshot();
    return optimistic(
      () => this.entities.patch(issue.id, { status, rank }),
      () =>
        firstValueFrom(
          this.http.patch(`${API_BASE}/issues/${issue.id}/rank`, { status, rank }),
        ),
      () => this.entities.restore(before),
    );
  }
  // #endregion
}
