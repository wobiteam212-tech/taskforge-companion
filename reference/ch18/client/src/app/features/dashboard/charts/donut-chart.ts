import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChartSlice } from '../../../core/state/dashboard.store';

interface Segment {
  label: string;
  value: number;
  color: string;
  dasharray: string;
  dashoffset: number;
}

// #region step-18.16
// גרף טבעת ביד: כל פרוסה היא אותו <circle>, אבל stroke-dasharray חושף רק
// קשת באורך (value/total) מההיקף, ו-stroke-dashoffset מסובב אותה למקומה.
// rotate(-90) מתחיל מלמעלה. role="img" + aria-label נותנים חלופה טקסטואלית.
@Component({
  selector: 'tf-donut-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 120 120" role="img" [attr.aria-label]="ariaLabel()" class="donut">
      @for (seg of segments(); track seg.label) {
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          [attr.stroke]="seg.color"
          stroke-width="16"
          [attr.stroke-dasharray]="seg.dasharray"
          [attr.stroke-dashoffset]="seg.dashoffset"
          transform="rotate(-90 60 60)"
        />
      }
      <text x="60" y="58" text-anchor="middle" class="donut-total">{{ total() }}</text>
      <text x="60" y="74" text-anchor="middle" class="donut-cap">issues</text>
    </svg>
  `,
  styles: [
    `
      :host {
        display: grid;
        place-items: center;
        width: 100%;
        height: 100%;
      }
      .donut {
        display: block;
        width: 140px;
        height: 140px;
        max-width: 100%;
      }
      circle {
        transition: stroke-dasharray var(--dur-3, 240ms) var(--ease-out, ease);
      }
      .donut-total {
        font-size: 26px;
        font-weight: 700;
        fill: var(--txt1);
      }
      .donut-cap {
        font-size: 10px;
        fill: var(--txt3);
        text-transform: uppercase;
      }
      @media (prefers-reduced-motion: reduce) {
        circle {
          transition: none;
        }
      }
    `,
  ],
})
export class DonutChart {
  readonly slices = input.required<ChartSlice[]>();

  private readonly circumference = 2 * Math.PI * 50;

  protected readonly total = computed(() => this.slices().reduce((sum, s) => sum + s.value, 0));

  protected readonly segments = computed<Segment[]>(() => {
    const total = this.total() || 1;
    let acc = 0;
    return this.slices().map((s) => {
      const fraction = s.value / total;
      const seg: Segment = {
        label: s.label,
        value: s.value,
        color: s.color,
        dasharray: `${fraction * this.circumference} ${this.circumference}`,
        dashoffset: -acc * this.circumference,
      };
      acc += fraction;
      return seg;
    });
  });

  protected readonly ariaLabel = computed(
    () => 'התפלגות לפי סטטוס — ' + this.slices().map((s) => `${s.label}: ${s.value}`).join(', '),
  );
}
// #endregion
