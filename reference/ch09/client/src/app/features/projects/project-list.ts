import { Component, inject, signal } from '@angular/core';
import { ProjectsStore } from '../../core/state/projects.store';
import { ProjectCard } from './project-card';
import { TfButton } from '../../shared/ui/button/button';
import { TfDialog } from '../../shared/ui/dialog/dialog';
import { TfField } from '../../shared/ui/field/field';
import { ToastService } from '../../shared/ui/toast/toast.service';

// #region step-7.9
// קומפוננטה "חכמה": יודעת מאיפה הנתונים מגיעים (ה-store),
// ולא יודעת כלום על איך כרטיס נראה. החיבור לעולם קורה רק כאן.
@Component({
  selector: 'tf-project-list',
  imports: [ProjectCard, TfButton, TfDialog, TfField],
  templateUrl: './project-list.html',
  styleUrl: './project-list.scss',
})
export class ProjectList {
  protected readonly store = inject(ProjectsStore);
  private readonly toastSvc = inject(ToastService);

  protected readonly newProjectOpen = signal(false);

  protected onOpen(projectId: number): void {
    // ניווט אמיתי מגיע בפרק 10 — בינתיים מתעדים את הכוונה
    console.log(`open project ${projectId}`);
  }

  protected create(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) {
      this.toastSvc.show('Project name is required', 'danger');
      return;
    }
    this.store.addProject(trimmed);
    this.toastSvc.show(`Project "${trimmed}" created`, 'success');
    this.newProjectOpen.set(false);
  }
}
// #endregion
