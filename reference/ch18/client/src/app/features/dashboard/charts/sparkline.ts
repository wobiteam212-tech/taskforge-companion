import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// #region step-18.18
// sparkline ביד: ממפים סדרת מספרים ל-polyline. x מתפרס שווה על הרוחב,
// y הפוך (SVG y יורד כלפי מטה, אז גובה גדול = y קטן). קו אחד, אפס תלויות.
@Component({
  selector: 'tf-sparkline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 200 60" preserveAspectRatio="none" role="img" [attr.aria-label]="ariaLabel()" class="spark">
      @if (points(); as pts) {
        <polyline [attr.points]="area()" class="spark-area" />
        <polyline [attr.points]="pts" class="spark-line" />
      }
    </svg>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .spark {
        display: block;
        width: 100%;
        height: 88px;
      }
      .spark-line {
        fill: none;
        stroke: var(--accent);
        stroke-width: 2;
        stroke-linejoin: round;
        stroke-linecap: round;
        vector-effect: non-scaling-stroke;
      }
      .spark-area {
        fill: var(--accent-subtle, color-mix(in srgb, var(--accent) 15%, transparent));
        stroke: none;
      }
    `,
  ],
})
export class Sparkline {
  readonly values = input.required<number[]>();

  private readonly width = 200;
  private readonly height = 60;
  private readonly pad = 4;

  // מיפוי ערך → נקודת SVG. ערך מקסימלי נוגע בקצה העליון (pad), אפס בתחתית.
  private readonly coords = computed(() => {
    const values = this.values();
    if (values.length === 0) return [];
    const max = Math.max(1, ...values);
    const innerW = this.width;
    const innerH = this.height - this.pad * 2;
    const step = values.length > 1 ? innerW / (values.length - 1) : 0;
    return values.map((v, i) => ({
      x: i * step,
      y: this.pad + innerH - (v / max) * innerH,
    }));
  });

  protected readonly points = computed(() =>
    this.coords()
      .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(' '),
  );

  // אותה צורה, אבל סגורה לתחתית — מילוי עדין מתחת לקו
  protected readonly area = computed(() => {
    const c = this.coords();
    if (!c.length) return '';
    const first = `0,${this.height}`;
    const last = `${c[c.length - 1].x.toFixed(1)},${this.height}`;
    return `${first} ${this.points()} ${last}`;
  });

  protected readonly ariaLabel = computed(() => {
    const v = this.values();
    return `מגמת issues שנוצרו לאורך ${v.length} ימים, סך הכול ${v.reduce((a, b) => a + b, 0)}`;
  });
}
// #endregion
