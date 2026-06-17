import { Component, DestroyRef, computed, inject, signal } from '@angular/core';

// #region demo
// דמו: לוח חי בין שני לקוחות. Client A מבצע פעולות (יצירה/הזזה); כשהן עוברות
// "הופ רשת" קצר הן מופיעות אצל Client B — בלי refetch. A לא מקבל הד של עצמו
// (כבר עדכן אופטימית). מנתקים את B: אירועים שנשלחים בזמן הניתוק *אובדים* (realtime
// best-effort); מחברים מחדש: B מסתנכרן מ-A (reconnect-reconcile). הטיימרים מנוקים.
type Status = 'Open' | 'InProgress' | 'Done';
interface Card {
  id: number;
  title: string;
  status: Status;
}

const NEXT: Record<Status, Status> = { Open: 'InProgress', InProgress: 'Done', Done: 'Open' };
const HOP_MS = 550;

@Component({
  selector: 'demo-two-client-realtime',
  template: `
    <div class="rt">
      <div class="rt-controls">
        <button type="button" class="rt-btn rt-a" (click)="createFromA()">A: Create issue</button>
        <button type="button" class="rt-btn rt-a" [disabled]="!a().length" (click)="moveFromA()">
          A: Move issue
        </button>
        <button type="button" class="rt-btn" (click)="toggleB()">
          {{ bConnected() ? 'Disconnect B' : 'Reconnect B' }}
        </button>
      </div>

      <div class="rt-grid">
        <div class="rt-client">
          <header>
            <strong>Client A</strong>
            <span class="rt-pill on">● live</span>
          </header>
          @for (c of a(); track c.id) {
            <div class="rt-card" [attr.data-status]="c.status">
              <span>{{ c.title }}</span>
              <span class="rt-status">{{ c.status }}</span>
            </div>
          } @empty {
            <p class="rt-muted">No issues yet</p>
          }
        </div>

        <div class="rt-client" [class.off]="!bConnected()">
          <header>
            <strong>Client B</strong>
            <span class="rt-pill" [class.on]="bConnected()">{{ bConnected() ? '● live' : '○ offline' }}</span>
          </header>
          @for (c of b(); track c.id) {
            <div class="rt-card" [attr.data-status]="c.status">
              <span>{{ c.title }}</span>
              <span class="rt-status">{{ c.status }}</span>
            </div>
          } @empty {
            <p class="rt-muted">No issues yet</p>
          }
          @if (drift() > 0) {
            <p class="rt-drift">{{ drift() }} update(s) missed — reconnect to sync</p>
          }
        </div>
      </div>

      <ol class="rt-log" aria-live="polite">
        @for (line of log(); track line.id) {
          <li [attr.data-kind]="line.kind">{{ line.text }}</li>
        }
      </ol>
    </div>
  `,
  styles: [
    `
      :host { display: block; direction: ltr; }
      .rt { display: grid; gap: var(--sp-3); }
      .rt-controls { display: flex; gap: var(--sp-2); flex-wrap: wrap; }
      .rt-btn { padding: var(--sp-1) var(--sp-3); border: 1px solid var(--bdr2); border-radius: var(--rad-sm); background: var(--sur3); color: var(--txt1); font-size: var(--fs-small); cursor: pointer; }
      .rt-btn:hover:not(:disabled) { border-color: var(--accent); }
      .rt-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .rt-btn.rt-a { background: var(--accent-subtle); }
      .rt-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--sp-3); }
      .rt-client { display: grid; gap: var(--sp-1); align-content: start; padding: var(--sp-3); border: 1px solid var(--bdr); border-radius: var(--rad-sm); background: var(--sur2); }
      .rt-client.off { opacity: 0.6; border-style: dashed; }
      .rt-client header { display: flex; align-items: center; justify-content: space-between; margin-block-end: var(--sp-1); }
      .rt-pill { font-size: var(--fs-small); color: var(--txt3); }
      .rt-pill.on { color: var(--success); }
      .rt-card { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-2); padding: var(--sp-1) var(--sp-2); border: 1px solid var(--bdr); border-radius: var(--rad-sm); background: var(--sur); font-size: var(--fs-small); color: var(--txt1); }
      .rt-status { font-size: var(--fs-small); color: var(--txt3); }
      .rt-card[data-status='InProgress'] .rt-status { color: var(--accent); }
      .rt-card[data-status='Done'] .rt-status { color: var(--success); }
      .rt-muted { color: var(--txt3); font-size: var(--fs-small); margin: 0; }
      .rt-drift { color: var(--warn); font-size: var(--fs-small); margin: var(--sp-1) 0 0; }
      .rt-log { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; font-size: var(--fs-small); }
      .rt-log li { padding: 2px var(--sp-2); border-inline-start: 2px solid var(--bdr2); color: var(--txt2); }
      .rt-log li[data-kind='push'] { border-color: var(--success); }
      .rt-log li[data-kind='miss'] { border-color: var(--warn); color: var(--warn); }
      .rt-log li[data-kind='sync'] { border-color: var(--accent); }
      @media (max-width: 620px) { .rt-grid { grid-template-columns: minmax(0, 1fr); } }
    `,
  ],
})
export class TwoClientRealtimeDemo {
  protected readonly a = signal<Card[]>([
    { id: 1, title: 'Fix navbar', status: 'Open' },
    { id: 2, title: 'Write docs', status: 'InProgress' },
  ]);
  protected readonly b = signal<Card[]>([
    { id: 1, title: 'Fix navbar', status: 'Open' },
    { id: 2, title: 'Write docs', status: 'InProgress' },
  ]);
  protected readonly bConnected = signal(true);

