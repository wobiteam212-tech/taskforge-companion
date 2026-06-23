import {
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

export interface Point {
  x: number;
  y: number;
}

/**
 * appDraggable — free-position drag with nothing but pointer events.
 *
 * The whole interaction is one 3-event state machine, expressed declaratively
 * through host binding:
 *   - @HostListener('pointerdown') captures the start point + the pointer
 *     (setPointerCapture, so moves OUTSIDE the element still reach us).
 *   - @HostListener('pointermove') applies the delta to a `pos` signal.
 *   - @HostListener('pointerup') releases the capture and commits.
 *
 * @HostBinding writes the result back to the host: the transform (move via
 * `translate`, not top/left, so no layout reflow) and a `.dragging` class.
 * Arrow keys give a keyboard-equivalent path (a11y). Angular auto-removes every
 * listener on destroy — no manual addEventListener / cleanup.
 */
@Directive({
  selector: '[appDraggable]',
})
export class DraggableDirective implements OnInit {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  /** initial position; the directive owns it from here on */
  readonly appDraggable = input<Point>({ x: 0, y: 0 });
  readonly dragEnd = output<Point>();

  private readonly pos = signal<Point>({ x: 0, y: 0 });
  private readonly dragging = signal(false);

  private startPointer: Point | null = null;
  private origin: Point = { x: 0, y: 0 };

  ngOnInit(): void {
    this.pos.set(this.appDraggable());
  }

  // ---- host bindings: the directive writes to its own element ----
  @HostBinding('style.transform')
  get transform(): string {
    const p = this.pos();
    return `translate(${p.x}px, ${p.y}px)`;
  }

  @HostBinding('class.dragging')
  get isDragging(): boolean {
    return this.dragging();
  }

  @HostBinding('attr.tabindex') readonly tabindex = 0;
  @HostBinding('attr.role') readonly role = 'button';

  // ---- pointer state machine ----
  @HostListener('pointerdown', ['$event'])
  onDown(e: PointerEvent): void {
    this.startPointer = { x: e.clientX, y: e.clientY };
    this.origin = this.pos();
    this.dragging.set(true);
    try {
      this.el.nativeElement.setPointerCapture(e.pointerId);
    } catch {
      /* no active pointer (e.g. synthetic event) — capture is best-effort */
    }
    this.el.nativeElement.focus();
    e.preventDefault();
  }

  @HostListener('pointermove', ['$event'])
  onMove(e: PointerEvent): void {
    if (!this.startPointer) return;
    this.pos.set({
      x: this.origin.x + (e.clientX - this.startPointer.x),
      y: this.origin.y + (e.clientY - this.startPointer.y),
    });
  }

  @HostListener('pointerup', ['$event'])
  onUp(e: PointerEvent): void {
    if (!this.startPointer) return;
    try {
      this.el.nativeElement.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
    this.startPointer = null;
    this.dragging.set(false);
    this.dragEnd.emit(this.pos());
  }

  // ---- keyboard-equivalent path (accessibility) ----
  @HostListener('keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    const step = e.shiftKey ? 12 : 3;
    const delta: Record<string, Point> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };
    const d = delta[e.key];
    if (!d) return;
    e.preventDefault();
    this.pos.update((p) => ({ x: p.x + d.x, y: p.y + d.y }));
    this.dragEnd.emit(this.pos());
  }
}
