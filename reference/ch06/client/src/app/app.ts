import { Component, computed, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// #region step-6.10
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
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
