import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 15 — Modern CSS 2026.
 * Wave 4 פותח: subgrid, container queries, :has(), anchor positioning,
 * cascade layers, OKLCH, logical properties, scroll-driven animations.
 * Snapshot: client/src/app/features/projects/project-list.scss
 *           client/src/app/features/issues/issue-board.scss
 * Refined CSS-only — markup unchanged from ch12/ch13.
 */
export const CH15_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 15.1 */
    {
      id: '15.1',
      title: 'פתיחת גל 4: CSS כשפה, לא כ-stylesheet',
      blocks: [
        {
          kind: 'p',
          text:
            'גלים 1–3 בנו אפליקציה עובדת. גל 4 עוסק בַּיִפְי, במהירות, ובדיוק שמרגישים לפני שיודעים מה בדיוק חסר. ' +
            'פרק 15 נוגע שוב בשני מסכים שכבר קיימים — רשימת הפרויקטים מ-ch12 ולוח ה-Issues מ-ch13 — ' +
            'וּמְשַׁדֵּרֵג אותם בCSS בלבד, בלי לגעת ב-markup ובלי TypeScript חדש.',
        },
        {
          kind: 'p',
          text:
            'שדרוג CSS-only הוא מבחן מצוין לארכיטקטורה: אם הHTML נקי ומסומנטי, ' +
            'ה-CSS יוכל לשנות את הפריסה, הצבע וה-motion — בלי לדרוש שינויים בקומפוננטות. ' +
            'כל הטכניקות בפרק הזה מופיעות כבר בייצור ב-2026: subgrid, container queries, ' +
            '`:has()`, anchor positioning, OKLCH ו-scroll-driven animations.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה CSS ולא JavaScript?',
          body:
            'כל טכניקה שתלמדו בפרק הזה מאפשרת לדפדפן לחשב פריסה, צבע ו-motion בשכבת ה-rendering — ' +
            'לא ב-JavaScript heap. זה אומר פחות re-render, יותר 60fps, ו-state שנשמר בDOM ' +
            'במקום ב-signal. זה גם RTL-safe: logical properties "יודעות" לאיזה כיוון הטקסט זורם.',
        },
      ],
      panel: {
        kind: 'filetree',
        title: 'קבצי הCSS המשודרגים בפרק 15',
        lines: [
          { text: 'client/src/app/features/', depth: 0, kind: 'dir' },
          { text: 'projects/', depth: 1, kind: 'dir' },
          { text: 'project-list.scss', depth: 2, kind: 'file', badge: 'mod' },
          { text: 'issues/', depth: 1, kind: 'dir' },
          { text: 'issue-board.scss', depth: 2, kind: 'file', badge: 'mod' },
        ],
        caption: 'רק שני קבצים — markup אפס. CSS מספיק.',
      },
    },

    /* ------------------------------------------------------------ 15.2 */
    {
      id: '15.2',
      title: 'auto-fit + minmax(min()) — grid שמחליט לבד',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-ch12 רשימת הפרויקטים השתמשה ב-grid עם breakpoint קבוע. ' +
            'הבעיה: breakpoint מדיה-query מניח שהרכיב תמיד תופס את רוחב החלון כולו. ' +
            'כשהוא יישב בעמודת sidebar צרה, הוא יִשָּׁבֵר. ' +
            '`repeat(auto-fit, minmax(min(100%, 18rem), 1fr))` פותר את זה: ' +
            'הדפדפן מחשב כמה עמודות מתאימות, וה-`min(100%, 18rem)` מבטיח שכרטיס לעולם לא יגלוש מחוץ ל-container.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            '`min(100%, 18rem)` אומר: "הכרטיס יהיה 18rem, אבל אם ה-container צר יותר — קח את מה שיש". ' +
            'בלי `min()`, `minmax(18rem, 1fr)` יגרום לגלישה אופקית ב-mobile כי ה-mininum גדול מה-viewport.',
        },
        {
          kind: 'term',
          name: 'auto-fit',
          definition:
            'ערך של `repeat()` ב-CSS Grid שיוצר עמודות ממש לפי כמה שהמקום מכיל. ' +
            'בניגוד ל-`auto-fill`, `auto-fit` מכווץ עמודות ריקות — כך שפחות פריטים מתפשטים על כל הרוחב.',
        },
        {
          kind: 'term',
          name: 'minmax(min(), 1fr)',
          definition:
            'שילוב של `minmax` עם `min()` לפריסה intrinsic. ' +
            'מגדיר מינימום שמסתגל ל-container הנוכחי ומקסימום גמיש. ' +
            'הפריסה מבוצעת בדפדפן בלי JavaScript.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch15',
        file: 'client/src/app/features/projects/project-list.scss',
        region: 'step-15.2',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 15.3 */
    {
      id: '15.3',
      title: 'subgrid — הכותרת מתיישרת למסילות הכרטיסים',
      blocks: [
        {
          kind: 'p',
          text:
            'הכותרת `<h2>` יושבת ב-`grid-column: 1 / -1` ונמתחת לרוחב המלא. ' +
            'עם `subgrid`, היא לא רק תופסת את הרוחב — היא יורשת את מסילות העמודות של ה-parent. ' +
            'כך "New Project" מתיישר לאחרית ממש של הכרטיס האחרון, ' +
            'לא לאחרית ה-`<h2>` — ייישור אופטי שנראה מחושב אבל עלה אפס שורות JavaScript.',
        },
        {
          kind: 'p',
          text:
            '`@supports (grid-template-columns: subgrid)` עוטף את ה-subgrid כדי שדפדפן ישן יקבל את ה-flex fallback. ' +
            'זה progressive enhancement קלאסי: ה-base state עובד, השיפור נרכש בדפדפן שתומך בו.',
        },
        {
          kind: 'callout',
          tone: 'v22',
          title: 'subgrid ב-2026',
          body:
            'Subgrid זמין בכל הדפדפנים הגדולים מ-2023. ב-2026 `@supports (grid-template-columns: subgrid)` ' +
            'כבר מיותר לרוב הפרויקטים — אנחנו שומרים אותו כדי לדגים את דפוס ה-progressive enhancement.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ההבדל בין grid רגיל ל-subgrid?',
          body:
            'Grid רגיל: כל container מגדיר מסילות עצמאיות. Subgrid: ילד יכול לומר "קח את מסילות ה-parent שלי" ' +
            '(`grid-template-columns: subgrid`). זה מאפשר ייישור של עמודות על פני רמות DOM שונות — ' +
            'בלי לשכפל את הנוסחה, בלי JavaScript, ובלי שה-child יידע כמה עמודות ה-parent מכיל.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch15',
        file: 'client/src/app/features/projects/project-list.scss',
        region: 'step-15.3',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 15.4 */
    {
      id: '15.4',
      title: 'container queries — breakpoint שייך לרכיב',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-ch08 למדנו `container-type: inline-size` ו-`@container`. ' +
            'כאן הם עובדים: `@container project-list (max-width: 34rem)` מקפל את הכותרת לעמודה אחת — ' +
            'לא כשה-viewport צר, אלא כשה-`.projects` container עצמו צר. ' +
            'אם מחר נניח את רשימת הפרויקטים בתוך sidebar, הבלוק יתכווץ אוטומטית.',
        },
        {
          kind: 'p',
          text:
            'ה-`container: project-list / inline-size` מוגדר על `.projects` עצמו. ' +
            'זה אומר שהילדים שואלים על רוחבו של הרכיב עצמו, לא על `100vw`. ' +
            'כל פריסה שסופגת container queries היא רכיב אמיתי, reusable — לא layout שנכתב לדף מסוים.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            '`@container` שאין לו `container-type` ancestor לעולם לא יפעל — השאילתה תישבר בשקט, ' +
            'בלי שגיאה. זה מה שגרם ל-overflow ב-ch13 כשנשכחה ה-`container-type`. ' +
            'תמיד ודאו שה-ancestor הנכון מוגדר לפני שאתם כותבים `@container`.',
        },
        {
          kind: 'term',
          name: 'container query',
          definition:
            'שאילתה שמגיבה לגודל (או לסגנון) של container ancestor ספציפי, לא לגודל ה-viewport. ' +
            'נכתבת עם `@container <name> (condition)`. ' +
            'מאפשרת לרכיב להיות responsive באמת — ללא תלות בדף שמכיל אותו.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch15',
        file: 'client/src/app/features/projects/project-list.scss',
        region: 'step-15.4',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 15.5 */
    {
      id: '15.5',
      title: 'intrinsic toolbar grid — שלושה עמודות שמחליטות לבד',
      blocks: [
        {
          kind: 'p',
          text:
            'סרגל הכלים של לוח ה-Issues — מסנני סטטוס, שדה חיפוש ומיון — קיבל grid intrinsic: ' +
            '`fit-content(100%) minmax(min(100%, 18rem), 1fr) fit-content(16rem)`. ' +
            'מה שזה אומר שורה שורה:',
        },
        {
          kind: 'ul',
          items: [
            '`fit-content(100%)` — עמודת המסננים גדלה עם התוכן שלה, אבל לא מעבר ל-100% מה-container.',
            '`minmax(min(100%, 18rem), 1fr)` — שדה החיפוש סופג את המקום הפנוי; לא מתמעך מתחת ל-18rem אבל גם לא גולש.',
            '`fit-content(16rem)` — תפריט המיון לוקח רק מה שהוא צריך, עד 16rem.',
          ],
        },
        {
          kind: 'p',
          text:
            'בפרייסה desktop נמדד שלושה עמודות ברורות. ' +
            'אין כאן מספר קסם — הדפדפן מחשב את החלוקה לפי התוכן האמיתי.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה לא flex?',
          body:
            'flex `row` יתקשה לנעול גבולות לעמודה האמצעית: כשהמסנן יש לו טקסט ארוך, הוא ידחק את החיפוש. ' +
            'Grid עם `fit-content` נותן גבול עליון לכל עמודה, ורק האמצעית גדלה. ' +
            'זו הדוגמה הקלאסית שבה grid intrinsic עדיף על flex.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch15',
        file: 'client/src/app/features/issues/issue-board.scss',
        region: 'step-15.5',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 15.6 */
    {
      id: '15.6',
      title: '@container issue-board — toolbar מתקפל לעמודה',
      blocks: [
        {
          kind: 'p',
          text:
            '`:host` של `IssueBoardComponent` מוגדר `container: issue-board / inline-size` מ-ch13. ' +
            '`@container issue-board (max-width: 46rem)` מקפל את ה-toolbar לעמודה אחת `minmax(0, 1fr)`. ' +
            'זה נבדק ב-375px: ה-viewport לא הזיז עצמו — ה-container הוא שהצטמצם.',
        },
        {
          kind: 'p',
          text:
            'זה בדיוק ההבדל בין media query לבין container query: ' +
            'ב-375px viewport, ה-toolbar של לוח ה-Issues לא מקפל בגלל שה-viewport צר, ' +
            'אלא בגלל שה-`.issue-board` container עצמו הצטמצם לאחרי ה-sidebar (אם יהיה אחד) ' +
            'ולאחרי ה-padding. הרכיב reacts to its own size — לא לגודל החלון.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ההבדל הקונקרטי בין `@media` ל-`@container`?',
          body:
            '`@media (max-width: 46rem)` מגיב כאשר ה-viewport (החלון כולו) קטן מ-46rem. ' +
            '`@container issue-board (max-width: 46rem)` מגיב כאשר ה-container בשם issue-board קטן מ-46rem, ' +
            'ללא קשר לגודל החלון. מסקנה: אותו רכיב יכול להציג עצמו בפריסה שונה בו זמנית — ' +
            'עמודה אחת ב-sidebar צר, שלוש עמודות ב-content רחב — בלי JavaScript.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch15',
        file: 'client/src/app/features/issues/issue-board.scss',
        region: 'step-15.6',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 15.7 */
    {
      id: '15.7',
      title: 'clamp() — גובה viewport fluid וספייסינג אדפטיבי',
      blocks: [
        {
          kind: 'p',
          text:
            '`.vs` — ה-viewport של virtual scroll — מקבל `height: clamp(20rem, 52vh, 28.75rem)`. ' +
            'זה ה-CSS equivalent של "לפחות 20rem, רצוי 52% מגובה החלון, לכל היותר 28.75rem". ' +
            'ב-laptop רגיל זה יוצא לשטח שמכיל כ-11 שורות. ' +
            'ב-tablet קטן, הגובה יקטן אוטומטית.',
        },
        {
          kind: 'p',
          text:
            '`clamp()` שימושי גם לטיפוגרפיה: `font-size: clamp(1rem, 2.5cqi, 1.5rem)` ' +
            'נותן טיפוגרפיה fluid שמגיבה לרוחב ה-container (לא ה-viewport), ' +
            'תוך שמירה על מינימום קריא ומקסימום שלא ייראה ענקי בחלון רחב. ' +
            '`cqi` = "container inline quarter inch" — יחידה שמקושרת לרוחב ה-container.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'Virtual scroll דורש גובה ידוע מראש: בלי `height` על ה-viewport, ' +
            'ה-CDK לא יכול לחשב כמה שורות לרנדר. `clamp()` נותן גובה אמיתי שמשתנה fluid — ' +
            'בלי breakpoints ובלי JavaScript שמחשב גובה ב-`resize` event.',
        },
        {
          kind: 'term',
          name: 'clamp()',
          definition:
            'פונקציית CSS שמגבילה ערך: `clamp(min, preferred, max)`. ' +
            'הערך המועדף יכול להשתמש ביחידות dynamic כמו `vh`, `vw`, `cqi` או `%`. ' +
            'מאפשרת fluid typography ו-fluid spacing בלי breakpoints.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'scss',
        code:
          '// virtual-scroll viewport — גובה fluid\n' +
          '.vs {\n' +
          '  height: clamp(20rem, 52vh, 28.75rem);\n' +
          '  // ...\n' +
          '}\n\n' +
          '// ספייסינג fluid בין כרטיסים\n' +
          '.projects {\n' +
          '  gap: clamp(var(--sp-2), 2cqi, var(--sp-4));\n' +
          '}',
      },
    },

    /* ------------------------------------------------------------ 15.8 */
    {
      id: '15.8',
      title: ':has() — ה-parent מגיב לילדיו',
      blocks: [
        {
          kind: 'p',
          text:
            '`:has()` הוא ה-selector שחסר ב-CSS שנים: בחירת parent לפי ילד. ' +
            'ב-`project-list.scss` הוא עושה: כש-`.load-error` מכיל כפתור שמקבל focus-visible, ' +
            'כל כרטיס השגיאה מקבל border וring — בלי HostBinding, בלי signal, בלי class שנוסף ב-JS. ' +
            'ב-`issue-board.scss`: כש-`.search` מקבל focus-visible, כל ה-toolbar מקבל ring.',
        },
        {
          kind: 'p',
          text:
            'ב-playground.demo.scss `:has(input:checked)` על `.lab` container נותן outline כחלחל ' +
            'ברגע שמשתמש בוחר כרטיס בתוך ה-lab — ה-parent מגיב ל-state הפנימי. ' +
            'זה pattern שמחליף class toggling שלם: `renderer.addClass(host, "has-focus")` — נעלם.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה `:has()` מאפשר שלא היה אפשרי לפני?',
          body:
            'לפני `:has()`: בחירת parent לפי ילד דרשה JavaScript שמוסיף class. ' +
            'עם `:has()`: `.parent:has(.child:focus-visible)` מגיב ישירות בCSS. ' +
            'ב-Angular זה מבטל כמות של `HostBinding`ים ו-`signal`ים שנוצרו רק לסגנון. ' +
            'מגבלה אחת: `:has()` עם pseudo-elements (`::before`) לא עובד בכל הדפדפנים.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch15',
        file: 'client/src/app/features/issues/issue-board.scss',
        region: 'step-15.8',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 15.9 */
    {
      id: '15.9',
      title: 'anchor positioning — tooltips ומניות בלי JavaScript',
      blocks: [
        {
          kind: 'p',
          text:
            'Anchor positioning (`anchor-name` / `position-anchor` / `anchor()`) פותרת בעיה קלאסית: ' +
            'מיקום floating element (tooltip, dropdown, popover) יחסית ל-element אחר, ' +
            'תוך מעבר אוטומטי לצד ההפוך כשאין מקום. ' +
            'ב-ch16 נשתמש בזה ל-Command Palette. בפרק הזה נבין את הרעיון.',
        },
        {
          kind: 'code',
          lang: 'scss',
          title: 'דפוס anchor positioning בסיסי',
          code:
            '.trigger {\n' +
            '  anchor-name: --my-btn;\n' +
            '}\n\n' +
            '.popover {\n' +
            '  position: absolute;\n' +
            '  position-anchor: --my-btn;\n' +
            '  top: anchor(bottom);\n' +
            '  left: anchor(left);\n' +
            '}',
        },
        {
          kind: 'p',
          text:
            '`anchor-name: --my-btn` מכריז שה-element הזה הוא עוגן. ' +
            '`position-anchor: --my-btn` על ה-popover אומר "בצע position אחרי העוגן הזה". ' +
            '`anchor(bottom)` = "הצמד ל-bottom edge של העוגן". ' +
            'ה-fallback אוטומטי (`position-try-fallbacks: flip-block`) מעביר את ה-popover למעלה כשאין מקום למטה — ' +
            'בלי Popper.js, בלי ResizeObserver, ובלי חישובי getBoundingClientRect.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'ב-2026 anchor positioning תומכת בכל הדפדפנים הגדולים. ' +
            'אם אתם עדיין משתמשים ב-Floating UI או Popper.js, ' +
            'שווה לבדוק מתי CSS native יספיק — כי ספריות JS עולות bundle size ו-runtime.',
        },
        {
          kind: 'term',
          name: 'anchor positioning',
          definition:
            'תכונת CSS (2024+) שמאפשרת לצמד floating element ל-element אחר כ-anchor, ' +
            'עם fallback אוטומטי לצד הפוך כשאין מקום. ' +
            'מחליפה Popper.js / Floating UI לרוב תרחישי dropdown, tooltip ו-popover.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid:
          'graph LR\n' +
          '  T["trigger\\nanchor-name: --btn"] --> |"anchor(bottom)"| P["popover\\nposition-anchor: --btn"]\n' +
          '  P --> |"flip-block כשאין מקום"| T',
        caption: 'anchor positioning: ה-popover נצמד לעוגן ועובר אוטומטית לצד ההפוך',
      },
    },

    /* ------------------------------------------------------------ 15.10 */
    {
      id: '15.10',
      title: 'scroll-driven animations — שורות שנכנסות לview',
      blocks: [
        {
          kind: 'p',
          text:
            'שורות ה-issue ב-virtual scroll מקבלות reveal animation: ' +
            '`animation-timeline: view(block)` עם `animation-range: entry 0% cover 24%`. ' +
            'זה אומר: האנימציה מתחילה ברגע שהשורה מתחילה להיכנס לview, ומסתיימת כש-24% ממנה מכוסים. ' +
            'מ-opacity 0 ו-translateY(8px) לstate הרגיל — reveal עדין ומהיר.',
        },
        {
          kind: 'p',
          text:
            'שני guards מגינים: `@supports (animation-timeline: view())` — ' +
            'דפדפן שאינו תומך לא מנסה לפרש את הקוד. ' +
            '`@media (prefers-reduced-motion: reduce)` מבטל את כל ה-animation על השורות — ' +
            'כולל ה-skeleton pulse. זה לא מקרי: motion accessibility היא הגדרה שמשתמשים מסמנים ' +
            'ברמת מערכת ההפעלה, וה-CSS חייב לכבד אותה.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            'Animation-timeline עם `view()` עובד על elements בתוך scroll container — ' +
            'ה-`.vs` שלנו. אם תנסו לקשר אותו ל-element שאינו ב-scroll container, הוא יתנהג לא צפוי. ' +
            'תמיד ודאו ש-scroll container (עם overflow) הוא ה-ancestor הישיר.',
        },
        {
          kind: 'term',
          name: 'scroll-driven animation',
          definition:
            'אנימציית CSS שהתקדמותה קשורה ל-scroll position, לא לזמן. ' +
            'כתובה עם `animation-timeline: view()` (לפי visibility ב-viewport) ' +
            'או `scroll()` (לפי scroll progress). ' +
            'מורצת על ה-compositor thread — ללא JS ו-`requestAnimationFrame`.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch15',
        file: 'client/src/app/features/issues/issue-board.scss',
        region: 'step-15.10',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 15.11 */
    {
      id: '15.11',
      title: 'OKLCH ו-color-mix — צבע שמסתדר לבד',
      blocks: [
        {
          kind: 'p',
          text:
            'מערכת העיצוב של ch08 משתמשת ב-OKLCH כ-color space. ' +
            'הסיבה: OKLCH (`oklch(L% C H)`) שומר על lightness נתפס אחיד כשמשנים hue. ' +
            'כשמשנים `--accent` מכתום לכחול, הטקסט על הכפתורים נשאר קריא — ' +
            'כי הL בOKLCH עקבי, בניגוד ל-HSL שבו אותה lightness-ערך יוצרת כהות שונה לפי צבע.',
        },
        {
          kind: 'p',
          text:
            '`color-mix(in srgb, var(--danger) 55%, var(--bdr))` ב-`issue-board.scss` ' +
            'יוצר גרסת border של danger — ולא צריך token נוסף. ' +
            'הכלל ב-ch08: token חדש נוצר רק כשיש לפחות שלושה צרכנים. ' +
            'עד אז, `color-mix` גוזר את הצבע ישירות מהtokens הקיימים.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'כדי לבדוק OKLCH בדפדפן: פתחו DevTools, לחצו על color swatch ובחרו OKLCH color space. ' +
            'תראו שה-L (lightness) אחיד כשמגלגלים את ה-hue — זה בדיוק למה OKLCH עדיפה על HSL לdesign systems.',
        },
        {
          kind: 'term',
          name: 'OKLCH',
          definition:
            'Color space שמבוסס על תפיסה אנושית: L = lightness, C = chroma (עוצמת הצבע), H = hue. ' +
            'ב-OKLCH, שינוי hue לא משנה את ה-perceived lightness — כלומר אפשר לשנות צבעי brand ' +
            'בלי לאבד קריאות (contrast ratio). תומך בגוונים מחוץ ל-sRGB (P3 display).',
        },
        {
          kind: 'term',
          name: 'color-mix()',
          definition:
            'פונקציית CSS שמערבבת שני צבעים בצד שרת CSS (לא JS). ' +
            '`color-mix(in oklch, red 30%, white)` = אדום בהיר ב-30%. ' +
            'שימושי ליצירת variants (hover, disabled, error background) ישירות מה-token, בלי token נוסף.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'scss',
        code:
          '// border של danger בלי token חדש\n' +
          'border: 1px solid color-mix(in srgb, var(--danger) 55%, var(--bdr));\n\n' +
          '// background עדין\n' +
          'background: color-mix(in srgb, var(--danger) 10%, var(--sur));\n\n' +
          '// hover accent בlightness גבוה\n' +
          '// (token --accent מוגדר ב-styles.scss כ-OKLCH)\n' +
          'outline: 2px solid color-mix(in srgb, var(--accent) 60%, transparent);',
      },
    },

    /* ------------------------------------------------------------ 15.12 */
    {
      id: '15.12',
      title: 'logical properties — RTL חינם',
      blocks: [
        {
          kind: 'p',
          text:
            'האפליקציה עברית — RTL. `margin-left: auto` ב-LTR הופך ל-`margin-right: auto` ב-RTL. ' +
            '`margin-inline-start: auto` עובד בשני הכיוונים: ב-LTR זה start הוא left, ב-RTL — right. ' +
            'פרק 15 משתמש ב-logical properties בכל הCSS שנוסף: ' +
            '`inline-size` (width), `block-size` (height), `inset-inline-start` (left/right), ' +
            '`padding-block-end` (padding-bottom/top), ו-`margin-block-start` (margin-top/bottom).',
        },
        {
          kind: 'p',
          text:
            'כשמוסיפים שפה שנייה (LTR — אנגלית, למשל לדשבורד Admin) אחרי שהCSS כולו כתוב ב-logical properties, ' +
            'הרכיב מסתדר לבד עם `dir="ltr"`. אין צורך לכתוב overrides.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'כלל אצבע: כתבו physical properties (left/right/top/bottom) רק לדברים שלעולם לא ישתנו בכיוון: ' +
            'position: absolute עם חישוב גיאומטרי ספציפי. לכל שאר הספייסינג, padding ובorders — logical.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'scss',
        code:
          '// RTL-safe: margin-inline-start = left ב-LTR, right ב-RTL\n' +
          '.new-btn {\n' +
          '  margin-inline-start: auto;\n' +
          '}\n\n' +
          '// RTL-safe: inset-block-start = top\n' +
          '.card input {\n' +
          '  position: absolute;\n' +
          '  inset-block-start: var(--sp-1);\n' +
          '  inset-inline-end: var(--sp-1); // = right ב-LTR, left ב-RTL\n' +
          '}\n\n' +
          '// RTL-safe: padding-inline-end = padding-right ב-LTR\n' +
          '.card-title {\n' +
          '  padding-inline-end: var(--sp-3);\n' +
          '}',
      },
    },

    /* ------------------------------------------------------------ 15.13 */
    {
      id: '15.13',
      title: 'cascade layers — למה ה-design system אינו נשבר',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-ch08 הוגדרו `@layer reset, tokens, base, components`. ' +
            'הסדר קובע: `components` תמיד מנצח `base`, שמנצח `reset`. ' +
            'ב-ch15 לא הוספנו layers חדשות — אבל הCSS שאנחנו כותבים חי ב-`components` layer ' +
            'ולכן בא אחרי כל ה-reset ואחרי ה-tokens. ' +
            'זה מה שמאפשר לכתוב `var(--accent)` ולקבל תמיד את הצבע הנכון — בלי !important.',
        },
        {
          kind: 'p',
          text:
            'ה-cascade layers משנות גם את משמעות הspecificity: ' +
            'רכיב ב-`components` layer מנצח כלל ב-`base` layer גם אם ה-specificity שלו נמוך יותר. ' +
            'זה אומר שאפשר לכתוב selectors נקיים כמו `.toolbar` ולא לדאוג ש-utility class ינצח.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'איך cascade layers פותרות את בעיית specificity?',
          body:
            'בלי layers: `.button.primary` מנצח `.button` גם כשזה לא מה שרצינו, בגלל specificity. ' +
            'עם layers: layer גבוה יותר מנצח תמיד, ללא קשר ל-specificity. ' +
            'כלל ב-`components` layer מנצח כלל ב-`base` layer — גם אם הראשון הוא `.btn` והשני הוא `body .container .btn`. ' +
            'הסדר של הlayers מחליף את ספירת (a,b,c) כ-tiebreaker העיקרי.',
        },
        {
          kind: 'term',
          name: 'cascade layer',
          definition:
            '`@layer name { }` יוצר שכבה בcascade. כللים בשכבה גבוהה (הוצהרה מאוחר יותר) מנצחים ' +
            'כללים בשכבה נמוכה גם אם ה-specificity שלהם נמוכה. ' +
            'פותרת את בעיות specificity wars ב-design systems ו-third-party CSS.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'scss',
        code:
          '// styles.scss — מסדר ch08 (לא נוסף בch15, מובא לסיכום)\n' +
          '@layer reset, tokens, base, components;\n\n' +
          '@layer tokens {\n' +
          '  :root {\n' +
          '    --accent: oklch(65% 0.18 35); // כתום\n' +
          '    --shadow-1: 0 1px 3px oklch(0% 0 0 / 12%);\n' +
          '    --ease-out: cubic-bezier(0.4, 0, 0.2, 1);\n' +
          '  }\n' +
          '}\n\n' +
          '@layer components {\n' +
          '  // כל הCSS של הרכיבים — מנצח base ו-reset\n' +
          '  .toolbar { /* ... */ }\n' +
          '}',
      },
    },

    /* ------------------------------------------------------------ 15.14 */
    {
      id: '15.14',
      title: 'View Transitions API — מבוא ל-ch19',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-ch14 הוספנו `withViewTransitions({ skipInitialTransition: true })` ל-router. ' +
            'זה מאפשר crossfade עדין בין routes. ב-ch19 נוסיף view-transition-name ספציפיים ' +
            'כדי שכרטיס issue ב-board "ייעוף" ל-detail page ויחזור — transition מורפי. ' +
            'בפרק הזה נבין את המכניזם.',
        },
        {
          kind: 'code',
          lang: 'scss',
          title: 'view-transition-name — מה ש-ch19 יוסיף',
          code:
            '// כל issue-row מקבל שם יחודי\n' +
            '.issue-row {\n' +
            '  view-transition-name: issue-{{ id }}; // Angular string interpolation\n' +
            '}\n\n' +
            '// ב-styles.scss — transition animations (כבר קיים מ-ch14)\n' +
            '::view-transition-old(root) {\n' +
            '  animation: fade-out var(--dur-2) var(--ease-out);\n' +
            '}\n' +
            '::view-transition-new(root) {\n' +
            '  animation: fade-in var(--dur-2) var(--ease-out);\n' +
            '}',
        },
        {
          kind: 'p',
          text:
            'הcsss ב-`::view-transition-*` pseudo-elements הם גלובליים, לכן הם ב-`styles.scss` — ' +
            'לא ב-SCSS של קומפוננטה. זה הדפוס שנוסד ב-ch14 ונמשיך בו ב-ch19.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'View Transitions עובד כ-progressive enhancement: דפדפן שלא תומך מבצע ניווט רגיל. ' +
            'ה-`skipInitialTransition: true` מונע flash ב-load ראשוני — ' +
            'כי ב-load ראשוני אין "state ישן" להפוך ממנו.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch14',
        file: 'client/src/styles.scss',
        region: 'step-14.11b',
        diff: false,
      },
    },

    /* ------------------------------------------------------------ 15.15 */
    {
      id: '15.15',
      title: 'playground חי — ראו הכול בפעולה',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-playground החי משלב את כל הטכניקות בדוגמה אינטראקטיבית: ' +
            'לחצן segmented מעביר בין grid / subgrid / flex; ' +
            'סליידר שולט ברוחב ה-`.lab` container (240–760px) — לא ב-viewport; ' +
            'ה-`@container (max-width: 22rem)` מקפל לעמודה אחת כשה-container צר.',
        },
        {
          kind: 'p',
          text:
            'בחירת כרטיס מפעילה `:has(input:checked)` על ה-`.lab`: ה-parent מקבל outline כחלחל ' +
            'בלי class, בלי signal ובלי HostBinding. ' +
            'ב-subgrid mode, כותרות ו-meta של כל הכרטיסים מתיישרים — ' +
            'גם כשה-content שונה — כי הם יורשים מסילות שורה משותפות. ' +
            'כל animations מכבדים `prefers-reduced-motion`.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'הזיזו את הסליידר מ-760 ל-240 לאט לאט: שימו לב בדיוק ב-352px (22rem) ' +
            'שהכרטיסים עוברים לעמודה אחת. ה-viewport לא זז — ה-container בלבד.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () =>
          import('./demos/playground.demo').then((m) => m.CssPlaygroundDemo),
        caption: 'מעבדה חיה: grid / subgrid / flex, container-query reflow ו-:has() — הכול בלי JavaScript נוסף',
      },
    },

    /* ------------------------------------------------------------ 15.16 */
    {
      id: '15.16',
      title: 'pixel-perfect craft — ייישור אופטי ורווחים',
      blocks: [
        {
          kind: 'p',
          text:
            'CSS מספיק לפריסה, אבל craft אמיתי הוא בפרטים הקטנים. ' +
            'כמה עקרונות שהשדרוג של ch15 מיישם:',
        },
        {
          kind: 'ul',
          items: [
            'ספייסינג ב-`clamp()` לא רק ב-`var(--sp-N)`: `gap: clamp(var(--sp-2), 2cqi, var(--sp-4))` — הרווח מגיב לרוחב ה-container.',
            'baseline alignment: `align-items: baseline` על ה-`<h2>` subgrid מיישר תוכן כותרת ל-baseline, לא ל-top — הטקסט נראה אחיד.',
            'box-shadow כ-depth token: `--shadow-1`, `--shadow-2`, `--shadow-3` מ-ch08 משמשים להמחשת elevation, לא border.',
            'transitions על `border-color` ו-`box-shadow` בלבד — שניהם מורצים על ה-compositor ולא גורמים ל-layout.',
            'logical properties בכל מקום: `padding-block-end`, `inline-size`, `inset-inline-end` — RTL חינם.',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ההבדל בין `transition: all` לבין transition על property ספציפי?',
          body:
            '`transition: all` מאנימציה כל property שמשתנה — כולל layout properties כמו `height` ו-`width` ' +
            'שגורמות ל-reflow. זה בדרך כלל לא רצוי: כל שינוי DOM קטן מפעיל animation. ' +
            'עדיף: `transition: border-color var(--dur-2), box-shadow var(--dur-2)` — רק הproperty שרצינו, רק על compositor.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch15',
        file: 'client/src/app/features/projects/project-list.scss',
        region: 'step-15.8',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 15.17 */
    {
      id: '15.17',
      title: 'העץ אחרי פרק 15',
      blocks: [
        {
          kind: 'p',
          text:
            'בסוף פרק 15, שני מסכים קיימים קיבלו שדרוג CSS-only: ' +
            'כרטיסי הפרויקטים נמדדו ב-2 עמודות ב-desktop עם auto-fit intrinsic; ' +
            'כותרת הרשימה מתיישרת למסילות הכרטיסים עם subgrid; ' +
            'ה-toolbar של הissues מקבל שלוש עמודות intrinsic ב-desktop ועמודה אחת ב-375px — ' +
            'ה-container קובע, לא ה-viewport.',
        },
        {
          kind: 'p',
          text:
            'הפרק הבא (ch16) מיישם anchor positioning ב-Command Palette: ' +
            'כל מה שלמדנו על `anchor-name` ו-`position-anchor` יבוא לידי ביטוי שם. ' +
            'ה-cascade layers, tokens ו-`:has()` הם כלים שכל פרק הבא בגל 4 מסתמך עליהם.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch15',
        title: 'TaskForge אחרי פרק 15 — CSS בלבד',
      },
    },
  ],

  quiz: [
    {
      q: 'מה הבעיה עם `minmax(18rem, 1fr)` ב-mobile?',
      options: [
        'זה לא עובד ב-Safari',
        '18rem minimum גדול מ-viewport צר — גורם לגלישה אופקית',
        'auto-fit לא תומך ב-fr units',
        'צריך לכתוב min-content במקום 1fr',
      ],
      answer: 1,
      explain:
        'כש-viewport צר מ-18rem, ה-minimum של `minmax` אינו מתאים ל-container, ועמודה בודדת גולשת מחוץ ל-container. ' +
        '`min(100%, 18rem)` כ-minimum פותר את זה: הכרטיס לא יהיה רחב יותר מה-container אפילו ב-mobile.',
    },
    {
      q: 'מה `@container issue-board (max-width: 46rem)` בודק?',
      options: [
        'שה-viewport הוא פחות מ-46rem',
        'שה-element בשם issue-board הוא פחות מ-46rem',
        'שגובה ה-container הוא פחות מ-46rem',
        'שה-document dir הוא rtl',
      ],
      answer: 1,
      explain:
        '`@container <name>` בודק את גודל ה-container ב-ancestor chain שה-CSS selector מחפש. ' +
        '`:host` של `IssueBoardComponent` מוגדר `container: issue-board / inline-size`, ' +
        'לכן השאילתה מגיבה לרוחב ה-component עצמו — לא ל-viewport.',
    },
    {
      q: 'מה `:has(.search:focus-visible)` על `.toolbar` עושה?',
      options: [
        'מוסיף class ל-.toolbar כשה-search מקבל focus',
        'מסגנן את ה-.toolbar כשה-.search ב-focus — ה-parent מגיב לילד',
        'מוסיף event listener על focus',
        'מחזיר true/false לתנאי Angular',
      ],
      answer: 1,
      explain:
        '`:has()` מאפשר ל-parent להגיב לstate של ילד, ישירות ב-CSS. ' +
        'כש-`.search` מקבל `focus-visible`, כל `.toolbar` מקבל border וring. ' +
        'אין צורך ב-signal, HostBinding, או JavaScript class toggling.',
    },
    {
      q: 'מה היתרון של `anchor-name` / `position-anchor` על Popper.js?',
      options: [
        'anchor positioning מהיר יותר כי הוא מחושב ב-GPU',
        'זה CSS native — אין JS, אין ResizeObserver, fallback אוטומטי ב-CSS',
        'Popper.js לא תומך ב-RTL',
        'anchor positioning מגדיר z-index אוטומטי',
      ],
      answer: 1,
      explain:
        'Anchor positioning מחושב בדפדפן כחלק מה-layout engine. ' +
        'אין צורך ב-getBoundingClientRect, אין ResizeObserver ב-JS, ו-position-try-fallbacks ' +
        'מטפל ב-flip אוטומטי. זה קטן יותר, מהיר יותר ו-RTL-safe.',
    },
    {
      q: 'למה `animation-timeline: view()` עטוף ב-`@supports`?',
      options: [
        'כי view() לא עובד בלי @supports',
        'כדי שדפדפן שאינו תומך לא יפרש שגיאה ופשוט יציג ללא animation',
        'כי @supports מאפשר animation מהיר יותר',
        'כי Angular מחייב @supports על כל animation',
      ],
      answer: 1,
      explain:
        '`@supports (animation-timeline: view())` יוצר progressive enhancement: ' +
        'דפדפן שתומך יריץ את ה-scroll-driven animation; דפדפן ישן יציג את האלמנטים רגיל — ללא אנימציה. ' +
        'בלי `@supports`, דפדפן ישן ייתקל בsyntax שהוא לא מכיר ועשוי לפרש בצורה לא צפויה.',
    },
    {
      q: 'מה ייחודי ב-OKLCH לעומת HSL?',
      options: [
        'OKLCH מדויק יותר ל-hex colors',
        'ב-OKLCH שינוי hue לא משנה perceived lightness — הצבע נשאר ביחס contrast זהה',
        'HSL לא תומך ב-dark mode',
        'OKLCH דורש יותר ביצועים מה-GPU',
      ],
      answer: 1,
      explain:
        'ב-HSL אותה lightness-ערך יוצרת כהות שונה בין hues שונים (צהוב נראה בהיר יותר מכחול באותה L). ' +
        'ב-OKLCH, L מייצגת lightness נתפסת (perceptual) אחידה. ' +
        'לכן שינוי `--accent` בין כתום לירוק ב-OKLCH שומר על יחס contrast קבוע.',
    },
    {
      q: 'מה `grid-template-columns: subgrid` גורם לילד לעשות?',
      options: [
        'לקבל grid עם עמודות זהות ל-sibling',
        'לירוש את מסילות העמודות של ה-parent — הילד אינו מגדיר עמודות משלו',
        'ליצור nested grid עם auto-fit',
        'להוסיף column gap כפול מה-parent',
      ],
      answer: 1,
      explain:
        'כש-`grid-template-columns: subgrid` מוגדר על ילד שמתפרש על כמה עמודות parent, ' +
        'הילד יורש את מסילות ה-parent. כך פריטים ב-DOM שונות מתיישרים למסילה זהה — ' +
        'בלי לשכפל את הגדרת ה-columns ובלי JavaScript.',
    },
    {
      q: 'מה `@layer reset, tokens, base, components` קובע?',
      options: [
        'את הסדר שבו קבצי CSS נטענים',
        'את סדר העדיפות: components מנצח base, base מנצח tokens — ללא קשר ל-specificity',
        'את פורמט הvalues (px / rem / %)',
        'את ה-breakpoints של ה-design system',
      ],
      answer: 1,
      explain:
        'ה-declaration `@layer reset, tokens, base, components` קובעת שכבות. ' +
        'כלל ב-components layer מנצח כלל ב-base layer גם אם ה-specificity של ה-base כלל גבוה יותר. ' +
        'זה מבטל specificity wars ומאפשר לכתוב selectors נקיים ב-component CSS.',
    },
  ],

  proveIt: [
    {
      title: 'container query vs media query',
      body:
        'הריצו `node tools/materialize-snapshots.mjs`, ואז `pnpm exec ng serve --port 4500` ' +
        'ב-`reference/.build/ch15/client`. פתחו DevTools, הגדירו device emulation ל-375px. ' +
        'נווטו לפרויקט "Website Redesign" ולוח ה-Issues. ' +
        'ראו שה-toolbar מקפל לעמודה אחת — ואז הגדילו את ה-viewport ל-768px. ' +
        'ה-toolbar חוזר לשלוש עמודות. כעת שנו את `max-width: 46rem` ב-`@container issue-board` ' +
        'ל-`@media (max-width: 46rem)` וראו מה קורה.',
      expect:
        'עם container query: ה-toolbar מגיב לרוחב ה-component עצמו. ' +
        'עם media query: ה-toolbar מגיב ל-viewport — ולא יכול להגיב ל-sidebar אם יהיה אחד.',
    },
    {
      title: 'auto-fit intrinsic grid ב-desktop',
      body:
        'עם הsnapshot בריצה על `localhost:4500`, התחברו (demo@taskforge.dev / Passw0rd!) ' +
        'ופתחו `/projects`. ב-viewport רחב (1024px+) ספרו כמה עמודות מוצגות ברשימת הפרויקטים. ' +
        'כווצו את החלון ל-500px וראו כמה עמודות.',
      expect:
        'ב-desktop נמדדו שתי עמודות כרטיסים. ב-500px — עמודה אחת. ה-grid מחליט לבד, בלי breakpoint ידני.',
    },
    {
      title: ':has() focus glow בלי JavaScript',
      body:
        'ב-375px, בלוח ה-Issues, לחצו Tab עד שה-focus מגיע לשדה החיפוש (לחצן המסנן הראשון, ואז Tab). ' +
        'ראו שכל ה-`.toolbar` מקבל border כהה וring, לא רק ה-input עצמו. ' +
        'פתחו DevTools ובדקו: אין class שנוסף ב-JavaScript על `.toolbar`.',
      expect:
        'ה-toolbar מקבל את ה-border/ring אך ורק מה-CSS rule `:has(.search:focus-visible)`. ' +
        'אין signal, HostBinding, או JS event handler שמוסיף class.',
    },
    {
      title: 'scroll-driven reveal בלוח issues',
      body:
        'בדפדפן שתומך ב-scroll-driven animations (Chrome 115+), ' +
        'עם ch15 snapshot פעיל, פתחו פרויקט "Website Redesign". ' +
        'גללו לאט למטה ב-virtual scroll ושימו לב איך השורות נכנסות לview.',
      expect:
        'שורות Issue מגיחות עם fade-in ו-translateY קצר ברגע הכניסה ל-view. ' +
        'אם `prefers-reduced-motion: reduce` מופעל בOS, האנימציה מבוטלת לחלוטין.',
    },
    {
      title: 'subgrid header alignment',
      body:
        'ב-viewport רחב, בדף `/projects`, ב-DevTools ה-Elements: בחרו ב-`<h2>` תחת `.projects`. ' +
        'בדקו את ה-Computed styles וראו `grid-template-columns: subgrid`.',
      expect:
        'ה-`<h2>` מוצג עם `grid-template-columns: subgrid` (בדפדפן שתומך). ' +
        'כפתור "New Project" מתיישר לאחרית הכרטיס האחרון, לא לאחרית ה-h2.',
    },
  ],

  exercise: {
    prompt:
      'שדרגו את מסך `IssueDetail` (מ-ch14) ב-CSS-only. ' +
      'יישמו container query, logical properties ו-`:has()` לפחות אחת מכל סוג.',
    tasks: [
      'הוסיפו `container: issue-detail / inline-size` על `:host` של `IssueDetailComponent`.',
      'כתבו `@container issue-detail (max-width: 38rem)` שמקפל את grid הסטטוס/עדיפות לעמודה אחת.',
      'השתמשו ב-`:has(textarea:focus-visible)` על הform container כדי לתת לו ring כש-textarea ב-focus.',
      'המירו כל physical property (`margin-left`, `padding-right`, `width`, `height`) ל-logical property המתאימה.',
      'הוסיפו `transition: border-color var(--dur-2) var(--ease-out), box-shadow var(--dur-2) var(--ease-out)` על הform card.',
    ],
    acceptance: [
      'ב-375px טופס הissue לא גולש אופקית ושדות הסטטוס/עדיפות מוצגים בעמודה אחת.',
      'Focus על textarea מעניק ring לכל הform container ב-CSS בלבד — ללא JS.',
      'אין `margin-left`, `margin-right`, `padding-left`, `padding-right`, `width` או `height` (ישיר) בCSS החדש — רק logical properties.',
      '`pnpm test`, `pnpm verify:coverage`, `pnpm build` — הכול עובר.',
    ],
  },
};
