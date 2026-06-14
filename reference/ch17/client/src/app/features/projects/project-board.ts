import { Component, computed, input, numberAttribute } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectSummary } from '../../core/models/project.model';
import { TfBadge } from '../../shared/ui/badge/badge';
import { ProjectMembers } from './project-members';
import { IssueBoard } from '../issues/issue-board';
import { KanbanBoard } from '../issues/kanban-board';

// #region step-13.11
// ה-route component הוא הבעלים של חוזה ה-URL: כל פרמטר שהלוח צריך
// מוצהר כאן כ-input (הראוטר קושר לפי שם, ולכן החיפוש נקרא q כמו ב-URL),
// וזורם הלאה כ-signal רגיל. IssueBoard קורא ערכים רק מכאן —
// את הראוטר הוא מזריק רק כדי לנווט החוצה, לא כדי לקרוא state.
@Component({
  selector: 'tf-project-board',
  imports: [RouterLink, TfBadge, ProjectMembers, IssueBoard, KanbanBoard],
  templateUrl: './project-board.html',
  styleUrl: './project-board.scss',
})
export class ProjectBoard {
  readonly projectId = input.required({ transform: numberAttribute });

  readonly project = input.required<ProjectSummary>();

  /** ?status=Open — מסנן שחי ב-URL: רענון, שיתוף קישור וכפתור אחורה עובדים בחינם */
  readonly status = input<string>();

  /** ?q=login — חיפוש; alias כי בשם של פרמטר URL עדיף קצר */
  readonly q = input<string>();

  /** ?sort=priority — סדר; ברירת המחדל -created לא מופיעה ב-URL */
  readonly sort = input<string>();

  /** ?page=2 — דפדוף */
  readonly page = input<string>();

  // #region step-17.20
  // ?view=kanban — בחירת התצוגה חיה ב-URL בדיוק כמו המסננים. ברירת המחדל
  // היא הרשימה (פרק 13), כך שקישורים קיימים לא משתנים; רק view=kanban מחליף
  // לתצוגת הלוח. רק תצוגה אחת מצוירת בכל רגע — שתיהן חולקות את אותו IssuesStore.
  readonly view = input<string>();

  protected readonly isKanban = computed(() => this.view() === 'kanban');
  // #endregion
}
// #endregion
