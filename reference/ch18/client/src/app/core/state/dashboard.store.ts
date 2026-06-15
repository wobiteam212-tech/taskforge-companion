import { Injectable, computed, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { API_BASE } from '../api/api';
import { TokenStore } from '../auth/token.store';
import { ActivityEvent, ProjectStats } from '../models/dashboard.model';

// מודל-תצוגה אחיד לכל פרוסת גרף: התווית, הערך, והצבע (משתנה CSS).
// הרכיבים הטיפשים של הגרפים מקבלים בדיוק את זה — לא ProjectStats גולמי.
export interface ChartSlice {
  label: string;
  value: number;
  color: string;
}

export interface SummaryCard {
  label: string;
  value: number;
  tone: 'total' | 'open' | 'progress' | 'done';
}

const STATUS_ORDER = ['Open', 'InProgress', 'Done'] as const;
const STATUS_LABEL: Record<string, string> = { Open: 'פתוח', InProgress: 'בעבודה', Done: 'הושלם' };
const STATUS_COLOR: Record<string, string> = {
  Open: 'var(--chart-open)',
  InProgress: 'var(--chart-progress)',
  Done: 'var(--chart-done)',
};

const PRIORITY_ORDER = ['Low', 'Medium', 'High', 'Critical'] as const;
const PRIORITY_LABEL: Record<string, string> = {
  Low: 'נמוך',
  Medium: 'בינוני',
  High: 'גבוה',
  Critical: 'קריטי',
};
const PRIORITY_COLOR: Record<string, string> = {
  Low: 'var(--chart-p1)',
  Medium: 'var(--chart-p2)',
  High: 'var(--chart-p3)',
  Critical: 'var(--chart-p4)',
};

// #region step-18.14
// אותו דפוס store כמו IssueDetailStore: שני httpResource מפתח לפי projectId,
// שמחזירים undefined (= אין בקשה) כשאין פרויקט או כשמנותקים. spine #3 כאן הוא
// ה-selectors הנגזרים: מספרים גולמיים מהשרת → מודלי-תצוגה מוכנים-לציור.
@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly tokenStore = inject(TokenStore);
  private readonly projectId = signal<number | null>(null);

  setProject(id: number): void {
    this.projectId.set(id);
  }

  clear(): void {
    this.projectId.set(null);
  }

  private readonly statsResource = httpResource<ProjectStats>(() => {
    const id = this.projectId();
    return id && this.tokenStore.isLoggedIn() ? `${API_BASE}/projects/${id}/stats` : undefined;
  });

  private readonly activityResource = httpResource<ActivityEvent[]>(() => {
    const id = this.projectId();
    return id && this.tokenStore.isLoggedIn() ? `${API_BASE}/projects/${id}/activity?take=8` : undefined;
  });

  readonly stats = computed(() => (this.statsResource.hasValue() ? this.statsResource.value() : null));
  readonly activity = computed(() =>
    this.activityResource.hasValue() ? this.activityResource.value() : [],
  );
  readonly loading = computed(() => this.statsResource.isLoading() || this.activityResource.isLoading());
  readonly loadError = computed(() => this.statsResource.error() || this.activityResource.error());

  reload(): void {
    this.statsResource.reload();
    this.activityResource.reload();
  }
  // #endregion

  // #region step-18.15
  // ה-selectors הנגזרים (spine #3): כל אחד הוא computed שמעצב את אותם נתונים
  // גולמיים לצורה שרכיב מסוים צריך. הרכיבים נשארים טיפשים — כל הצורה כאן.
  readonly summaryCards = computed<SummaryCard[]>(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      { label: 'סה״כ', value: s.total, tone: 'total' },
      { label: STATUS_LABEL['Open'], value: s.open, tone: 'open' },
      { label: STATUS_LABEL['InProgress'], value: s.inProgress, tone: 'progress' },
      { label: STATUS_LABEL['Done'], value: s.done, tone: 'done' },
    ];
  });

  readonly statusSlices = computed<ChartSlice[]>(() => {
    const s = this.stats();
    if (!s) return [];
    return STATUS_ORDER.map((status) => ({
      label: STATUS_LABEL[status],
      value: s.byStatus.find((x) => x.status === status)?.count ?? 0,
      color: STATUS_COLOR[status],
    }));
  });

  readonly prioritySlices = computed<ChartSlice[]>(() => {
    const s = this.stats();
    if (!s) return [];
    return PRIORITY_ORDER.map((priority) => ({
      label: PRIORITY_LABEL[priority],
      value: s.byPriority.find((x) => x.priority === priority)?.count ?? 0,
      color: PRIORITY_COLOR[priority],
    }));
  });

  // סדרת המגמה ל-sparkline: רק הספירות, בסדר כרונולוגי שהשרת כבר החזיר
  readonly trend = computed<number[]>(() => this.stats()?.createdPerDay.map((d) => d.count) ?? []);
  // #endregion
}
