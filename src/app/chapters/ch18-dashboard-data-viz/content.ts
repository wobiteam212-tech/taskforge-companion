import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 18 — Dashboard & Data-Viz.
 * Wave 4, spine piece #3: derived/aggregation selectors.
 * Backend: GROUP BY projections (IStatsRepository/EfStatsRepository → ProjectStats),
 * activity log (ActivityEvent + ActivityType, IActivityRepository/EfActivityRepository),
 * DashboardEndpoints (GET /stats + /activity), EF migration AddActivityLog, events
 * written on issue-create / status-change / comment-add.
 * Frontend: DashboardStore (two httpResource keyed by projectId + derived selectors),
 * hand-rolled SVG donut/bar/sparkline (bounded heights), dashboard layout (auto-fit
 * grid + container queries + clamp + OKLCH series colors), /projects/:id/dashboard route.
 * Every fact below was runtime-proven (two-server smoke + bounding-box layout checks):
 * stats p1 total 60 (open 21 / inProgress 20 / done 19, matches the kanban), byPriority
 * sums 60, createdPerDay 19 days; activity newest-first with actor names; anon → 401;
 * create issue grows activity 4→5 and total 60→61; charts bounded inside tiles at 1280
 * and 375 with zero horizontal overflow.
 */
export const CH18_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 18.1 */
    {
      id: '18.1',
      title: 'הפרק: דשבורד ו-Data-Viz',
      blocks: [
        {
          kind: 'p',
          text:
            'עד עכשיו ראינו issues אחד-אחד: רשימה, לוח, פרטים. פרק 18 מרים מבט-על: דשבורד פרויקט עם כרטיסי ' +
            'סיכום, שלושה גרפים (לפי סטטוס, לפי עדיפות, ומגמת יצירה), ופיד פעילות. הכול מוזן מנתוני אמת.',
        },
        {
          kind: 'p',
          text:
            'זה spine piece #3: selectors נגזרים. השרת מחזיר מספרים גולמיים; ה-store מעצב אותם למודלי-תצוגה ' +
            'מוכנים-לציור (computed), והרכיבים נשארים טיפשים. נבנה גם את הגרפים ביד — SVG, בלי ספריית charts.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה לגזור במקום לחשב בכל רכיב?',
          body:
            'אם כל גרף היה סופר ומסנן בעצמו, אותו חישוב היה משוכפל ולא-עקבי. selector נגזר אחד (computed) הוא ' +
            'מקור אמת אחד: כל מי שצריך "התפלגות לפי סטטוס" מקבל בדיוק את אותה צורה, וכשהנתונים משתנים — הכול מתעדכן יחד.',
        },
      ],
      panel: {
        kind: 'filetree',
        title: 'קבצים חדשים ומשתנים בפרק 18',
        lines: [
          { text: 'client/src/app/', depth: 0, kind: 'dir' },
          { text: 'core/models/dashboard.model.ts', depth: 1, kind: 'file', badge: 'new' },
          { text: 'core/state/dashboard.store.ts', depth: 1, kind: 'file', badge: 'new' },
          { text: 'features/dashboard/', depth: 1, kind: 'dir' },
          { text: 'dashboard.ts / .html / .scss', depth: 2, kind: 'file', badge: 'new' },
          { text: 'charts/donut-chart.ts', depth: 2, kind: 'file', badge: 'new' },
          { text: 'charts/bar-chart.ts', depth: 2, kind: 'file', badge: 'new' },
          { text: 'charts/sparkline.ts', depth: 2, kind: 'file', badge: 'new' },
          { text: 'app.routes.ts · features/projects/project-board.html', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'server/', depth: 0, kind: 'dir' },
          { text: 'TaskForge.Core/Entities/ActivityEvent.cs', depth: 1, kind: 'file', badge: 'new' },
          { text: 'TaskForge.Core/Common/ProjectStats.cs', depth: 1, kind: 'file', badge: 'new' },
          { text: 'TaskForge.Api/Endpoints/DashboardEndpoints.cs', depth: 1, kind: 'file', badge: 'new' },
          { text: '+ stats/activity repos, contracts, migration', depth: 1, kind: 'file', badge: 'new' },
        ],
        caption: 'אגרגציה ויומן בצד השרת, selectors וגרפים ביד בצד הלקוח',
      },
    },

    /* ------------------------------------------------------------ 18.2 */
    {
      id: '18.2',
      title: 'אגרגציה כ-DTO',
      blocks: [
        {
          kind: 'p',
          text:
            'הדשבורד לא צריך את כל ה-issues — הוא צריך ספירות. ProjectStats הוא הקרנת אגרגציה: סך הכול, ' +
            'ספירה לכל סטטוס ולכל עדיפות, וסדרת "כמה נוצרו ביום". הוא חי ב-Core/Common כמו ProjectSummary — ' +
            'POCO חוצה-שכבות, לא ישות.',
        },
        {
          kind: 'term',
          name: 'aggregation projection',
          definition:
            'DTO שמחזיק תוצאות סיכום (counts, sums, סדרות) במקום שורות גולמיות. ' +
            'ה-DB מחשב אותו עם GROUP BY ומחזיר מעט שורות — לא טוענים אלפי issues לזיכרון כדי לספור.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'DateOnly לסדרת המגמה',
          body:
            'CreatedPerDay משתמש ב-DateOnly (תאריך בלי שעה). הוא עובר על הקו כמחרוזת ISO ("2026-01-14"), ' +
            'וב-.NET 10 System.Text.Json יודע לסדר אותו מובנה — בלי converter ידני.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch18',
        file: 'server/TaskForge.Core/Common/ProjectStats.cs',
        region: 'step-18.2',
        diff: true,
        title: 'ProjectStats.cs',
      },
    },

    /* ------------------------------------------------------------ 18.3 */
    {
      id: '18.3',
      title: 'GROUP BY בצד ה-DB',
      blocks: [
        {
          kind: 'p',
          text:
            'EfStatsRepository הוא seam האגרגציה (החוזה ב-`server/TaskForge.Core/Abstractions/IStatsRepository.cs`). ' +
            'כל ספירה היא GroupBy שמתורגם ל-SQL: GroupBy(i => i.Status).Select(g => new StatusCount(g.Key, g.Count())). ' +
            'ה-DB מחזיר שורה לכל קבוצה, לא את כל ה-issues. AsNoTracking כי זו קריאה בלבד.',
        },
        {
          kind: 'p',
          text:
            'גם המגמה היא GroupBy — לפי i.CreatedAtUtc.Date. אימתנו שזה מתורגם ב-SQLite: לפרויקט הראשון חזרו ' +
            '19 ימים שונים. את ההמרה ל-DateOnly עושים בזיכרון אחרי שהשורות חזרו, לא בתוך השאילתה.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה לא לספור בזיכרון עם LINQ-to-Objects?',
          body:
            'ToList ואז GroupBy בזיכרון מושך את כל הטבלה לשרת האפליקציה — לא סקלבילי. GroupBy על IQueryable ' +
            'מתורגם ל-GROUP BY ב-SQL, וה-DB (שיש לו אינדקסים) עושה את העבודה ומחזיר רק את הסיכום.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch18',
        file: 'server/TaskForge.Infrastructure/Repositories/EfStatsRepository.cs',
        region: 'step-18.4',
        diff: true,
        title: 'EfStatsRepository.cs — GROUP BY',
      },
    },

    /* ------------------------------------------------------------ 18.4 */
    {
      id: '18.4',
      title: 'יומן הפעילות: הישות',
      blocks: [
        {
          kind: 'p',
          text:
            'ActivityEvent הוא שורה לכל דבר שקרה בפרויקט: מי, מה, מתי. Type הוא enum (IssueCreated, IssueMoved, ' +
            'CommentAdded) שנשמר כטקסט — בדיוק כמו Status ו-Priority. IssueId הוא nullable: אירוע יכול להיות ' +
            'ברמת הפרויקט בלי issue ספציפי.',
        },
        {
          kind: 'term',
          name: 'append-only log',
          definition:
            'טבלה שרק מוסיפים אליה, אף פעם לא מעדכנים או מוחקים שורה קיימת. ' +
            'יומן פעילות, audit trail ו-event store בנויים כך — ההיסטוריה היא נכס, לא משהו שעורכים.',
        },
        {
          kind: 'callout',
          tone: 'alt',
          title: 'enum מול string חופשי ל-Type',
          body:
            'string חופשי גמיש אבל מזמין שגיאות איות ("ISsueCreated"). enum נותן בדיקת-מהדר וסט סגור; ' +
            'נשמר כטקסט קריא ב-DB דרך HasConversion. כשנולד סוג חדש מוסיפים ערך אחד — שינוי מכוון, לא שקט.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch18',
        file: 'server/TaskForge.Core/Entities/ActivityEvent.cs',
        region: 'step-18.1',
        diff: true,
        title: 'ActivityEvent.cs',
      },
    },

    /* ------------------------------------------------------------ 18.5 */
    {
      id: '18.5',
      title: 'יומן הפעילות: ה-repository',
      blocks: [
        {
          kind: 'p',
          text:
            'EfActivityRepository (החוזה ב-`server/TaskForge.Core/Abstractions/IActivityRepository.cs`) הוא read+write: ' +
            'LogAsync מוסיף שורה ושומר; GetRecentForProjectAsync מחזיר את האחרונים, עם Include של ה-Actor כדי להציג שם, ' +
            'ממוין יורד לפי זמן, עם Take שמגביל עלות.',
        },
        {
          kind: 'p',
          text:
            'התשובה ללקוח היא ActivityResponse (ב-`server/TaskForge.Api/Contracts/DashboardContracts.cs`) — אירוע משוטח ' +
            'עם ActorName אחד במקום ה-FK המלא. בדיוק מה שהפיד צריך להציג.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'שובר-תיקו גם כאן',
          body:
            'המיון הוא OrderByDescending(CreatedAtUtc).ThenByDescending(Id). בלי ה-ThenBy, שני אירועים באותה ' +
            'שנייה היו עלולים להחליף סדר בין קריאות. ה-Id המונוטוני נותן סדר יציב.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch18',
        file: 'server/TaskForge.Infrastructure/Repositories/EfActivityRepository.cs',
        region: 'step-18.6',
        diff: true,
        title: 'EfActivityRepository.cs',
      },
    },

    /* ------------------------------------------------------------ 18.6 */
    {
      id: '18.6',
      title: 'כותבים אירוע ליד הפעולה',
      blocks: [
        {
          kind: 'p',
          text:
            'יומן לא ממלא את עצמו. הזרקנו את IActivityRepository ל-handlers הקיימים, והם רושמים אירוע ליד הפעולה: ' +
            'יצירת issue רושמת IssueCreated, הוספת תגובה רושמת CommentAdded, וסידור-מחדש רושם IssueMoved — ' +
            'אבל רק כשהסטטוס (העמודה) באמת השתנה, כדי שלא להציף את הפיד ברעש.',
        },
        {
          kind: 'p',
          text:
            'אימתנו את זה חי: יצירת issue חדש הגדילה את הפיד מ-4 ל-5 אירועים, והאירוע החדש הופיע ראשון — ' +
            '"יצר/ה את ...". באותו רגע גם סך ה-issues עלה מ-60 ל-61.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'למה לא מאזין כללי (event listener)?',
          body:
            'אפשר היה לתפוס שינויים ב-SaveChanges של EF. אבל אז ה-summary ("העביר/ה את X ל-Done") היה קשה לבנות — ' +
            'אין ל-DB את ההקשר. כתיבה מפורשת ב-handler היא פשוטה, קריאה, ובדיוק במקום שבו יש את כל המידע.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch18',
        file: 'server/TaskForge.Api/Endpoints/IssueEndpoints.cs',
        region: 'step-18.12b',
        diff: true,
        title: 'IssueEndpoints.cs — LogAsync ביצירה',
      },
    },

    /* ------------------------------------------------------------ 18.7 */
    {
      id: '18.7',
      title: 'ה-endpoints: stats ו-activity',
      blocks: [
        {
          kind: 'p',
          text:
            'שני endpoints קריאה תחת /api/projects/{id}: ‏/stats מחזיר את ProjectStats, ו-/activity?take= מחזיר ' +
            'את הפיד (take מוגבל 1..50). שניהם עם הרשאה מבוססת-משאב: 404 אם הפרויקט לא קיים, 403 אם המשתמש אינו חבר.',
        },
        {
          kind: 'code',
          lang: 'bash',
          title: 'מה שאומת בפועל (curl, demo@taskforge.dev)',
          code:
            'GET /api/projects/1/stats\n' +
            '  -> 200  total 60  (open 21, inProgress 20, done 19)  byPriority sums 60  createdPerDay 19 ימים\n\n' +
            'GET /api/projects/1/activity?take=10\n' +
            '  -> 200  פיד ממוין-חדש-ראשון, עם שמות מבצעים (Demo User, Maya Levi)\n\n' +
            'GET /api/projects/1/stats   (ללא טוקן)\n' +
            '  -> 401 Unauthorized',
        },
        {
          kind: 'callout',
          tone: 'dotnet10',
          title: 'מועמד טוב ל-OutputCaching',
          body:
            'סטטיסטיקה לא משתנה בכל בקשה. ‏/stats הוא מועמד מצוין ל-OutputCaching — לשמור את התשובה לכמה שניות ' +
            'ולהגיש אותה בלי לגעת ב-DB. את ה-caching האמיתי נוסיף בפרק ההקשחה (ch23); כאן רק מסמנים את ההזדמנות.',
        },
        {
          kind: 'term',
          name: 'OutputCaching',
          definition:
            'מנגנון ב-ASP.NET Core ששומר את תשובת ה-endpoint לפרק זמן ומגיש אותה שוב בלי להריץ את ה-handler. ' +
            'מתאים לקריאות יקרות שמשתנות לאט, כמו אגרגציות דשבורד.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch18',
        file: 'server/TaskForge.Api/Endpoints/DashboardEndpoints.cs',
        region: 'step-18.8',
        diff: true,
        title: 'DashboardEndpoints.cs',
      },
    },

    /* ------------------------------------------------------------ 18.8 */
    {
      id: '18.8',
      title: 'המיגרציה: AddActivityLog',
      blocks: [
        {
          kind: 'p',
          text:
            'טבלה חדשה מחייבת מיגרציה. ‏AddActivityLog יוצרת את טבלת ActivityEvents עם מפתחות זרים ל-Projects ' +
            '(cascade) ול-Users (restrict — לא מוחקים היסטוריה כשמוחקים משתמש) ואינדקס על (ProjectId, CreatedAtUtc) ' +
            'לנתיב החם של הפיד. יצרנו אותה עם dotnet ef והעתקנו לסנאפשוט.',
        },
        {
          kind: 'p',
          text:
            'התעדכנו גם `server/TaskForge.Infrastructure/Migrations/20260614142615_AddActivityLog.Designer.cs` ' +
            'ו-`server/TaskForge.Infrastructure/Migrations/TaskForgeDbContextModelSnapshot.cs` — הצילום שמולו ' +
            'EF יחשב את המיגרציה הבאה. לא נוגעים בהם ביד.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch18',
        file: 'server/TaskForge.Infrastructure/Migrations/20260614142615_AddActivityLog.cs',
        title: 'AddActivityLog.cs',
      },
    },

    /* ------------------------------------------------------------ 18.9 */
    {
      id: '18.9',
      title: 'מודל הלקוח',
      blocks: [
        {
          kind: 'p',
          text:
            'המראה של החוזים על הקו: ProjectStats מקביל ל-DTO של השרת, ו-ActivityEvent ל-ActivityResponse. ' +
            'ה-DateOnly מגיע כמחרוזת ISO, וה-enums כמחרוזות. כל שדה שהשרת מוסיף — המודל בלקוח מתעדכן באותו רגע.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'string union ל-ActivityType',
          body:
            "ActivityType בלקוח הוא `'IssueCreated' | 'IssueMoved' | 'CommentAdded'` — string union, לא TS enum. " +
            'הוא מתעד בדיוק את מה שה-JSON מכיל, בלי קוד בזמן ריצה, ומאפשר switch ממצה (exhaustive) במהדר.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch18',
        file: 'client/src/app/core/models/dashboard.model.ts',
        region: 'step-18.13',
        diff: true,
        title: 'dashboard.model.ts',
      },
    },

    /* ------------------------------------------------------------ 18.10 */
    {
      id: '18.10',
      title: 'DashboardStore: שני resources',
      blocks: [
        {
          kind: 'p',
          text:
            'אותו דפוס כמו IssueDetailStore מפרק 14: שני httpResource מפתח לפי projectId. שניהם מחזירים undefined ' +
            '(= אין בקשה) כשאין פרויקט נבחר או כשהמשתמש מנותק — אפס בקשות 401 מיותרות. הרכיב קורא setProject ' +
            'ו-clear, לא נוגע ב-resources ישירות.',
        },
        {
          kind: 'callout',
          tone: 'v22',
          title: 'undefined URL = אין בקשה',
          body:
            'httpResource עם URL שמחזיר undefined פשוט לא יורה. זה הופך "מתי לטעון" לחישוב ריאקטיבי טהור: ' +
            'התחברות הופכת את ה-URL למוגדר, ואז הבקשה יוצאת. אותו טריק מ-ch12 (members) ו-ch14 (detail).',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch18',
        file: 'client/src/app/core/state/dashboard.store.ts',
        region: 'step-18.14',
        diff: true,
        title: 'dashboard.store.ts — resources',
      },
    },

    /* ------------------------------------------------------------ 18.11 */
    {
      id: '18.11',
      title: 'spine #3: ה-selectors הנגזרים',
      blocks: [
        {
          kind: 'p',
          text:
            'הלב של הפרק: כל selector הוא computed שמעצב את אותם נתונים גולמיים לצורה שרכיב מסוים צריך. ' +
            'summaryCards לכרטיסים, statusSlices ל-donut, prioritySlices ל-bar, trend ל-sparkline. ' +
            'הרכיבים מקבלים מודל-תצוגה מוכן, לא ProjectStats גולמי — וכל מיפוי-שם/צבע חי במקום אחד.',
        },
        {
          kind: 'term',
          name: 'derived selector',
          definition:
            'computed שגוזר מבנה-נתונים חדש ממצב קיים. spine piece #3: השרת מספק מספרים, ה-selector מעצב ' +
            'מודל-תצוגה. כשהמקור משתנה, כל הנגזרים מתעדכנים יחד — בלי סנכרון ידני.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'צבעים כמשתני CSS, לא hex קשיח',
          body:
            'ה-selector מחזיר color: var(--chart-open) ולא #ff8a3d. כך ערכת הצבעים (שנגזרת מה-accent ב-OKLCH) ' +
            'חיה ב-CSS, מגיבה ל-dark/light, וה-store לא יודע על צבעים קונקרטיים בכלל.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch18',
        file: 'client/src/app/core/state/dashboard.store.ts',
        region: 'step-18.15',
        diff: true,
        title: 'dashboard.store.ts — selectors',
      },
    },

    /* ------------------------------------------------------------ 18.12 */
    {
      id: '18.12',
      title: 'גרף טבעת ביד',
      blocks: [
        {
          kind: 'p',
          text:
            'הטבעת היא טריק SVG אחד: כל פרוסה היא אותו עיגול, אבל stroke-dasharray חושף רק קשת באורך ' +
            '(value/total) מההיקף, ו-stroke-dashoffset מסובב אותה למקומה. rotate(-90) מתחיל מלמעלה. אין ספריה.',
        },
        {
          kind: 'p',
          text:
            'הרכיב טיפש: מקבל slices (תווית, ערך, צבע) ומצייר. role="img" עם aria-label שמסכם את הערכים נותן ' +
            'חלופה טקסטואלית לקורא מסך — גרף שלא רואים עדיין נגיש.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'גודל קבוע, לא אחוז',
          body:
            'נתנו ל-svg גודל פיקסלים קבוע (140×140) ולא width:100%+aspect-ratio. גרף שגודלו נגזר מרוחב מלא ' +
            'בתוך אריח רחב "מתנפח" לגובה ענק. אימתנו בדפדפן ששלושת הגרפים נשארים בתוך האריחים שלהם ב-1280 וב-375.',
        },
        {
          kind: 'term',
          name: 'stroke-dasharray',
          definition:
            'תכונת SVG שקובעת תבנית של קו מקווקו: אורכי הקו והרווח לסירוגין. בטבלה משתמשים בה כדי לחשוף רק ' +
            'קשת באורך מסוים מההיקף, ו-stroke-dashoffset מזיז את נקודת ההתחלה — כך כל פרוסה יושבת במקומה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch18',
        file: 'client/src/app/features/dashboard/charts/donut-chart.ts',
        region: 'step-18.16',
        diff: true,
        title: 'donut-chart.ts',
      },
    },

    /* ------------------------------------------------------------ 18.13 */
    {
      id: '18.13',
      title: 'גרף עמודות ביד',
      blocks: [
        {
          kind: 'p',
          text:
            'גרף העמודות מלמד את ה-mapping המרכזי של data-viz: value הופך לגובה ביחס לערך המקסימלי, והאינדקס ' +
            'הופך ל-x. כל עמודה היא rect עם קואורדינטות מחושבות. preserveAspectRatio="xMidYMid meet" מבטיח ' +
            'שה-viewBox נכנס בתוך הקופסה בלי לחרוג.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'מקסימום לפחות 1',
          body:
            'Math.max(1, ...values) מונע חלוקה באפס כשכל הערכים 0 (פרויקט ריק). בלי זה, עמודה ראשונה הייתה ' +
            'מקבלת גובה NaN. מקרי-קצה של נתונים ריקים הם חלק מ-data-viz אמין.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch18',
        file: 'client/src/app/features/dashboard/charts/bar-chart.ts',
        region: 'step-18.17',
        diff: true,
        title: 'bar-chart.ts',
      },
    },

    /* ------------------------------------------------------------ 18.14 */
    {
      id: '18.14',
      title: 'sparkline ביד',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-sparkline ממפה סדרת מספרים ל-polyline: x מתפרס שווה על הרוחב, ו-y הפוך (ב-SVG ציר ה-y יורד כלפי ' +
            'מטה, אז ערך גבוה = y קטן). קו אחד, אפס תלויות. אימתנו 19 נקודות לפרויקט הראשון — יום לכל נקודה.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'vector-effect: non-scaling-stroke',
          body:
            'ה-sparkline נמתח עם preserveAspectRatio="none" כדי למלא את הרוחב. בלי non-scaling-stroke, מתיחה ' +
            'אופקית הייתה מעבה את הקו אנכית. ה-property שומר על עובי קו אחיד למרות המתיחה הלא-אחידה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch18',
        file: 'client/src/app/features/dashboard/charts/sparkline.ts',
        region: 'step-18.18',
        diff: true,
        title: 'sparkline.ts',
      },
    },

    /* ------------------------------------------------------------ 18.15 */
    {
      id: '18.15',
      title: 'רכיב הדשבורד',
      blocks: [
        {
          kind: 'p',
          text:
            'Dashboard הוא הרכיב החכם: מזריק את ה-DashboardStore, מספר לו את projectId (מה-route דרך effect), ' +
            'ומחבר selectors נגזרים לרכיבי הגרפים הטיפשים ולפיד. הוא לא מחשב כלום בעצמו. ' +
            'DestroyRef קורא ל-clear ביציאה כדי לעצור את ה-resources.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'DatePipe לפיד',
          body:
            'זמני הפיד מגיעים כמחרוזות ISO. DatePipe (`| date:\'short\'`) מציג אותם בפורמט מקומי, ו-attr datetime ' +
            'על תג ה-time נותן את הערך המכונה-קריא לטכנולוגיות מסייעות.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch18',
        file: 'client/src/app/features/dashboard/dashboard.ts',
        region: 'step-18.19',
        diff: true,
        title: 'dashboard.ts',
      },
    },

    /* ------------------------------------------------------------ 18.16 */
    {
      id: '18.16',
      title: 'התבנית: כרטיסים, אריחים, פיד',
      blocks: [
        {
          kind: 'p',
          text:
            'התבנית מורכבת מארבעה אזורים: כרטיסי סיכום (ul של summaryCards), שלושת אריחי הגרפים, ופיד הפעילות. ' +
            'מצבי טעינה/שגיאה/ריק מטופלים עם @if כמו בכל מסך אחר. כל אריח עוטף רכיב גרף אחד עם כותרת וכיתוב.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'aria-current על הקישור הפעיל',
          body:
            'הפיד וה-charts הם תוכן; הכרטיסים הם סיכום מספרי. כל אזור מסומן סמנטית (ul/role=list, time, figure) ' +
            'כדי שקורא מסך יבין מבנה, לא רק יקרא מספרים.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch18',
        file: 'client/src/app/features/dashboard/dashboard.html',
        region: 'step-18.20',
        diff: true,
        title: 'dashboard.html',
      },
    },

    /* ------------------------------------------------------------ 18.17 */
    {
      id: '18.17',
      title: 'ה-CSS: grid אינטרינזי, container queries, OKLCH',
      blocks: [
        {
          kind: 'p',
          text:
            'הפריסה היא grid אינטרינזי: repeat(auto-fit, minmax) לכרטיסים ולאריחים — מתקפלים לבד לעמודה אחת ' +
            'במסך צר, בלי media query. אימתנו: ב-1280 ארבעה כרטיסים בשורה ושלושה אריחים מיושרים; ב-375 הכרטיסים ' +
            'הופכים ל-2x2 והאריחים לעמודה אחת, אפס גלילה אופקית.',
        },
        {
          kind: 'p',
          text:
            'כל כרטיס הוא container query context: גודל המספר נגזר מרוחב הכרטיס עצמו (cqi), לא מהמסך. ' +
            'צבעי הסדרות מוגדרים ב-OKLCH ונגזרים מגוון ה-accent — ערכת צבעים אחת קוהרנטית. גוף האריח בגובה קבוע ' +
            'כדי שהגרפים יישארו תחומים, ו-prefers-reduced-motion מבטל את אנימציות החשיפה.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'container query צריך הקשר',
          body:
            'יחידת cqi עובדת רק כשיש אב עם container-type. שמנו container-type: inline-size על הכרטיס, ' +
            'ואז clamp(...) עם cqi מקטין את המספר כשהכרטיס צר — מדידה של הכרטיס, לא של חלון הדפדפן.',
        },
        {
          kind: 'term',
          name: 'intrinsic grid',
          definition:
            'רשת שמתאימה את מספר העמודות לרוחב הזמין בלי media query, עם repeat(auto-fit, minmax(min, 1fr)). ' +
            'הפריטים נשארים לפחות ברוחב min ומתקפלים לעמודה אחת כשאין מקום — הפריסה "חושבת" בעצמה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch18',
        file: 'client/src/app/features/dashboard/dashboard.scss',
        region: 'step-18.21',
        diff: true,
        title: 'dashboard.scss',
      },
    },

    /* ------------------------------------------------------------ 18.18 */
    {
      id: '18.18',
      title: 'הנתיב והקישור',
      blocks: [
        {
          kind: 'p',
          text:
            'הדשבורד הוא מסך נפרד תחת /projects/:projectId/dashboard. הוא יותר ספציפי מנתיב הלוח, ולכן מופיע לפניו ' +
            'בטבלת הנתיבים. אותם guard ו-resolver כמו הלוח: 404 אם הפרויקט לא קיים, ושם הפרויקט מוזרק כ-input.',
        },
        {
          kind: 'p',
          text:
            'מ-`client/src/app/features/projects/project-board.html` הוספנו קישור "דשבורד הפרויקט" שמנווט לשם. ' +
            'אימתנו את שני הכיוונים בדפדפן: הקישור פותח את הדשבורד, וכפתור "חזרה ללוח" חוזר.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch18',
        file: 'client/src/app/app.routes.ts',
        region: 'step-18.22',
        diff: true,
        title: 'app.routes.ts — נתיב הדשבורד',
      },
    },

    /* ------------------------------------------------------------ 18.19 */
    {
      id: '18.19',
      title: 'דמו חי: מנתונים למודל-תצוגה ל-SVG',
      blocks: [
        {
          kind: 'p',
          text:
            'הדמו הוא דשבורד-מוקטן בלי שרת. כפתור "רענן נתונים" מגריל RawStats חדש, ואותם selectors נגזרים ' +
            '(computed) מעצבים אותו לשלושת הגרפים: donut, bar, ו-sparkline — מצוירים ביד ב-SVG.',
        },
        {
          kind: 'p',
          text:
            'לחצו "רענן נתונים" כמה פעמים: הטבעת, העמודות והקו מצטיירים מחדש מהמספרים החדשים. זה בדיוק ה-pipeline ' +
            'של הפרק — נתונים גולמיים, selector שמעצב, ו-SVG שמצייר. ה-transition על הפרוסות והעמודות מבוטל ' +
            'תחת prefers-reduced-motion.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () => import('./demos/dashboard.demo').then((m) => m.DashboardDemo),
        caption: 'דמו חי: רענון נתונים, selectors נגזרים, ושלושה גרפי SVG מצוירים ביד',
      },
    },

    /* ------------------------------------------------------------ 18.20 */
    {
      id: '18.20',
      title: 'העץ אחרי פרק 18',
      blocks: [
        {
          kind: 'p',
          text:
            'בסוף פרק 18 יש לנו: seam אגרגציה (GROUP BY שמפיק ProjectStats), יומן פעילות (ישות, repo, endpoint, ' +
            'מיגרציה, כתיבה ליד הפעולה), DashboardStore עם selectors נגזרים (spine #3), ושלושה גרפי SVG ביד ' +
            'בפריסת grid אינטרינזית עם container queries ו-OKLCH. דשבורד שלם, מנתוני אמת.',
        },
        {
          kind: 'p',
          text:
            'הפרק הבא (ch19) מעמיק את מסך ה-issue: markdown, mentions, attachments, ו-timeline פעילות ברמת ה-issue — ' +
            'שיושב על אותו יומן שבנינו כאן. ה-selectors הנגזרים יחזרו גם שם.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch18',
        title: 'TaskForge אחרי פרק 18 — stats, activity, dashboard, charts',
      },
    },
  ],

  quiz: [
    {
      q: 'למה מחשבים את הסטטיסטיקה עם GroupBy על IQueryable ולא ToList ואז קיבוץ בזיכרון?',
      options: [
        'אין הבדל — שתי הדרכים זהות',
        'GroupBy על IQueryable מתורגם ל-GROUP BY ב-SQL; ToList מושך את כל הטבלה לשרת האפליקציה',
        'ToList מהיר יותר תמיד',
        'GroupBy בזיכרון נותן ספירות מדויקות יותר',
      ],
      answer: 1,
      explain:
        'GroupBy על IQueryable הופך ל-GROUP BY ב-SQL — ה-DB מחשב ומחזיר רק את הסיכום. ' +
        'ToList קודם מושך את כל השורות לזיכרון השרת ואז מקבץ — לא סקלבילי לטבלאות גדולות.',
    },
    {
      q: 'מה spine piece #3 שהפרק מציג?',
      options: [
        'EntityStore גנרי',
        'command registry',
        'selectors נגזרים: computed שמעצבים נתונים גולמיים למודלי-תצוגה',
        'optimistic update',
      ],
      answer: 2,
      explain:
        'spine #3 הוא ה-derived selectors: computed ב-store שגוזרים ממספרי השרת מודל-תצוגה מוכן-לציור. ' +
        'הרכיבים נשארים טיפשים, וכל מיפוי שם/צבע/צורה חי במקום אחד.',
    },
    {
      q: 'איך גרף הטבעת מצייר פרוסה בודדת ב-SVG?',
      options: [
        'עם path ו-arc commands מורכבים',
        'עם עיגול אחד לכל פרוסה: stroke-dasharray חושף קשת באורך (value/total) מההיקף, ו-dashoffset מסובב',
        'עם הרבה קווי polygon',
        'הדפדפן מצייר donut מובנה',
      ],
      answer: 1,
      explain:
        'כל פרוסה היא אותו circle. stroke-dasharray = "אורך-קשת היקף" חושף רק חלק מההיקף, ' +
        'ו-stroke-dashoffset מזיז את ההתחלה כך שהפרוסות מצטברות סביב הטבעת.',
    },
    {
      q: 'למה הגרפים מקבלים גודל פיקסלים קבוע ולא width:100% עם aspect-ratio?',
      options: [
        'כי aspect-ratio לא נתמך',
        'כי גרף שגודלו נגזר מרוחב מלא בתוך אריח רחב "מתנפח" לגובה ענק וחורג מהאריח',
        'כי פיקסלים מהירים יותר',
        'כי SVG לא תומך באחוזים',
      ],
      answer: 1,
      explain:
        'width:100% + aspect-ratio:200/120 על אריח רחב (נניח 600px) נותן גובה ~360px — הגרף מתנפח. ' +
        'גובה קבוע (או גודל קבוע) שומר את הגרף תחום, ולכן בדקנו בדפדפן ב-1280 וב-375.',
    },
    {
      q: 'מתי DashboardStore לא שולח בקשה לשרת?',
      options: [
        'אף פעם — הוא תמיד טוען',
        'כשאין projectId נבחר, או כשהמשתמש מנותק (ה-URL מחזיר undefined)',
        'רק כשאין אינטרנט',
        'כשהדשבורד סגור',
      ],
      answer: 1,
      explain:
        'שני ה-httpResource מחזירים undefined כשאין projectId או כש-!isLoggedIn. httpResource עם URL=undefined ' +
        'לא יורה — אפס בקשות 401 מיותרות. אותו דפוס מ-ch12 ו-ch14.',
    },
    {
      q: 'למה IssueMoved נרשם רק כשהסטטוס השתנה, ולא בכל סידור-מחדש?',
      options: [
        'כי PATCH לא יכול לקרוא ל-LogAsync',
        'כדי לא להציף את הפיד ברעש — הזזה בתוך אותה עמודה היא לא פעילות מעניינת',
        'כי שינוי rank לא נשמר',
        'כי רק Owner יכול להזיז',
      ],
      answer: 1,
      explain:
        'ה-handler משווה את הסטטוס הקיים לחדש ורושם אירוע רק אם הוא באמת השתנה. סידור-מחדש בתוך עמודה ' +
        'משנה רק rank — לא משהו שכדאי להציג בפיד הפעילות.',
    },
    {
      q: 'איך מובטח שצבעי הגרפים מגיבים ל-dark/light?',
      options: [
        'ה-store מחזיר hex שונה לכל theme',
        'ה-selectors מחזירים var(--chart-*); הצבעים מוגדרים ב-CSS ב-OKLCH ונגזרים מה-accent',
        'הגרפים לא מגיבים ל-theme',
        'JavaScript מחליף צבעים ב-effect',
      ],
      answer: 1,
      explain:
        'ה-selector מחזיר color: var(--chart-open) — שם משתנה, לא ערך. הצבעים חיים ב-CSS (OKLCH נגזר מה-accent), ' +
        'ולכן מגיבים ל-theme בלי שה-store ידע על צבעים קונקרטיים.',
    },
  ],

  proveIt: [
    {
      title: 'פתחו את הדשבורד — המספרים תואמים',
      body:
        'התחברו (demo@taskforge.dev / Passw0rd!), פתחו פרויקט, ולחצו "דשבורד הפרויקט". השוו את כרטיסי הסיכום ' +
        'לספירות בלוח.',
      expect: 'סך הכול 60, פתוח 21, בעבודה 20, הושלם 19 — בדיוק כמו עמודות ה-Kanban מפרק 17.',
    },
    {
      title: 'צרו issue — הפיד מתעדכן',
      body: 'צרו issue חדש בפרויקט, חזרו לדשבורד ורעננו.',
      expect: 'אירוע "יצר/ה את ..." מופיע ראש הפיד, וסך ה-issues בכרטיס הסיכום עולה ב-1.',
      command:
        'curl -X POST http://localhost:5080/api/projects/1/issues -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\\"title\\":\\"Smoke test\\",\\"priority\\":\\"High\\"}"',
    },
    {
      title: 'הצרו את החלון — הפריסה מתקפלת',
      body: 'הצרו את הדפדפן ל-375px.',
      expect: 'כרטיסי הסיכום הופכים ל-2x2 והאריחים לעמודה אחת, בלי גלילה אופקית — container queries ו-auto-fit, לא media query.',
    },
    {
      title: 'בדקו את ההרשאה ב-curl',
      body: 'קראו ל-stats בלי טוקן, ואז עם טוקן של חבר.',
      expect: '‏401 בלי טוקן; ‏200 עם ProjectStats מלא עבור חבר בפרויקט.',
      command: 'curl http://localhost:5080/api/projects/1/stats',
    },
  ],

  exercise: {
    prompt:
      'הוסיפו אריח גרף רביעי: "issues שנסגרו לאורך זמן" (closedPerDay) כ-sparkline שני, או כרטיס סיכום חמישי ' +
      'עם מספר התגובות בפרויקט.',
    tasks: [
      'בשרת: הוסיפו שדה ל-ProjectStats (למשל CommentCount או ClosedPerDay) וחשבו אותו ב-EfStatsRepository עם GroupBy/Count.',
      'במודל הלקוח: הוסיפו את השדה ל-interface ProjectStats.',
      'ב-store: הוסיפו selector נגזר חדש שמעצב את הנתון לצורת התצוגה.',
      'בתבנית: הוסיפו אריח/כרטיס שצורך את ה-selector; שמרו על גובה גרף תחום.',
    ],
    acceptance: [
      'ה-endpoint מחזיר את השדה החדש, ומספרו תואם ל-DB.',
      'האריח/הכרטיס מצויר ונשאר בתוך גבולותיו ב-1280 וב-375 (אפס גלילה אופקית).',
      'אין שגיאות console; הגרף מבוטל-תנועה תחת prefers-reduced-motion.',
    ],
  },
};
