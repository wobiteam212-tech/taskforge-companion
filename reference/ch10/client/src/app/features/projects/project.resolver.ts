import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ProjectSummary } from '../../core/models/project.model';
import { ProjectsStore } from '../../core/state/projects.store';

// #region step-10.6
// resolver: מכין את הנתונים לפני שהקומפוננטה נוצרת. כאן הוא סינכרוני
// (ה-store בזיכרון), אבל החתימה זהה גם כשהוא יחזיר Promise בפרק 11 —
// הקומפוננטה לא תרגיש בהבדל.
export const projectResolver: ResolveFn<ProjectSummary> = (route) => {
  const store = inject(ProjectsStore);
  const id = Number(route.paramMap.get('projectId'));

  // ה-guard כבר אימת קיום — הסימן ! מתועד, לא מנחש
  return store.projects().find((p) => p.id === id)!;
};
// #endregion
