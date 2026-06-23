# ch29 — אינטראקציות מאפס: DnD · ציור · Resize · Host (T3)

> דרil T3 — הנושא שהכי הפיל בסימולציה. "notes app עם drag-and-drop, ציור/marker על אלמנט, resize, host
> binding — איך חושבים ובונים." המפתח: כולם **אותה מכונת-מצבים** של pointer events. נבנה מאפס (בלי CDK).

## המודל המנטלי (הרעיון המאחד)
**"כל אינטראקציה של מניפולציה-ישירה היא אותה מכונת-מצבים של 3 אירועי pointer:
`pointerdown` (תופס נקודת-התחלה + `setPointerCapture` כדי להמשיך לקבל אירועים גם מחוץ לאלמנט) →
`pointermove` (מחיל את ה-delta) → `pointerup` (commit/שחרור).**
גרירה מזיזה **מיקום**, resize משנה **גודל**, ציור **מוסיף נקודה**. Pointer events מאחדים עכבר + מגע + עט."

> משפט-פתיחה לראיון: "אני לא מתחיל מ-library. אני שואל: מה משתנה בין down ל-up? מיקום? גודל? קו? זה קובע
> מה אני כותב ב-move. שאר הזהה — capture, delta, commit."

## חמש הטכניקות

### 1. Drag-and-drop מאפס (free-position)
- `pointerdown`: שמור `startX/Y` (העכבר) ואת מקור הפתק; `setPointerCapture(e.pointerId)`.
- `pointermove`: `pos = origin + (clientX - startX, clientY - startY)`; כתוב ל-`transform: translate(...)` —
  **transform ולא top/left**, כי transform לא גורם reflow (רץ על ה-compositor).
- `pointerup`: `releasePointerCapture`, commit.
- **ניגוד מול CDK** (פרק 17 ב-TaskForge): `cdkDrag/cdkDropList` + `moveItemInArray`. **מתי CDK** — סידור
  רשימות/עמודות, drop zones, נגישות מובנית. **מתי ידני** — מיקום חופשי על קנבס, שליטה מלאה, אפס dependency.

### 2. ציור / marker
- `<canvas>` בגודל ה-box. `pointerdown`: `ctx.beginPath(); ctx.moveTo(x,y)`. `pointermove`:
  `ctx.lineTo(x,y); ctx.stroke()`. `pointerup`: סוף קו.
- **שמור strokes כמערכי נקודות** — כדי ש-redraw/resize ישרדו (שינוי `canvas.width` מנקה את ה-bitmap!).
- **canvas מול SVG:** canvas = raster, זול להמון קווים, אין hit-testing. SVG = vector, כל קו אלמנט שאפשר
  ללחוץ/לסגנן, יקר בהמון אלמנטים. marker חופשי → canvas; אנוטציה אינטראקטיבית → SVG.

### 3. Resize
- ידית בפינה (או זיהוי "קרבה לפינה" ב-`pointerdown`). `pointermove`: `width/height = start + delta`, עם
  clamp ל-min. `pointerup`: סוף.
- **`ResizeObserver`** — להגיב ל*תוצאה* (למשל להתאים מחדש את הקנבס אחרי resize). **`resize: both` ב-CSS** —
  גרסת אפס-JS כשלא צריך שליטה.

### 4. Host binding (השאלה "host binding?")
- עוטפים את הגרירה ב-**directive** `appDraggable`:
  - **`@HostListener('pointerdown', ['$event'])`** — מאזין לאירוע על ה-host.
  - **`@HostBinding('style.transform')`** / **`@HostBinding('class.dragging')`** — כותב חזרה ל-host.
- **הצורה המודרנית** `host: {}` ב-metadata שקולה: `host: { '(pointerdown)': 'onDown($event)',
  '[style.transform]': 'transform', '[class.dragging]': 'isDragging' }`.
- **למה directive:** התנהגות לשימוש-חוזר שאפשר להצמיד לכל אלמנט ("צייר על פתק **או כל אלמנט**"). `@HostBinding`
  כותב ל-host; `@HostListener` קורא אירועים ממנו. עדיף על `ElementRef + addEventListener` ידני כי זה
  דקלרטיבי ו-Angular **מנקה את המאזינים לבד** ב-destroy.
- **directive מול component:** directive = התנהגות על אלמנט קיים (אין template משלו); component = אלמנט+template
  חדש. גרירה/resize = התנהגות → directive.

### קוד-ליבה (verified — מהקבצים שבנינו)
```typescript
// draggable.directive.ts — מכונת-המצבים דרך host binding
@Directive({ selector: '[appDraggable]' })
export class DraggableDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly pos = signal<Point>({ x: 0, y: 0 });

  @HostBinding('style.transform') get transform() {
    const p = this.pos(); return `translate(${p.x}px, ${p.y}px)`;
  }
  @HostListener('pointerdown', ['$event']) onDown(e: PointerEvent) {
    this.start = { x: e.clientX, y: e.clientY }; this.origin = this.pos();
    this.el.nativeElement.setPointerCapture(e.pointerId); e.preventDefault();
  }
  @HostListener('pointermove', ['$event']) onMove(e: PointerEvent) {
    if (!this.start) return;
    this.pos.set({ x: this.origin.x + (e.clientX - this.start.x),
                   y: this.origin.y + (e.clientY - this.start.y) });
  }
  @HostListener('pointerup', ['$event']) onUp(e: PointerEvent) {
    this.el.nativeElement.releasePointerCapture(e.pointerId); this.start = null;
  }
}
```
```typescript
// canvas marker — strokes נשמרים כדי לשרוד resize
startDraw(e) { ctx.beginPath(); ctx.moveTo(...local(e)); this.current = { color, pts: [p] }; }
moveDraw(e)  { const p = local(e); this.current.pts.push(p); ctx.lineTo(p.x,p.y); ctx.stroke(); }
// ResizeObserver: cv.width = rect.width (מנקה!) → redraw(strokes)
```

