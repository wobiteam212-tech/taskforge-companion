import { Component, inject } from '@angular/core';
import { ProjectsStore } from '../../core/state/projects.store';
import { ProjectCard } from './project-card';

// #region step-7.9
// קומפוננטה "חכמה": יודעת מאיפה הנתונים מגיעים (ה-store),
// ולא יודעת כלום על איך כרטיס נראה. החיבור לעולם קורה רק כאן.
@Component({
  selector: 'tf-project-list',
  imports: [ProjectCard],
  templateUrl: './project-list.html',
  styleUrl: './project-list.scss',
})
export class ProjectList {
  protected readonly store = inject(ProjectsStore);

  protected onOpen(projectId: number): void {
    // ניווט אמיתי מגיע בפרק 10 — בינתיים מתעדים את הכוונה
    console.log(`open project ${projectId}`);
  }
}
// #endregion
