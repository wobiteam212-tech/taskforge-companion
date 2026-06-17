import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 24 — Realtime with SignalR: זמן אמת — SignalR.
 * Wave 6. Adds a persistent WebSocket channel alongside the existing REST:
 *   - BoardHub ([Authorize], JoinProject/LeaveProject with IsMemberAsync)
 *   - IBoardNotifier seam + SignalRBoardNotifier (IHubContext<BoardHub>)
 *   - Three event records: IssueChangedEvent, IssueDeletedEvent, CommentAddedEvent (with Origin)
 *   - Program.cs: AddSignalR + AddJsonProtocol, MapHub, OnMessageReceived JWT lift, CORS AllowCredentials
 *   - IssueEndpoints + CommentEndpoints: IBoardNotifier injection + [FromHeader X-Connection-Id]
 *   - Client: @microsoft/signalr 10.0.0, BoardConnection service (signal-driven), HUB_BASE, auth.interceptor X-Connection-Id
 *   - IssuesStore: applyRemoteUpsert/applyRemoteRemove; IssueDetailStore: applyRemoteComment
 *   - ProjectBoard: join/leave lifecycle + live badge
 * Verified runtime: two-client smoke — negotiate returns 200+connectionId with token, 401 without;
 *   IssueChanged broadcast received by both clients, origin == initiator's connectionId;
 *   non-member JoinProject throws HubException; @microsoft/signalr 10.0.0 in client bundle.
 */
