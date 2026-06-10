import { Routes } from '@angular/router';
import { READY_CHAPTERS } from './core/registry/registry';

// one route per READY chapter, generated from the registry
const chapterRoutes: Routes = READY_CHAPTERS.map((c) => ({
  path: `chapters/${c.slug}`,
  loadComponent: () =>
    import('./core/ui/chapter-page/chapter-page').then((m) => m.ChapterPage),
  // bound to ChapterPage's `chapterId` input via withComponentInputBinding()
  data: { chapterId: c.id },
  title: `${c.title} · TaskForge Companion`,
}));

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./core/ui/home/home').then((m) => m.Home),
    title: 'TaskForge Companion · בונים פולסטאק ביד',
  },
  ...chapterRoutes,
  {
    path: 'drill',
    loadComponent: () => import('./core/ui/drill/drill').then((m) => m.Drill),
    title: 'תרגול ראיונות · TaskForge Companion',
  },
  {
    path: 'glossary',
    loadComponent: () => import('./core/ui/glossary/glossary').then((m) => m.Glossary),
    title: 'מילון מונחים · TaskForge Companion',
  },
  { path: '**', redirectTo: '' },
];
