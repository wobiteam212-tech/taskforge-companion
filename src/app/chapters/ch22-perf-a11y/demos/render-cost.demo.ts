import { Component, computed, signal } from '@angular/core';

// #region demo
// דמו: "מדוד, אל תנחש". אותה רשימה בת N פריטים, בשתי גישות — naive (מרנדרים
// הכול) מול windowed (מרנדרים רק את מה שנראה, כמו virtual scroll / @defer).
// המספר שקובע הוא כמות צמתי ה-DOM: היא מה שמכביד על הדפדפן, לא ה-N עצמו.
@Component({
  selector: 'demo-render-cost',
  template: `
    <div class="rc">
      <div class="rc-controls">
        <label>
          פריטים: <strong>{{ total() }}</strong>
          <input type="range" min="50" max="5000" step="50" [value]="total()"
                 (input)="total.set(+$any($event.target).value)" />
        </label>
        <div class="rc-modes" role="tablist">
          <button type="button" [class.on]="!windowed()" (click)="windowed.set(false)">naive</button>
          <button type="button" [class.on]="windowed()" (click)="windowed.set(true)">windowed</button>
        </div>
      </div>

      <div class="rc-stats">
        <span>צמתי DOM מרונדרים: <strong [class.hot]="rendered() > 200">{{ rendered() }}</strong></span>
        <span class="rc-note">{{ windowed() ? 'רק מה שנראה — שאר הפריטים לא קיימים ב-DOM' : 'כל הפריטים ב-DOM בבת אחת' }}</span>
      </div>

      <div class="rc-viewport">
        @for (row of visible(); track row) {
          <div class="rc-row">שורה {{ row }}</div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .rc { display: grid; gap: var(--sp-3); }
      .rc-controls { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3); flex-wrap: wrap; }
      .rc-controls label { display: inline-flex; align-items: center; gap: var(--sp-2); font-size: var(--fs-small); color: var(--txt2); }
      .rc-controls input[type='range'] { inline-size: 160px; }
      .rc-modes { display: flex; gap: var(--sp-1); }
      .rc-modes button { padding: 2px var(--sp-3); border: 1px solid var(--bdr2); border-radius: var(--rad-sm); background: var(--sur2); color: var(--txt2); font-size: var(--fs-small); cursor: pointer; }
      .rc-modes button.on { border-color: var(--accent); color: var(--txt1); background: var(--accent-subtle); }
      .rc-stats { display: flex; gap: var(--sp-3); flex-wrap: wrap; font-size: var(--fs-small); color: var(--txt2); }
      .rc-stats strong { color: var(--txt1); }
      .rc-stats strong.hot { color: var(--danger); }
      .rc-note { color: var(--txt3); }
      .rc-viewport {
        block-size: 200px; overflow: auto; border: 1px solid var(--bdr); border-radius: var(--rad-sm);
        background: var(--sur2); padding: var(--sp-1);
      }
      .rc-row { padding: var(--sp-1) var(--sp-2); border-block-end: 1px solid var(--bdr); font-size: var(--fs-small); color: var(--txt2); }
    `,
  ],
})
export class RenderCostDemo {
  protected readonly total = signal(2000);
  protected readonly windowed = signal(true);

  // naive = כל הפריטים; windowed = רק "חלון" של 25 (מה ש-virtual scroll היה מרנדר)
  protected readonly visible = computed<number[]>(() => {
    const n = this.total();
    const count = this.windowed() ? Math.min(25, n) : n;
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  protected readonly rendered = computed(() => this.visible().length);
}
// #endregion
