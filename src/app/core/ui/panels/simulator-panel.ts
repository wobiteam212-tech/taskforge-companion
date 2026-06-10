import { Component, computed, input, linkedSignal } from '@angular/core';
import { DemoScenario } from '../../registry/chapter.types';

/**
 * The HTTP simulator (proven in the aspnet playground): a declarative
 * request/response scenario you can click through — "you just wrote this
 * endpoint, here is exactly how it behaves on the wire".
 */
@Component({
  selector: 'simulator-panel',
  templateUrl: './simulator-panel.html',
  styleUrl: './simulator-panel.scss',
})
export class SimulatorPanel {
  readonly scenario = input.required<DemoScenario>();

  /** reset selection whenever the scenario changes */
  protected readonly active = linkedSignal<DemoScenario, number>({
    source: this.scenario,
    computation: () => 0,
  });

  protected readonly request = computed(() => this.scenario().requests[this.active()]);
  protected readonly response = computed(() => this.scenario().responses[this.active()]);

  protected statusClass(status: number): string {
    if (status >= 500) return 'st--5xx';
    if (status >= 400) return 'st--4xx';
    if (status >= 300) return 'st--3xx';
    return 'st--2xx';
  }

  protected methodClass(method: string): string {
    return `m--${method.toLowerCase()}`;
  }
}
