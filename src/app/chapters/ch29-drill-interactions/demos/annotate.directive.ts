import {
  DestroyRef,
  Directive,
  ElementRef,
  effect,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { Point } from './draggable.directive';

interface Stroke {
  color: string;
  tool: 'pen' | 'marker';
  pts: Point[];
}

/**
 * appAnnotate — draw a pen/marker layer ON TOP OF any element (an issue card, a
 * note, anything), without touching that element's own markup.
 *
 * The mental model is "an overlay you toggle on and off":
 *   1. make the host a positioning context (`position: relative`),
 *   2. inject a <canvas> over it (`position: absolute; inset: 0`), sized to the
 *      host with a ResizeObserver so it always matches,
 *   3. the SAME pointer state machine paints strokes (pen = opaque, marker =
 *      translucent highlighter — perfect for marking up text on a card),
 *   4. toggle `pointer-events`: when the tool is 'off' the overlay is
 *      transparent to clicks so the host stays fully interactive; when 'pen'/
 *      'marker' the overlay captures the pointer so you can draw.
 * Strokes are stored as point arrays and re-drawn on resize. Reusable on ANY
 * element because it's a directive, not a bespoke component.
 */
@Directive({
  selector: '[appAnnotate]',
  exportAs: 'appAnnotate',
})
export class AnnotateDirective implements OnInit {
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly tool = input<'pen' | 'marker' | 'off'>('off');
  readonly color = input('#e8590c');

  /** exposed so a parent can show "has annotations" state if it wants */
  readonly hasInk = signal(false);

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private drawing = false;
  private strokes: Stroke[] = [];
  private current: Stroke | null = null;

  constructor() {
    // The overlay only intercepts pointers while a drawing tool is selected;
    // otherwise it is click-through so the host element works normally.
    effect(() => {
      const t = this.tool();
      if (this.canvas) {
        this.canvas.style.pointerEvents = t === 'off' ? 'none' : 'auto';
        this.canvas.style.cursor = t === 'off' ? 'default' : 'crosshair';
      }
    });
  }

  ngOnInit(): void {
    const host = this.hostRef.nativeElement;
    if (getComputedStyle(host).position === 'static') {
      host.style.position = 'relative';
    }

    const cv = document.createElement('canvas');
    Object.assign(cv.style, {
      position: 'absolute',
      inset: '0',
      borderRadius: 'inherit',
      touchAction: 'none',
      pointerEvents: this.tool() === 'off' ? 'none' : 'auto',
    });
    host.appendChild(cv);
    this.canvas = cv;
    this.ctx = cv.getContext('2d');

    cv.addEventListener('pointerdown', this.onDown);
    cv.addEventListener('pointermove', this.onMove);
    cv.addEventListener('pointerup', this.onUp);

    const ro = new ResizeObserver(() => this.fit());
    ro.observe(host);
    this.fit();

    this.destroyRef.onDestroy(() => {
      ro.disconnect();
      cv.removeEventListener('pointerdown', this.onDown);
      cv.removeEventListener('pointermove', this.onMove);
      cv.removeEventListener('pointerup', this.onUp);
      cv.remove();
    });
  }

  clear(): void {
    this.strokes = [];
    this.hasInk.set(false);
    this.redraw();
  }

  private fit(): void {
    const cv = this.canvas;
    if (!cv) return;
    const r = this.hostRef.nativeElement.getBoundingClientRect();
    if (!r.width || !r.height) return;
    cv.width = r.width;
    cv.height = r.height;
    this.redraw();
  }

  private readonly onDown = (e: PointerEvent): void => {
    const tool = this.tool();
    if (tool === 'off' || !this.ctx) return;
    try {
      this.canvas!.setPointerCapture(e.pointerId);
    } catch {
      /* best-effort capture */
    }
    this.drawing = true;
    const p = this.local(e);
    this.current = { color: this.color(), tool, pts: [p] };
    this.applyTool(tool, this.color());
    this.ctx.beginPath();
    this.ctx.moveTo(p.x, p.y);
    e.preventDefault();
  };

  private readonly onMove = (e: PointerEvent): void => {
    if (!this.drawing || !this.ctx || !this.current) return;
    const p = this.local(e);
    this.current.pts.push(p);
    this.ctx.lineTo(p.x, p.y);
    this.ctx.stroke();
  };

  private readonly onUp = (e: PointerEvent): void => {
    if (!this.drawing) return;
    this.drawing = false;
    if (this.current) {
      this.strokes.push(this.current);
      this.current = null;
      this.hasInk.set(true);
    }
    try {
      this.canvas!.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  private applyTool(tool: 'pen' | 'marker', color: string): void {
    if (!this.ctx) return;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = color;
    if (tool === 'marker') {
      this.ctx.lineWidth = 16;
      this.ctx.globalAlpha = 0.3;
    } else {
      this.ctx.lineWidth = 2.5;
      this.ctx.globalAlpha = 1;
    }
  }

  private redraw(): void {
    const cv = this.canvas;
    if (!cv || !this.ctx) return;
    this.ctx.clearRect(0, 0, cv.width, cv.height);
    for (const s of this.strokes) {
      this.applyTool(s.tool, s.color);
      this.ctx.beginPath();
      s.pts.forEach((p, i) => (i ? this.ctx!.lineTo(p.x, p.y) : this.ctx!.moveTo(p.x, p.y)));
      this.ctx.stroke();
    }
    this.ctx.globalAlpha = 1;
  }

  private local(e: PointerEvent): Point {
    const r = this.canvas!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
}
