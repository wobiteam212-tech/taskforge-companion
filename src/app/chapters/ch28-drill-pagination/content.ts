import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 28 — Pagination, כל הדרכים (Interview Drill T2).
 * Wave 7 drill: enumerate all pagination modes (local slice, server offset,
 * server keyset/cursor, infinite scroll, virtual scroll), explain when to pick
 * each, and write the RxJS switchMap/debounce pipeline on the whiteboard.
 * Demo: pagination-modes.demo — 137 rows, pageSize=10, 700ms latency sim,
 * four tabs, rapid-×4 log showing cancelled vs applied requests.
 * Every fact here was runtime-verified against the live demo before authoring.
 */
export const CH28_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 28.1 */
    {
      id: '28.1',
      title: 'המודל המנטלי: פונקציית חלון',
      blocks: [
        {
          kind: 'p',
          text:
            'Pagination היא פונקציית חלון מעל קבוצה מסודרת. שתי שאלות מחליטות הכול: ' +
            '(1) **מי מחזיק את הדאטה** — אם הקליינט כבר מחזיק הכול, חותכים מקומית; אם השרת מחזיק, מבקשים חלון. ' +
            '(2) **איך ממענים את החלון** — offset (`page/pageSize`, פשוט אבל זז כשמכניסים שורות) ' +
            'או keyset/cursor (`after=…`, יציב, append-only).',
        },
        {
          kind: 'p',
          text:
            'בראיון יש שאלה כמעט קבועה: "מה הדרכים?" — והתשובה הטובה מונה חמש דרכים עם tradeoffs, ' +
            'לא רק "שולחים page ו-pageSize". הפרק הזה בונה את כל חמש הדרכים כדמו חי, כדי שתוכל לתאר מה אתה רואה בפועל.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה חמש דרכים ולא אחת?',
          body:
            'כל דרך פותרת בעיה אחרת: local slice לקבוצות קטנות וחסומות; server offset לממשק עם ספרור עמודים קלאסי; ' +
            'keyset לפיד יציב תחת הכנסות; infinite scroll לחוויית גלילה; virtual scroll לרשימות ענק. ' +
            'בחירה שגויה = ביצועים גרועים, drift, או חוויה שבורה.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `flowchart TD
  A["יש לנו קבוצה גדולה"] --> B{"מי מחזיק את הדאטה?"}
  B -->|"הקליינט מחזיק הכול"| C["local slice\\ncomputed חותך מערך"]
  B -->|"השרת מחזיק"| D{"איך ממענים?"}
  D -->|"offset — page/pageSize"| E["server offset\\nSkip + Take + total"]
  D -->|"keyset — after=lastId"| F["server keyset/cursor\\nWHERE rank > after LIMIT n"]
  C --> G["מיידי, בלי רשת"]
  E --> H["pager ממוספר\\nעלול ל-drift בהכנסות"]
  F --> I["פיד יציב\\nאין קפיצה לעמוד שרירותי"]`,
        caption: 'שתי שאלות מחליטות את האסטרטגיה — מי מחזיק, ואיך ממענים',
      },
    },

    /* ------------------------------------------------------------ 28.2 */
    {
      id: '28.2',
      title: 'תפריט חמש הדרכים',
      blocks: [
        {
          kind: 'p',
          text:
            'כשנשאלים "מה הדרכים למימוש pagination?" — מונים בקול, עם שם, מה, מתי וחיסרון לכל אחת. ' +
            'הרואיין שמונה חמש דרכים עם tradeoffs נשמע מנוסה; זה שאומר "שולחים page ו-pageSize" — לא.',
        },
        {
          kind: 'ul',
          items: [
            '**local slice** — `computed(() => items().slice(start, start+size))` — קבוצה קטנה שנטענה כבר — שולח הכול לקליינט',
            '**server offset** — `?page=&pageSize=` עם `Skip((p-1)*size).Take(size)` ומעטפת `total` — pager ממוספר קלאסי — drift בכתיבות ועמודים עמוקים איטיים',
            '**server keyset/cursor** — `?after=<lastId/rank>` עם `WHERE rank > @after ORDER BY rank LIMIT n` — פיד אינסופי, סדר יציב — אין קפיצה לעמוד שרירותי',
            '**infinite scroll** — `IntersectionObserver` על זקיף בתחתית, מצרף חלונות עם `scan` — פיד — קשה לקפוץ ולשתף מיקום',
            '**virtual scroll** — `cdk-virtual-scroll-viewport`, מרנדר רק שורות נראות — רשימות ענק — **זו אופטימיזציית רינדור, לא דרך דפדוף** — משלימת את כולן',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ההבדל בין virtual scroll ל-pagination?',
          body:
            'virtual scroll מרנדר רק שורות נראות (אופטימיזציית רינדור); pagination מגביל כמה דאטה מביאים (רשת ו-DB). ' +
            'הם משלימים ולא מחליפים — אפשר לשלב `cdk-virtual-scroll-viewport` עם server offset ולקבל את שניהם.',
        },
        {
          kind: 'term',
          name: 'offset pagination',
          definition:
            'דפדוף לפי מיקום מספרי: `Skip((page-1)*size).Take(size)`. פשוט לממש ולנווט, אך רגיש ל-drift: ' +
            'הכנסת שורה חדשה בזמן דפדוף מזיזה את כל ה-offset ויכולה לגרום לכפילות או דילוג בין עמודים.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () =>
          import('./demos/pagination-modes.demo').then(
            (m) => m.PaginationModesDemo,
          ),
        caption:
          'דמו חי: 137 שורות, latency מדומה 700ms, ארבעה טאבים — local · offset · RxJS switchMap · infinite scroll',
      },
    },

    /* ------------------------------------------------------------ 28.3 */
    {
      id: '28.3',
      title: 'local slice — מיידי, בלי רשת',
      blocks: [
        {
          kind: 'p',
          text:
            'local slice הוא הפשוט ביותר: כל הדאטה כבר בזיכרון, ואנחנו רק חותכים חלון ממנו. ' +
            'ב-Angular v22 עם signals זה `computed(() => allItems().slice(start(), start() + pageSize))`. ' +
            'השינוי מיידי — אין בקשת רשת, אין spinner, אין latency.',
        },
        {
          kind: 'p',
          text:
            'בדמו: לחיצה על עמוד בטאב "local" מחשבת מיד את החיתוך מתוך 137 השורות שנטענו פעם אחת. ' +
            'מתי בוחרים? כשהקבוצה קטנה וחסומה (קטלוג מוצרים של עסק קטן, רשימת ארצות, תגיות פרויקט).',
        },
        {
          kind: 'callout',
          tone: 'alt',
          title: 'מתי local slice הוא הבחירה הלא-נכונה',
          body:
            'כשהקבוצה גדולה (אלפי שורות ומעלה) — הטעינה הראשונית איטית, זיכרון הדפדפן גדל, ' +
            'ואם הנתונים משתנים תצטרכו ל-refresh ידני. לכל קבוצה שעלולה לגדול — בחרו server pagination.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'typescript',
        code: `// local slice — computed חותך מערך בזיכרון, מיידי
readonly page     = signal(1);
readonly pageSize = 10;

// כל הדאטה נטען פעם אחת
readonly allItems = signal<Item[]>([]);

// start מחושב מהעמוד
readonly start    = computed(() => (this.page() - 1) * this.pageSize);
readonly pageItems = computed(() =>
  this.allItems().slice(this.start(), this.start() + this.pageSize)
);`,
      },
    },

    /* ------------------------------------------------------------ 28.4 */
    {
      id: '28.4',
      title: 'server offset — Skip, Take, total',
      blocks: [
        {
          kind: 'p',
          text:
            'server offset שולח `?page=N&pageSize=10` לשרת. השרת מחזיר חלון ומעטפת total, ' +
            'וממנה הקליינט מחשב `totalPages = Math.ceil(total / pageSize)`. ' +
            'בדמו: כל מעבר עמוד שולח בקשה חדשה עם spinner של 700ms — בדיוק מה שקורה בשרת אמיתי.',
        },
        {
          kind: 'p',
          text:
            'בשרת (.NET): `var total = await query.CountAsync(ct); var items = await query.OrderBy(x => x.Id).Skip((page-1)*size).Take(size).ToListAsync(ct);`. ' +
            'ה-`total` מגיע בצד כי `COUNT(*)` רץ לפני ה-`LIMIT`, ורק ה-`LIMIT` מקטין את העברת הנתונים.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'drift בהכנסות מקבילות',
          body:
            'offset סופר מהתחלה. אם הכנסתם שורה בין עמוד 1 לעמוד 2, כל ה-offset זז — הדף השני יראה ' +
            'שורה כפולה (שנראתה גם בדף 1) או ידלג על שורה. keyset פותר זאת.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'csharp',
        code: `// server offset — מעטפת total כדי שהקליינט יידע כמה עמודים יש
public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Total,
    int Page,
    int PageSize
) {
    public int TotalPages => (int)Math.Ceiling((double)Total / PageSize);
}

// בריפו:
var total = await query.CountAsync(ct);
var items = await query
    .OrderBy(x => x.Id)
    .Skip((page - 1) * size)
    .Take(size)
    .ToListAsync(ct);
return new PagedResult<T>(items, total, page, size);`,
      },
    },

    /* ------------------------------------------------------------ 28.5 */
    {
      id: '28.5',
      title: 'server keyset/cursor — יציב תחת הכנסות',
      blocks: [
        {
          kind: 'p',
          text:
            'keyset (נקרא גם cursor pagination) ממען לפי ערך עוגן ולא לפי מיקום. ' +
            'הקליינט שולח `?after=<lastId>` והשרת מחזיר `WHERE rank > @after ORDER BY rank LIMIT n`. ' +
            'הכנסת שורה חדשה לא מזיזה את העוגן — החלון יציב.',
        },
        {
          kind: 'p',
          text:
            'היתרון הגדול: אין drift. אתם לא מספרים "תן לי שורות 11–20 מהסוף", ' +
            'אלא "תן לי N שורות שה-rank שלהן גדול מ-X". ' +
            'החיסרון: אי אפשר לקפוץ ל"עמוד 7" שרירותי — אתם יכולים רק ללכת קדימה לאורך הזרם.',
        },
        {
          kind: 'term',
          name: 'keyset / cursor pagination',
          definition:
            'דפדוף לפי ערך עוגן (rank, id, timestamp) ולא מיקום מספרי. ' +
            'הקליינט שולח `after=<lastValue>`, השרת מחזיר שורות שהערך שלהן גדול ממנו. ' +
            'יציב תחת הכנסות ומחיקות; מתאים לפידים ולגלילה אינסופית.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה נשבר ב-offset כשמכניסים שורות במקביל, ואיך keyset פותר?',
          body:
            'offset סופר מהתחלה, אז הכנסה מזיזה את החלון (רואים כפילות או דילוג). ' +
            'keyset ממען לפי ערך עוגן (rank/id), אז החלון יציב ללא תלות בהכנסות.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'csharp',
        code: `// keyset — יציב תחת הכנסות, אין drift
var items = await db.Issues
    .Where(i => i.Rank > afterRank)
    .OrderBy(i => i.Rank)
    .Take(size)
    .ToListAsync(ct);
// הקליינט שולח: ?after=<items.Last().Rank>
// אין total, אין "עמוד N מתוך M" — רק "יש עוד" (hasMore)`,
      },
    },

    /* ------------------------------------------------------------ 28.6 */
    {
      id: '28.6',
      title: 'infinite scroll — IntersectionObserver ו-scan',
      blocks: [
        {
          kind: 'p',
          text:
            'infinite scroll מצרף חלונות: כל פעם שהמשתמש מגיע לתחתית הרשימה, נטענים עוד פריטים ' +
            'ומתווספים לסוף (`scan`-style). הזקיף הוא אלמנט ריק בתחתית רשימת הגלילה; ' +
            '`IntersectionObserver` מגלה כשהוא נכנס ל-viewport ומפעיל טעינה.',
        },
        {
          kind: 'p',
          text:
            'בדמו: טאב "infinite" מציג 137 שורות. כשגוללים לסוף, ה-`IntersectionObserver` על הזקיף ' +
            'מזהה הצטלבות ומצרף חלון נוסף — עד שנגמרות השורות. ' +
            'כל צבירה היא `scan((acc, page) => [...acc, ...page], [])` מעל ה-Observable של הבקשות.',
        },
        {
          kind: 'callout',
          tone: 'alt',
          title: 'infinite scroll מול "טען עוד" כפתור',
          body:
            'כפתור "טען עוד" הוא גרסה מפורשת: המשתמש שולט מתי נטען הסגמנט הבא. ' +
            'מתאים כשרוצים שהמשתמש יוכל לחזור לאחרונה שראה (כי המיקום שמור ב-scroll). ' +
            'infinite scroll (אוטומטי) חלק יותר, אבל קשה לשתף/לסמן מיקום.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'typescript',
        code: `// infinite scroll — IntersectionObserver על זקיף + scan לצבירה
ngAfterViewInit() {
  const sentinel = this.sentinelRef.nativeElement;
  const obs = new IntersectionObserver(
    entries => {
      if (entries[0].isIntersecting && !this.loading() && this.hasMore()) {
        this.loadNextPage();
      }
    },
    { threshold: 0.1 }
  );
  obs.observe(sentinel);
  // ניקוי ב-DestroyRef
  this.destroyRef.onDestroy(() => obs.disconnect());
}

// צבירת תוצאות (scan-style):
// items = [...previousItems, ...newPage]`,
      },
    },

    /* ------------------------------------------------------------ 28.7 */
    {
      id: '28.7',
      title: 'ה-RxJS: switchMap הוא הכוכב',
      blocks: [
        {
          kind: 'p',
          text:
            '`switchMap` הוא האופרטור שנשאלים עליו הכי הרבה בהקשר של pagination. ' +
            'כשהמשתמש לוחץ מהר על עמוד 2, עמוד 3, עמוד 4 — `switchMap` **מבטל** את הבקשות הקודמות ' +
            'ומשאיר רק את הבקשה האחרונה. בלעדיו, תשובות מוקדמות יכולות להגיע אחרי מאוחרות (race condition).',
        },
        {
          kind: 'p',
          text:
            'בדמו: לחצו על "rapid ×4" בטאב RxJS. הלוג יראה `request page N` לכל בקשה, ' +
            'ואז `cancelled page N` (קו חוצה, אדום) לשלוש הראשונות, ' +
            'ורק `applied page N` (ירוק) לאחרונה. זה בדיוק `switchMap` בפעולה.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה switchMap ולא mergeMap כאן?',
          body:
            'רוצים את העמוד האחרון בלבד. `switchMap` מבטל את הבקשה הישנה כשמגיעה חדשה. ' +
            '`mergeMap` היה משאיר תוצאות ממירוץ (תוצאות לא בסדר). ' +
            '`concatMap` היה מעכב בתור (כל בקשה ממתינה לקודמת). ' +
            '`exhaustMap` היה מתעלם מהחדשות עד שהנוכחית נגמרת.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `flowchart LR
  A["page$ מסר"] --> SW{"switchMap"}
  SW -->|"בקשה ישנה פעילה"| C["❌ cancel בקשה ישנה"]
  SW -->|"בקשה חדשה"| D["http.get חדש"]
  D --> E["תוצאה מוחזרת"]
  C --> F["תוצאה נזרקת"]`,
        caption:
          'switchMap מבטל בקשות ישנות — רק הבקשה האחרונה מחזירה תוצאה',
      },
    },

    /* ------------------------------------------------------------ 28.8 */
    {
      id: '28.8',
      title: 'debounceTime ו-distinctUntilChanged — על חיפוש, לא על דפדוף',
      blocks: [
        {
          kind: 'p',
          text:
            '`debounceTime(300)` ממתין לשקט (300ms בלי הקלדה) לפני שמוציא ערך. ' +
            '`distinctUntilChanged()` מסנן ערכים זהים ברצף — לא שולח בקשה אם הקלט לא השתנה. ' +
            'יחד הם מונעים ירי בקשה על כל הקלדה בשדה חיפוש.',
        },
        {
          kind: 'p',
          text:
            'שימו לב: על *דפדוף* לא שמים `debounceTime` — דווקא רוצים לראות את כל הבקשות נורות, ' +
            'ו-`switchMap` מבטל. `debounceTime` על דפדוף היה מונע מה-`switchMap` לעשות את עבודתו.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'איפה שמים debounce ולמה?',
          body:
            'על קלט חיפוש, לא על דפדוף. כדי לא לירות בקשה על כל תו שהמשתמש מקליד. ' +
            'על דפדוף — `switchMap` הוא הפתרון, לא `debounce`.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'typescript',
        code: `// search$ עם debounce; page$ ישיר לswitchMap
const page$   = toObservable(this.page);
const search$ = toObservable(this.search).pipe(
  debounceTime(300),
  distinctUntilChanged()
);`,
      },
    },

    /* ------------------------------------------------------------ 28.9 */
    {
      id: '28.9',
      title: 'tap, take, takeUntilDestroyed — שאר האופרטורים',
      blocks: [
        {
          kind: 'p',
          text:
            '`tap` מבצע תופעת לוואי בלי לשנות את הזרם: `loading.set(true)`, scroll-to-top, לוג. ' +
            'שמים `tap(() => this.loading.set(true))` לפני `switchMap` ו-`tap(() => this.loading.set(false))` אחריו. ' +
            'כך ה-spinner עולה עם כל בקשה וירד כשהיא מסתיימת.',
        },
        {
          kind: 'p',
          text:
            '`take(1)` / `firstValueFrom` הם לפקודה בודדת (one-shot): מנויים שנסגרים לאחר ערך ראשון. ' +
            '`takeUntilDestroyed()` הוא teardown אוטומטי — הזרם נסגר עם ה-component, ללא leak. ' +
            'בדמו: כל הזרמים מנוקים ב-`DestroyRef` (timers ו-`IntersectionObserver`).',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'גשר signals ו-RxJS',
          body:
            '`toObservable(pageSignal)` הופך signal ל-Observable כדי לחבר אותו לאופרטורים. ' +
            '`toSignal(observable$)` הופך בחזרה. או פשוט `httpResource` עם URL שהוא `computed` — ' +
            'כפי שעושה TaskForge ב-`issues.store.ts` בפרק 13.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'typescript',
        code: `// tap לתופעות לוואי, takeUntilDestroyed לניקוי
combineLatest([page$, search$]).pipe(
  map(([page, search]) => ({ page, search })),
  tap(() => this.loading.set(true)),      // spinner עולה
  switchMap(q => this.http.get<PagedResult<Issue>>(url(q))),
  tap(() => this.loading.set(false)),     // spinner יורד
  takeUntilDestroyed(),                  // ניקוי אוטומטי
).subscribe(res => this.result.set(res));`,
      },
    },

    /* ------------------------------------------------------------ 28.10 */
    {
      id: '28.10',
      title: 'קוד-ליבה: הצינור המלא',
      blocks: [
        {
          kind: 'p',
          text:
            'הצינור המלא משלב `page$` ישיר ל-`switchMap`, ו-`search$` דרך `debounce`. ' +
            '`combineLatest` מאחד את שניהם לאובייקט שאילתה אחד. ' +
            'זה בדיוק הדפוס שמיישמים ב-RxJS tab בדמו, עם הלוג שמראה request/cancelled/applied.',
        },
        {
          kind: 'p',
          text:
            'בראיון כשמבקשים לכתוב pagination על הלוח — זה הקוד שכותבים. ' +
            'מתחילים עם `toObservable` על ה-signal, ממשיכים ל-`switchMap`, ומסיימים ב-`takeUntilDestroyed`.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'scan לצבירה ב-infinite scroll',
          body:
            '`scan((acc, page) => [...acc, ...page], [])` הוא האלטרנטיבה ל-infinite scroll: ' +
            'במקום להחליף את התוצאה, מצרפים. שמים אותו אחרי `switchMap` (שעדיין מבטל בקשות ישנות), ' +
            'לפני ה-`subscribe`.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'typescript',
        code: `// הצינור המלא: page$ ישיר, search$ דרך debounce; combineLatest מאחד
const page$   = toObservable(this.page);
const search$ = toObservable(this.search).pipe(
  debounceTime(300),
  distinctUntilChanged()
);

combineLatest([page$, search$]).pipe(
  map(([page, search]) => ({ page, search })),
  tap(() => this.loading.set(true)),
  switchMap(q =>
    this.http.get<PagedResult<Issue>>(url(q))   // מבטל בקשה ישנה
  ),
  tap(() => this.loading.set(false)),
  takeUntilDestroyed(),
).subscribe(res => this.result.set(res));`,
      },
    },

    /* ------------------------------------------------------------ 28.11 */
    {
      id: '28.11',
      title: 'client מול server — איך מחליטים?',
      blocks: [
        {
          kind: 'p',
          text:
            'הכלל הוא גודל הקבוצה. קבוצה קטנה וחסומה (עד כמה מאות שורות) — `local slice`. ' +
            'קבוצה גדולה או לא חסומה (אלפים ומעלה, או שגדלה) — `server pagination`. ' +
            'אם גם צריך סידור יציב תחת הכנסות — `keyset`. אם ממשק גלילה — `infinite`.',
        },
        {
          kind: 'p',
          text:
            'ה-137 שורות בדמו הן על הגבול — בפועל תעבירו אותן local. ' +
            'אבל 10,000 issues ב-TaskForge האמיתי? חייב server. ' +
            'כי מעבר ל-~500 שורות, גם ה-initial load נהיה ניכר.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'client מול server — איך מחליטים?',
          body:
            'גודל הקבוצה. קטן וחסום: local. גדול/לא חסום: server. ' +
            'ואם הקבוצה משתנה תחת הכנסות ורוצים יציבות: keyset במקום offset.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `flowchart TD
  A["כמה שורות?"] --> B{"עד ~500\\nחסום?"}
  B -->|"כן"| C["local slice\\ncomputed חותך"]
  B -->|"לא"| D{"צריך pager\\nממוספר?"}
  D -->|"כן"| E["server offset\\n+ total + TotalPages"]
  D -->|"לא / פיד"| F{"צריך יציבות\\ntחת הכנסות?"}
  F -->|"כן"| G["server keyset/cursor"]
  F -->|"לא"| H["infinite scroll\\n+ IntersectionObserver"]`,
        caption: 'עץ בחירה — כל שאלה מצמצמת לאפשרות אחת',
      },
    },

    /* ------------------------------------------------------------ 28.12 */
    {
      id: '28.12',
      title: 'איך מחשבים total ו-TotalPages?',
      blocks: [
        {
          kind: 'p',
          text:
            'בשרת: `total = await query.CountAsync(ct)` — `COUNT(*)` בלי `LIMIT`. ' +
            'ואז `items = Skip + Take` — עם `LIMIT`. ' +
            'שני השאילתות רצות יחד (EF Core מייצר שתיהן). ' +
            '`TotalPages = Math.Ceiling(total / pageSize)` — תמיד מעגלים למעלה כדי לא לאבד שורות.',
        },
        {
          kind: 'p',
          text:
            'החישוב בקליינט: `page X / Y` — כאשר X הוא `this.page()` ו-Y הוא `this.result()?.totalPages`. ' +
            'ה-pager מציג כפתורי ניווט רק כשיש `totalPages > 1`, ומשבית "הבא" כשמגיעים לסוף.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'איך מחושב total/TotalPages?',
          body:
            'COUNT בשרת לצד החלון, ו-`Math.Ceiling(total / pageSize)`. ' +
            'חשוב: COUNT נספר לפני LIMIT — לא אחריו.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'csharp',
        code: `// שתי שאילתות מאותה query — count ואז חלון
var total = await query.CountAsync(ct);          // COUNT(*)
var items = await query
    .OrderBy(x => x.Id)
    .Skip((page - 1) * size)
    .Take(size)
    .ToListAsync(ct);                            // LIMIT + OFFSET

// TotalPages — תמיד מעגלים למעלה
public int TotalPages => (int)Math.Ceiling((double)Total / PageSize);`,
      },
    },

    /* ------------------------------------------------------------ 28.13 */
    {
      id: '28.13',
      title: 'הדמו בפעולה: rapid ×4 וה-log',
      blocks: [
        {
          kind: 'p',
          text:
            'הטאב "RxJS switchMap" הוא המקום לראות את כל הדפוסים יחד. ' +
            'כפתור "rapid ×4" יורה ארבע קפיצות-עמוד ב-150ms הפרש. ' +
            'הלוג מראה `request page N` לכל בקשה שיצאה, ' +
            '`cancelled page N` (קו חוצה, אדום) לכל בקשה ש-`switchMap` ביטל, ' +
            'ו-`applied page N` (ירוק) רק לאחרונה שהגיעה.',
        },
        {
          kind: 'p',
          text:
            'שדה החיפוש עובר `debounceTime(300)+distinctUntilChanged`: הקלידו מהר וראו שהבקשה מגיעה רק אחרי שהפסקתם. ' +
            'ה-spinner משקף את `loading` signal, שמוסט ב-`tap` לפני ואחרי `switchMap`.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'הלוג הוא ה-teaching tool',
          body:
            'בראיון, לא מספיק לתאר — אפשר לפתוח את הדמו ולהראות: "כאן נשלחות 4 בקשות, ' +
            'שלוש מהן בוטלו על ידי switchMap, ורק האחרונה הוחלה." ' +
            'ראיה חיה שווה יותר מהסבר תיאורטי.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () =>
          import('./demos/pagination-modes.demo').then(
            (m) => m.PaginationModesDemo,
          ),
        caption:
          'לחצו על "rapid ×4" וצפו בלוג: cancelled (אדום) לבקשות שבוטלו, applied (ירוק) לאחרונה',
      },
    },

    /* ------------------------------------------------------------ 28.14 */
    {
      id: '28.14',
      title: 'virtual scroll — אורתוגונלי לדפדוף',
      blocks: [
        {
          kind: 'p',
          text:
            '`cdk-virtual-scroll-viewport` הוא טריק הרינדור: במקום לרנדר 10,000 DOM nodes, ' +
            'הוא מרנדר רק את השורות הנראות בחלון הגלילה. ' +
            'זה **לא** צורה לדפדף — זו אופטימיזציית רינדור שמשלימה כל אחת מארבע הדרכים האחרות.',
        },
        {
          kind: 'p',
          text:
            'הטריק בראיון: כשמציעים virtual scroll כ"פתרון ל-pagination" — מתקנים בעדינות: ' +
            '"virtual scroll מרנדר רק שורות נראות (רינדור); pagination מגביל כמה דאטה מביאים (רשת ו-DB). ' +
            'אפשר לשלב את שניהם — server offset שמביא 100 שורות, ו-virtual scroll שמרנדר מהן 20."',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ההבדל בין virtual scroll ל-pagination?',
          body:
            'virtual scroll מרנדר רק שורות נראות (אופטימיזציית רינדור). ' +
            'pagination מגביל כמה דאטה מביאים (רשת ו-DB). ' +
            'הם משלימים — אפשר לשלב `cdk-virtual-scroll-viewport` עם server offset.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'html',
        code: `<!-- virtual scroll — CDK מרנדר רק שורות נראות -->
<cdk-virtual-scroll-viewport itemSize="48" style="height: 400px">
  <div *cdkVirtualFor="let item of items">
    {{ item.title }}
  </div>
</cdk-virtual-scroll-viewport>
<!-- itemSize=48 = גובה שורה בפיקסלים; height חובה על ה-viewport -->`,
      },
    },

    /* ------------------------------------------------------------ 28.15 */
    {
      id: '28.15',
      title: 'סיכום לראיון: מה לומר',
      blocks: [
        {
          kind: 'p',
          text:
            'כשנשאלים "איך מממשים pagination?" — בונים את התשובה בשלושה שלבים: ' +
            '(1) מונים את חמש הדרכים עם tradeoffs. ' +
            '(2) מסבירים את עץ הבחירה (גודל/יציבות/חוויה). ' +
            '(3) כותבים את הצינור על הלוח: `toObservable` על page signal, `switchMap`, `debounceTime` על search, `takeUntilDestroyed`.',
        },
        {
          kind: 'p',
          text:
            'שני הפרטים שמבדילים תשובה טובה מרגילה: ' +
            '(א) "virtual scroll זו לא דרך לדפדף — זו אופטימיזציית רינדור". ' +
            '(ב) "`debounce` שמים על חיפוש, לא על דפדוף — על דפדוף `switchMap` מבטל".',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'איך בחרת בין offset לkeyset בפרויקט שלך?',
          body:
            'אם נדרש ממשק עמודים ממוספר (1, 2, 3…) ואין עדכונים מקבילים תכופים: offset. ' +
            'אם הנתונים גדלים כל הזמן (פיד, לוג, events) ויציבות חשובה: keyset. ' +
            'TaskForge issues list: offset (עם `?page=1&pageSize=30`). פיד פעילות: keyset.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `flowchart LR
  A["שאלה בראיון"] --> B["מנה 5 דרכים\\n+ tradeoffs"]
  B --> C["עץ בחירה:\\nגודל/יציבות/חוויה"]
  C --> D["כתוב על הלוח:\\ntoObservable+switchMap\\n+debounce+takeUntilDestroyed"]
  D --> E["הדגש:\\nvirtual scroll = רינדור\\ndebounce = חיפוש בלבד"]`,
        caption: 'ארבעה שלבים לתשובה שמרשימה',
      },
    },
  ],

  quiz: [
    {
      q: 'איזה אופרטור RxJS משתמשים בשינוי עמוד ולמה?',
      options: [
        'mergeMap — כי מאפשר בקשות מקבילות',
        'switchMap — כי מבטל את הבקשה הישנה כשמגיעה חדשה',
        'concatMap — כי שומר על סדר הבקשות',
        'exhaustMap — כי מתעלם מלחיצות עד שהבקשה הנוכחית נגמרת',
      ],
      answer: 1,
      explain:
        'switchMap מבטל את הבקשה הישנה כשמגיע ערך חדש מה-source. ' +
        'כך רק עמוד ה"אחרון" שנלחץ מחזיר תוצאה. mergeMap היה גורם race condition. ' +
        'concatMap היה מעכב — כל בקשה ממתינה לקודמת. exhaustMap היה מתעלם מלחיצות מהירות.',
    },
    {
      q: 'מה ההבדל בין offset pagination ל-keyset pagination?',
      options: [
        'offset מהיר יותר ב-DB תמיד',
        'keyset ממען לפי ערך עוגן ויציב תחת הכנסות; offset ממען לפי מיקום ויכול לגרום ל-drift',
        'keyset תומך בקפיצה לעמוד שרירותי; offset לא',
        'אין הבדל מעשי — שניהם שולחים page ו-pageSize',
      ],
      answer: 1,
      explain:
        'offset סופר `Skip(N)` מהתחלה — הכנסת שורה חדשה מזיזה את כל ה-offset (drift). ' +
        'keyset ממען לפי ערך (`WHERE rank > afterRank`) — החלון יציב גם תחת הכנסות. ' +
        'החיסרון של keyset: אין קפיצה לעמוד שרירותי.',
    },
    {
      q: 'מה עושים עם debounceTime בהקשר של pagination?',
      options: [
        'שמים אותו על כל בקשת עמוד כדי לא לעמיס את השרת',
        'שמים אותו רק על שדה חיפוש, לא על דפדוף',
        'שמים אותו אחרי switchMap כדי לאגד תשובות',
        'לא משתמשים בו בכלל ב-pagination',
      ],
      answer: 1,
      explain:
        'debounceTime על קלט חיפוש מונע ירי בקשה על כל תו. ' +
        'על דפדוף — לא שמים debounce. דווקא רוצים שכל לחיצה על עמוד תיצור בקשה, ' +
        'וה-switchMap מבטל את הישנות. debounce על דפדוף היה מסתיר את ביטול ה-switchMap.',
    },
    {
      q: 'מהי הנוסחה ל-TotalPages בשרת?',
      options: [
        'total / pageSize (חלוקה שלמה)',
        'Math.Floor(total / pageSize)',
        'Math.Ceiling(total / pageSize)',
        'total * pageSize',
      ],
      answer: 2,
      explain:
        'Math.Ceiling (עיגול למעלה) מבטיח שגם "שארית" שורות מקבלת עמוד נפרד. ' +
        'אם יש 137 שורות ו-pageSize=10: 137/10 = 13.7, Math.Ceiling = 14 עמודים. ' +
        'חלוקה שלמה (13) היה אובד את 7 השורות האחרונות.',
    },
    {
      q: 'מה עושה scan((acc, page) => [...acc, ...page], []) ב-infinite scroll?',
      options: [
        'מחליף את התוצאה הנוכחית בדף החדש',
        'מאפס את הרשימה בכל טעינה',
        'צובר (מצרף) דפים חדשים לרשימה המצטברת',
        'מבטל דפים ישנים שנטענו',
      ],
      answer: 2,
      explain:
        'scan הוא reduce שרץ על זרם: הוא שומר accumulator ומעדכן אותו עם כל ערך חדש. ' +
        'כאן: `[...acc, ...page]` מצרף את הדף החדש לרשימה שנצברה. ' +
        'התוצאה: הרשימה גדלה עם כל גלילה — זה בדיוק infinite scroll.',
    },
    {
      q: 'מה ההבדל בין virtual scroll ל-pagination מבחינת מה הם עושים?',
      options: [
        'virtual scroll מביא פחות דאטה מהשרת; pagination מרנדר פחות DOM',
        'הם זהים — שניהם מגבילים כמה שורות נראות',
        'virtual scroll מרנדר רק שורות נראות (רינדור); pagination מגביל כמה דאטה מביאים (רשת)',
        'virtual scroll עובד רק עם Angular CDK; pagination עובד רק עם HTTP',
      ],
      answer: 2,
      explain:
        'virtual scroll הוא אופטימיזציית רינדור: כל הדאטה בזיכרון, אבל רק שורות נראות ב-DOM. ' +
        'pagination הוא אופטימיזציית רשת/DB: פחות דאטה עובר על הקו. ' +
        'אפשר (ורצוי) לשלב: server pagination מביא 100 שורות, virtual scroll מרנדר מהן 20.',
    },
    {
      q: 'מה takeUntilDestroyed() עושה בצינור ה-RxJS?',
      options: [
        'משהה את הצינור עד שהקומפוננט נהרס',
        'סוגר את ה-subscription אוטומטית כשהקומפוננט נהרס — מונע memory leak',
        'מסנן תוצאות שהגיעו אחרי הרס הקומפוננט',
        'מבטל בקשות HTTP פעילות בהרס',
      ],
      answer: 1,
      explain:
        'takeUntilDestroyed() מקבל DestroyRef ומשלים את ה-Observable כשהקומפוננט נהרס. ' +
        'בלעדיו, subscribe שנשאר פתוח גם אחרי הרס הקומפוננט הוא memory leak — ' +
        'הבקשות ממשיכות להגיע ל-component שכבר לא קיים.',
    },
  ],

  proveIt: [
    {
      title: 'rapid ×4 — ראו cancelled vs applied',
      body:
        'פתחו את הדמו החי בכתובת `http://localhost:4400/chapters/drill-pagination`. ' +
        'לחצו על הטאב "RxJS switchMap". לחצו על כפתור "rapid ×4". ' +
        'הסתכלו בלוג שמתחת.',
      expect:
        'הלוג מראה 4 שורות "request page N"; 3 מהן נשארות עם קו חוצה ואדומות (cancelled); ' +
        'רק האחרונה מסומנת ירוק (applied).',
    },
    {
      title: 'debounce בשדה החיפוש',
      body:
        'בטאב "RxJS switchMap", הקלידו מהר 3-4 אותיות בשדה החיפוש. ' +
        'הסתכלו בלוג ובספינר.',
      expect:
        'בקשה אחת בלבד נורית (אחרי שהפסקתם להקליד, latency של ~300ms); ' +
        'לא בקשה על כל תו. הספינר מופיע פעם אחת.',
    },
    {
      title: 'local slice — אפס latency',
      body:
        'פתחו את הדמו ולחצו על הטאב "local". לחצו על כפתורי ניווט העמוד לאחור ולפנים.',
      expect:
        'המעבר בין עמודים מיידי — אין spinner, אין latency. ' +
        'הנתונים מחושבים מהמערך בזיכרון בלבד.',
    },
    {
      title: 'infinite scroll — גלילה וצבירה',
      body:
        'לחצו על הטאב "infinite". גללו לתחתית הרשימה לאט.',
      expect:
        'כשמגיעים לתחתית, מופיע spinner ונטענות שורות נוספות שמתווספות לרשימה. ' +
        'הרשימה גדלה בהדרגה עד 137 שורות.',
    },
    {
      title: 'offset — page X / Y ו-total',
      body:
        'לחצו על הטאב "server offset". שימו לב לכותרת "page X / Y" ולספינר בין עמודים.',
      expect:
        'כל מעבר עמוד מציג spinner (700ms latency מדומה); ' +
        'הכותרת מציגה "page 1 / 14" (137 שורות חלקי 10, מעוגל למעלה).',
    },
  ],

  exercise: {
    prompt:
      'הוסיפו טאב "keyset" לדמו החי: שימוש ב-`after=<lastId>` במקום `page=N`. ' +
      'הדמו יסמלץ endpoint שמחזיר N שורות שה-id שלהן גדול מ-`after`, ' +
      'עם כפתור "הבא" (ולא pager ממוספר).',
    tasks: [
      'הוסיפו state: `lastId = signal(0)` ו-`hasMore = signal(true)`.',
      'הוסיפו פונקציה `loadNext()` שמשלחת בקשה עם `?after=<lastId>` ומעדכנת `lastId` ל-id הגדול ביותר שחזר.',
      'הציגו רשימה שמצטברת (`[...prev, ...page]`) ו-`hasMore` להסתרת כפתור "הבא" כשנגמרות השורות.',
      'ודאו שאין drift: הכניסו שורה חדשה ל-dataset המדומה — היא לא אמורה לשנות את מה שכבר נטען.',
    ],
    acceptance: [
      'לחיצה על "הבא" מוסיפה שורות לרשימה המצטברת (לא מחליפה).',
      'כפתור "הבא" מוסתר כשחזרו פחות שורות מ-pageSize (hasMore=false).',
      'הוספת שורה לתחילת ה-dataset לא משנה שורות שכבר נטענו.',
      'כל timer/observer מנוקה ב-DestroyRef.',
    ],
  },
};
