import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChartSlice } from '../../../core/state/dashboard.store';

interface Bar {
  label: string;
  value: number;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// #region step-18.17
// גרף עמודות ביד: ממפים value → גובה ביחס לערך המקסימלי. כל עמודה היא <rect>
// עם x מחושב לפי האינדקס. הקואורדינטות הן ה-data→SVG mapping שהפרק מלמד.
@Component({
  selector: 'tf-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 200 120"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      [attr.aria-label]="ariaLabel()"
      class="bars"
    >
      @for (bar of bars(); track bar.label) {
        <rect
          [attr.x]="bar.x"
          [attr.y]="bar.y"
          [attr.width]="bar.width"
          [attr.height]="bar.height"
          [attr.fill]="bar.color"
          rx="3"
        />
        <text [attr.x]="bar.x + bar.width / 2" y="112" text-anchor="middle" class="bar-label">
          {{ bar.label }}
        </text>
        <text [attr.x]="bar.x + bar.width / 2" [attr.y]="bar.y - 4" text-anchor="middle" class="bar-value">
          {{ bar.value }}
        </text>
      }
    </svg>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .bars {
        display: block;
        width: 100%;
        height: 150px;
      }
      rect {
        transition: height var(--dur-3, 240ms) var(--ease-out, ease),
          y var(--dur-3, 240ms) var(--ease-out, ease);
      }
      .bar-label {
        font-size: 9px;
        fill: var(--txt3);
      }
      .bar-value {
        font-size: 10px;
        font-weight: 600;
        fill: var(--txt2);
      }
      @media (prefers-reduced-motion: reduce) {
        rect {
          transition: none;
        }
      }
    `,
  ],
})
export class BarChart {
  readonly slices = input.required<ChartSlice[]>();

  // אזור הציור: רוחב 200, גובה 120, עם שוליים לתוויות ולערכים
  private readonly chartTop = 16;
  private readonly chartBottom = 96;
  private readonly gap = 10;

  protected readonly bars = computed<Bar[]>(() => {
    const slices = this.slices();
    if (!slices.length) return [];
    const max = Math.max(1, ...slices.map((s) => s.value));
    const span = this.chartBottom - this.chartTop;
    const slot = (200 - this.gap) / slices.length;
    const width = slot - this.gap;

    return slices.map((s, i) => {
      const height = (s.value / max) * span;
      return {
        label: s.label,
        value: s.value,
        color: s.color,
        x: this.gap + i * slot,
        y: this.chartBottom - height,
        width,
        height,
      };
    });
  });

  protected readonly ariaLabel = computed(
    () => 'התפלגות לפי עדיפות — ' + this.slices().map((s) => `${s.label}: ${s.value}`).join(', '),
  );
}
// #endregion
