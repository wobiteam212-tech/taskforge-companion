import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 22 — Performance & Accessibility: מודדים, לא מנחשים.
 * Wave 5 ch22. No backend changes. Frontend:
 *   - IdlePreloadStrategy (new file) — custom PreloadingStrategy, timer(1500) then load()
 *   - provideRouter +withPreloading(IdlePreloadStrategy) in app.config.ts
 *   - skip-link + <main id="main-content" tabindex="-1"> in app.html
 *   - skip-link CSS + global reduced-motion net in app.scss
 *   - @defer prefetch on idle in issue-board.html
 * Verified runtime: lazy chunks preload on idle (project-board ~120kB,
 * issue-detail ~89kB, dashboard ~16kB, not-found ~650B);
 * skip-link focuses #main-content; @defer prefetch fetches CDK ahead of scroll.
 * No new client dependency.
 */
export const CH22_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 22.1 */
    {
      id: '22.1',
      title: 'הפרק: מודדים, לא מנחשים',
      blocks: [
        {
          kind: 'p',
          text:
            'בנינו אפליקציה שלמה: 21 פרקים, מסד נתונים, auth, signal stores, kanban drag-and-drop, ' +
            'markdown editor, dashboard עם גרפים. כל זה עובד — אבל עדיין שני שאלות נשארות: ' +
            'האם האפליקציה מהירה? והאם כל אדם יכול להשתמש בה?',
        },
        {
          kind: 'p',
          text:
            'פרק 22 עונה על שתיהן דרך אותו עיקרון: מדידה לפני פתרון. ביצועים שגויים נגרמים מנחשים ' +
            'היכן הבעיה — וסוגרים את המקום הלא-נכון. נגישות שגויה נגרמת מהנחה שמה שנראה טוב ' +
            'מתפקד לכולם. הפרק הזה מלמד לבדוק, למדוד, ולתקן בדיוק.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'נגישות: "נוספה" או "נבנתה"?',
          body:
            'TaskForge בנה נגישות לאורך כל הדרך, לא כתוספת: ' +
            '`<dialog>` נטיבי (פרק 09 + פרק 16) נותן focus-trap + Escape בחינם; ' +
            'kanban (פרק 17) כולל DnD מקלדת מלא ואזור `aria-live` להודעות; ' +
            'toast service (פרק 09) מפרסם ב-`aria-live`; ' +
            '`prefers-reduced-motion` כובה אנימציות בפרק 17/18/19; ' +
            'כפתורים נושאים `aria-pressed` ו-`aria-label`. ' +
            'פרק 22 מוסיף את שכבת הגלובל (skip-link + landmark) ומלמד לאמת — לא "לתקן" הרבה.',
        },
        {
          kind: 'term',
          name: 'Core Web Vitals',
          definition:
            'שלושת מדדי הביצועים של Google שמשפיעים על SEO ו-UX: LCP (מתי תוכן גדול נטען), ' +
            'INP (זמן תגובה לאינטרקציה), CLS (קפיצות layout). ' +
            'Lighthouse מחשב אותם ומציג ציון 0-100. הם נמדדים ב-field (RUM) ו-lab (Lighthouse).',
        },
      ],
      panel: {
        kind: 'filetree',
        title: 'קבצים חדשים ומשתנים בפרק 22',
        lines: [
          { text: 'client/', depth: 0, kind: 'dir' },
          { text: 'src/app/core/perf/', depth: 1, kind: 'dir' },
          { text: 'idle-preload.strategy.ts', depth: 2, kind: 'file', badge: 'new' },
          { text: 'src/app/', depth: 1, kind: 'dir' },
          { text: 'app.config.ts', depth: 2, kind: 'file', badge: 'mod' },
          { text: 'app.html', depth: 2, kind: 'file', badge: 'mod' },
          { text: 'app.scss', depth: 2, kind: 'file', badge: 'mod' },
          { text: 'src/app/features/issues/', depth: 1, kind: 'dir' },
          { text: 'issue-board.html', depth: 2, kind: 'file', badge: 'mod' },
          { text: 'server/', depth: 0, kind: 'dir' },
          { text: '(ללא שינויים — backend לא נגע)', depth: 1, kind: 'comment' },
        ],
        caption: 'קובץ אחד חדש + ארבעה שינויים — אפס תלות חדשה, אפס backend',
      },
    },

    /* ------------------------------------------------------------ 22.2 */
    {
      id: '22.2',
      title: 'Bundle anatomy: code-splitting ו-lazy chunks',
      blocks: [
        {
          kind: 'p',
          text:
            'כשמריצים `ng build` האנגולר מייצר קבצי JavaScript מפוצלים. ' +
            'ה-main chunk נטען תמיד; כל route שהוגדר עם `loadComponent` או `loadChildren` ' +
            'הופך ל-lazy chunk שנטען רק כשמנווטים אליו — זה code-splitting. ' +
            'הבנייה מדפיסה את גודל כל chunk; זוהי המדידה הראשונה שכדאי לבצע.',
        },
        {
          kind: 'p',
          text:
            'TaskForge נבנה עם lazy routes מפרק 10: ' +
            'ה-lazy chunk של `project-board` שוקל כ-120kB, ' +
            '`issue-detail` כ-89kB, `dashboard` כ-16kB (קטן כי רובו computed+chart), ' +
            'ו-`not-found` כ-650 בייטים בלבד. ' +
            'אלה מספרים אמיתיים מ-build — לא הערכות.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'source-map-explorer ו-esbuild metafile',
          body:
            'שני כלים להבנה עמוקה יותר: ' +
            '`source-map-explorer` (מותקן גלובלית) קורא sourcemap ומראה visualizer של אילו modules ' +
            'תורמים כמה לכל chunk. ' +
            '`ng build --stats-json` מייצר `stats.json` בפורמט esbuild metafile — ' +
            'העלו אותו ל-`esbuild.github.io/analyze/` לתרשים בר מרשים. ' +
            'שניהם עוזרים לאתר תלות שנכנסה לא בכוונה לחבילה הראשית.',
        },
        {
          kind: 'term',
          name: 'code-splitting',
          definition:
            'פיצול ה-JavaScript bundle לחתיכות שנטענות לפי דרישה. ' +
            'Angular CLI מבצע זאת אוטומטית לכל route מסוג `loadComponent`/`loadChildren`. ' +
            'תוצאה: הטעינה הראשונה מהירה (רק main bundle), נווטים עתידיים טוענים רק מה שנחוץ.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'איך code-splitting משפר את TTI?',
          body:
            'TTI (Time to Interactive) נמדד מהרגע שהדף נטען ועד שהמשתמש יכול לאינטרקט. ' +
            'bundle גדול = פרסור + הידור = זמן חסום. ' +
            'code-splitting מוריד את ה-main bundle — ה-JS שחייב להיות מוכן לפני כל אינטרקציה. ' +
            'ה-routes הנוספים נטענים רק כשמנווטים אליהם, לא בטעינה הראשונה.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'bash',
        code:
          '# ng build — פלט אמיתי (raw size, לא gzip)\n' +
          'Chunk files                      Raw size\n' +
          'main-*.js                        (main bundle)\n' +
          'chunk-project-board-*.js         ~120 kB\n' +
          'chunk-issue-detail-*.js          ~89  kB\n' +
          'chunk-dashboard-*.js             ~16  kB\n' +
          'chunk-not-found-*.js             ~650 B\n\n' +
          '# כלי ניתוח\n' +
          '# ng build --source-map && source-map-explorer dist/*/browser/chunk-project-board-*.js\n' +
          '# ng build --stats-json  # ואז esbuild.github.io/analyze/',
      },
    },

    /* ------------------------------------------------------------ 22.3 */
    {
      id: '22.3',
      title: 'הבעיה: eager vs lazy-only vs preload',
      blocks: [
        {
          kind: 'p',
          text:
            'שלוש גישות לניהול lazy routes. Eager: טוענים הכול מראש — main bundle מקבל את כל הקוד, ' +
            'הטעינה הראשונה איטית, אבל ניווט עתידי מיידי. ' +
            'Lazy-only (ברירת המחדל לפני פרק 22): הורדת chunk רק כשמנווטים — ' +
            'טעינה ראשונה מהירה, אבל ניווט ראשון לכל route חדש מציג ספינר.',
        },
        {
          kind: 'p',
          text:
            'ה-middle ground: preloading. הטעינה הראשונה מהירה (lazy), ' +
            'אבל מיד אחר כך — ברקע ובשקט — מורידים את שאר ה-chunks. ' +
            'כשהמשתמש מנווט, ה-chunk כבר בזיכרון המטמון וניווט הוא מיידי. ' +
            'זה בדיוק מה ש-`IdlePreloadStrategy` מממש.',
        },
        {
          kind: 'term',
          name: 'preloading strategy',
          definition:
            'מנגנון Angular שקובע מתי לטעון lazy routes ברקע. ' +
            'מובנים: `NoPreloading` (כלום), `PreloadAllModules` (הכול מיד). ' +
            'מותאם-אישית: מממשים `PreloadingStrategy` ומחזירים Observable — ' +
            '`of(null)` לדחות, `load()` לטעון. מחובר ל-`provideRouter` דרך `withPreloading`.',
        },
        {
          kind: 'callout',
          tone: 'alt',
          title: 'PreloadAllModules — מתי כן?',
          body:
            '`PreloadAllModules` הוא ה-eager built-in: מתחיל לטעון את כל ה-routes מיד אחרי bootstrap. ' +
            'מתאים כשיש מעט routes קלים ורוצים פשטות. ' +
            'הבעיה: הוא מתחרה על רוחב פס עם הטעינה הראשונה עצמה — ' +
            'אם המשתמש מנווט ב-500ms הראשונות, הוא מתחרה עם ה-chunks שמורדים. ' +
            '`IdlePreloadStrategy` דוחה את ה-prefetch ב-`timer(1500)` כדי לתת למסך הראשון לסיים.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `flowchart TD
  A["eager\n(all in main bundle)"] --> |"main bundle גדול\nניווט מיידי"| A1["first paint SLOW\nno spinner ever"]
  B["lazy-only\n(default before ch22)"] --> |"main bundle קטן\nכל ניווט: download chunk"| B1["first paint FAST\nspinner on nav"]
  C["preload on idle\n(ch22 IdlePreloadStrategy)"] --> |"main bundle קטן\nchunks נטענים ברקע"| C1["first paint FAST\nnavigation INSTANT"]
  style C fill:var(--accent-subtle)`,
        caption: 'שלוש גישות — IdlePreloadStrategy (ch22) מחברת את יתרונות שתיהן',
      },
    },

    /* ------------------------------------------------------------ 22.4 */
    {
      id: '22.4',
      title: '`IdlePreloadStrategy`: הקוד',
      blocks: [
        {
          kind: 'p',
          text:
            '`IdlePreloadStrategy` ממש את `PreloadingStrategy` — ממשק בן שיטה אחת: ' +
            '`preload(route, load)`. הלוגיקה: אם ה-route מסמן `data: { preload: false }` — ' +
            'מחזירים `of(null)` ולא נוגעים בו. אחרת: `timer(1500)` ואז `mergeMap(() => load())`. ' +
            'ה-1500ms נותנים ל-bootstrap ולמסך הראשון לסיים לפני שמתחילים להוריד ברקע.',
        },
        {
          kind: 'p',
          text:
            'הקובץ חי ב-`core/perf/` — תיקייה חדשה שמרכזת כלי ביצועים. ' +
            '`@Injectable({ providedIn: "root" })` הופך אותה ל-singleton שה-router מקבל בהזרקה. ' +
            'אין state, אין תלויות — רק Observable logic.',
        },
        {
          kind: 'callout',
          tone: 'v22',
          title: 'timer + mergeMap: RxJS קל',
          body:
            '`timer(1500)` פולט ערך אחד אחרי 1500ms ונגמר. ' +
            '`mergeMap(() => load())` מחליף את הפליטה ב-Observable שה-router מחזיר מ-`load()`. ' +
            'מחריב: `switchMap` היה מבטל את ה-load אם router יקרא שוב לפני ה-timeout — ' +
            '`mergeMap` נותן לכל load לגמור. הלוגיקה הזו כולה 4 שורות.',
        },
        {
          kind: 'term',
          name: 'PreloadingStrategy',
          definition:
            'ממשק Angular: `preload(route: Route, load: () => Observable<unknown>): Observable<unknown>`. ' +
            'ה-router קורא לו לכל route lazy. להחזיר `of(null)` = דחה. להחזיר `load()` = טען עכשיו. ' +
            'כל Observable אחר = טען לפי התזמון שלו (כמו `timer(1500).pipe(mergeMap(load)`).',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch22',
        file: 'client/src/app/core/perf/idle-preload.strategy.ts',
        region: 'step-22.1',
        diff: true,
        title: 'idle-preload.strategy.ts — timer(1500) then load()',
      },
    },

    /* ------------------------------------------------------------ 22.5 */
    {
      id: '22.5',
      title: 'חיבור: `withPreloading` ב-`app.config.ts`',
      blocks: [
        {
          kind: 'p',
          text:
            'שורה אחת מחברת את האסטרטגיה: `withPreloading(IdlePreloadStrategy)` מתווסף ל-`provideRouter`. ' +
            'ה-router מקבל את `IdlePreloadStrategy` בהזרקה ומפעיל את `preload()` ' +
            'לכל route lazy לאחר שה-navigation הראשון הושלם.',
        },
        {
          kind: 'p',
          text:
            '`provideRouter` מקבל עכשיו שלושה features: ' +
            '`withComponentInputBinding()` מפרק 10, ' +
            '`withViewTransitions()` מפרק 14, ' +
            'ו-`withPreloading(IdlePreloadStrategy)` החדש. ' +
            'סדר ה-features לא קובע — כולם מצטרפים ל-router config.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'opt-out לפי route',
          body:
            'route שלא רוצה להיות מוטען מראש — מסמן `data: { preload: false }`. ' +
            'שימושי ל-heavy pages שסביר שלא יבקרו בהן: routes אדמין, דפי הגדרות נדירים. ' +
            'TaskForge לא משתמש ב-opt-out כרגע — כל ה-routes מוטענים מראש.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch22',
        file: 'client/src/app/app.config.ts',
        region: 'step-22.2',
        diff: true,
        title: 'app.config.ts — withPreloading(IdlePreloadStrategy)',
      },
    },

    /* ------------------------------------------------------------ 22.6 */
    {
      id: '22.6',
      title: 'הדמו: מה שקובע הוא כמות צמתי ה-DOM',
      blocks: [
        {
          kind: 'p',
          text:
            'לפני שמדברים על `@defer` ו-virtual scroll — הנה הדמו שמסביר למה הם קיימים. ' +
            'אותה רשימת N פריטים בשתי גישות: "naive" — כל N פריטים ב-DOM בבת אחת; ' +
            '"windowed" — רק ~25 פריטים גלויים, שאר הפריטים לא קיימים ב-DOM כלל.',
        },
        {
          kind: 'p',
          text:
            'הזיזו את ה-slider ל-2000 פריטים ובדקו את ספירת ה-DOM. ' +
            'ב-naive: 2000 צמתים ב-DOM, כל אחד עם event listeners ו-layout. ' +
            'ב-windowed: תמיד ~25 בלבד — ה-N הוא 2000, אבל ה-DOM לא יודע. ' +
            'מה שמכביד על הדפדפן הוא מספר צמתי ה-DOM, לא ה-N.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'DOM nodes ולא JavaScript: מה מאט?',
          body:
            'JavaScript מודרני מהיר. מה שמאט את הדפדפן: ' +
            '(1) style recalc — לכל DOM node בודקים אילו כללי CSS חלים; ' +
            '(2) layout — מחשבים גודל ומיקום לכל element; ' +
            '(3) paint — מציירים לcanvas. ' +
            'כל שלושת שלבים אלה גדלים לינארית עם מספר הצמתים. ' +
            '10,000 rows = layout/paint של 10,000 boxes — גם אם המשתמש רואה רק 20.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () => import('./demos/render-cost.demo').then((m) => m.RenderCostDemo),
        caption: 'דמו חי: הזיזו ל-2000 פריטים ועברו בין naive ל-windowed — ספירת צמתי ה-DOM היא המספר שקובע',
      },
    },

    /* ------------------------------------------------------------ 22.7 */
    {
      id: '22.7',
      title: '`@defer prefetch on idle`: הקוד שמוריד מוקדם',
      blocks: [
        {
          kind: 'p',
          text:
            'בפרק 13 הוספנו `@defer (on viewport)` לרשימת ה-issues — הרשימה (כולל CDK virtual scroll) ' +
            'נרנדרת רק כשמגיעים אליה. הבעיה: גם הורדת הקוד של ה-block הנדחה חכתה ל-viewport. ' +
            'בפרק 22 מוסיפים `prefetch on idle`: הקוד יורד ברקע כשהדפדפן פנוי, ' +
            'לפני שהמשתמש הגיע לאזור.',
        },
        {
          kind: 'p',
          text:
            '`@defer (on viewport; prefetch on idle)` — שני triggers נפרדים: ' +
            '`on viewport` שולט מתי לרנדר (כשהאזור נכנס ל-viewport); ' +
            '`prefetch on idle` שולט מתי להוריד את הקוד (כשהדפדפן פנוי). ' +
            'הרנדור לא מוקדם — רק ההורדה. כשמגיעים ל-viewport, הקוד כבר בזיכרון.',
        },
        {
          kind: 'term',
          name: '@defer: prefetch triggers',
          definition:
            '`@defer` ב-Angular v17+ תומך בשני סוגי triggers נפרדים: ' +
            'trigger רנדור (`on viewport`, `on interaction`, `on hover`) — מתי לרנדר את ה-block; ' +
            'trigger prefetch (`prefetch on idle`, `prefetch on hover`) — מתי להוריד את הקוד. ' +
            'ניתן לשלב: הורדה מוקדמת, רנדור עדיין בזמן הנכון.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'מה ה-CDK virtual scroll עושה ב-bundle?',
          body:
            '`cdk-virtual-scroll-viewport` ו-`*cdkVirtualFor` מ-`@angular/cdk/scrolling` ' +
            'הם תלות שנמצאת בתוך ה-`@defer` block. ' +
            'Angular tree-shakes אותה מה-main bundle — היא נטענת רק כש-`@defer` block נרנדר. ' +
            '`prefetch on idle` מוריד אותה מוקדם כדי שהרנדור יהיה מיידי.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch22',
        file: 'client/src/app/features/issues/issue-board.html',
        region: 'step-22.5',
        diff: true,
        title: 'issue-board.html — @defer prefetch on idle',
      },
    },

    /* ------------------------------------------------------------ 22.8 */
    {
      id: '22.8',
      title: 'zoneless + signals: שינוי-גילוי שכבר אופטימלי',
      blocks: [
        {
          kind: 'p',
          text:
            'קוד ביצועים נפוץ ב-Angular ישן: `ChangeDetectionStrategy.OnPush` בכל רכיב. ' +
            'ב-TaskForge — אין צורך. מפרק 06 האפליקציה היא zoneless (ללא `zone.js`), ' +
            'ו-signals הם המנוע: רכיב מתרנדר מחדש רק כשסיגנל שנקרא בו השתנה. ' +
            'זה OnPush בצורת ה-ultimate — מדויק ברמת הביטוי, לא ברמת הרכיב.',
        },
        {
          kind: 'p',
          text:
            'בזמן שביישום Zone.js מסורתי `OnPush` מונע re-renders מיותרים, ' +
            'ב-zoneless עם signals אין re-renders מיותרים כלל — כל עדכון יזום ומדויק. ' +
            'ה-"advice" הרגיל של "הוסף OnPush לכל רכיב" כבר ממומש ב-construction.',
        },
        {
          kind: 'callout',
          tone: 'v22',
          title: 'zoneless: ברירת המחדל ב-Angular v22',
          body:
            '`provideZonelessChangeDetection()` מוצהר ב-`app.config.ts` מפרק 06. ' +
            'ב-v22 זו ברירת המחדל — אפליקציות חדשות שנוצרות עם `ng new` ב-v22 ' +
            'מקבלות zoneless out of the box. ' +
            '`zone.js` לא ב-`package.json` — package.json נקי.',
        },
        {
          kind: 'term',
          name: 'zoneless change detection',
          definition:
            'מצב Angular שבו zone.js לא קיים — Angular לא יורט setTimeout/Promise. ' +
            'במקום: signals מודיעים ל-Angular בדיוק אילו ביטויים השתנו. ' +
            'יתרון: אפס overhead של Zone.js, עדכונים מדויקים, תאימות עם Web Components ועם ספריות שאינן Angular.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `flowchart LR
  subgraph "Zone.js app (pre-v17)"
    Z["Zone.js\nיורט כל async"] --> CD1["check entire tree\n(dirty marking)"] --> R1["re-render"]
    OP["OnPush"] --> |"פחות tree traversal"| CD1
  end
  subgraph "Zoneless + signals (TaskForge, ch06+)"
    S["signal.set()"] --> CD2["check ONLY\nthis signal's consumers"] --> R2["precise re-render"]
    note["OnPush: כבר מובנה\nאין צורך להוסיף"]
  end
  style note fill:var(--accent-subtle)`,
        caption: 'zoneless + signals: כל עדכון יזום ומדויק — OnPush מובנה',
      },
    },

    /* ------------------------------------------------------------ 22.9 */
    {
      id: '22.9',
      title: 'Skip-link: הקישור הראשון בעמוד',
      blocks: [
        {
          kind: 'p',
          text:
            'משתמש מקלדת (וקורא מסך) חייב ללחוץ Tab כדי לעבור את כל הפריטים ב-header ' +
            'לפני שמגיע לתוכן — בכל ניווט. Skip-link הוא הפתרון: ' +
            'קישור ראשון בעמוד שמאפשר לקפוץ ישר ל-`#main-content`. ' +
            'גלוי רק כשמקבל פוקוס (Tab ראשון), בלתי נראה אחרת.',
        },
        {
          kind: 'p',
          text:
            'ב-`app.html`: `<a class="skip-link" href="#main-content">דלג לתוכן</a>` ' +
            'הוא אלמנט הראשון לגמרי. ' +
            'היעד: `<main id="main-content" tabindex="-1">`. ' +
            '`tabindex="-1"` קריטי: הוא מאפשר למקד את ה-main בתכנות (כשמקליקים על הקישור) ' +
            'מבלי שה-main ייכנס לסדר ה-Tab הרגיל.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'tabindex="-1" vs tabindex="0"',
          body:
            '`tabindex="0"` מכניס element לסדר ה-Tab — המשתמש יגיע אליו בלחיצת Tab. ' +
            'זה לא מה שרוצים ב-`<main>`: לא רוצים שה-main עצמו יהיה עצירת Tab רגילה. ' +
            '`tabindex="-1"` מאפשר מיקוד תכנותי (`element.focus()`) בלבד. ' +
            'כך הפוקוס "קופץ" ל-main כשמשתמשים ב-skip-link, אבל Tab רגיל לא עוצר שם.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch22',
        file: 'client/src/app/app.html',
        region: 'step-22.3',
        diff: true,
        title: 'app.html — skip-link + main landmark (step-22.3 + step-22.3b)',
      },
    },

    /* ------------------------------------------------------------ 22.10 */
    {
      id: '22.10',
      title: 'Skip-link CSS + reduced-motion גלובלי',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-skip-link חייב להיות גלוי כשהוא מקבל פוקוס — אבל בלתי נראה ברירת מחדל. ' +
            'הטכניקה: `position: fixed; inset-block-start: -100%` מחביאה אותו מחוץ ל-viewport. ' +
            'כשמקבל `&:focus`: `inset-block-start: var(--sp-3)` — קופץ לפינה שמאל-עליון. ' +
            'לא `display: none` כי אז לא ניתן לפקס אותו בכלל.',
        },
        {
          kind: 'p',
          text:
            'שימו לב: הגדרה היא `&:focus`, לא `&:focus-visible`. ' +
            'ה-skip-link נגיש רק ב-Tab ממילא (אי אפשר להגיע אליו עם עכבר) — ' +
            'לכן `:focus` תמיד מתאים, לא רק `:focus-visible`. ' +
            'זה הדפוס הקנוני ל-skip-link לפי WCAG.',
        },
        {
          kind: 'p',
          text:
            'ה-`@media (prefers-reduced-motion: reduce)` בסוף ה-region הוא רשת ביטחון גלובלית: ' +
            'מבטל transitions על ה-skip-link עצמו. ' +
            'כל הפיצ\'רים (kanban, dashboard, markdown editor) כבר מבטלים אנימציות משלהם — ' +
            'זה כיסוי ל-shell.',
        },
        {
          kind: 'term',
          name: 'skip-link',
          definition:
            'קישור ראשון בעמוד שמאפשר לדלג ישירות לתוכן הראשי, עוקף ניווט חוזר. ' +
            'ב-WCAG 2.4.1 (AA): נדרש להיות הראשון ב-tab order. ' +
            'מוסתר ויזואלית (:not(:focus)) אבל קיים ב-DOM ופוקוסבילי.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch22',
        file: 'client/src/app/app.scss',
        region: 'step-22.4',
        diff: true,
        title: 'app.scss — skip-link CSS + reduced-motion net',
      },
    },

    /* ------------------------------------------------------------ 22.11 */
    {
      id: '22.11',
      title: 'אבחון נגישות: מעבר מקלדת',
      blocks: [
        {
          kind: 'p',
          text:
            'הבדיקה הבסיסית ביותר: סגרו את העכבר. עברו על האפליקציה עם Tab בלבד. ' +
            'כל פיצ\'ר שבנינו חייב לפעול — ניווט, פתיחת dialog, הזזת כרטיס kanban, ' +
            'חיפוש command palette, עריכת issue, toggle Dark mode.',
        },
        {
          kind: 'ul',
          items: [
            'Skip-link (ch22): Tab ראשון מגיע לקישור "דלג לתוכן", Enter קופץ ל-main',
            'Command Palette (ch16): `<dialog>` נטיבי — Escape סוגר, Tab מחזור בתוך הpalette בלבד',
            'Native dialog (ch09): login, אישור מחיקה — focus-trap + Escape מובנים ב-dialog',
            'Kanban DnD (ch17): Space מתחיל drag, חצים מזיזים, Enter מאשר, Escape מבטל',
            'Issue board (ch13): Tab מגיע לחיפוש, לסינון, לכפתורי pagination',
            'Dark mode toggle: `aria-pressed` מעדכן, מקלדת קורא את המצב',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ההבדל בין focus-trap ל-focus-return?',
          body:
            'focus-trap: בזמן שה-dialog פתוח, Tab מחזור בתוך ה-dialog בלבד — לא יוצא לשאר העמוד. ' +
            '`<dialog>` נטיבי ממש זאת אוטומטית. ' +
            'focus-return: כשה-dialog נסגר, הפוקוס חוזר לאלמנט שפתח אותו (הכפתור). ' +
            'בלי return, הפוקוס "נאבד" בראש הדף — המשתמש מאבד את מיקומו.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `flowchart LR
  A["Tab"] --> SL["skip-link\nEnter: קפיצה ל-main"]
  SL --> NAV["header nav items"]
  NAV --> CMK["⌘K button\nEnter: פתח palette"]
  CMK --> dialog1["dialog (ch16)\nfocus-trap פנימי\nEscape: סגור + return focus"]
  dialog1 --> BOARD["issue board\nTab: toolbar, rows"]
  BOARD --> KNB["kanban\nSpace: grab, arrows: move"]`,
        caption: 'מסלול Tab מלא — כל עצירה פוקוסבילית ומסומנת בבירור',
      },
    },

    /* ------------------------------------------------------------ 22.12 */
    {
      id: '22.12',
      title: 'aria-live, screen-reader mental model, ו-:focus-visible',
      blocks: [
        {
          kind: 'p',
          text:
            'קורא מסך (NVDA, JAWS, VoiceOver) קורא כל DOM element מסוג semantic. ' +
            'הוא לא "רואה" — הוא מקשיב ל-accessibility tree שה-browser מייצר מה-HTML. ' +
            'המודל המנטלי: אם ה-HTML semantic (`<button>`, `<nav>`, `<main>`, `<dialog>`), ' +
            'קורא המסך מבין; אם הכל `<div>`, הוא מבולבל.',
        },
        {
          kind: 'p',
          text:
            '`aria-live` מודיע על שינויים דינמיים. ' +
            'TaskForge משתמש ב-`aria-live="polite"` ב-toast container (פרק 09) ' +
            'וב-kanban announcements (פרק 17) — כשכרטיס עובר עמודה, קורא המסך מכריז. ' +
            '`aria-live="assertive"` לדחוף הודעות קריטיות מיד (שגיאה, login failed).',
        },
        {
          kind: 'p',
          text:
            '`:focus-visible` מחליף `:focus` ברוב המקרים: הוא מציג טבעת פוקוס ' +
            'רק כשהמשתמש ניווט עם מקלדת — לא כשמקליק עכבר. ' +
            'חריג: skip-link משתמש ב-`:focus` כי הוא נגיש רק ב-Tab ממילא.',
        },
        {
          kind: 'term',
          name: 'aria-live',
          definition:
            'attribute HTML שמודיע לטכנולוגיות עזר (screen readers) על שינויים בתוכן אזור. ' +
            '`polite`: מכריז אחרי שהמשתמש מסיים לדבר. `assertive`: מכריז מיד, קוטע. ' +
            'ב-TaskForge: toast + kanban announcements = polite; שגיאות auth = assertive.',
        },
        {
          kind: 'term',
          name: 'landmark',
          definition:
            'element HTML semantic שמגדיר אזור ניווט מרכזי לטכנולוגיות עזר: ' +
            '`<main>`, `<nav>`, `<header>`, `<footer>`, `<aside>`, `<section>`. ' +
            'קורא מסך מאפשר ניווט מהיר בין landmarks. ' +
            'TaskForge: `<header>` + `<main id="main-content">` = שני landmarks מרכזיים.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'html',
        code:
          '<!-- aria-live patterns ב-TaskForge -->\n\n' +
          '<!-- toast container (ch09): polite — הכרזה בסוף דיבור -->\n' +
          '<div aria-live="polite" aria-atomic="true" class="toast-container">\n' +
          '  @for (t of toasts(); track t.id) { <tf-toast [toast]="t" /> }\n' +
          '</div>\n\n' +
          '<!-- kanban announcements (ch17): polite — "Issue moved to Done" -->\n' +
          '<div aria-live="polite" class="sr-only">{{ announcement() }}</div>\n\n' +
          '<!-- :focus-visible בעיצוב (styles.scss) -->\n' +
          ':focus-visible {\n' +
          '  outline: 2px solid var(--accent);\n' +
          '  outline-offset: 2px;\n' +
          '}',
        file: 'aria-live + :focus-visible (קונצפטואלי)',
      },
    },

    /* ------------------------------------------------------------ 22.13 */
    {
      id: '22.13',
      title: 'contrast ratio ו-OKLCH מפרק 08/18',
      blocks: [
        {
          kind: 'p',
          text:
            'WCAG AA דורש contrast ratio של 4.5:1 לטקסט רגיל ו-3:1 לטקסט גדול. ' +
            'TaskForge בנה את מערכת הצבעים שלה ב-OKLCH (פרק 08) — ' +
            'מרחב צבע שבו "lightness" מתנהג בצורה אחידה בכל גוון. ' +
            'כשמגדירים `--txt1: oklch(15% 0 0)` על `--sur: oklch(98% 0 0)`, ' +
            'ה-contrast ratio ניתן לחישוב וצפוי מראש.',
        },
        {
          kind: 'p',
          text:
            'בדיקת contrast: DevTools בכרומיום: Elements, בחרו צבע, הציגו contrast ratio בצבעים. ' +
            'axe DevTools מריץ contrast audit אוטומטי ומסמן violations. ' +
            'ה-dashboard colors (פרק 18) נבחרו עם OKLCH כדי להבטיח ניגודיות גם ב-dark mode.',
        },
        {
          kind: 'term',
          name: 'contrast ratio',
          definition:
            'יחס בין הבהירות היחסית של שני צבעים. WCAG AA: 4.5:1 לטקסט רגיל (אנחנו), 3:1 לטקסט גדול (18px+). ' +
            'WCAG AAA: 7:1. מחושב: (L1+0.05) / (L2+0.05) כאשר L1 הוא הצבע הבהיר. ' +
            'OKLCH עוזר כי ה-L (lightness) קורלטיבי לתפיסה האנושית.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'scss',
        code:
          '// מפרק 08: OKLCH tokens — בהירות אחידה לכל גוון\n' +
          ':root {\n' +
          '  // טקסט ראשי על רקע ראשי: ניגוד גבוה\n' +
          '  --txt1: oklch(15% 0.01 250);   /* כמעט שחור */\n' +
          '  --sur:  oklch(98% 0.01 250);   /* כמעט לבן */\n' +
          '  // accent — WCAG AA כשנוגד עם לבן\n' +
          '  --accent:          oklch(55% 0.2 250);\n' +
          '  --accent-contrast: oklch(98% 0 0);   /* לבן על accent */\n' +
          '}\n\n' +
          '[data-theme="dark"] {\n' +
          '  --txt1: oklch(92% 0.01 250);   /* כמעט לבן */\n' +
          '  --sur:  oklch(18% 0.01 250);   /* כמעט שחור */\n' +
          '}',
        file: 'OKLCH tokens (ch08) — ניגוד נשמר ב-light + dark',
      },
    },

    /* ------------------------------------------------------------ 22.14 */
    {
      id: '22.14',
      title: 'כלי הביקורת: axe DevTools ו-Lighthouse',
      blocks: [
        {
          kind: 'p',
          text:
            'axe DevTools הוא extension לדפדפן (Chrome/Firefox) שמריץ ביקורת נגישות אוטומטית: ' +
            'contrast, ARIA, landmarks, form labels, alt text. ' +
            'פותחים DevTools, לוחצים על לשונית "axe DevTools", ואז "Scan all of my page". ' +
            'הפלט: רשימת violations עם severity, הסבר, ופתרון מוצע.',
        },
        {
          kind: 'p',
          text:
            'Lighthouse הוא כלי מובנה ב-Chrome DevTools: ' +
            'פתחו DevTools, לחצו על לשונית Lighthouse, סמנו "Performance" ו-"Accessibility", לחצו Analyze. ' +
            'הוא מחשב ציון 0-100 לנגישות (ולביצועים — LCP, CLS, INP). ' +
            'חשוב: הריצו ב-Incognito window וסגרו tabs כדי לא להשפיע על המדידה.',
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: 'אוטומטי + ידני: שני שלבים',
          body:
            'axe/Lighthouse מוצאים כ-30%-40% מהבעיות — הבעיות שניתן לזהות אוטומטית (contrast, ARIA syntax). ' +
            'שאר הבעיות — קשרים semantiים, flow הגיוני, הודעות שמועילות — רק ניווט ידני עם מקלדת ' +
            'ו-screen reader יאתר. אוטומטי ראשון (מהיר), ידני שני (מעמיק).',
        },
        {
          kind: 'term',
          name: 'focus trap',
          definition:
            'מנגנון שמכביל את ה-Tab cycle בתוך אלמנט מסוים (dialog, menu) כל עוד הוא פתוח. ' +
            'ב-TaskForge: `<dialog>` נטיבי מממש זאת ב-browser. ' +
            'ב-WCAG 2.1.2 (AA): חובה לאפשר יציאה מ-trap (Escape). `<dialog>` עושה זאת אוטומטית.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'bash',
        code:
          '# axe DevTools: extension לדפדפן\n' +
          '# התקינו: chrome.google.com/webstore -> "axe DevTools"\n' +
          '# שימוש: DevTools -> axe DevTools -> Scan all of my page\n\n' +
          '# Lighthouse: מובנה ב-Chrome DevTools\n' +
          '# שימוש: DevTools -> Lighthouse -> Performance + Accessibility -> Analyze page load\n' +
          '# המלצה: הריצו ב-Incognito, סגרו browser extensions אחרים\n\n' +
          '# axe CLI (אם רוצים ב-CI):\n' +
          '# npm install -g @axe-core/cli\n' +
          '# axe http://localhost:4400 --exit',
      },
    },

    /* ------------------------------------------------------------ 22.15 */
    {
      id: '22.15',
      title: 'Runtime check: preloading בפועל',
      blocks: [
        {
          kind: 'p',
          text:
            'הוכחה: פתחו את האפליקציה על מסך הבית. פתחו Network panel בDevTools. ' +
            'לא ניווטו לשום מקום — רק המתינו כ-2 שניות. ' +
            'ראו: ה-chunks `project-board`, `issue-detail`, `dashboard`, `not-found` ' +
            'נטענים ברקע — ללא שום ניווט. ' +
            'עכשיו נווטו — המסך מופיע מיד, ללא ספינר.',
        },
        {
          kind: 'p',
          text:
            'זהו ה-idle preload בפועל: `timer(1500)` מאפשר ל-bootstrap לסיים, ' +
            'ואז `mergeMap(() => load())` מוריד כל chunk בסדר. ' +
            'ניתן לאמת בnetwork panel: 4 requests אחרי שניה-שניים, ניווט עתידי מסתמך על cache.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'Disable cache + throttling: לאמת מחדש',
          body:
            'Network panel: הגדירו throttling "Fast 4G" וסמנו Disable cache. ' +
            'כך ה-preloading עובד על חיבור איטי ומבלי cache. ' +
            'הMeasure: כמה זמן לוקח chunk ראשון? ' +
            'כשpreloading עובד — ניווט ל-project board לאחר 3 שניות המתנה יהיה מיידי ' +
            'גם עם Disable cache (כי ה-chunk כבר בזיכרון, לא ב-HTTP cache).',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'bash',
        code:
          '# לאמת preloading בפועל (Chrome DevTools)\n' +
          '# 1. פתחו localhost:4500 (snapshot client) — מסך הבית\n' +
          '# 2. פתחו DevTools -> Network\n' +
          '# 3. המתינו ~2 שניות WITHOUT navigating\n' +
          '# 4. ראו: requests ל:\n' +
          '#    chunk-project-board-*.js  (~120 kB)\n' +
          '#    chunk-issue-detail-*.js   (~89  kB)\n' +
          '#    chunk-dashboard-*.js      (~16  kB)\n' +
          '#    chunk-not-found-*.js      (~650 B)\n' +
          '# 5. עכשיו נווטו לפרויקט — מיידי, ללא spinner\n' +
          '#\n' +
          '# @defer prefetch on idle:\n' +
          '# נווטו לissue board -> Network\n' +
          '# ה-CDK chunk יורד ברקע BEFORE scroll לרשימה',
      },
    },

    /* ------------------------------------------------------------ 22.16 */
    {
      id: '22.16',
      title: 'העץ אחרי פרק 22',
      blocks: [
        {
          kind: 'p',
          text:
            'פרק 22 סיים את Wave 5 (Quality). ' +
            'הוספנו שכבת ביצועים (idle preloading + `@defer prefetch`) ' +
            'ושכבת נגישות גלובלית (skip-link + landmark) ' +
            'לאפליקציה שכבר הייתה נגישה ברובה לאורך הבנייה. ' +
            'הלמידה המרכזית: מדדנו (bundle sizes, DOM counts, network panel, axe), ' +
            'ורק אחרי שהבנו — פעלנו.',
        },
        {
          kind: 'p',
          text:
            'Wave 6 (Production) ממשיכה עם פרק 23 Hardening: ' +
            'OutputCaching, RateLimiter, health checks, ולוגים מובנים. ' +
            'אחריו: פרק 24 Realtime (SignalR), פרק 25 Ship (deploy + CI), ' +
            'ופרק 26 Capstone.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה הדרך הכי יעילה לשפר LCP?',
          body:
            'LCP (Largest Contentful Paint) מושפע בעיקר מ: ' +
            '(1) גודל ה-initial bundle — lazy routes + preloading עוזרים; ' +
            '(2) תמונות — `NgOptimizedImage` + `loading="eager"` ל-hero image; ' +
            '(3) fonts — `font-display: swap` + preload של ה-font הראשי; ' +
            '(4) server response time — compression + caching (פרק 23). ' +
            'TaskForge לא משתמש בתמונות גדולות — ה-LCP מגיע מה-bundle time. ' +
            'lazy routing + idle preloading (פרק 22) הם ה-fix הנכון כאן.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch22',
        title: 'TaskForge אחרי פרק 22 — idle preloading + skip-link + @defer prefetch, Wave 5 שלמה',
      },
    },
  ],

  quiz: [
    {
      q: 'מה `IdlePreloadStrategy` מחזיר כשהמשתמש עדיין על מסך הבית ולא ניווט?',
      options: [
        'of(null) — לא טוען כלום',
        'load() — טוען מיד',
        'timer(1500).pipe(mergeMap(() => load())) — מחכה 1500ms ואז טוען ברקע',
        'שגיאה — PreloadingStrategy לא פועל ללא ניווט',
      ],
      answer: 2,
      explain:
        '`IdlePreloadStrategy` מחכה `timer(1500)` (כ-1.5 שניות) ואז קורא ל-`load()` לכל route lazy. ' +
        'ה-router מפעיל את `preload()` לאחר ה-navigation הראשון הושלם. ' +
        'תוצאה: chunks נטענים ברקע בלי ניווט מצד המשתמש.',
    },
    {
      q: 'מה ההבדל בין `on viewport` ל-`prefetch on idle` ב-`@defer`?',
      options: [
        'אין הבדל — שניהם עושים אותו דבר',
        '`on viewport` שולט מתי לרנדר; `prefetch on idle` שולט מתי להוריד את הקוד',
        '`prefetch on idle` מרנדר מוקדם יותר',
        '`on viewport` מוריד קוד; `prefetch on idle` מרנדר',
      ],
      answer: 1,
      explain:
        '`on viewport` הוא trigger רנדור — הרנדור של ה-block מתרחש כשנכנסים ל-viewport. ' +
        '`prefetch on idle` הוא trigger הורדה — הקוד של ה-block יורד ברקע כשהדפדפן פנוי, ' +
        'לפני שמגיעים ל-viewport. כשמגיעים — הקוד כבר מוכן.',
    },
    {
      q: 'למה `<main id="main-content">` צריך `tabindex="-1"` ולא `tabindex="0"`?',
      options: [
        'כי tabindex="0" לא עובד ב-<main>',
        'כי tabindex="-1" מאפשר מיקוד תכנותי (לאחר קליק על skip-link) מבלי להכניס את <main> לסדר ה-Tab הרגיל',
        'כי tabindex="0" יגרום לשגיאת build',
        'אין הבדל — שניהם מאפשרים focus() תכנותי',
      ],
      answer: 1,
      explain:
        '`tabindex="0"` מכניס את `<main>` לסדר ה-Tab — המשתמש יגיע אליו בלחיצת Tab. ' +
        'לא רוצים זאת: לא כל עמוד מגיע ל-main כתחנת Tab. ' +
        '`tabindex="-1"` מאפשר `element.focus()` תכנותי (כשמקליקים skip-link) ' +
        'מבלי להוסיף עצירת Tab.',
    },
    {
      q: 'מדוע skip-link משתמש ב-`:focus` ולא ב-`:focus-visible`?',
      options: [
        'כי :focus-visible לא נתמך בדפדפנים',
        'כי skip-link נגיש רק ב-Tab ממילא — `:focus` מציג תמיד כשמקבל פוקוס, כולל תכנותי. זה הדפוס הקנוני',
        'כי :focus-visible לא עובד עם position: fixed',
        'אין הבדל למעשה',
      ],
      answer: 1,
      explain:
        '`:focus-visible` מציג טבעת פוקוס רק כשמנווטים עם מקלדת (לא עכבר). ' +
        'ה-skip-link נגיש רק ב-Tab ממילא — אי אפשר להגיע אליו עם עכבר רגיל. ' +
        'לכן `:focus` (שתמיד מציג כשיש פוקוס) הוא הבחירה הנכונה, כולל מיקוד תכנותי.',
    },
    {
      q: 'מה `aria-live="polite"` עושה ב-toast container (פרק 09)?',
      options: [
        'מונע קריאה של ה-toast',
        'מודיע לקורא מסך על toast חדש — אחרי שהמשתמש מסיים לדבר (לא קוטע)',
        'מסתיר את ה-toast ויזואלית',
        'מגביל את מספר ה-toasts ל-1',
      ],
      answer: 1,
      explain:
        '`aria-live="polite"` יוצר region שקורא מסך עוקב אחריו. ' +
        'כשתוכן חדש נכנס (toast), קורא המסך מכריז עליו בסוף המשפט הנוכחי — לא קוטע. ' +
        '`assertive` היה קוטע מיד. polite מתאים לhudifications שאינן דחופות.',
    },
    {
      q: 'מה מוסיף `withPreloading(IdlePreloadStrategy)` ל-`provideRouter`?',
      options: [
        'מאפשר input binding מה-route',
        'מוסיף view transitions בין routes',
        'מחבר אסטרטגיית preloading מותאמת — ה-router יקרא ל-preload() לכל route lazy לאחר ה-navigation הראשון',
        'מאפשר lazy loading של routes',
      ],
      answer: 2,
      explain:
        '`withComponentInputBinding()` הוא input binding (ch10). ' +
        '`withViewTransitions()` הוא view transitions (ch14). ' +
        '`withPreloading(IdlePreloadStrategy)` מחבר את האסטרטגיה: ' +
        'ה-router מפעיל `IdlePreloadStrategy.preload()` לכל route lazy, ' +
        'שמחכה 1500ms ואז מוריד ברקע.',
    },
    {
      q: 'מדוע ב-TaskForge zoneless אין צורך להוסיף `OnPush` לכל רכיב?',
      options: [
        'כי OnPush לא קיים ב-Angular v22',
        'כי zoneless + signals כבר מבצעים עדכונים מדויקים — רק רכיבים עם signals שהשתנו מתרנדרים מחדש',
        'כי TaskForge לא משתמש ב-components',
        'כי OnPush עובד רק עם zone.js',
      ],
      answer: 1,
      explain:
        'ב-Zone.js app, `OnPush` מפחית tree traversal מיותר. ' +
        'ב-zoneless + signals, Angular כבר יודע בדיוק אילו ביטויים השתנו — ' +
        'רק הרכיבים שצורכים signals שהשתנו מתרנדרים מחדש. ' +
        'OnPush מובנה by construction, לא צריך להוסיף ידנית.',
    },
  ],

  proveIt: [
    {
      title: 'ראו preloading ב-Network panel — ללא ניווט',
      body:
        'פתחו `localhost:4500` על מסך הבית. פתחו DevTools Network. ' +
        'לא לנווט — רק להמתין כ-2 שניות. ' +
        'ראו אם ה-chunks של lazy routes נטענים ברקע.',
      expect:
        'אחרי ~1.5 שניות מופיעים requests ל-4 chunks: project-board, issue-detail, dashboard, not-found. ' +
        'עכשיו לחצו על פרויקט — מסך הissues מופיע מיידית, ללא spinner. ' +
        'בלעדי preloading: הייתם רואים רק את ה-main bundle בטעינה הראשונה, ' +
        'וה-chunks היו נטענים רק בניווט.',
    },
    {
      title: 'Tab פעם אחת — ראו את ה-skip-link',
      body:
        'על `localhost:4500`, לחצו Tab פעם אחת בלבד. ' +
        'בדקו מה קיבל פוקוס ומה מוצג.',
      expect:
        'ה-skip-link "דלג לתוכן" מופיע בפינה השמאלית-עליונה (מואר עם outline). ' +
        'לחיצה על Enter מזיזה את הפוקוס ל-`#main-content`. ' +
        'הערה: ב-preview headless, `:focus` לא מופיע כשחלון הדפדפן לא בפוקוס — ' +
        'בדקו בדפדפן אמיתי עם חלון פעיל. ה-CSS נכון; זה מגבלת headless.',
    },
    {
      title: 'הדמו: עברו בין naive ל-windowed ובדקו ספירת DOM',
      body:
        'בדמו של פרק 22 (render-cost), הזיזו ה-slider ל-2000. ' +
        'עברו בין "naive" ל-"windowed" ובדקו את הספירה.',
      expect:
        'naive: 2000 DOM nodes — המספר אדום (hot). ' +
        'windowed: ~25 DOM nodes — המספר נורמלי. ' +
        'שניהם מציגים N=2000 פריטים לוגית, אבל ה-DOM שונה לחלוטין. ' +
        'זה בדיוק מה ש-`@defer (on viewport)` ו-virtual scroll עושים: DOM קטן, list גדולה.',
    },
    {
      title: 'OS reduced-motion: אנימציות נפסקות',
      body:
        'הפעילו "Reduce Motion" בהגדרות מערכת ההפעלה (Windows: Settings > Accessibility > Visual effects; ' +
        'Mac: System Settings > Accessibility > Display > Reduce motion). ' +
        'רעננו את `localhost:4500` ונסו להזיז כרטיס kanban.',
      expect:
        'כרטיס kanban זז מיידית ללא transition animation. ' +
        'Dashboard chart לא מציג enter animation. ' +
        'Skip-link לא מציג transition כשמקבל פוקוס. ' +
        '`@media (prefers-reduced-motion: reduce)` פועל ברמה הגלובלית (app.scss) ' +
        'ובכל feature שבנה block נפרד (ch17/ch18/ch19).',
    },
    {
      title: 'Lighthouse accessibility audit',
      body:
        'ב-Chrome (לא Incognito — כדי שה-app יהיה מחובר), ' +
        'נווטו ל-`localhost:4500`, פתחו DevTools, לחצו Lighthouse, ' +
        'בחרו Accessibility, לחצו "Analyze page load".',
      expect:
        'ציון Accessibility מוצג (ל-Lighthouse). ' +
        'בדקו Violations — אמורים להיות מעטים מאוד. ' +
        'skip-link מוכר, `<main>` landmark קיים, buttons עם aria-label, ' +
        'toasts עם aria-live. ' +
        'שימו לב: axe DevTools נותן פירוט עמוק יותר מ-Lighthouse בלבד.',
    },
  ],

  exercise: {
    prompt:
      'הוסיפו `data: { preload: false }` ל-route אחד לפי בחירתכם, ' +
      'ואמתו שה-chunk שלו לא נטען ב-preloading. ' +
      'לאחר מכן: הוסיפו keyboard shortcut נוסף ל-command palette (ch16) ' +
      'לניווט מהיר לדשבורד (Shift+D) עם הכרזת `aria-live`.',
    tasks: [
      'ב-`reference/.build/ch22/client/src/app/app.routes.ts`, מצאו את ה-route של `not-found` ' +
        'והוסיפו `data: { preload: false }` לאובייקט ה-route.',
      'פתחו Network panel, רעננו, המתינו 2 שניות — ודאו שה-chunk של not-found לא נטען.',
      'הסירו `data: { preload: false }` (החזרו לקדמותו).',
      'ב-command registry (ch16), הוסיפו פקודה `"Navigate to Dashboard"` עם shortcut `Shift+D`.',
      'ודאו שהפקודה מוצגת ב-palette, מנווטת ל-`/dashboard`, ומכריזה `aria-live` "ניווט לדשבורד".',
    ],
    acceptance: [
      'עם `data: { preload: false }` על not-found: Network panel לא מציג את ה-chunk שלו ב-idle preload.',
      'הפקודה "Navigate to Dashboard" מופיעה ב-palette, מקבלת Shift+D, ומנווטת לדשבורד.',
      'הכרזת aria-live מוצגת/נשמעת כשמנווטים דרך הפקודה.',
      'build ירוק, אפס שגיאות console.',
    ],
  },
};
