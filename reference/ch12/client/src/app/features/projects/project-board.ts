import { Component, input, numberAttribute } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectSummary } from '../../core/models/project.model';
import { TfBadge } from '../../shared/ui/badge/badge';
import { ProjectMembers } from './project-members';

// #region step-10.8
// אפס ActivatedRoute. שלושת ה-inputs מגיעים מהראוטר עצמו:
// projectId מהנתיב (string שהופך למספר עם transform), project מה-resolver
// (לפי שם המפתח ב-resolve), ו-status מה-query string — ה-URL הוא ה-state.
@Component({
  selector: 'tf-project-board',
  imports: [RouterLink, TfBadge, ProjectMembers],
  templateUrl: './project-board.html',
  styleUrl: './project-board.scss',
})
export class ProjectBoard {
  readonly projectId = input.required({ transform: numberAttribute });

  readonly project = input.required<ProjectSummary>();

  /** ?status=Open — מסנן שחי ב-URL: רענון, שיתוף קישור וכפתור אחורה עובדים בחינם */
  readonly status = input<string>();
}
// #endregion
