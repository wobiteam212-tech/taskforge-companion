import { Routes } from '@angular/router';
import { ProjectList } from './features/projects/project-list';
import { projectExistsGuard } from './features/projects/project.guard';
import { projectResolver } from './features/projects/project.resolver';

// #region step-10.3
// מפת הניווט כולה במקום אחד. שימו לב לשני סגנונות הטעינה:
// הבית נטען מיד (eager) כי זה המסך הראשון; לוח הפרויקט נטען עצל —
// הקוד שלו לא יורד לדפדפן עד שמישהו באמת מנווט אליו.
export const routes: Routes = [
  {
    path: '',
    component: ProjectList,
    title: 'TaskForge — Projects',
  },
  // #region step-14.10
  {
    path: 'projects/:projectId/issues/:issueId',
    loadComponent: () => import('./features/issues/issue-detail').then((m) => m.IssueDetail),
    canActivate: [projectExistsGuard],
    resolve: { project: projectResolver },
    title: 'TaskForge — Issue detail',
  },
  // #endregion
  // #region step-18.22
  // הדשבורד הוא מסך נפרד תחת הפרויקט — נתיב יותר ספציפי מהלוח, ולכן לפניו.
  // אותם guard ו-resolver כמו הלוח: 404 אם הפרויקט לא קיים, ושם הפרויקט מוזרק.
  {
    path: 'projects/:projectId/dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [projectExistsGuard],
    resolve: { project: projectResolver },
    title: 'TaskForge — Dashboard',
  },
  // #endregion
  {
    path: 'projects/:projectId',
    loadComponent: () => import('./features/projects/project-board').then((m) => m.ProjectBoard),
    canActivate: [projectExistsGuard],
    resolve: { project: projectResolver },
    title: 'TaskForge — Board',
  },
  {
    path: '**',
    loadComponent: () => import('./core/ui/not-found').then((m) => m.NotFound),
    title: 'TaskForge — Not found',
  },
];
// #endregion
