import { Component, Type, input, resource } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';

/**
 * Hosts a real, interactive Angular component as a step's visual —
 * lazily imported so demos never weigh on the initial bundle.
 */
@Component({
  selector: 'live-demo-panel',
  imports: [NgComponentOutlet],
  template: `
    <div class="demo">
      <div class="demo-bar">
        <span class="demo-live" aria-hidden="true"></span>
        <span class="demo-label">דמו חי — אפשר (וכדאי) לגעת</span>
      </div>
      <div class="demo-body">
        @if (cmp.value(); as c) {
          <ng-container *ngComponentOutlet="c" />
        } @else {
          <div class="demo-loading">טוען דמו…</div>
        }
      </div>
      @if (caption()) {
        <div class="cap">{{ caption() }}</div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .demo {
      border: 1px solid var(--bdr);
      border-radius: var(--rad);
      background: linear-gradient(145deg, var(--tdim), transparent 38%), var(--sur);
      box-shadow: var(--shadow-1);
    }

    .demo-bar {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 9px 16px;
      border-bottom: 1px solid var(--bdr);

      .demo-live {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: var(--grn);
        box-shadow: 0 0 8px var(--grn);
        animation: pulse 2s ease infinite;
      }

      .demo-label {
        font-size: 12.5px;
        color: var(--txt3);
        font-weight: 600;
      }
    }

    .demo-body {
      padding: 20px;
    }

    .demo-loading {
      color: var(--txt4);
      font-size: 13px;
      text-align: center;
      padding: 26px 0;
      animation: pulse 1.4s ease infinite;
    }

    .cap {
      padding: 10px 16px;
      border-top: 1px dashed var(--bdr2);
      color: var(--txt3);
      font-size: 13px;
    }
  `,
})
export class LiveDemoPanel {
  readonly load = input.required<() => Promise<Type<unknown>>>();
  readonly caption = input<string>();

  protected readonly cmp = resource({
    params: () => this.load(),
    loader: ({ params }) => params(),
  });
}
