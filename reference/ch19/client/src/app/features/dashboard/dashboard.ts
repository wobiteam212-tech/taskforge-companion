import { Component, DestroyRef, effect, inject, input, numberAttribute } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectSummary } from '../../core/models/project.model';
import { DashboardStore } from '../../core/state/dashboard.store';
import { ActivityType } from '../../core/models/dashboard.model';
import { DonutChart } from './charts/donut-chart';
import { BarChart } from './charts/bar-chart';
import { Sparkline } from './charts/sparkline';

// אייקון קצר לכל סוג אירוע בפיד — ויזואלי בלבד, aria-hidden.
// פרק 19 הוסיף AttachmentAdded ל-union, אז הפיד מכיר גם אותו.
const ACTIVITY_ICON: Record<ActivityType, string> = {
  IssueCreated: '✚',
  IssueMoved: '↻',
  CommentAdded: '💬',
  // #region step-19.13c
  AttachmentAdded: '📎',
  // #endregion
};

// #region step-18.19
// הרכיב החכם של הדשבורד: מזריק את ה-DashboardStore, מספר לו את ה-projectId
// (מה-route), וצורך selectors נגזרים. הוא לא מחשב כלום בעצמו — רק מחבר
// מודלי-תצוגה מה-store לרכיבי הגרפים הטיפשים ולפיד.
@Component({
  selector: 'tf-dashboard',
  imports: [RouterLink, DatePipe, DonutChart, BarChart, Sparkline],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly store = inject(DashboardStore);

  readonly projectId = input.required({ transform: numberAttribute });
  readonly project = input.required<ProjectSummary>();

  constructor() {
    effect(() => this.store.setProject(this.projectId()));
    this.destroyRef.onDestroy(() => this.store.clear());
  }

  protected iconFor(type: ActivityType): string {
    return ACTIVITY_ICON[type];
  }
  // #endregion
}
