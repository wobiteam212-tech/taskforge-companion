import { Component, computed, signal } from '@angular/core';

/**
 * Container queries, felt: a fake project card inside a container whose
 * width YOU control. The card reflows at @container (min-width: 340px) —
 * the viewport never changes, only the container does.
 */
@Component({
  selector: 'demo-cq',
  templateUrl: './cq.demo.html',
  styleUrl: './cq.demo.scss',
})
export class CqDemo {
  protected readonly width = signal(560);

  protected readonly wide = computed(() => this.width() >= 340);

  protected onInput(event: Event): void {
    this.width.set(Number((event.target as HTMLInputElement).value));
  }
}
