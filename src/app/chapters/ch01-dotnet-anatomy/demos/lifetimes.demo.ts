import { Component, computed, signal } from '@angular/core';

interface ProbeRow {
  req: number;
  singleton: string;
  scopedA: string;
  scopedB: string;
  transientA: string;
  transientB: string;
}

function shortId(): string {
  return crypto.randomUUID().slice(0, 8);
}

/** deterministic color per id — identical ids get identical chips */
function hue(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

/**
 * Interactive DI-lifetimes demo: every "request" resolves each probe twice,
 * exactly like the /di/lifetimes endpoint. Identical Guid = identical color,
 * so the three lifetimes become visible at a glance.
 */
@Component({
  selector: 'demo-lifetimes',
  templateUrl: './lifetimes.demo.html',
  styleUrl: './lifetimes.demo.scss',
})
export class LifetimesDemo {
  protected readonly singleton = signal(shortId());
  protected readonly rows = signal<ProbeRow[]>([]);

  protected readonly reqCount = computed(() => this.rows().length);

  protected sendRequest(): void {
    const scoped = shortId(); // one instance per request scope — resolved twice
    this.rows.update((rows) => [
      {
        req: rows.length + 1,
        singleton: this.singleton(),
        scopedA: scoped,
        scopedB: scoped,
        transientA: shortId(),
        transientB: shortId(),
      },
      ...rows.slice(0, 4),
    ]);
  }

  protected restartApp(): void {
    this.singleton.set(shortId());
    this.rows.set([]);
  }

  protected chipStyle(id: string): Record<string, string> {
    return { background: `hsl(${hue(id)} 65% 28%)`, 'border-color': `hsl(${hue(id)} 70% 45%)` };
  }
}
