import {
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

export interface Size {
  w: number;
  h: number;
}

/**
 * appResizable — drag-to-resize from the bottom-right corner, again with only
 * pointer events + host binding. Same 3-event machine as the drag directive,
 * but the delta changes width/height instead of position.
 *
 * It self-detects a "corner grab": pointerdown only starts a resize when the
 * pointer is within ~18px of the bottom-right corner, so the same element could
 * also be dragged elsewhere. @HostBinding('style.width.px'/'style.height.px')
 * writes the size; a min clamp stops it collapsing. Emits the live size so a
 * parent can show a readout. CSS `resize: both` is the zero-JS alternative —
 * this version exists to show the mechanics you'd reach for when you need full
 * control (custom handles, snapping, persistence).
 */
@Directive({
  selector: '[appResizable]',
})
export class ResizableDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly minSize = input(72);
  readonly resized = output<Size>();

  /** null until the first resize, so the element keeps its CSS-defined size */
  private readonly size = signal<Size | null>(null);
  private readonly active = signal(false);

  private start: { x: number; y: number; w: number; h: number } | null = null;

  @HostBinding('style.width.px')
  get width(): number | null {
    return this.size()?.w ?? null;
  }

  @HostBinding('style.height.px')
  get height(): number | null {
    return this.size()?.h ?? null;
  }

  @HostBinding('class.resizing')
  get isResizing(): boolean {
    return this.active();
  }

  @HostListener('pointerdown', ['$event'])
  onDown(e: PointerEvent): void {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const nearCorner = rect.right - e.clientX < 18 && rect.bottom - e.clientY < 18;
    if (!nearCorner) return;
    this.start = { x: e.clientX, y: e.clientY, w: rect.width, h: rect.height };
    this.active.set(true);
    try {
      this.el.nativeElement.setPointerCapture(e.pointerId);
    } catch {
      /* no active pointer — capture is best-effort */
    }
    e.preventDefault();
  }

  @HostListener('pointermove', ['$event'])
  onMove(e: PointerEvent): void {
    if (!this.start) return;
    const min = this.minSize();
    const next: Size = {
      w: Math.max(min, Math.round(this.start.w + (e.clientX - this.start.x))),
      h: Math.max(min, Math.round(this.start.h + (e.clientY - this.start.y))),
    };
    this.size.set(next);
    this.resized.emit(next);
  }

  @HostListener('pointerup', ['$event'])
  onUp(e: PointerEvent): void {
    if (!this.start) return;
    try {
      this.el.nativeElement.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
    this.start = null;
    this.active.set(false);
  }
}
