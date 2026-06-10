import { Component, DestroyRef, computed, inject, signal } from '@angular/core';

interface Stage {
  name: string;
  desc: string;
}

const STAGES: Stage[] = [
  {
    name: 'Logging',
    desc: 'נכנס ראשון ומסיים אחרון: רושם את תחילת הבקשה, מחכה ל-next, ורושם את הסטטוס הסופי. כמו השומר בכניסה לבניין.',
  },
  {
    name: 'Timing',
    desc: 'מפעיל Stopwatch ורושם OnStarting שיוסיף X-Elapsed-Ms לכותרות. הוא עוטף את כל מי שאחריו, ולכן מודד את הזמן האמיתי.',
  },
  {
    name: 'Routing',
    desc: 'משווה את ה-method וה-path לטבלת ה-endpoints. אם אין התאמה, הבקשה חוזרת מכאן עם 404 — בלי להגיע ל-handler אף פעם.',
  },
  {
    name: 'Endpoint',
    desc: 'היעד הסופי: ה-handler של MapGet רץ, מחזיר ערך, וה-framework מסדרל אותו ל-JSON. מכאן התשובה מתחילה את דרכה חזרה.',
  },
];

/**
 * Interactive middleware-pipeline demo: a request travels down the pipe,
 * the response climbs back up through the same middlewares in reverse.
 */
@Component({
  selector: 'demo-pipeline',
  templateUrl: './pipeline.demo.html',
  styleUrl: './pipeline.demo.scss',
})
export class PipelineDemo {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly stages = STAGES;
  protected readonly selected = signal(0);

  /** -1 = idle; 0..n-1 going down; n..2n-1 climbing back */
  protected readonly phase = signal(-1);
  protected readonly running = computed(() => this.phase() >= 0);
  protected readonly downIndex = computed(() => {
    const p = this.phase();
    return p >= 0 && p < STAGES.length ? p : -1;
  });
  protected readonly upIndex = computed(() => {
    const p = this.phase();
    return p >= STAGES.length ? 2 * STAGES.length - 1 - p : -1;
  });
  protected readonly doneOnce = signal(false);

  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => clearInterval(this.timer));
  }

  protected send(): void {
    clearInterval(this.timer);
    this.phase.set(0);
    this.timer = setInterval(() => {
      const next = this.phase() + 1;
      if (next >= STAGES.length * 2) {
        clearInterval(this.timer);
        this.phase.set(-1);
        this.doneOnce.set(true);
        return;
      }
      this.phase.set(next);
    }, 550);
  }

  protected stateOf(i: number): 'down' | 'up' | 'idle' {
    if (this.downIndex() === i) return 'down';
    if (this.upIndex() === i) return 'up';
    return 'idle';
  }
}