### 5. ציור על אלמנט קיים — annotation overlay ("צייר על הכרטיס/הפתק/כל אלמנט")
ה-canvas של טכניקה 2 הוא משטח ריק. כדי לסמן **על אלמנט אמיתי** (issue card, פתק, צילום מסך) המודל הוא
**"שכבת-על שמדליקים ומכבים":**
1. הופכים את האלמנט ל-positioning context: `position: relative`.
2. מזריקים מעליו `<canvas>` ב-`position: absolute; inset: 0`, בגודל האלמנט (ResizeObserver שומר על התאמה).
3. אותה מכונת-מצבים של pointer מציירת — marker שקוף-למחצה נהדר לסימון טקסט על הכרטיס.
4. **מתג `pointer-events`:** כשהכלי "off" ה-overlay שקוף-לאירועים (`pointer-events: none`) והאלמנט מתפקד
   רגיל (אפשר ללחוץ כפתורים); כשבוחרים pen/marker ה-overlay תופס את ה-pointer (`auto`) ומאפשר לצייר.
- בנינו את זה כ-**directive** `appAnnotate` עם `exportAs` (לשימוש חוזר על **כל** אלמנט, לא רק על אחד). זה הניסוח
  הישיר ל"צייר על הפתק או כל אלמנט": הצמדה דקלרטיבית של שכבת אנוטציה לכל host.
```typescript
// appAnnotate — overlay על ה-host; pointer-events מתחלף לפי הכלי
@Directive({ selector: '[appAnnotate]', exportAs: 'appAnnotate' })
export class AnnotateDirective implements OnInit {
  readonly tool = input<'pen' | 'marker' | 'off'>('off');
  ngOnInit() {
    const host = this.hostRef.nativeElement;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    const cv = document.createElement('canvas');
    Object.assign(cv.style, { position: 'absolute', inset: '0', touchAction: 'none' });
    host.appendChild(cv);                         // overlay מעל האלמנט
    new ResizeObserver(() => this.fit()).observe(host);   // נשאר בגודל האלמנט
  }
  // effect: cv.style.pointerEvents = tool() === 'off' ? 'none' : 'auto'
}
```
- **שאלת ראיון צמודה:** "איך מציירים על אלמנט בלי לשבור אותו?" התשובה: overlay canvas + `pointer-events` toggle.
  "איך הציור נשאר מיושר כשהאלמנט זז/משתנה?" ResizeObserver שמתאים את ה-canvas ומצייר מחדש מ-strokes שמורים.

## הדמו החי (verified facts לכותב)
רכיב `demo-interactions` (`interactions.demo.ts`) + שתי directives (`draggable.directive.ts`,
`resizable.directive.ts`). **בלי `@angular/cdk`** (לא תלות בפרויקט — מתאים בול ל"מאפס").
- **Drag:** 3 sticky notes על לוח-נקודות; `appDraggable` עם `transform`; מקלדת: Tab למקד, חצים להזיז,
  Shift+חץ לקפיצה; לוג מיקומים `aria-live`. `.dragging` מרים z-index+צל.
- **Draw:** `<canvas>`, טוגל marker on/off, 4 צבעים, clear. `ResizeObserver` מתאים את הקנבס ו-`redraw` משחזר
  strokes — מדגים שהציור שורד resize.
- **Resize:** `appResizable` — `pointerdown` ליד הפינה הימנית-תחתונה (≤18px), clamp min 72px, פולט `resized`,
  הכותרת מציגה `W × H`.
ניקוי: `@HostListener`/template bindings מתנקים אוטומטית; `ResizeObserver` ב-`DestroyRef.onDestroy`.

## Interview Q&A
- **"pointer מול mouse מול touch?"** — pointer מאחד את שלושתם (עכבר/מגע/עט) ב-API אחד; `pointerId`, `pressure`,
  `setPointerCapture`. לא צריך לרשום נפרד `mouse*`+`touch*`.
- **"למה setPointerCapture?"** — כדי שאירועי move/up ימשיכו להגיע לאלמנט גם כשהסמן יוצא מגבולותיו; בלעדיו
  גרירה מהירה "נופלת".
- **"transform מול top/left?"** — transform רץ על ה-compositor בלי reflow/repaint של layout → חלק; top/left
  מחשב layout מחדש בכל פריים.
- **"@HostBinding/@HostListener מול host:{}?"** — אותו דבר; decorators על members, `host:{}` כ-metadata
  inline. בוחרים לפי טעם/קונבנציה.
- **"איך הציור שורד resize?"** — strokes נשמרים כמערכי נקודות; אחרי שינוי גודל (שמנקה את הקנבס) מרנדרים מחדש.
- **"z-index בזמן גרירה?"** — מעלים z-index של הנגרר (class `.dragging`) כדי שיהיה מעל השאר.
- **"נגישות של גרירה?"** — חייב נתיב מקלדת מקביל (חצים/space) + הכרזות `aria-live`. זו ההצדקה ל-CDK בפרק 17.

## פאנלים מומלצים
`live-demo` → `interactions.demo` (פאנל מרכזי) · `code-inline` ל-directive ולקנבס · `diagram` (mermaid:
`pointerdown → pointermove(apply delta) → pointerup`, עם 3 ענפים: pos/size/stroke) · `callout alt` ל-canvas-מול-SVG
ו-ידני-מול-CDK. אין `code` עם region. הזכר את פרק 17 (CDK) במפורש.
