import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ThemeService } from './core/state/theme';
import { TfButton } from './shared/ui/button/button';
import { ToastContainer } from './shared/ui/toast/toast-container';

// #region step-6.10
@Component({
  selector: 'app-root',
  // #region step-7.11
  // ההבטחה מפרק 07 קוימה: השלד לא מכיר אף פיצ'ר. הראוטר מחליט
  // מה מוצג ב-main, והשלד מספק רק מסגרת — header, theme, toasts.
  imports: [RouterOutlet, RouterLink, TfButton, ToastContainer],
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
