import { Component, DestroyRef, computed, inject, signal } from '@angular/core';

// #region demo
// דמו: ה-gates כצינור CI. לוחצים "Run pipeline" וכל gate רץ בתורו ומאיר ירוק.
// ה-toggle "break a test" שובר את שלב ה-test — הצינור עוצר אדום, ושום דבר
// אחריו לא רץ. בדיוק כמו ב-GitHub Actions: אדום עוצר merge. הטיימרים מנוקים.
type StepState = 'idle' | 'running' | 'pass' | 'fail' | 'skipped';
interface Step {
  name: string;
  state: StepState;
}

const STEP_MS = 480;

@Component({
  selector: 'demo-ci-pipeline',
  template: `
    <div class="ci">
      <div class="ci-controls">
        <button type="button" class="ci-btn" [disabled]="running()" (click)="run()">Run pipeline</button>
        <label class="ci-toggle">
          <input type="checkbox" [checked]="breakTest()" [disabled]="running()"
                 (change)="breakTest.set($any($event.target).checked)" />
          break a test
        </label>
        <span class="ci-verdict" [attr.data-v]="verdict()">{{ verdictLabel() }}</span>
      </div>

      <ol class="ci-steps">
        @for (s of steps(); track s.name) {
          <li class="ci-step" [attr.data-state]="s.state">
            <span class="ci-dot"></span>
            <code>{{ s.name }}</code>
            <span class="ci-state">{{ label(s.state) }}</span>
          </li>
        }
      </ol>
    </div>
  `,
  styles: [
    `
      :host { display: block; direction: ltr; }
      .ci { display: grid; gap: var(--sp-3); }
      .ci-controls { display: flex; align-items: center; gap: var(--sp-2); flex-wrap: wrap; }
      .ci-btn { padding: var(--sp-1) var(--sp-3); border: 1px solid var(--bdr2); border-radius: var(--rad-sm); background: var(--sur3); color: var(--txt1); font-size: var(--fs-small); cursor: pointer; }
      .ci-btn:hover:not(:disabled) { border-color: var(--accent); }
      .ci-btn:disabled { opacity: 0.5; cursor: progress; }
      .ci-toggle { display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-small); color: var(--txt2); }
      .ci-verdict { margin-inline-start: auto; font-size: var(--fs-small); font-weight: 700; }
      .ci-verdict[data-v='pass'] { color: var(--success); }
      .ci-verdict[data-v='fail'] { color: var(--danger); }
      .ci-verdict[data-v='idle'] { color: var(--txt3); }
      .ci-steps { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-1); }
      .ci-step { display: flex; align-items: center; gap: var(--sp-2); padding: var(--sp-1) var(--sp-2); border: 1px solid var(--bdr); border-radius: var(--rad-sm); background: var(--sur2); font-size: var(--fs-small); }
      .ci-step code { color: var(--txt1); }
      .ci-state { margin-inline-start: auto; color: var(--txt3); font-size: var(--fs-small); }
      .ci-dot { inline-size: 10px; block-size: 10px; border-radius: var(--rad-full); background: var(--bdr2); flex: none; }
      .ci-step[data-state='running'] .ci-dot { background: var(--accent); }
      .ci-step[data-state='running'] .ci-state { color: var(--accent); }
      .ci-step[data-state='pass'] .ci-dot { background: var(--success); }
      .ci-step[data-state='pass'] .ci-state { color: var(--success); }
      .ci-step[data-state='fail'] .ci-dot { background: var(--danger); }
      .ci-step[data-state='fail'] { border-color: var(--danger); }
      .ci-step[data-state='fail'] .ci-state { color: var(--danger); }
      .ci-step[data-state='skipped'] { opacity: 0.5; }
    `,
  ],
})
export class CiPipelineDemo {
  private readonly names = ['pnpm install', 'gen:manifest', 'verify:coverage', 'test', 'build', 'verify:snapshots'];

  protected readonly steps = signal<Step[]>(this.names.map((name) => ({ name, state: 'idle' as StepState })));
  protected readonly breakTest = signal(false);
  protected readonly running = signal(false);
  protected readonly verdict = signal<'idle' | 'pass' | 'fail'>('idle');

  protected readonly verdictLabel = computed(() => {
    switch (this.verdict()) {
      case 'pass':
        return '✓ green — safe to merge';
      case 'fail':
        return '✗ red — merge blocked';
      default:
        return 'idle';
    }
  });

  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      for (const t of this.timers) clearTimeout(t);
      this.timers.clear();
    });
  }

  protected label(s: StepState): string {
    return s === 'idle' ? '' : s;
  }

  protected run(): void {
    this.running.set(true);
    this.verdict.set('idle');
    this.steps.set(this.names.map((name) => ({ name, state: 'idle' as StepState })));
    this.step(0);
  }

  private step(i: number): void {
    const list = this.steps();
    if (i >= list.length) {
      this.running.set(false);
      this.verdict.set('pass');
      return;
    }
    this.patch(i, 'running');
    const t = setTimeout(() => {
      this.timers.delete(t);
      const fails = this.breakTest() && list[i].name === 'test';
      if (fails) {
        this.patch(i, 'fail');
        // כל מה שאחרי כישלון מסומן skipped — הצינור עוצר.
        this.steps.update((items) => items.map((s, idx) => (idx > i ? { ...s, state: 'skipped' as StepState } : s)));
        this.running.set(false);
        this.verdict.set('fail');
        return;
      }
      this.patch(i, 'pass');
      this.step(i + 1);
    }, STEP_MS);
    this.timers.add(t);
  }

  private patch(i: number, state: StepState): void {
    this.steps.update((items) => items.map((s, idx) => (idx === i ? { ...s, state } : s)));
  }
}
// #endregion
