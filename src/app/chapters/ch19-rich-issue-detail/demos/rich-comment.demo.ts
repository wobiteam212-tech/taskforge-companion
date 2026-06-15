import { Component, DestroyRef, computed, inject, signal } from '@angular/core';

interface DemoComment {
  id: number;
  author: string;
  body: string;
  pending: boolean;
}

const MEMBERS = ['Maya Levi', 'Demo User', 'Dana Cohen'];
const ESCAPE: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// אותו renderer בטוח של הפרק, בגרסה עצמאית: escape קודם, ואז תגיות בטוחות.
function render(src: string): string {
  let html = src.replace(/[&<>"']/g, (c) => ESCAPE[c]);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/(^|\s)@([\w.-]+)/g, '$1<span class="mention">@$2</span>');
  return html.replace(/\n/g, '<br>');
}

/**
 * דמו: תיבת תגובה עשירה בלי שרת. תצוגה מקדימה של Markdown (בטוח), השלמת
 * ‎@mention, ופרסום אופטימי עם חלון Undo + מתג "שבור את השרת" שמדגים rollback.
 * כל הטיימרים מנוקים ב-DestroyRef.
 */
@Component({
  selector: 'demo-rich-comment',
  template: `
    <div class="rc">
      <div class="rc-list">
        @for (c of comments(); track c.id) {
          <div class="rc-item" [class.pending]="c.pending">
            <strong>{{ c.author }}</strong>
            <span class="rc-body" [innerHTML]="renderBody(c.body)"></span>
          </div>
        } @empty {
          <p class="rc-empty">אין תגובות עדיין.</p>
        }
      </div>

      @if (pending()) {
        <div class="rc-undo" role="status">
          <span>התגובה נשלחת…</span>
          <button type="button" (click)="undo()">בטל</button>
        </div>
      }

      <div class="rc-editor">
        <div class="rc-tabs">
          <button type="button" [class.on]="!preview()" (click)="preview.set(false)">כתיבה</button>
          <button type="button" [class.on]="preview()" (click)="preview.set(true)">תצוגה מקדימה</button>
        </div>

        @if (!preview()) {
          <div class="rc-input">
            <textarea
              #ta
              rows="2"
              [value]="draft()"
              placeholder="‎**מודגש**, &#96;קוד&#96;, או ‎@ להזכרה"
              (input)="onInput($event)"
              (keydown)="onKey($event)"
            ></textarea>
            @if (matches().length) {
              <ul class="rc-mentions">
                @for (m of matches(); track m; let i = $index) {
                  <li [class.active]="i === active()" (mousedown)="$event.preventDefault(); choose(m)">{{ m }}</li>
                }
              </ul>
            }
          </div>
        } @else {
          <div class="rc-preview" [innerHTML]="renderBody(draft() || '_כלום עדיין_')"></div>
        }

        <div class="rc-actions">
          <label class="rc-break">
            <input type="checkbox" [checked]="breakServer()" (change)="breakServer.set($any($event.target).checked)" />
            שבור את השרת
          </label>
          <button type="button" class="rc-post" [disabled]="!draft().trim()" (click)="post()">פרסם</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .rc { display: grid; gap: var(--sp-3); }
      .rc-list { display: grid; gap: var(--sp-2); }
      .rc-item {
        display: grid; gap: 2px; padding: var(--sp-2) var(--sp-3);
        border: 1px solid var(--bdr); border-radius: var(--rad-sm); background: var(--sur2);
      }
      .rc-item.pending { opacity: 0.6; border-style: dashed; }
      .rc-item strong { font-size: var(--fs-small); color: var(--txt1); }
      .rc-body { color: var(--txt2); }
      .rc-body code { background: var(--sur3); padding: 0 4px; border-radius: 4px; font-family: ui-monospace, monospace; }
      .rc-body .mention { color: var(--accent); font-weight: var(--fw-semibold); }
      .rc-empty { color: var(--txt3); margin: 0; }
      .rc-undo {
        display: flex; align-items: center; justify-content: space-between; gap: var(--sp-2);
        padding: var(--sp-1) var(--sp-3); border: 1px solid var(--accent); border-radius: var(--rad-sm);
        background: var(--accent-subtle); font-size: var(--fs-small);
      }
      .rc-undo button { border: 0; background: transparent; color: var(--accent); font-weight: 600; cursor: pointer; }
      .rc-editor { border: 1px solid var(--bdr); border-radius: var(--rad-sm); background: var(--sur); overflow: clip; }
      .rc-tabs { display: flex; gap: var(--sp-1); padding: var(--sp-1); border-block-end: 1px solid var(--bdr); background: var(--sur2); }
      .rc-tabs button { padding: 2px var(--sp-3); border: 1px solid transparent; border-radius: var(--rad-sm); background: transparent; color: var(--txt2); font-size: var(--fs-small); cursor: pointer; }
      .rc-tabs button.on { background: var(--sur); border-color: var(--bdr); color: var(--txt1); }
      .rc-input { position: relative; }
      textarea { display: block; width: 100%; border: 0; background: var(--sur); color: var(--txt1); padding: var(--sp-2) var(--sp-3); font: inherit; resize: vertical; }
      textarea:focus-visible { outline: none; box-shadow: inset 0 0 0 2px var(--accent); }
      .rc-mentions {
        position: absolute; inset-inline-start: var(--sp-3); inset-block-start: 100%; z-index: 5;
        min-width: 160px; margin: 0; padding: var(--sp-1); list-style: none; background: var(--sur);
        border: 1px solid var(--bdr2); border-radius: var(--rad-sm); box-shadow: var(--shadow-3);
      }
      .rc-mentions li { padding: 2px var(--sp-2); border-radius: var(--rad-sm); font-size: var(--fs-small); color: var(--txt2); cursor: pointer; }
      .rc-mentions li.active, .rc-mentions li:hover { background: var(--accent-subtle); color: var(--txt1); }
      .rc-preview { padding: var(--sp-2) var(--sp-3); color: var(--txt1); min-height: 2.5rem; }
      .rc-actions { display: flex; align-items: center; justify-content: space-between; gap: var(--sp-2); padding: var(--sp-2) var(--sp-3); border-block-start: 1px solid var(--bdr); }
      .rc-break { display: inline-flex; align-items: center; gap: var(--sp-1); font-size: var(--fs-small); color: var(--txt2); }
      .rc-post { padding: var(--sp-1) var(--sp-3); border: 1px solid var(--accent); border-radius: var(--rad-sm); background: var(--accent-subtle); color: var(--txt1); cursor: pointer; }
      .rc-post:disabled { opacity: 0.5; cursor: not-allowed; }
    `,
  ],
})
export class RichCommentDemo {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly comments = signal<DemoComment[]>([
    { id: 1, author: 'Maya Levi', body: 'הבעיה היא ב-**guard** שרץ לפני שחזור הטוקן.', pending: false },
  ]);
  protected readonly draft = signal('');
  protected readonly preview = signal(false);
  protected readonly breakServer = signal(false);
  protected readonly pending = signal<DemoComment | null>(null);
  protected readonly mentionQuery = signal<string | null>(null);
  protected readonly active = signal(0);

  private nextId = 2;
  private undoTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.undoTimer));
  }

  protected readonly matches = computed<string[]>(() => {
    const q = this.mentionQuery();
    if (q === null) return [];
    return MEMBERS.filter((m) => m.toLowerCase().includes(q.toLowerCase())).slice(0, 4);
  });

  protected renderBody(body: string): string {
    return render(body);
  }

  protected onInput(event: Event): void {
    const ta = event.target as HTMLTextAreaElement;
    this.draft.set(ta.value);
    const before = ta.value.slice(0, ta.selectionStart ?? ta.value.length);
    const m = /@([\w.-]*)$/.exec(before);
    this.mentionQuery.set(m ? m[1] : null);
    this.active.set(0);
  }

  protected onKey(event: KeyboardEvent): void {
    const m = this.matches();
    if (!m.length) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); this.active.update((i) => (i + 1) % m.length); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); this.active.update((i) => (i - 1 + m.length) % m.length); }
    else if (event.key === 'Enter' || event.key === 'Tab') { event.preventDefault(); this.choose(m[this.active()]); }
    else if (event.key === 'Escape') { this.mentionQuery.set(null); }
  }

  protected choose(name: string): void {
    this.draft.update((d) => d.replace(/@([\w.-]*)$/, `@${name} `));
    this.mentionQuery.set(null);
  }

  protected post(): void {
    const body = this.draft().trim();
    if (!body) return;
    clearTimeout(this.undoTimer);
    const temp: DemoComment = { id: this.nextId++, author: 'Demo User', body, pending: true };
    this.pending.set(temp);
    this.comments.update((list) => [...list, temp]);
    this.draft.set('');

    this.undoTimer = setTimeout(() => {
      if (this.breakServer()) {
        // השרת נכשל — מסירים את הזמנית (rollback)
        this.comments.update((list) => list.filter((c) => c !== temp));
      } else {
        this.comments.update((list) => list.map((c) => (c === temp ? { ...c, pending: false } : c)));
      }
      this.pending.set(null);
    }, 2500);
  }

  protected undo(): void {
    clearTimeout(this.undoTimer);
    const temp = this.pending();
    if (temp) this.comments.update((list) => list.filter((c) => c !== temp));
    this.pending.set(null);
  }
}
