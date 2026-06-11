import { Component, computed, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProjectList } from './features/projects/project-list';

// #region step-6.10
@Component({
  selector: 'app-root',
  // #region step-7.11
  // הפיצ'ר נכנס לשלד ישירות — הראוטר עדיין ריק. פרק 10 יחליף
  // את החיבור הידני הזה בניווט אמיתי דרך routes.
  imports: [RouterOutlet, ProjectList],
  // #endregion
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // signal = ערך + הודעה לכל מי שתלוי בו כשהוא משתנה.
  // ב-zoneless זו הדרך היחידה שהתבנית יודעת להתעדכן.
  protected readonly title = signal('TaskForge');

  protected readonly tagline = computed(() => `${this.title()} — issues, forged by hand`);
}
// #endregion
