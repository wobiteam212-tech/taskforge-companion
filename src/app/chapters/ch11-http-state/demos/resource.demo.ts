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

/**
 * httpResource lifecycle, slowed down enough to see: idle, loading,
 * resolved, error — plus reload. The "network" here is a timer with a
 * failure toggle, so the state machine itself is the whole show.
 */
@Component({
  selector: 'demo-resource',
  templateUrl: './resource.demo.html',
  styleUrl: './resource.demo.scss',
})
export class ResourceDemo {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly shouldFail = signal(false);
  protected readonly latencyMs = signal(1200);

  protected readonly isLoading = signal(false);
  protected readonly value = signal<FakeProject[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly log = signal<string[]>([]);
  protected readonly hasValue = computed(() => this.value() !== null && !this.error());

  protected readonly state = computed(() => {
    if (this.isLoading()) return 'loading';
    if (this.error()) return 'error';
    if (this.value()) return 'resolved';
    return 'idle';
  });

  private requestSeq = 0;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const timer of this.timers) clearTimeout(timer);
      this.timers.clear();
    });
  }

  protected reload(): void {
    const seq = ++this.requestSeq;
    this.isLoading.set(true);
    this.error.set(null);
    this.push(`GET /api/projects (#${seq}) sent`);

    const timer = setTimeout(() => {
      this.timers.delete(timer);
      // תשובה מאוחרת של בקשה ישנה לא דורסת חדשה — בדיוק כמו ב-httpResource
      if (seq !== this.requestSeq) {
        this.push(`response #${seq} ignored (stale)`);
        return;
      }
      this.isLoading.set(false);
      if (this.shouldFail()) {
        this.value.set(null);
        this.error.set('503 Service Unavailable');
        this.push(`response #${seq}: 503 — error() is set, value() is guarded`);
      } else {
        this.value.set(FAKE_DATA);
        this.push(`response #${seq}: 200 — value() updated`);
      }
    }, this.latencyMs());
    this.timers.add(timer);
  }

  protected toggleFail(): void {
    this.shouldFail.update((v) => !v);
  }

  private push(line: string): void {
    this.log.update((lines) => [line, ...lines].slice(0, 6));
  }
}
