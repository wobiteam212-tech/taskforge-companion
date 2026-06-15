import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 19 — Issue עשיר: Markdown, Mentions, Attachments ו-Activity.
 * Wave 4, spine piece #4: optimistic UI + undo + rollback.
 * Backend: Attachment entity + EfAttachmentRepository (BLOB in DB, metadata list),
 * IAttachmentRepository seam, AttachmentContracts, AttachmentEndpoints (list/upload/download),
 * ActivityType.AttachmentAdded (enum value, no migration needed — TEXT column),
 * IActivityRepository.GetRecentForIssueAsync + EfActivityRepository impl,
 * DashboardEndpoints.GetIssueActivity (GET /api/issues/{id}/activity),
 * TaskForgeDbContext.Attachments + fluent config, Program.cs DI,
 * EF migration AddAttachments (Attachments table, FK cascade Issues, restrict Users).
 * Frontend: renderMarkdown (escape-first XSS defense), MarkdownEditor (FormValueControl<string>,
 * Write/Preview tab, @mention autocomplete), IssueDetailStore (3 new resources, optimistic
 * comments with undo, addAttachment, download), IssueDetail component (two-column grid,
 * comment undo bar, file upload/download, activity timeline with icons).
 * Every fact stated here was runtime-proven (two-server smoke + 375px layout check).
 */
