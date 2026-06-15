import { Component, computed, signal } from '@angular/core';

interface Row {
  id: number;
  title: string;
  done: boolean;
}

/**
 * דמו: ה-store הכתוב-ביד שמראה בדיוק מה ש-@ngrx/signals מפרמל.
 * מפת ישויות (signal) = withEntities, ספירה נגזרת = withComputed,
 * הפקודות add/toggle/remove = withMethods. אותה התנהגות, בלי תלות —
 * הפרק מראה בפאנלים את הקוד המקביל ב-@ngrx/signals זה לצד זה.
 */
@Component({
  selector: 'demo-signal-store',
  template: `
    <div class="ss">
      <div class="ss-head">
        <span class="ss-stat">{{ entities().length }} פריטים</span>
        <span class="ss-stat done">{{ doneCount() }} הושלמו</span>
        <span class="ss-stat">{{ remaining() }} נותרו</span>
      </div>

      <ul class="ss-list">
        @for (row of entities(); track row.id) {
          <li class="ss-item" [class.done]="row.done">
            <label>
              <input type="checkbox" [checked]="row.done" (change)="toggle(row.id)" />
              <span>{{ row.title }}</span>
            </label>
            <button type="button" class="ss-x" (click)="remove(row.id)" aria-label="הסר">✕</button>
          </li>
        } @empty {
          <li class="ss-empty">הרשימה ריקה — הוסיפו פריט.</li>
        }
      </ul>

      <form class="ss-add" (submit)="add(); $event.preventDefault()">
        <input [value]="draft()" (input)="draft.set($any($event.target).value)" placeholder="פריט חדש…" />
        <button type="button" class="ss-btn" (click)="add()" [disabled]="!draft().trim()">הוסף</button>
        <button type="button" class="ss-btn ghost" (click)="reset()">איפוס</button>
      </form>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .ss { display: grid; gap: var(--sp-3); }
      .ss-head { display: flex; gap: var(--sp-3); font-size: var(--fs-small); color: var(--txt2); }
      .ss-stat.done { color: var(--accent); }
      .ss-list { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--sp-2); }
      .ss-item {
        display: flex; align-items: center; justify-content: space-between; gap: var(--sp-2);
        padding: var(--sp-2) var(--sp-3); border: 1px solid var(--bdr); border-radius: var(--rad-sm); background: var(--sur2);
      }
      .ss-item label { display: inline-flex; align-items: center; gap: var(--sp-2); cursor: pointer; }
      .ss-item.done span { color: var(--txt3); text-decoration: line-through; }
      .ss-x { border: 0; background: transparent; color: var(--txt3); cursor: pointer; }
      .ss-empty { color: var(--txt3); padding: var(--sp-2); }
      .ss-add { display: flex; gap: var(--sp-2); }
      .ss-add input { flex: 1; min-width: 0; padding: var(--sp-1) var(--sp-2); border: 1px solid var(--bdr); border-radius: var(--rad-sm); background: var(--sur); color: var(--txt1); font: inherit; }
      .ss-btn { padding: var(--sp-1) var(--sp-3); border: 1px solid var(--accent); border-radius: var(--rad-sm); background: var(--accent-subtle); color: var(--txt1); cursor: pointer; }
      .ss-btn.ghost { border-color: var(--bdr2); background: transparent; color: var(--txt2); }
      .ss-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    `,
  ],
})
export class SignalStoreDemo {
  // withEntities ביד: מפת ישויות. signal של Map שומר זהות וסדר הכנסה.
  private readonly map = signal<Map<number, Row>>(
    new Map([
      [1, { id: 1, title: 'לכתוב את ה-store ביד', done: true }],
      [2, { id: 2, title: 'למפות ל-@ngrx/signals', done: false }],
    ]),
  );
  protected readonly draft = signal('');
  private nextId = 3;

  // withComputed ביד: סלקטורים נגזרים
  protected readonly entities = computed(() => [...this.map().values()]);
  protected readonly doneCount = computed(() => this.entities().filter((r) => r.done).length);
  protected readonly remaining = computed(() => this.entities().length - this.doneCount());

  // withMethods ביד: פקודות שמעדכנות את המפה
  protected add(): void {
    const title = this.draft().trim();
    if (!title) return;
    const id = this.nextId++;
    this.map.update((m) => new Map(m).set(id, { id, title, done: false }));
    this.draft.set('');
  }

  protected toggle(id: number): void {
    this.map.update((m) => {
      const row = m.get(id);
      if (!row) return m;
      return new Map(m).set(id, { ...row, done: !row.done });
    });
  }

  protected remove(id: number): void {
    this.map.update((m) => {
      const next = new Map(m);
      next.delete(id);
      return next;
    });
  }

  protected reset(): void {
    this.map.set(
      new Map([
        [1, { id: 1, title: 'לכתוב את ה-store ביד', done: true }],
        [2, { id: 2, title: 'למפות ל-@ngrx/signals', done: false }],
      ]),
    );
    this.nextId = 3;
    this.draft.set('');
  }
}
