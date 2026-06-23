import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 27 — Build & Explain: ארכיטקטורת fullstack (Drill T1).
 * Wave 7 Interview Drill. NO live demo — narrative / talk-track only.
 * Goal: the reader can receive "build me a todo/task app and explain the architecture"
 * and answer fluently in one continuous flow. Code is English; prose is Hebrew RTL.
 *
 * Structure mirrors the spec's arc:
 *   27.1  פתיחה + המודל המנטלי "הטבעת"
 *   27.2  דיאגרמת הטבעת (mermaid)
 *   27.3  Talk-track 1 — מצמצמים scope
 *   27.4  Talk-track 2 — מתחילים מהחוזה
 *   27.5  Talk-track 3 — שלוש שכבות שרת (filetree)
 *   27.6  Core seam — IIssueRepository (code-inline)
 *   27.7  Api layer — Minimal API group (code-inline)
 *   27.8  Talk-track 4 — core / shared / features (filetree)
 *   27.9  signal store — IssuesStore (code-inline)
 *   27.10 רכיב טיפש — IssueCard (code-inline)
 *   27.11 Talk-track 5 — הסיבוב של קליק אחד (simulator)
 *   27.12 Talk-track 6 — cross-cutting (app-tree)
 *   27.13 סדר הבנייה האמיתי
 *   27.14 שאלות ראיון — Q&A
 */