export const CH19_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 19.1 */
    {
      id: '19.1',
      title: 'הפרק: issue עשיר מקצה לקצה',
      blocks: [
        {
          kind: 'p',
          text:
            'עד פרק 14 ה-issue detail היה טופס עריכה ורשימת תגובות. פרק 19 מעמיק אותו לארבעה כיוונים: ' +
            'תגובות עם Markdown ו-@mention, קבצים מצורפים (upload/download), timeline פעילות ברמת ה-issue, ' +
            'ו-Undo ל-4 שניות לפני שהתגובה מגיעה לשרת.',
        },
        {
          kind: 'p',
          text:
            'זה spine piece #4: optimistic UI עם undo ו-rollback. הדפוס שנלמד כאן מכליל את העדכון-האופטימי ' +
            'ש-ch17 הציג בלוח ה-Kanban — הפעם עם חלון ביטול בן ארבע שניות שבו השרת עוד לא ראה שום דבר.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה ארבע שניות ו-Undo ולא פשוט POST מיידי?',
          body:
            'תגובה שנשלחת בטעות לא ניתן למחוק בפרק הזה (מחיקה היא תרגיל המשך). Undo חינמי — ' +
            'הוא מסיר תגובה זמנית לפני שהשרת ראה אותה, כך שאין צורך ב-DELETE. ' +
            'זה גם הפרדת דאגות ברורה: ה-store מחזיק את הטיימר, הרכיב רק לוחץ "בטל".',
        },
      ],
      panel: {
        kind: 'filetree',
        title: 'קבצים חדשים ומשתנים בפרק 19',
        lines: [
          { text: 'server/', depth: 0, kind: 'dir' },
          { text: 'TaskForge.Core/Entities/Attachment.cs', depth: 1, kind: 'file', badge: 'new' },
          { text: 'TaskForge.Core/Abstractions/IAttachmentRepository.cs', depth: 1, kind: 'file', badge: 'new' },
          { text: 'TaskForge.Infrastructure/Repositories/EfAttachmentRepository.cs', depth: 1, kind: 'file', badge: 'new' },
          { text: 'TaskForge.Api/Contracts/AttachmentContracts.cs', depth: 1, kind: 'file', badge: 'new' },
          { text: 'TaskForge.Api/Endpoints/AttachmentEndpoints.cs', depth: 1, kind: 'file', badge: 'new' },
          { text: 'TaskForge.Core/Entities/ActivityEvent.cs — AttachmentAdded', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'TaskForge.Core/Abstractions/IActivityRepository.cs — GetRecentForIssueAsync', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'TaskForge.Infrastructure/Repositories/EfActivityRepository.cs', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'TaskForge.Api/Endpoints/DashboardEndpoints.cs — GetIssueActivity', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'TaskForge.Infrastructure/Data/TaskForgeDbContext.cs — Attachments config', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'TaskForge.Api/Program.cs — IAttachmentRepository DI', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'Migrations/20260615142517_AddAttachments.cs', depth: 1, kind: 'file', badge: 'new' },
          { text: 'client/', depth: 0, kind: 'dir' },
          { text: 'core/markdown/markdown.ts', depth: 1, kind: 'file', badge: 'new' },
          { text: 'core/models/attachment.model.ts', depth: 1, kind: 'file', badge: 'new' },
          { text: 'core/models/dashboard.model.ts — ActivityType += AttachmentAdded', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'shared/ui/markdown-editor/markdown-editor.ts/.html/.scss', depth: 1, kind: 'file', badge: 'new' },
          { text: 'core/state/issue-detail.store.ts — resources + undo + attachments', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'features/issues/issue-detail.ts/.html/.scss', depth: 1, kind: 'file', badge: 'mod' },
        ],
        caption: 'Markdown ו-XSS, קבצים עם BLOB, undo אופטימי, ו-timeline ברמת ה-issue',
      },
    },

    /* ------------------------------------------------------------ 19.2 */
    {
      id: '19.2',
      title: 'ישות ה-Attachment: BLOB ב-DB',
      blocks: [
        {
          kind: 'p',
          text:
            'הישות `server/TaskForge.Core/Entities/Attachment.cs` מגדירה קובץ מצורף ל-issue. ' +
            'שדה `Bytes` הוא `byte[]` — ה-BLOB ממש יישמר ב-DB. ' +
            'זה פשוט ואטומי: אין תלות בדיסק, אין S3, ואין כשל אפשרי בין שמירת המטא-דאטה לשמירת הבייטים.',
        },
        {
          kind: 'term',
          name: 'BLOB (Binary Large Object)',
          definition:
            'שדה DB שמחזיק נתונים בינאריים גולמיים (תמונה, מסמך, קובץ כלשהו). ' +
            'ב-SQLite הוא עמודת BLOB; ב-SQL Server הוא VARBINARY(MAX). ' +
            'נוח לפיתוח — הכול אטומי. בפרודקשן נוטים להחזיק רק מצביע ולאחסן בשירות ייעודי.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה בפרודקשן לא מאחסנים קבצים ב-DB?',
          body:
            'שלושה טעמים: (1) גיבויים תופחים — גיבוי שכולל בינאריים גדולים לוקח הרבה יותר זמן ומקום. ' +
            '(2) ביצועים — ה-DB לא אופטימלי לשידור קבצים גדולים; CDN וblob storage כמו S3 בנויים לזה. ' +
            '(3) סקלינג — עלות האחסון בבסיס נתונים גבוהה מאחסון אובייקטים. ' +
            'בפיתוח ה-BLOB הוא trade-off נכון: פשטות, אטומיות, ואפס תלויות.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch19',
        file: 'server/TaskForge.Core/Entities/Attachment.cs',
        region: 'step-19.1',
        diff: true,
        title: 'Attachment.cs',
      },
    },

    /* ------------------------------------------------------------ 19.3 */
    {
      id: '19.3',
      title: 'ה-seam: IAttachmentRepository',
      blocks: [
        {
          kind: 'p',
          text:
            'החוזה ב-`server/TaskForge.Core/Abstractions/IAttachmentRepository.cs` מגדיר שלוש פעולות: ' +
            '`AddAsync` לשמירה, `GetMetadataByIssueAsync` לרשימה (בלי bytes), ' +
            'ו-`GetByIdAsync` להורדה (כולל bytes). ההפרדה בין שתי הקריאות היא כוונתית — ' +
            'רשימת קבצים לא צריכה לשלוף מגה-בייטים לזיכרון.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'seam בשביל בדיקות גם',
          body:
            'בדיוק כמו `IIssueRepository` ו-`ICommentRepository`, גם כאן ה-interface הוא seam לבדיקה: ' +
            'טסט יחידה יכול להחליף את המימוש ב-in-memory mock ולא לגעת ב-DB כלל. ' +
            'פרק 21 (Testing) יממש את הרעיון הזה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch19',
        file: 'server/TaskForge.Core/Abstractions/IAttachmentRepository.cs',
        region: 'step-19.2',
        diff: true,
        title: 'IAttachmentRepository.cs',
      },
    },

    /* ------------------------------------------------------------ 19.4 */
    {
      id: '19.4',
      title: 'EfAttachmentRepository: הקרנה שמשמיטה bytes',
      blocks: [
        {
          kind: 'p',
          text:
            '`server/TaskForge.Infrastructure/Repositories/EfAttachmentRepository.cs` מממש את שתי הקריאות: ' +
            'ב-`GetMetadataByIssueAsync` יש `.Select(a => new Attachment { ... Bytes = Array.Empty<byte>() ... })` — ' +
            'הקרנה מפורשת שמשמיטה את ה-BLOB. EF מתרגם זאת לשאילתת SQL שלא מבקשת את עמודת ה-BLOB כלל, ' +
            'כך שהנתונים הכבדים לא יוצאים מה-DB.',
        },
        {
          kind: 'term',
          name: 'projection (הקרנה)',
          definition:
            'שאילתת SQL שבוחרת עמודות ספציפיות בלבד, בניגוד ל-SELECT *. ' +
            'ב-EF: `.Select(e => new { e.Id, e.Name })` מתורגם ל-SELECT Id, Name — עמודות כבדות (BLOB, JSON גדול) לא נשלפות. ' +
            'חיוני לרשימות שבהן רק המטא-דאטה נדרש.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'Include לא עוצר את ה-BLOB',
          body:
            'בלי `.Select(...)`, גם אם הייתם רוצים רק את שם הקובץ, EF היה שולף את כל השורה כולל ה-BLOB. ' +
            'הדרך היחידה למנוע זאת היא הקרנה מפורשת. ' +
            'בדקנו: שאילתת הרשימה מהירה גם כשיש קבצים של מגה-בייטים — ה-BLOB נשאר ב-DB.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch19',
        file: 'server/TaskForge.Infrastructure/Repositories/EfAttachmentRepository.cs',
        region: 'step-19.3',
        diff: true,
        title: 'EfAttachmentRepository.cs',
      },
    },

    /* ------------------------------------------------------------ 19.5 */
    {
      id: '19.5',
      title: 'AttachmentContracts: AttachmentResponse',
      blocks: [
        {
          kind: 'p',
          text:
            '`server/TaskForge.Api/Contracts/AttachmentContracts.cs` מגדיר `AttachmentResponse`: ' +
            'מטא-דאטה של הקובץ — בלי ה-bytes. הסיבה: ה-201 אחרי העלאה ורשימת הקבצים שניהם ' +
            'מחזירים את אותו record, אבל ה-bytes עצמם מגיעים רק בנתיב ההורדה הנפרד.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'with-expression לאחר AddAsync',
          body:
            '`AddAsync` מחזיר את הישות כפי שנשמרה, אבל ה-navigation `UploadedBy` לא נטען כי לא הגדרנו Include. ' +
            'ה-handler פותר זאת בצורה נקייה: `AttachmentResponse.FromEntity(saved) with { UploadedByName = uploaderName }` — ' +
            'שם המעלה מגיע מה-claim "name" שבטוקן JWT, בלי round-trip נוסף ל-DB.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch19',
        file: 'server/TaskForge.Api/Contracts/AttachmentContracts.cs',
        region: 'step-19.4',
        diff: true,
        title: 'AttachmentContracts.cs',
      },
    },

    /* ------------------------------------------------------------ 19.6 */
    {
      id: '19.6',
      title: 'AttachmentEndpoints: קבוצת הנתיבים',
      blocks: [
        {
          kind: 'p',
          text:
            '`server/TaskForge.Api/Endpoints/AttachmentEndpoints.cs` מגדיר שתי קבוצות: ' +
            'אחת תחת `/api/issues/{issueId}/attachments` (רשימה + העלאה) ואחת תחת `/api/attachments` (הורדה לפי ID). ' +
            'העלאה קוראת ל-`.DisableAntiforgery()`: ה-SPA שולח Bearer, לא קוקי, ולכן אין סיכון CSRF.',
        },
        {
          kind: 'term',
          name: 'CSRF (Cross-Site Request Forgery)',
          definition:
            'התקפה שבה דף זדוני מנצל את העובדה שהדפדפן שולח קוקיות אוטומטית לכל origin. ' +
            'כשהאימות הוא Bearer token בכותרת Authorization (ולא קוקי), הדפדפן לא מצרף אותו לבקשות cross-site — ' +
            'ולכן הגנת antiforgery אינה נדרשת.',
        },
        {
          kind: 'callout',
          tone: 'dotnet10',
          title: '.NET 10: DisableAntiforgery על multipart',
          body:
            'ב-.NET 8+ Minimal API מבקש antiforgery token כברירת מחדל על כל בקשת multipart/form-data. ' +
            'אפליקציית SPA שמשתמשת ב-Bearer לא מחזיקה את הטוקן הזה. ' +
            '`.DisableAntiforgery()` על ה-endpoint אומר: "אנחנו מאובטחים אחרת (Bearer) — ויתרו על הדרישה".',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch19',
        file: 'server/TaskForge.Api/Endpoints/AttachmentEndpoints.cs',
        region: 'step-19.5',
        diff: true,
        title: 'AttachmentEndpoints.cs — route group',
      },
    },

    /* ------------------------------------------------------------ 19.7 */
    {
      id: '19.7',
      title: 'ה-handlers: list, upload, download',
      blocks: [
        {
          kind: 'p',
          text:
            'שלושת ה-handlers ב-`server/TaskForge.Api/Endpoints/AttachmentEndpoints.cs` עוקבים אחרי אותו דפוס הרשאה: ' +
            '404 אם ה-issue לא קיים, 403 אם המשתמש אינו חבר. ' +
            'ב-`UploadAttachment`: גודל ריק הוא 400, מעל 5MB הוא 400, ואז קוראים את הזרם לזיכרון, שומרים, ' +
            'ורושמים `AttachmentAdded` ביומן הפעילות. החזרה היא 201 עם `AttachmentResponse`.',
        },
        {
          kind: 'p',
          text:
            '`DownloadAttachment` שולף את הישות כולל ה-bytes, מאמת חברות דרך ה-issue, ' +
            'ומחזיר `TypedResults.File(bytes, contentType, fileName)`. ' +
            'הדפדפן מקבל את ה-content-type המקורי ואת שם הקובץ ב-Content-Disposition.',
        },
        {
          kind: 'code',
          lang: 'bash',
          title: 'תרחישים שאומתו בפועל',
          code:
            'POST /api/issues/1/attachments  (multipart, שדה "file")\n' +
            '  -> 201  AttachmentResponse { id, fileName, sizeBytes, uploadedByName, ... }\n\n' +
            'POST /api/issues/1/attachments  (קובץ ריק)\n' +
            '  -> 400  "הקובץ ריק"\n\n' +
            'POST /api/issues/1/attachments  (קובץ גדול מ-5MB)\n' +
            '  -> 400  "הקובץ גדול מ-5MB"\n\n' +
            'GET /api/issues/1/attachments   (ללא טוקן)\n' +
            '  -> 401 Unauthorized\n\n' +
            'GET /api/attachments/{id}  (עם Bearer)\n' +
            '  -> 200  bytes + Content-Type מקורי',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch19',
        file: 'server/TaskForge.Api/Endpoints/AttachmentEndpoints.cs',
        region: 'step-19.6',
        diff: true,
        title: 'AttachmentEndpoints.cs — handlers',
      },
    },

    /* ------------------------------------------------------------ 19.8 */
    {
      id: '19.8',
      title: 'AttachmentAdded: enum מתרחב בלי מיגרציה',
      blocks: [
        {
          kind: 'p',
          text:
            '`server/TaskForge.Core/Entities/ActivityEvent.cs` מקבל ערך חדש: `AttachmentAdded`. ' +
            'כי העמודה נשמרת כ-TEXT (דרך `HasConversion<string>()`), ערך enum חדש הוא פשוט מחרוזת חדשה — ' +
            'שינוי קוד בלבד, ללא שינוי סכמה, ללא מיגרציה.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'TEXT vs INTEGER לעמודת enum',
          body:
            'כשה-enum נשמר כמספר שלם, הוספת ערך באמצע משנה את ה-mapping ועלולה לשבש נתונים קיימים. ' +
            'כש-enum נשמר כטקסט, כל ערך הוא מחרוזת עצמאית — ניתן להוסיף ולהסיר ערכים בלי לגעת ב-DB, ' +
            'ובלי שנתונים ישנים מתבלבלים. הקוד קריא, ה-DB קריא, ואין סיכון.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch19',
        file: 'server/TaskForge.Core/Entities/ActivityEvent.cs',
        region: 'step-19.7',
        diff: true,
        title: 'ActivityEvent.cs — AttachmentAdded',
      },
    },

    /* ------------------------------------------------------------ 19.9 */
    {
      id: '19.9',
      title: 'GetRecentForIssueAsync: timeline ל-issue',
      blocks: [
        {
          kind: 'p',
          text:
            'פרק 18 בנה את יומן הפעילות ברמת הפרויקט. פרק 19 מוסיף שיטה ל-`server/TaskForge.Core/Abstractions/IActivityRepository.cs`: ' +
            '`GetRecentForIssueAsync` — אותה שאילתה בדיוק, רק עם `Where(e => e.IssueId == issueId)`. ' +
            'המימוש ב-`server/TaskForge.Infrastructure/Repositories/EfActivityRepository.cs` שמור בדיוק לפי הדפוס.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה לא endpoint חדש לחלוטין?',
          body:
            'ה-repository כבר יודע לקרוא, לסדר ולהגביל. פיצול ה-Where הוא 4 שורות. ' +
            'שיתוף ה-LogAsync בין כל ה-handlers (יצירת issue, תגובה, קובץ) מראה שה-seam עובד: ' +
            'החוזה לא השתנה — רק הורחב.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch19',
        file: 'server/TaskForge.Infrastructure/Repositories/EfActivityRepository.cs',
        region: 'step-19.8b',
        diff: true,
        title: 'EfActivityRepository.cs — GetRecentForIssueAsync',
      },
    },

    /* ------------------------------------------------------------ 19.10 */
    {
      id: '19.10',
      title: 'GetIssueActivity endpoint',
      blocks: [
        {
          kind: 'p',
          text:
            '`server/TaskForge.Api/Endpoints/DashboardEndpoints.cs` מקבל נתיב נוסף: ' +
            '`GET /api/issues/{issueId}/activity`. הוא ממוקם בקבוצה חדשה תחת `/api/issues/{issueId:int}`, ' +
            'עם אותו `HandlerTimingFilter` ו-`.RequireAuthorization()`. ' +
            'ה-`take` מוגבל 1..50 (ברירת מחדל 20) — אפשרות לכוונון עתידי.',
        },
        {
          kind: 'code',
          lang: 'bash',
          title: 'אומת ב-curl',
          code:
            'GET /api/issues/1/activity\n' +
            '  -> 200  מערך ActivityResponse ממוין חדש-ראשון, עם actorName\n\n' +
            'GET /api/issues/1/activity   (ללא טוקן)\n' +
            '  -> 401 Unauthorized',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch19',
        file: 'server/TaskForge.Api/Endpoints/DashboardEndpoints.cs',
        region: 'step-19.9b',
        diff: true,
        title: 'DashboardEndpoints.cs — GetIssueActivity',
      },
    },

    /* ------------------------------------------------------------ 19.11 */
    {
      id: '19.11',
      title: 'TaskForgeDbContext: תצורת Attachment',
      blocks: [
        {
          kind: 'p',
          text:
            '`server/TaskForge.Infrastructure/Data/TaskForgeDbContext.cs` מוסיף `DbSet<Attachment>` ' +
            'וקונפיגורציית Fluent: `FileName` מוגבל ל-260 תווים, `ContentType` ל-120, ' +
            'אינדקס על `IssueId` (הנתיב החם של הרשימה), FK cascade מ-Issues ו-restrict מ-Users.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'Cascade לישות, Restrict למשתמש',
          body:
            'מחיקת issue מוחקת את כל הקבצים שלו — כי הם חלק מה-issue. ' +
            'מחיקת משתמש לא מוחקת קבצים שהוא העלה — ההיסטוריה נשמרת. ' +
            'אותו דפוס כמו ב-Comments (פרק 14) ו-ActivityEvents (פרק 18).',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch19',
        file: 'server/TaskForge.Infrastructure/Data/TaskForgeDbContext.cs',
        region: 'step-19.10b',
        diff: true,
        title: 'TaskForgeDbContext.cs — Attachment config',
      },
    },

    /* ------------------------------------------------------------ 19.12 */
    {
      id: '19.12',
      title: 'Program.cs: DI ו-endpoint חדש',
      blocks: [
        {
          kind: 'p',
          text:
            '`server/TaskForge.Api/Program.cs` מקבל שתי שורות: ' +
            '`AddScoped<IAttachmentRepository, EfAttachmentRepository>()` ב-DI, ' +
            'ו-`MapAttachmentEndpoints()` בהגדרת הנתיבים. ' +
            'אותו דפוס כמו כל שאר ה-endpoints — שורה אחת לרישום, שורה אחת לניתוב.',
        },
        {
          kind: 'p',
          text:
            'המיגרציה `server/TaskForge.Infrastructure/Migrations/20260615142517_AddAttachments.cs` ' +
            'נוצרה עם `dotnet ef migrations add AddAttachments` מתוך `reference/.build/ch19/server`. ' +
            'היא יוצרת את טבלת `Attachments` עם כל המפתחות הזרים והאינדקסים. ' +
            'גם `server/TaskForge.Infrastructure/Migrations/20260615142517_AddAttachments.Designer.cs` ' +
            'ו-`server/TaskForge.Infrastructure/Migrations/TaskForgeDbContextModelSnapshot.cs` עודכנו — ' +
            'הם תיאור ה-state הנוכחי שמולו EF יחשב את המיגרציה הבאה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch19',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-19.11',
        diff: true,
        title: 'Program.cs — IAttachmentRepository DI',
      },
    },

    /* ------------------------------------------------------------ 19.13 */
    {
      id: '19.13',
      title: 'המיגרציה: AddAttachments',
      blocks: [
        {
          kind: 'p',
          text:
            'המיגרציה `server/TaskForge.Infrastructure/Migrations/20260615142517_AddAttachments.cs` ' +
            'היא השינוי היחידי בסכמה בפרק 19. היא יוצרת `Attachments` עם שני FKs: ' +
            'Cascade ל-`Issues` (מחיקת issue גוררת קבצים) ו-Restrict ל-`Users` (מחיקת משתמש שומרת קבצים). ' +
            'גם אינדקס על `IssueId` לנתיב החם.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'מה לא דורש מיגרציה',
          body:
            'הוספת `AttachmentAdded` ל-enum `ActivityType` אינה מצריכה מיגרציה — העמודה היא TEXT. ' +
            'רק הוספת טבלה, שינוי עמודה, או שינוי FK דורשים מיגרציה. ' +
            'ערכי enum כטקסט הם יתרון ממשי: מוסיפים סוג פעילות חדש ומשחררים, בלי schema migration.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch19',
        file: 'server/TaskForge.Infrastructure/Migrations/20260615142517_AddAttachments.cs',
        diff: true,
        title: 'AddAttachments.cs — המיגרציה',
      },
    },

    /* ------------------------------------------------------------ 19.14 */
    {
      id: '19.14',
      title: 'renderMarkdown: escape קודם, תגיות אחר כך',
      blocks: [
        {
          kind: 'p',
          text:
            '`client/src/app/core/markdown/markdown.ts` מממש Markdown מינימלי ובטוח. ' +
            'הסדר הוא הכול: קודם `escapeHtml(source)` — כל `<`, `>`, `&`, `"`, `\'` הופכים לישויות HTML. ' +
            'רק אחרי ה-escape מוסיפים תגיות בטוחות: `` `code` `` הופך ל-`<code>`, ' +
            '`**bold**` ל-`<strong>`, `*italic*` ל-`<em>`, `[text](url)` ל-`<a>` (סכימות בטוחות בלבד), ' +
            '`@name` ל-`<span class="mention">`, ושבירת שורה ל-`<br>`.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ההגנה מפני XSS כאן, ולמה הסדר חשוב?',
          body:
            'ה-escape-first הוא ההגנה כולה. אם משתמש מדביק `<script>alert(1)</script>` בתגובה, ' +
            'ה-escape הופך אותו ל-`&lt;script&gt;alert(1)&lt;/script&gt;` — טקסט שמוצג, לא קוד שרץ. ' +
            'אם היינו עושים escape אחרי ה-transforms, תגובה כמו `<img src=x onerror=alert(1)>` ' +
            'עלולה "לברוח" מהסינון ולהכיל אירוע JavaScript. ' +
            'אימתנו: הדבקת `<script>alert(1)</script>` בשדה התגובה בדפדפן הציגה טקסט בלבד — אפס ביצוע.',
        },
        {
          kind: 'term',
          name: 'XSS (Cross-Site Scripting)',
          definition:
            'התקפה שמזריקה קוד JavaScript לתוך HTML שמוצג למשתמשים אחרים. ' +
            'ניתן למנוע אותה ב-escape של כל קלט לפני שמות אותו ל-innerHTML. ' +
            'Angular מגן על binding רגיל, אבל `[innerHTML]` מאפשר HTML גולמי — ולכן חייבים escape בקוד.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch19',
        file: 'client/src/app/core/markdown/markdown.ts',
        region: 'step-19.12',
        diff: true,
        title: 'markdown.ts — renderMarkdown',
      },
    },

    /* ------------------------------------------------------------ 19.15 */
    {
      id: '19.15',
      title: 'מודלי הלקוח: Attachment ו-ActivityType מורחב',
      blocks: [
        {
          kind: 'p',
          text:
            '`client/src/app/core/models/attachment.model.ts` הוא המראה של `AttachmentResponse` על הקו — ' +
            'מטא-דאטה בלבד, בלי bytes. `client/src/app/core/models/dashboard.model.ts` מוסיף ' +
            '`\'AttachmentAdded\'` ל-`ActivityType` union. ' +
            'כי ה-union הוא מקור האמת של הלקוח לגבי מה שעשוי להגיע, המהדר יזהיר אם נוסיף ' +
            'ענף `switch` שלא מטפל בו.',
        },
        {
          kind: 'term',
          name: 'string union exhaustive check',
          definition:
            'כשמשתמשים ב-TypeScript `switch` על string union ומוסיפים `default: const _: never = x`, ' +
            'המהדר מזהיר על כל ערך לא מטופל. כך הוספת `AttachmentAdded` ל-union תכריח לעדכן ' +
            'כל switch שסומן כ-exhaustive — בטיחות מהדר בלי ריצה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch19',
        file: 'client/src/app/core/models/dashboard.model.ts',
        region: 'step-19.13b',
        diff: true,
        title: 'dashboard.model.ts — ActivityType += AttachmentAdded',
      },
    },

    /* ------------------------------------------------------------ 19.16 */
    {
      id: '19.16',
      title: 'MarkdownEditor: custom form control',
      blocks: [
        {
          kind: 'p',
          text:
            '`client/src/app/shared/ui/markdown-editor/markdown-editor.ts` מממש `FormValueControl<string>` — ' +
            'אותו חוזה שהוצג ב-ch14 עם `PriorityPicker`. ' +
            'כל שצריך: `value = model<string>(\'\')`. ' +
            'לכן `[formField]="issueForm.description"` עובד בלי שינוי — ' +
            'Signal Forms מסנכרן בין ה-field לבין ה-model.',
        },
        {
          kind: 'p',
          text:
            'ל-`MarkdownEditor` יש ארבעה inputs: `value` (model), `disabled`, `rows`, `placeholder`, ' +
            'ו-`mentionCandidates: string[]`. ' +
            'פנימית: `preview = signal(false)` מחליף בין textarea לתצוגה מקדימה (HTML ממה שיש ב-`rendered = computed(() => renderMarkdown(value() || \'\')`)).',
        },
        {
          kind: 'callout',
          tone: 'v22',
          title: 'FormValueControl: ממשיך את ch14',
          body:
            'פרק 14 לימד `FormValueControl<IssuePriority>` עם `PriorityPicker`. ' +
            'פרק 19 מחיל את אותו דפוס על `string` — editor מלא עם Markdown. ' +
            'אפשר לעטוף כל רכיב UI ב-Signal Forms: הקריטריון היחידי הוא `value = model<T>()`.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch19',
        file: 'client/src/app/shared/ui/markdown-editor/markdown-editor.ts',
        region: 'step-19.14',
        diff: true,
        title: 'markdown-editor.ts',
      },
    },

    /* ------------------------------------------------------------ 19.17 */
    {
      id: '19.17',
      title: 'MarkdownEditor: תבנית ו-@mention popover',
      blocks: [
        {
          kind: 'p',
          text:
            '`client/src/app/shared/ui/markdown-editor/markdown-editor.html` מציג שני טאבים (כתיבה / תצוגה מקדימה). ' +
            'בטאב הכתיבה: `textarea` שמאזין ל-`input` ו-`keydown`. ' +
            'כשיש התאמות ל-@mention, `<ul class="md-mentions">` מופיע בתוך `@if (mentionMatches().length)` ' +
            'עם `role="listbox"` ו-`role="option"` על כל פריט — נגישות מובנית.',
        },
        {
          kind: 'p',
          text:
            'בחירה ב-Enter, Tab, ArrowUp, ArrowDown, או לחיצה. ' +
            '`mousedown` עם `$event.preventDefault()` מונע איבוד פוקוס מה-textarea ברגע הלחיצה על הפריט — ' +
            'גרייה שכיחה ב-popover UI. ' +
            'ב-`client/src/app/shared/ui/markdown-editor/markdown-editor.scss` ה-popover ממוקם absolute ' +
            'מתוך `.md-input { position: relative }` — עוגן קרוב, לא ל-viewport.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'mousedown, לא click, על פריטי popover',
          body:
            '`click` מגיע אחרי `blur` — כלומר ה-textarea כבר איבד פוקוס. ' +
            '`mousedown` מגיע לפני `blur`, ו-`preventDefault()` עוצר את ה-blur לחלוטין. ' +
            'בלי זה, ה-popover היה נסגר לפני שהבחירה מגיעה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch19',
        file: 'client/src/app/shared/ui/markdown-editor/markdown-editor.html',
        diff: true,
        title: 'markdown-editor.html — כל הקובץ',
      },
    },

    /* ------------------------------------------------------------ 19.18 */
    {
      id: '19.18',
      title: 'IssueDetailStore: שלושה resources חדשים',
      blocks: [
        {
          kind: 'p',
          text:
            '`client/src/app/core/state/issue-detail.store.ts` מקבל שלושה `httpResource` חדשים בפרק 19: ' +
            '`attachmentsResource` (מפתח לפי `issueId`), ' +
            '`activityResource` (מפתח לפי `issueId`), ' +
            'ו-`membersResource` (מפתח לפי `projectId` של ה-issue שנטען). ' +
            'כל אחד מחזיר `undefined` כשאין login — אפס בקשות 401 מיותרות.',
        },
        {
          kind: 'p',
          text:
            'שלושה computed ציבוריים: `attachments()`, `activity()`, `memberNames()`. ' +
            'ה-`memberNames` מגיע מ-`membersResource`, שמפתח לפי ה-`projectId` של ה-issue — ' +
            'לכן הוא מחכה שה-issue ייטען קודם, ואז שולח בקשה לחברי הפרויקט. ' +
            'ה-`mentionCandidates` של `MarkdownEditor` מקבל את הרשימה הזו.',
        },
        {
          kind: 'callout',
          tone: 'v22',
          title: 'resource מפתח לפי resource אחר',
          body:
            'ה-`membersResource` קורא `this.issueResource.hasValue() ? this.issueResource.value() : null` — ' +
            'כלומר ה-URL שלו תלוי בתוצאה של resource אחר. ' +
            'זה dependency graph ריאקטיבי: כשה-issue נטען, computed נגרר, ה-URL מוגדר, והבקשה לחברים יוצאת. ' +
            'אין צורך ב-effect, אין צורך ב-BehaviorSubject.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch19',
        file: 'client/src/app/core/state/issue-detail.store.ts',
        region: 'step-19.16',
        diff: true,
        title: 'issue-detail.store.ts — 3 resources חדשים',
      },
    },

    /* ------------------------------------------------------------ 19.19 */
    {
      id: '19.19',
      title: 'Optimistic comment עם Undo',
      blocks: [
        {
          kind: 'p',
          text:
            '`postCommentWithUndo` (באותו store) מוסיף תגובה זמנית עם `id = -Date.now()` ישירות ל-`pending` signal, ' +
            'פותח טיימר של `COMMENT_UNDO_MS = 4000` מילישניות, ורק כשהטיימר פג — שולח POST. ' +
            '`comments()` computed כולל את ה-`pending()` בסוף הרשימה, ' +
            'כך שהתגובה מופיעה מיד בלי קוד מיוחד בתבנית.',
        },
        {
          kind: 'p',
          text:
            '`undoPendingComment` קורא ל-`cancelPending`: מנקה את הטיימר ומסיר את ה-pending — ' +
            'ה-POST לא יצא לעולם. ' +
            'אם ה-POST ייכשל (שרת נכשל, שגיאת רשת), `commitPending` מסיר את ה-pending ו-interceptor ch11 מציג toast.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'id שלילי לתגובה זמנית',
          body:
            'ה-DB תמיד מחזיר IDs חיוביים. id שלילי מוסכם כ"זמני, עדיין לא בשרת" — ' +
            'לא יתנגש ב-IDs אמיתיים, ניתן לסנן אותו בתבנית (`comment.id < 0`), ' +
            'ו-`Date.now()` מבטיח ייחודיות גם אם פותחים כמה תגובות בו-זמנית.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch19',
        file: 'client/src/app/core/state/issue-detail.store.ts',
        region: 'step-19.17',
        diff: true,
        title: 'issue-detail.store.ts — optimistic comment + undo',
      },
    },

    /* ------------------------------------------------------------ 19.20 */
    {
      id: '19.20',
      title: 'addAttachment ו-download בלקוח',
      blocks: [
        {
          kind: 'p',
          text:
            '`addAttachment` ב-`client/src/app/core/state/issue-detail.store.ts` שולח `FormData` עם `Bearer` — ' +
            'ה-auth interceptor (מפרק 11) מצרף את הטוקן לכל בקשה, כולל multipart. ' +
            'הצלחה מרעננת את שני ה-resources הרלוונטיים: `attachmentsResource` ו-`activityResource`.',
        },
        {
          kind: 'p',
          text:
            '`download` שולף blob עם `responseType: \'blob\'`, יוצר `URL.createObjectURL`, לוחץ על קישור זמני, ' +
            'ומשחרר את ה-URL. זה הדפוס הסטנדרטי להורדת קובץ מה-SPA עם Bearer — ' +
            'הדפדפן לא יכול לנווט ישירות ל-API כי אין לו את הטוקן בכתובת.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'URL.revokeObjectURL מיד אחרי הלחיצה',
          body:
            'ה-blob URL פנוי מהזיכרון ברגע ש-`revokeObjectURL` נקרא. ' +
            'הדפדפן כבר "צילם" אותו לפני כן. אם לא קוראים ל-revoke, ' +
            'ה-blob נשאר בזיכרון עד שהדף נסגר — דליפת זיכרון קטנה שמצטברת.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch19',
        file: 'client/src/app/core/state/issue-detail.store.ts',
        region: 'step-19.18',
        diff: true,
        title: 'issue-detail.store.ts — addAttachment + download',
      },
    },

    /* ------------------------------------------------------------ 19.21 */
    {
      id: '19.21',
      title: 'IssueDetail: submit אופטימי ו-upload',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-`client/src/app/features/issues/issue-detail.ts`, `addComment` קורא ל-`submit(commentForm, ...)` ' +
            'ורק אם הטופס תקין — שולח ל-`store.postCommentWithUndo`. ' +
            'ה-form מתאפס מיד (`commentModel.set({ body: \'\' })`) כדי שאפשר להמשיך לכתוב ' +
            'בלי לחכות לשרת.',
        },
        {
          kind: 'p',
          text:
            '`onFileSelected` מאזין ל-`change` על `<input type="file">`, מוציא את `File`, מסמן `uploading = true`, ' +
            'ואחרי ה-`await` מאפס גם את ה-input (`input.value = \'\'`) — ' +
            'כך אפשר לבחור שוב את אותו קובץ.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'ACTIVITY_ICON: record מפתח enum',
          body:
            '`const ACTIVITY_ICON: Record<ActivityType, string>` ב-`issue-detail.ts` ' +
            'ממפה כל סוג פעילות לאייקון: IssueCreated ✚, IssueMoved ↻, CommentAdded 💬, AttachmentAdded 📎. ' +
            'ה-record הוא exhaustive — TypeScript דורש ערך לכל ענף.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch19',
        file: 'client/src/app/features/issues/issue-detail.ts',
        region: 'step-19.20',
        diff: true,
        title: 'issue-detail.ts — addComment optimistic + onFileSelected',
      },
    },

    /* ------------------------------------------------------------ 19.22 */
    {
      id: '19.22',
      title: 'התבנית: תגובות, Undo bar, קבצים, ו-timeline',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-`client/src/app/features/issues/issue-detail.html`, שדה ה-description ו-textarea התגובה ' +
            'הם כעת `<tf-markdown-editor [formField]="...">` עם `[mentionCandidates]="store.memberNames()"`. ' +
            'כל תגובה מציגה `[innerHTML]="commentHtml(comment)"` (ה-rendered Markdown הבטוח). ' +
            'תגובה עם `isPending(comment)` (id שלילי) מקבלת `class.pending` — עמומה ועם גבול מקווקו.',
        },
        {
          kind: 'p',
          text:
            'בר ה-Undo מופיע ב-`@if (store.pendingComment())`: ' +
            '"התגובה נשלחת..." עם כפתור "בטל" שקורא ל-`undoComment()`. ' +
            'העמודה הצדדית (`<aside class="detail-side">`) מציגה קבצים (עם `prettySize`) וציר זמן ' +
            '(`@for (event of store.activity(); ...)` עם `activityIcon(event.type)`).',
        },
        {
          kind: 'callout',
          tone: 'v22',
          title: 'view-transition-name שמאחד board לdetail',
          body:
            '`h2 [style.view-transition-name]="\'issue-\' + issue()!.id"` ב-`issue-detail.html` ' +
            'ממשיך את ה-`view-transition-name` שנוסף ב-ch14 — כותרת ה-issue "עפה" מהלוח למסך הפרטים. ' +
            'ה-`withViewTransitions()` ב-`app.config.ts` הוסף ב-ch10 ועובד כ-progressive enhancement.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch19',
        file: 'client/src/app/features/issues/issue-detail.html',
        region: 'step-19.23',
        diff: true,
        title: 'issue-detail.html — comments + undo bar',
      },
    },

    /* ------------------------------------------------------------ 19.23 */
    {
      id: '19.23',
      title: 'CSS: שתי עמודות וסגנון Markdown',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-`client/src/app/features/issues/issue-detail.scss`, `.detail-grid` הוא grid עם ' +
            '`grid-template-columns: minmax(0, 1fr) minmax(260px, 22rem)`. ' +
            'מתחת ל-860px הכותרת הצדדית מתקפלת לעמודה אחת עם `grid-template-columns: minmax(0, 1fr)`. ' +
            'אימתנו ב-375px: אפס גלילה אופקית, שתי העמודות מסודרות אנכית.',
        },
        {
          kind: 'p',
          text:
            'סגנון `.comment-body` (region `step-19.27`) מכיל כללים ל-`code`, `a`, ו-`.mention` — ' +
            'אותן תגיות שה-renderer מפיק. בלי כללים אלה, `<code>` היה מוצג ב-font רגיל ו-`<a>` ללא צבע.',
        },
        {
          kind: 'term',
          name: 'min-width: 0 בגריד',
          definition:
            'ברירת המחדל של `min-width` לפריט גריד היא `auto`, מה שמאפשר לו לגדול מעבר לגבולות העמודה. ' +
            '`min-width: 0` מבטל זאת — הפריט לא ייגלוש החוצה גם אם יש בו תוכן ארוך (URL ארוך, מחרוזת ארוכה). ' +
            'שם גם `overflow-wrap: anywhere` על `.comment-body` משתתף בהגנה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch19',
        file: 'client/src/app/features/issues/issue-detail.scss',
        region: 'step-19.27',
        diff: true,
        title: 'issue-detail.scss — comment-body + markdown styling',
      },
    },

    /* ------------------------------------------------------------ 19.24 */
    {
      id: '19.24',
      title: 'דמו חי: תגובה עשירה בלי שרת',
      blocks: [
        {
          kind: 'p',
          text:
            'הדמו מציג תיבת תגובה עצמאית: כתיבה / תצוגה מקדימה, autocomplete ל-@mention ' +
            '(Maya Levi / Demo User / Dana Cohen), ופרסום אופטימי עם חלון Undo של כ-2.5 שניות. ' +
            'מתג "שבור את השרת" מסיר את התגובה הזמנית אחרי הטיימר (rollback), ובלעדיו היא "מתאשרת". ' +
            'כל הטיימרים מנוקים ב-`DestroyRef.onDestroy`.',
        },
        {
          kind: 'p',
          text:
            'כדי לבדוק את ה-XSS: הדביקו `<script>alert(1)</script>` בתיבת הטקסט ועברו לתצוגה מקדימה — ' +
            'הטקסט מוצג כטקסט גולמי, לא מבוצע. ' +
            'כדי לבדוק את ה-@mention: הקלידו `@ma` — פופאובר עם "Maya Levi" יופיע, ArrowDown/Enter ייבחרו.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () => import('./demos/rich-comment.demo').then((m) => m.RichCommentDemo),
        caption: 'דמו חי: Markdown בטוח, ‎@mention autocomplete, ופרסום אופטימי עם Undo ו-rollback',
      },
    },

    /* ------------------------------------------------------------ 19.25 */
    {
      id: '19.25',
      title: 'העץ אחרי פרק 19',
      blocks: [
        {
          kind: 'p',
          text:
            'בסוף פרק 19 ה-issue detail הוא מסך עבודה עשיר: Markdown בטוח, @mention, ' +
            'קבצים מצורפים עם BLOB ב-DB, timeline פעילות ברמת ה-issue, ' +
            'ותגובה אופטימית עם Undo של 4 שניות לפני שהשרת מקבל אותה. ' +
            'שני ה-spines שחזרו: derived selectors (store + resources) ו-optimistic UI (כולל rollback).',
        },
        {
          kind: 'p',
          text:
            'Wave 4 כמעט שלמה: ch15 (Modern CSS), ch16 (Cmd-K), ch17 (Kanban DnD), ch18 (Dashboard), ' +
            'ch19 (Rich Issue) עשויים. ' +
            'ch20 (ngrx/signals capstone) יסיים את ה-wave עם ריפקטור מבוקר של store אחד — ' +
            'שנקרא ב-public surface על כל מה שבנינו.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch19',
        title: 'TaskForge אחרי פרק 19 — Markdown, Attachments, Activity Timeline, Undo',
      },
    },
  ],

  quiz: [
    {
      q: 'מה הסדר הנכון ב-renderMarkdown להגנה מפני XSS?',
      options: [
        'מוסיפים תגיות בטוחות קודם, ואז עושים escape',
        'עושים escape לכל הקלט קודם, ורק אחר כך מוסיפים תגיות בטוחות',
        'לא צריך escape — Angular מגן מפני XSS',
        'מסננים תגיות HTML ידנית עם regex',
      ],
      answer: 1,
      explain:
        'escape-first הוא ההגנה כולה. קלט כמו `<script>alert(1)</script>` הופך ל-`&lt;script&gt;...&lt;/script&gt;` ' +
        'לפני כל transform. אם escape היה מגיע אחרי, תגיות שנוצרו על ידי ה-transforms עלולות להישבר, ' +
        'או שקלט זדוני עם תבנית markdown עלול לחמוק מהסינון.',
    },
    {
      q: 'למה `GetMetadataByIssueAsync` משתמשת ב-Select שמשמיט את Bytes?',
      options: [
        'כי EF לא תומך בשדות BLOB',
        'כי בלי הקרנה מפורשת כל השורה — כולל ה-BLOB הכבד — נשלפת לזיכרון, גם כשצריך רק מטא-דאטה',
        'כי Bytes אינו שדה במסד הנתונים',
        'כי Select מהיר מ-Include',
      ],
      answer: 1,
      explain:
        'ללא הקרנה, EF מתרגם ל-SELECT * ומביא את כל עמודות השורה — כולל עמודת BLOB הכבדה. ' +
        'Select מפורשת שמכניסה `Bytes = Array.Empty<byte>()` מייצרת SQL שבוחר רק את השאר. ' +
        'כך רשימת הקבצים זולה גם אם כל קובץ הוא מגה-בייטים.',
    },
    {
      q: 'למה UploadAttachment קורא ל-.DisableAntiforgery()?',
      options: [
        'כי multipart לא עובד עם antiforgery',
        'כי ה-SPA שולח Bearer token בכותרת Authorization, לא קוקי — אין סיכון CSRF, ואין לו מאיפה לקחת antiforgery token',
        'כי antiforgery לא נתמך ב-.NET 10',
        'כי Angular לא תומך ב-antiforgery headers',
      ],
      answer: 1,
      explain:
        'CSRF מנצל את הקוקי שהדפדפן שולח אוטומטית. Bearer token בכותרת Authorization לא נשלח cross-site. ' +
        'ולכן Minimal API שמוגן ב-Bearer לא צריך antiforgery — ו-.DisableAntiforgery() מצהיר על כך.',
    },
    {
      q: 'מה קורה כשמשתמש לוחץ "בטל" (Undo) בתוך חלון הביטול של תגובה אופטימית?',
      options: [
        'התגובה נשלחת ואז נמחקת בשרת',
        'הטיימר מבוטל, התגובה הזמנית מוסרת, והשרת לא מקבל שום POST',
        'נשלחת בקשת DELETE',
        'התגובה נשמרת בלוקל-סטורג',
      ],
      answer: 1,
      explain:
        '`undoPendingComment` קורא ל-`cancelPending` שמנקה את הטיימר ומסיר את ה-pending signal. ' +
        'ה-POST לא יצא לעולם. זה ה-Undo "חינמי": אין שרת, אין DELETE, אין rollback — פשוט ביטול טיימר.',
    },
    {
      q: 'מהו custom FormValueControl המינימלי שMarkdownEditor חייב לספק?',
      options: [
        '`ControlValueAccessor`',
        '`value = model<string>(\'\')`',
        '`@Output() valueChange`',
        '`FormGroup` עם שדה body',
      ],
      answer: 1,
      explain:
        'ב-Signal Forms, `FormValueControl<T>` מחייב `value = model<T>(...)` בלבד. ' +
        'ה-directive `[formField]` מסנכרן בין ה-field tree לבין ה-model. ' +
        'אותו דפוס שהוצג ב-ch14 עם `PriorityPicker<IssuePriority>` — הפעם על `string`.',
    },
    {
      q: 'למה הוספת AttachmentAdded ל-enum ActivityType לא מצריכה מיגרציה?',
      options: [
        'כי enum values מגיעים בנפרד מהסכמה',
        'כי העמודה Type מוגדרת כ-TEXT (HasConversion<string>) — ערך enum חדש הוא מחרוזת חדשה, לא שינוי סכמה',
        'כי EF מגדיר enum כ-INTEGER תמיד',
        'כי ActivityEvent אינו ישות EF',
      ],
      answer: 1,
      explain:
        'כש-enum נשמר כ-TEXT, כל ערך הוא מחרוזת. הוספת ערך enum היא שינוי קוד בלבד — הסכמה לא משתנה. ' +
        'לעומת זאת, enum שנשמר כ-INTEGER מצריך בחינה אם ה-mapping משתנה בהוספת ערך.',
    },
    {
      q: 'מדוע membersResource מפתח לפי projectId של ה-issue שנטען ולא לפי issueId?',
      options: [
        'כי endpoint החברים הוא /api/issues/{id}/members',
        'כי endpoint החברים הוא /api/projects/{projectId}/members — צריך את projectId, שמגיע מה-issue שנטען',
        'כי issueId לא ידוע ב-store',
        'כי כל issues באותו פרויקט שותפים לאותם חברים',
      ],
      answer: 1,
      explain:
        'חברי הפרויקט נמצאים תחת /api/projects/{projectId}/members. ה-projectId מגיע מה-issue שנטען. ' +
        'לכן ה-resource תלוי ב-issueResource — dependency graph ריאקטיבי: issue נטען, computed מחשב projectId, ה-URL מוגדר.',
    },
  ],

  proveIt: [
    {
      title: 'העלאת קובץ ואימות ה-timeline',
      body:
        'התחברו (demo@taskforge.dev / Passw0rd!), פתחו issue, וצרפו קובץ קטן. ' +
        'בדקו שהקובץ מופיע ברשימת הקבצים המצורפים ושאירוע AttachmentAdded מופיע בציר הזמן.',
      command:
        'curl -X POST http://localhost:5080/api/issues/1/attachments ' +
        '-H "Authorization: Bearer <token>" ' +
        '-F "file=@README.md"',
      expect:
        '201 עם AttachmentResponse (id, fileName, sizeBytes, uploadedByName). ' +
        'GET /api/issues/1/activity מחזיר שורה חדשה של AttachmentAdded.',
    },
    {
      title: 'הגנת XSS — הדבקת script בתגובה',
      body:
        'כתבו תגובה שמכילה `<script>alert(1)</script>` וכן `**מודגש**` ו-`@maya`. ' +
        'עברו לתצוגה מקדימה ב-MarkdownEditor.',
      expect:
        'הטקסט `<script>alert(1)</script>` מוצג כטקסט גולמי (escaped), לא מבוצע. ' +
        '`**מודגש**` מוצג ב-bold, ו-`@maya` מוצג בצבע הAccent.',
    },
    {
      title: 'Undo תגובה — השרת לא מקבל POST',
      body:
        'כתבו תגובה ולחצו "פרסם". מיד לחצו "בטל" בבר ה-Undo. ' +
        'רעננו את הדף ובדקו שמספר התגובות לא עלה.',
      expect:
        'בר ה-Undo מופיע עם "התגובה נשלחת...". לחיצה על "בטל" מסירה את התגובה הזמנית. ' +
        'GET /api/issues/{id}/comments מחזיר את אותו מספר תגובות כמו לפני הפרסום.',
    },
    {
      title: 'הורדת קובץ עם Bearer',
      body:
        'לחצו על שם קובץ מצורף בתוך ה-issue detail. ' +
        'ודאו שהקובץ מוריד בשם הנכון (לא blob:// URL שנפתח בטאב חדש).',
      command:
        'curl -o downloaded.md http://localhost:5080/api/attachments/1 ' +
        '-H "Authorization: Bearer <token>"',
      expect:
        'הורדה מתחילה ב-browser. ב-curl — הקובץ נשמר עם תוכן נכון. ' +
        'הסיבה: ה-SPA שולח Bearer ב-Authorization header, ו-`URL.createObjectURL` מאפשר הורדה.',
    },
    {
      title: 'הרשאה: 401 ו-403',
      body:
        'שלחו GET /api/issues/1/activity בלי טוקן. ' +
        'אז שלחו עם טוקן של משתמש שאינו חבר בפרויקט.',
      command: 'curl http://localhost:5080/api/issues/1/activity',
      expect:
        '401 בלי טוקן (Unauthorized). 403 עם טוקן של משתמש שאינו חבר (Forbidden).',
    },
  ],

  exercise: {
    prompt:
      'הוסיפו תמיכה בביטול ה-Undo אוטומטית עם progress bar ויזואלי, ' +
      'ושדרגו את ה-MarkdownEditor כך שיתמוך ב-headers (`# כותרת`) ורשימות (`- פריט`).',
    tasks: [
      'ב-`MarkdownEditor`: הוסיפו ל-`renderMarkdown` תמיכה ב-`# h1`, `## h2` (ל-`<h1>`, `<h2>`) ו-`- item` (ל-`<li>` בתוך `<ul>`). ' +
      'שמרו על סדר escape-first.',
      'ב-`IssueDetailStore`: חשפו computed `undoProgress` שמחשב כמה אחוזים מחלון ה-Undo עברו ' +
      '(מ-0 ל-1 תוך `COMMENT_UNDO_MS` מילישניות). עדכנו אותו ב-`requestAnimationFrame` ונקו בביטול.',
      'בתבנית `issue-detail.html`: הציגו `<progress [value]="store.undoProgress()">` בבר ה-Undo.',
      'ב-`markdown-editor.scss`: הוסיפו כללי תצוגה ל-`h1`, `h2`, ו-`ul li` בתוך `.md-preview`.',
    ],
    acceptance: [
      'הדבקת `# כותרת` בתגובה מוצגת כ-h1 בתצוגה המקדימה, לא כטקסט גולמי.',
      'ה-progress bar בבר ה-Undo ממלא את עצמו מ-0 ל-100% תוך חלון הביטול.',
      'Undo עוצר את ה-requestAnimationFrame — אין ספינר שממשיך אחרי הביטול.',
      '`pnpm gen:manifest`, `pnpm test`, `pnpm verify:coverage`, `pnpm build` עוברים.',
    ],
  },
};
