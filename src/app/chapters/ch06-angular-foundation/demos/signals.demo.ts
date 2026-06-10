import { Component, computed, effect, signal } from '@angular/core';

/**
 * The zoneless mental model, live: a plain class field vs a signal.
 * Same template, same clicks — but only known triggers (signal writes,
 * template events, markForCheck) schedule change detection, so a silent
 * setTimeout mutation never reaches the screen on its own.
 */
@Component({
  selector: 'demo-signals',
  templateUrl: './signals.demo.html',
  styleUrl: './signals.demo.scss',
})
export class SignalsDemo {
  /** שדה רגיל — אנגולר לא עוקב אחריו */
  protected plain = 0;

  protected readonly count = signal(0);
  protected readonly double = computed(() => this.count() * 2);
  protected readonly log = signal<string[]>([]);

  constructor() {
    // effect נוצר בתוך injection context — ולכן כאן, בבנאי
    effect(() => {
      this.push(`effect saw: count = ${this.count()}, double = ${this.double()}`);
    });
  }

  protected incSignal(): void {
    this.count.update((c) => c + 1);
  }

  protected incPlainClick(): void {
    this.plain++;
    // אין כאן signal — ובכל זאת המסך יתעדכן: אירוע תבנית הוא טריגר מוכר
  }

  protected incPlainTimeout(): void {
    setTimeout(() => {
      this.plain++;
      // בכוונה שקט לגמרי: אף טריגר מוכר לא נורה, והמסך נשאר מאחור
    });
  }

  protected revealTruth(): void {
    this.push(`plain is actually ${this.plain} (this render also synced the stale card)`);
  }

  private push(line: string): void {
    this.log.update((lines) => [line, ...lines].slice(0, 6));
  }
}
