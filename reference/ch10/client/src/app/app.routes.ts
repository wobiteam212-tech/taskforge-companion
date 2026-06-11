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
