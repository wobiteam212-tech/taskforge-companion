import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 06 — יסודות Angular.
 * הקליינט נולד: ng new, zoneless, signals/computed/effect,
 * bootstrap ו-DI — בלי NgModule, בלי zone.js, בלי ניחושים.
 */
export const CH06_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 6.1 */
    {
      id: '6.1',
      title: 'צד הלקוח נכנס לעלילה',
      blocks: [
        {
          kind: 'p',
          text:
            'חמשת הפרקים הקודמים בנו שרת שיודע מי המשתמש, מנהל פרויקטים ומגן על כל נתיב. ' +
            'עכשיו מגיע הצד שמדבר איתו: הדפדפן. גל 2 מלמד איך לבנות קליינט Angular v22 ביד — ' +
            'מהפקודה הראשונה ועד ל-login, guard ו-interceptor שעובד מול חוזה ה-API האמיתי.',
        },
        {
          kind: 'ul',
          items: [
            'פרק 06 זה: scaffold, zoneless mental model, signals/computed/effect, bootstrap, DI ו-tests.',
            'פרק 07: ארכיטקטורת הקליינט, core/shared/features, ורכיבים חכמים מול טיפשים.',
            'שני השרתים רצים במקביל — Angular dev server על 4500, ה-API על 5080.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'הסיבה שמפרידים את הפורטים היא לא תקלה — זה עיצוב מכוון. ' +
            '4400 שמור לאפליקציית המדריך הזו, 5080 לשרת TaskForge, ו-4500 לקליינט TaskForge. ' +
            'כך שלושת השרתים יכולים לרוץ במקביל בלי קונפליקט.',
        },
      ],
      panel: {
        kind: 'diagram',
        caption: 'שני שרתים בפיתוח: Angular dev server על 4500, ה-API על 5080 עם SQLite מאחוריו.',
        mermaid: `flowchart LR
  Browser["Browser\n(dev)"]
  NG["Angular Dev Server\nport 4500"]
  API["TaskForge.Api\nport 5080"]
  DB[("SQLite")]
  Browser --> NG
  NG -->|"HTTP JSON"| API
  API --> DB`,
      },
    },

    /* ------------------------------------------------------------ 6.2 */
    {
      id: '6.2',
      title: 'ng new: הולדת הקליינט',
      blocks: [
        {
          kind: 'p',
          text:
            'הפקודה הבאה יוצרת את כל ה-scaffold. ‏`pnpm dlx` מוריד את ה-CLI בלי להתקין אותו גלובלית, ' +
            'כך שתמיד עובדים עם הגרסה שצוינה:',
        },
        {
          kind: 'code',
          lang: 'bash',
          title: 'יצירת הפרויקט',
          code: 'pnpm dlx @angular/cli@22 new taskforge-client --style=scss --ssr=false --skip-git --package-manager=pnpm',
        },
        {
          kind: 'ul',
          items: [
            '`--style=scss` — SCSS כברירת מחדל לכל רכיב חדש; ה-schematic יוגדר ב-`angular.json`.',
            '`--ssr=false` — אנחנו בונים SPA רגיל; Server-Side Rendering אינו חלק מה-scope של הגיד.',
            '`--skip-git` — ה-repo כבר מנוהל ברמה העליונה.',
            '`--package-manager=pnpm` — האנגולר CLI יכתוב `"packageManager": "pnpm"` ל-`client/package.json`.',
          ],
        },
      ],
      panel: {
        kind: 'filetree',
        title: 'הפיגום שנוצר',
        caption: 'הקבצים הדרושים לנו ב-ch06 — ה-scaffold הוא נקודת המוצא.',
        lines: [
          { text: 'client/', depth: 0, kind: 'dir', badge: 'new' },
          { text: 'package.json', depth: 1, kind: 'file', badge: 'new' },
          { text: 'angular.json', depth: 1, kind: 'file', badge: 'new' },
          { text: 'tsconfig.json', depth: 1, kind: 'file', badge: 'new' },
          { text: 'tsconfig.app.json', depth: 1, kind: 'file', badge: 'new' },
          { text: 'tsconfig.spec.json', depth: 1, kind: 'file', badge: 'new' },
          { text: 'src/', depth: 1, kind: 'dir' },
          { text: 'index.html', depth: 2, kind: 'file', badge: 'new' },
          { text: 'main.ts', depth: 2, kind: 'file', badge: 'new' },
          { text: 'styles.scss', depth: 2, kind: 'file', badge: 'new' },
          { text: 'app/', depth: 2, kind: 'dir' },
          { text: 'app.config.ts', depth: 3, kind: 'file', badge: 'new' },
          { text: 'app.ts', depth: 3, kind: 'file', badge: 'new' },
          { text: 'app.html', depth: 3, kind: 'file', badge: 'new' },
          { text: 'app.scss', depth: 3, kind: 'file', badge: 'new' },
          { text: 'app.routes.ts', depth: 3, kind: 'file', badge: 'new' },
          { text: 'app.spec.ts', depth: 3, kind: 'file', badge: 'new' },
        ],
      },
    },

    /* ------------------------------------------------------------ 6.3 */
    {
      id: '6.3',
      title: 'package.json: מה שאין בו מספר יותר',
      blocks: [
        {
          kind: 'p',
          text:
            'מה שבולט ב-`client/package.json` הוא לא מה שיש — אלא מה שאין. ' +
            'ב-Angular v22 אפליקציה חדשה, `zone.js` לא מופיע בשום רשימת dependencies.',
        },
        {
          kind: 'callout',
          tone: 'v22',
          body:
            'ב-Angular v22, zoneless הוא ברירת המחדל לפרויקטים חדשים. ' +
            'ה-CLI לא מוסיף `zone.js` בכלל. זה לא "הסרנו zone.js" — הוא פשוט לא הוזמן.',
        },
        {
          kind: 'ul',
          items: [
            'אין `zone.js` — לא ב-`dependencies` ולא ב-`devDependencies`. זה המסר החשוב.',
            'יש `vitest` ו-`jsdom` ב-`devDependencies` — זה ה-test stack החדש, ללא Karma.',
            '‏`rxjs` נשאר: הראוטר עדיין משתמש ב-`Observable`. signals ו-rxjs חיים בשלום.',
          ],
        },
        {
          kind: 'term',
          name: 'zoneless',
          definition:
            'מצב Angular שבו zone.js אינו מותקן ואינו מטלא (patch) את ה-async APIs. ' +
            'Change detection מתזמן רק על ידי טריגרים מוכרים וסגורים.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch06',
        file: 'client/package.json',
      },
    },

    /* ------------------------------------------------------------ 6.4 */
    {
      id: '6.4',
      title: 'angular.json: המכונה שמסביב',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`client/angular.json` הוא חוזה הבנייה. הוא אומר לכלי מה לבנות, ' +
            'מאיפה לצאת, על איזה פורט לשרת, ואת מה לאפשר עד לגודל.',
        },
        {
          kind: 'ul',
          items: [
            'ה-builder הוא `@angular/build:application` — הדור החדש שמחליף את `@angular-devkit/build-angular`.',
            'פורט ה-serve הוא 4500: ה-API על 5080 ומדריך זה על 4400 כבר "תפוסים".',
            '‏`assets: []` — ה-scaffold מגיע ריק; favicons ותמונות סטטיות יחזרו כשנצטרך אותן.',
            '‏`styles: ["src/styles.scss"]` — קובץ ה-SCSS הגלובלי; כל רכיב מגיע עם scss משלו.',
            'ה-budget הוא 1MB לשגיאה ו-500kB לאזהרה על ה-initial bundle.',
          ],
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch06',
        file: 'client/angular.json',
      },
    },

    /* ------------------------------------------------------------ 6.5 */
    {
      id: '6.5',
      title: 'שלושה tsconfig, חוזה אחד',
      blocks: [
        {
          kind: 'p',
          text:
            'הפרויקט מגיע עם שלושה קבצי tsconfig בהיררכיה: `client/tsconfig.json` הוא הבסיס, ' +
            'וכל אחד מהשניים האחרים מרחיב אותו למטרה ספציפית.',
        },
        {
          kind: 'ul',
          items: [
            '`client/tsconfig.app.json` — בונה את קוד הייצור; מוציא spec files.',
            '`client/tsconfig.spec.json` — טייפ-טסטים בלבד; מוסיף `"types": ["vitest/globals"]`.',
          ],
        },
        {
          kind: 'ul',
          items: [
            '`noImplicitOverride: true` — חייבים לכתוב `override` כשמשתנה method של מחלקת אב.',
            '`noPropertyAccessFromIndexSignature: true` — אסור לכתוב `obj.foo` אם ה-type מוגדר כ-index signature.',
            '`noImplicitReturns: true` — כל ענף ב-function חייב להחזיר ערך.',
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'הפרדת ה-tsconfigs מאפשרת לכל כלי (bundler, test runner) להשתמש ב-types הנכונים. ' +
            '‏`vitest/globals` מזהה `describe`, `it`, `expect` בקוד הבדיקות, בלי לזהם את build של האפליקציה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch06',
        file: 'client/tsconfig.json',
      },
    },

    /* ------------------------------------------------------------ 6.6 */
    {
      id: '6.6',
      title: 'ההצתה: index.html ואז main.ts',
      blocks: [
        {
          kind: 'p',
          text:
            'הדפדפן טוען `client/src/index.html`, מוצא `<app-root>`, ואז Angular מחליף אותו. ' +
            'כל המסע מתחיל בקובץ אחד:',
        },
        {
          kind: 'code',
          lang: 'html',
          title: 'client/src/index.html',
          code: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>TaskForge</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <app-root></app-root>
</body>
</html>`,
        },
        {
          kind: 'p',
          text:
            '‏`client/src/main.ts` הוא נקודת הכניסה. `bootstrapApplication` מקבל את הרכיב הראשי ואת ה-config — ' +
            'אין `NgModule` בשום מקום, אין `AppModule`, אין `BrowserModule`. זו האפליקציה standalone.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch06',
        file: 'client/src/main.ts',
      },
    },

    /* ------------------------------------------------------------ 6.7 */
    {
      id: '6.7',
      title: 'למה zoneless: סוף עידן הניחושים',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-Angular הישן, `zone.js` תפס (patch) את כל ה-async APIs: setTimeout, Promises, addEventListener, XHR. ' +
            'כל אחת מהן יכולה לגרום לשינוי state, אז Angular לא יכול היה לדעת מתי הן מסתיימות, ' +
            'ולכן הריץ change detection אחרי כל אחת מהן.',
        },
        {
          kind: 'p',
          text:
            'Zoneless הופך את הלוגיקה: לא "כל async עלול לשנות דברים", אלא "הנה הרשימה הסגורה של הטריגרים". ' +
            'כל שינוי שלא מגיע דרך הרשימה הזו פשוט לא יגרום לרינדור.',
        },
        {
          kind: 'term',
          name: 'Change Detection',
          definition:
            'המנגנון ש-Angular מפעיל כדי לסנכרן את הסטייט עם ה-DOM. ' +
            'ב-zoneless הוא רץ רק בעקבות טריגר מוכר, ולא אחרי כל async.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ההבדל המעשי בין zoneful ל-zoneless?',
          body:
            'ב-zoneful, zone.js מיירט כל async ומריץ change detection לאחר מכן — גם אם שום דבר לא השתנה. ' +
            'ב-zoneless, רק טריגרים מוכרים (signal write, template event, markForCheck, async pipe) ' +
            'מתזמנים בדיקה. הביצועים טובים יותר, אבל שינוי ב-setTimeout על שדה רגיל לא מגיע למסך.',
        },
      ],
      panel: {
        kind: 'diagram',
        caption: 'zoneful מגיב לכל async; zoneless מגיב רק לטריגרים מוכרים.',
        mermaid: `flowchart TD
  subgraph zoneful["zoneful (zone.js)"]
    A1["setTimeout / Promise / XHR"] --> B1["zone.js interceptor"]
    B1 --> C1["change detection"]
    C1 --> D1["DOM update"]
  end
  subgraph zoneless["zoneless (v22)"]
    A2["signal.write"] --> C2["change detection"]
    A3["template event"] --> C2
    A4["markForCheck"] --> C2
    A5["async pipe"] --> C2
    A6["setTimeout on plain field"] --> X["no render"]
    C2 --> D2["DOM update"]
  end`,
      },
    },

    /* ------------------------------------------------------------ 6.8 */
    {
      id: '6.8',
      title: 'app.config.ts: ההחלטות המרכזיות',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`client/src/app/app.config.ts` הוא המקום שבו ה-providers של האפליקציה כולה מוגדרים. ' +
            'שלושה providers, שלוש החלטות:',
        },
        {
          kind: 'ul',
          items: [
            '‏`provideZonelessChangeDetection()` — מוצהר במפורש, גם כשהוא ברירת המחדל. ' +
              'הקומנט בקוד מסביר למה: "בחירות גלויות עדיפות על מובלעות".',
            '‏`provideBrowserGlobalErrorListeners()` — רושם error handlers גלובליים; ' +
              'שגיאות uncaught מגיעות ל-Angular error handler ולא נאבדות.',
            '‏`provideRouter(routes)` — ה-router מאוגד; `routes` הוא מערך ריק עד לפרק הארכיטקטורה.',
          ],
        },
        {
          kind: 'p',
          text:
            '‏`client/src/app/app.routes.ts` הוא `export const routes: Routes = []` ופסיק. ' +
            'הנתיבים יתמלאו בפרק 07.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch06',
        file: 'client/src/app/app.config.ts',
        region: 'step-6.8',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 6.9 */
    {
      id: '6.9',
      title: 'המגרש: שדה רגיל מול signal',
      blocks: [
        {
          kind: 'p',
          text:
            'הדמו החי מציג שלושה כרטיסים: `plain`, `count()` ו-`double()`. ' +
            'כל אחד מהם מייצג גישה אחרת לניהול ערכים — ואת ההשפעה על הרינדור.',
        },
        {
          kind: 'ul',
          items: [
            'לחיצה על "count.update" מעלה את `count()`, מחשבת מחדש את `double()`, ' +
              'וכותבת שורה ל-log דרך ה-`effect`.',
            'לחיצה על "plain++ בלחיצה" מעדכנת `plain` ו-DOM מתרענן: ' +
              'אירוע תבנית הוא טריגר מוכר, אז רינדור רץ.',
            '"plain++ בתוך setTimeout" — הכפתור לא משנה את ה-DOM: ה-callback רץ ועדכן את `plain`, ' +
              'אבל שום טריגר לא נורה. הכרטיס נשאר מאחור.',
            '"מה הערך באמת?" — קורא ל-`revealTruth()` ומדפיס את הערך האמיתי ל-log. ' +
              'גם הרינדור הזה מסנכרן את כרטיס ה-`plain` הקפוא.',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה מתזמן רינדור באפליקציה zoneless?',
          body:
            'רשימה סגורה וידועה: כתיבה ל-signal (ולכן גם computed שתלוי בו), ' +
            'אירוע תבנית (click, input, וכו.), `markForCheck()`, ו-`async pipe` שמקבל ערך חדש. ' +
            '‏setTimeout, Promise, XHR או כל async שמשנה שדה רגיל — לא מתזמנים כלום.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () => import('./demos/signals.demo').then((m) => m.SignalsDemo),
        caption: 'דמו חי: plain field מול signal — לחצו על הכפתורים ובחנו מה מגיע למסך.',
      },
    },

    /* ------------------------------------------------------------ 6.10 */
    {
      id: '6.10',
      title: 'signal ו-computed בקומפוננטה אמיתית',
      blocks: [
        {
          kind: 'p',
          text:
            'בתוך `client/src/app/app.ts` מגורים שני מושגי הליבה. ' +
            '‏`title` הוא signal פשוט שמחזיק מחרוזת. ' +
            '‏`tagline` הוא computed שקורא את `title()` ומחשב ערך חדש בכל פעם ש-`title` משתנה.',
        },
        {
          kind: 'ul',
          items: [
            'קריאת signal היא קריאת פונקציה: `this.title()`. ' +
              'בתבנית זה `{{ title() }}` — הסוגריים הם לא בסגנון, הם חוזה.',
            '‏`signal.set(val)` מחליף את הערך לחלוטין; `signal.update(fn)` גוזר ערך חדש מהישן.',
            '‏`computed` הוא lazy ומממואז: הוא לא רץ עד שמישהו קורא אותו, ' +
              'ולא חוזר לחשב כשהתלויות שלו לא השתנו.',
          ],
        },
        {
          kind: 'term',
          name: 'signal',
          definition:
            'ערך reactive ב-Angular. signal יודע מי קורא אותו, ' +
            'ומודיע לכולם (computed, effect, תבנית) כשהוא משתנה.',
        },
        {
          kind: 'term',
          name: 'computed',
          definition:
            'signal גזור: ערכו נגזר מ-signals אחרים, הוא lazy ומממואז, ' +
            'ומחשב מחדש רק כשתלות ישירה שלו משתנה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch06',
        file: 'client/src/app/app.ts',
        region: 'step-6.10',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 6.11 */
    {
      id: '6.11',
      title: 'התבנית קוראת, העיצוב ממתין',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`client/src/app/app.html` קורא את ה-signals. `{{ title() }}` ו-`{{ tagline() }}` — ' +
            'האינטרפולציה רגילה, רק שהסוגריים מזכירים שמדובר בפונקציה.',
        },
        {
          kind: 'p',
          text:
            'בתבנית משתמשים גם ב-control flow החדש: `@if` ו-`@for` ' +
            '(ניתן לראות אותם בדמו). אלה לא directives — הם חלק מהסינטקס של הקומפיילר. ' +
            'הם הלחם-חמאה של כל תבנית בפרקים הבאים.',
        },
        {
          kind: 'code',
          lang: 'scss',
          title: 'client/src/app/app.scss',
          code: `.app-header {
  padding: 24px 32px;
  border-bottom: 1px solid #2a2f3a;

  h1 {
    margin: 0;
    font-size: 22px;
  }

  .tagline {
    margin: 4px 0 0;
    color: #8a93a5;
    font-size: 14px;
  }
}

.app-main {
  padding: 32px;
}`,
        },
        {
          kind: 'p',
          text:
            '‏`client/src/styles.scss` כמעט ריק — רק קומנט של ה-scaffold. ' +
            'פרק 08 (Design System) יבנה שם את מערכת ה-tokens והמשתנים הגלובליים.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch06',
        file: 'client/src/app/app.html',
      },
    },

    /* ------------------------------------------------------------ 6.12 */
    {
      id: '6.12',
      title: 'effect: תופעת לוואי, לא ניהול state',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`effect` רץ פעם אחת בהתחלה ואז בכל פעם שאחד ה-signals שהוא קרא בתוך הגוף שלו משתנה. ' +
            'זה הכלי הנכון ל-side effects: לוגינג, עדכון `document.title`, כתיבה ל-localStorage.',
        },
        {
          kind: 'p',
          text:
            'הקוד בפאנל לקוח מ-`signals.demo.ts` ממש כמו שהוא — זה ה-effect שכתב את השורות ל-log בדמו. ' +
            '‏`effect` קורא `this.count()` ו-`this.double()` בתוך גופו, ' +
            'ולכן Angular יודע אוטומטית לאיזה signals להירשם.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'effect לניהול state הוא ריח רע',
          body:
            'effect שרואה שינוי ב-A וכותב ל-B הוא anti-pattern. ' +
            'זה גורם לתלויות מעגליות, קשה לעקוב, וסביר שיוצר bug. ' +
            'אם B נגזר מ-A, זה בדיוק `computed`. effect הוא לפעולות חיצוניות, לא לסנכרון בין signals.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'ל-effect יש injection context — הוא חייב להיווצר כשיש injector פעיל. ' +
            'הבנאי של הקומפוננטה הוא הזמן הנכון, כי Angular עדיין מריץ את ה-DI. ' +
            'קריאה ל-`effect()` בתוך setTimeout או בתוך handler היא שגיאה בזמן ריצה.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'typescript',
        file: 'signals.demo.ts — effect בבנאי',
        code: `constructor() {
  // effect נוצר בתוך injection context — ולכן כאן, בבנאי
  effect(() => {
    this.push(\`effect saw: count = \${this.count()}, double = \${this.double()}\`);
  });
}`,
      },
    },

    /* ------------------------------------------------------------ 6.13 */
    {
      id: '6.13',
      title: 'DI בקליינט: inject() במקום בנאי',
      blocks: [
        {
          kind: 'p',
          text:
            'Angular DI עובד בדיוק כמו בשרת: הצהרה על מה שצריך, ו-framework מספק. ' +
            'ב-Angular v22 הסגנון המועדף הוא `inject()` — פונקציה, לא פרמטר בבנאי.',
        },
        {
          kind: 'ul',
          items: [
            '‏`providedIn: "root"` פירושו singleton: Angular יוצר instance אחד לכל מחזור חיי האפליקציה.',
            '`inject()` חייב לרוץ בזמן injection context — בנאי, class field initializer, או בתוך `runInInjectionContext`.',
            'אפשר לספק שירות ברמת הקומפוננטה (`providers: [MyService]`) — ' +
              'אז נוצר instance נפרד לכל instance של הרכיב, הכי קרוב לאפקט "scoped" של .NET.',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'במה שונה ה-DI של Angular מזה של ASP.NET שפגשתם בפרק 01?',
          body:
            '"root" הוא כמו Singleton: instance אחד לכל מחזור האפליקציה. ' +
            'ב-Angular אין per-request scope — SPA לא מכיר את המחזור של request. ' +
            'הקרוב ביותר ל-Scoped הוא providers ברמת קומפוננטה: instance חי כל עוד הרכיב חי. ' +
            'Transient מתקבל בקריאה לשירות factory ידנית.',
        },
        {
          kind: 'term',
          name: 'inject()',
          definition:
            'פונקציה ב-Angular לקבלת dependency מ-DI container. ' +
            'חייבת לרוץ בתוך injection context (בנאי, class field, `runInInjectionContext`).',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'typescript',
        code: `import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// teaser — שירות זה יגיע בפרק הבא (ch07)
@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);

  getProjects() {
    return this.http.get('/api/projects');
  }
}`,
      },
    },

    /* ------------------------------------------------------------ 6.14 */
    {
      id: '6.14',
      title: 'הטסט הראשון רץ על vitest',
      blocks: [
        {
          kind: 'p',
          text:
            'טסטים הם חלק מהקוד, לא מחשבה-שאחרי — ולכן ה-scaffold מגיע עם טסט מהיום הראשון. ' +
            '‏`client/src/app/app.spec.ts` כתוב עם `TestBed` — ה-API הסטנדרטי לבדיקת רכיבים, ' +
            'אבל עם idiom אחד שונה לעידן zoneless.',
        },
        {
          kind: 'ul',
          items: [
            'הטסט הראשון: `expect(app).toBeTruthy()` — האפליקציה נוצרת ללא שגיאות.',
            'הטסט השני: `await fixture.whenStable()` במקום `fixture.detectChanges()`. ' +
              'ב-zoneless, `detectChanges()` עדיין עובד, אבל `whenStable()` הוא ה-idiom החדש: ' +
              'הוא מחכה שכל ה-signals יתייצבו לפני שבודקים את ה-DOM.',
            'בודקים `h1` ו-`.tagline` — מה שהשלד מציג, גלוי ומדיד.',
          ],
        },
        {
          kind: 'callout',
          tone: 'v22',
          body:
            'ב-zoneless, `fixture.detectChanges()` לא תמיד מספיק — הוא יכול לרוץ לפני שה-scheduler של Angular ' +
            'מתזמן את הרינדור. `await fixture.whenStable()` מחכה לסוף כל ה-microtasks ומבטיח שה-DOM מעודכן.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch06',
        file: 'client/src/app/app.spec.ts',
      },
    },

    /* ------------------------------------------------------------ 6.15 */
    {
      id: '6.15',
      title: 'שני שרתים, צעד אחד קדימה',
      blocks: [
        {
          kind: 'p',
          text:
            'בסוף פרק 06 יש לנו קליינט שרץ. הנה הסיכום:',
        },
        {
          kind: 'ul',
          items: [
            'scaffold שנוצר עם `ng new`, ממושמע עם SCSS ו-vitest.',
            '‏`zoneless` כברירת מחדל — ללא `zone.js`, ללא ניחושים.',
            '‏`signal`, `computed` ו-`effect` — המשולש שמחליף מחזורי חיים ישנים.',
            '‏`bootstrapApplication` עם `appConfig` — בלי NgModule.',
            '‏`inject()` — הסגנון החדש של DI.',
            'שני טסטים ירוקים על vitest עם `whenStable()`.',
          ],
        },
        {
          kind: 'p',
          text:
            'להרצה: פתחו שני terminals. ב-`server/TaskForge.Api` הריצו `dotnet run` (פורט 5080). ' +
            'ב-`client/` הריצו `pnpm start` (פורט 4500). ' +
            'פתחו `http://localhost:4500` וראו "TaskForge — issues, forged by hand".',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'לאן ממשיכים',
          body:
            'פרק 07 "ארכיטקטורת הקליינט" לוקח את ה-scaffold הזה וממסגר אותו: ' +
            'core/shared/features, רכיבים חכמים מול טיפשים, גבולות state, ' +
            'וחוזי API מול ה-DTOs של השרת שבנינו בפרקים 01–05.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch06',
        title: 'הקליינט נולד — עץ הקוד אחרי פרק 06',
      },
    },
  ],

  quiz: [
    {
      q: 'מה מתזמן רינדור באפליקציה Angular v22 zoneless?',
      options: [
        'כל setTimeout ו-Promise שמסתיימים',
        'כתיבה ל-signal, אירוע תבנית, markForCheck ו-async pipe',
        'כל שינוי בשדה של קלאס, כולל שדות רגילים',
        'רק http requests שמסתיימים',
      ],
      answer: 1,
      explain:
        'ב-zoneless יש רשימה סגורה: signal write, template event, markForCheck, async pipe. ' +
        'שדה רגיל שהשתנה ב-setTimeout לא מפעיל כלום.',
    },
    {
      q: 'מה ההבדל בין `signal` לשדה קלאס רגיל ב-Angular v22?',
      options: [
        'אין הבדל — Angular עוקב אחרי שניהם',
        'signal הוא immutable, שדה רגיל הוא mutable',
        'signal מודיע לתבנית ול-computed בכל שינוי; שדה רגיל עלול להיות מאחור ב-zoneless',
        'שדה רגיל מהיר יותר ולכן עדיף',
      ],
      answer: 2,
      explain:
        'ב-zoneless, שינוי בשדה רגיל מחוץ לטריגר מוכר לא מגיע לתבנית. ' +
        'signal מבטיח שכל תלות תתעדכן מיד.',
    },
    {
      q: 'מתי כדאי להשתמש ב-`computed` ומתי ב-`effect`?',
      options: [
        'computed לסנכרון state, effect לערכים גזורים',
        'computed לערכים גזורים מ-signals; effect לפעולות חיצוניות כמו document.title או לוגינג',
        'אין הבדל — שניהם אותו דבר',
        'effect תמיד עדיף כי הוא יותר גמיש',
      ],
      answer: 1,
      explain:
        'computed נועד לגזור ערך מ-signals קיימים — הוא lazy ומממואז. ' +
        'effect נועד ל-side effects חיצוניים. שימוש ב-effect לסנכרון state הוא anti-pattern.',
    },
    {
      q: 'למה `zone.js` לא מופיע ב-`package.json` של Angular v22 חדש?',
      options: [
        'כי שכחו להוסיף אותו',
        'כי zone.js הוסר לגמרי מ-Angular',
        'כי ב-v22 zoneless הוא ברירת המחדל, ו-zone.js לא נדרש',
        'כי zone.js משולב עכשיו ב-@angular/core',
      ],
      answer: 2,
      explain:
        'ב-Angular v22, CLI יוצר אפליקציות עם provideZonelessChangeDetection כברירת מחדל. ' +
        'zone.js לא מוסר — הוא פשוט לא מוזמן.',
    },
    {
      q: 'מדוע `app.spec.ts` משתמש ב-`await fixture.whenStable()` ולא ב-`fixture.detectChanges()`?',
      options: [
        'כי detectChanges הוסרה ב-v22',
        'כי whenStable מחכה שכל ה-signals יתייצבו לפני בדיקת ה-DOM, שזה הסטנדרט ב-zoneless',
        'כי whenStable מהיר יותר',
        'כי detectChanges עובד רק עם NgModule',
      ],
      answer: 1,
      explain:
        'ב-zoneless, הרינדור מתוזמן באופן אסינכרוני. ' +
        'whenStable מחכה לסוף כל ה-microtasks ומבטיח שה-DOM מסונכרן עם ה-signals.',
    },
    {
      q: 'מה ההבדל בין `providedIn: "root"` ל-providers ברמת קומפוננטה?',
      options: [
        'אין הבדל — שניהם יוצרים instance אחד',
        '"root" יוצר singleton לכל האפליקציה; providers ברמת קומפוננטה יוצרים instance נפרד לכל instance של הרכיב',
        '"root" הוא רק ל-HTTP services; component providers הם לכולם',
        'providers ברמת קומפוננטה לא נתמכים ב-standalone components',
      ],
      answer: 1,
      explain:
        '"root" מקביל ל-Singleton של ASP.NET — instance אחד לכל החיים. ' +
        'component providers מקבילים ל-Scoped — instance נוצר ומושמד עם הרכיב.',
    },
  ],

  proveIt: [
    {
      title: 'ng serve על פורט 4500',
      body: 'הריצו `pnpm start` בתוך `client/` ופתחו `http://localhost:4500`.',
      command: 'cd client && pnpm start',
      expect: 'הדפדפן מציג כותרת "TaskForge" ו-tagline "issues, forged by hand"',
    },
    {
      title: 'HMR מגיב לשינוי tagline',
      body: 'ערכו את הערך של `title` ב-`app.ts` לכל מחרוזת אחרת ושמרו.',
      command: 'ערכו client/src/app/app.ts',
      expect: 'הדפדפן מתעדכן מיד בלי רענון עמוד; הכותרת והטאגליין משתנים',
    },
    {
      title: 'setTimeout לא מעדכן את המסך',
      body:
        'פתחו את הדמו החי בפרק 6.9, לחצו "plain++ בתוך setTimeout" מספר פעמים, ' +
        'ואז בדקו את ה-DOM.',
      expect: 'כרטיס ה-plain לא מתעדכן; רק לחיצה על "מה הערך באמת?" מסנכרן אותו',
    },
    {
      title: 'pnpm test — שני טסטים ירוקים',
      body: 'הריצו את הטסטים של ה-client.',
      command: 'cd client && pnpm test',
      expect: 'vitest מדווח 2 passed, 0 failed',
    },
    {
      title: 'pnpm build — budget table',
      body: 'הריצו build מלא של ה-client.',
      command: 'cd client && pnpm build',
      expect: 'build מסתיים ב-0 errors; טבלת ה-budget מציגה initial bundle הרחק מהגבול',
    },
  ],

  exercise: {
    prompt:
      'הוסיפו שעון חי לרכיב App: שניות שמתעדכן כל שנייה, ' +
      'ו-effect שמסנכרן את `document.title` עם ה-title signal. ' +
      'זה תרגיל שמכריח אתכם לחבר signals, effect, DestroyRef ו-setInterval.',
    tasks: [
      'הוסיפו `protected readonly seconds = signal(0)` ל-`App`.',
      'ב-constructor, קראו ל-`inject(DestroyRef)` ושמרו ב-`private readonly destroyRef`.',
      'ב-constructor, שמרו `const id = setInterval(() => this.seconds.update(s => s + 1), 1000)` ' +
        'ורשמו `destroyRef.onDestroy(() => clearInterval(id))` לניקוי.',
      'הציגו `{{ seconds() }}` בתבנית.',
      'הוסיפו `effect(() => { document.title = this.title(); })` ב-constructor.',
      'הריצו `pnpm test` ו-`pnpm build` ווודאו שהכל עובר.',
    ],
    acceptance: [
      'כרטיס השניות מתעדכן כל שנייה ב-DOM.',
      'כשהרכיב נהרס, ה-interval מתנקה ולא מדליף זיכרון.',
      '`document.title` משתנה כש-`title` משתנה — אפשר לאמת ב-DevTools.',
      'כל הטסטים הקיימים עדיין עוברים.',
    ],
  },
};
