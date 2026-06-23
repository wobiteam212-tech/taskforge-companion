import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { AnnotateDirective } from './annotate.directive';
import { DraggableDirective, Point } from './draggable.directive';
import { ResizableDirective, Size } from './resizable.directive';

interface Note {
  id: number;
  title: string;
  color: string;
  pos: Point;
}

type Tool = 'pen' | 'marker' | 'off';

interface Stroke {
  color: string;
  tool: 'pen' | 'marker';
  pts: Point[];
}

const NOTES: Note[] = [
  { id: 1, title: 'Spike: auth refresh', color: '#e8590c', pos: { x: 6, y: 6 } },
  { id: 2, title: 'Fix board drift', color: '#1c7ed6', pos: { x: 132, y: 58 } },
  { id: 3, title: 'Ship the drill', color: '#2f9e44', pos: { x: 52, y: 128 } },
];

/**
 * Demo for ch29 — three direct-manipulation interactions, all from the same
 * pointer state machine, all without @angular/cdk:
 *   1. Drag: sticky notes positioned by `appDraggable` (transform + host bind).
 *   2. Draw: a <canvas> with a pen (thin/opaque) and a marker (thick/translucent
 *      highlighter) — pointerdown/move/up paint a stroke; strokes are kept as
 *      point arrays (with their tool) and re-drawn on resize (ResizeObserver),
 *      so they survive the canvas being re-sized (resizing a canvas clears it).
 *   3. Resize: an `appResizable` box reports its live size.
 * Listeners are auto-removed by Angular (@HostListener / template bindings);
 * the ResizeObserver is disconnected in DestroyRef.
 */
@Component({
  selector: 'demo-interactions',
  imports: [DraggableDirective, ResizableDirective, AnnotateDirective],
  templateUrl: './interactions.demo.html',
  styleUrl: './interactions.demo.scss',
})
export class InteractionsDemo implements AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly notes = signal<Note[]>(structuredClone(NOTES));
  protected readonly log = signal<string[]>([]);

  // ---- draw: pen + marker ----
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  protected readonly tool = signal<Tool>('pen');
  protected readonly colors = ['#e8590c', '#1c7ed6', '#2f9e44', '#ae3ec9'];
  protected readonly color = signal(this.colors[0]);

  private ctx: CanvasRenderingContext2D | null = null;
  private drawing = false;
  private strokes: Stroke[] = [];
  private current: Stroke | null = null;

  // ---- resize readout ----
  protected readonly size = signal<Size>({ w: 168, h: 120 });

  // ---- annotate ON a real element (issue card) ----
  protected readonly annTool = signal<Tool>('marker');
  protected readonly annColor = signal(this.colors[0]);
  protected readonly assigned = signal(false);

  protected assign(): void {
    // proves the card stays interactive while the overlay tool is "off"
    this.assigned.update((a) => !a);
  }

  ngAfterViewInit(): void {
    const cv = this.canvasRef()?.nativeElement;
    if (!cv) return;
    this.ctx = cv.getContext('2d');

    // Size the canvas to its box, and re-fit on any resize. Setting width/height
    // clears the bitmap, so we redraw the stored strokes afterwards.
    const ro = new ResizeObserver(() => {
      const r = cv.getBoundingClientRect();
      if (!r.width || !r.height) return;
      cv.width = r.width;
      cv.height = r.height;
      this.redraw();
    });
    ro.observe(cv);
    this.destroyRef.onDestroy(() => ro.disconnect());
  }

  // ---- drag ----
  protected onDragEnd(note: Note, pos: Point): void {
    this.pushLog(`"${note.title}" to (${Math.round(pos.x)}, ${Math.round(pos.y)})`);
  }

  // ---- marker pointer handlers (bound on the canvas in the template) ----
  protected startDraw(e: PointerEvent): void {
    const tool = this.tool();
    if (tool === 'off' || !this.ctx) return;
    const cv = this.canvasRef()!.nativeElement;
    try {
      cv.setPointerCapture(e.pointerId);
    } catch {
      /* no active pointer — capture is best-effort */
    }
    this.drawing = true;
    const p = this.local(e);
    this.current = { color: this.color(), tool, pts: [p] };
    this.applyTool(tool, this.color());
    this.ctx.beginPath();
    this.ctx.moveTo(p.x, p.y);
  }

  protected moveDraw(e: PointerEvent): void {
    if (!this.drawing || !this.ctx || !this.current) return;
    const p = this.local(e);
    this.current.pts.push(p);
    this.ctx.lineTo(p.x, p.y);
    this.ctx.stroke();
  }

  protected endDraw(e: PointerEvent): void {
    if (!this.drawing) return;
    this.drawing = false;
    if (this.current) {
      this.strokes.push(this.current);
      this.current = null;
    }
    try {
      this.canvasRef()!.nativeElement.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
  }

  protected clearCanvas(): void {
    this.strokes = [];
    this.redraw();
  }

  protected onResize(s: Size): void {
    this.size.set(s);
  }

  // ---- canvas helpers ----
  // pen = thin, opaque, precise; marker = thick, translucent highlighter (the
  // translucency means overlapping strokes deepen, like a real highlighter).
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
    const cv = this.canvasRef()?.nativeElement;
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
    const r = this.canvasRef()!.nativeElement.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private pushLog(line: string): void {
    this.log.update((l) => [line, ...l].slice(0, 6));
  }
}
