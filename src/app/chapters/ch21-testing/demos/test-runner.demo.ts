import { Component, computed, signal } from '@angular/core';

interface Case {
  name: string;
  pass: boolean;
}

// פונקציות "תחת בדיקה" — אותה לוגיקה טהורה שבאמת בודקים בפרק (גרסה עצמאית).
function midpoint(prev: number | undefined, next: number | undefined): number {
  if (prev == null && next == null) return 1024;
  if (prev == null) return next! / 2;
  if (next == null) return prev + 1024;
  return (prev + next) / 2;
}
function escapeFirst(src: string): string {
  return src.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
}

/**
 * דמו: מריץ-מבחנים זעיר. כל שורה היא assertion על פונקציה טהורה. כפתור
 * "הכנס באג" משנה את הציפייה כך שמבחן אחד נכשל — כדי לראות red, ואז green
 * אחרי "תקן". זה הלולאה של TDD בזעיר, בלי כלים ובלי שרת.
 */
@Component({
  selector: 'demo-test-runner',
  template: `
    <div class="tr">
      <div class="tr-bar">
        <span class="tr-summary" [class.ok]="allPass()" [class.bad]="!allPass()">
          {{ passCount() }}/{{ cases().length }} עוברים
        </span>
        <label class="tr-bug">
          <input type="checkbox" [checked]="bug()" (change)="bug.set($any($event.target).checked)" />
          הכנס באג
        </label>
        <button type="button" class="tr-run" (click)="bump()">הרץ שוב</button>
      </div>

      <ul class="tr-list">
        @for (c of cases(); track c.name) {
          <li class="tr-case" [class.pass]="c.pass" [class.fail]="!c.pass">
            <span class="tr-mark" aria-hidden="true">{{ c.pass ? '✓' : '✗' }}</span>
            <span class="tr-name">{{ c.name }}</span>
            <span class="tr-state">{{ c.pass ? 'PASS' : 'FAIL' }}</span>
          </li>
        }
      </ul>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .tr { display: grid; gap: var(--sp-3); }
      .tr-bar { display: flex; align-items: center; gap: var(--sp-3); }
      .tr-summary { font-weight: var(--fw-bold); }
      .tr-summary.ok { color: var(--ok, #3fb950); }
      .tr-summary.bad { color: var(--danger); }
      .tr-bug { display: inline-flex; align-items: center; gap: var(--sp-1); font-size: var(--fs-small); color: var(--txt2); margin-inline-start: auto; }
      .tr-run { padding: var(--sp-1) var(--sp-3); border: 1px solid var(--bdr2); border-radius: var(--rad-sm); background: var(--sur2); color: var(--txt2); cursor: pointer; }
      .tr-list { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-1); }
      .tr-case {
        display: flex; align-items: center; gap: var(--sp-2);
        padding: var(--sp-1) var(--sp-3); border: 1px solid var(--bdr); border-radius: var(--rad-sm);
        background: var(--sur2); font-size: var(--fs-small);
      }
      .tr-case.pass .tr-mark { color: var(--ok, #3fb950); }
      .tr-case.fail { border-color: var(--danger); }
      .tr-case.fail .tr-mark { color: var(--danger); }
      .tr-name { color: var(--txt1); }
      .tr-state { margin-inline-start: auto; color: var(--txt3); font-family: ui-monospace, monospace; }
      .tr-case.fail .tr-state { color: var(--danger); }
    `,
  ],
})
export class TestRunnerDemo {
  protected readonly bug = signal(false);
  private readonly tick = signal(0);

  protected readonly cases = computed<Case[]>(() => {
    this.tick(); // לחיצה על "הרץ שוב" מריצה מחדש
    // הבאג: כשמדליקים, midpoint מחזיר ערך שגוי בקצה התחתון — מבחן אחד נכשל.
    const mid = this.bug()
      ? (p: number | undefined, n: number | undefined) => (n == null ? p! : midpoint(p, n))
      : midpoint;

    return [
      { name: 'midpoint(1024, 2048) === 1536', pass: midpoint(1024, 2048) === 1536 },
      { name: 'midpoint(undefined, 2048) === 1024', pass: midpoint(undefined, 2048) === 1024 },
      { name: 'midpoint(1024, undefined) === 2048', pass: mid(1024, undefined) === 2048 },
      { name: 'escapeFirst("<b>") === "&lt;b&gt;"', pass: escapeFirst('<b>') === '&lt;b&gt;' },
    ];
  });

  protected readonly passCount = computed(() => this.cases().filter((c) => c.pass).length);
  protected readonly allPass = computed(() => this.passCount() === this.cases().length);

  protected bump(): void {
    this.tick.update((n) => n + 1);
  }
}
