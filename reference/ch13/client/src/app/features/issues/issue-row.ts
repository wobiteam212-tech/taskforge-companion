import { Component, input, output } from '@angular/core';
import { Issue, IssueStatus } from '../../core/models/issue.model';
import { TfBadge } from '../../shared/ui/badge/badge';

// #region step-13.10
// שורה טיפשה לחלוטין: issue נכנס, בקשת שינוי סטטוס יוצאת כאירוע.
// היא לא מכירה את ה-store, לא את הראוטר, ולא את משחק האופטימיות —
// ולכן virtual scroll יכול למחזר אותה בחופשיות.
@Component({
  selector: 'tf-issue-row',
  imports: [TfBadge],
  templateUrl: './issue-row.html',
  styleUrl: './issue-row.scss',
})
export class IssueRow {
  readonly issue = input.required<Issue>();

  readonly statusChange = output<IssueStatus>();

  protected readonly statuses: IssueStatus[] = ['Open', 'InProgress', 'Done'];

  protected toneOf(status: IssueStatus): 'open' | 'progress' | 'done' {
    return status === 'Open' ? 'open' : status === 'InProgress' ? 'progress' : 'done';
  }

  protected onSelect(value: string): void {
    if (value !== this.issue().status) this.statusChange.emit(value as IssueStatus);
  }
}
// #endregion
