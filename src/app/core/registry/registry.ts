import { ChapterMeta, WaveDef } from './chapter.types';

/* ============================================================
   Single source of truth: the full TaskForge roadmap.
   Metadata only — step content is lazily imported per chapter
   via loadContent(), so the initial bundle stays small.
   Routes, sidebar, home roadmap, progress and search all
   derive from this array.
   ============================================================ */

export const WAVES: WaveDef[] = [
  {
    no: 0,
    title: 'יסודות',
    tagline: 'הכלים, המוצר, ואיך לומדים עם המדריך',
    chapters: [
      {
        id: 'ch00',
        no: 0,
        slug: 'setup',
        title: 'Setup — הכלים והמפה',
        blurb:
          'מה זה TaskForge, איך המדריך עובד, התקנת ‎.NET 10 / Node / pnpm / Angular CLI, ושלד הריפו שתבנו בו הכול.',
        wave: 0,
        status: 'ready',
        loadContent: () =>
          import('../../chapters/ch00-setup/content').then((m) => m.CH00_CONTENT),
      },
    ],
  },
  {
    no: 1,
    title: 'Backend Core',
    tagline: '‎.NET 10 Minimal APIs מהבסיס ועד Auth מלא',
    chapters: [
      {
        id: 'ch01',
        no: 1,
        slug: 'dotnet-anatomy',
        title: 'אנטומיה של אפליקציית ‎.NET',
        blurb: 'Program.cs כשני חצאים, DI lifetimes, ו-middleware pipeline עם אנימציה אינטראקטיבית.',
        wave: 1,
        status: 'ready',
        loadContent: () =>
          import('../../chapters/ch01-dotnet-anatomy/content').then((m) => m.CH01_CONTENT),
      },
      {
        id: 'ch02',
        no: 2,
        slug: 'backend-architecture',
        title: 'ארכיטקטורת השרת',
        blurb: 'למה שכבות, Core / Infrastructure / Api, חוק התלות, ואיפה כל דבר גר.',
        wave: 1,
        status: 'ready',
        loadContent: () =>
          import('../../chapters/ch02-backend-architecture/content').then((m) => m.CH02_CONTENT),
      },
      {
        id: 'ch03',
        no: 3,
        slug: 'data-layer',
        title: 'שכבת הנתונים',
        blurb: 'EF Core + SQLite, ישויות, DbContext, fluent API, מיגרציות, seeding, והמודל המנטלי של ה-Change Tracker.',
        wave: 1,
        status: 'ready',
        loadContent: () =>
          import('../../chapters/ch03-data-layer/content').then((m) => m.CH03_CONTENT),
      },
      {
        id: 'ch04',
        no: 4,
        slug: 'projects-issues-api',
        title: 'Projects & Issues API',
        blurb: 'records כ-DTOs, MapGroup, סינון/מיון/דפדוף, TypedResults, ProblemDetails, ולידציה של ‎.NET 10 ו-OpenAPI.',
        wave: 1,
        status: 'ready',
        loadContent: () =>
          import('../../chapters/ch04-projects-issues-api/content').then((m) => m.CH04_CONTENT),
      },
      {
        id: 'ch05',
        no: 5,
        slug: 'auth-jwt',
        title: 'Auth — JWT ביד',
        blurb: 'PBKDF2, JWT + refresh rotation, AddJwtBearer, roles ו-policies, והרשאות ProjectMember.',
        wave: 1,
        status: 'ready',
        loadContent: () =>
          import('../../chapters/ch05-auth-jwt/content').then((m) => m.CH05_CONTENT),
      },
    ],
  },
  {
    no: 2,
    title: 'Frontend Foundation',
    tagline: 'Angular v22 — zoneless, signals, ועיצוב מערכתי',
    chapters: [
      {
        id: 'ch06',
        no: 6,
        slug: 'angular-foundation',
        title: 'יסודות Angular',
        blurb: 'המודל המנטלי של zoneless, signals / computed / effect עם דמו חי, bootstrap ו-DI.',
        wave: 2,
        status: 'ready',
        loadContent: () =>
          import('../../chapters/ch06-angular-foundation/content').then((m) => m.CH06_CONTENT),
      },
      {
        id: 'ch07',
        no: 7,
        slug: 'frontend-architecture',
        title: 'ארכיטקטורת הקליינט',
        blurb: 'core / shared / features, רכיבים חכמים מול טיפשים, גבולות state, וחוזי API מול ה-DTOs של השרת.',
        wave: 2,
        status: 'ready',
        loadContent: () =>
          import('../../chapters/ch07-frontend-architecture/content').then((m) => m.CH07_CONTENT),
      },
      {
        id: 'ch08',
        no: 8,
        slug: 'design-system-css',
        title: 'מערכת עיצוב ו-CSS מודרני',
        blurb: 'design tokens, ‎@layer, logical properties ו-RTL, container queries, color-mix, clamp, וארכיטקטורת dark mode.',
        wave: 2,
        status: 'soon',
      },
      {
        id: 'ch09',
        no: 9,
        slug: 'shared-ui-kit',
        title: 'ערכת UI משותפת',
        blurb: 'button / field / badge / dialog / toast כרכיבים טיפשים מבוססי signals, עם projection ונגישות מובנית.',
        wave: 2,
        status: 'soon',
      },
      {
        id: 'ch10',
        no: 10,
        slug: 'routing',
        title: 'ניתוב',
        blurb: 'lazy loading, guards ו-resolvers, ה-URL כ-state, ו-route input binding.',
        wave: 2,
        status: 'soon',
      },
      {
        id: 'ch11',
        no: 11,
        slug: 'http-state',
        title: 'HTTP ו-State',
        blurb: 'httpResource / resource, interceptors פונקציונליים, signal stores, וטיפול בשגיאות מקצה לקצה עם ProblemDetails.',
        wave: 2,
        status: 'soon',
      },
    ],
  },
  {
    no: 3,
    title: 'Features — הלב',
    tagline: 'הפיצ׳רים האמיתיים, מקצה לקצה',
    chapters: [
      {
        id: 'ch12',
        no: 12,
        slug: 'projects-feature',
        title: 'פיצ׳ר הפרויקטים',
        blurb: 'רשימה, יצירה, ניהול חברים ותפקידים ב-UI.',
        wave: 3,
        status: 'soon',
      },
      {
        id: 'ch13',
        no: 13,
        slug: 'issue-board',
        title: 'לוח ה-Issues',
        blurb: 'סינון/חיפוש/מיון/דפדוף מסונכרנים ל-URL, עדכונים אופטימיים עם rollback, ‎@defer ו-virtual scroll.',
        wave: 3,
        status: 'soon',
      },
      {
        id: 'ch14',
        no: 14,
        slug: 'issue-detail-comments',
        title: 'Issue ותגובות',
        blurb: 'Signal Forms לעומק — ולידציות, ולידציה אסינכרונית, רכיבי טופס מותאמים, ו-View Transitions.',
        wave: 3,
        status: 'soon',
      },
    ],
  },
  {
    no: 4,
    title: 'Quality',
    tagline: 'בדיקות, ביצועים ונגישות',
    chapters: [
      {
        id: 'ch15',
        no: 15,
        slug: 'testing',
        title: 'בדיקות',
        blurb: 'xUnit + WebApplicationFactory, Vitest + TestBed, ו-Playwright — פירמידת הבדיקות של בדיוק האפליקציה הזו.',
        wave: 4,
        status: 'soon',
      },
      {
        id: 'ch16',
        no: 16,
        slug: 'performance-a11y',
        title: 'ביצועים ונגישות',
        blurb: 'OnPush / zoneless audit, bundle budgets, NgOptimizedImage, Core Web Vitals, ומעבר מקלדת וקורא מסך.',
        wave: 4,
        status: 'soon',
      },
    ],
  },
  {
    no: 5,
    title: 'Production',
    tagline: 'מהמחשב שלך לעולם האמיתי',
    chapters: [
      {
        id: 'ch17',
        no: 17,
        slug: 'hardening',
        title: 'הקשחה',
        blurb: 'OutputCaching, RateLimiter, health checks ולוגים.',
        wave: 5,
        status: 'soon',
      },
      {
        id: 'ch18',
        no: 18,
        slug: 'realtime-signalr',
        title: 'זמן אמת — SignalR',
        blurb: 'לוח חי: hub בשרת, קליינט Angular, ואסטרטגיית reconnect.',
        wave: 5,
        status: 'soon',
      },
      {
        id: 'ch19',
        no: 19,
        slug: 'ship-it',
        title: 'משחררים',
        blurb: 'Dockerfile רב-שלבי, docker-compose, CI עם GitHub Actions, והמודלים המנטליים של deployment.',
        wave: 5,
        status: 'soon',
      },
      {
        id: 'ch20',
        no: 20,
        slug: 'capstone',
        title: 'Capstone',
        blurb: 'מפת סיכום של כל האפליקציה ופינאלה של תרגול ראיונות.',
        wave: 5,
        status: 'soon',
      },
    ],
  },
];

export const ALL_CHAPTERS: ChapterMeta[] = WAVES.flatMap((w) => w.chapters);

export const READY_CHAPTERS: ChapterMeta[] = ALL_CHAPTERS.filter((c) => c.status === 'ready');

export function findChapter(id: string): ChapterMeta | undefined {
  return ALL_CHAPTERS.find((c) => c.id === id);
}

export function nextChapter(id: string): ChapterMeta | undefined {
  const i = ALL_CHAPTERS.findIndex((c) => c.id === id);
  return i >= 0 ? ALL_CHAPTERS[i + 1] : undefined;
}

export function prevChapter(id: string): ChapterMeta | undefined {
  const i = ALL_CHAPTERS.findIndex((c) => c.id === id);
  return i > 0 ? ALL_CHAPTERS[i - 1] : undefined;
}
