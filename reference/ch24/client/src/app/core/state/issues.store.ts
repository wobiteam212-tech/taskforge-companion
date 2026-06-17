import { computed, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { removeEntity, setAllEntities, updateEntity, upsertEntity, withEntities } from '@ngrx/signals/entities';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../api/api';
import { TokenStore } from '../auth/token.store';
import { PagedResult } from '../models/api.model';
import { Issue, IssueListQuery, IssueStatus } from '../models/issue.model';

// #region step-20.1
// פרק 20 — Capstone. עד כאן בנינו את ה-state ביד: EntityStore גנרי (ch17),
// optimistic util (ch17), selectors נגזרים (ch18). עכשיו ממפים store אחד —
// IssuesStore, העשיר ביותר — ל-@ngrx/signals, ומראים שהספרייה מפרמלת בדיוק את
// מה שכתבנו. החוזה הציבורי לא משתנה: issue-board ו-kanban-board לא נוגעים בכלל.
type IssuesState = {
  query: IssueListQuery | null;
  total: number;
  totalPages: number;
  loading: boolean;
  loadError: unknown;
};

// אותו בניית-URL כמו קודם: defaults מושמטים, ה-URL היוצא נקי ויציב.
function buildUrl(q: IssueListQuery): string {
  const params = new URLSearchParams();
  if (q.status) params.set('status', q.status);
  if (q.search) params.set('search', q.search);
  if (q.sort !== '-created') params.set('sort', q.sort);
  if (q.page > 1) params.set('page', String(q.page));
  params.set('pageSize', String(q.pageSize));
  return `${API_BASE}/projects/${q.projectId}/issues?${params}`;
}
// #endregion

// #region step-20.2
// signalStore מורכב מ-features. כל feature מוסיף state/computed/methods לאותו
// store. withEntities<Issue> מחליף את ה-EntityStore שכתבנו ביד; withComputed
// מחליף את ה-selectors; withMethods מחזיק את הפקודות עם ה-optimistic+rollback.
export const IssuesStore = signalStore(
  { providedIn: 'root' },
  // withEntities = מה שכתבנו ב-EntityStore: מפת ישויות לפי id + entities() נגזר
  withEntities<Issue>(),
  withState<IssuesState>({
    query: null,
    total: 0,
    totalPages: 0,
    loading: false,
    loadError: null,
  }),
  // #endregion

  // #region step-20.3
  // withComputed = ה-selectors הנגזרים. issues() הוא alias ל-entities() —
  // כך החוזה הציבורי (issues, loading, total, totalPages, loadError) זהה לקודם.
  withComputed((store) => ({
    issues: computed(() => store.entities()),
  })),
  // #endregion

  // #region step-20.4
  // load: אותו fetch כמו קודם, אבל setAllEntities מעדכן את אוסף הישויות.
  // loadVersion מחזיר לנו תכונה חשובה של httpResource: תשובה ישנה לא דורסת
  // state חדש אם query/login השתנו בזמן שהבקשה הייתה בדרך.
  // null/מנותק מנקה לרשימה ריקה — כמו ש-httpResource החזיר undefined.
  withMethods((store, http = inject(HttpClient)) => {
    let loadVersion = 0;

    return {
      async load(q: IssueListQuery | null, loggedIn: boolean): Promise<void> {
        const version = ++loadVersion;
        if (!q || !loggedIn) {
          patchState(store, setAllEntities<Issue>([]), {
            total: 0,
            totalPages: 0,
            loading: false,
            loadError: null,
          });
          return;
        }
        patchState(store, { loading: true, loadError: null });
        try {
          const page = await firstValueFrom(http.get<PagedResult<Issue>>(buildUrl(q)));
          if (version !== loadVersion) return;
          patchState(store, setAllEntities(page.items), {
            total: page.total,
            totalPages: page.totalPages,
            loading: false,
          });
        } catch (error) {
          if (version !== loadVersion) return;
          patchState(store, { loading: false, loadError: error });
        }
      },
    };
  }),
  // #endregion

  // #region step-20.5
  // הפקודות: setQuery/clearQuery רק כותבות query (אפקט ה-onInit טוען); reorder
  // ו-setStatus הם ה-optimistic util ממופה ל-withMethods: updateEntity מצייר מיד,
  // ובכישלון setAllEntities(before) משחזר את הצילום. אותה התנהגות, ניסוח של ספרייה.
  withMethods((store, http = inject(HttpClient), tokenStore = inject(TokenStore)) => ({
    setQuery(query: IssueListQuery): void {
      patchState(store, { query });
    },
    clearQuery(): void {
      patchState(store, { query: null });
    },
    reload(): void {
      void store.load(store.query(), tokenStore.isLoggedIn());
    },
    async setStatus(issue: Issue, status: IssueStatus): Promise<void> {
      const before = store.entities();
      patchState(store, updateEntity({ id: issue.id, changes: { status } }));
      try {
        await firstValueFrom(
          http.put(`${API_BASE}/issues/${issue.id}`, {
            title: issue.title,
            description: issue.description,
            status,
            priority: issue.priority,
          }),
        );
        void store.load(store.query(), tokenStore.isLoggedIn());
      } catch {
        patchState(store, setAllEntities(before));
      }
    },
    async reorder(issue: Issue, status: IssueStatus, rank: number): Promise<boolean> {
      const before = store.entities();
      patchState(store, updateEntity({ id: issue.id, changes: { status, rank } }));
      try {
        await firstValueFrom(
          http.patch(`${API_BASE}/issues/${issue.id}/rank`, { status, rank }),
        );
        return true;
      } catch {
        patchState(store, setAllEntities(before));
        return false;
      }
    },
  })),
  // #endregion

  // #region step-24.13
  // פרק 24: החלת אירועים *מרוחקים* (מ-SignalR). אותו אוסף ישויות, אותו
  // patchState — רק שהמקור הוא דחיפת שרת ולא תשובת fetch. upsertEntity מוסיף
  // issue חדש או מעדכן קיים במקום (כך כרטיס בלוח "זז" לעמודה אחרת חי);
  // removeEntity מסיר. שום refetch — הדחיפה כבר נושאת את ה-issue המלא. ה-board
  // ו-ה-kanban לא נגעו: אותו public surface, מקור חדש.
  withMethods((store) => ({
    applyRemoteUpsert(issue: Issue): void {
      patchState(store, upsertEntity(issue));
    },
    applyRemoteRemove(id: number): void {
      patchState(store, removeEntity(id));
    },
  })),
  // #endregion

  // #region step-20.6
  // onInit: אפקט אחד שמחבר טעינה ל-query ול-isLoggedIn — בדיוק ה-reactivity
  // שה-httpResource נתן בחינם (URL שתלוי ב-query וב-login). שינוי באחד מהם טוען מחדש.
  withHooks({
    onInit(store, tokenStore = inject(TokenStore)) {
      effect(() => {
        void store.load(store.query(), tokenStore.isLoggedIn());
      });
    },
  }),
  // #endregion
);
