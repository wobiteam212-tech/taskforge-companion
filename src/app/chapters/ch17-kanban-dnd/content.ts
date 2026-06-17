import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 17 — Kanban Drag-and-Drop.
 * Wave 4, spine piece #2: EntityStore base + reusable optimistic() helper.
 * Backend: double Rank on Issue, PATCH /api/issues/{id}/rank (member-authz,
 * reuses UpdateAsync), gap-based seed, EF migration AddIssueRank.
 * Frontend: kanban-board with CDK DragDrop (pointer) AND a hand-built keyboard
 * DnD path (grab/move/drop + aria-live), optimistic reorder with midpoint ranks.
 * Every fact below was runtime-proven against a two-server smoke before authoring:
 * keyboard reorder persists (issue 2 -> rank 4608, then InProgress rank 60416),
 * pointer onDrop persists (midpoint 10752 / cross-column 2560), break-server ->
 * rollback + toast, 375px collapses to one column, list view paging intact.
 */
export const CH17_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 17.1 */
    {
      id: '17.1',
      title: 'הפרק: גרירה נגישה ולוח Kanban',
      blocks: [
        {
          kind: 'p',
          text:
            'פרק 13 בנה לוח issues כרשימה אחת עם סינון, מיון ודפדוף. פרק 17 מוסיף תצוגה שנייה לאותם נתונים: ' +
            'לוח Kanban עם עמודות לפי סטטוס, שבו גוררים כרטיס מעמודה לעמודה ומסדרים מחדש בתוך עמודה. ' +
            'הגרירה היא אופטימית — הכרטיס זז מיד, והשרת מתעדכן ברקע.',
        },
        {
          kind: 'p',
          text:
            'זה גם spine piece #2 של הארכיטקטורה: EntityStore גנרי לאוסף ישויות, ופונקציית optimistic ' +
            'אחת לשימוש חוזר ("צייר קודם, שאל אחר כך, התחרט אם צריך"). את שניהם נבנה כאן ונשתמש בהם שוב בפרקים הבאים.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה גרירה היא הפרק הקשה בקורס?',
          body:
            'גרירה עם עכבר היא הקלה. הקושי הוא נגישות: משתמש מקלדת חייב יכולת זהה — להרים כרטיס, להזיז אותו, ' +
            'ולהניח — עם הכרזות קוליות שמספרות מה קרה. נבנה את שני הנתיבים, והם יתכנסו לאותה פעולה אחת.',
        },
      ],
      panel: {
        kind: 'filetree',
        title: 'קבצים חדשים ומשתנים בפרק 17',
        lines: [
          { text: 'client/src/app/', depth: 0, kind: 'dir' },
          { text: 'core/state/', depth: 1, kind: 'dir' },
          { text: 'entity-store.ts', depth: 2, kind: 'file', badge: 'new' },
          { text: 'issues.store.ts', depth: 2, kind: 'file', badge: 'mod' },
          { text: 'core/models/issue.model.ts', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'features/issues/', depth: 1, kind: 'dir' },
          { text: 'kanban-board.ts', depth: 2, kind: 'file', badge: 'new' },
          { text: 'kanban-board.html', depth: 2, kind: 'file', badge: 'new' },
          { text: 'kanban-board.scss', depth: 2, kind: 'file', badge: 'new' },
          { text: 'features/projects/', depth: 1, kind: 'dir' },
          { text: 'project-board.ts', depth: 2, kind: 'file', badge: 'mod' },
          { text: 'project-board.html', depth: 2, kind: 'file', badge: 'mod' },
          { text: 'server/', depth: 0, kind: 'dir' },
          { text: 'TaskForge.Core/Entities/Issue.cs', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'TaskForge.Api/Contracts/IssueContracts.cs', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'TaskForge.Api/Endpoints/IssueEndpoints.cs', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'TaskForge.Infrastructure/Repositories/EfIssueRepository.cs', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'TaskForge.Infrastructure/Data/DbSeeder.cs', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'TaskForge.Infrastructure/Migrations/', depth: 1, kind: 'dir' },
          { text: '20260614084811_AddIssueRank.cs', depth: 2, kind: 'file', badge: 'new' },
        ],
        caption: 'הלוח חולק את IssuesStore עם הרשימה — רוב העבודה היא state ונגישות',
      },
    },

    /* ------------------------------------------------------------ 17.2 */
    {
      id: '17.2',
      title: 'מודל הסידור: Rank של double',
      blocks: [
        {
          kind: 'p',
          text:
            'כדי לזכור סדר ידני צריך לשמור אותו איפשהו. הוספנו ל-Issue שדה Rank מסוג double: ערך מספרי ' +
            'שלפיו ממיינים את העמודה. שני issues באותה עמודה ממוינים לפי Rank עולה.',
        },
        {
          kind: 'p',
          text:
            'בחרנו double (ולא מחרוזת LexoRank) בכוונה — הוא פשוט ומלמד את הטריק המרכזי: סידור מחדש הוא ' +
            'שינוי של ערך אחד, לא מספור-מחדש של כל השורות. את המגבלה של double נפגוש בהמשך.',
        },
        {
          kind: 'term',
          name: 'rank ordering',
          definition:
            'שמירת סדר פריטים בעמודת ערך ייעודי במקום במיקום פיזי בטבלה. ' +
            'הזזת פריט = עדכון ה-Rank שלו בלבד; שאר השורות לא נוגעות. ' +
            'מיון לפי Rank מחזיר את הסדר הידני.',
        },
        {
          kind: 'callout',
          tone: 'alt',
          title: 'double מול LexoRank מול מספור-מחדש',
          body:
            'מספור-מחדש (1,2,3…) פשוט לקריאה אבל כל הזזה מעדכנת הרבה שורות. ' +
            'double מעדכן שורה אחת אבל מאבד דיוק אחרי חצאים רבים רצופים. ' +
            'LexoRank (מחרוזות) פותר את הדיוק במחיר מורכבות. כאן double הוא האיזון הנכון לקורס.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch17',
        file: 'server/TaskForge.Core/Entities/Issue.cs',
        region: 'step-17.1',
        diff: true,
        title: 'Issue.cs — שדה Rank',
      },
    },

    /* ------------------------------------------------------------ 17.3 */
    {
      id: '17.3',
      title: 'טריק נקודת האמצע',
      blocks: [
        {
          kind: 'p',
          text:
            'איך מחשבים Rank לכרטיס שמונח בין שני שכנים? לוקחים את הממוצע: ‏rank = (prev + next) / 2. ' +
            'הכרטיס מקבל ערך שנמצא בדיוק ביניהם, ואף שורה אחרת לא משתנה. בקצה העמודה אין שכן אחד, ' +
            'אז למעלה לוקחים next/2 ולמטה prev + מרווח קבוע.',
        },
        {
          kind: 'p',
          text:
            'ה-seed מתחיל עם מרווחים גדולים (1024, 2048, 3072…) דווקא כדי שיהיה מקום "להיכנס באמצע" שוב ושוב ' +
            'בלי להגיע מהר לגבול הדיוק. במהלך פיתוח הפרק ראינו בפועל: הזזת כרטיס בין rank 3072 ל-6144 נתנה 4608, ' +
            'ובין 9216 ל-12288 נתנה 10752 — בדיוק הממוצעים.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה קורה כששני משתמשים מסדרים בו-זמנית?',
          body:
            'שניהם שולחים Rank שחישבו מהשכנים שהם ראו. ה-PATCH האחרון מנצח (last-write-wins) על אותו שדה. ' +
            'בזכות המרווחים הגדולים, גם אם שניהם נכנסו "לאותו חלל", הם מקבלים ערכים שונים ולא מתנגשים בשורה. ' +
            'זו אותה אופטימיות-בו-זמנית שראינו ב-setStatus מפרק 13.',
        },
        {
          kind: 'term',
          name: 'midpoint ranking',
          definition:
            'חישוב מיקום חדש כממוצע של שני השכנים: (prev + next) / 2. ' +
            'מאפשר הכנסה "באמצע" בלי לגעת בשורות אחרות, אך מוגבל בדיוק המספר שבו משתמשים (כאן double).',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch17',
        file: 'client/src/app/features/issues/kanban-board.ts',
        region: 'step-17.13',
        diff: true,
        title: 'kanban-board.ts — midpoint()',
      },
    },

    /* ------------------------------------------------------------ 17.4 */
    {
      id: '17.4',
      title: 'החוזה: ReorderIssueRequest',
      blocks: [
        {
          kind: 'p',
          text:
            'סידור מחדש הוא פעולה ממוקדת: היא משנה רק את העמודה (הסטטוס) ואת ה-Rank. ' +
            'לכן יש לה חוזה מינימלי משלה — ReorderIssueRequest עם Status ו-Rank בלבד, ולא עריכת issue מלאה.',
        },
        {
          kind: 'p',
          text:
            'במקביל הוספנו Rank ל-IssueResponse, כך שהלקוח מקבל את הדירוג של כל issue ויכול למיין את הלוח. ' +
            'הקליינט מחשב את ה-Rank החדש (נקודת האמצע), והשרת לא סומך עליו עיוור: הוא שומר רק ערך סופי, חיובי ובטווח.',
        },
        {
          kind: 'term',
          name: 'targeted command',
          definition:
            'endpoint שעושה דבר אחד צר: כאן PATCH שמשנה סטטוס+Rank בלבד. ' +
            'בניגוד ל-PUT שמחליף את כל ה-issue, פקודה ממוקדת קלה לאבטחה, לתיעוד ולבדיקה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch17',
        file: 'server/TaskForge.Api/Contracts/IssueContracts.cs',
        region: 'step-17.2',
        diff: true,
        title: 'IssueContracts.cs — ReorderIssueRequest',
      },
    },

    /* ------------------------------------------------------------ 17.5 */
    {
      id: '17.5',
      title: 'מיון rank ב-repository',
      blocks: [
        {
          kind: 'p',
          text:
            'GetPagedAsync מפרק 04 כבר תמך במיונים שונים דרך switch. הוספנו ענף "rank": ' +
            'מיון עולה לפי Rank, עם ThenBy(Id) שובר-תיקו ליציבות אם שני issues חולקים אותו ערך. ' +
            'כל שאר המיונים נשארו כפי שהיו — תוספת, לא שינוי.',
        },
        {
          kind: 'p',
          text:
            'תצוגת הלוח מבקשת sort=rank; תצוגת הרשימה ממשיכה עם ברירת המחדל -created. אותו endpoint, ' +
            'אותו repository — רק פרמטר מיון שונה.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'תמיד שוברים תיקו במיון',
          body:
            'מיון לפי שדה שעלול לחזור על עצמו בלי שובר-תיקו נותן סדר לא-יציב בין דפים וקריאות. ' +
            'ThenBy(Id) מבטיח שאותה שאילתה מחזירה תמיד אותו סדר.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch17',
        file: 'server/TaskForge.Infrastructure/Repositories/EfIssueRepository.cs',
        region: 'step-17.3',
        diff: true,
        title: 'EfIssueRepository.cs — מיון rank',
      },
    },

    /* ------------------------------------------------------------ 17.6 */
    {
      id: '17.6',
      title: 'ה-endpoint: PATCH /api/issues/{id}/rank',
      blocks: [
        {
          kind: 'p',
          text:
            'הסידור-מחדש הוא PATCH ל-/api/issues/{id}/rank. הוא משתמש מחדש ב-UpdateAsync(id, apply) מפרק 04 — ' +
            'אין repo method חדש, כי סידור מחדש הוא פשוט שינוי שתי עמודות (Status ו-Rank). ' +
            'לפני השמירה ה-handler דוחה Rank שאינו finite, שאינו חיובי או שיצא מהטווח שהלוח תומך בו. ' +
            'ההרשאה היא מבוססת-משאב: רק חבר בפרויקט יכול לסדר, בדיוק כמו שאר פעולות ה-issue.',
        },
        {
          kind: 'code',
          lang: 'bash',
          title: 'מה שאומת בפועל מול שני שרתים (demo@taskforge.dev)',
          code:
            "# העברת issue 2 לעמודת Done עם rank של נקודת-אמצע\n" +
            "PATCH /api/issues/2/rank   { \"status\": \"Done\", \"rank\": 5000.5 }\n" +
            "  -> 200 OK   status=Done  rank=5000.5\n\n" +
            "# payload פגום לא מזהם את סדר הלוח\n" +
            "PATCH /api/issues/2/rank   { \"status\": \"Done\", \"rank\": -5 }\n" +
            "  -> 400 Bad Request\n\n" +
            "# בלי טוקן — נדחה לפני ה-handler\n" +
            "PATCH /api/issues/2/rank   (ללא Authorization)\n" +
            "  -> 401 Unauthorized",
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'PATCH ולא PUT',
          body:
            'PUT /issues/{id} מצפה ל-issue מלא (כותרת, תיאור, עדיפות). שליחת חצי issue אליו תאבד שדות. ' +
            'הסידור-מחדש נוגע בשני שדות בלבד, ולכן הוא PATCH על endpoint נפרד עם חוזה צר משלו.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch17',
        file: 'server/TaskForge.Api/Endpoints/IssueEndpoints.cs',
        region: 'step-17.4c',
        diff: true,
        title: 'IssueEndpoints.cs — ReorderIssue',
      },
    },

    /* ------------------------------------------------------------ 17.7 */
    {
      id: '17.7',
      title: 'Rank התחלתי: seed ו-issue חדש',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-seed נותן לכל issue קיים Rank עוקב בתוך הפרויקט שלו, עם מרווח של 1024 (1024, 2048, 3072…). ' +
            'זה רץ אחרי SaveChanges כי צריך Ids אמיתיים כדי למיין יציב לפי (Project, Id) לפני שמחלקים ranks.',
        },
        {
          kind: 'p',
          text:
            'issue חדש שנוצר נכנס לתחתית עם Rank = DateTime.UtcNow.Ticks — ערך גדול ומונוטוני, כך ששני issues ' +
            'שנוצרים בזמנים שונים מקבלים ranks שונים בלי תיאום.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה מרווח של 1024 ולא 1?',
          body:
            'מרווח גדול = הרבה "מקום באמצע". בין 1024 ל-2048 אפשר להכניס 1536, ואז 1280, ואז 1152… ' +
            'עשר הכנסות רצופות לפני שמתקרבים לגבול. מרווח של 1 היה נגמר אחרי הכנסה אחת.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch17',
        file: 'server/TaskForge.Infrastructure/Data/DbSeeder.cs',
        region: 'step-17.5',
        diff: true,
        title: 'DbSeeder.cs — ranks התחלתיים',
      },
    },

    /* ------------------------------------------------------------ 17.8 */
    {
      id: '17.8',
      title: 'המיגרציה: AddIssueRank',
      blocks: [
        {
          kind: 'p',
          text:
            'עמודה חדשה ב-DB מחייבת מיגרציה. ‏AddIssueRank מוסיפה עמודת REAL בשם Rank לטבלת Issues עם ' +
            'ברירת מחדל 0.0; ה-Down מסירה אותה. יצרנו אותה עם dotnet ef migrations add והעתקנו אותה לתוך הסנאפשוט.',
        },
        {
          kind: 'p',
          text:
            'לצדה התעדכנו גם `server/TaskForge.Infrastructure/Migrations/20260614084811_AddIssueRank.Designer.cs` ' +
            'ו-`server/TaskForge.Infrastructure/Migrations/TaskForgeDbContextModelSnapshot.cs` — הצילום של המודל ' +
            'שמולו EF יחשב את המיגרציה הבאה. לא נוגעים בהם ביד.',
        },
        {
          kind: 'callout',
          tone: 'dotnet10',
          title: 'ברירת מחדל 0.0 לשורות קיימות',
          body:
            'שורות שכבר קיימות לא יכולות להישאר בלי ערך בעמודה not-null. המיגרציה נותנת להן 0.0, ' +
            'ואז ה-seed (או קוד עדכון) מחלק ranks אמיתיים. בלי ברירת המחדל, ALTER TABLE היה נכשל.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch17',
        file: 'server/TaskForge.Infrastructure/Migrations/20260614084811_AddIssueRank.cs',
        title: 'AddIssueRank.cs',
      },
    },

    /* ------------------------------------------------------------ 17.9 */
    {
      id: '17.9',
      title: 'spine #2: EntityStore גנרי',
      blocks: [
        {
          kind: 'p',
          text:
            'עד עכשיו כל store ניהל אוסף ידנית. EntityStore הוא בסיס גנרי לאוסף ישויות: מפת signal לפי id, ' +
            'עם all (רשימה נגזרת), byId, patch, upsert, remove, ו-snapshot/restore. בלב שלו יושב linkedSignal ' +
            'מפרק 13 — בכל פעם שה-source (תשובת השרת) מתחדש, המפה מתאפסת לאמת החדשה.',
        },
        {
          kind: 'p',
          text:
            'בין תשובות שרת מותר לערוך את המפה מקומית (patch/upsert/remove) — וזה בדיוק מה שעדכון אופטימי צריך. ' +
            'המפתח הוא id, ו-Map שומר על סדר ההכנסה, כך שסדר השרת נשמר.',
        },
        {
          kind: 'term',
          name: 'EntityStore',
          definition:
            'בסיס לאוסף ישויות בזיכרון מעל linkedSignal: מתאפס לאמת-השרת כשהיא מתחדשת, ' +
            'ומאפשר עריכות מקומיות ממוקדות (patch/upsert/remove) בין לבין. ' +
            'spine piece #2 — issues, ובהמשך פרטי issue, יושבים עליו.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch17',
        file: 'client/src/app/core/state/entity-store.ts',
        region: 'step-17.6',
        diff: true,
        title: 'entity-store.ts — EntityStore',
      },
    },

    /* ------------------------------------------------------------ 17.10 */
    {
      id: '17.10',
      title: 'spine #2: הפונקציה optimistic',
      blocks: [
        {
          kind: 'p',
          text:
            'את הדפוס "צייר קודם, שלח, התחרט אם נכשל" כתבנו ביד ב-setStatus בפרק 13. כאן הוצאנו אותו ' +
            'לפונקציה אחת: optimistic(apply, persist, rollback). apply משנה את ה-UI מיד, persist שולח לשרת, ' +
            'וכישלון מפעיל rollback. היא מחזירה true בהצלחה ו-false בכישלון, כדי שהקורא יוכל להגיב.',
        },
        {
          kind: 'p',
          text:
            'ה-toast על שגיאה כבר מוצג ע"י ה-interceptor מפרק 11 — לכן optimistic לא צריכה לדעת על toasts בכלל. ' +
            'היא עוסקת רק במשחק האופטימי עצמו.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'helper אחד, שני קוראים (ומעלה)',
          body:
            'גם setStatus וגם reorder עוברים דרך optimistic. כשהדפוס חוזר ביותר ממקום אחד, חילוץ לפונקציה ' +
            'מבטיח שכולם מתנהגים זהה — אותו rollback, אותו טיפול בכישלון. זה ה-spine בפעולה.',
        },
        {
          kind: 'term',
          name: 'optimistic update',
          definition:
            'דפוס שבו ה-UI מצויר מיד בהנחה שהפעולה תצליח, והבקשה לשרת רצה ברקע. ' +
            'בהצלחה — לא צריך לעשות כלום; בכישלון — rollback מחזיר את המצב הקודם. ' +
            'התוצאה: ממשק שמרגיש מיידי בלי לוותר על נכונות.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch17',
        file: 'client/src/app/core/state/entity-store.ts',
        region: 'step-17.7',
        diff: true,
        title: 'entity-store.ts — optimistic()',
      },
    },

    /* ------------------------------------------------------------ 17.11 */
    {
      id: '17.11',
      title: 'IssuesStore עובר ל-EntityStore',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-linkedSignal הגלוי מפרק 13 התבגר ל-EntityStore פנימי. ה-source שלו הוא items מתשובת השרת, ' +
            'ו-issues() קורא את הרשימה הנגזרת. הנקודה החשובה: המעטפת הציבורית לא השתנתה — issues(), loading, ' +
            'total, setQuery, setStatus כולם זהים. הרכיבים של פרק 13 לא יודעים שמשהו זז מתחתיהם.',
        },
        {
          kind: 'p',
          text:
            'אימתנו את זה בפועל: תצוגת הרשימה ממשיכה לעבוד אחרי ה-refactor, כולל הדפדוף — ‏"Page 1 of 2 — 60 issues" ' +
            'בדיוק כמו קודם. שמירה על מעטפת יציבה היא מה שמאפשר להחליף מימוש בלי לשבור צרכנים.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה לא לשנות את ה-API של ה-store?',
          body:
            'IssueBoard, ProjectBoard ועוד תלויים בחתימה של IssuesStore. שינוי שמות או חתימות היה דורש לגעת ' +
            'בכל אחד מהם. כשמשפרים מימוש פנימי, שומרים על המעטפת — זה כל ההבדל בין refactor לשבירה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch17',
        file: 'client/src/app/core/state/issues.store.ts',
        region: 'step-17.8',
        diff: true,
        title: 'issues.store.ts — entities + issues()',
      },
    },

    /* ------------------------------------------------------------ 17.12 */
    {
      id: '17.12',
      title: 'reorder ב-store',
      blocks: [
        {
          kind: 'p',
          text:
            'reorder הוא הפעולה האופטימית של הלוח. הוא מצלם את המצב, מצייר מיד (patch של status+rank), ושולח ' +
            'PATCH ל-/rank. בכישלון restore מחזיר את הצילום. שמנו לב להבדל מ-setStatus: כאן אין reload בהצלחה — ' +
            'כבר ציירנו את המיקום הסופי וה-rank המקומי תואם לשרת, אז reload רק היה מהבהב את הלוח לחינם.',
        },
        {
          kind: 'p',
          text:
            'בדיקה חיה אישרה את שני המסלולים: הזזה מוצלחת השאירה את הכרטיס במקומו החדש עם ה-rank שחושב, ' +
            'ובמצב "Break the server" הכרטיס קפץ בחזרה והוצג toast עם שגיאת השרת.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'reload מיותר = הבהוב מיותר',
          body:
            'setStatus עושה reload כי סינון/מיון עלולים להוציא את ה-issue מהעמוד. ‏reorder לא — התצוגה ' +
            'כבר נכונה. להעתיק reload לכל פעולה אופטימית הוא דפוס-העתק-הדבק שגורם להבהוב מיותר.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch17',
        file: 'client/src/app/core/state/issues.store.ts',
        region: 'step-17.9',
        diff: true,
        title: 'issues.store.ts — reorder()',
      },
    },

    /* ------------------------------------------------------------ 17.13 */
    {
      id: '17.13',
      title: 'מודל הלקוח: rank על הקו',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-double Rank מהשרת מגיע ללקוח כ-number. הוספנו אותו ל-interface Issue, וגם הרחבנו את IssueSort ' +
            'ב-"rank" כדי שהלוח יוכל לבקש את הסדר הידני. המודל הוא תמיד המראה של חוזה השרת על הקו.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'טיפוסי הקו = החוזה',
          body:
            'כל פעם שהשרת מוסיף שדה לתשובה, המודל בלקוח מתעדכן בו זמנית. כך המהדר תופס אי-התאמות ' +
            'בין מה שהשרת שולח למה שהלקוח מצפה לקבל.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch17',
        file: 'client/src/app/core/models/issue.model.ts',
        region: 'step-17.10',
        diff: true,
        title: 'issue.model.ts — rank ו-IssueSort',
      },
    },

    /* ------------------------------------------------------------ 17.14 */
    {
      id: '17.14',
      title: 'רכיב הלוח: עמודות נגזרות',
      blocks: [
        {
          kind: 'p',
          text:
            'KanbanBoard חולק את אותו IssuesStore עם הרשימה, אבל מבקש ממנו מיון rank, בלי סינון, בעמוד אחד גדול. ' +
            'מתוך issues() הוא גוזר columns: כל עמודה היא ה-issues של אותו סטטוס, ממוינים לפי rank.',
        },
        {
          kind: 'p',
          text:
            'הוא ממיין שוב מקומית למרות שהשרת כבר החזיר ממוין — כי patch אופטימי משנה rank במפה בלי לטעון מחדש, ' +
            'וכך הכרטיס קופץ למיקום הנכון באותו רגע. השרת מגביל pageSize ל-100, ולכן זו תקרת הלוח.',
        },
        {
          kind: 'callout',
          tone: 'v22',
          title: 'computed כמנוע הקיבוץ',
          body:
            'columns הוא computed מעל issues(). כל שינוי ב-issues (כולל patch אופטימי) מחשב מחדש את העמודות ' +
            'אוטומטית. אין סנכרון ידני בין "הנתונים" ל"מה שמצויר" — ה-signal עושה זאת.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch17',
        file: 'client/src/app/features/issues/kanban-board.ts',
        region: 'step-17.12',
        diff: true,
        title: 'kanban-board.ts — columns',
      },
    },

    /* ------------------------------------------------------------ 17.15 */
    {
      id: '17.15',
      title: 'נתיב העכבר: CDK DragDrop',
      blocks: [
        {
          kind: 'p',
          text:
            'הגרירה עם עכבר נשענת על @angular/cdk/drag-drop (שכבר היה בפרויקט מפרק 13). cdkDropListGroup מחבר ' +
            'את העמודות, כל עמודה היא cdkDropList וכל כרטיס cdkDrag. כשמשחררים, CDK קורא ל-onDrop עם עמודת היעד ' +
            'וה-index הסופי.',
        },
        {
          kind: 'p',
          text:
            'onDrop בונה את הרשימה הסופית באותו אופן ש-CDK יצייר אותה — אותה עמודה דרך moveItemInArray, עמודה ' +
            'אחרת דרך filter+splice — ומזה commitMove גוזר rank של נקודת-אמצע ושולח reorder. אימתנו את שני הענפים: ' +
            'הזזה באותה עמודה שמרה rank 10752 (אמצע בין 9216 ל-12288), והזזה בין עמודות שמרה rank 2560 ' +
            '(אמצע בין 1024 ל-4096) עם הסטטוס החדש.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'CDK עושה את הפיקסלים, אתם עושים את הנתונים',
          body:
            'CDK מטפל בשיבוט הצף, ב-placeholder ובאנימציית ההזזה. מה שנשאר לכם הוא תרגום ה-drop לפעולת נתונים: ' +
            'איזה rank, איזו עמודה. ההפרדה הזו היא למה לא כותבים מנוע גרירה ביד.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch17',
        file: 'client/src/app/features/issues/kanban-board.ts',
        region: 'step-17.15',
        diff: true,
        title: 'kanban-board.ts — onDrop',
      },
    },

    /* ------------------------------------------------------------ 17.16 */
    {
      id: '17.16',
      title: 'נתיב המקלדת: הרם, הזז, הנח',
      blocks: [
        {
          kind: 'p',
          text:
            'זו הדרישה הקשה. כל כרטיס פוקוסבילי (tabindex 0, role button) עם מטפל keydown משלו. רווח או Enter ' +
            '"מרים" כרטיס (grabbedId), וכשהוא מורם החיצים מזיזים אותו: מעלה/מטה בעמודה, שמאל/ימין בין עמודות. ' +
            'רווח שוב מניח, ו-Esc מבטל. החיצים פועלים רק על הכרטיס המורם, כדי שלא יתנגשו בניווט רגיל.',
        },
        {
          kind: 'p',
          text:
            'כל הזזה עוברת דרך אותו commitMove כמו העכבר — אותה אופטימיות, אותו rank. בדיקה חיה במקלדת בלבד ' +
            'אישרה: רווח הכריז "הורם", ArrowDown הזיז את הכרטיס מטה והכריז "מיקום 2 מתוך 21" ושמר rank 4608, ' +
            'ArrowLeft העביר אותו לעמודה הסמוכה ושמר status חדש עם rank 60416. אחרי כל הזזה הפוקוס חוזר לכרטיס.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'מעבר עמודה מוחק את ה-DOM — והפוקוס',
          body:
            'כשכרטיס עובר עמודה, Angular מוחק אותו מ-@for אחד ויוצר אותו באחר — והפוקוס הולך לאיבוד. ' +
            'refocusAfterRender מאתר את הכרטיס לפי data-issue-id אחרי ה-render ומחזיר אליו את הפוקוס, ' +
            'כך שאפשר להמשיך להזיז ברצף.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch17',
        file: 'client/src/app/features/issues/kanban-board.ts',
        region: 'step-17.16',
        diff: true,
        title: 'kanban-board.ts — onCardKey + moveByKey',
      },
    },

    /* ------------------------------------------------------------ 17.17 */
    {
      id: '17.17',
      title: 'commitMove ו-aria-live',
      blocks: [
        {
          kind: 'p',
          text:
            'commitMove הוא נקודת המפגש של עכבר ומקלדת: הוא מקבל את הרשימה הסופית, מחשב rank מהשכנים, קורא ל-reorder, ' +
            'ומכריז את התוצאה דרך signal של הכרזה. אם הכרטיס מורם במקלדת, הוא גם מתזמן החזרת פוקוס.',
        },
        {
          kind: 'p',
          text:
            'ההכרזה יושבת באזור aria-live="assertive" עם role="status". קוראי מסך מקריאים כל שינוי שלו — ' +
            'לכן משתמש מקלדת שומע "פתוח, 2 מתוך 21" או "ההעברה נכשלה והוחזרה" בלי לראות את המסך. ' +
            'בכישלון, commitMove גם משחרר את ה-grab.',
        },
        {
          kind: 'term',
          name: 'aria-live region',
          definition:
            'אזור DOM שקורא-מסך מנטר; שינוי בתוכנו מוקרא אוטומטית. ‏assertive קוטע את ההקראה הנוכחית ' +
            '(מתאים לפעולה יזומה כמו הזזה); ‏polite ממתין לסיום. ‏role="status" מסמן אותו כאזור עדכון חי.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch17',
        file: 'client/src/app/features/issues/kanban-board.ts',
        region: 'step-17.14',
        diff: true,
        title: 'kanban-board.ts — commitMove',
      },
    },

    /* ------------------------------------------------------------ 17.18 */
    {
      id: '17.18',
      title: 'התבנית: cdkDropList ו-roledescription',
      blocks: [
        {
          kind: 'p',
          text:
            'התבנית מחברת את הכול: cdkDropListGroup על העמודות, cdkDropList על כל ul, cdkDrag על כל li עם ' +
            'cdkDragData של ה-issue. אותו li הוא גם פוקוסבילי עם (keydown) — שני הנתיבים על אותו אלמנט.',
        },
        {
          kind: 'p',
          text:
            'aria-roledescription מספר לקורא המסך שזה "כרטיס הניתן לגרירה", aria-pressed משקף אם הוא מורם, ' +
            'ו-aria-label נותן כותרת+עמודה. data-issue-id משמש את refocusAfterRender לאיתור הכרטיס אחרי render.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'aria-roledescription בזהירות',
          body:
            'הוא מחליף את שם התפקיד שהקורא מקריא. מצוין כדי לומר "כרטיס הניתן לגרירה" במקום "לחצן", ' +
            'אבל אסור שיסתיר מידע — לכן ההוראות המלאות (חיצים, רווח, Esc) מגיעות בהכרזה, לא ב-label.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch17',
        file: 'client/src/app/features/issues/kanban-board.html',
        region: 'step-17.17',
        diff: true,
        title: 'kanban-board.html',
      },
    },

    /* ------------------------------------------------------------ 17.19 */
    {
      id: '17.19',
      title: 'CSS: עמודות, :has() ו-reduced-motion',
      blocks: [
        {
          kind: 'p',
          text:
            'העמודות הן grid אינטרינזי: repeat(auto-fit, minmax(240px, 1fr)). בלי media query, כשאין מקום הן ' +
            'יורדות לעמודה אחת. אימתנו ב-375px: עמודה אחת ברוחב 307px, שלוש שורות מוערמות, אפס גלילה אופקית.',
        },
        {
          kind: 'p',
          text:
            'המראה של ה-DnD מגיע ממחלקות ש-CDK מוסיפה בזמן ריצה: ‏.cdk-drag-preview (השיבוט הצף), ' +
            '‏.cdk-drag-placeholder (החלל שנשאר) ו-.cdk-drag-animating (המעבר החלק). ‏:has(.cdk-drag-placeholder) ' +
            'מדגיש את עמודת היעד כשגוררים מעליה — בלי שורת JS.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'prefers-reduced-motion הוא חובה בגרירה',
          body:
            'גרירה מלאה בתנועות transform יכולה לגרום בחילה למשתמשים רגישים לתנועה. ' +
            'בלוק @media (prefers-reduced-motion: reduce) מבטל את ה-transition וה-scale על ההרמה. ' +
            'אימתנו שהכלל נשלח ב-CSS המוגש לצד כללי ה-card וה-placeholder.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch17',
        file: 'client/src/app/features/issues/kanban-board.scss',
        region: 'step-17.19',
        diff: true,
        title: 'kanban-board.scss — CDK ו-reduced-motion',
      },
    },

    /* ------------------------------------------------------------ 17.20 */
    {
      id: '17.20',
      title: 'מתג התצוגה: רשימה מול לוח ב-URL',
      blocks: [
        {
          kind: 'p',
          text:
            'התצוגה חיה ב-URL בדיוק כמו המסננים: ?view=kanban מציג את הלוח, וחסרונו מציג את הרשימה (ברירת מחדל, ' +
            'כך שקישורים קיימים לא משתנים). ProjectBoard מקבל view כ-input מהראוטר וגוזר ממנו isKanban, ' +
            'ומצייר תצוגה אחת בלבד בכל רגע. שתיהן חולקות את אותו IssuesStore.',
        },
        {
          kind: 'p',
          text:
            'אימתנו את שני הכיוונים דרך הראוטר האמיתי: לחיצה על "לוח Kanban" הוסיפה ?view=kanban והציגה שלוש עמודות; ' +
            'לחיצה על "רשימה" מחקה את הפרמטר וחזרה לרשימה. ה-aria-current עובר לפריט הפעיל בכל מעבר.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה state של תצוגה ב-URL?',
          body:
            'כי אז רענון, שיתוף קישור וכפתור אחורה "פשוט עובדים". מי ששולח קישור ?view=kanban — הנמען רואה לוח. ' +
            'זה אותו עיקרון שהנחה את המסננים בפרק 13: ה-URL הוא ה-state.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch17',
        file: 'client/src/app/features/projects/project-board.html',
        region: 'step-17.20b',
        diff: true,
        title: 'project-board.html — מתג התצוגה',
      },
    },

    /* ------------------------------------------------------------ 17.21 */
    {
      id: '17.21',
      title: 'דמו חי: סידור אופטימי ו-rollback',
      blocks: [
        {
          kind: 'p',
          text:
            'הדמו הוא מודל הלוח בלי שרת. מקדו כרטיס, רווח כדי להרים, חיצים כדי להזיז (מעלה/מטה בעמודה, ' +
            'שמאל/ימין בין עמודות), רווח כדי להניח — או גררו עם העכבר. כל פעולה נכתבת ב"לוג הפעולות" עם ה-rank שחושב.',
        },
        {
          kind: 'p',
          text:
            'הדליקו "Break the server" ובצעו הזזה: הכרטיס זז מיד (אופטימי), ואחרי רגע ה"שמירה" נכשלת — הכרטיס קופץ ' +
            'בחזרה והלוג רושם "הוחזר". זה בדיוק מה ש-optimistic + rollback עושים באפליקציה האמיתית, ' +
            'רק שכאן ה"שרת" הוא setTimeout. כל הטיימרים מנוקים ב-DestroyRef.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () => import('./demos/kanban.demo').then((m) => m.KanbanDemo),
        caption: 'דמו חי: סידור אופטימי עם rank של נקודת-אמצע, נתיב מקלדת, ומתג שבירת-שרת ל-rollback',
      },
    },

    /* ------------------------------------------------------------ 17.22 */
    {
      id: '17.22',
      title: 'העץ אחרי פרק 17',
      blocks: [
        {
          kind: 'p',
          text:
            'בסוף פרק 17 יש לנו: מודל rank של double עם seed מרווח ומיגרציה, endpoint PATCH ממוקד לסידור-מחדש, ' +
            'EntityStore גנרי ופונקציית optimistic לשימוש חוזר (spine #2), ולוח Kanban עם גרירת עכבר נגישה ' +
            'וגרירת מקלדת מלאה עם הכרזות. אותם נתונים, שתי תצוגות, מתג אחד ב-URL.',
        },
        {
          kind: 'p',
          text:
            'הפרק הבא (ch18) בונה Dashboard עם data-viz: כרטיסי סיכום, feed פעילות ו-SVG charts ידניים מעל ' +
            'selectors נגזרים. ה-EntityStore וה-selectors שבנינו כאן הם הבסיס לחישובים הנגזרים שם.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch17',
        title: 'TaskForge אחרי פרק 17 — rank, reorder, EntityStore, Kanban',
      },
    },
  ],

  quiz: [
    {
      q: 'איך מחשבים Rank לכרטיס שמונח בין שני שכנים?',
      options: [
        'נותנים לו את ה-Rank של השכן העליון',
        'ממוצע השכנים: (prev + next) / 2',
        'מספרים מחדש את כל העמודה',
        'משתמשים ב-DateTime.UtcNow.Ticks',
      ],
      answer: 1,
      explain:
        'נקודת אמצע: rank = (prev + next) / 2 נותן לכרטיס ערך בדיוק בין שכניו, ואף שורה אחרת לא משתנה. ' +
        'בקצה העמודה לוקחים next/2 (למעלה) או prev + מרווח (למטה).',
    },
    {
      q: 'מה החיסרון של Rank מסוג double לעומת LexoRank?',
      options: [
        'הוא איטי יותר למיון ב-DB',
        'הוא לא יכול לייצג סדר כלל',
        'אחרי חצאים רבים רצופים נגמרת הדיוק של double',
        'הוא דורש מיגרציה נפרדת לכל הזזה',
      ],
      answer: 2,
      explain:
        'חלוקה חוזרת בשניים מקטינה את המרווח עד שמגיעים לגבול הדיוק של double (~52 ביט מנטיסה). ' +
        'LexoRank (מחרוזות) פותר זאת במחיר מורכבות; double הוא איזון פשטות-מול-דיוק.',
    },
    {
      q: 'למה reorder לא עושה reload בהצלחה, אבל setStatus כן?',
      options: [
        'כי reorder מהיר יותר',
        'כי ב-reorder כבר ציירנו את המיקום הסופי וה-rank תואם לשרת — reload רק יהבהב',
        'כי setStatus לא אופטימי',
        'כי reload נתמך רק ב-PUT, לא ב-PATCH',
      ],
      answer: 1,
      explain:
        'setStatus עושה reload כי סינון/מיון עלולים להוציא את ה-issue מהעמוד. ב-reorder התצוגה כבר נכונה ' +
        'וה-rank המקומי תואם לשרת, ולכן reload מיותר וגורם הבהוב.',
    },
    {
      q: 'מה תפקיד data-issue-id בכרטיס הלוח?',
      options: [
        'CDK משתמש בו כדי לחבר עמודות',
        'הוא מזהה את הכרטיס ל-refocusAfterRender אחרי שמעבר עמודה מוחק ובונה אותו מחדש',
        'הוא ה-Rank של הכרטיס',
        'הוא נדרש ל-aria-live',
      ],
      answer: 1,
      explain:
        'מעבר עמודה מוחק את הכרטיס מ-@for אחד ויוצר אותו באחר, והפוקוס אובד. refocusAfterRender מאתר אותו ' +
        'לפי data-issue-id אחרי ה-render ומחזיר את הפוקוס — כך אפשר להמשיך להזיז במקלדת.',
    },
    {
      q: 'מה ההבדל בין aria-live="assertive" ל-"polite"?',
      options: [
        'assertive מוקרא רק ב-macOS',
        'assertive קוטע את ההקראה הנוכחית; polite ממתין לסיומה',
        'אין הבדל מעשי',
        'polite מתאים לפעולות יזומות, assertive לרקע',
      ],
      answer: 1,
      explain:
        'assertive קוטע מיד — מתאים לפעולה יזומה כמו הזזת כרטיס, שעליה המשתמש מצפה למשוב מיידי. ' +
        'polite ממתין לסיום ההקראה הנוכחית.',
    },
    {
      q: 'איך נשמרה המעטפת הציבורית של IssuesStore אחרי המעבר ל-EntityStore?',
      options: [
        'שינינו את כל הרכיבים שמשתמשים ב-store',
        'issues(), loading, total, setStatus נשארו זהים; רק המימוש הפנימי השתנה',
        'הוספנו store חדש לגמרי לצד הישן',
        'הסרנו את linkedSignal לחלוטין מהאפליקציה',
      ],
      answer: 1,
      explain:
        'EntityStore עצמו בנוי על linkedSignal, ו-issues() קורא את הרשימה הנגזרת. החתימות הציבוריות לא השתנו, ' +
        'ולכן IssueBoard וחבריו עובדים בלי שינוי — אימתנו שהדפדוף נשמר ("Page 1 of 2 — 60 issues").',
    },
    {
      q: 'למה הסידור-מחדש הוא PATCH ל-/rank ולא PUT ל-/issues/{id}?',
      options: [
        'PATCH מהיר יותר מ-PUT תמיד',
        'כי PUT מצפה ל-issue מלא; שליחת חצי issue אליו תאבד שדות',
        'כי PUT לא תומך בהרשאה מבוססת-משאב',
        'כי PATCH לא דורש אימות',
      ],
      answer: 1,
      explain:
        'PUT /issues/{id} הוא עדכון מלא (כותרת, תיאור, עדיפות, סטטוס). סידור-מחדש נוגע רק ב-Status ו-Rank, ' +
        'ולכן הוא PATCH על endpoint נפרד עם חוזה צר (ReorderIssueRequest) — בלי לסכן את שאר השדות.',
    },
  ],

  proveIt: [
    {
      title: 'גררו כרטיס וסדרו מחדש',
      body:
        'התחברו (demo@taskforge.dev / Passw0rd!), פתחו פרויקט ועברו ל-?view=kanban. גררו כרטיס למיקום אחר ' +
        'באותה עמודה, ואז לעמודה אחרת.',
      expect: 'הכרטיס זז מיד; אחרי רענון הוא נשאר במקום החדש (ה-rank נשמר בשרת).',
    },
    {
      title: 'סדרו מחדש במקלדת בלבד',
      body:
        'בלי עכבר: ‏Tab עד שכרטיס מקבל פוקוס, רווח כדי להרים, ArrowDown/ArrowUp כדי להזיז בעמודה, ' +
        'ArrowLeft/ArrowRight כדי לעבור עמודה, רווח כדי להניח.',
      expect:
        'קורא מסך מכריז "הורם", ואז את המיקום החדש (למשל "פתוח, 2 מתוך 21"); הפוקוס נשאר על הכרטיס.',
    },
    {
      title: 'שברו את השרת וראו rollback',
      body:
        'עצרו את שרת ה-API (או נתקו רשת) ובצעו הזזה בלוח.',
      expect: 'הכרטיס זז לרגע ואז קופץ בחזרה למקומו; toast מציג את שגיאת השרת.',
    },
    {
      title: 'בדקו ב-375px ובהפחתת תנועה',
      body:
        'הצרו את החלון ל-375px; הפעילו prefers-reduced-motion במערכת ההפעלה.',
      expect:
        'העמודות יורדות לעמודה אחת מוערמת בלי גלילה אופקית; ההרמה כבר לא מגדילה/מנפישה את הכרטיס.',
    },
    {
      title: 'בדקו את התמדת ה-rank ב-curl',
      command:
        'curl -X PATCH http://localhost:5080/api/issues/2/rank -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\\"status\\":\\"Done\\",\\"rank\\":5000.5}"',
      body: 'שלחו PATCH ישיר ל-endpoint הסידור-מחדש עם טוקן תקף.',
      expect: '200 OK עם הגוף המעודכן (status=Done, rank=5000.5); בלי טוקן — 401.',
    },
  ],

  exercise: {
    prompt:
      'הוסיפו מגבלת WIP (Work In Progress) לעמודת "בעבודה": לא יותר מ-N כרטיסים. כשהעמודה מלאה, חסמו הזזה ' +
      'אליה (עכבר ומקלדת כאחד) והכריזו על כך בקול.',
    tasks: [
      'הוסיפו קבוע WIP_LIMIT וחישוב computed של "האם עמודת בעבודה מלאה".',
      'ב-commitMove (או לפניו), אם היעד הוא בעבודה והעמודה מלאה — אל תקראו ל-reorder; הכריזו "העמודה מלאה".',
      'ב-onDrop וב-moveByKey כאחד, מנעו את ההעברה כשהיעד חסום, כך ששני הנתיבים מתנהגים זהה.',
      'הוסיפו אינדיקציה ויזואלית לעמודה מלאה (למשל מסגרת אדומה דרך :has() או class מותנה).',
    ],
    acceptance: [
      'גרירת עכבר לעמודה מלאה לא מצליחה והכרטיס נשאר במקומו.',
      'הזזת מקלדת לעמודה מלאה חסומה גם היא, עם הכרזת aria-live.',
      'כשהעמודה לא מלאה, ההזזה עובדת כרגיל ונשמרת בשרת.',
      'אין שגיאות console; ‏375px והפחתת-תנועה נשארים תקינים.',
    ],
  },
};
