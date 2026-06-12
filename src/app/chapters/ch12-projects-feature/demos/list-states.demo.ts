import { Component, DestroyRef, computed, inject, signal } from '@angular/core';

interface FakeProject {
  id: number;
  name: string;
  openIssues: number;
}

const FAKE_DATA: FakeProject[] = [
  { id: 1, name: 'Website Redesign', openIssues: 2 },
  { id: 2, name: 'Mobile App', openIssues: 1 },
  { id: 3, name: 'Internal Tools', openIssues: 0 },
];

type Scenario = 'data' | 'empty' | 'error';

/**
 * מכונת המצבים של רשימת הפרויקטים: אותו צירוף בדיוק כמו ב-project-list.html —
 * הענף נגזר מ-loading/error/items, לא נשמר כ-state נפרד שאפשר לשכוח לעדכן.
 */
@Component({
  selector: 'list-states-demo',
  templateUrl: './list-states.demo.html',
  styleUrl: './list-states.demo.scss',
})
export class ListStatesDemo {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(false);
  protected readonly error = signal(false);
  protected readonly items = signal<FakeProject[]>([]);
  protected readonly scenario = signal<Scenario>('data');

  /** הענף שייבחר בתבנית — אותה שרשרת @if כמו בקובץ האמיתי */
  protected readonly branch = computed<'skeleton' | 'error' | 'empty' | 'data'>(() => {
    if (this.loading() && !this.items().length) return 'skeleton';
    if (this.error() && !this.items().length) return 'error';
    return this.items().length ? 'data' : 'empty';
  });

  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.timer));
  }

  protected start(scenario: Scenario): void {
    this.scenario.set(scenario);
    this.items.set([]);
    this.error.set(false);
    this.load();
  }

  protected retry(): void {
    this.load();
  }

  private load(): void {
    clearTimeout(this.timer);
    this.loading.set(true);
    this.error.set(false);

    this.timer = setTimeout(() => {
      this.loading.set(false);
      switch (this.scenario()) {
        case 'data':
          this.items.set(FAKE_DATA);
          break;
        case 'empty':
          this.items.set([]);
          break;
        case 'error':
          this.error.set(true);
          break;
      }
    }, 1100);
  }
}
