import { Component, input, signal } from '@angular/core';

/**
 * Content-projection visualizer: a frame component with three slots
 * (select="[icon]", default, select="[actions]"). The demo toggles what the
 * parent provides, and each slot lights up when content actually lands in it —
 * making the "holes in the component" mental model visible.
 */
@Component({
  selector: 'demo-frame',
  template: `
    <div class="slot slot--icon" [class.filled]="hasIcon()">
      <span class="slot-tag ltr">select="[icon]"</span>
      <ng-content select="[icon]" />
    </div>
    <div class="slot slot--body" [class.filled]="hasBody()">
      <span class="slot-tag ltr">ng-content (default)</span>
      <ng-content />
    </div>
    <div class="slot slot--actions" [class.filled]="hasActions()">
      <span class="slot-tag ltr">select="[actions]"</span>
      <ng-content select="[actions]" />
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 10px;
      border: 1px solid var(--bdr);
      border-radius: var(--rad-sm);
      background: var(--sur2);
      padding: 14px;
    }

    .slot {
      position: relative;
      border: 1.5px dashed var(--bdr);
      border-radius: var(--rad-sm);
      padding: 20px 12px 12px;
      min-height: 30px;
      transition: border-color 0.25s ease, background 0.25s ease;

      &.filled {
        border-color: var(--ember);
        background: color-mix(in srgb, var(--ember) 7%, transparent);
      }
    }

    .slot-tag {
      position: absolute;
      top: 4px;
      inset-inline-start: 8px;
      font-family: var(--mono);
      font-size: 10.5px;
      color: var(--txt3);
    }
  `,
})
export class DemoFrame {
  /** set by the demo parent purely to highlight filled slots */
  readonly hasIcon = input(false);
  readonly hasBody = input(false);
  readonly hasActions = input(false);
}

@Component({
  selector: 'demo-projection',
  templateUrl: './projection.demo.html',
  styleUrl: './projection.demo.scss',
  imports: [DemoFrame],
})
export class ProjectionDemo {
  protected readonly withIcon = signal(true);
  protected readonly withBody = signal(true);
  protected readonly withActions = signal(false);

  protected toggle(which: 'icon' | 'body' | 'actions'): void {
    if (which === 'icon') this.withIcon.update((v) => !v);
    if (which === 'body') this.withBody.update((v) => !v);
    if (which === 'actions') this.withActions.update((v) => !v);
  }
}
