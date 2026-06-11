import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
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
  private readonly router = inject(Router);

  protected readonly newProjectOpen = signal(false);

  // #region step-10.10
  // ה-console.log מפרק 07 משלם את חובו: ניווט אמיתי. הכרטיס הטיפש
  // עדיין רק פולט מספר — מי שמחליט לאן הולכים הוא החכם.
  protected onOpen(projectId: number): void {
    this.router.navigate(['/projects', projectId]);
  }
  // #endregion

  // #region step-11.15
  // create הפך לאסינכרוני: POST אמיתי יכול להיכשל (401 בלי להתחבר,
  // ולידציה, שרת כבוי). ההודעה מגיעה מה-error interceptor —
  // כאן רק מחליטים אם לסגור את הדיאלוג.
  protected async create(name: string): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) {
      this.toastSvc.show('Project name is required', 'danger');
      return;
    }

    try {
      await this.store.addProject(trimmed);
      this.toastSvc.show(`Project "${trimmed}" created`, 'success');
      this.newProjectOpen.set(false);
    } catch {
      // הדיאלוג נשאר פתוח — המשתמש מתחבר ומנסה שוב
    }
  }
  // #endregion
}
// #endregion