export const CH24_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 24.1 */
    {
      id: '24.1',
      title: 'הפרק: זמן אמת עם SignalR',
      blocks: [
        {
          kind: 'p',
          text:
            'עד כה TaskForge עובד במודל pull: הלקוח שולח בקשה, מקבל תשובה, מסיים. ' +
            'אם משתמש אחר יצר issue בפרויקט שלך, תראה אותו רק ברענון הבא. ' +
            'פרק 24 מוסיף transport שני — SignalR — שמחזיק חיבור מתמשך ודוחף שינויים בזמן-אמת.',
        },
        {
          kind: 'p',
          text:
            'חשוב להבין: SignalR הוא תוספת, לא החלפה. ' +
            'ה-REST endpoints ממשיכים לפעול בדיוק כפי שבנינו אותם בפרקים 04–23; ' +
            'SignalR הוא ערוץ הודעות שרץ בצד מה-endpoints. ' +
            'HTTP = הלקוח שואל; SignalR = השרת מספר.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה SignalR ולא polling?',
          body:
            'Polling (בקשה כל N שניות) בזבזנית: שולחת בקשה גם כשאין שינוי, ' +
            'ומחמיצה שינויים בין שתי בקשות. ' +
            'SignalR מחזיק חיבור אחד (WebSocket, ובגיבוי SSE או long-polling) ומשדר רק כשיש שינוי. ' +
            'ב-.NET 10 SignalR הוא חלק מה-shared framework — אפס NuGet חדשות.',
        },
        {
          kind: 'term',
          name: 'SignalR',
          definition:
            'ספריית ASP.NET Core שמפשטת חיבורים דו-כיוונيים בין שרת ללקוח. ' +
            'בוחרת אוטומטית את ה-transport הטוב ביותר הזמין: WebSocket, Server-Sent Events, או long-polling. ' +
            'ב-.NET 10 היא חלק מה-shared framework; ב-Angular: חבילת `@microsoft/signalr`.',
        },
        {
          kind: 'term',
          name: 'hub',
          definition:
            'נקודת הקצה של SignalR בשרת: class שיורש מ-`Hub`. ' +
            'הלקוח מתחבר ל-hub, קורא מתודות בשמן, ומאזין לאירועים שהשרת שולח. ' +
            'ב-TaskForge: `BoardHub` — ה-hub של לוח הפרויקט.',
        },
        {
          kind: 'term',
          name: 'group',
          definition:
            'מנגנון SignalR לשידור ממוקד: חיבורים מצטרפים ל-group בשם; ' +
            '`hub.Clients.Group(name).SendAsync(...)` שולח לכולם בו. ' +
            'ב-TaskForge: כל פרויקט הוא group בשם `project-{id}` — רק צופי הפרויקט מקבלים.',
        },
      ],
      panel: {
        kind: 'filetree',
        title: 'קבצים חדשים ומשתנים בפרק 24',
        lines: [
          { text: 'server/TaskForge.Api/', depth: 0, kind: 'dir' },
          { text: 'Hubs/', depth: 1, kind: 'dir' },
          { text: 'BoardHub.cs', depth: 2, kind: 'file', badge: 'new' },
          { text: 'Realtime/', depth: 1, kind: 'dir' },
          { text: 'BoardEvents.cs', depth: 2, kind: 'file', badge: 'new' },
          { text: 'IBoardNotifier.cs', depth: 2, kind: 'file', badge: 'new' },
          { text: 'SignalRBoardNotifier.cs', depth: 2, kind: 'file', badge: 'new' },
          { text: 'Program.cs', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'Endpoints/', depth: 1, kind: 'dir' },
          { text: 'IssueEndpoints.cs', depth: 2, kind: 'file', badge: 'mod' },
          { text: 'CommentEndpoints.cs', depth: 2, kind: 'file', badge: 'mod' },
          { text: 'client/src/app/', depth: 0, kind: 'dir' },
          { text: 'core/api/api.ts', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'core/realtime/', depth: 1, kind: 'dir' },
          { text: 'board-connection.ts', depth: 2, kind: 'file', badge: 'new' },
          { text: 'core/auth/auth.interceptor.ts', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'core/state/issues.store.ts', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'core/state/issue-detail.store.ts', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'features/projects/project-board.ts', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'features/projects/project-board.html', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'package.json', depth: 1, kind: 'file', badge: 'mod' },
        ],
        caption:
          'ארבעה קבצי C# חדשים + שישה שינויים בצד השרת; קובץ Angular חדש + שישה שינויים בצד הלקוח; ' +
          'תלות אחת חדשה (`@microsoft/signalr`). אפס NuGet חדשות בשרת.',
      },
    },

    /* ------------------------------------------------------------ 24.2 */
    {
      id: '24.2',
      title: '`BoardHub`: ה-hub וניהול groups',
      blocks: [
        {
          kind: 'p',
          text:
            '`BoardHub` הוא ה-hub: class שיורש מ-`Hub`. ' +
            'כל חיבור לקוח שמגיע לכתובת `/hubs/board` מקבל `Context.ConnectionId` ייחודי. ' +
            'הלקוח קורא `JoinProject(projectId)` — הפונקציה נרשמת אוטומטית על ידי SignalR כ-hub method שאפשר להפעיל מה-client.',
        },
        {
          kind: 'p',
          text:
            '`[Authorize]` על ה-class: חיבור ללא טוקן תקף נכשל ב-handshake עצמו — ' +
            'ה-hub לא נגיש בכלל. ' +
            '`JoinProject` מפעיל `IsMemberAsync` — אותה בדיקת הרשאה מבוססת-משאב שכל ה-REST endpoints מפעילים. ' +
            'משתמש שאינו חבר מקבל `HubException` — היחיד מבין החריגות שמגיע ללקוח כהודעה; שאר החריגות מוסתרות.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה `HubException` ייחודי לו לעומת חריגות רגילות ב-hub?',
          body:
            'SignalR מסתיר חריגות לא-מטופלות ב-hub methods מהלקוח (כדי לא לדלוף פרטי מימוש). ' +
            'היוצא מן הכלל: `HubException` — הוא מועבר ללקוח עם ה-Message שלו. ' +
            'כך אפשר לדחות `JoinProject` עם הסבר ("You are not a member") בלי לחשוף stack trace.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '`ProjectGroup` — מפתח group סטטי',
          body:
            '`public static string ProjectGroup(int projectId) => $"project-{projectId}"` ' +
            'חי ב-`BoardHub` ומשמש גם ב-`SignalRBoardNotifier` — מקור-אמת אחד לשם ה-group. ' +
            'זה מונע טעויות כמו `"projects-1"` בצד הזה ו-`"project-1"` בצד האחר.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch24',
        file: 'server/TaskForge.Api/Hubs/BoardHub.cs',
        region: 'step-24.2',
        diff: true,
        title: 'BoardHub.cs — [Authorize] + JoinProject/LeaveProject עם IsMemberAsync',
      },
    },

    /* ------------------------------------------------------------ 24.3 */
    {
      id: '24.3',
      title: 'שלושת event records ו-`Origin`',
      blocks: [
        {
          kind: 'p',
          text:
            'שלושה records מתארים את מטען האירועים שהשרת שולח: ' +
            '`IssueChangedEvent` (issue נוצר, עודכן, או הוזז — נושא את ה-`IssueResponse` המלא), ' +
            '`IssueDeletedEvent` (issue נמחק — רק ה-id), ' +
            '`CommentAddedEvent` (תגובה חדשה — `issueId` + `CommentResponse`). ' +
            'הלקוח מאזין לאירועים בשמות אלה: `connection.on("IssueChanged", ...)` וכן הלאה.',
        },
        {
          kind: 'p',
          text:
            'כל record נושא `Origin: string?` — ה-`connectionId` של הלקוח שיזם את הכתיבה. ' +
            'זהו שדה קריטי: השרת משדר לכל ה-group, כולל ליוזם עצמו. ' +
            'בלי `Origin`, היוזם היה מקבל "הד" ומחיל שינוי שכבר החיל אופטימית — ' +
            'מצב שיכול ליצור כפילויות או לאפס rollback.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מדוע ה-`origin` עובר בגוף האירוע ולא בכותרת נפרדת?',
          body:
            'SignalR שולח הודעות (messages), לא בקשות HTTP — אין כותרות. ' +
            'כל מטא-דאטה שנחוצה ללקוח חייבת לעבור בגוף המסר. ' +
            '`Origin` הוא חלק מה-payload של האירוע, ומספיק: הלקוח משווה אותו ל-`connectionId` שלו עצמו.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch24',
        file: 'server/TaskForge.Api/Realtime/BoardEvents.cs',
        region: 'step-24.3',
        diff: true,
        title: 'BoardEvents.cs — שלושת event records עם Origin לסינון הד עצמי',
      },
    },

    /* ------------------------------------------------------------ 24.4 */
    {
      id: '24.4',
      title: '`IBoardNotifier`: ה-seam של ה-realtime',
      blocks: [
        {
          kind: 'p',
          text:
            'כמו `IProjectRepository` ו-`IIssueRepository` מפרק 04, `IBoardNotifier` הוא seam: ' +
            'ה-handlers ב-`IssueEndpoints` ו-`CommentEndpoints` תלויים בממשק, לא ב-SignalR. ' +
            'כך הדומיין לא יודע על transport — DIP (Dependency Inversion Principle).',
        },
        {
          kind: 'p',
          text:
            'שלוש מתודות, אחת לכל אירוע: ' +
            '`IssueChangedAsync`, `IssueDeletedAsync`, `CommentAddedAsync`. ' +
            'כולן מקבלות `projectId` (לאיתור ה-group), `origin` (ה-connectionId של היוזם), ' +
            'ו-`CancellationToken` — דפוס עקבי עם שאר ה-async API.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה `IBoardNotifier` חי ב-Api ולא ב-Core?',
          body:
            'הממשק מקבל `IssueResponse` ו-`CommentResponse` — טיפוסי ה-contracts של ה-Api. ' +
            'ה-Core לא מכיר אותם (הוא מכיר entities, לא DTOs). ' +
            'לכן `IBoardNotifier` שייך ל-`TaskForge.Api`, לא ל-`TaskForge.Core` — ' +
            'הוא seam ברמת ה-Api layer, בדיוק כמו שה-handler filters חיים שם.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch24',
        file: 'server/TaskForge.Api/Realtime/IBoardNotifier.cs',
        region: 'step-24.3b',
        diff: true,
        title: 'IBoardNotifier.cs — ה-seam: handlers תלויים בממשק, לא ב-SignalR',
      },
    },

    /* ------------------------------------------------------------ 24.5 */
    {
      id: '24.5',
      title: '`SignalRBoardNotifier`: מימוש ה-seam',
      blocks: [
        {
          kind: 'p',
          text:
            '`SignalRBoardNotifier` מממש `IBoardNotifier` על ידי עטיפת `IHubContext<BoardHub>`. ' +
            '`IHubContext` הוא singleton חסר-state שמאפשר לשלוח הודעות מחוץ ל-hub עצמו — ' +
            'מהendpoints, מ-background services, מכל מקום. ' +
            'כך ה-endpoint לא צריך להיות ה-hub, והוא ממשיך לפעול כ-Minimal API נקי.',
        },
        {
          kind: 'p',
          text:
            'כל מתודה קוראת `hub.Clients.Group(BoardHub.ProjectGroup(projectId)).SendAsync(eventName, payload, ct)`. ' +
            'שם האירוע חייב להתאים בדיוק למה שהלקוח מאזין לו (`"IssueChanged"`, `"IssueDeleted"`, `"CommentAdded"`). ' +
            '`SendAsync` מחזיר `Task` — await פשוט, ה-handler ממתין לסיום השידור לפני שהוא מחזיר תשובה ללקוח.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'שם אירוע שגוי: הלקוח לא יקבל כלום',
          body:
            'SignalR אינו זורק שגיאה אם הלקוח לא מאזין לשם מסוים — הודעה שנשלחת לשם לא-קיים פשוט מתעלמת. ' +
            'אם השרת שולח `"issuechanged"` (lowercase) וה-JS מאזין ל-`"IssueChanged"`, לא יקרה כלום. ' +
            'השמות רגישי-רישיות. `AddJsonProtocol` עם camelCase ב-`PropertyNamingPolicy` לא משנה את שמות האירועים — ' +
            'רק את שמות השדות ב-payload.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch24',
        file: 'server/TaskForge.Api/Realtime/SignalRBoardNotifier.cs',
        region: 'step-24.4',
        diff: true,
        title: 'SignalRBoardNotifier.cs — IHubContext עוטף ומשדר לכל group',
      },
    },

    /* ------------------------------------------------------------ 24.6 */
    {
      id: '24.6',
      title: '`AddSignalR` + `AddJsonProtocol` + רישום ה-singleton',
      blocks: [
        {
          kind: 'p',
          text:
            '`builder.Services.AddSignalR()` מוסיף את SignalR לכל שירותיו. ' +
            'החיבור הקריטי: `.AddJsonProtocol(options => ...)` שמגדיר את ה-serializer — ' +
            '`CamelCase` + `JsonStringEnumConverter`. ' +
            'בלי זה, ה-payload מהשרת היה שולח `Status: 0` (int) במקום `status: "Open"` (string), ' +
            'ו-issue שמגיע דרך SignalR היה נראה שונה מ-issue שמגיע דרך `httpResource`.',
        },
        {
          kind: 'p',
          text:
            'את ה-seam עצמו רושמים למעלה, בקטע רישום השירותים (ליד ה-repositories): ' +
            '`builder.Services.AddSingleton<IBoardNotifier, SignalRBoardNotifier>()`. ' +
            'Singleton (לא Scoped) כי `IHubContext<BoardHub>` עצמו הוא singleton — ' +
            'אין per-request state, ואפשר לשתף אותו בבטחה בין בקשות.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מדוע `IBoardNotifier` נרשם כ-Singleton ולא כ-Scoped?',
          body:
            '`SignalRBoardNotifier` עוטף `IHubContext<BoardHub>` — singleton חסר-state שרושם connections לפי `connectionId`. ' +
            'כל מה שהוא עושה הוא לשלוח הודעה ל-group; אין state per-request. ' +
            'Singleton פשוט ועקבי. Scoped גם היה עובד, אבל ייצור instance חדש לכל בקשה — בזבוז.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch24',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-24.5',
        diff: true,
        title: 'Program.cs — AddSignalR + AddJsonProtocol (camelCase + enum)',
      },
    },

    /* ------------------------------------------------------------ 24.7 */
    {
      id: '24.7',
      title: '`MapHub` + CORS `AllowCredentials`',
      blocks: [
        {
          kind: 'p',
          text:
            '`app.MapHub<BoardHub>("/hubs/board")` רושם את ה-hub בנתיב. ' +
            'הלקוח מתחבר ל-`http://localhost:5080/hubs/board`. ' +
            'בשרת הזה בוצעה בדיקה ממשית: negotiate ב-`POST /hubs/board/negotiate?negotiateVersion=1` ' +
            'ללא טוקן מחזיר 401; עם `?access_token=<jwt>` מחזיר 200 עם `connectionId` ורשימת transports.',
        },
        {
          kind: 'p',
          text:
            'CORS: הוספנו `.AllowCredentials()` ל-policy. ' +
            'SignalR עם אימות (החיבור נושא זהות) זקוק לכך. ' +
            'חשוב: `.AllowCredentials()` אסור יחד עם `.AllowAnyOrigin()` — ' +
            'ASP.NET Core זורק בעלייה. כאן יש לנו `.WithOrigins("http://localhost:4500")` מפורש (מפרק 11), ' +
            'ולכן זה חוקי.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: '`AllowCredentials` + `AllowAnyOrigin` — crash בעלייה',
          body:
            'פרק 11 לימד שCORS הוא הצהרת אמון. `.AllowCredentials()` מרחיב אותה לחיבורים עם credentials ' +
            '(cookies, authorization headers, WebSocket tokens). ' +
            'אם היינו כותבים `.AllowAnyOrigin().AllowCredentials()`, ' +
            'ASP.NET Core היה זורק `InvalidOperationException` ב-startup: ' +
            '"The CORS protocol does not allow specifying a wildcard origin with credentials." ' +
            'origin מפורש בלבד.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch24',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-24.5b',
        diff: true,
        title: 'Program.cs — MapHub /hubs/board + AllowCredentials ב-CORS',
      },
    },

    /* ------------------------------------------------------------ 24.8 */
    {
      id: '24.8',
      title: 'JWT מעל WebSocket: `OnMessageReceived`',
      blocks: [
        {
          kind: 'p',
          text:
            'WebSocket הוא פרוטוקול TCP — הדפדפן לא יכול לצרף כותרת `Authorization` ל-WebSocket handshake. ' +
            'SignalR פותר זאת בצד הלקוח: `accessTokenFactory` מחזיר את הטוקן, ' +
            'והספרייה שולחת אותו ב-query string: `?access_token=<jwt>`. ' +
            'בצד השרת, `OnMessageReceived` צריך "להרים" אותו משם.',
        },
        {
          kind: 'p',
          text:
            'ב-`Program.cs`: `options.Events = new JwtBearerEvents { OnMessageReceived = context => { ... } }`. ' +
            'הלוגיקה: אם `access_token` קיים ב-query string *וגם* הנתיב מתחיל ב-`/hubs` — ' +
            'מעבירים אותו ל-`context.Token`. ' +
            'הסנן `path.StartsWithSegments("/hubs")` חיוני: לא רוצים לקבל טוקן מ-query string על ה-REST endpoints.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מדוע הדפדפן לא יכול לשלוח `Authorization` ב-WebSocket?',
          body:
            'ה-WebSocket API של הדפדפן (ב-JavaScript) אינו מאפשר הגדרת כותרות על ה-handshake. ' +
            'בקשת ה-upgrade נשלחת עם הכותרות הסטנדרטיות של הדפדפן בלבד. ' +
            'הפתרון הנפוץ: העברת הטוקן ב-query string — וזה בדיוק מה ש-`accessTokenFactory` של `@microsoft/signalr` עושה. ' +
            '`OnMessageReceived` בשרת מרים אותו ממנו, ורק לנתיבי ה-hub.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch24',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-24.6',
        diff: true,
        title: 'Program.cs — OnMessageReceived: JWT מ-query string לנתיבי /hubs בלבד',
      },
    },

    /* ------------------------------------------------------------ 24.9 */
    {
      id: '24.9',
      title: 'שידור מ-`IssueEndpoints`: `IBoardNotifier` + `X-Connection-Id`',
      blocks: [
        {
          kind: 'p',
          text:
            'כל handler של כתיבה ב-`IssueEndpoints` קיבל שני פרמטרים חדשים: ' +
            '`IBoardNotifier notifier` (מוזרק מ-DI) ' +
            'ו-`[FromHeader(Name = "X-Connection-Id")] string? connectionId`. ' +
            'ה-`connectionId` הוא הזהות של מי שיזם את הבקשה — הלקוח שולח אותו בכותרת (ראו צד הלקוח, שלב 24.12).',
        },
        {
          kind: 'p',
          text:
            'אחרי כל כתיבה מוצלחת, קריאה אחת: `notifier.IssueChangedAsync(projectId, connectionId, response, ct)`. ' +
            'הרצף: אימות חברות, כתיבה ל-DB, פינוי stats-cache מפרק 23, שידור לgroup — ' +
            'כולם ב-handler אחד, שורות ברצף, ללא סיבוך.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה שידור ה-cache eviction ושידור SignalR באותו handler?',
          body:
            'שניהם נגזרות של אותה כתיבה — ה-"side effects" שמגיעים אחרי `issues.AddAsync`. ' +
            'פרק 23 לימד eviction; פרק 24 מוסיף broadcast. ' +
            'שניהם קוראים ל-seam ממשק (`IOutputCacheStore`, `IBoardNotifier`) — ' +
            'ה-handler נשאר פשוט; הסיבוך חי מאחורי ה-seam. ' +
            'זו הדגמה מצוינת של למה בנינו seams: מוסיפים side effect מבלי לשכתב את הדומיין.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch24',
        file: 'server/TaskForge.Api/Endpoints/IssueEndpoints.cs',
        region: 'step-24.8',
        diff: true,
        title: 'IssueEndpoints.cs — IBoardNotifier + [FromHeader X-Connection-Id] ב-CreateIssue',
      },
    },

    /* ------------------------------------------------------------ 24.10 */
    {
      id: '24.10',
      title: 'שידורים לכל פעולות ה-issue ול-`AddComment`',
      blocks: [
        {
          kind: 'p',
          text:
            'ארבע פעולות ב-`IssueEndpoints` משדרות: ' +
            '`CreateIssue` שולח `IssueChangedAsync` עם ה-issue החדש (201); ' +
            '`UpdateIssue` שולח `IssueChangedAsync` אחרי עדכון; ' +
            '`ReorderIssue` שולח `IssueChangedAsync` עם המיקום החדש (ה-"event הכי חי בלוח"); ' +
            '`DeleteIssue` שולח `IssueDeletedAsync` עם ה-id בלבד.',
        },
        {
          kind: 'p',
          text:
            'ב-`CommentEndpoints`: `AddComment` מקבל גם הוא `IBoardNotifier` ו-`connectionId`, ' +
            'ואחרי שמירה קורא `notifier.CommentAddedAsync(issue.ProjectId, connectionId, issueId, response, ct)`. ' +
            'מי שפתוח על ה-issue detail של אותו issue יראה את התגובה מיד.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'נקודות ה-broadcast הן בדיוק נקודות ה-cache eviction',
          body:
            'שים לב: כל handler שקורא ל-`EvictStatsAsync` (מפרק 23) קורא גם ל-`notifier`. ' +
            'זה לא מקרה — שניהם תלויים ב-"משהו השתנה ב-issue". ' +
            'נקודות הכתיבה מפרק 23 הפכו לנקודות השידור של פרק 24. ' +
            'ה-seams השתלמו שוב.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch24',
        file: 'server/TaskForge.Api/Endpoints/IssueEndpoints.cs',
        region: 'step-24.8b',
        diff: true,
        title: 'IssueEndpoints.cs — IssueChangedAsync אחרי CreateIssue',
      },
    },

    /* ------------------------------------------------------------ 24.11 */
    {
      id: '24.11',
      title: 'שידור update, reorder, delete ו-`AddComment`',
      blocks: [
        {
          kind: 'p',
          text:
            '`UpdateIssue` ו-`ReorderIssue` שולחים `IssueChangedAsync` — אותו אירוע כמו create. ' +
            'הלקוח מבצע `upsertEntity` בכל המקרים: אם ה-issue כבר קיים ב-store, הוא מתעדכן במקום; ' +
            'אם הוא חדש (edge case: חבר חדש שמצטרף לgroup), הוא מתווסף. ' +
            '`DeleteIssue` שולח `IssueDeletedAsync` עם id בלבד — אין צורך ב-payload מלא.',
        },
        {
          kind: 'p',
          text:
            '`AddComment` ב-`CommentEndpoints` מסיים את מעגל השידורים: ' +
            'תגובה חדשה משודרת ל-group של הפרויקט עם `issueId` ו-`CommentResponse`. ' +
            'הלקוח שפתוח על אותו issue יקרא `commentsResource.reload()` — ' +
            'refetch קטן וזול, עקבי עם ה-`pendingComment` האופטימי מפרק 19.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch24',
        file: 'server/TaskForge.Api/Endpoints/CommentEndpoints.cs',
        region: 'step-24.9',
        diff: true,
        title: 'CommentEndpoints.cs — IBoardNotifier + [FromHeader X-Connection-Id] ב-AddComment',
      },
    },

    /* ------------------------------------------------------------ 24.12 */
    {
      id: '24.12',
      title: 'הלקוח: `@microsoft/signalr` ו-`HUB_BASE`',
      blocks: [
        {
          kind: 'p',
          text:
            'תלות אחת חדשה ב-`package.json`: `"@microsoft/signalr": "^10.0.0"`. ' +
            'הגרסה 10.0.0 מתאימה לשרת .NET 10 — protocol versions חייבים להתאים. ' +
            'הספרייה היא framework-agnostic (plain TypeScript) ועובדת ב-Angular zoneless: ' +
            'ה-callbacks כותבים ל-signals, ו-Angular מזהה שינוי לפי signal graph — אין צורך ב-`NgZone`.',
        },
        {
          kind: 'p',
          text:
            'ב-`api.ts`: קבוע חדש `HUB_BASE = "http://localhost:5080/hubs"`. ' +
            'כמו `API_BASE` לREST, `HUB_BASE` הוא מקור-אמת אחד לכתובת ה-hub. ' +
            'ה-hub חי תחת `/hubs`, לא תחת `/api` — לכן קבוע נפרד.',
        },
        {
          kind: 'callout',
          tone: 'v22',
          title: '`@microsoft/signalr` ב-Angular zoneless',
          body:
            'ב-Angular עם NgZone, ה-callbacks של SignalR היו צריכים `NgZone.run(...)` כדי להפעיל change detection. ' +
            'ב-Angular v22 zoneless, change detection מבוסס על signals — אין NgZone. ' +
            'ה-callback פשוט כותב ל-signal, Angular מזהה אוטומטית. ' +
            'זו אחת מהתועלות המעשיות של המעבר ל-zoneless: ספריות חיצוניות עובדות בלי wrappers.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch24',
        file: 'client/src/app/core/api/api.ts',
        region: 'step-24.10',
        diff: true,
        title: 'api.ts — HUB_BASE: מקור-אמת לכתובת ה-hub',
      },
    },

    /* ------------------------------------------------------------ 24.13 */
    {
      id: '24.13',
      title: '`package.json`: `@microsoft/signalr` 10.0.0',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-`package.json` של הלקוח מציג את התלות החדשה. ' +
            '`@microsoft/signalr` נטען ב-eager (לא ב-`@defer`) כי `BoardConnection` מוזרק ב-`authInterceptor`, ' +
            'שעצמו נרשם ב-`app.config.ts` — ולכן הוא חלק מה-main bundle. ' +
            'בדיקה ממשית: הספרייה גדלה את ה-main bundle לכ-428 kB raw (~112 kB transfer).',
        },
        {
          kind: 'callout',
          tone: 'alt',
          title: 'שיקול: האם `BoardConnection` יכול להיות lazy?',
          body:
            'כן, עם `@defer` על ה-board בלבד וinjection ב-component ולא ב-interceptor. ' +
            'אך אז ה-interceptor לא יוכל לצרף `X-Connection-Id` עד שהcomponent נטען — ' +
            'כתיבה לפני טעינת הboard תשלח בקשה בלי header, והשרת ישדר בלי origin. ' +
            'עיכוב ה-main bundle בכ-112 kB transfer הוא trade-off מדוד שמפשט את הארכיטקטורה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch24',
        file: 'client/package.json',
        title: 'package.json — @microsoft/signalr 10.0.0',
      },
    },

    /* ------------------------------------------------------------ 24.14 */
    {
      id: '24.14',
      title: '`BoardConnection`: שירות ה-realtime',
      blocks: [
        {
          kind: 'p',
          text:
            '`BoardConnection` הוא `@Injectable({ providedIn: "root" })` — singleton. ' +
            'הוא מנהל חיבור `HubConnection` אחד, שנוצר ב-`start()` עם `HubConnectionBuilder`. ' +
            'ה-`accessTokenFactory` מחזיר `tokenStore.accessToken()` — תמיד הטוקן הטרי, נקרא גם בreconnect.',
        },
        {
          kind: 'p',
          text:
            'שלושה `connection.on(...)` רושמים מאזינים לשמות האירועים שהשרת שולח. ' +
            'כל אחד בודק `isSelf(e.origin)` — אם ה-origin שווה ל-`connectionId` הנוכחי, מדלגים. ' +
            'אחרת: קוראים ל-`issues.applyRemoteUpsert(e.issue)`, `issues.applyRemoteRemove(e.issueId)`, ' +
            'או `detail.applyRemoteComment(e.issueId)`.',
        },
        {
          kind: 'p',
          text:
            'האפקט בconstructor: `if (tokenStore.isLoggedIn()) void start()` / `else void stop()`. ' +
            'כלומר: יש login, יש חיבור חי; יצאת, החיבור סוגר. ' +
            'עקבי עם ה-stores של פרקים 17/20 שמנקים state ב-logout.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה `withAutomaticReconnect` עושה ומה הוא לא עושה?',
          body:
            '`withAutomaticReconnect` מנהל ניסיונות חיבור מחדש אוטומטיים בעת נפילה זמנית (ברשת, timeout). ' +
            'ברירת המחדל: ניסיון אחרי 0, 2, 10, 30 שניות. ' +
            'מה שהוא לא עושה: שמירת אירועים שנשלחו בזמן הניתוק — הם אבדו. ' +
            'לכן ב-`onreconnected`: מצטרפים מחדש ל-group *וגם* קוראים `issues.reload()` — realtime הוא best-effort, reconcile על reconnect.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch24',
        file: 'client/src/app/core/realtime/board-connection.ts',
        region: 'step-24.11',
        diff: true,
        title: 'board-connection.ts — HubConnectionBuilder + אחד לכל signal event + reconnect reconcile',
      },
    },

    /* ------------------------------------------------------------ 24.15 */
    {
      id: '24.15',
      title: '`authInterceptor`: הוספת `X-Connection-Id`',
      blocks: [
        {
          kind: 'p',
          text:
            'פרק 11 בנה את `authInterceptor` — "מתרגם יחיד" שמצרף `Authorization: Bearer` לכל בקשת API. ' +
            'פרק 24 מלמד אותו ניב שני: הוא מזריק גם את `BoardConnection` ומצרף `X-Connection-Id` לכל בקשת API. ' +
            '(השרת קורא את הכותרת רק ב-handlers של כתיבה; ב-GET היא פשוט נושאת מטען ולא משפיעה.) ' +
            'ה-interceptor כבר רץ על כל בקשה — אין צורך לגעת בשום component.',
        },
        {
          kind: 'p',
          text:
            'הלוגיקה: `const connectionId = inject(BoardConnection).connectionId()`. ' +
            'אם `connectionId` קיים, מוסיפים `"X-Connection-Id": connectionId` ל-`setHeaders`. ' +
            'השרת קורא את הכותרת הזו ב-`[FromHeader(Name = "X-Connection-Id")]` בכל handler כתיבה, ' +
            'ומעביר אותה כ-`origin` לשידור.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'מדוע `connectionId` מגיע ב-HTTP header ולא ב-WebSocket?',
          body:
            'ה-REST HTTP request הוא transport בפני עצמו — אין קשר ישיר בין ה-WebSocket לבין ה-REST connection. ' +
            'השרת לא יכול "לדעת" מי שלח את ה-HTTP request מתוך ה-WebSocket. ' +
            'הפתרון: הלקוח שולח את ה-`connectionId` שלו ב-header על כל בקשת HTTP — ' +
            'השרת מקשר בין שני העולמות: REST request + SignalR origin.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch24',
        file: 'client/src/app/core/auth/auth.interceptor.ts',
        region: 'step-24.12',
        diff: true,
        title: 'auth.interceptor.ts — X-Connection-Id: connectionId על כל בקשת API',
      },
    },

    /* ------------------------------------------------------------ 24.16 */
    {
      id: '24.16',
      title: '`IssuesStore`: `applyRemoteUpsert` ו-`applyRemoteRemove`',
      blocks: [
        {
          kind: 'p',
          text:
            'פרק 20 ממפה את `IssuesStore` ל-`@ngrx/signals` (עם `withEntities`, `upsertEntity`, `removeEntity`). ' +
            'ה-public surface נשמר — `project-board` ו-`kanban-board` לא נגעו. ' +
            'פרק 24 מוסיף שני methods: `applyRemoteUpsert(issue)` ו-`applyRemoteRemove(id)`. ' +
            'שניהם קוראים ל-`patchState` — אותו מנגנון של ה-optimistic update, רק שהמקור הוא דחיפת שרת.',
        },
        {
          kind: 'p',
          text:
            '`upsertEntity(issue)`: אם issue עם ה-id הזה קיים ב-store — מעדכן; אחרת מוסיף. ' +
            'כך כרטיס שהוזז לעמודה אחרת "זז" בלוח ב-Angular B בלי refetch. ' +
            '`removeEntity(id)`: מסיר issue שנמחק. ' +
            'שום HTTP — הדחיפה כבר נשאה את ה-issue המלא.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ה-seam שמשלים את הlayer? (`applyRemoteUpsert` כ-public method)',
          body:
            'פרקים 17 ו-20 לימדו שה-store חושף public surface (selectors + commands) ומסתיר מימוש. ' +
            '`applyRemoteUpsert` הוא command חדש — הוא לא שובר את החוזה כי הוא מוסיף יכולת, לא מגדיר מחדש קיימת. ' +
            '`BoardConnection` קורא אותו; ה-board ו-kanban לא יודעים על SignalR כלל. ' +
            'הפרדה ברורה: transport layer (`BoardConnection`) תלוי ב-store surface; components תלויים רק ב-selectors.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch24',
        file: 'client/src/app/core/state/issues.store.ts',
        region: 'step-24.13',
        diff: true,
        title: 'issues.store.ts — applyRemoteUpsert + applyRemoteRemove: אותו store, מקור חדש',
      },
    },

    /* ------------------------------------------------------------ 24.17 */
    {
      id: '24.17',
      title: '`IssueDetailStore`: `applyRemoteComment`',
      blocks: [
        {
          kind: 'p',
          text:
            '`IssueDetailStore` מקבל method אחד: `applyRemoteComment(issueId: number)`. ' +
            'אם `issueId` שווה ל-`issueId()` הנוכחי (ה-issue שפתוח כעת), ' +
            'קוראים `commentsResource.reload()` ו-`activityResource.reload()`. ' +
            'אם ה-issue הפתוח הוא אחר — מתעלמים.',
        },
        {
          kind: 'p',
          text:
            'מדוע reload ולא הוספה במקום? תגובות הן משאב קטן ולא-תכוף, ' +
            'ו-`commentsResource` כבר מנהל `pendingComment` אופטימי מפרק 19. ' +
            'לשמור consistency בין ה-pending האופטימי לבין תגובה שנדחפה דרך SignalR — reload פשוט ועקבי. ' +
            'שתי שורות, אפס edge cases.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה שידור comment לא כולל `upsert` ישיר כמו issue?',
          body:
            'ב-issue: השרת שולח את ה-`IssueResponse` המלא, הלקוח יודע לעשות `upsertEntity` ישיר — זה מה שעשה optimistically. ' +
            'ב-comment: יש `pendingComment` זמני עם id שלילי. ' +
            'אם היינו מוסיפים את התגובה הנדחפת לצד ה-pending, היינו יכולים להגיע לכפילות. ' +
            'reload מרנדר תמיד מ-source of truth אחד.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch24',
        file: 'client/src/app/core/state/issue-detail.store.ts',
        region: 'step-24.14',
        diff: true,
        title: 'issue-detail.store.ts — applyRemoteComment: reload כשה-issue הנכון פתוח',
      },
    },

    /* ------------------------------------------------------------ 24.18 */
    {
      id: '24.18',
      title: '`ProjectBoard`: join/leave lifecycle + תווית "חי"',
      blocks: [
        {
          kind: 'p',
          text:
            '`ProjectBoard` הוא הבעלים של חברות ה-group. ' +
            'ב-constructor: `effect(() => realtime.setActiveProject(this.projectId()))` — ' +
            'כשמגיעים לפרויקט, מצטרפים ל-group. ' +
            '`DestroyRef.onDestroy(() => realtime.clearActiveProject())` — כשיוצאים, עוזבים. ' +
            '`setActiveProject` גם זוכר את הפרויקט הפעיל לצורך re-join אחרי reconnect.',
        },
        {
          kind: 'p',
          text:
            '`liveLabel` הוא computed signal שמחזיר מחרוזת Hebrew לפי `realtime.state()`: ' +
            '"● חי" כשמחוברים, "○ מתחבר מחדש" ב-reconnect, "○ מתחבר" בחיבור ראשוני, "○ מנותק" בלא-מחובר. ' +
            'ה-label מוצג ב-`<tf-badge>` בכותרת הלוח — אינדיקטור visual פשוט לסטטוס ה-realtime.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'מדוע `setActiveProject` ב-effect ולא ב-lifecycle hook?',
          body:
            '`projectId` הוא `input.required()` — הוא עשוי להשתנות אם הראוטר מעדכן params (navigate בין פרויקטים). ' +
            '`effect` מגיב לשינוי ה-signal אוטומטית: ' +
            'ניווט מפרויקט 1 לפרויקט 2 יקרא `setActiveProject(2)` מחדש, ' +
            'שיקרא ל-`joinActive` שיצא מgroup 1 ויצטרף ל-2. ' +
            '`ngOnInit` היה קורא פעם אחת בלבד.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch24',
        file: 'client/src/app/features/projects/project-board.ts',
        region: 'step-24.15',
        diff: true,
        title: 'project-board.ts — join/leave ב-effect + liveLabel signal',
      },
    },

    /* ------------------------------------------------------------ 24.19 */
    {
      id: '24.19',
      title: 'תווית "חי" בתבנית + הדמו',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-`project-board.html`: `<tf-badge tone="count">{{ liveLabel() }}</tf-badge>` — ' +
            'badge קטן ליד שם הפרויקט. ' +
            'כשמחוברים: "● חי". כשמתחברים מחדש: "○ מתחבר מחדש". ' +
            'המשתמש רואה בכל רגע אם הלוח שלו מקבל עדכונים חיים או לא.',
        },
        {
          kind: 'p',
          text:
            'הדמו שלמטה ממחיש שני לקוחות זה לצד זה. ' +
            '"A: Create issue" ו-"A: Move issue" — A מעדכן אופטימית (ללא הד); ' +
            'B מקבל את האירוע תוך ~550ms ומעדכן את הלוח שלו מהדחיפה. ' +
            '"Disconnect B" מוריד את החיבור ב-B; אירועים שנשלחו בזמן הניתוק אובדים ("X updates missed"); ' +
            '"Reconnect B" מחבר מחדש וטוען מהשרת — reconcile.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'כיצד אפשר לבדוק שה-echo suppression עובד?',
          body:
            'פתח שתי לשוניות על אותו פרויקט עם אותו user. ' +
            'בלשונית A: צור issue. ' +
            'A כבר עדכן אופטימית (פרקים 17/20); הוא אמור לא לעדכן שוב מה-broadcast. ' +
            'B אמור לקבל את ה-issue מה-broadcast. ' +
            'בדוק ב-console: A לא מדפיס "applying remote upsert for self"; B כן מקבל. ' +
            'הראיה: ב-smoke שבוצע, `origin` של האירוע שווה ל-`connectionId` של A, ' +
            'ו-`isSelf()` החזיר `true` — A דילג.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch24',
        file: 'client/src/app/features/projects/project-board.html',
        region: 'step-24.15b',
        diff: true,
        title: 'project-board.html — tf-badge עם liveLabel()',
      },
    },

    /* ------------------------------------------------------------ 24.20 */
    {
      id: '24.20',
      title: 'הדמו: שני לקוחות בזמן-אמת',
      blocks: [
        {
          kind: 'p',
          text:
            'הדמו מממש סצנריו ריאלי: שני לקוחות מחוברים לאותו פרויקט. ' +
            'לחצן "A: Create issue" שולח בקשה מ-A; A מעדכן אופטימית מיד. ' +
            'B מקבל `IssueChanged` דרך ה-hub תוך ~550ms ומציג את ה-issue.',
        },
        {
          kind: 'p',
          text:
            '"Disconnect B" ו-"Reconnect B" מדגימים את best-effort: ' +
            'אירועים שנשלחו בזמן הניתוק מופיעים כ-"X updates missed" — הם אבדו, לא חיכו. ' +
            'חיבור מחדש קורא `reload()` ו-B מסתנכרן עם מצב A הנוכחי. ' +
            'זה ה-mental model: realtime מצוין ל-"אפס זמן lag"; ' +
            'consistency מגיע מ-reconcile-on-reconnect.',
        },
        {
          kind: 'callout',
          tone: 'dotnet10',
          title: 'SignalR ב-.NET 10: אפס NuGet',
          body:
            'SignalR ב-ASP.NET Core הוא חלק מה-shared framework מאז .NET 3.0. ' +
            'ב-.NET 10 הוא משודרג (better memory pressure, improved hub protocol). ' +
            'מספיק `AddSignalR()` ו-`MapHub<T>()` — אפס תלות NuGet חדשות, ' +
            'בדיוק כמו OutputCache ו-RateLimiter מפרק 23.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () =>
          import('./demos/two-client-realtime.demo').then(
            (m) => m.TwoClientRealtimeDemo,
          ),
        caption:
          'שני לקוחות בזמן-אמת: A כותב, B מקבל; נתק/חבר מחדש — best-effort + reconcile',
      },
    },
  ],

  quiz: [
    {
      q: 'מדוע `OnMessageReceived` מרים את `access_token` מה-query string *רק* לנתיבי `/hubs`?',
      options: [
        'כי REST endpoints לא תומכים ב-access_token',
        'כדי שטוקן ב-URL לא יתקבל כהאמנה על בקשות REST רגילות — רק ה-hub, שלא יכול לשלוח Authorization header, מקבל חריגה זו',
        'כי /hubs דורש גרסה שונה של JWT',
        'כי CORS לא מאפשר Authorization על WebSocket',
      ],
      answer: 1,
      explain:
        'הדפדפן לא יכול לשלוח `Authorization` header ב-WebSocket. ' +
        'לכן SignalR שולח את הטוקן ב-query string (`?access_token=...`). ' +
        'ה-filter `path.StartsWithSegments("/hubs")` מגביל את ה"הרמה" לנתיבי hub בלבד — ' +
        'כדי שלא ניצור מצב שבו GET /api/projects/1/issues?access_token=... מקבל auth.',
    },
    {
      q: 'מה `isSelf(origin)` מונע ב-`BoardConnection`?',
      options: [
        'כפילות של issue ב-store',
        'שהלקוח שיזם כתיבה יחיל שוב את השינוי שכבר החיל אופטימית, מה שיכול לאפס rollback או ליצור flicker',
        'שני חיבורים מאותו user',
        'שידור ל-group לא-נכון',
      ],
      answer: 1,
      explain:
        'ה-broadcast הולך לכל ה-group — כולל ליוזם. ' +
        'היוזם כבר עדכן אופטימית (פרקים 17/20). ' +
        'אם היה מחיל שוב את האירוע, היה נלחם בעצמו: optimistic state מתנגש ב-broadcast state. ' +
        '`isSelf()` משווה `origin === connectionId` ומדלג אם הם שווים — רק שינויים של אחרים מוחלים.',
    },
    {
      q: 'מדוע `IBoardNotifier` חי ב-`TaskForge.Api` ולא ב-`TaskForge.Core`?',
      options: [
        'כי SignalR לא נתמך ב-Core',
        'כי הממשק מקבל Api Contracts (IssueResponse, CommentResponse) שה-Core לא מכיר — הם שייכים ל-Api layer',
        'כי DIP לא חל על realtime',
        'כי Singleton לא נתמך ב-Core',
      ],
      answer: 1,
      explain:
        '`IBoardNotifier` מקבל `IssueResponse` ו-`CommentResponse` — DTOs של ה-Api. ' +
        '`TaskForge.Core` מכיר entities, לא Api contracts. ' +
        'לכן הממשק שייך לproject שמכיר את ה-contracts — `TaskForge.Api`. ' +
        'זהו DIP ב-Api layer: ה-handlers תלויים בממשק, לא ב-SignalR.',
    },
    {
      q: 'מה קורה לאירועים שנשלחו בזמן שחיבור ה-SignalR של לקוח היה מנותק?',
      options: [
        'הם מצטברים בתור ונשלחים כשמתחברים מחדש',
        'הם אובדים — SignalR הוא best-effort; על reconnect הלקוח מריץ reload() לסנכרן',
        'השרת שומר אותם 24 שעות',
        'הם נשלחים דרך HTTP polling בינתיים',
      ],
      answer: 1,
      explain:
        'SignalR שולח הודעות לחיבורים *פעילים* בלבד. ' +
        'לקוח מנותק לא מקבל את האירועים שנשלחו בזמן הניתוק. ' +
        'לכן ב-`onreconnected`: מצטרפים מחדש ל-group *וגם* קוראים `issues.reload()`. ' +
        'realtime הוא best-effort — consistency מגיע מ-reconcile על חיבור מחדש.',
    },
    {
      q: 'למה `AddJsonProtocol` עם camelCase + `JsonStringEnumConverter` קריטי ב-SignalR?',
      options: [
        'כי SignalR לא תומך ב-JSON בלעדיו',
        'כי בלעדיו ה-payload של אירוע היה שולח `Status: 0` (int) במקום `status: "Open"` (string), שונה מה-REST — הלקוח היה צריך לטפל בשני formats',
        'כי Angular לא תומך ב-PascalCase',
        'כי הוא מאיץ את השרת',
      ],
      answer: 1,
      explain:
        'ה-REST API כבר מוגדר עם `JsonStringEnumConverter` ו-camelCase (פרק 04). ' +
        'SignalR יש לו serializer משלו (Json protocol). ' +
        'בלי `AddJsonProtocol` עם אותן הגדרות, ה-payload של `IssueChanged` היה שולח `Status: 0` (PascalCase + int). ' +
        'הלקוח היה מקבל issue עם `status: undefined` ולא `"Open"`. ' +
        '`AddJsonProtocol` מיישר את שני ה-transports.',
    },
    {
      q: 'מדוע `AllowCredentials()` ב-CORS מחייב `WithOrigins(...)` מפורש?',
      options: [
        'כי CORS לא תומך ב-wildcards',
        'כי לפי ה-CORS specification, credentials עם wildcard origin (AllowAnyOrigin) לא חוקי — ASP.NET Core זורק בעלייה',
        'כי SignalR מחייב זאת',
        'כי .NET 10 שינה את זה',
      ],
      answer: 1,
      explain:
        'ה-CORS specification אוסר שילוב `Access-Control-Allow-Credentials: true` ' +
        'עם `Access-Control-Allow-Origin: *`. ' +
        'זה בעיה אבטחתית: credentials כלפי כל origin בפועל מרוקן את הגנת CORS. ' +
        'ASP.NET Core מחיל זאת ב-startup validation — אם `AllowAnyOrigin` + `AllowCredentials`, תיזרק חריגה. ' +
        'origin מפורש אחד (`WithOrigins`) פותר זאת.',
    },
    {
      q: 'מה יקרה אם לקוח ינסה להצטרף ל-group של פרויקט שאינו חבר בו?',
      options: [
        'הוא יצטרף בהצלחה ויקבל broadcasts',
        'החיבור ייסגר',
        'JoinProject יזרוק HubException ותגיע ללקוח כשגיאה — ה-catch ב-joinActive() בולע אותה בשקט',
        'הבקשה תיסות בלי תגובה',
      ],
      answer: 2,
      explain:
        '`JoinProject` קורא `projects.IsMemberAsync()` — אותה בדיקה כמו ב-REST. ' +
        'לא-חבר מקבל `throw new HubException("You are not a member")`. ' +
        '`HubException` מועברת ללקוח (בניגוד לחריגות רגילות שמוסתרות). ' +
        'ב-`joinActive()` ב-`BoardConnection`: `invoke("JoinProject", id).catch(() => undefined)` — נבלע. ' +
        'ה-REST ממילא כבר מחזיר 403 על כל בקשה.',
    },
    {
      q: 'מה הסיבה שה-`BoardConnection` מוזרק ב-`authInterceptor` (ולא רק ב-`ProjectBoard`)?',
      options: [
        'כדי שה-connectionId יהיה זמין לכל בקשת HTTP, כולל כתיבות מ-components שאינם ProjectBoard',
        'כי Angular מחייב זאת',
        'כי ProjectBoard לא יכול להזריק שירות',
        'כי CORS מחייב זאת',
      ],
      answer: 0,
      explain:
        'ה-`connectionId` צריך להיכלל ב-`X-Connection-Id` על *כל* בקשת כתיבה, ' +
        'לא רק על כתיבות שמקורן ב-`ProjectBoard`. ' +
        'האינטרצפטור רץ על כל בקשת HTTP — הוא המקום הנכון לצרף metadata שחוצה את כל ה-HTTP layer. ' +
        'Injection ב-component בלבד היה משמיט את הheader על בקשות מ-dialogs, modals, ו-stores אחרים.',
    },
  ],

  proveIt: [
    {
      title: 'אמתו auth על hub: 401 ללא טוקן, 200 עם טוקן',
      body:
        'הריצו שני-שרתים (API על http://localhost:5080). ' +
        'ניסיון negotiate ללא טוקן אמור להחזיר 401. ' +
        'השיגו טוקן תחילה, ואז negotiate עם access_token ב-query string אמור להחזיר 200 עם connectionId.',
      command:
        'TOKEN=$(curl -s -X POST http://localhost:5080/api/auth/login -H "Content-Type: application/json" -d \'{"email":"demo@taskforge.dev","password":"Passw0rd!"}\' | jq -r .accessToken) && echo "=== ללא טוקן ===" && curl -i -X POST "http://localhost:5080/hubs/board/negotiate?negotiateVersion=1" && echo && echo "=== עם טוקן ===" && curl -i -X POST "http://localhost:5080/hubs/board/negotiate?negotiateVersion=1&access_token=$TOKEN"',
      expect:
        'ללא טוקן: `HTTP/1.1 401`. ' +
        'עם טוקן: `HTTP/1.1 200` עם גוף JSON הכולל `connectionId` ו-`availableTransports` (WebSockets, ServerSentEvents, LongPolling). ' +
        'זה מוכיח שהאימות מעל WebSocket עובד דרך query string.',
    },
    {
      title: 'אמתו דחיפה חיה: שני tabs — כתב ב-A, ראה ב-B',
      body:
        'פתחו שתי לשוניות דפדפן על `http://localhost:4500`. ' +
        'בשתיהן: התחברו עם demo@taskforge.dev / Passw0rd! ונווטו לפרויקט "Website Redesign". ' +
        'ב-Tab A: לחצו "New Issue" וצרו issue עם כותרת ייחודית. ' +
        'ב-Tab B: אל תרעננו — המתינו עד 2 שניות.',
      expect:
        'Tab B מציג את ה-issue החדש בלוח בלי refresh. ' +
        'ה-badge "● חי" מוצג בשני ה-tabs. ' +
        'Tab A אינו מציג issue כפול (echo suppression פעל).',
    },
    {
      title: 'אמתו אי-חברות: JoinProject נדחה',
      body:
        'maya@taskforge.dev היא חברה בפרויקט 1 בלבד. ' +
        'השיגו טוקן עבורה, בצעו negotiate לקבלת connectionId, ואז נסו לקרוא JoinProject(2) ב-hub.',
      command:
        'MAYA=$(curl -s -X POST http://localhost:5080/api/auth/login -H "Content-Type: application/json" -d \'{"email":"maya@taskforge.dev","password":"Passw0rd!"}\' | jq -r .accessToken) && echo "Maya token: ${MAYA:0:30}..." && echo "כעת נסו negotiate: curl -s -X POST http://localhost:5080/hubs/board/negotiate?negotiateVersion=1&access_token=$MAYA | jq"',
      expect:
        'Negotiate מצליח (200 + connectionId) כי maya מאומתת. ' +
        'אם תתחברו ב-JS ותקראו `JoinProject(2)`, תקבלו HubException: "You are not a member of this project." ' +
        'JoinProject(1) יצליח (maya חברה בפרויקט 1).',
    },
    {
      title: 'אמתו badge "חי" + reconnect',
      body:
        'פתחו לשונית על הboard. ודאו שה-badge מציג "● חי". ' +
        'ב-DevTools (Network tab): לחצו על "Throttling" ובחרו "Offline". ' +
        'המתינו 3–5 שניות וצפו ב-badge. ' +
        'החזירו חיבור (הסירו throttling). ' +
        'המתינו 3–5 שניות נוספות.',
      expect:
        'עם throttling: badge משתנה ל-"○ מתחבר מחדש" (SignalR מנסה `withAutomaticReconnect`). ' +
        'כשהרשת חוזרת: badge חוזר ל-"● חי". ' +
        'הלוח מסתנכרן אוטומטית (reload נקרא ב-`onreconnected`).',
    },
    {
      title: 'אמתו origin + echo suppression ב-Network tab',
      body:
        'פתחו לשונית על הboard עם DevTools פתוח (Network tab). ' +
        'סננו לבקשות לכתובת `/hubs/board`. ' +
        'פתחו WS connection ועקבו אחרי ה-frames. ' +
        'צרו issue חדש. ',
      expect:
        'ב-WS frames: תראו frame עם "IssueChanged" שמכיל `origin: "<connectionId>"`. ' +
        'ה-origin שווה ל-`connectionId` שה-negotiate החזיר. ' +
        'הלוח לא מוסיף issue כפול — isSelf החזיר true, ה-event נובלע. ' +
        'בלשונית שנייה: אותו frame מגיע, origin שונה, ה-issue מוצג.',
    },
  ],

  exercise: {
    prompt:
      'הרחיבו את ה-realtime: הוסיפו שידור לאירוע "member joined/left project" — ' +
      'כך שכשמשתמש מצטרף לפרויקט, כל הצופים בלוח יראו עדכון ברשימת החברים.',
    tasks: [
      'הוסיפו record חדש `MemberChangedEvent(string? Origin, int ProjectId)` ל-`BoardEvents.cs`.',
      'הוסיפו `MemberChangedAsync(int projectId, string? origin, CancellationToken ct)` ל-`IBoardNotifier` ול-`SignalRBoardNotifier`.',
      'ב-`MemberEndpoints.cs`: הזריקו `IBoardNotifier` ו-`connectionId`; קראו `notifier.MemberChangedAsync(...)` אחרי הוספת חבר.',
      'ב-`BoardConnection`: הוסיפו `connection.on("MemberChanged", ...)` שיקרא לשירות/store שמנהל את רשימת החברים.',
      'ב-`IssueDetailStore` (שמחזיק `membersResource`): הוסיפו `applyRemoteMemberChange()` שמריץ `membersResource.reload()`.',
      'אמתו: הוסיפו חבר בטאב A — הרשימה מתעדכנת ב-Tab B ללא refresh.',
    ],
    acceptance: [
      'Hub מקבל `MemberChanged` event ומשדר ל-group של הפרויקט.',
      'בשתי לשוניות: הוספת חבר ב-A מציגה אותו ב-B תוך ~1 שניה.',
      'echo suppression: הוסיף ב-A — A אינו טוען מחדש מיותר (origin מסונן).',
      'build ירוק (`dotnet build` + `pnpm build`), אפס שגיאות.',
    ],
  },
};
