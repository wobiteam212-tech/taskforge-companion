import { Component, input, output, signal } from '@angular/core';

interface MiniProject {
  id: number;
  name: string;
  boosts: number;
}

/**
 * The dumb half of the playground: knows ONLY its input, speaks ONLY
 * through its output. No store, no injection — fully reusable.
 */
@Component({
  selector: 'demo-io-card',
  template: `
    <div class="io-card">
      <strong>{{ item().name }}</strong>
      <span class="n ltr">boosts: {{ item().boosts }}</span>
      <button type="button" class="btn" (click)="boost.emit(item().id)">boost +1</button>
    </div>
  `,
  styles: `
    .io-card {
      border: 1px solid var(--bdr);
      border-radius: var(--rad-sm);
      background: var(--sur2);
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 10px;

      strong { color: var(--txt1); font-size: 13.5px; }
      .n { font-family: var(--mono); font-size: 12px; color: var(--teal); margin-inline-start: auto; }
    }
  `,
})
export class IoCard {
  /** הנתון נכנס מלמעלה — הילד לא יודע מאיפה הוא הגיע */
  readonly item = input.required<MiniProject>();

  /** הבקשה יוצאת למעלה — הילד לא יודע מה יקרה איתה */
  readonly boost = output<number>();
}

/**
 * The smart half: owns the signal state, passes slices down as inputs,
 * receives intents back as outputs, and logs the round trip visibly.
 */
@Component({
  selector: 'demo-io',
  imports: [IoCard],
  templateUrl: './io.demo.html',
  styleUrl: './io.demo.scss',
})
export class IoDemo {
  protected readonly projects = signal<MiniProject[]>([
    { id: 1, name: 'Website Redesign', boosts: 0 },
    { id: 2, name: 'Mobile App', boosts: 0 },
    { id: 3, name: 'Internal Tools', boosts: 0 },
  ]);

  protected readonly log = signal<string[]>([]);

  protected onBoost(id: number): void {
    this.projects.update((list) =>
      list.map((p) => (p.id === id ? { ...p, boosts: p.boosts + 1 } : p)),
    );
    const name = this.projects().find((p) => p.id === id)?.name ?? '?';
    this.push(`output boost(${id}) rose from child; parent updated the signal; input for "${name}" flowed back down`);
  }

  protected reset(): void {
    this.projects.update((list) => list.map((p) => ({ ...p, boosts: 0 })));
    this.push('Parent reset state — all children received fresh inputs, without knowing why');
  }

  private push(line: string): void {
    this.log.update((lines) => [line, ...lines].slice(0, 5));
  }
}