  // כמה עדכונים של A לא הגיעו ל-B בזמן ניתוק — נמחק באיפוס בעת reconnect.
  protected readonly drift = computed(() => {
    if (!this.bConnected()) {
      // הפרש פשוט: כמה כרטיסים/סטטוסים שונים בין A ל-B.
      return diffCount(this.a(), this.b());
    }
    return 0;
  });

  protected readonly log = signal<{ id: number; text: string; kind: string }[]>([]);
  private logId = 0;
  private nextId = 3;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      for (const t of this.timers) clearTimeout(t);
      this.timers.clear();
    });
  }

  protected createFromA(): void {
    const card: Card = { id: this.nextId++, title: `Issue #${this.nextId - 1}`, status: 'Open' };
    // A מעדכן אופטימית מיד — זה ה"שלי", לא הד מהשרת.
    this.a.update((list) => [...list, card]);
    this.push('created', card);
  }

  protected moveFromA(): void {
    const list = this.a();
    if (!list.length) return;
    const target = list[list.length - 1];
    const moved: Card = { ...target, status: NEXT[target.status] };
    this.a.update((items) => items.map((c) => (c.id === moved.id ? moved : c)));
    this.push('moved', moved);
  }

  protected toggleB(): void {
    const willConnect = !this.bConnected();
    this.bConnected.set(willConnect);
    if (willConnect) {
      // reconnect-reconcile: אירועים שהוחמצו אבדו, אז B מסתנכרן ממצב A הנוכחי.
      this.b.set(this.a().map((c) => ({ ...c })));
      this.append('B reconnected — re-join + reload, synced from server', 'sync');
    } else {
      this.append('B disconnected — broadcasts during this time will be lost', 'miss');
    }
  }

  // ה"הופ": A דחף ל-group; B מקבל אחרי השהיה — אבל רק אם הוא מחובר.
  private push(kind: 'created' | 'moved', card: Card): void {
    const connectedAtSend = this.bConnected();
    const t = setTimeout(() => {
      this.timers.delete(t);
      if (!this.bConnected() || !connectedAtSend) {
        this.append(`B did not receive "${card.title}" (${kind}) — was disconnected`, 'miss');
        return;
      }
      this.b.update((list) => {
        const exists = list.some((c) => c.id === card.id);
        return exists ? list.map((c) => (c.id === card.id ? card : c)) : [...list, card];
      });
      this.append(`B received broadcast: "${card.title}" (${kind}) — no refetch`, 'push');
    }, HOP_MS);
    this.timers.add(t);
  }

  private append(text: string, kind: string): void {
    this.log.update((lines) => [{ id: ++this.logId, text, kind }, ...lines].slice(0, 6));
  }
}

function diffCount(a: Card[], b: Card[]): number {
  const bById = new Map(b.map((c) => [c.id, c]));
  let n = 0;
  for (const c of a) {
    const m = bById.get(c.id);
    if (!m || m.status !== c.status) n++;
  }
  return n;
}
// #endregion
