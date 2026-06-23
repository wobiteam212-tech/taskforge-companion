import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 29 — אינטראקציות מאפס: DnD · ציור · Resize · Host
 * Wave 7, Interview Drill T3.
 * Demo: InteractionsDemo (`demo-interactions`) — 3 sticky notes (appDraggable),
 * canvas marker (ResizeObserver redraw so strokes survive resize), appResizable box.
 * Built WITHOUT @angular/cdk — pure pointer events, that is the whole point.
 * All verified against the built demo artifacts in demos/.
 */
export const CH29_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------------ 29.1 */
    {
      id: '29.1',
      title: 'הפרק: אינטראקציות ישירות מאפס',
      blocks: [
        {
          kind: 'p',
          text:
            'פרק 17 לימד גרירה בעזרת CDK של Angular. פרק 29 בונה את אותה תחושה — גרירה, ציור וכיווץ — ' +
            'בלי CDK בכלל, רק עם pointer events גולמיים. זה הנושא שהכי הפיל בסימולציית הראיונות: ' +
            '"notes app עם drag-and-drop, ציור/marker על אלמנט, resize, host binding — איך חושבים ובונים."',
        },
        {
          kind: 'p',
          text:
            'הבשורה: כל שלוש הטכניקות הן אותה מכונת-מצבים. ברגע שמפנימים את זה, אפשר לפתח כל אחת ' +
            'מהן בתוך דקות. הדמו החי ממחיש את שלושתן יחד, ללא תלות חיצונית אחת.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה ללמוד מאפס אם CDK קיים?',
          body:
            'CDK מצוין לסידור רשימות עם drop zones ונגישות מובנית (פרק 17). אבל כשצריך מיקום חופשי על קנבס, ' +
            'ציור, resize עם ידית מותאמת, או שליטה מלאה על כל pixel — צריך לדעת את המכנה המשותף. ' +
            'ראיינים בודקים בדיוק את זה: "תבנה בלי library."',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () =>
          import('./demos/interactions.demo').then((m) => m.InteractionsDemo),
        caption:
          'דמו חי: 3 פתקים ניתנים לגרירה (appDraggable), לוח ציור עם marker (ResizeObserver), ' +
          'ותיבה ניתנת לכיווץ (appResizable) — הכול בלי @angular/cdk',
      },
    },

    /* ------------------------------------------------------------------ 29.2 */
    {
      id: '29.2',
      title: 'המודל המנטלי: מכונת-מצבים של 3 אירועים',
      blocks: [
        {
          kind: 'p',
          text:
            'כל אינטראקציה של מניפולציה-ישירה היא אותה מכונת-מצבים של שלושה אירועי pointer: ' +
            'pointerdown תופס נקודת-התחלה ומפעיל setPointerCapture כדי להמשיך לקבל אירועים גם מחוץ לאלמנט. ' +
            'pointermove מחיל את ה-delta. pointerup מבצע commit ומשחרר.',
        },
        {
          kind: 'p',
          text:
            'מה שמשתנה בין הטכניקות הוא רק מה מיישמים ב-move: גרירה מזיזה מיקום (pos), ' +
            'resize משנה גודל (size), ציור מוסיף נקודה (stroke). שאר המבנה זהה לחלוטין — capture, delta, commit.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'איך מתחילים לתכנן אינטראקציה ישירה בראיון?',
          body:
            'משפט הפתיחה: "אני לא מתחיל מ-library. אני שואל: מה משתנה בין down ל-up? מיקום? גודל? קו? ' +
            'זה קובע מה אני כותב ב-move. שאר זהה — capture, delta, commit." ' +
            'מי שמתחיל מהתשובה הזו מראה הבנה ולא שינון.',
        },
        {
          kind: 'term',
          name: 'pointer capture',
          definition:
            'setPointerCapture(pointerId) גורם לכך שכל אירועי pointermove ו-pointerup ישלחו לאלמנט הספציפי ' +
            'גם אם הסמן יצא מגבולותיו. בלעדיו, גרירה מהירה "נופלת" — הסמן יוצא מהאלמנט לפני שמשחררים.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `flowchart LR
  PD["pointerdown\\nsetPointerCapture\\nshStartPoint"] --> PM["pointermove\\napply delta"]
  PM --> PM
  PM --> PU["pointerup\\nreleasePointerCapture\\ncommit"]
  PM -->|"drag"| POS["pos = origin + delta"]
  PM -->|"resize"| SZ["size = start + delta"]
  PM -->|"draw"| STR["stroke.pts.push(p)"]`,
        caption:
          'מכונת-המצבים של שלושת האירועים — שלושה ענפים שונים ב-move, שאר הזהה',
      },
    },

    /* ------------------------------------------------------------------ 29.3 */
    {
      id: '29.3',
      title: 'Talk-track: איך מדברים על זה בראיון',
      blocks: [
        {
          kind: 'p',
          text:
            'בראיון טכני, כשמבקשים לבנות גרירה/ציור/resize, פותחים עם המודל, לא עם קוד. אומרים: ' +
            '"כל מניפולציה ישירה היא שלושה אירועים. אשאל: מה משתנה? ואז אכתוב את ה-move בהתאם."',
        },
        {
          kind: 'ul',
          items: [
            'pointerdown: שמירת נקודת-התחלה + setPointerCapture.',
            'pointermove: חישוב delta + הפעלת הלוגיקה המתאימה (pos / size / stroke).',
            'pointerup: releasePointerCapture + commit.',
            'נגישות: מקלדת מקבילה (חצים לגרירה, idan לcidir) + aria-live להכרזות.',
            'directive: @HostBinding כותב ל-host, @HostListener קורא אירועים ממנו. Angular מנקה לבד ב-destroy.',
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'pointer מול mouse מול touch',
          body:
            'Pointer Events API מאחד עכבר, מגע ועט בממשק אחד: pointerId, pressure, pointerType. ' +
            'אין צורך לרשום נפרד mousedown + touchstart — pointer מטפל בכולם. ' +
            'זו הסיבה לבחור בו על פני mouse events בלבד.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `flowchart TD
  Q["מה משתנה\\nבין down ל-up?"] --> POS["מיקום\\npos signal"]
  Q --> SZ2["גודל\\nsize signal"]
  Q --> STK["קו\\nstrokes array"]
  POS --> DRAG["appDraggable\\ntransform: translate"]
  SZ2 --> RSZD["appResizable\\nwidth.px / height.px"]
  STK --> DRAW["canvas marker\\nctx.lineTo + stroke"]`,
        caption: 'שלוש טכניקות — שאלה אחת מובילה לפיצול הנכון',
      },
    },

    /* ------------------------------------------------------------------ 29.4 */
    {
      id: '29.4',
      title: 'טכניקה 1: Drag — מיקום חופשי עם transform',
      blocks: [
        {
          kind: 'p',
          text:
            'DraggableDirective (`[appDraggable]`) מממשת גרירה חופשית על קנבס. ' +
            'ב-pointerdown שומרים את נקודת-ההתחלה ואת מקור הפתק (origin), וקוראים ל-setPointerCapture. ' +
            'ב-pointermove מחשבים pos = origin + (clientX - startX, clientY - startY) וכותבים ' +
            'ל-transform: translate — לא ל-top/left.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה transform ולא top/left?',
          body:
            'transform רץ על ה-compositor ללא reflow וללא repaint של layout. ' +
            'top/left מחשבים layout מחדש בכל פריים — על אלמנט מחוץ ל-flow זה כפול חישוב. ' +
            'התוצאה: גרירה עם transform חלקה יותר ואינה גורמת ל-jank.',
        },
        {
          kind: 'p',
          text:
            'הנתיב הנגיש: Tab ממקד פתק, חצי מקלדת מזיזים אותו (3px לחץ רגיל, 12px עם Shift), ' +
            'ומתפקדים זהה ל-pointerup — אותו dragEnd output, אותה לוגיקה. ' +
            'מחלקת `.dragging` מרימה z-index וצל.',
        },
        {
          kind: 'term',
          name: 'host binding',
          definition:
            '@HostBinding קושר property או attribute של ה-host element לשדה/getter בתוך ה-directive. ' +
            'כך הdirective "כותב לעצמו" (לאלמנט שעליו הוא מוצמד) בלי נגיעה ישירה ב-DOM. ' +
            '@HostListener קורא אירועים מאותו host; Angular מסיר את המאזינים אוטומטית ב-destroy.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'typescript',
        file: 'src/app/chapters/ch29-drill-interactions/demos/draggable.directive.ts',
        code: `// appDraggable — מכונת-המצבים דרך host binding
@Directive({ selector: '[appDraggable]' })
export class DraggableDirective implements OnInit {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly appDraggable = input<Point>({ x: 0, y: 0 });
  readonly dragEnd = output<Point>();

  private readonly pos = signal<Point>({ x: 0, y: 0 });
  private readonly dragging = signal(false);
  private startPointer: Point | null = null;
  private origin: Point = { x: 0, y: 0 };

  ngOnInit(): void { this.pos.set(this.appDraggable()); }

  @HostBinding('style.transform')
  get transform(): string {
    const p = this.pos();
    return \`translate(\${p.x}px, \${p.y}px)\`;
  }

  @HostBinding('class.dragging')
  get isDragging(): boolean { return this.dragging(); }

  @HostListener('pointerdown', ['$event'])
  onDown(e: PointerEvent): void {
    this.startPointer = { x: e.clientX, y: e.clientY };
    this.origin = this.pos();
    this.dragging.set(true);
    this.el.nativeElement.setPointerCapture(e.pointerId);
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
    this.el.nativeElement.releasePointerCapture(e.pointerId);
    this.startPointer = null;
    this.dragging.set(false);
    this.dragEnd.emit(this.pos());
  }

  // נתיב מקלדת: חצים מזיזים 3px (Shift = 12px)
  @HostListener('keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    const step = e.shiftKey ? 12 : 3;
    const deltas: Record<string, Point> = {
      ArrowLeft: { x: -step, y: 0 }, ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },  ArrowDown: { x: 0, y: step },
    };
    const d = deltas[e.key];
    if (!d) return;
    e.preventDefault();
    this.pos.update((p) => ({ x: p.x + d.x, y: p.y + d.y }));
    this.dragEnd.emit(this.pos());
  }
}`,
      },
    },

    /* ------------------------------------------------------------------ 29.5 */
    {
      id: '29.5',
      title: 'ניגוד CDK מול ידני: מתי כל גישה?',
      blocks: [
        {
          kind: 'p',
          text:
            'פרק 17 השתמש ב-CDK drag-drop לסידור הלוח Kanban. CDK מטפל בשיבוט הצף, ב-placeholder ' +
            'ובאנימציית ההזזה, ומספק נגישות מובנית. הוא מצוין כשצריך סידור רשימות עם drop zones מוגדרים.',
        },
        {
          kind: 'callout',
          tone: 'alt',
          title: 'CDK מול ידני — מתי כל גישה?',
          body: [
            'CDK (@angular/cdk/drag-drop): סידור רשימות/עמודות, drop zones, נגישות מובנית, ' +
              'placeholder ואנימציה ממוחשבות. מתי לבחור: לוח Kanban, reorder של פריטים בעמודה (פרק 17).',
            'ידני (pointer events): מיקום חופשי על קנבס, ציור, resize, שליטה מלאה, אפס dependency. ' +
              'מתי לבחור: sticky notes, whiteboard, custom handles, כל מקום שה-drop model של CDK לא מתאים.',
          ],
        },
        {
          kind: 'p',
          text:
            'בפרויקט זה, `@angular/cdk` אינה תלות — ולכן הדמו של פרק 29 הוא הדוגמה הטהורה ביותר: ' +
            'pointer events בלבד, directive נקי, ואפס import מ-CDK. זה גם מה שמבקשים בראיון "מאפס".',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () =>
          import('./demos/interactions.demo').then((m) => m.InteractionsDemo),
        caption:
          'גררו פתק: pointerdown captures the pointer, pointermove moves via transform, pointerup releases — ללא CDK',
      },
    },

    /* ------------------------------------------------------------------ 29.6 */
    {
      id: '29.6',
      title: 'טכניקה 2: ציור — canvas marker עם stroke storage',
      blocks: [
        {
          kind: 'p',
          text:
            'אזור הציור הוא `<canvas>` בגודל ה-box שלו. מכונת-המצבים: ' +
            'pointerdown קורא ל-ctx.beginPath() ו-ctx.moveTo() ופותח stroke חדש. ' +
            'pointermove קורא ל-ctx.lineTo() ו-ctx.stroke() — מצייר בזמן אמת. ' +
            'pointerup סוגר את הקו ומוסיף אותו למערך strokes.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'שינוי גודל canvas מוחק את ה-bitmap',
          body:
            'כאשר מגדירים canvas.width = newWidth, הדפדפן מאפס את כל ה-bitmap לחלוטין. ' +
            'לכן אחסון strokes כמערכי נקודות (לא כ-bitmap) הוא חיוני: אחרי כל resize מרנדרים מחדש ' +
            'את כל ה-strokes מהמערך. בלי זה, ציורים נמחקים בכל שינוי גודל.',
        },
        {
          kind: 'p',
          text:
            'ResizeObserver צופה ב-canvas. כשהגודל משתנה, הוא מעדכן canvas.width/height לגודל האמיתי ' +
            '(getBoundingClientRect) ואז קורא ל-redraw() שמשחזר את כל ה-strokes. ' +
            'ה-ResizeObserver מנותק ב-DestroyRef.onDestroy.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'typescript',
        file: 'src/app/chapters/ch29-drill-interactions/demos/interactions.demo.ts',
        code: `// canvas marker — strokes נשמרים כמערכי נקודות כדי לשרוד resize
private strokes: { color: string; pts: Point[] }[] = [];
private current: { color: string; pts: Point[] } | null = null;

protected startDraw(e: PointerEvent): void {
  if (!this.markerOn() || !this.ctx) return;
  const cv = this.canvasRef()!.nativeElement;
  cv.setPointerCapture(e.pointerId);
  this.drawing = true;
  const p = this.local(e);
  this.current = { color: this.markerColor(), pts: [p] };
  this.ctx.strokeStyle = this.markerColor();
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
  if (this.current) { this.strokes.push(this.current); this.current = null; }
  this.canvasRef()!.nativeElement.releasePointerCapture(e.pointerId);
}

// ResizeObserver: cv.width = rect.width מנקה את ה-bitmap -> redraw מחזיר strokes
private redraw(): void {
  const cv = this.canvasRef()?.nativeElement;
  if (!cv || !this.ctx) return;
  this.ctx.clearRect(0, 0, cv.width, cv.height);
  for (const s of this.strokes) {
    this.ctx.strokeStyle = s.color;
    this.ctx.beginPath();
    s.pts.forEach((p, i) => (i ? this.ctx!.lineTo(p.x, p.y) : this.ctx!.moveTo(p.x, p.y)));
    this.ctx.stroke();
  }
}`,
      },
    },

    /* ------------------------------------------------------------------ 29.7 */
    {
      id: '29.7',
      title: 'canvas מול SVG — מתי כל אחד?',
      blocks: [
        {
          kind: 'p',
          text:
            'Canvas ו-SVG שניהם מאפשרים גרפיקה — אך מודלים שונים לחלוטין. ' +
            'Canvas הוא raster: ציור על bitmap, רזולוציה קבועה, אין hit-testing מובנה. ' +
            'SVG הוא vector: כל קו הוא אלמנט DOM שאפשר ללחוץ עליו, לסגנן ב-CSS, ולאנימציה.',
        },
        {
          kind: 'callout',
          tone: 'alt',
          title: 'canvas מול SVG — שאלת ראיון נפוצה',
          body: [
            'Canvas: raster, זול להמון קווים (אלפי strokes = bitmap אחד), אין hit-testing. ' +
              'מתי: marker חופשי, גרפיקה בזמן-אמת, משחקים, visualization של נתונים רבים.',
            'SVG: vector, כל קו אלמנט DOM, hit-testing מובנה, styling ב-CSS. ' +
              'מתי: אנוטציה אינטראקטיבית שצריך ללחוץ על קווים, אייקונים, charts עם tooltips.',
          ],
        },
        {
          kind: 'p',
          text:
            'הדמו בוחר canvas כי מדובר במרקר חופשי — הרבה נקודות, ביצועים חשובים, ' +
            'ולא צריך לאתר קו ספציפי אחרי ציורו. אם היינו בונים שרטוט שבו משתמש לוחץ על קו ' +
            'לאחר ציורו לשינוי צבע — SVG היה הבחירה.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () =>
          import('./demos/interactions.demo').then((m) => m.InteractionsDemo),
        caption:
          'צייר קווים, ואז שנה גודל הדפדפן או גרור פינה — הציורים שורדים (ResizeObserver + redraw)',
      },
    },

    /* ------------------------------------------------------------------ 29.8 */
    {
      id: '29.8',
      title: 'טכניקה 3: Resize — ידית פינה עם clamp',
      blocks: [
        {
          kind: 'p',
          text:
            'ResizableDirective (`[appResizable]`) מממש resize מהפינה הימנית-תחתונה. ' +
            'ב-pointerdown בודקים "corner grab" — האם הסמן בתוך 18px מהפינה (rect.right - e.clientX < 18 ' +
            'וגם rect.bottom - e.clientY < 18). רק אז מתחילים resize ושומרים width/height התחלתיים.',
        },
        {
          kind: 'p',
          text:
            'ב-pointermove מחשבים next.w = start.w + deltaX, next.h = start.h + deltaY, ' +
            'עם clamp ל-minSize (ברירת מחדל: 72px) כך שהאלמנט לא מתמוסס. ' +
            'emitting resized output בכל שינוי — ה-demo מציג W x H בכותרת. ' +
            'ב-pointerup: releasePointerCapture ואיפוס.',
        },
        {
          kind: 'callout',
          tone: 'alt',
          title: 'resize: both — גרסת אפס-JS',
          body:
            'CSS תומך ב-resize: both מחוץ לקופסה — הדפדפן מציג ידית ומנהל את הגרירה. ' +
            'ResizableDirective קיים כדי להראות את המכניקה שצריך כשרוצים שליטה מלאה: ' +
            'ידיות מותאמות, snapping, clamp לפי לוגיקה עסקית, emit לפרנט. כשלא צריך שליטה — resize: both.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'typescript',
        file: 'src/app/chapters/ch29-drill-interactions/demos/resizable.directive.ts',
        code: `// appResizable — אותה מכונת-מצבים, הדלתא משנה גודל במקום מיקום
@Directive({ selector: '[appResizable]' })
export class ResizableDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly minSize = input(72);
  readonly resized = output<Size>();

  private readonly size = signal<Size | null>(null);
  private readonly active = signal(false);
  private start: { x: number; y: number; w: number; h: number } | null = null;

  @HostBinding('style.width.px')  get width()  { return this.size()?.w ?? null; }
  @HostBinding('style.height.px') get height() { return this.size()?.h ?? null; }
  @HostBinding('class.resizing')  get isResizing() { return this.active(); }

  @HostListener('pointerdown', ['$event'])
  onDown(e: PointerEvent): void {
    const rect = this.el.nativeElement.getBoundingClientRect();
    // זיהוי פינה: פחות מ-18px מהקצה הימני-תחתון
    const nearCorner = rect.right - e.clientX < 18 && rect.bottom - e.clientY < 18;
    if (!nearCorner) return;
    this.start = { x: e.clientX, y: e.clientY, w: rect.width, h: rect.height };
    this.active.set(true);
    this.el.nativeElement.setPointerCapture(e.pointerId);
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
    this.el.nativeElement.releasePointerCapture(e.pointerId);
    this.start = null;
    this.active.set(false);
  }
}`,
      },
    },

    /* ------------------------------------------------------------------ 29.9 */
    {
      id: '29.9',
      title: 'ResizeObserver: להגיב לתוצאה, לא לגרירה',
      blocks: [
        {
          kind: 'p',
          text:
            'ResizeObserver הוא API שצופה בשינויי גודל של אלמנט — לא רק כתוצאה מגרירת ידית, ' +
            'אלא מכל סיבה: שינוי CSS, layout-shift, הדפדפן עצמו. ' +
            'בדמו, ה-ResizeObserver צופה ב-canvas ובכל שינוי מעדכן את canvas.width/height לגודל הפיזי ומשחזר strokes.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ההבדל בין ResizeObserver לאירוע window resize?',
          body:
            'window.resize מופעל רק כשחלון הדפדפן משנה גודל — לא כשאלמנט ספציפי גדל (למשל בגלל תוכן דינמי, ' +
            'שינוי CSS, flex reflow). ResizeObserver צופה באלמנט ספציפי ומדויק. ' +
            'לניטור גודל אלמנט תמיד עדיף ResizeObserver.',
        },
        {
          kind: 'p',
          text:
            'ניקוי: ResizeObserver.disconnect() נקרא ב-DestroyRef.onDestroy — ' +
            'בדיוק כמו שה-directive מנקה pointer listeners אוטומטית. ' +
            'דפוס אחיד: כל משאב שנפתח ב-ngAfterViewInit נסגר ב-onDestroy.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () =>
          import('./demos/interactions.demo').then((m) => m.InteractionsDemo),
        caption:
          'צייר קווים, אז גרור פינת התיבה ה-resizable — הציורים על ה-canvas שורדים בגלל ResizeObserver + redraw',
      },
    },

    /* ------------------------------------------------------------------ 29.10 */
    {
      id: '29.10',
      title: 'טכניקה 4: Host binding — decorators מול host metadata',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-directive עוטף את הגרירה ב-Angular באמצעות שתי דקורטורות host. ' +
            '@HostListener מאזין לאירוע על ה-host element ומפעיל מתודה. ' +
            '@HostBinding קושר property או class של ה-host לשדה/getter בתוך ה-directive.',
        },
        {
          kind: 'p',
          text:
            'הצורה המודרנית שקולה: ניתן לכתוב את אותו הדבר ב-metadata `host: {}` ישירות ב-`@Directive`. ' +
            'שתיהן תקינות ב-Angular v22; עניין של טעם וקונבנציית הצוות.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: '@HostBinding/@HostListener מול host: {} — מה ההבדל?',
          body:
            'אין הבדל פונקציונלי. @HostBinding/@HostListener הם decorators על members, ' +
            'ו-host: {} הוא metadata inline ב-@Directive. ' +
            'לדוגמה: host: { "(pointerdown)": "onDown($event)", "[style.transform]": "transform" } ' +
            'שקול לחלוטין ל-@HostListener("pointerdown") + @HostBinding("style.transform"). ' +
            'בוחרים לפי קונבנציה — decorators נפוצים יותר בקוד ותיק, host: {} מקובל יותר בסגנון Angular v17+.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה directive ולא addEventListener ידני?',
          body:
            'directive עם @HostListener הוא דקלרטיבי, בדיק, ו-Angular מנקה את המאזינים אוטומטית ב-destroy. ' +
            'addEventListener ידני (דרך ElementRef.nativeElement) דורש removeEventListener ידני ב-OnDestroy — ' +
            'שגיאה נפוצה שגורמת לדליפות זיכרון. @HostListener is preferred.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'typescript',
        file: 'src/app/chapters/ch29-drill-interactions/demos/draggable.directive.ts',
        code: `// שתי הצורות — שקולות
// צורה 1: decorators (בשימוש בדמו)
@HostBinding('style.transform')
get transform(): string { ... }

@HostListener('pointerdown', ['$event'])
onDown(e: PointerEvent): void { ... }

// צורה 2: host metadata (שקולה לחלוטין)
@Directive({
  selector: '[appDraggable]',
  host: {
    '[style.transform]': 'transform',
    '[class.dragging]': 'isDragging',
    '(pointerdown)': 'onDown($event)',
    '(pointermove)': 'onMove($event)',
    '(pointerup)':   'onUp($event)',
  }
})`,
      },
    },

    /* ------------------------------------------------------------------ 29.11 */
    {
      id: '29.11',
      title: 'directive מול component — מתי כל אחד?',
      blocks: [
        {
          kind: 'p',
          text:
            'directive הוא התנהגות על אלמנט קיים — אין לו template משלו. ' +
            'component הוא אלמנט+template חדש. כשרוצים להוסיף יכולת לאלמנט (גרירה, resize, tooltip) — directive. ' +
            'כשרוצים ליצור אלמנט חדש עם מבנה (רשימה, כרטיס, כותרת) — component.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'directive מול component — איך מחליטים?',
          body:
            'directive: התנהגות על אלמנט קיים, ניתן להצמיד לכל אלמנט ("צייר על פתק או כל אלמנט"). ' +
            'component: אלמנט+template חדש. גרירה, resize, tooltip = directive. ' +
            'modal, dropdown, card = component. הכלל: אם לא צריך template — directive.',
        },
        {
          kind: 'p',
          text:
            'בדמו, `[appDraggable]` ו-`[appResizable]` הם directives כי הם מוסיפים התנהגות לאלמנטים קיימים ' +
            '(ה-note divs, ה-resize-box). הם לא יוצרים HTML חדש — רק קוראים ומשנים את ה-host.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () =>
          import('./demos/interactions.demo').then((m) => m.InteractionsDemo),
        caption:
          'appDraggable ו-appResizable הם directives — מוסיפים התנהגות לאלמנטים קיימים ללא template',
      },
    },

    /* ------------------------------------------------------------------ 29.12 */
    {
      id: '29.12',
      title: 'ניגוד מפורש: CDK (פרק 17) מול pointer ידני (פרק 29)',
      blocks: [
        {
          kind: 'p',
          text:
            'בפרק 17 גררנו כרטיסים בין עמודות Kanban עם cdkDrag + cdkDropList. CDK סיפק placeholder, ' +
            'אנימציה, ו-moveItemInArray. כאן, בפרק 29, הפתקים נעים במיקום חופשי על קנבס — ' +
            'CDK לא נועד לזה, ומחייב יותר overrides מאשר לכתוב מאפס.',
        },
        {
          kind: 'ul',
          items: [
            'CDK (פרק 17): drop zones מוגדרים, סידור רשימות/עמודות, נגישות מובנית (aria-grabbed, לא צריך לממש ידנית), moveItemInArray.',
            'ידני (פרק 29): מיקום חופשי, ציור, resize — כשה-interaction לא מתמפה ל"רשימה עם drop zone".',
            'ניגוד המפתח: CDK מטפל ב"פיקסלים" (שיבוט, placeholder, אנימציה); ידני מטפל ב"נתונים" (pos, size, stroke).',
            'בפרק 29: @angular/cdk לא תלות בפרויקט — הדמו "pure vanilla Angular" עם pointer events.',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מתי CDK ומתי pointer events ידניים?',
          body:
            'CDK: סידור רשימות עם drop zones, נגישות מובנית, Kanban. ' +
            'ידני: מיקום חופשי, ציור, resize, שליטה מלאה, אפס dependency. ' +
            'אם צריך להסביר לראיין — CDK לפרק 17, pointer events לפרק 29.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `flowchart LR
  CDK["CDK (פרק 17)\\ncdkDrag + cdkDropList\\ndrop zones, moveItemInArray\\nנגישות מובנית"] -->|"Kanban reorder"| BOARD["לוח עמודות"]
  MANUAL["ידני (פרק 29)\\npointer events\\n@HostBinding/Listener\\naפס dependency"] -->|"free position, draw, resize"| CANVAS["קנבס/sticky notes"]`,
        caption: 'CDK לסידור רשימות — pointer events ידניים לחופש מלא',
      },
    },

    /* ------------------------------------------------------------------ 29.13 */
    {
      id: '29.13',
      title: 'נגישות: חצים + aria-live',
      blocks: [
        {
          kind: 'p',
          text:
            'גרירה חייבת נתיב מקלדת מקביל. ב-DraggableDirective: tabindex=0 ו-role="button" (דרך @HostBinding) ' +
            'הופכים כל פתק לפוקוסבילי. חצי מקלדת מזיזים 3px (Shift+חץ: 12px). ' +
            'הלוג (aria-live) מכריז על כל הזזה.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'נגישות של גרירה — מה חייבים?',
          body:
            'חייבים שני נתיבים: pointer (עכבר/מגע) + מקלדת (חצים/space/Enter). ' +
            'בלי נתיב מקלדת המשתמש עם מקלדת לא יכול לגרור. ' +
            'זו הסיבה שפרק 17 השתמש ב-CDK — CDK מספק את שני הנתיבים. ' +
            'בפרק 29 מממשים ידנית: @HostListener("keydown") על כל חצי מקלדת + aria-live על הלוג.',
        },
        {
          kind: 'p',
          text:
            'aria-live="polite" על הלוג בדמו מכריז על מיקומים חדשים לקוראי מסך. ' +
            'לא נדרשת הכרזה assertive כאן (לא יזמנו עצירה מהירה) — polite ממתין לסיום הקראה קיימת.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () =>
          import('./demos/interactions.demo').then((m) => m.InteractionsDemo),
        caption:
          'Tab למקד פתק, חצים להזיז (Shift+חץ לקפיצה), הלוג מציג מיקום — נתיב מקלדת מלא',
      },
    },

    /* ------------------------------------------------------------------ 29.14 */
    {
      id: '29.14',
      title: 'שאלות ראיון נפוצות: סיכום',
      blocks: [
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה setPointerCapture?',
          body:
            'כדי שאירועי pointermove ו-pointerup ימשיכו להגיע לאלמנט גם כשהסמן יוצא מגבולותיו. ' +
            'בלי capture, גרירה מהירה "נופלת" — הסמן יוצא מהאלמנט לפני שמשחררים ו-pointerup לא מגיע.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'transform מול top/left לגרירה?',
          body:
            'transform רץ על ה-compositor ללא reflow ומאפשר 60fps חלק. ' +
            'top/left מחשבים layout מחדש בכל פריים — יקרים בחישוב, עלולים לגרום ל-jank. ' +
            'תמיד transform לאנימציות ומניפולציה ישירה.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'איך הציור שורד resize?',
          body:
            'strokes נשמרים כמערכי נקודות ({color, pts[]}). כשמשנים גודל, canvas.width = newWidth מוחק את ה-bitmap. ' +
            'ResizeObserver קולט את השינוי וקורא ל-redraw() שמרנדר מחדש את כל ה-strokes מהמערך. ' +
            'בלי שמירת הנקודות — הציור נמחק.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'z-index בזמן גרירה?',
          body:
            'מחלקת .dragging מוגדרת ב-@HostBinding. ב-CSS, .dragging מקבל z-index גבוה + box-shadow. ' +
            'כך הפתק הנגרר מרחף מעל השאר ב-UI.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () =>
          import('./demos/interactions.demo').then((m) => m.InteractionsDemo),
        caption: 'הדמו המלא: גרירה, ציור, resize — שלוש טכניקות, מכונת-מצבים אחת',
      },
    },
  ],

  quiz: [
    {
      q: 'מה מייחד את pointermove כחלק ממכונת-מצבים, ומה שונה בין שלוש הטכניקות?',
      options: [
        'ב-pointermove תמיד עוצרים את הבועה (stopPropagation) — ההבדל הוא במה שמפעילים לאחר מכן',
        'ב-pointermove מחילים delta: גרירה מזיזה pos, resize משנה size, ציור מוסיף נקודה ל-stroke',
        'pointermove רץ רק כשמחזיקים לחצן עכבר — touch events דורשים touchmove',
        'אין הבדל; setPointerCapture גורם לכל שלושת הטכניקות לרוץ במשולב',
      ],
      answer: 1,
      explain:
        'המכונה זהה (pointerdown / pointermove / pointerup + capture/release). ' +
        'ההבדל הוא בגוף pointermove בלבד: pos.set() לגרירה, size.set() ל-resize, ctx.lineTo() לציור. ' +
        'Pointer Events מאחדים עכבר ומגע — אין צורך בנפרד touchmove.',
    },
    {
      q: 'למה setPointerCapture חיוני לגרירה?',
      options: [
        'הוא מונע ממשתמש אחר לגרור את אותו אלמנט בו-זמנית',
        'הוא גורם ל-pointermove להגיע לאלמנט גם כשהסמן יוצא מגבולותיו',
        'הוא נחוץ רק ב-touch events, לא עכבר',
        'הוא מאפשר לשמור את מיקום הסמן לאחר pointerup',
      ],
      answer: 1,
      explain:
        'בלי setPointerCapture, pointermove ו-pointerup מפסיקים להגיע לאלמנט ברגע שהסמן יוצא מגבולותיו. ' +
        'גרירה מהירה "נופלת" — הסמן יוצא לפני שמשחררים. capture מבטיח רצף אירועים תקין עד pointerup.',
    },
    {
      q: 'מה קורה ל-bitmap של canvas כש-canvas.width = newValue?',
      options: [
        'הדפדפן שומר את ה-bitmap ומשנה רק את מימדי תצוגת ה-canvas',
        'ה-bitmap נמחק לחלוטין — יש לשרטט מחדש',
        'הציור מוזזה אוטומטית ל-scale החדש',
        'canvas.width אינו ניתן לשינוי לאחר יצירה ראשונית',
      ],
      answer: 1,
      explain:
        'שינוי canvas.width (או canvas.height) מאפס את ה-bitmap לגמרי, גם אם הערך זהה לקודם. ' +
        'לכן שומרים strokes כמערכי נקודות ומרנדרים מחדש אחרי כל resize.',
    },
    {
      q: '@HostBinding("style.transform") בדירקטיב — מה הוא עושה בפועל?',
      options: [
        'קורא את ה-transform הנוכחי מה-DOM',
        'כותב את ערך ה-getter ל-style.transform של ה-host element בכל change detection',
        'יוצר property חדש על ה-host element בשם transform',
        'מאזין לשינוי transform מחוץ לאנגולר',
      ],
      answer: 1,
      explain:
        '@HostBinding כותב את ערך ה-getter / ה-field ל-property של ה-host element בכל change detection. ' +
        'כך ה-directive "כותב לעצמו" — מעדכן את ה-style.transform של האלמנט שעליו הוא מוצמד, ' +
        'בלי גישה ישירה ל-DOM.',
    },
    {
      q: 'מה ההבדל בין @HostBinding/@HostListener לבין host: {} ב-@Directive?',
      options: [
        'host: {} זמין רק מ-Angular 17 ומעלה; @HostBinding קיים מהתחלה',
        'אין הבדל פונקציונלי — שני הסגנונות שקולים, עניין של קונבנציה',
        'host: {} לא תומך ב-$event; @HostListener תומך',
        '@HostBinding יכול לכתוב רק styles; host: {} יכול לכתוב גם attributes',
      ],
      answer: 1,
      explain:
        'שני הסגנונות שקולים לחלוטין. host: {} הוא metadata inline ב-@Directive/Component; ' +
        '@HostBinding/@HostListener הם decorators על members. ' +
        'host: {} מקובל יותר בסגנון Angular v17+; decorators נפוצים בקוד ותיק.',
    },
    {
      q: 'מתי לבחור directive על פני component?',
      options: [
        'כשרוצים להוסיף template חדש לאלמנט',
        'כשרוצים להוסיף התנהגות לאלמנט קיים, ללא template משלו',
        'directive מיועד רק ל-structural directives כמו ngIf',
        'כשמספר הاינפוטים עולה על 5',
      ],
      answer: 1,
      explain:
        'directive = התנהגות על אלמנט קיים (אין template). component = אלמנט+template חדש. ' +
        'גרירה, resize, tooltip, validation = directive. modal, card, form = component. ' +
        'כלל: אם לא צריך template — directive.',
    },
    {
      q: 'מה יתרון canvas על SVG לציור חופשי כמו marker?',
      options: [
        'canvas מאפשר hit-testing על קווים בודדים; SVG לא',
        'canvas הוא raster — זול להמון קווים; SVG יוצר אלמנט DOM לכל קו',
        'canvas תומך ב-CSS animations; SVG לא',
        'canvas אינו נתמך ב-Safari; SVG נתמך בכל מקום',
      ],
      answer: 1,
      explain:
        'canvas הוא bitmap — אלפי קווים הם bitmap אחד, ביצועים מעולים. ' +
        'SVG יוצר אלמנט DOM לכל `<path>` — אלפי אלמנטים מאטים מאוד. ' +
        'לציור חופשי canvas הוא הבחירה הנכונה; לאנוטציה אינטראקטיבית (לחיצה על קו) — SVG.',
    },
  ],

  proveIt: [
    {
      title: 'גררו פתק עם עכבר ובדקו transform',
      body:
        'פתחו את הדמו בכתובת http://localhost:4400/chapters/drill-interactions. ' +
        'גררו אחד מ-3 הפתקים למיקום חדש. פתחו DevTools ובחנו את ה-style של הפתק.',
      expect:
        'style.transform מכיל translate(Xpx, Ypx) עם הערכים המעודכנים. ' +
        'לא top/left — רק transform. המחלקה .dragging נעלמת לאחר שחרור.',
    },
    {
      title: 'צייר קווים, שנה גודל חלון — בדוק שהציורים שורדים',
      body:
        'בדמו, בחרו צבע וצייר כמה קווים על לוח הציור. ' +
        'לאחר מכן, גררו את ידית ה-resize של ה-resizable box כדי לשנות גודל. ' +
        'לחלופין, שנו את גודל חלון הדפדפן לרוחב שונה.',
      expect:
        'הציורים נשארים על ה-canvas לאחר שינוי גודל. ' +
        'ResizeObserver מגלה את שינוי הגודל, מעדכן canvas.width/height, וקורא ל-redraw() שמשחזר את ה-strokes.',
    },
    {
      title: 'גררו פתק עם חצי מקלדת',
      body:
        'בדמו, לחצו Tab עד שאחד מהפתקים מקבל פוקוס (outline גלוי). ' +
        'לחצו חצי מקלדת (ArrowRight, ArrowDown וכו\') להזזת הפתק. ' +
        'נסו גם Shift+חץ לקפיצה.',
      expect:
        'הפתק זז 3px בכל חץ, 12px עם Shift+חץ. ' +
        'הלוג (ה-position log) מתעדכן עם הקואורדינטות החדשות. ' +
        'זה מוכיח שנתיב המקלדת (@HostListener keydown) עובד.',
    },
    {
      title: 'גררו ידית resize וראו W x H',
      body:
        'בדמו, מצאו את ה-Resize Box (התיבה הירוקה-מסגרת). ' +
        'הניחו את הסמן ליד הפינה הימנית-תחתונה (תוך 18px) וגררו.',
      expect:
        'הכותרת "Resize Box" מציגה את הגודל העדכני בפורמט W x H (למשל 200 x 140). ' +
        'לא ניתן לכווץ מתחת ל-72px בכל כיוון (minSize clamp). ' +
        'לחיצה במרכז התיבה לא מפעילה resize (corner-grab בלבד).',
    },
  ],

  exercise: {
    prompt:
      'הוסיפו "snap to grid" ל-DraggableDirective: כל פתק נוחת על רשת של 20px. ' +
      'כלומר, ה-pos מעוגל ל-20px הקרוב ביותר בכל הזזה.',
    tasks: [
      'הוסיפו פונקציית עזר snap(v: number, grid: number): number שמחשבת Math.round(v / grid) * grid.',
      'ב-onMove (pointermove), לפני pos.set(), הפעילו snap() על x ו-y.',
      'הפעילו snap() גם ב-onKey (חצי מקלדת) — כך שניהם מתנהגים זהה.',
      'הוסיפו input() ל-directive: gridSize עם ברירת מחדל 20, כך שניתן לשנות את הרשת.',
    ],
    acceptance: [
      'גרירת פתק עם עכבר — הפתק "קופץ" לנקודות רשת.',
      'הזזה עם חצים — גם היא מחושבת עם snap.',
      'שינוי gridSize ל-40 גורם לרשת גסה יותר.',
      'הלוג מציג קואורדינטות מעוגלות לרשת.',
    ],
  },
};
