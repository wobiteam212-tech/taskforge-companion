import { Component, computed, signal } from '@angular/core';

interface RawStats {
  open: number;
  inProgress: number;
  done: number;
  priority: number[]; // [low, medium, high, critical]
  trend: number[]; // issues created per day
}

interface Slice {
  label: string;
  value: number;
  color: string;
  dasharray: string;
  dashoffset: number;
}

interface Bar {
  label: string;
  value: number;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const STATUS_COLORS = ['#ff8a3d', '#3da5ff', '#4ade80'];
const PRIORITY_COLORS = ['#d9c7a8', '#e0a36a', '#e07a3d', '#d8442f'];
const PRIORITY_LABELS = ['Low', 'Medium', 'High', 'Critical'];

function rand(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

/**
 * דמו: דשבורד-מוקטן בלי שרת. כפתור "רענן נתונים" מגריל RawStats חדש;
 * אותם selectors נגזרים (computed) מעצבים אותו ל-donut/bar/sparkline ביד.
 * זה בדיוק ה-pipeline של פרק 18: נתונים גולמיים → מודל-תצוגה → SVG.
 */
@Component({
  selector: 'demo-dashboard',
  template: `
    <div class="dd">
      <div class="dd-bar">
        <button type="button" class="dd-btn" (click)="regenerate()">Refresh data</button>
        <span class="dd-total">{{ total() }} issues total</span>
      </div>

      <div class="dd-grid">
        <figure class="dd-tile">
          <figcaption>By status</figcaption>
          <svg viewBox="0 0 120 120" class="dd-donut" role="img" aria-label="Status distribution">
            @for (s of statusSlices(); track s.label) {
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                [attr.stroke]="s.color"
                stroke-width="16"
                [attr.stroke-dasharray]="s.dasharray"
                [attr.stroke-dashoffset]="s.dashoffset"
                transform="rotate(-90 60 60)"
              />
            }
            <text x="60" y="64" text-anchor="middle" class="dd-donut-total">{{ total() }}</text>
          </svg>
        </figure>

        <figure class="dd-tile">
          <figcaption>By priority</figcaption>
          <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" class="dd-bars" role="img" aria-label="Priority distribution">
            @for (b of priorityBars(); track b.label) {
              <rect [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.w" [attr.height]="b.h" [attr.fill]="b.color" rx="3" />
              <text [attr.x]="b.x + b.w / 2" y="112" text-anchor="middle" class="dd-bar-label">{{ b.label }}</text>
            }
          </svg>
        </figure>

        <figure class="dd-tile">
          <figcaption>Creation trend</figcaption>
          <svg viewBox="0 0 200 60" preserveAspectRatio="none" class="dd-spark" role="img" aria-label="Creation trend">
            <polyline [attr.points]="sparkPoints()" />
          </svg>
        </figure>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        direction: ltr;
      }
      .dd {
        display: grid;
        gap: var(--sp-3);
      }
      .dd-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--sp-3);
      }
      .dd-btn {
        padding: var(--sp-1) var(--sp-3);
        border: 1px solid var(--accent, #ff8a3d);
        border-radius: var(--rad-sm);
        background: var(--accent-subtle, color-mix(in srgb, #ff8a3d 15%, transparent));
        color: var(--txt1);
        cursor: pointer;
        font-size: var(--fs-small);
      }
      .dd-total {
        font-size: var(--fs-small);
        color: var(--txt2);
      }
      .dd-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--sp-3);
        align-items: start;
      }
      .dd-tile {
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: var(--sp-2);
        padding: var(--sp-3);
        border: 1px solid var(--bdr);
        border-radius: var(--rad);
        background: var(--sur);
        overflow: hidden;
      }
      figcaption {
        font-size: var(--fs-small);
        color: var(--txt2);
        text-transform: uppercase;
      }
      .dd-donut {
        display: block;
        width: 120px;
        height: 120px;
        max-width: 100%;
        margin-inline: auto;
      }
      circle {
        transition: stroke-dasharray var(--dur-3, 240ms) var(--ease-out, ease);
      }
      .dd-donut-total {
        font-size: 26px;
        font-weight: 700;
        fill: var(--txt1);
      }
      .dd-bars {
        display: block;
        width: 100%;
        height: 130px;
      }
      rect {
        transition: height var(--dur-3, 240ms) var(--ease-out, ease), y var(--dur-3, 240ms) var(--ease-out, ease);
      }
      .dd-bar-label {
        font-size: 10px;
        fill: var(--txt3);
      }
      .dd-spark {
        display: block;
        width: 100%;
        height: 70px;
      }
      .dd-spark polyline {
        fill: none;
        stroke: var(--accent, #ff8a3d);
        stroke-width: 2;
        vector-effect: non-scaling-stroke;
      }
      @media (prefers-reduced-motion: reduce) {
        circle,
        rect {
          transition: none;
        }
      }
    `,
  ],
})
export class DashboardDemo {
  protected readonly stats = signal<RawStats>({
    open: 8,
    inProgress: 5,
    done: 11,
    priority: [6, 9, 5, 4],
    trend: [2, 4, 3, 6, 5, 8, 6, 9],
  });

  private readonly circumference = 2 * Math.PI * 50;

  protected readonly total = computed(() => {
    const s = this.stats();
    return s.open + s.inProgress + s.done;
  });

  // selector נגזר #1: ערכי סטטוס → פרוסות donut (dasharray + offset)
  protected readonly statusSlices = computed<Slice[]>(() => {
    const s = this.stats();
    const values = [
      { label: 'Open', value: s.open, color: STATUS_COLORS[0] },
      { label: 'In progress', value: s.inProgress, color: STATUS_COLORS[1] },
      { label: 'Done', value: s.done, color: STATUS_COLORS[2] },
    ];
    const total = this.total() || 1;
    let acc = 0;
    return values.map((v) => {
      const frac = v.value / total;
      const slice: Slice = {
        ...v,
        dasharray: `${frac * this.circumference} ${this.circumference}`,
        dashoffset: -acc * this.circumference,
      };
      acc += frac;
      return slice;
    });
  });

  // selector נגזר #2: ערכי עדיפות → עמודות (גובה ביחס למקסימום)
  protected readonly priorityBars = computed<Bar[]>(() => {
    const p = this.stats().priority;
    const max = Math.max(1, ...p);
    const slot = 190 / p.length;
    return p.map((value, i) => {
      const h = (value / max) * 80;
      return {
        label: PRIORITY_LABELS[i],
        value,
        color: PRIORITY_COLORS[i],
        x: 10 + i * slot,
        y: 96 - h,
        w: slot - 10,
        h,
      };
    });
  });

  // selector נגזר #3: סדרת מגמה → נקודות polyline
  protected readonly sparkPoints = computed(() => {
    const t = this.stats().trend;
    const max = Math.max(1, ...t);
    const step = t.length > 1 ? 200 / (t.length - 1) : 0;
    return t.map((v, i) => `${(i * step).toFixed(1)},${(56 - (v / max) * 52).toFixed(1)}`).join(' ');
  });

  protected regenerate(): void {
    this.stats.set({
      open: rand(2, 14),
      inProgress: rand(2, 14),
      done: rand(2, 14),
      priority: [rand(1, 12), rand(1, 12), rand(1, 12), rand(1, 12)],
      trend: Array.from({ length: 8 }, () => rand(1, 10)),
    });
  }
}