export const CH27_CONTENT: ChapterContent = {
  steps: [

    /* ------------------------------------------------------------ 27.1 */
    {
      id: '27.1',
      title: 'הפרק: לבנות ולהסביר fullstack — בזרימה אחת',
      blocks: [
        {
          kind: 'p',
          text:
            'זה דריל T1 — הדריל הפותח של גל 7. ' +
            'הוא לא מוסיף שורת קוד ל-TaskForge; הוא מלמד אתכם להסביר את מה שבניתם. ' +
            'המטרה: לקבל את השאלה "תבנה לי todo/task app — ספר לי איך אתה ניגש, ' +
            'מה הארכיטקטורה, ה-components, ה-API" ולענות בזרימה אחת, ' +
            'רגועה, בלי להיתקע.',
        },
        {
          kind: 'p',
          text:
            'הקוד — אנגלית. ההסבר בעל-פה — עברית (או כל שפה שנוחה לכם). ' +
            'כל מה שמופיע כאן הוא קוד אמיתי מ-TaskForge שבניתם. ' +
            'אין דבר מומצא — רק ניסוח מחדש של מה שכבר עובד.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'איך להשתמש בדריל הזה',
          body:
            'קראו את ה-talk-track פעם אחת. ' +
            'אחר-כך סגרו את המסך, שרטטו את הטבעת על נייר, ' +
            'ונסו לספר את כל 6 הנקודות בקול — כ-4 דקות. ' +
            'חזרו לבדוק מה שכחתם. חזרו שוב בלי לקרוא. ' +
            'שלוש חזרות ויש לכם גרסה שמחזיקה בראיון.',
        },
        {
          kind: 'term',
          name: 'vertical slice',
          definition:
            'פיצ\'ר שחוצה את כל שכבות הסטק מ-DB ועד UI בבנייה אחת: ' +
            'entity + migration, repository + seam, endpoint עם authz, store, component, test. ' +
            'ב-TaskForge: כל ישות מרכזית (Project, Issue, Comment) נבנתה כ-vertical slice. ' +
            'היתרון: בודקים שהארכיטקטורה תומכת בצמיחה לפני שבונים הכול.',
        },
      ],
      panel: {
        kind: 'diagram',
        caption: 'הטבעת — המודל המנטלי שמחזיק את כל ארכיטקטורת ה-fullstack',
        mermaid: `flowchart LR
  C["Component\\n(Angular)"]
  S["Store / Service\\n(signals + httpResource)"]
  H["HTTP Client\\n(interceptors)"]
  E["Endpoint\\n(Minimal API)"]
  R["Repository\\n(IIssueRepository)"]
  DB["DB\\n(SQLite / EF Core)"]

  C --> S
  S --> H
  H --> E
  E --> R
  R --> DB
  DB --> R
  R --> E
  E --> H
  H --> S
  S --> C`,
      },
    },

    /* ------------------------------------------------------------ 27.2 */
    {
      id: '27.2',
      title: 'המודל המנטלי: הטבעת והשניים',
      blocks: [
        {
          kind: 'p',
          text:
            'משפט אחד שמחזיק הכול: ' +
            '"דאטה זורם בטבעת: component, לאחר מכן service/store, ' +
            'לאחר מכן HTTP, לאחר מכן endpoint, לאחר מכן repository, לאחר מכן DB — ' +
            'וחוזר כ-DTO מטיפוס. ' +
            'לכל שכבה תפקיד אחד והיא מדברת רק עם השכן."',
        },
        {
          kind: 'p',
          text:
            'בראיון: שרטטו את הטבעת על הלוח. ' +
            'סמנו את ה-seams — הנקודות שבהן מחליפים מימוש או כותבים טסט. ' +
            'ב-TaskForge יש שלושה seams מרכזיים: ' +
            '`IIssueRepository` בצד השרת, ' +
            'ה-interceptor בצד הלקוח, ' +
            'וחוזה ה-DTO שמחבר ביניהם.',
        },
        {
          kind: 'term',
          name: 'seam',
          definition:
            'נקודת תפר (מושג של Michael Feathers) שבה אפשר להחליף התנהגות בלי לשנות את הקוד שמסביב. ' +
            'ב-TaskForge: `IIssueRepository` מאפשר להחליף EF Core ב-in-memory בטסטים; ' +
            'ה-`authInterceptor` מאפשר להוסיף headers בלי לגעת ברכיבים; ' +
            '`IBoardNotifier` מאפשר להחליף SignalR ב-Redis backplane. ' +
            'seam + DI = הכלי הבסיסי לבדיקתיות ולאבולוציה.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה "טבעת" ולא "שכבות"? ' +
            'שכבות מציירות היררכיה אנכית שמרמזת שהדאטה רק יורד. ' +
            'הטבעת מדגישה שהדאטה חוזר — התגובה היא חלק מהמסלול, לא תוצר-לוואי. ' +
            'זה גם מזכיר את חוק התלות: כל חץ מצביע פנימה (Core), לא החוצה.',
        },
      ],
      panel: {
        kind: 'diagram',
        caption: 'שלוש השכבות בשרת — חוק התלות: Api ו-Infrastructure תלויים ב-Core, לא הפוך',
        mermaid: `flowchart TB
  subgraph Core["TaskForge.Core (אפס תלות חיצונית)"]
    Entity["Issue / Project\\n(entity records)"]
    IRepo["IIssueRepository\\n(seam)"]
  end

  subgraph Infra["TaskForge.Infrastructure"]
    EFRepo["EfIssueRepository\\n(מממש IIssueRepository)"]
    DB["EF Core + SQLite"]
  end

  subgraph Api["TaskForge.Api"]
    EP["MapGroup /api/issues\\nTypedResults + ProblemDetails"]
    Auth["RequireAuthorization\\nIsMemberAsync"]
  end

  Api --> Core
  Infra --> Core
  EP --> IRepo
  EFRepo --> DB`,
      },
    },

    /* ------------------------------------------------------------ 27.3 */
    {
      id: '27.3',
      title: 'Talk-track 1: מצמצמים scope ובוחרים vertical slice',
      blocks: [
        {
          kind: 'h',
          text: '"קודם אני מצמצם scope ובוחר ישות אחת."',
        },
        {
          kind: 'p',
          text:
            'אל תגידו "אני בונה את הכול". ' +
            'בחרו ישות אחת — Issue עם `id`, `title`, `status`, `createdAt` — ' +
            'ובנו vertical slice אחד מקצה לקצה. ' +
            'ישות פשוטה שמדגימה את כל השכבות שווה יותר מ-10 ישויות שחצי מהן לא מחוברות.',
        },
        {
          kind: 'p',
          text:
            'ב-TaskForge עשינו בדיוק זאת: פרק 02 הגדיר `IIssueRepository`, ' +
            'פרק 04 בנה את ה-endpoints, פרק 11 חיבר את הלקוח. ' +
            'כל פרק אחר שכפל את הדפוס לישות חדשה.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה להתחיל ב-vertical slice ולא בכל ה-entities?',
          body:
            'vertical slice אחד מוכיח שהארכיטקטורה עובדת end-to-end לפני שמשקיעים. ' +
            'אם יש בעיה בחיבור HTTP, בסידור ה-DI, או בחוזה ה-DTO — ' +
            'גלים אותה מוקדם. ' +
            'ב-TaskForge: פרק 04 הפעיל request אמיתי ב-`.http` מול endpoint אמיתי ' +
            'לפני שכתבנו שורת Angular.',
        },
      ],
      panel: {
        kind: 'filetree',
        title: 'ה-vertical slice של Issue — כל שכבה',
        lines: [
          { text: 'server/', depth: 0, kind: 'dir' },
          { text: 'TaskForge.Core/', depth: 1, kind: 'dir' },
          { text: 'Entities/Issue.cs', depth: 2, kind: 'file' },
          { text: 'Abstractions/IIssueRepository.cs', depth: 2, kind: 'file' },
          { text: 'TaskForge.Infrastructure/', depth: 1, kind: 'dir' },
          { text: 'Data/AppDbContext.cs', depth: 2, kind: 'file' },
          { text: 'Repositories/EfIssueRepository.cs', depth: 2, kind: 'file' },
          { text: 'TaskForge.Api/', depth: 1, kind: 'dir' },
          { text: 'Endpoints/IssueEndpoints.cs', depth: 2, kind: 'file' },
          { text: 'Contracts/IssueContracts.cs', depth: 2, kind: 'file' },
          { text: 'client/', depth: 0, kind: 'dir' },
          { text: 'src/app/core/state/issues.store.ts', depth: 1, kind: 'file' },
          { text: 'src/app/features/issues/issue-board.ts', depth: 1, kind: 'file' },
          { text: 'src/app/features/issues/issue-card.ts', depth: 1, kind: 'file' },
        ],
        caption: 'Issue: entity ב-Core, seam, EF ב-Infrastructure, endpoint ב-Api, store + components ב-Angular',
      },
    },

    /* ------------------------------------------------------------ 27.4 */
    {
      id: '27.4',
      title: 'Talk-track 2: מתחילים מהחוזה, לא מה-DB',
      blocks: [
        {
          kind: 'h',
          text: '"אני מתחיל מהחוזה, לא מה-DB."',
        },
        {
          kind: 'p',
          text:
            'החוזה הוא מה ש-frontend ו-backend מסכימים עליו — שניהם נבנים ממנו במקביל. ' +
            'מגדירים את ה-DTO וה-endpoints לפני שכותבים שורת EF:',
        },
        {
          kind: 'ul',
          items: [
            '`GET /api/issues?page=&pageSize=` — רשימה מדפדפת, מחזיר `200` עם `PagedResult<IssueResponse>`',
            '`POST /api/issues` — יצירה, מחזיר `201` עם `Location` header ו-body של `IssueResponse`',
            '`PUT /api/issues/{id}` — עדכון מלא, מחזיר `200`',
            '`PATCH /api/issues/{id}/rank` — עדכון rank בלבד, מחזיר `200`',
            '`DELETE /api/issues/{id}` — מחיקה, מחזיר `204` בלי body',
          ],
        },
        {
          kind: 'p',
          text:
            'קודי מצב שחשוב להכיר: ' +
            '`200` תשובה מוצלחת עם body, ' +
            '`201` נוצר — תמיד עם `Location`, ' +
            '`204` בוצע ללא body, ' +
            '`400` ולידציה נכשלה (ProblemDetails), ' +
            '`401` לא מזוהה, ' +
            '`403` אין הרשאה למשאב הספציפי, ' +
            '`404` לא נמצא.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה להגדיר DTOs לפני שה-DB קיים? ' +
            'כי ה-DB הוא פרט מימוש — הוא יכול להשתנות (SQLite בפיתוח, Postgres בפרודקשן). ' +
            'ה-DTO הוא החוזה הציבורי שלא אמור להשתנות ללא versioning. ' +
            'ב-TaskForge (פרק 04): כתבנו את `IssueContracts.cs` לפני שיצרנו migration.',
        },
      ],
      panel: {
        kind: 'simulator',
        scenario: {
          title: 'POST /api/issues — יצירת issue חדש',
          blurb:
            'ה-endpoint מקבל `CreateIssue` DTO, מוסיף ל-DB, ומחזיר `201 Created` ' +
            'עם `Location` header שמצביע על ה-resource החדש.',
          requests: [
            {
              method: 'POST',
              path: '/api/issues',
              body: JSON.stringify({ title: 'Fix login bug', status: 'Open', priority: 'High' }, null, 2),
              note: 'Bearer token נדרש — endpoint מוגן ב-RequireAuthorization',
            },
          ],
          responses: [
            {
              status: 201,
              title: 'Created',
              body: JSON.stringify(
                {
                  id: 42,
                  title: 'Fix login bug',
                  status: 'Open',
                  priority: 'High',
                  createdAt: '2026-06-22T10:00:00Z',
                },
                null,
                2
              ),
            },
          ],
          insight:
            '`Location: /api/issues/42` — הלקוח יכול לשמור את ה-URL ישירות. ' +
            '`TypedResults.Created(url, dto)` מייצר גם את ה-header וגם את ה-body בשורה אחת.',
        },
      },
    },

    /* ------------------------------------------------------------ 27.5 */
    {
      id: '27.5',
      title: 'Talk-track 3: שלוש שכבות שרת לפי כיוון התלות',
      blocks: [
        {
          kind: 'h',
          text: '"בשרת אני עובד בשלוש שכבות לפי כיוון התלות."',
        },
        {
          kind: 'ul',
          items: [
            '`TaskForge.Core` — הישות + ה-seam `IIssueRepository`. אפס תלות בתשתית, אפס reference ל-EF.',
            '`TaskForge.Infrastructure` — EF `DbContext` + `EfIssueRepository` שמממש את ה-seam.',
            '`TaskForge.Api` — Minimal API: `MapGroup("/api/issues")`, ולידציה של .NET 10, `TypedResults`, `ProblemDetails`.',
          ],
        },
        {
          kind: 'p',
          text:
            'החוק: Api ו-Infrastructure תלויים ב-Core, לא הפוך. ' +
            'לכן אפשר להחליף DB בלי לגעת בלוגיקה. ' +
            'ב-TaskForge (פרק 21): הבדיקות הזריקו `EfIssueRepository` עם SQLite in-memory — ' +
            'ה-handlers לא ידעו שמשהו השתנה.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה עקרון היפוך התלות (DIP) ואיך הוא מיושם ב-TaskForge?',
          body:
            'DIP (ה-D של SOLID): שכבות גבוהות לא תלויות בנמוכות — שתיהן תלויות בהפשטה. ' +
            '`TaskForge.Core` מגדיר `IIssueRepository`; ' +
            '`TaskForge.Infrastructure` מממש `EfIssueRepository`; ' +
            '`TaskForge.Api` מזריק `IIssueRepository` דרך DI — לא `EfIssueRepository`. ' +
            'תוצאה מעשית: החלפת EF Core ב-Dapper לא נוגעת בשורת Core או Api אחת.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'csharp',
        code: `// Core — ה-seam. אפס תלות בתשתית.
public interface IIssueRepository {
    Task<PagedResult<Issue>> ListAsync(IssueQuery q, CancellationToken ct);
    Task<Issue?> FindAsync(int id, CancellationToken ct);
    Task<Issue> AddAsync(Issue issue, CancellationToken ct);
}`,
        file: 'server/TaskForge.Core/Abstractions/IIssueRepository.cs',
      },
    },

    /* ------------------------------------------------------------ 27.6 */
    {
      id: '27.6',
      title: 'שכבת ה-Api: Minimal API group',
      blocks: [
        {
          kind: 'p',
          text:
            '`MapGroup` מקבץ endpoints תחת prefix משותף ומאפשר להפעיל middleware (authorization, cache, filters) ' +
            'פעם אחת על כל הקבוצה. ' +
            'כל handler מקבל את ה-`IIssueRepository` דרך DI — לא את `EfIssueRepository` — ' +
            'ולכן הוא לא יודע אם ה-DB הוא SQLite, Postgres, או in-memory.',
        },
        {
          kind: 'p',
          text:
            '`TypedResults` נותן type-safety: הקומפיילר יודע מה כל handler יכול להחזיר. ' +
            '`[AsParameters]` על `IssueQuery` ממפה query params לרקורד C# בלי boilerplate.',
        },
        {
          kind: 'callout',
          tone: 'dotnet10',
          body:
            'ב-.NET 10: ולידציה מובנית עם `[Required]`, `[MaxLength]` על ה-DTO records — ' +
            'ה-API מחזיר `400 ProblemDetails` אוטומטית בלי להוסיף filter ידני. ' +
            'ב-TaskForge (פרק 04) זה החליף את ה-`ValidationFilter` הידני.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'csharp',
        code: `// Api — Minimal API endpoint group
var issues = app.MapGroup("/api/issues").RequireAuthorization();
issues.MapGet("/", async ([AsParameters] IssueQuery q, IIssueRepository repo, CancellationToken ct)
    => TypedResults.Ok(await repo.ListAsync(q, ct)));
issues.MapPost("/", async (CreateIssue dto, IIssueRepository repo, CancellationToken ct) => {
    var created = await repo.AddAsync(dto.ToEntity(), ct);
    return TypedResults.Created($"/api/issues/{created.Id}", IssueResponse.From(created));
});`,
        file: 'server/TaskForge.Api/Endpoints/IssueEndpoints.cs',
      },
    },

    /* ------------------------------------------------------------ 27.7 */
    {
      id: '27.7',
      title: 'Talk-track 4: ארכיטקטורת הלקוח — core / shared / features',
      blocks: [
        {
          kind: 'h',
          text: '"בקליינט אני מחלק core / shared / features."',
        },
        {
          kind: 'ul',
          items: [
            '`core` — ה-store (signal state) + ה-HTTP service + interceptors. ה-state חי כאן, פעם אחת.',
            '`features` — רכיב חכם (smart/container) שמזמין מה-store ומתזמר.',
            '`shared` — רכיבים טיפשים (presentational): מקבלים `input()`, פולטים `output()`, אפס לוגיקת דאטה.',
          ],
        },
        {
          kind: 'p',
          text:
            '"חכם יודע מאיפה הדאטה בא; טיפש רק מצייר את מה שנתת לו ומדווח אירועים." ' +
            'ב-TaskForge (פרק 07): `issue-board` הוא החכם — הוא מזריק `IssuesStore` ישירות. ' +
            '`issue-card` הוא הטיפש — הוא מקבל `issue = input.required<Issue>()` ופולט `toggle = output<number>()`.',
        },
        {
          kind: 'term',
          name: 'smart vs presentational',
          definition:
            'חלוקה בין רכיבים שמנהלים state (smart/container) לרכיבים שמציגים בלבד (presentational/dumb). ' +
            'רכיב חכם: מזריק store, יוזם actions, מתזמר תגובות. ' +
            'רכיב טיפש: מקבל `input()`, פולט `output()`, אפס DI ישיר ל-state. ' +
            'יתרון: רכיב טיפש ניתן לבדיקה בידוד ולשימוש חוזר בלי להחזיק state.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ההבדל בין smart לפרזנטציונל ואיפה הגבול?',
          body:
            'חכם מחזיק/מביא state ומתזמר; טיפש מקבל `input()` ופולט `output()`, ניתן לבדיקה בקלות ולשימוש חוזר. ' +
            'הגבול שומר על הרכיבים הטיפשים "טהורים". ' +
            'ב-TaskForge: `issue-board` (smart) מזריק `IssuesStore`; ' +
            '`issue-card` (dumb) לא יודע שיש store בכלל — הוא מקבל `Issue` object ופולט `toggle`.',
        },
      ],
      panel: {
        kind: 'filetree',
        title: 'ארכיטקטורת הלקוח — core / shared / features',
        lines: [
          { text: 'client/src/app/', depth: 0, kind: 'dir' },
          { text: 'core/', depth: 1, kind: 'dir' },
          { text: 'state/', depth: 2, kind: 'dir' },
          { text: 'issues.store.ts', depth: 3, kind: 'file' },
          { text: 'projects.store.ts', depth: 3, kind: 'file' },
          { text: 'auth/', depth: 2, kind: 'dir' },
          { text: 'auth.interceptor.ts', depth: 3, kind: 'file' },
          { text: 'error.interceptor.ts', depth: 3, kind: 'file' },
          { text: 'shared/', depth: 1, kind: 'dir' },
          { text: 'ui/', depth: 2, kind: 'dir' },
          { text: 'issue-card.ts  (רכיב טיפש)', depth: 3, kind: 'file' },
          { text: 'label-badge.ts  (רכיב טיפש)', depth: 3, kind: 'file' },
          { text: 'features/', depth: 1, kind: 'dir' },
          { text: 'issues/', depth: 2, kind: 'dir' },
          { text: 'issue-board.ts  (רכיב חכם)', depth: 3, kind: 'file' },
          { text: 'kanban-board.ts  (רכיב חכם)', depth: 3, kind: 'file' },
        ],
        caption: 'core = state + HTTP; shared = dumb components; features = smart containers',
      },
    },

    /* ------------------------------------------------------------ 27.8 */
    {
      id: '27.8',
      title: 'ה-Signal Store: state חי פעם אחת',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-store הוא `@Injectable({ providedIn: \'root\' })` — singleton אחד לכל האפליקציה. ' +
            'ה-state הוא `signal` פרטי; ה-public surface הוא `asReadonly()`. ' +
            'נגזרות הן `computed` — Angular מחשב אותן רק כשה-signal שמהן תלויים משתנה.',
        },
        {
          kind: 'p',
          text:
            'ב-`add()`: הרשימה מתעדכנת מיד (optimistic insert) לפני שהשרת ענה. ' +
            'אם ה-POST מצליח, מחליפים את ה-temp object בנתונים האמיתיים מהשרת. ' +
            'אם נכשל — rollback: מוחקים את ה-temp מהרשימה.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה "optimistic update" ומה מנגנון ה-rollback?',
          body:
            'מציירים את השינוי מיד ב-UI לפני שהשרת מאשר — תחושת מהירות מיידית. ' +
            'אם ה-request נכשל, משחזרים את ה-snapshot הקודם (rollback). ' +
            'ב-`IssuesStore.add()`: מכניסים `temp` עם `id: -Date.now()`, ' +
            'ובמקרה של הצלחה מחליפים אותו ב-`saved`; ' +
            'במקרה של כישלון מסננים אותו החוצה.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'typescript',
        code: `// core/state — signal store, ה-state חי פעם אחת
@Injectable({ providedIn: 'root' })
export class IssuesStore {
  private readonly http = inject(HttpClient);
  private readonly _items = signal<Issue[]>([]);
  readonly items = this._items.asReadonly();
  readonly open = computed(() => this._items().filter(i => i.status === 'Open'));

  add(dto: CreateIssue) {
    const temp = { ...dto, id: -Date.now(), status: 'Open' } as Issue;
    this._items.update(x => [temp, ...x]);                 // optimistic
    this.http.post<Issue>('/api/issues', dto).subscribe({
      next: saved => this._items.update(x => x.map(i => i === temp ? saved : i)),
      error: () => this._items.update(x => x.filter(i => i !== temp)), // rollback
    });
  }
}`,
        file: 'client/src/app/core/state/issues.store.ts',
      },
    },

    /* ------------------------------------------------------------ 27.9 */
    {
      id: '27.9',
      title: 'הרכיב הטיפש: input פנימה, output החוצה',
      blocks: [
        {
          kind: 'p',
          text:
            '`IssueCard` הוא הדוגמה הקנונית לרכיב טיפש: ' +
            'הוא לא יודע שיש store, לא יודע שיש HTTP, לא יודע מאיפה ה-`Issue` מגיע. ' +
            'הוא פשוט מצייר את מה שמסרו לו.',
        },
        {
          kind: 'p',
          text:
            '`input.required<Issue>()` (Angular v17 ועילה) מחליף את ה-`@Input()` הישן — ' +
            'type-safe, אין צורך ב-`!`, ניתן לקרוא כ-signal. ' +
            '`output<number>()` פולט event של `id` ל-הורה כשמשתמש לוחץ.',
        },
        {
          kind: 'callout',
          tone: 'v22',
          body:
            'ב-Angular v22: `input()` ו-`output()` הם ה-API המומלץ לרכיבים standalone. ' +
            'הם signal-based: `this.issue()` (עם סוגריים) קורא את הערך. ' +
            'זה מאפשר ל-Angular לדעת אוטומטית מתי הרכיב צריך re-render — בלי Zone.js.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'typescript',
        code: `// shared — רכיב טיפש: input פנימה, output החוצה, אפס דאטה משלו
@Component({ selector: 'app-issue-card', /* ... */ })
export class IssueCard {
  issue = input.required<Issue>();
  toggle = output<number>();
}`,
        file: 'client/src/app/shared/ui/issue-card/issue-card.ts',
      },
    },

    /* ------------------------------------------------------------ 27.10 */
    {
      id: '27.10',
      title: 'Talk-track 5: הסיבוב של קליק אחד',
      blocks: [
        {
          kind: 'h',
          text: '"עכשיו אני מתאר את הסיבוב של קליק אחד — \'add issue\'."',
        },
        {
          kind: 'ol',
          items: [
            'המשתמש לוחץ "Add" בטופס — `issue-board` קורא `store.add(dto)`.',
            'ה-store עושה optimistic insert: מכניס `temp` מיד ל-`_items` signal.',
            'הרשימה (`computed`) מתעדכנת אוטומטית — Angular מרנדר את הכרטיס החדש.',
            '`http.post("/api/issues", dto)` יוצא — ה-`authInterceptor` מוסיף `Authorization: Bearer ...`.',
            'ה-endpoint מקבל, ה-repository שומר ב-SQLite, ומחזיר `201 + Location`.',
            'ב-`next`: מחליפים את `temp` ב-`saved` (ה-id הזמני הופך ל-id אמיתי).',
            'ב-`error`: מסננים את `temp` החוצה — rollback. ה-`errorInterceptor` מציג toast.',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה הרשימה מתעדכנת אוטומטית אחרי ה-optimistic insert?',
          body:
            'הרשימה ב-template היא `computed` שתלוי ב-`_items` signal. ' +
            'כשמעדכנים `_items`, Angular מסמן את כל ה-views שקוראים ל-computed כ-"dirty" ' +
            'ומרנדר אותם מחדש — ללא Zone.js, ללא `ChangeDetectorRef.markForCheck()`. ' +
            'זו ה-CD של signals: נגזרות מתעדכנות בדיוק כשהמקור שלהן משתנה.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch11',
        title: 'TaskForge אחרי פרק 11 — חיבור HTTP מלא (core + interceptors + stores)',
      },
    },

    /* ------------------------------------------------------------ 27.11 */
    {
      id: '27.11',
      title: 'Talk-track 6: cross-cutting — interceptors ומצבי UI',
      blocks: [
        {
          kind: 'h',
          text: '"ולבסוף ה-cross-cutting."',
        },
        {
          kind: 'p',
          text:
            'שלושה concerns שחוצים כל מסך ורכיב, אבל מטופלים במקום אחד:',
        },
        {
          kind: 'ul',
          items: [
            'ה-`authInterceptor` (פרק 11) מצרף `Authorization: Bearer <token>` לכל בקשה. בפרק 24 הוסיפו לו שורה אחת: `X-Connection-Id` לצורך echo-skip ב-SignalR.',
            'ה-`errorInterceptor` ממפה `ProblemDetails` מהשרת לטוסט. בפרק 12 הוסיפו ענף `409`; בפרק 23 הוסיפו `429`. "מקום אחד לעדכן את העולם."',
            'מצבי `loading / empty / error` בכל מסך — "המצבים האלה הם 80% מהאיכות הנתפסת."',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה interceptor ולא לטפל בשגיאות בכל רכיב בנפרד?',
          body:
            'interceptor הוא seam אחד לכל ה-HTTP pipeline. ' +
            'טיפול בשגיאות בכל רכיב: כפילות קוד, אי-עקביות, קל לשכוח. ' +
            'interceptor: לוגיקה אחת, מכוסה בטסט אחד. ' +
            'ב-TaskForge: `errorInterceptor` גדל שלוש פעמים (פרקים 11, 12, 23) ' +
            'בלי לגעת ברכיב אחד.',
        },
      ],
      panel: {
        kind: 'diagram',
        caption: 'ה-HTTP pipeline של הלקוח: בקשה וחזרה דרך interceptors',
        mermaid: `sequenceDiagram
  participant Comp as Component
  participant Store as IssuesStore
  participant Auth as authInterceptor
  participant Err as errorInterceptor
  participant API as .NET API

  Comp->>Store: store.add(dto)
  Store->>Auth: http.post('/api/issues', dto)
  Auth->>Auth: מוסיף Authorization + X-Connection-Id
  Auth->>API: POST /api/issues
  API-->>Auth: 201 Created + Location
  Auth-->>Store: IssueResponse
  Store->>Store: מחליף temp בנתונים אמיתיים
  Store-->>Comp: items() computed מתעדכן
  Note over Store,API: בכישלון: errorInterceptor ממפה ProblemDetails לטוסט`,
      },
    },

    /* ------------------------------------------------------------ 27.12 */
    {
      id: '27.12',
      title: 'סדר הבנייה האמיתי: מבחוץ פנימה בחוזה, מבפנים החוצה בבנייה',
      blocks: [
        {
          kind: 'p',
          text:
            'בשאלת ראיון: "תבנה לי task app" — ענו עם הסדר הזה. ' +
            'הוא מוכיח שאתם חושבים בשכבות ולא כותבים קוד אקראי:',
        },
        {
          kind: 'ol',
          items: [
            'ישות + `DbContext` + migration — הבסיס, אחת לישות.',
            '`IIssueRepository` + מימוש EF — ה-seam לפני שה-endpoint קיים.',
            'Endpoints + DTOs + ולידציה — החוזה הציבורי.',
            'בדיקה ב-`.http` / Swagger — החוזה חי לפני שכתבנו Angular.',
            'בקליינט: models שתואמים ל-DTO — מקור-אמת אחד.',
            'Store עם signals + HTTP service — state חי פעם אחת.',
            'רכיב חכם — מזמין מה-store ומתזמר.',
            'רכיבים טיפשים — מקבלים input, פולטים output.',
            'Interceptor + error mapping — cross-cutting אחרי שהbusiness logic עובד.',
            'מצבי loading/empty/error — UX שמחזיק.',
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'בראיון: אתם לא חייבים לפרט את כל 10 הצעדים. ' +
            'פרקו לשני שלבים: "קודם החוזה (DTO + endpoints) — מריץ ב-Swagger ומאשר שזה עובד. ' +
            'אחר-כך הלקוח (store + components) — מחובר ל-API שכבר מאושר." ' +
            'זה מראה prioritization ולא "כותב בגלים".',
        },
      ],
      panel: {
        kind: 'diagram',
        caption: 'סדר הבנייה: "מבחוץ פנימה בחוזה, מבפנים החוצה בבנייה"',
        mermaid: `flowchart TD
  A["1. Entity + DbContext + Migration"]
  B["2. IIssueRepository + EfIssueRepository"]
  C["3. Endpoints + DTOs + Validation"]
  D["4. Smoke test: .http / Swagger"]
  E["5. Client models (match DTO)"]
  F["6. Store: signals + httpResource"]
  G["7. Smart component"]
  H["8. Dumb components"]
  I["9. Interceptors + error mapping"]
  J["10. Loading / empty / error states"]

  A --> B
  B --> C
  C --> D
  D --> E
  E --> F
  F --> G
  G --> H
  H --> I
  I --> J`,
      },
    },

    /* ------------------------------------------------------------ 27.13 */
    {
      id: '27.13',
      title: 'שאלות ראיון: smart מול presentational, state, ו-zoneless',
      blocks: [
        {
          kind: 'callout',
          tone: 'interview',
          title: 'איפה ה-state גר ולמה לא בכל רכיב בנפרד?',
          body:
            'ב-store יחיד ב-`core`, כ-signals; נגזרות הן `computed`. ' +
            'רכיבים קוראים, לא משכפלים. ' +
            'אם כל רכיב ינהל state משלו: סנכרון בין רכיבים אחים מחייב EventEmitter ארוכים, ' +
            'בדיקות מורכבות, ו-state שמתפצל. ' +
            'store אחד = מקור-אמת אחד = rollback אחד = test אחד.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה interface ל-repository ולא class ישירות?',
          body:
            'seam: מחליפים `EfIssueRepository` ב-`InMemoryIssueRepository` בטסטים בלי לשנות handler. ' +
            'זה היפוך התלות (DIP): ה-handler תלוי בממשק (הפשטה) לא במימוש. ' +
            'ב-TaskForge (פרק 21): xUnit tests הזריקו EF עם SQLite in-memory, ' +
            'ה-handlers לא ידעו שה-DB השתנה.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'איך ה-DTO של הלקוח נשאר מסונכרן עם ה-record בשרת?',
          body:
            'מקור-אמת אחד הוא החוזה: ה-DTO ב-`IssueContracts.cs` והמודל ב-`issue.model.ts` ' +
            'מוגדרים מהאותו חוזה. ' +
            'שינוי שובר (שם שדה, טיפוס) מתגלה בקומפילציה (TypeScript) ' +
            'או בבדיקות חוזה (contract tests). ' +
            'ב-production: OpenAPI schema יכול לייצר types אוטומטית.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'zoneless — מה זה משנה לאופן כתיבת הקוד?',
          body:
            'אין Zone.js; change detection מונע signals. ' +
            'כל קריאה/כתיבה של signal מסמנת view ל-render. ' +
            'משמעות מעשית: ספריות חיצוניות (SignalR, timers) כותבות ל-signals ישירות — ' +
            'אין צורך ב-`NgZone.run(...)`. ' +
            'ב-TaskForge (פרק 24): `@microsoft/signalr` כתב ל-signals ישירות, ' +
            'Angular זיהה — אפס wrappers.',
        },
      ],
      panel: {
        kind: 'diagram',
        caption: 'ה-seams של TaskForge — נקודות ההחלפה',
        mermaid: `flowchart LR
  subgraph Backend
    IRepo["IIssueRepository\\n(seam)"]
    EfRepo["EfIssueRepository\\n(production)"]
    InMem["SqliteInMemory\\n(testing)"]
    IRepo --> EfRepo
    IRepo -.->|"החלפה בטסט"| InMem
  end

  subgraph Frontend
    Interceptor["authInterceptor\\n(seam)"]
    IBN["IBoardNotifier\\n(seam)"]
    SignalR["SignalRBoardNotifier\\n(production)"]
    NoOp["NoOpBoardNotifier\\n(testing)"]
    IBN --> SignalR
    IBN -.->|"החלפה בטסט"| NoOp
  end`,
      },
    },

    /* ------------------------------------------------------------ 27.14 */
    {
      id: '27.14',
      title: 'פאנלים מומלצים לראיון: מה לשרטט על הלוח',
      blocks: [
        {
          kind: 'p',
          text:
            'בראיון מול לוח, שרטטו לפי סדר זה — כל שלב מוסיף שכבה:',
        },
        {
          kind: 'ol',
          items: [
            'הטבעת (6 תיבות, חצים) — "זה המודל שמחזיק הכול".',
            'סמנו 3 seams: `IIssueRepository`, interceptor, חוזה ה-DTO.',
            'פצלו את השרת ל-3 שכבות: Core, Infrastructure, Api. הציגו את כיוון התלות.',
            'פצלו את הלקוח ל-3: core (store), shared (dumb), features (smart).',
            'ציירו את מסלול ה-POST: optimistic, HTTP, 201, next/error.',
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'אם השאלה היא "בנה לי todo app" (גרסה פשוטה יותר): ' +
            'ישות אחת (`Todo`), endpoint אחד (`GET/POST /api/todos`), ' +
            'store אחד, component אחד חכם, אחד טיפש. ' +
            'הדפוס זהה לחלוטין ל-TaskForge — רק בלי auth, paging, ו-real-time. ' +
            'ציינו בקול: "כשיצטרכו auth, אוסיף interceptor; כשיצטרכו real-time, אוסיף SignalR עם seam."',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ה-"cross-cutting concerns" שתמיד שוכחים לדבר עליהם?',
          body:
            'שלושה: ' +
            '(1) interceptors — auth, error mapping, logging — מקום אחד, לא ב-100 רכיבים. ' +
            '(2) מצבי loading/empty/error — 80% מהאיכות הנתפסת. ' +
            '(3) security headers, rate limiting, compression — לא feature code, אבל מה שמבדיל production מ-demo. ' +
            'ב-TaskForge: כל השלושה ב-pipeline של .NET 10 (פרק 23) ולא בכל endpoint בנפרד.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch11',
        title: 'מצב מצטבר אחרי פרק 11 — fullstack מחובר לראשונה',
      },
    },
  ],

  /* ------------------------------------------------------------------ */
  quiz: [
    {
      q: 'מה המטרה של "הטבעת" כמודל מנטלי בהסבר ארכיטקטורה?',
      options: [
        'להראות שהדאטה רק יורד מ-DB ל-UI',
        'להדגיש שהדאטה זורם בשתי כיוונים (בקשה וחזרה) ושלכל שכבה תפקיד אחד שמדבר רק עם שכניו',
        'להסביר שיש כיכר עם שרתים',
        'לציין שה-DB הוא SQLite בלבד',
      ],
      answer: 1,
      explain:
        'הטבעת מדגישה שהתגובה היא חלק מהמסלול, לא תוצר-לוואי. ' +
        'כל שכבה מדברת רק עם שכניה — component לא מדבר ישירות עם DB. ' +
        'בנוסף, הטבעת מזכירה את חוק התלות: כל חץ מצביע פנימה (לCross הCore).',
    },
    {
      q: 'מה endpoint `POST /api/issues` אמור להחזיר בהצלחה?',
      options: [
        '200 OK עם הישות החדשה',
        '201 Created עם Location header ו-body של ה-DTO',
        '204 No Content',
        '202 Accepted',
      ],
      answer: 1,
      explain:
        '201 Created הוא קוד המצב הנכון לכל POST שיוצר resource חדש. ' +
        '`Location` header מציין את ה-URL של ה-resource — `/api/issues/42`. ' +
        '`TypedResults.Created(url, dto)` ב-.NET 10 מייצר גם את ה-header וגם את ה-body. ' +
        '200 שגוי כי לא מבטא יצירה; 204 שגוי כי אין body; 202 מתאים לעיבוד async.',
    },
    {
      q: 'למה `IIssueRepository` מוגדר ב-`TaskForge.Core` ולא ב-`TaskForge.Infrastructure`?',
      options: [
        'כי EF Core לא נתמך ב-Infrastructure',
        'כי Core מגדיר אילו שירותים הוא צריך (DIP) — ההפשטה שייכת לשכבה שצורכת אותה, לא לשכבה שמממשת',
        'כי Infrastructure לא יכול לייצא interfaces',
        'כי זה דרישה של ASP.NET Core',
      ],
      answer: 1,
      explain:
        'עקרון היפוך התלות (DIP): שכבות גבוהות לא תלויות בנמוכות. ' +
        'ה-Core הוא הלקוח של ה-repository — הוא מגדיר מה הוא צריך. ' +
        'ה-Infrastructure מספק את זה. ' +
        'אם הממשק היה ב-Infrastructure, ה-Core היה תלוי בה — ' +
        'לא ניתן לבדוק Core בלי Infrastructure.',
    },
    {
      q: 'מה קורה ב-`IssuesStore.add()` אם ה-POST נכשל?',
      options: [
        'ה-UI מראה spinner עד שהשרת עונה',
        'ה-temp item נמחק מה-`_items` signal (rollback) ו-`errorInterceptor` מציג toast',
        'ה-store שולח request שני',
        'ה-component מציג dialog שגיאה',
      ],
      answer: 1,
      explain:
        'optimistic UI: מציירים מיד, מחזירים אחורה אם נכשל. ' +
        'ב-`error` callback: `this._items.update(x => x.filter(i => i !== temp))` — ' +
        'ה-temp (עם id שלילי) מוסר מהרשימה. ' +
        '`errorInterceptor` מטפל בה-HTTP error בנפרד ומציג toast. ' +
        'שני ה-seams (store + interceptor) עובדים יחד בלי לדעת אחד על השני.',
    },
    {
      q: 'מה ההבדל בין `smart component` ל-`presentational component`?',
      options: [
        'smart יודע CSS, presentational לא',
        'smart מזריק store ומתזמר; presentational מקבל `input()` ופולט `output()` בלי לוגיקת state',
        'smart הוא lazy, presentational הוא eager',
        'presentational יכול לקרוא ל-HTTP ישירות',
      ],
      answer: 1,
      explain:
        'smart (container): יודע מאיפה הדאטה בא, מזריק store, יוזם actions. ' +
        'presentational (dumb): לא יודע שיש store, לא יודע שיש HTTP, ' +
        'רק מצייר `input()` ומדווח `output()`. ' +
        '`issue-board` = smart; `issue-card` = dumb. ' +
        'יתרון: dumb ניתן לבדיקה בבידוד ולשימוש חוזר בכל מסך.',
    },
    {
      q: 'מה ה-`authInterceptor` עושה ב-TaskForge ומה עלה לו בפרק 24?',
      options: [
        'מצפין את ה-body של כל request',
        'מצרף `Authorization: Bearer <token>` לכל בקשה; בפרק 24 הוסיפו שורה אחת שמצרפת `X-Connection-Id` לצורך echo-skip ב-SignalR',
        'בודק שה-JWT לא פג בתוקף',
        'מפנה cache אחרי כל mutation',
      ],
      answer: 1,
      explain:
        'interceptor הוא seam: כל שינוי cross-cutting בא כאן, לא ב-100 רכיבים. ' +
        'בפרק 11: הוסיפו Bearer token. ' +
        'בפרק 24: הוסיפו `X-Connection-Id` לצורך echo-skip — ' +
        'השרת מעביר את ה-`connectionId` כ-`origin`, ' +
        'ו-`BoardConnection` דולג על events שמקורם הלקוח עצמו.',
    },
    {
      q: 'מה סדר הבנייה הנכון של vertical slice חדש?',
      options: [
        'UI קודם, DB אחרון',
        'Entity + migration, לאחר מכן IRepository + מימוש, לאחר מכן endpoints + DTOs, לאחר מכן smoke test, לאחר מכן client store ו-components',
        'DB קודם, UI אחרון, ללא smoke test',
        'כל השכבות בבת-אחת',
      ],
      answer: 1,
      explain:
        'הסדר "מבחוץ פנימה בחוזה, מבפנים החוצה בבנייה": ' +
        'מגדירים את החוזה (DTO + endpoint) לפני שה-Angular קיים, ' +
        'ומריצים smoke test (`dotnet run` + `.http`) לפני שכותבים שורת TypeScript. ' +
        'זה מאשר שה-API עובד כמצופה לפני שמשקיעים בצד הלקוח.',
    },
    {
      q: 'מה "zoneless" ב-Angular ואיך הוא משפיע על שימוש בספריות חיצוניות כמו SignalR?',
      options: [
        'אי-אפשר להשתמש בספריות חיצוניות',
        'ספריות חיצוניות כותבות ל-signals ישירות; Angular זיהה ו-render ללא `NgZone.run()`',
        'צריך Zone.js וגם signals',
        'SignalR עובד רק עם Zone.js',
      ],
      answer: 1,
      explain:
        'Zone.js היה "monkey-patches" כל async API ומפעיל CD. ' +
        'zoneless: CD מופעל רק כשsignal משתנה. ' +
        'ספריות חיצוניות (SignalR, timers): כותבות ל-signals ישירות, ' +
        'Angular מזהה — אפס `NgZone.run(...)`. ' +
        'ב-TaskForge (פרק 24): `BoardConnection` כתב `_issues.update(...)` ב-callback של SignalR ישירות.',
    },
  ],

  /* ------------------------------------------------------------------ */
  proveIt: [
    {
      title: 'עקבו אחרי POST /api/issues ב-Network tab ומצאו 201 + Location',
      body:
        'פתחו את TaskForge (demo@taskforge.dev / Passw0rd!). ' +
        'פתחו DevTools, לשונית Network, סננו ל-"issues". ' +
        'צרו issue חדש. ' +
        'מצאו את בקשת ה-POST. ' +
        'בדקו שה-status הוא `201 Created`. ' +
        'בדקו שב-Response Headers יש `Location: /api/issues/<id>`. ' +
        'פתחו את ה-Response body — אמור להיות `IssueResponse` מלא עם ה-`id` האמיתי.',
      expect:
        '`201 Created`, `Location: /api/issues/<id>`, ' +
        'body = `{"id": <n>, "title": "...", "status": "Open", ...}`. ' +
        'ה-id ב-Location זהה ל-id ב-body.',
    },
    {
      title: 'מצאו את ה-`IIssueRepository` seam בעץ הקבצים של ה-snapshot',
      body:
        'פתחו את עץ הקבצים של ה-snapshot (פרק 11 בסרגל הצד, "App Tree"). ' +
        'נווטו ל-`server/TaskForge.Core/Abstractions/`. ' +
        'פתחו `IIssueRepository.cs`. ' +
        'ספרו: כמה methods יש ב-interface? ' +
        'נווטו ל-`server/TaskForge.Infrastructure/Repositories/EfIssueRepository.cs` — ' +
        'וודאו שהוא מממש את ה-interface (`:IIssueRepository`).',
      expect:
        '`IIssueRepository` מכיל לפחות `ListAsync`, `FindAsync`, `AddAsync`. ' +
        '`EfIssueRepository : IIssueRepository` — חתימת המחלקה כוללת את ה-interface.',
    },
    {
      title: 'הדגימו optimistic insert + rollback בידי שבירת ה-network',
      body:
        'פתחו DevTools, לשונית Network, לחצו על ה-throttling dropdown ובחרו "Offline". ' +
        'נסו ליצור issue חדש ב-TaskForge. ' +
        'שימו לב: הכרטיס מופיע מיד (optimistic). ' +
        'לאחר כמה שניות — הוא נעלם וטוסט שגיאה מופיע (rollback). ' +
        'החזירו את ה-network ל-"Online".',
      expect:
        'הכרטיס נוסף לרשימה מיד (לפני תשובת שרת). ' +
        'לאחר timeout/error: הכרטיס נמחק מהרשימה. ' +
        'טוסט שגיאה מופיע (מ-`errorInterceptor`). ' +
        'ה-id הזמני (שלילי) לא נשמר.',
    },
    {
      title: 'שרטטו את הטבעת בעל-פה — בלי לקרוא את הדף',
      body:
        'סגרו את המסך. ' +
        'קחו נייר. ' +
        'שרטטו 6 תיבות בטבעת: Component, Store, HTTP, Endpoint, Repository, DB. ' +
        'סמנו את 3 ה-seams. ' +
        'הסבירו בקול (עברית) את 6 הנקודות של ה-talk-track. ' +
        'פתחו את הדף ובדקו: מה שכחתם?',
      expect:
        'הסבר זורם ב-3-4 דקות ללא גמגום. ' +
        'כיסוי כל 6 נקודות: scope, חוזה, 3 שכבות שרת, 3 שכבות לקוח, קליק אחד, cross-cutting. ' +
        'ציון ה-seams: `IIssueRepository`, interceptor, DTO contract.',
    },
  ],

  /* ------------------------------------------------------------------ */
  exercise: {
    prompt:
      'הוסיפו vertical slice שלם לישות חדשה: `Comment` על `Issue`. ' +
      'כל issue יכול לקבל תגובות. ' +
      'ממשו את כל השכבות לפי אותם patterns שה-talk-track מתאר.',
    tasks: [
      'Backend entity: הוסיפו `Comment.cs` ל-`TaskForge.Core/Entities/` עם `Id`, `IssueId`, `AuthorId`, `Body`, `CreatedAt`. הוסיפו `ICommentRepository` ל-`TaskForge.Core/Abstractions/` עם `ListByIssueAsync` ו-`AddAsync`.',
      'Infrastructure: הוסיפו `EfCommentRepository : ICommentRepository` ב-`TaskForge.Infrastructure/Repositories/`. הוסיפו migration.',
      'Api: הוסיפו `MapGroup("/api/issues/{issueId}/comments")` עם `GET` (רשימה) ו-`POST` (יצירה, מחזיר 201 + Location). שימוש ב-`IsMemberAsync` לauthorization.',
      'Smoke test: הריצו `dotnet run` וואמתו `GET /api/issues/1/comments` וכן `POST /api/issues/1/comments` ב-`.http` file.',
      'Frontend store: הוסיפו `CommentsStore` ב-`core/state/comments.store.ts` עם `httpResource` ו-optimistic `add()`.',
      'Components: הוסיפו `comment-list.ts` (smart) שמזריק `CommentsStore`, ו-`comment-item.ts` (dumb) שמקבל `input.required<Comment>()`.',
      'Test: כתבו xUnit test ב-`CommentRepositoryTests.cs` שמאמת `ListByIssueAsync` ו-`AddAsync` ב-SQLite in-memory.',
    ],
    acceptance: [
      '`POST /api/issues/1/comments` מחזיר `201 Created` עם `Location: /api/issues/1/comments/<id>`.',
      '`GET /api/issues/1/comments` מחזיר רשימה כולל ה-comment שנוצר.',
      'ב-UI: תגובה חדשה מופיעה מיד (optimistic); אם ה-POST נכשל — נמחקת עם toast.',
      'xUnit test ירוק: `CommentRepositoryTests` עובר ב-`dotnet test`.',
      '`pnpm test` ו-`pnpm build`: ירוקים, אפס שגיאות.',
    ],
  },
};
