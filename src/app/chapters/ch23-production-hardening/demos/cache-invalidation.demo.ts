import { Component, DestroyRef, computed, inject, signal } from '@angular/core';

// #region demo
// דמו: OutputCaching + invalidation. סימולציה של GET /stats עם cache קצר-מועד.
// השיעור המרכזי: caching זה הקל — invalidation זה הקשה. ה-toggle "evict on write"
// מראה בדיוק את זה: כשהוא כבוי, יצירת issue *לא* מפנה את ה-cache, וה-GET הבא
// מגיש מספר ישן (stale) בזמן שה-DB כבר התקדם. כשהוא דלוק — כתיבה מפנה,
// וה-GET הבא חוזר ל-DB ומחזיר אמת. הטיימר מנוקה ב-DestroyRef.
const TTL_MS = 15_000;

interface CacheEntry {
  open: number;
  storedAt: number;
}

@Component({
  selector: 'demo-cache-invalidation',
  template: `
    <div class="ci">
      <div class="ci-row ci-top">
        <code class="ci-route">GET /api/projects/1/stats</code>
        @if (lastResult(); as r) {
          <span class="ci-badge" [class.hit]="r === 'hit'" [class.miss]="r === 'miss'">
            {{ r === 'hit' ? 'CACHE HIT' : 'CACHE MISS' }}
          </span>
        }
      </div>

      <div class="ci-grid">
        <!-- ה-cache -->
        <div class="ci-card" [class.empty]="!live()">
          <header>תשובה ב-cache</header>
          @if (live()) {
            <div class="ci-num" [class.stale]="isStale()">
              Open: <strong>{{ cache()!.open }}</strong>
              @if (isStale()) { <span class="ci-stale">STALE</span> }
            </div>
            <div class="ci-ttl">
              <div class="ci-ttl-bar" [style.inline-size.%]="ttlPct()"></div>
            </div>
            <small>פג בעוד {{ ttlLeft() }}s</small>
          } @else {
            <div class="ci-num ci-muted">— ריק —</div>
            <small>ה-GET הבא יפנה ל-DB</small>
          }
        </div>

        <!-- ה-DB -->
        <div class="ci-card ci-db">
          <header>DB (האמת)</header>
          <div class="ci-num">Open: <strong>{{ dbOpen() }}</strong></div>
          <small>{{ loading() ? 'מריץ אגרגציה…' : 'מקור האמת' }}</small>
        </div>
      </div>

      <div class="ci-controls">
        <button type="button" class="ci-btn" [disabled]="loading()" (click)="get()">GET /stats</button>
        <button type="button" class="ci-btn ci-write" (click)="createIssue()">צור issue (כתיבה)</button>
        <label class="ci-toggle">
          <input type="checkbox" [checked]="evictOnWrite()" (change)="evictOnWrite.set($any($event.target).checked)" />
          evict on write
        </label>
      </div>

      <ol class="ci-log" aria-live="polite">
        @for (line of log(); track line.id) {
          <li [attr.data-kind]="line.kind">{{ line.text }}</li>
        }
      </ol>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .ci { display: grid; gap: var(--sp-3); }
      .ci-row { display: flex; align-items: center; gap: var(--sp-2); flex-wrap: wrap; }
      .ci-top { justify-content: space-between; }
      .ci-route { font-size: var(--fs-small); color: var(--txt2); }
      .ci-badge { font-size: var(--fs-small); font-weight: 700; padding: 2px var(--sp-2); border-radius: var(--rad-sm); }
      .ci-badge.hit { color: var(--success); background: color-mix(in oklab, var(--success) 14%, transparent); }
      .ci-badge.miss { color: var(--warn); background: color-mix(in oklab, var(--warn) 14%, transparent); }
      .ci-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--sp-3); }
      .ci-card {
        display: grid; gap: var(--sp-1); padding: var(--sp-3); border: 1px solid var(--bdr);
        border-radius: var(--rad-sm); background: var(--sur2);
      }
      .ci-card header { font-size: var(--fs-small); color: var(--txt3); text-transform: uppercase; letter-spacing: 0.04em; }
      .ci-card.empty { border-style: dashed; background: var(--sur); }
      .ci-card.ci-db { background: var(--sur3); }
      .ci-num { font-size: 1.4rem; color: var(--txt1); display: flex; align-items: center; gap: var(--sp-2); }
      .ci-num.ci-muted { color: var(--txt3); font-size: 1rem; }
      .ci-num.stale strong { color: var(--warn); }
      .ci-stale { font-size: var(--fs-small); font-weight: 700; color: var(--warn); border: 1px solid var(--warn); border-radius: var(--rad-sm); padding: 0 6px; }
      .ci-ttl { block-size: 6px; border-radius: var(--rad-full); background: var(--bdr2); overflow: hidden; }
      .ci-ttl-bar { block-size: 100%; background: var(--accent); transition: inline-size 0.25s linear; }
      .ci-card small { font-size: var(--fs-small); color: var(--txt3); }
      .ci-controls { display: flex; align-items: center; gap: var(--sp-2); flex-wrap: wrap; }
      .ci-btn { padding: var(--sp-1) var(--sp-3); border: 1px solid var(--bdr2); border-radius: var(--rad-sm); background: var(--sur3); color: var(--txt1); font-size: var(--fs-small); cursor: pointer; }
      .ci-btn:hover:not(:disabled) { border-color: var(--accent); }
      .ci-btn:disabled { opacity: 0.5; cursor: progress; }
      .ci-btn.ci-write { background: var(--accent-subtle); }
      .ci-toggle { display: inline-flex; align-items: center; gap: 6px; margin-inline-start: auto; font-size: var(--fs-small); color: var(--txt2); }
      .ci-log { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; font-size: var(--fs-small); }
      .ci-log li { padding: 2px var(--sp-2); border-inline-start: 2px solid var(--bdr2); color: var(--txt2); }
      .ci-log li[data-kind='hit'] { border-color: var(--success); }
      .ci-log li[data-kind='miss'] { border-color: var(--warn); }
      .ci-log li[data-kind='evict'] { border-color: var(--accent); }
      .ci-log li[data-kind='stale'] { border-color: var(--danger); color: var(--danger); }
      @media (max-width: 620px) { .ci-grid { grid-template-columns: minmax(0, 1fr); } }
    `,
  ],
})
export class CacheInvalidationDemo {
  // האמת: כמה issues פתוחים יש כרגע ב-DB. כתיבה מגדילה.
  protected readonly dbOpen = signal(7);
  // ה-cache: מה ש-GET שמר, ומתי.
  protected readonly cache = signal<CacheEntry | null>(null);
  protected readonly evictOnWrite = signal(true);
  protected readonly loading = signal(false);
  protected readonly lastResult = signal<'hit' | 'miss' | null>(null);

