import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 26 — Capstone: מפת סיכום ופינאלה של תרגול ראיונות.
 * Wave 6 Finale. NO new code — recap and synthesis only.
 * Revisits the full 26-chapter journey wave by wave, crystallises the recurring
 * mental models (seams, DIP, optimistic UI, zoneless, cache invalidation),
 * presents a full-architecture diagram, and closes with an interview-readiness
 * finale and a vertical-slice capstone exercise.
 */
export const CH26_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 26.1 */
    {
      id: '26.1',
      title: 'הפרק: הבניין בשלמותו',
      blocks: [
        {
          kind: 'p',
          text:
            'כ-26 פרקים, שישה גלים, ואפליקציית fullstack שלמה אחת. ' +
            'TaskForge פועלת: .NET 10 Minimal API, SQLite, Angular v22 zoneless, ' +
            'Docker, CI, ו-SignalR ב-production. ' +
            'פרק זה לא מוסיף שורת קוד — הוא עוצר, סוקר, ומחבר את הנקודות.',
        },
        {
          kind: 'p',
          text:
            'מה שתמצאו כאן: מפת הדרך של כל גל, לקחי-הנקודה שחזרו על עצמם, ' +
            'דיאגרמת הארכיטקטורה הסופית, ' +
            'שאלות-ראיון שה-build הזה מתרגל לענות עליהן, ' +
            'ותרגיל capstone אחד שמבקש מכם להוסיף vertical slice שלם לאפליקציה.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'אם אתם חוזרים מפרק אחד ספציפי: השתמשו ב-"drill" שבסרגל הצד ' +
            'לתרגל את שאלות הראיון לפי נושא; ' +
            'ה-glossary מכיל את כל המושגים לפי פרק.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch25',
        title: 'TaskForge — העץ הסופי (אחרי פרק 25)',
      },
    },

    /* ------------------------------------------------------------ 26.2 */
    {
      id: '26.2',
      title: 'גל 0 — Setup: הכלים והמפה',
      blocks: [
        {
          kind: 'p',
          text:
            'פרק 00 הניח את הבסיס: .NET 10, Node, pnpm, Angular CLI, ' +
            'ושלד ריפו עם שלוש תיקיות (`server/`, `client/`, `context/`). ' +
            'ניתוח המוצר (TaskForge = issue tracker) הפך לארכיטקטורה: ' +
            'מה ה-entities, מה המסכים, ומה סדר הבנייה.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה להתחיל בניתוח מוצר ולא בקוד? ' +
            'כל החלטה ארכיטקטונית שבאה אחרי (repositories, stores, signals) ' +
            'ניתן לקשור לדרישה אמיתית: `IsMemberAsync` קיים כי ProjectMember הוא ה-authorization unit; ' +
            '`IssuesStore` קיים כי לוח ה-Issues הוא המסך המרכזי; ' +
            'SignalR קיים כי שיתוף פעולה בזמן-אמת היא דרישה ליבתית.',
        },
      ],
      panel: {
        kind: 'filetree',
        title: 'הריפו אחרי פרק 00 — שלד בלבד',
        lines: [
          { text: 'taskforge/', depth: 0, kind: 'dir' },
          { text: 'server/', depth: 1, kind: 'dir' },
          { text: 'TaskForge.sln / TaskForge.slnx', depth: 2, kind: 'file' },
          { text: 'TaskForge.Api/', depth: 2, kind: 'dir' },
          { text: 'client/', depth: 1, kind: 'dir' },
          { text: 'package.json / angular.json', depth: 2, kind: 'file' },
          { text: 'src/app/app.ts', depth: 2, kind: 'file' },
          { text: 'context/', depth: 1, kind: 'comment' },
        ],
        caption: 'שלד בלבד — בלי ישויות, בלי routing, בלי database. ה-skeleton מגדיר גבולות לפני שממלאים אותם.',
      },
    },

    /* ------------------------------------------------------------ 26.3 */
    {
      id: '26.3',
      title: 'גל 1 — Backend Core: .NET מהבסיס ועד Auth',
      blocks: [
        {
          kind: 'p',
          text:
            'חמישה פרקים בנו את שכבת השרת: ' +
            'פרק 01 פירק `Program.cs` לשני חצאים (DI + pipeline) עם אנימציה אינטראקטיבית; ' +
            'פרק 02 הציג את שלוש-השכבות `TaskForge.Core` / `TaskForge.Infrastructure` / `TaskForge.Api` ' +
            'וחוק התלות (Core לא מכיר שכבה חיצונית); ' +
            'פרק 03 הוסיף EF Core + SQLite, ישויות, fluent API, מיגרציות, seeding; ' +
            'פרק 04 בנה את ה-HTTP layer (records כ-DTOs, `MapGroup`, `TypedResults`, ProblemDetails, validation, OpenAPI); ' +
            'פרק 05 הוסיף Auth ביד: PBKDF2, JWT + refresh rotation, `IsMemberAsync`.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה `IProjectRepository` מוגדר ב-`TaskForge.Core` ולא ב-`TaskForge.Infrastructure`?',
          body:
            'זה עקרון היפוך התלות (DIP, ה-D של SOLID): שכבות גבוהות לא תלויות בנמוכות — שתיהן תלויות בהפשטה. ' +
            'ה-Core מגדיר אילו שירותים הוא זקוק להם (`IProjectRepository`); ' +
            'ה-Infrastructure מספק אותם (`EfProjectRepository`). ' +
            'המשמעות המעשית: אפשר להחליף את כל Infrastructure (EF Core -> Dapper, SQLite -> Postgres) ' +
            'בלי לגעת בשורת Core או Api אחת.',
        },
        {
          kind: 'term',
          name: 'DIP',
          definition:
            'Dependency Inversion Principle: "תלה בהפשטות, לא בקונקרטיות". ' +
            'ב-TaskForge: Core מגדיר את `IProjectRepository` ו-`IIssueRepository`; ' +
            'Infrastructure מממש; Api מזריק את הממשק ולא את המימוש. ' +
            'תוצאה: כל `I*` interface שיצרנו הוא seam — נקודה שאפשר לחבר/לנתק בלי לשנות את מה שמסביב.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch02',
        file: 'server/TaskForge.Core/Abstractions/IProjectRepository.cs',
        title: 'IProjectRepository — ה-seam הראשון: Core מגדיר, Infrastructure מממש',
      },
    },

    /* ------------------------------------------------------------ 26.4 */
    {
      id: '26.4',
      title: 'גל 2 — Frontend Foundation: Angular v22 zoneless',
      blocks: [
        {
          kind: 'p',
          text:
            'שישה פרקים בנו את שכבת הלקוח: ' +
            'פרק 06 הציג zoneless (ללא Zone.js, change detection על בסיס signals), signals + computed + effect; ' +
            'פרק 07 קבע ארכיטקטורה `core/shared/features`, smart/dumb, seam בין stores לרכיבים; ' +
            'פרק 08 הגדיר design tokens, `@layer`, logical properties ו-RTL; ' +
            'פרק 09 בנה UI kit: `<tf-button>`, `<tf-field>`, `<tf-badge>`, `<dialog>`, toast; ' +
            'פרק 10 הוסיף routing lazy, guards, resolvers, `withComponentInputBinding`; ' +
            'פרק 11 חיבר שרת-לקוח: CORS, `httpResource`, interceptors פונקציונליים, `TokenStore`, ProblemDetails לטוסט.',
        },
        {
          kind: 'p',
          text:
            'ה-"seam" של פרק 11 היה הפירעון של הבטחת פרק 07: ' +
            'הפרויקטים עברו ממוק ל-`httpResource` ב-`ProjectsStore`, ' +
            'ואף רכיב לא השתנה. ' +
            'הציבור נשמר: `projects()`, `loading()`, `loadError()` — זהים לפני ואחרי.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ההבדל בין `zoneless` ל-`zone.js`? מדוע בחרנו zoneless?',
          body:
            'Zone.js "monkey-patches" כל async API (setTimeout, Promise, event listeners) ' +
            'ומפעיל change detection אחרי כל אחד מהם. ' +
            'Angular zoneless מפעיל change detection רק כשsignal משתנה — ' +
            'קוד חיצוני (SignalR, שעוני browser) עובד בלי `NgZone.run(...)`. ' +
            'תוצאה מעשית: `@microsoft/signalr` כתב ל-signals ישירות, Angular זיהה — אפס wrappers.',
        },
        {
          kind: 'term',
          name: 'zoneless',
          definition:
            'מצב Angular (זמין מ-v17, יציב ב-v22) שמשבית את Zone.js: ' +
            'change detection מתבסס על Signals, לא על async patches. ' +
            'יתרון: ביצועים טובים יותר, integration עם ספריות חיצוניות, bundle קטן יותר. ' +
            'ב-TaskForge: `provideZonelessChangeDetection()` ב-`app.config.ts`.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch11',
        file: 'client/src/app/core/state/projects.store.ts',
        region: 'step-11.6',
        title: 'ProjectsStore — ציבור זהה לפני ואחרי: projects(), loading(), loadError()',
      },
    },

    /* ------------------------------------------------------------ 26.5 */
    {
      id: '26.5',
      title: 'גל 3 — Features: הלב של TaskForge',
      blocks: [
        {
          kind: 'p',
          text:
            'שלושה פרקים בנו את הפיצ\'רים האמיתיים: ' +
            'פרק 12 הוסיף רשימת פרויקטים, יצירה, ניהול חברים ותפקידים; ' +
            'פרק 13 הוסיף את לוח ה-Issues — הפיצ\'ר המרכזי — ' +
            'עם URL-as-state (סינון + מיון + דף מסונכרנים ל-query string), ' +
            'עדכונים אופטימיים עם rollback, `@defer` ו-virtual scroll; ' +
            'פרק 14 הוסיף Signal Forms לעומק: ולידציה אסינכרונית, ' +
            'רכיבי טופס מותאמים (`priority-picker`), ו-View Transitions.',
        },
        {
          kind: 'p',
          text:
            'העיקרון המרכזי של גל 3: URL הוא ה-state. ' +
            'סינון, מיון ומספר עמוד חיים ב-query string — ' +
            'ריענון, שיתוף קישור, לחצן "חזרה": כולם עובדים ללא קוד מיוחד. ' +
            'ה-`IssuesStore` קורא params מה-URL ו-`httpResource` פועל על בסיסם.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה "URL-as-state" ומה היתרון שלו לעומת state ב-store בלבד?',
          body:
            'URL-as-state: כל מצב UI שמשתמש עשוי לרצות לשמור/לשתף מיוצג ב-URL. ' +
            'ב-`/projects/1/issues?status=Open&sort=priority&page=2`: ' +
            'ריענון חוזר לאותו מצב; שיתוף קישור — הנמען רואה אותו מסך; ' +
            'כפתור "חזרה" עובד. State ב-store בלבד אובד ברענון.',
        },
      ],
      panel: {
        kind: 'filetree',
        title: 'קבצי גל 3 — Projects, Issues ו-Issue Detail',
        lines: [
          { text: 'client/src/app/features/', depth: 0, kind: 'dir' },
          { text: 'projects/', depth: 1, kind: 'dir' },
          { text: 'project-list.ts / .html', depth: 2, kind: 'file' },
          { text: 'project-card.ts / .html', depth: 2, kind: 'file' },
          { text: 'project-board.ts / .html', depth: 2, kind: 'file' },
          { text: 'project-members.ts', depth: 2, kind: 'file' },
          { text: 'issues/', depth: 1, kind: 'dir' },
          { text: 'issue-board.ts / .html', depth: 2, kind: 'file' },
          { text: 'issue-card.ts / .html', depth: 2, kind: 'file' },
          { text: 'issue-detail.ts / .html', depth: 2, kind: 'file' },
          { text: 'issue-comment.ts', depth: 2, kind: 'file' },
          { text: 'core/state/', depth: 0, kind: 'dir' },
          { text: 'issues.store.ts', depth: 1, kind: 'file' },
          { text: 'issue-detail.store.ts', depth: 1, kind: 'file' },
          { text: 'projects.store.ts', depth: 1, kind: 'file' },
        ],
        caption: 'גל 3 = תשתית features: smart stores + dumb רכיבים + URL-as-state',
      },
    },

    /* ------------------------------------------------------------ 26.6 */
    {
      id: '26.6',
      title: 'גל 4 — Craft: עיצוב, מקלדת, DnD, דשבורד ו-State',
      blocks: [
        {
          kind: 'p',
          text:
            'ששה פרקים שדרגו כל שכבה: ' +
            'פרק 15 — Modern CSS 2026: subgrid, anchor positioning, `:has()`, OKLCH; ' +
            'פרק 16 — Cmd-K palette: `keyboard service`, command registry, `CommandBus`, fuzzy search, focus trap; ' +
            'פרק 17 — Kanban DnD: pointer + keyboard reorder נגישים, rank מספרי, עדכונים אופטימיים + rollback; ' +
            'פרק 18 — Dashboard: summary cards, activity feed, SVG charts ידניים, derived selectors; ' +
            'פרק 19 — Issue עשיר: markdown editor, mentions, attachments, activity timeline, undo; ' +
            'פרק 20 — State capstone: ריפקטור `IssuesStore` ל-`@ngrx/signals` תוך שימור public surface.',
        },
        {
          kind: 'p',
          text:
            'פרק 20 הוא ה-capstone של גל 4 כי הוא מוכיח את ה-seam: ' +
            '`issue-board` ו-`kanban-board` לא הרגישו שהמימוש הפנימי של ה-store עבר לספרייה. ' +
            'ה-public surface (computed selectors + commands) נשמר לחלוטין.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה "optimistic UI" ומה מנגנון ה-rollback?',
          body:
            'Optimistic UI: מחיל שינוי מיד ב-UI (לפני שהשרת מאשר) כדי לספק תחושת מהירות. ' +
            'ב-`kanban-board` (פרק 17): הזזת כרטיס מעדכנת את ה-rank מיד. ' +
            'אם ה-PATCH נכשל, `optimistic()` util (פרק 17) משחזר את ה-snapshot הקודם. ' +
            'המשתמש רואה rollback — חזרה לעמדה הקודמת — עם toast שמסביר.',
        },
        {
          kind: 'term',
          name: 'optimistic UI',
          definition:
            'דפוס UI שמחיל שינוי מיד (לפני תשובת השרת) ומחזיר אחורה אם השרת נכשל. ' +
            'יתרון: תגובתיות מרגישה מיידית. ' +
            'סיכון: אם rollback לא מומש, השרת ו-UI עשויים לסתור. ' +
            'ב-TaskForge: `optimistic()` util (פרקים 13, 17) מנהל snapshot-before + restore.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch20',
        file: 'client/src/app/core/state/issues.store.ts',
        region: 'step-20.2',
        title: 'issues.store.ts — signalStore + withEntities: ה-store לאחר ריפקטור ל-@ngrx/signals',
      },
    },

    /* ------------------------------------------------------------ 26.7 */
    {
      id: '26.7',
      title: 'גל 5 — Quality: בדיקות, ביצועים ונגישות',
      blocks: [
        {
          kind: 'p',
          text:
            'שני פרקים הפכו את TaskForge לאפליקציה מוכנה לייצור מבחינת איכות: ' +
            'פרק 21 — Testing: xUnit + SQLite in-memory לבדיקות repository ' +
            '(האינטגרציה נגד DB אמיתי, לא מוק), ' +
            'vitest לפונקציות טהורות (pure utilities, optimistic util), ' +
            'ועיצוב e2e קונצפטואלי (Playwright); ' +
            'פרק 22 — ביצועים ונגישות: route preloading (idle strategy), ' +
            '`@defer` + `prefetch on idle`, bundle anatomy, ' +
            'skip-link + landmarks, `aria-live`, focus management, axe/Lighthouse.',
        },
        {
          kind: 'p',
          text:
            'הלקח של גל 5: "מודדים, לא מנחשים". ' +
            'בדיקה ב-SQLite in-memory מוכיחה שה-repository לא שובר שאילתות; ' +
            'Lighthouse מראה Time to Interactive בדיוק; ' +
            'axe מאתר הפרות WCAG שסריקה ידנית מחמיצה.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה "פירמידת הבדיקות" של TaskForge ואיפה כל שכבה מתרכזת?',
          body:
            'בסיס (מהיר, הרבה): xUnit repository tests ב-SQLite in-memory — בדיקות אינטגרציה שנוגעות ב-DB ממשי. ' +
            'אמצע: vitest לפונקציות טהורות (optimistic util, URL builder, selectors). ' +
            'קצה (איטי, מעט): e2e קונצפטואלי (Playwright) — login flow, issue create to display. ' +
            'ה-CI ב-ch25 רץ בדיוק בסדר הזה.',
        },
      ],
      panel: {
        kind: 'filetree',
        title: 'קבצי בדיקות — גל 5',
        lines: [
          { text: 'server/TaskForge.Infrastructure.Tests/', depth: 0, kind: 'dir' },
          { text: 'Repositories/', depth: 1, kind: 'dir' },
          { text: 'ProjectRepositoryTests.cs', depth: 2, kind: 'file' },
          { text: 'IssueRepositoryTests.cs', depth: 2, kind: 'file' },
          { text: 'client/src/', depth: 0, kind: 'dir' },
          { text: 'app/core/state/issues.store.spec.ts', depth: 1, kind: 'file' },
          { text: 'app/core/util/optimistic.spec.ts', depth: 1, kind: 'file' },
        ],
        caption: 'כל קובץ בדיקה תואם ל-seam: tests לrepositories, vitest לפונקציות טהורות',
      },
    },

    /* ------------------------------------------------------------ 26.8 */
    {
      id: '26.8',
      title: 'גל 6 — Production: הקשחה, זמן-אמת, Docker ו-CI',
      blocks: [
        {
          kind: 'p',
          text:
            'שלושה פרקים סיימו את המסע: ' +
            'פרק 23 — הקשחה: OutputCaching עם tag-eviction, ResponseCompression (Brotli), ' +
            'RateLimiter (auth fixed-window + global per-IP), security headers, fail-fast על `Jwt:Key`; ' +
            'פרק 24 — SignalR: `BoardHub`, `IBoardNotifier` seam, שלושה event records, ' +
            'echo-skip לפי `origin`, reconnect-reconcile; ' +
            'פרק 25 — Ship It: multi-stage Dockerfiles, nginx כ-reverse proxy עם WebSocket upgrade, ' +
            'docker-compose + `.env.example`, CI ב-GitHub Actions שמריץ את כל ה-gates.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה seam ב-SignalR? למה `IBoardNotifier` ולא ישר `IHubContext<BoardHub>`?',
          body:
            '`IBoardNotifier` מנתק את ה-handlers מ-SignalR. ' +
            'ב-testing: אפשר להחליף ב-`NoOpBoardNotifier` — ה-handler נבדק בלי WebSocket בכלל. ' +
            'ב-scaling: אפשר להחליף ב-`RedisBoardNotifier` שמשתמש ב-Redis backplane — ' +
            'ה-handlers לא ישתנו. ' +
            'זה בדיוק מה ש-`IProjectRepository` עשה לשכבת הנתונים בפרק 02.',
        },
        {
          kind: 'term',
          name: 'vertical slice',
          definition:
            'פיצ\'ר שחוצה את כל שכבות הסטק מ-DB ועד UI: entity + migration, repository + seam, endpoint עם authz, store, component, tests. ' +
            'ב-TaskForge: כל פרק מגל 3 ומעלה הוא vertical slice — הוכחה שהארכיטקטורה תומכת בצמיחה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch24',
        file: 'server/TaskForge.Api/Realtime/IBoardNotifier.cs',
        region: 'step-24.3b',
        title: 'IBoardNotifier — ה-seam של realtime: handlers תלויים בממשק, לא ב-SignalR',
      },
    },

    /* ------------------------------------------------------------ 26.9 */
    {
      id: '26.9',
      title: 'הלקח שחזר: seams משתלמים',
      blocks: [
        {
          kind: 'p',
          text:
            'אם יש נקודה אחת שחזרה בכל גל, זו: seam שבנינו מוקדם השתלם מאוחר. ' +
            'כל `I*` interface נגע ב-use case חדש מבלי לשכתב את מה שכבר עבד:',
        },
        {
          kind: 'ul',
          items: [
            '`IProjectRepository` / `IIssueRepository` (פרק 02) — אפשרו בדיקות in-memory (פרק 21)',
            '`authInterceptor` (פרק 11) — הוסיף `X-Connection-Id` (פרק 24) בשורה אחת, ללא נגיעה ברכיבים',
            '`errorInterceptor` (פרק 11) — הוסיף ענפי 409 (פרק 12), 429 (פרק 23) — "one place to update the world"',
            'נקודות ה-write ב-`IssueEndpoints` (פרק 04) — קיבלו cache eviction (פרק 23) ו-SignalR broadcast (פרק 24) בלי לשנות את ה-domain logic',
            'Public surface של `IssuesStore` (פרק 11-13) — אפשרה ריפקטור ל-`@ngrx/signals` (פרק 20) בלי נגיעה ב-`issue-board` ו-`kanban-board`',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'כיצד ה-handlers ב-`IssueEndpoints` גדלו ב-ch23 וב-ch24 בלי לשבור מבחנים?',
          body:
            'כל handler של כתיבה קיבל שני parameters חדשים: `IOutputCacheStore cache` ו-`IBoardNotifier notifier`. ' +
            'שניהם הוזרקו דרך DI — ה-handler עצמו לא השתנה מבחינת הלוגיקה, ' +
            'רק הוסיפו קריאה ל-`EvictStatsAsync` ול-`notifier.IssueChangedAsync` אחרי הכתיבה. ' +
            'בדיקות ה-repository לא נגעו ב-handler כלל — הן בדקו את ה-repository seam ישירות.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch24',
        file: 'server/TaskForge.Api/Endpoints/IssueEndpoints.cs',
        region: 'step-24.8',
        title: 'IssueEndpoints.cs — CreateIssue: eviction + broadcast = שני side effects, seams קיימים',
      },
    },

    /* ------------------------------------------------------------ 26.10 */
    {
      id: '26.10',
      title: 'דיאגרמת ארכיטקטורה: TaskForge בשלמותה',
      blocks: [
        {
          kind: 'p',
          text:
            'הדיאגרמה מציגה את שני ה-transports (HTTP ו-WebSocket), ' +
            'את גבול nginx כ-reverse proxy, ' +
            'ואת כל שכבות המערכת. ' +
            'קראו אותה כ-"מסלול הבקשה": לחיצת "Create Issue" עוברת client signal stores, ' +
            'authInterceptor (Bearer + X-Connection-Id), nginx, ' +
            'API middleware pipeline (rate limiter, auth, output cache), ' +
            'handler, EF Core, SQLite, ' +
            'ואז eviction ו-broadcast.',
        },
        {
          kind: 'p',
          text:
            'מסלול ה-SignalR (הכיוון ההפוך): ' +
            'handler קורא ל-`IBoardNotifier`, ' +
            '`SignalRBoardNotifier` שולח ל-`IHubContext<BoardHub>`, ' +
            'ה-hub שולח ל-group `project-{id}`, ' +
            'הלקוח B מקבל event ו-`BoardConnection` קורא `applyRemoteUpsert` ב-`IssuesStore`.',
        },
      ],
      panel: {
        kind: 'diagram',
        caption: 'TaskForge — ארכיטקטורת הסוף: HTTP + SignalR, nginx, API layers, SQLite',
        mermaid: `flowchart TB
  subgraph Browser["Browser (zoneless Angular v22)"]
    Stores["Signal Stores\\nProjectsStore / IssuesStore\\nIssueDetailStore"]
    BC["BoardConnection\\n@microsoft/signalr"]
    AI["authInterceptor\\nBearer + X-Connection-Id"]
    EI["errorInterceptor\\nProblemDetails"]
  end

  subgraph Nginx["nginx (Docker, port 80)"]
    Static["Static files\\n(Angular build)"]
    Proxy["reverse_proxy /api\\n+ /hubs WebSocket upgrade"]
  end

  subgraph API["TaskForge.Api (.NET 10, port 5080)"]
    Pipeline["Pipeline\\nRateLimiter | Auth | OutputCache\\nResponseCompression | SecurityHeaders"]
    Handlers["Minimal API Handlers\\nMapGroup + TypedResults\\n[AsParameters] + ProblemDetails"]
    Hub["BoardHub\\n[Authorize] + IsMemberAsync\\nJoinProject / LeaveProject"]
    BN["IBoardNotifier\\nSignalRBoardNotifier"]
    Cache["IOutputCacheStore\\nEvictByTagAsync"]
  end

  subgraph Core["TaskForge.Core"]
    Repos["IProjectRepository\\nIIssueRepository"]
    Auth["IsMemberAsync\\nresource-based authz"]
  end

  subgraph Infra["TaskForge.Infrastructure"]
    EF["EF Core\\nEfProjectRepository\\nEfIssueRepository"]
    SQLite["SQLite\\ntaskforge.db"]
  end

  Stores -- "HTTP REST" --> AI
  AI --> Proxy
  BC -- "WebSocket" --> Proxy
  Proxy --> Pipeline
  Pipeline --> Handlers
  Pipeline --> Hub
  Handlers --> Repos
  Handlers --> Cache
  Handlers --> BN
  Hub --> Auth
  Repos --> EF
  EF --> SQLite
  BN --> Hub
  Hub -- "IssueChanged broadcast" --> BC`,
      },
    },

    /* ------------------------------------------------------------ 26.11 */
    {
      id: '26.11',
      title: 'המודלים המנטליים שלקחים אתכם',
      blocks: [
        {
          kind: 'p',
          text:
            'TaskForge לימדה ארכיטקטורה דרך קוד שעובד, לא דרך תיאוריה. ' +
            'אלה הלקחים שאפשר לקחת לכל פרויקט הבא:',
        },
        {
          kind: 'ol',
          items: [
            'seam לפני מימוש: הגדירו ממשק (`I*`) לפני שכותבים EF / SignalR / HTTP. ה-seam הוא ה-"תפר" שמאפשר בדיקה, החלפה, והוספת side effects.',
            'public surface = חוזה: store חושף selectors ופקודות. כל עוד הם זהים, המימוש הפנימי גמיש.',
            'URL הוא state: כל מה שהמשתמש ירצה לשמור/לשתף — שמרו ב-URL.',
            'optimistic = מיידי + rollback: החילו שינוי תמיד, תחזירו אחורה אם השרת נכשל.',
            'cache invalidation = נגזרת מכתיבה: כל handler שכותב ל-DB — מפנה cache ומשדר broadcast.',
            '12-factor config: סודות מחוץ לקוד, `fail-fast` בעלייה אם חסרים.',
          ],
        },
        {
          kind: 'term',
          name: 'seam',
          definition:
            'נקודת תפר במערכת שבה אפשר להחליף התנהגות בלי לשנות את הקוד שמסביב. ' +
            'ב-TaskForge: `I*Repository` (Backend), public store surface (Frontend), ' +
            '`IBoardNotifier` (Realtime), interceptors (HTTP pipeline). ' +
            'seam + DI = הכלי הבסיסי לbuildability, testability ו-evolvability.',
        },
        {
          kind: 'term',
          name: 'resource-based authz',
          definition:
            'הרשאה שנבדקת מול משאב ספציפי, לא רק מול תפקיד גלובלי. ' +
            '`IsMemberAsync(projectId, userId)` ב-TaskForge בודק חברות בפרויקט. ' +
            'כל endpoint שנוגע בפרויקט מסוים — קורא לה. ' +
            'זה מה שמבדיל "admin של האפליקציה" מ-"owner של הפרויקט הזה".',
        },
        {
          kind: 'term',
          name: 'cache invalidation',
          definition:
            'ביטול רשומה ב-cache כדי שה-hit הבא ייאלץ לחשב מחדש. ' +
            'ב-TaskForge: `EvictByTagAsync("stats-{projectId}")` אחרי כל mutation על issues. ' +
            '"ישנם שתי בעיות קשות: naming things ו-cache invalidation" — Phil Karlton. ' +
            'tag-based eviction (פרק 23) פותר את הבעיה בלי לדעת אילו userId\'s מחזיקים cache.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch23',
        file: 'server/TaskForge.Api/Endpoints/IssueEndpoints.cs',
        region: 'step-23.4b',
        title: 'IssueEndpoints — EvictStatsAsync: כל mutation מבטל cache ב-tag אחד',
      },
    },

    /* ------------------------------------------------------------ 26.12 */
    {
      id: '26.12',
      title: 'מוכנות לראיון: השאלות שה-build הזה מרוויח לענות',
      blocks: [
        {
          kind: 'p',
          text:
            'הרשימה שלהלן היא שאלות ראיון senior-level שTaskForge מאפשרת לענות עליהן מניסיון, ' +
            'לא מזיכרון. לכל אחת — ציינו את הפרק שבו ראיתם את הקוד.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'הסבירו DIP בדוגמה קונקרטית מהפרויקט שלכם.',
          body:
            '`IProjectRepository` מוגדר ב-`TaskForge.Core` (פרק 02). ' +
            'ה-Api (גבוהה) תלוי בממשק, לא ב-`EfProjectRepository` (נמוכה). ' +
            'ה-Infrastructure מממש את הממשק. ' +
            'תוצאה: בפרק 21, הבדיקות הזריקו `EfProjectRepository` עם SQLite in-memory — ' +
            'ה-handlers לא ידעו.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה קורה ב-JWT refresh rotation ולמה?',
          body:
            'פרק 05: `RefreshToken` הוא חד-פעמי. ' +
            'כש-`POST /api/auth/refresh` מגיע, השרת מסמן את הטוקן הנוכחי `IsActive = false` ' +
            'ומנפיק טוקן חדש. ' +
            'אם תוקף גנוב ניסה להשתמש בו שוב — הוא לא פעיל. ' +
            'זה מגביל את חלון ה-exposure של טוקן גנוב ל-RTT אחד.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'כיצד `auth` עובד מעל WebSocket ב-SignalR?',
          body:
            'הדפדפן לא יכול לשלוח `Authorization` header ב-WebSocket handshake. ' +
            '`@microsoft/signalr` שולח את ה-JWT ב-query string: `?access_token=<token>`. ' +
            '`OnMessageReceived` ב-`Program.cs` "מרים" אותו לנתיבי `/hubs` בלבד, ' +
            'ומעביר ל-`context.Token`. ה-hub מקבל `[Authorize]` ובודק את הטוקן. ' +
            'בדיקה ממשית בפרק 24: negotiate ללא טוקן = 401; עם טוקן = 200 + `connectionId`.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה "cache invalidation" עם tag eviction ולמה לא לפנות לפי מפתח מדויק?',
          body:
            'מפתח ה-cache ב-TaskForge = `(userId, projectId)`. ' +
            'אחרי כתיבה, צריך לפנות את כל הcaches לפרויקט זה — לכל המשתמשים. ' +
            'לפנות לפי מפתח מדויק = צריך לדעת אילו userId\'s מחזיקים cache עכשיו. ' +
            'tag `stats-{projectId}` (פרק 23): `EvictByTagAsync("stats-1")` מפנה את כולם בקריאה אחת.',
        },
        {
          kind: 'p',
          text:
            'לתרגול נוסף: השתמשו ב-"Drill" שבסרגל הצד — ' +
            'הוא מציג שאלות ראיון לפי פרק ומבקש מכם לנסח תשובה בפני עצמכם. ' +
            'אחרי ה-drill — קראו את ה-model answer כאן בתוכן.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch24',
        file: 'client/src/app/core/auth/auth.interceptor.ts',
        region: 'step-24.12',
        title: 'auth.interceptor.ts — X-Connection-Id: מחבר HTTP ל-SignalR origin בנקודה אחת',
      },
    },

    /* ------------------------------------------------------------ 26.13 */
    {
      id: '26.13',
      title: 'מה חסר בכוונה',
      blocks: [
        {
          kind: 'p',
          text:
            'TaskForge היא אפליקציה שלמה, אבל לא production-ready לכל תרחיש. ' +
            'להלן מה שהושמט בכוונה — ועם מצפן לכל אחד:',
        },
        {
          kind: 'ul',
          items: [
            'Observability: אין structured logging (Serilog / OpenTelemetry), אין distributed tracing, אין metrics endpoint.',
            'Horizontal scaling: SignalR עובד עם Redis backplane (`AddSignalR().AddStackExchangeRedis(...)`) כשיש יותר מ-instance אחד. ה-`IBoardNotifier` seam מאפשר החלפה בלי לשנות ה-handlers.',
            'Object storage: attachments (פרק 19) נשמרים כ-BLOB ב-SQLite. בפרודקשן: S3 / Azure Blob Storage. נקודת החלפה = ה-attachment endpoint.',
            'Postgres: SQLite היא single-file, מתאימה לפיתוח. בפרודקשן: `dotnet ef migrations` עם Postgres provider.',
            'E2E tests: Playwright flows (login, issue create-to-board, kanban reorder) — הוצגו קונצפטואלית בפרק 21.',
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'כל "חסר" הוא גם תרגיל מצוין לאחרי הספר. ' +
            'הוסיפו Redis backplane ל-SignalR (שורה + env var): הבינו מה `IBoardNotifier` מאפשר. ' +
            'החליפו SQLite ב-Postgres: ראו שה-repository code לא זז. ' +
            'אלה ה-"seams" שחיכו לכם.',
        },
        {
          kind: 'term',
          name: '12-factor',
          definition:
            'מתודולוגיה לבניית SaaS app. Factor III: "Config — store config in the environment". ' +
            'ב-TaskForge: `Jwt:Key` מגיע מ-`Jwt__Key` env var (פרק 23); `Jwt:Key` חסר = crash בעלייה. ' +
            'Factor XI: "Logs — treat logs as event streams". TaskForge: TODO בפוסט-ספר.',
        },
      ],
      panel: {
        kind: 'filetree',
        title: 'מה שהושמט בכוונה — ציר הרחבה',
        lines: [
          { text: 'Observability', depth: 0, kind: 'dir' },
          { text: 'Serilog / OpenTelemetry / metrics', depth: 1, kind: 'comment' },
          { text: 'Horizontal Scale', depth: 0, kind: 'dir' },
          { text: 'SignalR + Redis backplane (IBoardNotifier seam)', depth: 1, kind: 'comment' },
          { text: 'Storage', depth: 0, kind: 'dir' },
          { text: 'S3 / Azure Blob (attachment endpoint seam)', depth: 1, kind: 'comment' },
          { text: 'Database', depth: 0, kind: 'dir' },
          { text: 'Postgres provider (dotnet ef migrations)', depth: 1, kind: 'comment' },
          { text: 'E2E Tests', depth: 0, kind: 'dir' },
          { text: 'Playwright (login, issue board, kanban)', depth: 1, kind: 'comment' },
        ],
        caption: 'כל שורה = seam קיים שמחכה להחלפה. הארכיטקטורה מוכנה — השלמות לא.',
      },
    },

    /* ------------------------------------------------------------ 26.14 */
    {
      id: '26.14',
      title: 'הסיכום: מה אתם יכולים לבנות עכשיו',
      blocks: [
        {
          kind: 'p',
          text:
            'אתם סיימתם לבנות fullstack app שלם: ' +
            '.NET 10 API עם DIP, EF Core, JWT ביד, resource-based authz; ' +
            'Angular v22 zoneless עם signals, stores, httpResource, interceptors, routing; ' +
            'CSS מודרן עם design tokens, RTL, container queries; ' +
            'features מורכבים (kanban DnD, dashboard SVG, markdown editor, command palette); ' +
            'testing (xUnit in-memory, vitest); ' +
            'realtime (SignalR + echo-skip + reconnect); ' +
            'production (Docker, nginx, CI).',
        },
        {
          kind: 'p',
          text:
            'אתם יכולים לבנות כל fullstack app עם ה-stack הזה — ' +
            'e-commerce, SaaS dashboard, internal tool, real-time collaboration. ' +
            'הארכיטקטורה שלמדתם (seams, DIP, zoneless signals, optimistic UI) ' +
            'עובדת בכל ה-domains האלה. ' +
            'TaskForge היה ה-vehicle; ה-patterns הם ה-payload.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'ה-step הבא: קחו vertical slice אחד ממה שלמדתם וממשו אותו מאפס ב-project חדש — ' +
            'בלי להסתכל על TaskForge. ' +
            'ה-"aha moment" מגיע כשתגלו שאתם כותבים `IProjectRepository` מזיכרון.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch25',
        file: '.github/workflows/ci.yml',
        title: 'ci.yml — כל ה-gates אוטומטיים: dotnet test + pnpm test + pnpm build + docker build',
      },
    },
  ],

  quiz: [
    {
      q: 'למה `IProjectRepository` מוגדר ב-`TaskForge.Core` ולא ב-`TaskForge.Infrastructure`?',
      options: [
        'כי EF Core לא נתמך ב-Infrastructure',
        'כי Core מגדיר אילו שירותים הוא צריך (DIP): ההפשטה שייכת לשכבה הגבוהה שצורכת אותה, Infrastructure מממש אותה',
        'כי Infrastructure לא יכול לייצא interfaces',
        'כי זה דרישה של ASP.NET Core',
      ],
      answer: 1,
      explain:
        'עקרון היפוך התלות (DIP): שכבות גבוהות לא תלויות בנמוכות — שתיהן תלויות בהפשטה. ' +
        'ה-Core הוא הלקוח של ה-repository; הוא מגדיר את החוזה. ' +
        'אם הממשק היה ב-Infrastructure, ה-Core היה תלוי בה — ה-arrow היה מתהפך. ' +
        'תוצאה מעשית (פרק 21): בדיקות הזריקו `EfProjectRepository` עם SQLite in-memory ללא שינוי בCore.',
    },
    {
      q: '`IssuesStore` עבר ל-`@ngrx/signals` בפרק 20. מה בדיוק נשמר ולמה זה חשוב?',
      options: [
        'כל הקוד נשמר ללא שינוי',
        'ה-public surface: computed selectors (`issues()`, `loading()`) ו-commands — כך `issue-board` ו-`kanban-board` לא נגעו',
        'רק שמות הקבצים נשמרו',
        'המימוש הפנימי נשמר, ה-public surface השתנה',
      ],
      answer: 1,
      explain:
        'ה-seam של store הוא ה-public surface: computed signals שחושפים selectors ו-methods שחושפים commands. ' +
        '`issues()`, `loading()`, `loadError()`, `moveIssue()` — כולם נשמרו. ' +
        'המימוש הפנימי עבר מ-class ביד (`EntityStore` + `linkedSignal`) ל-`signalStore` עם `withEntities`. ' +
        '`issue-board` ו-`kanban-board` לא ידעו ששינינו דבר.',
    },
    {
      q: 'איזה מנגנון מאפשר ל-`authInterceptor` לצרף `X-Connection-Id` לכל בקשת HTTP ב-ch24, ומה הוא מונע?',
      options: [
        'HttpClient middleware שרץ רק על POST',
        'functional interceptor שעוטף כל HttpRequest — מצרף `connectionId` על כל בקשה, ומונע שה-handler ישדר broadcast לאותו לקוח שיזם (echo-skip)',
        'Angular service worker',
        'CORS preflight',
      ],
      answer: 1,
      explain:
        'ה-`authInterceptor` (פרק 11) כבר רץ על כל HttpRequest. ' +
        'בפרק 24 הוסיפו שורה אחת: הזרקת `BoardConnection` וצירוף `connectionId` ל-`X-Connection-Id` header. ' +
        'השרת מעביר אותו כ-`origin` לשידור SignalR. ' +
        '`isSelf(e.origin)` ב-`BoardConnection` מדלג על updates ממקור עצמי — echo-skip.',
    },
    {
      q: 'מה `withAutomaticReconnect` ב-SignalR עושה ומה הוא לא עושה?',
      options: [
        'שומר כל event ושולח בחיבור מחדש',
        'מנהל ניסיונות חיבור מחדש אוטומטיים — אבל events שנשלחו בזמן הניתוק אובדים; על reconnect קוראים `reload()` לsync',
        'חוסם בקשות HTTP עד שה-hub מחובר',
        'מגדיל את ה-JWT expiry',
      ],
      answer: 1,
      explain:
        'SignalR שולח events לחיבורים פעילים בלבד. ' +
        'לקוח מנותק לא מקבל את ה-events שנשלחו בינתיים — הם אובדים. ' +
        'לכן ב-`onreconnected` ב-`BoardConnection` (פרק 24): ' +
        'מצטרפים מחדש ל-group (JoinProject) וקוראים `issues.reload()`. ' +
        'realtime הוא best-effort; consistency מגיע מ-reconcile.',
    },
    {
      q: 'מה הסיכון של `UseOutputCache()` לפני `UseAuthentication()` ב-pipeline של ASP.NET Core?',
      options: [
        'OutputCache לא עובד לפני auth',
        '`User` ריק ב-`StatsCachePolicy` — כל המשתמשים מקבלים `userId = "anonymous"` ו-cache hit עשוי לחשוף נתוני פרויקט למשתמשים לא-מורשים',
        'הבקשה נחסמת',
        'TTL לא עובד',
      ],
      answer: 1,
      explain:
        '`StatsCachePolicy` קורא `User.FindFirstValue(ClaimTypes.NameIdentifier)` לבניית מפתח vary-by-user. ' +
        'לפני `UseAuthentication`, `User` ריק — כולם מקבלים `userId = "anonymous"`. ' +
        'מפתח ה-cache הופך ל-`(anonymous, projectId)` — cache hit של משתמש A עשוי להגיע למשתמש B ' +
        'שאינו חבר בפרויקט. ' +
        'ב-ch23 `UseOutputCache` ממוקם אחרי `UseAuthentication` ו-`UseAuthorization`.',
    },
    {
      q: 'מה "fail-fast" על `Jwt:Key` ב-ch23 ולמה לא מספיק ערך ברירת מחדל?',
      options: [
        'כן, ברירת מחדל מספיקה',
        'ה-API קורס ב-startup אם `Jwt:Key` חסר — ברירת מחדל חלשה היתה מנפיקה טוקנים עם מפתח ידוע לכל, פריצה מובטחת',
        'fail-fast רק ב-Production',
        'זה דרישה של JWT spec',
      ],
      answer: 1,
      explain:
        '`Jwt:Key` חסר = API רץ עם מפתח ריק ומנפיק טוקנים שכל אחד יכול לזייף. ' +
        'בפרק 23: `if (string.IsNullOrWhiteSpace(jwt.Key)) throw new InvalidOperationException(...)` — ' +
        'הקריסה מוקדמת, מפורשת, ואי-אפשר להחמיצה. ' +
        'בפרודקשן: `Jwt__Key` env var; בפיתוח: `appsettings.Development.json` עם throwaway key.',
    },
    {
      q: 'מה "vertical slice" ומה ה-vertical slice של "הוסיפו Labels ל-Issue"?',
      options: [
        'שינוי ב-UI בלבד',
        'שינוי בDB בלבד',
        'entity + migration, repository + seam, endpoint עם authz, store, component, test — כל שכבה מה-DB ועד ה-UI',
        'הוספת npm package',
      ],
      answer: 2,
      explain:
        '"Labels" כ-vertical slice: ' +
        '(1) entity `Label` + `IssueLabel` + migration (Core, Infrastructure); ' +
        '(2) `ILabelRepository` seam; ' +
        '(3) `GET/POST /api/projects/{id}/labels` endpoint עם authz; ' +
        '(4) `LabelsStore` ב-Angular; ' +
        '(5) `label-badge` component; ' +
        '(6) repository test ב-xUnit in-memory. ' +
        'זו הארכיטקטורה שלמדתם: כל תוספת חוצה את כל השכבות בדרך הזאת.',
    },
    {
      q: 'כיצד `IBoardNotifier` מאפשר horizontal scaling עם Redis backplane?',
      options: [
        'SignalR עושה זאת אוטומטית',
        'מחליפים את הרישום: `services.AddSingleton<IBoardNotifier, RedisBoardNotifier>()` — ה-handlers ב-IssueEndpoints לא משתנים',
        'צריך לשנות את BoardHub',
        'צריך לשנות את כל ה-endpoints',
      ],
      answer: 1,
      explain:
        '`IBoardNotifier` הוא seam (DIP). ' +
        'ב-ch24: `SignalRBoardNotifier` מממש אותו עם `IHubContext<BoardHub>`. ' +
        'ב-horizontal scaling: `RedisBoardNotifier` ישתמש ב-Redis backplane כדי לשדר בין nodes. ' +
        'שינוי שורת הרישום ב-`Program.cs` מספיק — `IssueEndpoints.CreateIssue` לא ידע שמשהו השתנה.',
    },
  ],

  proveIt: [
    {
      title: 'עקבו אחר create-issue מקצה לקצה — ומנו כל seam שעבר דרכו',
      body:
        'פתחו את TaskForge בשני טאבים (demo@taskforge.dev / Passw0rd!). ' +
        'בטאב A: צרו issue חדש. ' +
        'עקבו אחרי המסלול: signal store trigger, authInterceptor (Bearer + X-Connection-Id), ' +
        'nginx proxy, API middleware pipeline (rate limiter, auth), handler, EF Core, SQLite, ' +
        'EvictStatsAsync, IBoardNotifier.IssueChangedAsync, SignalR broadcast, ' +
        'BoardConnection.onIssueChanged ב-B, applyRemoteUpsert, UI update. ' +
        'מנו: כמה seams עבר? לפחות 6.',
      expect:
        'טאב B מקבל את ה-issue בלי refresh. ' +
        'ב-DevTools (WS frames): event "IssueChanged" עם `origin` = connectionId של A. ' +
        'טאב A לא מקבל echo (isSelf = true). ' +
        'dashboard `/stats`: לאחר יצירה — GET חדש מחזיר `total` גדול ב-1 (eviction פעל).',
    },
    {
      title: 'הריצו את האפליקציה המלאה ב-`docker compose up` ובדקו 3 פיצ\'רים',
      body:
        'מ-`reference/.build/ch25/` (לאחר materialization): `docker compose up --build`. ' +
        'היכנסו ל-`http://localhost`. ' +
        '(1) התחברו, בדקו שה-JWT refresh עובד (רשת: POST /api/auth/refresh). ' +
        '(2) צרו issue וראו אותו בלוח. ' +
        '(3) גישו ל-`/api/projects/1/stats` — בדקו `Content-Encoding: br` (Brotli דרך nginx). ' +
        'הריצו שניה: login ה-6 = 429.',
      command:
        'cd reference/.build/ch25 && docker compose up --build -d && curl -sI http://localhost/api/projects/1/stats -H "Authorization: Bearer <token>" | grep -i "content-encoding"',
      expect:
        '`Content-Encoding: br` מוחזר (Brotli דרך nginx). ' +
        'WebSocket ל-`/hubs/board` עולה (nginx upgrading). ' +
        '6 login attempts = 429 עם `Retry-After: 30`.',
    },
    {
      title: 'הסבירו למה `issue-board` לא השתנה כשהstore עבר ל-@ngrx/signals',
      body:
        'קראו את `src/app/features/issues/issue-board.ts` (קובץ לאחר ch20). ' +
        'מצאו כל קריאה ל-`IssuesStore`. ' +
        'פתחו `src/app/core/state/issues.store.ts` ומצאו את אותם שמות בחלק `withComputed` ו-`withMethods`. ' +
        'הסבירו: אם `withEntities` פנימית מנהלת `entities()`, ו-`issues()` הוא alias ב-`withComputed` — ' +
        'למה `issue-board` ממשיך לקרוא `store.issues()` ולא `store.entities()`?',
      expect:
        '`issue-board` קורא אך ורק ל-public surface: `store.issues()`, `store.loading()`, `store.loadError()`, `store.updateIssue()`. ' +
        'כולם מוגדרים ב-`withComputed` / `withMethods`. ' +
        '`entities()` הוא API פנימי של `@ngrx/signals` — לא נחשף. ' +
        'ה-seam נשמר: implementation-agnostic public surface.',
    },
    {
      title: 'הוכיחו ש-`Jwt:Key` חסר קורס את ה-API ב-startup',
      body:
        'הריצו את ה-API ב-Production mode ללא `Jwt__Key`. ' +
        'ציפו ל-`InvalidOperationException` בשורות הראשונות של ה-log — ' +
        'האפליקציה לא מגיעה לנקודה שבה היא מטפלת בבקשות.',
      command:
        'cd reference/.build/ch25/server/TaskForge.Api && ASPNETCORE_ENVIRONMENT=Production dotnet run --no-launch-profile 2>&1 | head -15',
      expect:
        'הפלט מכיל `InvalidOperationException: Jwt:Key is not configured` ' +
        'ותהליך יוצא עם קוד שגיאה. ' +
        'בלי `--no-launch-profile`: `launchSettings.json` מציב `Development` ו-`appsettings.Development.json` מספק throwaway key — האפליקציה עולה.',
    },
    {
      title: 'אמתו שה-CI רץ את כל ה-gates אחרי commit',
      body:
        'עשו commit ו-push על branch בריפו שלכם (TaskForge). ' +
        'פתחו GitHub Actions ובדקו שה-workflow `ci.yml` מריץ: ' +
        '`dotnet test` (xUnit), `pnpm test` (vitest), `pnpm build` (Angular), ' +
        'ו-`docker build` לשני הimages. ' +
        'שברו test אחד וודאו שה-CI נכשל ומדייק באיזו job.',
      expect:
        'כל ה-jobs עוברים בריפו נקי. ' +
        'שינוי שובר test ב-xUnit = job "server-test" נכשל; ' +
        'שינוי שובר vitest = job "client-test" נכשל. ' +
        'PR חסום עד שכל ה-jobs ירוקים.',
    },
  ],

  exercise: {
    prompt:
      'הוסיפו vertical slice שלם: "Labels" — תיוגים על issues. ' +
      'כל issue יכול להיות בעל label אחד או יותר (`Bug`, `Feature`, `Chore`). ' +
      'ה-UI מאפשר לסנן את לוח ה-Issues לפי label. ' +
      'ממשו את כל השכבות באותם patterns שלמדתם.',
    tasks: [
      'Backend entity: הוסיפו `Label.cs` ו-`IssueLabel.cs` (many-to-many) ל-`TaskForge.Core/Entities/`. הוסיפו migration ב-`TaskForge.Infrastructure`.',
      'Repository seam: הוסיפו `ILabelRepository` ל-`TaskForge.Core/Abstractions/` עם `GetByProjectAsync`; מממשו ב-`EfLabelRepository` ב-Infrastructure.',
      'Endpoints: הוסיפו `GET /api/projects/{id}/labels` ו-`POST /api/issues/{id}/labels` ב-`LabelEndpoints.cs`. כל endpoint בודק `IsMemberAsync`.',
      'Filter: הרחיבו את `IssueListParams` ב-ch04 לכלול `string? labelId`. עדכנו את `EfIssueRepository.GetPagedAsync` לסנן לפי label.',
      'Frontend store: הוסיפו `LabelsStore` ב-`core/state/labels.store.ts` עם `httpResource` ל-labels של הפרויקט.',
      'Component: הוסיפו `<tf-label-badge>` component ב-`core/shared/ui/label-badge/`. הציגו labels על `issue-card`.',
      'Filter UI: הוסיפו label filter ל-`issue-board` (dropdown עם labels של הפרויקט הנוכחי). עדכנו ה-URL-as-state.',
      'Test: כתבו xUnit test ב-`LabelRepositoryTests.cs` שמאמת `GetByProjectAsync` ב-SQLite in-memory.',
    ],
    acceptance: [
      'POST /api/issues/1/labels עם `{labelId: 2}` מחזיר 200; GET /api/projects/1/issues?labelId=2 מחזיר רק issues עם label זה.',
      'ב-`issue-board`: בחרו label מה-dropdown — URL מתעדכן ל-`?labelId=2`; ריענון מחזיר אותו מסך.',
      '`label-badge` מוצג על `issue-card` עבור כל issue שיש לו labels.',
      'xUnit test ב-`LabelRepositoryTests.cs`: ירוק. `pnpm test` ו-`dotnet test`: ירוקים.',
      '`pnpm build` ו-`dotnet build`: ירוקים, אפס שגיאות.',
    ],
  },
};
