import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ProjectsStore } from '../../core/state/projects.store';

// #region step-11.7
// בפרק 10 ה-guard בדק מערך בזיכרון. עכשיו הרשימה מגיעה מהרשת,
// לכן ה-guard מחכה ל-API לפני שהוא מחליט אם לטעון את הלוח.
export const projectExistsGuard: CanActivateFn = async (route) => {
  const store = inject(ProjectsStore);
  const router = inject(Router);

  const id = Number(route.paramMap.get('projectId'));
  const project = await store.findProject(id);

  return project ? true : router.createUrlTree(['/']);
};
// #endregion
