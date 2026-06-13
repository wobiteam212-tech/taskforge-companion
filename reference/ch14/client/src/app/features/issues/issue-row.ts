import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Issue, IssueStatus } from '../../core/models/issue.model';
import { TfBadge } from '../../shared/ui/badge/badge';

// #region step-14.11
// השורה עדיין טיפשה מבחינת state: issue נכנס, שינוי סטטוס יוצא כאירוע.
// בפרק 14 היא מקבלת RouterLink רק כדי להפוך את הכותרת לקישור detail;
// ה-store, האופטימיות וההרשאות עדיין נשארים מחוץ לרכיב.
@Component({
  selector: 'tf-issue-row',
  imports: [RouterLink, TfBadge],
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
