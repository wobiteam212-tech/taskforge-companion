import { Component, DestroyRef, computed, effect, inject, input, numberAttribute } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TokenStore } from '../../core/auth/token.store';
import { IssuesStore } from '../../core/state/issues.store';
import { Issue, IssueListQuery, IssueSort, IssueStatus } from '../../core/models/issue.model';
import { IssueRow } from './issue-row';

/** עמוד אחד גדול: מספיק כדי ש-virtual scroll יהיה מורגש, עדיין דף אחד ברשת */
const PAGE_SIZE = 50;

const SORTS: IssueSort[] = ['-created', 'created', 'title', 'priority'];
const STATUSES: IssueStatus[] = ['Open', 'InProgress', 'Done'];

// #region step-13.6
// הרכיב החכם של הלוח. ה-state שלו לא גר כאן — הוא גר ב-URL:
// status / q / sort / page מגיעים כ-inputs מ-ProjectBoard (שקיבל אותם
// מהראוטר), מנורמלים ל-IssueListQuery, ונכתבים ל-store. כל פעולה של
// המשתמש לא משנה שום signal מקומי — היא מנווטת, וה-URL מנווט את הנתונים.
@Component({
  selector: 'tf-issue-board',
  imports: [RouterLink, ScrollingModule, IssueRow],
  templateUrl: './issue-board.html',
  styleUrl: './issue-board.scss',
})
export class IssueBoard {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly store = inject(IssuesStore);
  protected readonly tokenStore = inject(TokenStore);

  readonly projectId = input.required({ transform: numberAttribute });
  readonly status = input<string>();
  readonly search = input<string>();
  readonly sort = input<string>();
  readonly page = input(1, { transform: numberAttribute });

  protected readonly statuses = STATUSES;
  protected readonly sorts = SORTS;

  /** ‏URL פתוח לכולם — ולכן כל ערך עובר נורמליזציה לפני שהוא הופך לבקשה */
  private readonly query = computed<IssueListQuery>(() => ({
    projectId: this.projectId(),
    status: STATUSES.includes(this.status() as IssueStatus)
      ? (this.status() as IssueStatus)
      : null,
    search: this.search()?.trim() || null,
    sort: SORTS.includes(this.sort() as IssueSort) ? (this.sort() as IssueSort) : '-created',
    page: Number.isFinite(this.page()) && this.page() > 0 ? Math.trunc(this.page()) : 1,
    pageSize: PAGE_SIZE,
  }));

  constructor() {
    effect(() => this.store.setQuery(this.query()));
    this.destroyRef.onDestroy(() => clearTimeout(this.searchTimer));
  }
  // #endregion

  // #region step-13.7
  // כל שינוי מסנן = ניווט. merge משאיר את שאר הפרמטרים במקומם,
  // ו-null מוחק מפתח — שינוי מסנן תמיד חוזר לעמוד הראשון.
  private patchUrl(patch: Record<string, string | number | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: patch,
      queryParamsHandling: 'merge',
    });
  }

  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  /** debounce הוא דאגה של UI — ה-store וה-URL נשארים פשוטים */
  protected onSearch(value: string): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.patchUrl({ q: value.trim() || null, page: null });
    }, 250);
  }

  protected onSort(value: string): void {
    this.patchUrl({ sort: value === '-created' ? null : value, page: null });
  }

  protected goToPage(page: number): void {
    this.patchUrl({ page: page > 1 ? page : null });
  }
  // #endregion

  // #region step-13.8
  // הפקודה האופטימית: הרכיב רק מעביר הלאה. ה-store מצייר, שולח, ומתחרט אם צריך.
  protected changeStatus(issue: Issue, status: IssueStatus): void {
    void this.store.setStatus(issue, status);
  }

  protected trackId(_: number, issue: Issue): number {
    return issue.id;
  }
  // #endregion
}
