import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ProjectsStore } from '../../core/state/projects.store';

// #region step-10.5
// guard פונקציונלי: רץ לפני שהנתיב נטען בכלל. מחזירים UrlTree במקום
// לנווט בעצמנו — הראוטר מבטל את הניווט הנוכחי ועובר ליעד החדש,
// בלי מרוץ בין שני ניווטים מקבילים.
export const projectExistsGuard: CanActivateFn = (route) => {
  const store = inject(ProjectsStore);
  const router = inject(Router);

  const id = Number(route.paramMap.get('projectId'));
  const exists = store.projects().some((p) => p.id === id);

  return exists ? true : router.createUrlTree(['/']);
};
// #endregion
