import { Injectable, computed, signal } from '@angular/core';
import { ProjectSummary } from '../models/project.model';

// #region step-7.8
// אותם שלושה פרויקטים ש-DbSeeder זורע בשרת — כולל ספירות ה-open
// שה-API מחזיר באמת (2/1/0). מוק שמשקר על הצורה או על הנתונים
// ייתן לכם ביטחון מזויף; הזהות לשרת היא הנכס שלו.
const SEED: ProjectSummary[] = [
  { id: 1, name: 'Website Redesign', description: 'Refresh the marketing site end to end', openIssues: 2 },
  { id: 2, name: 'Mobile App', description: 'iOS + Android companion app', openIssues: 1 },
  { id: 3, name: 'Internal Tools', description: null, openIssues: 0 },
];
// #endregion

// גבול ה-state: קומפוננטות קוראות signals לקריאה-בלבד ומבקשות שינויים
// דרך מתודות. בפרק 11 ה-SEED מתחלף ב-httpResource מול ה-API האמיתי —
// והציבור של ה-store לא משתנה. (אותו סים כמו IProjectRepository בשרת.)
@Injectable({ providedIn: 'root' })
export class ProjectsStore {
  // #region step-7.7
  private readonly _projects = signal<ProjectSummary[]>(SEED);

  /** הציבור: לקריאה בלבד — אין דרך לכתוב מבחוץ. */
  readonly projects = this._projects.asReadonly();

  readonly totalOpenIssues = computed(() =>
    this.projects().reduce((sum, p) => sum + p.openIssues, 0),
  );
  // #endregion

  rename(id: number, name: string): void {
    this._projects.update((list) =>
      list.map((p) => (p.id === id ? { ...p, name } : p)),
    );
  }
}
