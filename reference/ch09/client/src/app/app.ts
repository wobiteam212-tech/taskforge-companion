import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProjectList } from './features/projects/project-list';
import { ThemeService } from './core/state/theme';
import { TfButton } from './shared/ui/button/button';
import { ToastContainer } from './shared/ui/toast/toast-container';

// #region step-6.10
@Component({
  selector: 'app-root',
  // #region step-7.11
  // הפיצ'ר נכנס לשלד ישירות — הראוטר עדיין ריק. פרק 10 יחליף
  // את החיבור הידני הזה בניווט אמיתי דרך routes.
  imports: [RouterOutlet, ProjectList, TfButton, ToastContainer],
  // #endregion
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly themeSvc = inject(ThemeService);

  // signal = ערך + הודעה לכל מי שתלוי בו כשהוא משתנה.
  // ב-zoneless זו הדרך היחידה שהתבנית יודעת להתעדכן.
  protected readonly title = signal('TaskForge');

  protected readonly tagline = computed(() => `${this.title()} — issues, forged by hand`);
}
// #endregion