  // tick לשעון — מזין את ספירת ה-TTL והפקיעה האוטומטית.
  private readonly nowTick = signal(Date.now());

  // האם יש cache בתוקף (קיים ולא פג).
  protected readonly live = computed(() => {
    const c = this.cache();
    return c !== null && this.nowTick() - c.storedAt < TTL_MS;
  });

  protected readonly ttlLeft = computed(() => {
    const c = this.cache();
    if (!c) return 0;
    return Math.max(0, Math.ceil((TTL_MS - (this.nowTick() - c.storedAt)) / 1000));
  });

  protected readonly ttlPct = computed(() => {
    const c = this.cache();
    if (!c) return 0;
    return Math.max(0, Math.min(100, ((TTL_MS - (this.nowTick() - c.storedAt)) / TTL_MS) * 100));
  });

  // stale = ה-cache חי אבל לא תואם ל-DB. בדיוק מה שקורה כשלא מפנים בכתיבה.
  protected readonly isStale = computed(() => this.live() && this.cache()!.open !== this.dbOpen());

  protected readonly log = signal<{ id: number; text: string; kind: string }[]>([]);
  private logId = 0;

  constructor() {
    const timer = setInterval(() => this.nowTick.set(Date.now()), 250);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected get(): void {
    if (this.live()) {
      this.lastResult.set('hit');
      const stale = this.isStale();
      this.append(
        stale
          ? `HIT (0ms) — הוגש מ-cache: Open=${this.cache()!.open} (אבל ב-DB כבר ${this.dbOpen()} — stale!)`
          : `HIT (0ms) — הוגש מ-cache: Open=${this.cache()!.open}, בלי לגעת ב-DB`,
        stale ? 'stale' : 'hit',
      );
      return;
    }

    // MISS: רצים ל-DB (סימולציה של אגרגציה), ואז שומרים ל-cache ל-15 שניות.
    this.lastResult.set('miss');
    this.loading.set(true);
    this.append('MISS — אין cache בתוקף, מריץ אגרגציה ב-DB…', 'miss');
    setTimeout(() => {
      this.cache.set({ open: this.dbOpen(), storedAt: Date.now() });
      this.loading.set(false);
      this.append(`נשמר ל-cache: Open=${this.dbOpen()}, תקף ל-15s`, 'miss');
    }, 600);
  }

  protected createIssue(): void {
    this.dbOpen.update((n) => n + 1);
    if (this.evictOnWrite()) {
      this.cache.set(null);
      this.append(`issue נוצר → EvictByTag("stats-1") → cache נוקה (ה-GET הבא = MISS)`, 'evict');
    } else {
      this.append(`issue נוצר, אבל evict כבוי → ה-cache נשאר ישן (stale risk)`, 'stale');
    }
  }

  private append(text: string, kind: string): void {
    this.log.update((lines) => [{ id: ++this.logId, text, kind }, ...lines].slice(0, 6));
  }
}
// #endregion
