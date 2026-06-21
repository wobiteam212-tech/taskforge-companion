import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 04 — Projects & Issues API.
 * שכבת ה-HTTP מקבלת צורה מקצועית: DTOs כ-records, MapGroup, סינון ומיון ודפדוף,
 * TypedResults, ולידציה מובנית של ‎.NET 10, ProblemDetails, ו-OpenAPI שנוצר מהקוד.
 * הפיגומים של פרקים 01 ו-02 (LifetimeProbes, InMemoryProjectRepository) יורדים —
 * ה-seam שבנינו עושה את שלו.
 */
export const CH04_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 4.1 */
    {
      id: '4.1',
      title: 'החוזה לפני הקוד',
      blocks: [
        {
          kind: 'p',
          text:
            'לפני שכותבים שורת קוד — קוראים את החוזה. הסימולטור בפאנל מציג את ארבעת הבקשות ' +
            'שנבנה בפרק הזה: רשימת Issues עם סינון ומיון, יצירה עם ולידציה, כישלון ולידציה, ' +
            'ושגיאת 404 — כל אחת עם גוף JSON אחיד. ה-insight: עקביות בתגובות היא פיצ׳ר בפני עצמו.',
        },
        {
          kind: 'p',
          text:
            'שימו לב לשלושה דפוסים שיחזרו לאורך כל הפרק: גוף 400 בצורת ValidationProblem אחיד ' +
            '(מפרט RFC 9110), גוף 404 בצורת ProblemDetails, ותגובת 201 עם כותרת Location שמצביעה ' +
            'על המשאב שנוצר — בלי שירשרנו URL בידיים.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'חוזה HTTP אחיד מקל על כל צרכן: הקליינט Angular בפרק 11 יוכל לטפל בשגיאות במקום אחד ' +
            'בלי לבדוק אם ה-status הוא 400 או 422 ואיך נראה הגוף. ProblemDetails (RFC 7807) הוא ' +
            'הסטנדרט שכל ה-‎.NET ecosystem מכיר — ולכן ‎AddProblemDetails פועל בלי קוד נוסף.',
        },
      ],
      panel: {
        kind: 'simulator',
        scenario: {
          title: 'Issues API — ארבעה מקרי שימוש',
          blurb: 'סינון, יצירה, ולידציה ו-404 — כל תגובה בפורמט אחיד',
          requests: [
            {
              method: 'GET',
              path: '/api/projects/1/issues?status=Open&sort=priority',
              note: 'סינון לפי סטטוס ומיון לפי עדיפות — query string על IssueListParams',
            },
            {
              method: 'POST',
              path: '/api/projects/1/issues',
              body: '{"title":"Add dark mode toggle","priority":"High"}',
              note: '201 + Location header',
            },
            {
              method: 'POST',
              path: '/api/projects/1/issues',
              body: '{"title":""}',
              note: 'כותרת ריקה — 400 ValidationProblem לפני ה-handler',
            },
            {
              method: 'GET',
              path: '/api/issues/999',
              note: 'Issue שלא קיים — 404 ProblemDetails',
            },
          ],
          responses: [
            {
              status: 200,
              title: 'PagedResult עם Issue אחד ותוויות',
              body: JSON.stringify(
                {
                  items: [
                    {
                      id: 2,
                      title: 'New hero section',
                      description: 'Design and ship the new landing hero',
                      status: 'Open',
                      priority: 'High',
                      projectId: 1,
                      createdAtUtc: '2026-06-10T09:14:13Z',
                      labels: [{ id: 2, name: 'feature', color: '#2dd4bf' }],
                    },
                  ],
                  total: 1,
                  page: 1,
                  pageSize: 20,
                  totalPages: 1,
                },
                null,
                2,
              ),
            },
            {
              status: 201,
              title: 'Issue נוצר — Location: /api/issues/7',
              body: JSON.stringify(
                {
                  id: 7,
                  title: 'Add dark mode toggle',
                  description: null,
                  status: 'Open',
                  priority: 'High',
                  projectId: 1,
                  createdAtUtc: '2026-06-10T12:00:00Z',
                  labels: [],
                },
                null,
                2,
              ),
            },
            {
              status: 400,
              title: 'ValidationProblem — כותרת קצרה מדי',
              body: JSON.stringify(
                {
                  type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
                  title: 'One or more validation errors occurred.',
                  status: 400,
                  errors: {
                    Title: [
                      'The field Title must be a string with a minimum length of 3 and a maximum length of 200.',
                    ],
                  },
                },
                null,
                2,
              ),
            },
            {
              status: 404,
              title: 'ProblemDetails — Issue 999 לא קיים',
              body: JSON.stringify(
                {
                  type: 'https://tools.ietf.org/html/rfc9110#section-15.5.5',
                  title: 'Not Found',
                  status: 404,
                },
                null,
                2,
              ),
            },
          ],
          insight: 'עקביות תגובות = פיצ׳ר: קליינט אחד מטפל בכל השגיאות במקום אחד',
        },
      },
    },

    /* ------------------------------------------------------------ 4.1b */
    {
      id: '4.1b',
      title: 'מפת הזרימה של בקשת API',
      blocks: [
        {
          kind: 'p',
          text:
            'לפני שנצלול לקבצים, כדאי לראות את המסלול כולו: routing בוחר endpoint, binding בונה פרמטרים, ' +
            'validation עוצר קלט לא תקין, filter מודד את ה-handler, וה-handler מחזיר TypedResults.',
        },
        {
          kind: 'p',
          text:
            'זה המודל שיעזור לכם לקרוא את שאר הפרק. כל קובץ שנפתח אחר כך יושב על תחנה אחרת במסלול הזה, ' +
            'ולכן קל יותר להבין למה הוא קיים.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'איפה בדיוק נולדת תשובת 400 בפרק הזה?',
          body:
            'היא נולדת לפני ה-handler, בשלב ה-validation של הקלט שנקשר ל-DTO. לכן handler לא צריך לבדוק ידנית ' +
            'אם title ריק או pageSize מחוץ לטווח.',
        },
      ],
      panel: {
        kind: 'diagram',
        caption: 'בקשה אחת עוברת תחנות קבועות לפני שהיא הופכת לתגובה.',
        mermaid: `flowchart LR
  Request["HTTP request"]
  Routing["Routing chooses endpoint"]
  Binding["Binding builds params"]
  Validation[".NET 10 validation"]
  Filter["Endpoint filter"]
  Handler["Typed handler"]
  Response["ProblemDetails / TypedResults"]
  Request --> Routing --> Binding --> Validation --> Filter --> Handler --> Response`,
      },
    },

    /* ------------------------------------------------------------ 4.2 */
    {
      id: '4.2',
      title: 'JSON אחיד: enum כטקסט',
      blocks: [
        {
          kind: 'p',
          text:
            'ברירת המחדל של ‎System.Text.Json היא לסדרת enum כמספר שלם — ‏`"status": 0` במקום ' +
            '`"status": "Open"`. זה שביר: שינוי סדר הערכים בקוד שובר קליינטים קיימים. ' +
            'שלוש שורות ב-Program.cs מתקנות את זה בכל ה-API בבת אחת.',
        },
        { kind: 'h', text: 'מה עושות השלוש שורות' },
        {
          kind: 'ul',
          items: [
            '`ConfigureHttpJsonOptions` — מגדיר את ה-JsonSerializerOptions שמנוע ה-Minimal API משתמש בו לסדר תגובות ולקרוא גופי בקשות. זה שונה מ-`AddJsonOptions` שמשרת MVC/Razor.',
            '`JsonStringEnumConverter` — ממיר enum בסדרה לשמו כמחרוזת ובקריאה מקבל מחרוזת. ‏"Open" משני הכיוונים.',
            'הקוד בפאנל הוא region `step-4.2` מ-Program.cs — שורה אחת עם lambda קצרה.',
          ],
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            'אם מגדירים גם `AddJsonOptions` (עבור MVC) וגם `ConfigureHttpJsonOptions` (Minimal API) — ' +
            'הם מוחזקים בנפרד. תוספת converter לאחד לא משפיעה על השני. בפרויקט Minimal API טהור ' +
            'כמו שלנו אין MVC בכלל, אז `ConfigureHttpJsonOptions` הוא הכתובת הנכונה.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'רוצים שם שם מסוים ב-JSON שונה משם ה-enum בקוד? הוסיפו `[EnumMember(Value = "in-progress")]` ' +
            'על הערך. ‏JsonStringEnumConverter מכבד את ה-attribute כשמשתמשים ב-`JsonStringEnumConverter<T>` ' +
            'הגנרי החדש של ‎.NET 8+.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch04',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-4.2',
      },
    },

    /* ------------------------------------------------------------ 4.3 */
    {
      id: '4.3',
      title: 'PagedResult — חוזה הדפדוף',
      blocks: [
        {
          kind: 'term',
          name: 'Pagination',
          definition:
            'חלוקת רשימה גדולה לעמודים קטנים: הקליינט מבקש עמוד N בגודל K, השרת שולח K פריטים ' +
            'וגם את המספרים שדרושים לציור הניווט (סה"כ פריטים, סה"כ עמודים). ' +
            'מונע העמסת מאות שורות בתשובה אחת ומקטין זמן טעינה.',
        },
        {
          kind: 'p',
          text:
            '`server/TaskForge.Core/Common/PagedResult.cs` — record גנרי שמחזיק את כל מה שקליינט ' +
            'צריך לצייר ניווט עמודים. הוא גר ב-Core כי הוא חוזה דומיין, לא פרט מימוש HTTP.',
        },
        { kind: 'h', text: 'פירוק שורה-שורה' },
        {
          kind: 'ul',
          items: [
            '`sealed record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize)` — primary constructor; ארבעה פרמטרים שמייצגים מה קיבלת (Items, Page, PageSize) ומה קיים בסה"כ (Total).',
            '`IReadOnlyList<T>` במקום `List<T>` — מונע שינוי מחוץ לריפוסיטורי; מי שמקבל את ה-record לא יכול להוסיף לו פריטים.',
            '`TotalPages => (int)Math.Ceiling((double)Total / PageSize)` — computed property בגוף ה-record: נגזר מהשאר, לא מאוחסן. ‏Ceiling כדי ששאריות מקבלות עמוד נוסף (7 פריטים בגודל 5 = 2 עמודים).',
          ],
        },
        {
          kind: 'callout',
          tone: 'alt',
          body:
            'גישה חלופית: Cursor Pagination — במקום מספר עמוד, הקליינט שולח "אחרי ID X". ' +
            'יעיל יותר על טבלאות גדולות (אין COUNT יקר, אין בעיות עמוד קופץ עם הכנסות), ' +
            'אבל קשה יותר לממש ולא תומך בקפיצה לעמוד שרירותי. Offset Pagination כמו שלנו ' +
            'מתאים לגודל של TaskForge ופשוט הרבה יותר להסביר.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch04',
        file: 'server/TaskForge.Core/Common/PagedResult.cs',
      },
    },

    /* ------------------------------------------------------------ 4.4 */
    {
      id: '4.4',
      title: 'חוזה השאילתה: IIssueRepository',
      blocks: [
        {
          kind: 'p',
          text:
            'שני קבצים גרים ב-`server/TaskForge.Core/Abstractions/`: ‏`IssueQuery` — record שמתאר ' +
            'כל מה שאפשר לסנן, למיין ולדפדוף — ו-`IIssueRepository` עם חמש מתודות. ' +
            'הגדרת ה-query כ-record במקום כחמישה פרמטרים נפרדים היא ההחלטה המעצבת של ה-API הפנימי.',
        },
        { kind: 'h', text: 'IssueQuery — record עם ברירות מחדל' },
        {
          kind: 'ul',
          items: [
            '`IssueStatus? Status = null` — פרמטר אופציונלי; כש-null לא מסננים לפי סטטוס.',
            '`string Sort = "-created"` — מינוס לפני שם השדה = יורד; מוסכמה שמגיעה מעולם REST.',
            '`int Page = 1, int PageSize = 20` — ברירות מחדל עסקיות שמוצהרות בדומיין, לא בשכבת ה-HTTP.',
            '`UpdateAsync(int id, Action<Issue> apply)` — עיצוב ייחודי: במקום להעביר DTO לריפוסיטורי, מעבירים delegate שיודע לשנות את הישות. ה-Change Tracker (מפרק 03) עושה את השאר.',
          ],
        },
        {
          kind: 'p',
          text: 'שני ה-seams החדשים נרשמים בקובץ `server/TaskForge.Api/Program.cs`, region `step-4.4`:',
        },
        {
          kind: 'code',
          lang: 'csharp',
          title: 'Program.cs — רישום שני הריפוסיטוריז',
          code: `builder.Services.AddScoped<IProjectRepository, EfProjectRepository>();
builder.Services.AddScoped<IIssueRepository, EfIssueRepository>();`,
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה `Action<Issue>` ולא `UpdateIssueRequest` בחתימת `UpdateAsync`? כי הריפוסיטורי ' +
            'לא אמור לדעת על DTOs של ה-HTTP layer — הם שייכים ל-Api. ‏Action מספקת גמישות: ' +
            'כל קורא של הממשק מחליט מה לשנות, בלי שהחוזה יתחייב למבנה בקשה ספציפי.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch04',
        file: 'server/TaskForge.Core/Abstractions/IIssueRepository.cs',
      },
    },

    /* ------------------------------------------------------------ 4.5 */
    {
      id: '4.5',
      title: 'שאילתה דינמית, SQL אחד',
      blocks: [
        {
          kind: 'term',
          name: 'Deferred Execution',
          definition:
            'הרעיון שביטוי LINQ על IQueryable הוא תיאור של שאילתה — לא ביצועה. ' +
            'כל Where, OrderBy ו-Skip שמוסיפים מצטברים לעץ ביטויים, ' +
            'ורק ToListAsync / CountAsync מתרגמים אותו ל-SQL ושולחים לשרת.',
        },
        {
          kind: 'p',
          text:
            'המתודה `GetPagedAsync` ב-`EfIssueRepository` בונה שאילתה שלב-שלב על IQueryable — ' +
            'כל סינון מצטרף רק אם נתבקש. בסוף שני round-trips ל-DB: COUNT ואז עמוד אחד.',
        },
        { kind: 'h', text: 'פירוק שורה-שורה' },
        {
          kind: 'ul',
          items: [
            '`var issues = db.Issues.AsNoTracking().Where(i => i.ProjectId == query.ProjectId)` — נקודת ההתחלה: כל ה-Issues של הפרויקט, ללא מעקב (קריאה בלבד).',
            '`if (query.Status is { } status)` — is pattern עם pattern variable: בודק ש-Status אינו null ומחלץ את הערך לתוך `status` בשורה אחת. נקי יותר מ-`!= null && status = query.Status.Value`.',
            '`EF.Functions.Like(i.Title, $"%{query.Search}%")` — חיפוש חלקי שמתורגם ל-LIKE ב-SQL. לא Contains — כי Contains לא תמיד מתורגם אופטימלית בכל ספק.',
            'switch-expression על Sort — `"created"`, `"title"`, `"priority"` (יורד לפי IssuePriority ואז עולה לפי תאריך), וברירת המחדל `"-created"`. ביטוי אחד, ארבעה מקרים.',
            '`var total = await issues.CountAsync()` — COUNT לפני הדפדוף: ה-query הקיים כבר עם כל הסינונים. שאילתה רזה שמחזירה מספר אחד.',
            '`.Skip((query.Page - 1) * query.PageSize).Take(query.PageSize)` — הדפדוף עצמו; Skip/Take מתורגמים ל-OFFSET/FETCH.',
            '`.Include(i => i.Labels)` אחרי Take — טוענים את התוויות רק לפריטים שבעמוד, לא לכולם. אם שמנו Include לפני Skip/Take, EF יטען תוויות לכל Issues של הפרויקט ואז יחתוך — גרוע.',
          ],
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            'Include לפני paging: EF Core ישלח SQL שמביא את כל הישויות עם תוויות ואז יחתוך בזיכרון — ' +
            'או יתריע. לאחר Skip/Take: COUNT נשלח בלי Include (מהיר), ואז השאילתה השנייה מביאה ' +
            'רק את פריטי העמוד ותוויותיהם. אם שכחתם — גם את Include שמים אחרי Take.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch04',
        file: 'server/TaskForge.Infrastructure/Repositories/EfIssueRepository.cs',
        region: 'step-4.5',
      },
    },

    /* ------------------------------------------------------------ 4.6 */
    {
      id: '4.6',
      title: 'כתיבה: עדכון במעקב ומחיקה ישירה',
      blocks: [
        {
          kind: 'p',
          text:
            'שלוש מתודות הכתיבה מדגימות שלושה דפוסים שונים: AddAsync מסתמך על EF לקרוא את ה-Id, ' +
            '‏UpdateAsync משתמש בChange Tracker מפרק 03, ו-DeleteAsync שולח DELETE ישיר לבסיס הנתונים.',
        },
        { kind: 'h', text: 'פירוק שורה-שורה' },
        {
          kind: 'ul',
          items: [
            '`db.Issues.Add(issue); await db.SaveChangesAsync(); return issue` — אחרי SaveChanges, ‏EF אכלס את `issue.Id` בערך שה-DB הקצה. לכן מחזירים את אותו אובייקט — הוא עכשיו עם Id חוקי.',
            'UpdateAsync — טוענים עם Include Labels ועם מעקב (בלי AsNoTracking), מפעילים `apply(issue)`, ושומרים. ה-Change Tracker מזהה בדיוק אילו עמודות השתנו ושולח UPDATE רזה.',
            '`ExecuteDeleteAsync()` — הנחיית SQL ישירה; לא טוענת את הישות לזיכרון, פשוט מוחקת. מחזירה כמה שורות נמחקו. `> 0` הופך לבוליאן: true = נמחקה, false = לא נמצאה.',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ההבדל בין Remove ל-ExecuteDeleteAsync ומתי כל אחד נכון?',
          body: [
            '`Remove` דורש טעינת הישות לזיכרון, סימונה Deleted ב-Change Tracker, ושמירה עם SaveChanges — שלושה round-trips (Select, DELETE, אולי Commit). נכון כשיש cascade בזיכרון (אוספים שצריך לנקות), change events, או business logic לפני המחיקה.',
            '`ExecuteDeleteAsync` שולח DELETE ישיר ב-SQL אחד — לא טוען, לא מעדכן tracker. מהיר ויעיל. נכון לכל מחיקה פשוטה שלא צריכה לעבור דרך הישות.',
            'כלל אצבע: ExecuteDeleteAsync לבודדים וב-bulk; Remove כשיש לוגיקה שתלויה בישות.',
          ],
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch04',
        file: 'server/TaskForge.Infrastructure/Repositories/EfIssueRepository.cs',
        region: 'step-4.6',
      },
    },

    /* ------------------------------------------------------------ 4.7 */
    {
      id: '4.7',
      title: 'DTOs כ-records: החוזה על הקו',
      blocks: [
        {
          kind: 'term',
          name: 'DTO',
          definition:
            'Data Transfer Object — אובייקט שנועד לנוע בין שכבות או מעל הרשת. ' +
            'הוא אינו ישות: אין לו זהות, אין לו לוגיקה עסקית, ואין לו תלות ב-EF. ' +
            'מפריד בין מה שה-DB יודע לבין מה שהקליינט רואה.',
        },
        {
          kind: 'term',
          name: 'Record',
          definition:
            'סוג reference ב-C# שמובנה לאי-שינוי ולשוויון לפי ערך (לא לפי זהות). ' +
            'primary constructor יוצר properties אוטומטיים, ו-with-expression מייצר עותק עם שינוי. ' +
            'אידיאלי ל-DTOs: קצר, immutable, ושוויון רלוונטי לבדיקות.',
        },
        {
          kind: 'p',
          text:
            'קובץ `server/TaskForge.Api/Contracts/IssueContracts.cs` מגדיר את כל ה-DTOs של Issues. ' +
            'הם מכוונים לכיוון ה-HTTP ולא לכיוון הדומיין — ולכן הם גרים ב-Api ולא ב-Core.',
        },
        { kind: 'h', text: 'פירוק שורה-שורה' },
        {
          kind: 'ul',
          items: [
            '`[property: Required, StringLength(200, MinimumLength = 3)]` — attributes על ה-property שנוצר מה-primary constructor. הסינטקס `property:` מכוון את ה-attribute ל-property ולא לפרמטר.',
            '`IssuePriority Priority = IssuePriority.Medium` — ברירת מחדל בבקשת היצירה: לא מוצהרת, ה-Issue נוצר בעדיפות בינונית.',
            '`UpdateIssueRequest` דורש `Status` בנוסף לשאר — עדכון מלא (PUT) חייב לכלול את המצב הרצוי.',
            '`IssueResponse.FromEntity(Issue issue)` — static factory method שממפה מישות ל-DTO. הלוגיקה של המיפוי גרה על ה-DTO עצמו, לא מפוזרת ב-handlers.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה לא להחזיר את ישות ה-Issue ישירות כ-JSON? כי היא חושפת יותר ממה שצריך, ' +
            'מצמידה את חוזה ה-HTTP לסכמת ה-DB, ומחזירה navigation properties שיכולים לגרום ' +
            'ל-circular reference. ה-DTO הוא ממשק מוצהר — שינוי הדומיין לא שובר קליינטים.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch04',
        file: 'server/TaskForge.Api/Contracts/IssueContracts.cs',
      },
    },

    /* ------------------------------------------------------------ 4.8 */
    {
      id: '4.8',
      title: '[AsParameters]: שישה פרמטרים, אובייקט אחד',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-handler של `GetIssues` צריך שישה ערכי query string (status, priority, search, sort, page, pageSize). ' +
            'שישה פרמטרים בחתימה אחת זה רעשן ושביר. ‏`[AsParameters]` על record אחד פותר את זה.',
        },
        { kind: 'h', text: 'מקורות הקשירה (binding sources)' },
        {
          kind: 'ul',
          items: [
            'Route (`{id:int}`) — `int id` בחתימה; ‏Minimal API מוצא לפי שם.',
            'Query string — כל פרמטר פשוט שאינו בנתיב ואינו שירות; אצלנו Status, Priority, Search וכו\'.',
            'Body (`[FromBody]`) — ברירת המחדל לאובייקטים מורכבים ב-POST/PUT; ‏CreateIssueRequest נקשר מ-JSON.',
            'Services (DI) — `IIssueRepository`, `IProjectRepository`, `CancellationToken` — כולם מוזרקים אוטומטית.',
            '`[AsParameters] IssueListParams query` — מנחה את מנגנון ה-binding לפרק את האובייקט ולקשור כל property בנפרד ממקורו. הוולידציה של ‎.NET 10 רצה על properties האלו כמו על כל פרמטר ישיר.',
          ],
        },
        {
          kind: 'callout',
          tone: 'dotnet10',
          body:
            'ב-‎.NET 10 הוולידציה המובנית (`AddValidation()`) רצה גם על record שנקשר עם `[AsParameters]`. ' +
            'כלומר `[Range(1, 100)]` על `PageSize` נבדק לפני ה-handler — pageSize=999 מקבל 400 ValidationProblem ' +
            'בלי שורת קוד בhandler עצמו.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch04',
        file: 'server/TaskForge.Api/Contracts/IssueContracts.cs',
        region: 'step-4.8',
      },
    },

    /* ------------------------------------------------------------ 4.9 */
    {
      id: '4.9',
      title: 'ולידציה של ‎.NET 10: שורה אחת',
      blocks: [
        {
          kind: 'p',
          text:
            'בגרסאות קודמות של Minimal API הוולידציה דרשה פילטר ידני, middleware, או ספרייה חיצונית. ' +
            'ב-‎.NET 10 שורה אחת בהגדרות מוסיפה ולידציה אוטומטית לכל ה-DTOs שמסומנים ב-DataAnnotations.',
        },
        {
          kind: 'callout',
          tone: 'dotnet10',
          body:
            '`builder.Services.AddValidation()` — חדש ב-‎.NET 10. הוולידציה רצה לפני ה-handler, ' +
            'ללא קוד נוסף. כישלון מחזיר 400 ValidationProblem עם מפת שגיאות לפי שם השדה.',
        },
        { kind: 'h', text: 'איך נראית תגובת ה-400' },
        {
          kind: 'code',
          lang: 'json',
          title: 'ValidationProblem — כותרת קצרה מדי',
          code: `{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Title": [
      "The field Title must be a string with a minimum length of 3 and a maximum length of 200."
    ]
  }
}`,
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'איפה נכון לולידציה לחיות ולמה לא בתוך ה-handler?',
          body: [
            'שלוש שכבות אפשריות: handler, service, ו-cross-cutting (framework). ב-handler — נוח לתחילת דרך אבל הלוגיקה מתחבלת עם ולידציה: כל handler מכיל if-blocks שאינם עסקיים.',
            'ב-service — נכון לכללים עסקיים (האם Project קיים? האם Title כבר תפוס?) שדורשים DB.',
            'כ-cross-cutting (AddValidation) — נכון לכללים סינטקטיים (Required, StringLength, Range) שלא צריכים הקשר עסקי. ‏Handler מקבל רק קלט תקין; קוד ה-handler נקי.',
            'כלל: מה שה-schema יודע — AddValidation. מה שה-domain יודע — service. אל תכניסו DB-calls לוולידציה שבשכבת ה-HTTP.',
          ],
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch04',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-4.9',
      },
    },

    /* ------------------------------------------------------------ 4.10 */
    {
      id: '4.10',
      title: 'ProblemDetails בכל מקום',
      blocks: [
        {
          kind: 'p',
          text:
            'שתי שורות ב-pipeline הופכות כל שגיאה ל-ProblemDetails אחיד — הסטנדרט RFC 7807 ' +
            'שהוגדר ב-ch00. ‏`AddProblemDetails` (בהגדרות) מגדיר את ה-formatter; ' +
            '`UseExceptionHandler` ו-`UseStatusCodePages` (ב-pipeline) משתמשים בו.',
        },
        {
          kind: 'code',
          lang: 'csharp',
          title: 'Program.cs — שורת הרישום',
          code: `builder.Services.AddProblemDetails();`,
        },
        { kind: 'h', text: 'מה כל אחד מטפל בו' },
        {
          kind: 'ul',
          items: [
            '`UseExceptionHandler()` — ‏exception לא מטופלת נתפסת, מוגדרת ל-500, ומוגשת כ-ProblemDetails. הסטאק טרייס נמחק מהתגובה (הוא בלוג, לא ב-HTTP).',
            '`UseStatusCodePages()` — כל תגובת סטטוס שאין לה גוף (כמו 404 של ה-routing — "לא נמצא route כלל") מקבלת גוף ProblemDetails אחיד. שונה מ-NotFound() שה-handler שלנו מחזיר — זה הCatch-all.',
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'שני ה-middleware האלו חייבים לבוא לפני כל ה-endpoints — הסדר בפאנל מכוון. ' +
            'ב-Development ‎.NET מוסיף גם Developer Exception Page שמחזיר פרטי exception — ' +
            'אבל בProduction שני האמצעים האלו שומרים על הצרכן מקבל ProblemDetails ולא HTML של שגיאה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch04',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-4.10',
      },
    },

    /* ------------------------------------------------------------ 4.11 */
    {
      id: '4.11',
      title: 'קבוצה אחת, קובץ אחד לפיצ׳ר',
      blocks: [
        {
          kind: 'p',
          text:
            'כל ה-endpoints של Issues גרים בקובץ `server/TaskForge.Api/Endpoints/IssueEndpoints.cs` ' +
            'ונרשמים דרך extension method אחת. ‏`MapGroup` מגדיר prefix, tag ופילטר פעם אחת לכולם.',
        },
        { kind: 'h', text: 'עיצוב הנתיבים: מקונן מול שטוח' },
        {
          kind: 'ul',
          items: [
            '`/api/projects/{projectId:int}/issues` — רשימה ויצירה. הנתיב המקונן מבהיר: "אלה ה-Issues של הפרויקט הזה". ‏projectId הוא חלק מהזהות של האוסף.',
            '`/api/issues/{id:int}` — קריאה, עדכון, מחיקה. שטוח — כי Issue בודד מזוהה ב-Id שלו בלי צורך בפרויקט. כל API שמשנה Issue יכול ישר לגשת לנתיב הזה.',
            '`{id:int}` ו-`{projectId:int}` — route constraints: בקשה עם id=abc לא תגיע לhandler בכלל.',
            '`.WithTags("Issues")` — tag משותף לכל הקבוצה: ‏OpenAPI יקבץ אותם יחד במסמך.',
            '`.AddEndpointFilter<HandlerTimingFilter>()` — פילטר אחד לכל הקבוצה, ה-handler מקבל X-Handler-Ms בכל תשובה.',
          ],
        },
        {
          kind: 'callout',
          tone: 'alt',
          body:
            'אפשר לקנן עמוק יותר: `MapGroup("/api/projects/{projectId:int}").MapGroup("/issues")`. ' +
            'אבל אצלנו שתי הרמות (פרויקט ו-issue בודד) הן כתובות שונות עם סמנטיקה שונה — ' +
            'שתי קבוצות ב-prefix `/api` אחד עם RegEx ידני היה מסובך. הניסוח הנוכחי קריא יותר.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch04',
        file: 'server/TaskForge.Api/Endpoints/IssueEndpoints.cs',
        region: 'step-4.11',
      },
    },

    /* ------------------------------------------------------------ 4.12 */
    {
      id: '4.12',
      title: 'Handlers עם חתימה שמדברת',
      blocks: [
        {
          kind: 'p',
          text:
            'הhandlers הם static methods בעלי שם — לא lambdas אנונימיות. החתימה שלהם מוצהרת ' +
            'עם `Results<T1, T2>`: אוניון של סטטוסים אפשריים. המהדר אוכף שכל מסלול יציאה ' +
            'מוצהר, ו-OpenAPI קורא את האוניון לבד.',
        },
        { kind: 'h', text: 'TypedResults לעומת Results' },
        {
          kind: 'ul',
          items: [
            '`TypedResults.Ok(...)` — מחזיר `Ok<T>` (טיפוס ספציפי); ‏OpenAPI יודע שה-200 מחזיר T.',
            '`Results.Ok(...)` — מחזיר `IResult` (ממשק בסיס); ‏OpenAPI לא יודע מה בגוף בלי תיאור ידני.',
            '`TypedResults.NotFound()` — `NotFound` ללא גנרי; מספיק כי אין גוף מבני.',
            '`TypedResults.CreatedAtRoute(body, "GetIssueById", new { id })` — מייצר 201 + כותרת Location שמצביעה על ה-route בשם `GetIssueById` עם ה-routeValues. ‏`WithName("GetIssueById")` על ה-endpoint הוא ה-"עמוד הכתובת" שCreatedAtRoute מחפש.',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה TypedResults עדיף על Results.Ok ומה זה נותן ל-OpenAPI?',
          body: [
            'TypedResults מחזיר טיפוס קונקרטי (Ok<T>, NotFound, CreatedAtRoute<T>) — המהדר יכול לבדוק שהחתימה Results<Ok<T>,NotFound> מתאימה למה שה-handler מחזיר בפועל.',
            'Results.Ok מחזיר IResult — שניהם עובדים בזמן ריצה, אבל בזמן קומפילציה אין בדיקה. OpenAPI ייצר schema ריק עבור body שלא ידוע.',
            'עם TypedResults ו-Results<...> ה-OpenAPI generator מפיק schema מלא: 200 עם T, 404, 201 עם Location — תיעוד חי שנכתב על ידי ה-IDE, לא על ידך.',
          ],
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch04',
        file: 'server/TaskForge.Api/Endpoints/IssueEndpoints.cs',
        region: 'step-4.12',
      },
    },

    /* ------------------------------------------------------------ 4.13 */
    {
      id: '4.13',
      title: 'Endpoint Filter: עוטף את ה-handler בלבד',
      blocks: [
        {
          kind: 'term',
          name: 'Endpoint Filter',
          definition:
            'רכיב ש"עוטף" handler בודד או קבוצת handlers — לפני ואחרי ביצועם. ' +
            'שונה מ-middleware שעוטף את כל ה-pipeline: פילטר רואה את הפרמטרים שכבר עוצבו, ' +
            'יכול לשנות את התגובה, ורץ בתוך הstack של ה-endpoint עצמו.',
        },
        {
          kind: 'p',
          text:
            '`server/TaskForge.Api/Filters/HandlerTimingFilter.cs` מודד את זמן ריצת ה-handler ' +
            '(ו-filters שאחריו בשרשרת) ומוסיף `X-Handler-Ms` לתגובה. ' +
            'ב-ch01 הוספנו `X-Elapsed-Ms` ב-middleware — ההפרש בין השניים חושף כמה זמן נבלע ' +
            'ב-routing, binding ו-middleware מסביב.',
        },
        { kind: 'h', text: 'פירוק שורה-שורה' },
        {
          kind: 'ul',
          items: [
            '`IEndpointFilter` — ממשק עם מתודה אחת: `InvokeAsync(context, next)`.',
            '`var result = await next(context)` — קריאה ל-handler (או לפילטר הבא בשרשרת). כל מה שלפני = before hook; כל מה שאחרי = after hook.',
            '`context.HttpContext.Response.Headers.Append(...)` — ה-HttpContext זמין בContext; מוסיפים header לתגובה שכבר הוחלה.',
            'הרישום ב-`MapIssueEndpoints` הוא `.AddEndpointFilter<HandlerTimingFilter>()` על הקבוצה — אחד לכולם.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'מתי פילטר עדיף על middleware? כשהלוגיקה שייכת לפיצ׳ר ספציפי ולא לכל הצינור. ' +
            'Auth headers, rate limiting, logging כללי — middleware. ' +
            'מדידת זמן handler, ולידציה עסקית של endpoint ספציפי, עשרת הדברים שרלוונטיים ' +
            'רק ל-Issues — פילטר.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch04',
        file: 'server/TaskForge.Api/Filters/HandlerTimingFilter.cs',
      },
    },

    /* ------------------------------------------------------------ 4.14 */
    {
      id: '4.14',
      title: 'הקרנה: ProjectSummary ב-SQL אחד',
      blocks: [
        {
          kind: 'term',
          name: 'Projection',
          definition:
            'בחירת subset של שדות ממסד הנתונים — לא הישות המלאה. ' +
            'EF Core מתרגם `Select(p => new X(...))` ל-SELECT עם עמודות ספציפיות בלבד; ' +
            'הנתונים שלא נבחרו לא עוברים ברשת.',
        },
        {
          kind: 'p',
          text:
            'מסך רשימת הפרויקטים צריך שלושה שדות של הפרויקט וספירת Issues פתוחים. ' +
            'הגישה הנאיבית: טעינת כל Projects עם Include(Issues) וספירה בזיכרון. ' +
            'הגישה הנכונה: Select לתוך record, עם COUNT מקונן ב-SQL.',
        },
        { kind: 'h', text: 'שני הקבצים החדשים' },
        {
          kind: 'ul',
          items: [
            '`server/TaskForge.Core/Common/ProjectSummary.cs` — record קטן עם ארבעה שדות: Id, Name, Description?, OpenIssues. גר ב-Core כי הוא חוזה דומיין.',
            '`server/TaskForge.Core/Abstractions/IProjectRepository.cs` — קיבל `GetSummariesAsync` (מחזיר `IReadOnlyList<ProjectSummary>`), `AddAsync` ו-`ExistsAsync`. ‏ExistsAsync חשוב: הGET /api/projects/{id}/issues מוודא שהפרויקט קיים לפני שמחפש Issues.',
            '`p.Issues.Count(i => i.Status != IssueStatus.Done)` בתוך Select — EF מתרגם לSUBQUERY עם COUNT. ה-Issues לא נטענים לזיכרון לעולם.',
            'הקוד נמצא ב-region `step-4.14` של `server/TaskForge.Infrastructure/Repositories/EfProjectRepository.cs`.',
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'רוצים לראות את ה-SQL שנוצר? הוסיפו `EnableSensitiveDataLogging()` ו-`LogTo(Console.WriteLine)` ' +
            'להגדרות ה-DbContext. בפרודקשן — כבו; בפיתוח — כלי אבחון שאין תחתיו.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch04',
        file: 'server/TaskForge.Infrastructure/Repositories/EfProjectRepository.cs',
        region: 'step-4.14',
        diff: true,
        title: 'מה שהשתנה בפרק הזה — מודגש',
      },
    },

    /* ------------------------------------------------------------ 4.15 */
    {
      id: '4.15',
      title: 'ProjectEndpoints: אותם דפוסים, פיצ׳ר שני',
      blocks: [
        {
          kind: 'p',
          text:
            '`server/TaskForge.Api/Endpoints/ProjectEndpoints.cs` מדגיש חזרה: אותם דפוסים ' +
            'שלמדנו ב-IssueEndpoints — MapGroup, named handlers, TypedResults, CreatedAtRoute — ' +
            'עכשיו על Projects. חזרה מצמידה את הדפוס לזיכרון שרירי.',
        },
        {
          kind: 'p',
          text:
            'החוזה של Projects מוגדר ב-`server/TaskForge.Api/Contracts/ProjectContracts.cs`. ' +
            'שני records פשוטים — שני כיוונים:',
        },
        {
          kind: 'code',
          lang: 'csharp',
          title: 'server/TaskForge.Api/Contracts/ProjectContracts.cs — החתימות',
          code: `public sealed record CreateProjectRequest(
    [property: Required, StringLength(120, MinimumLength = 2)] string Name,
    [property: StringLength(2000)] string? Description);

public sealed record ProjectResponse(
    int Id, string Name, string? Description, DateTime CreatedAtUtc)
{
    public static ProjectResponse FromEntity(Project project) =>
        new(project.Id, project.Name, project.Description, project.CreatedAtUtc);
}`,
        },
        { kind: 'h', text: 'מה שונה מ-IssueEndpoints' },
        {
          kind: 'ul',
          items: [
            'אין `[AsParameters]` כי אין query string מורכב — רק id בנתיב.',
            'אין `IProjectRepository` guard בפעולות על פרויקט בודד — הפרויקט עצמו הוא המשאב.',
            '`GetProjects` מחזיר `Ok<IReadOnlyList<ProjectSummary>>` — תוצאת ה-projection; לא `List<Project>`.',
          ],
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch04',
        file: 'server/TaskForge.Api/Endpoints/ProjectEndpoints.cs',
      },
    },

    /* ------------------------------------------------------------ 4.16 */
    {
      id: '4.16',
      title: 'הפיגומים יורדים',
      blocks: [
        {
          kind: 'p',
          text:
            'שני קבצים שסיימו את תפקידם מוסרים בפרק הזה. ' +
            '`server/TaskForge.Api/Services/LifetimeProbes.cs` — שירות הDI מפרק 01 שהראה ' +
            'lifetimes — יורד כי ה-API האמיתי החליף אותו. ' +
            '`server/TaskForge.Infrastructure/Repositories/InMemoryProjectRepository.cs` — ' +
            'המימוש הראשוני מפרק 02 — יורד כי EfProjectRepository תפס את מקומו.',
        },
        {
          kind: 'ul',
          items: [
            'הסרת קוד שסיים תפקידו היא פעולה בריאה: פחות רעש, פחות מקומות לתחזק.',
            'ה-seam (IProjectRepository) ממשיך לעבוד — רק המימוש הוחלף. שורת רישום אחת בProgram.cs.',
            'InMemoryProjectRepository יחזור בפרק 15 כ-Fake מהיר לבדיקות יחידה — אבל כגרסה ממוקדת, לא כ-"ה-מימוש שהיה".',
            'Program.cs אחרי ההסרה קריא כטבלת תוכן: הגדרות, middleware, endpoints. כל עוד מוסיפים קוד — קל לאבד את המבנה; שומרים עליו בעריכה.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'פיגומים הם ארעיים בהגדרה. שמירתם אחרי שסיימו את תפקידם מציפה "מה זה?" לכל קורא חדש. ' +
            'קוד שנמחק הוא קוד שאי-אפשר לשבור — ו-git זוכר אותו אם תצטרכו אותו שוב.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch04',
        file: 'server/TaskForge.Api/Program.cs',
        diff: true,
        title: 'Program.cs החדש — כתום = השתנה בפרק',
      },
    },

    /* ------------------------------------------------------------ 4.17 */
    {
      id: '4.17',
      title: 'OpenAPI: התיעוד נולד מהקוד',
      blocks: [
        {
          kind: 'term',
          name: 'OpenAPI',
          definition:
            'סטנדרט לתיאור REST APIs בפורמט JSON (לשעבר Swagger). ' +
            'מגדיר כל endpoint, פרמטר, גוף בקשה ותגובה — כך שכלים (Swagger UI, Postman, code generators) ' +
            'יכולים לקרוא אותו ולייצר לקוחות, בדיקות ותיעוד אוטומטי.',
        },
        {
          kind: 'p',
          text:
            'שתי שורות הוסיפו OpenAPI ל-TaskForge. הגדרות:',
        },
        {
          kind: 'code',
          lang: 'csharp',
          title: 'Program.cs — AddOpenApi',
          code: `builder.Services.AddOpenApi();`,
        },
        {
          kind: 'p',
          text:
            'ב-pipeline, בסביבת פיתוח בלבד (region `step-4.17`): `app.MapOpenApi()` חושף ' +
            '`GET /openapi/v1.json`. החבילה `Microsoft.AspNetCore.OpenApi` נוספה ל-' +
            '`server/TaskForge.Api/TaskForge.Api.csproj`, וה-requests החדשים גרים ב-' +
            '`server/TaskForge.Api/requests.http`.',
        },
        { kind: 'h', text: 'TypedResults ו-OpenAPI — החיבור' },
        {
          kind: 'ul',
          items: [
            '`Results<Ok<PagedResult<IssueResponse>>, NotFound>` — OpenAPI generator רואה שני response types ומפיק schema עם 200 ו-404.',
            '`WithName("GetIssueById")` — מוסיף `operationId` למסמך; כלי code generation משתמש בו לשם הפונקציה.',
            'בסביבת Development בלבד — מסמך ה-API לא נחשף בפרודקשן. כשמוסיפים Auth בפרק 05 חשוב שהמסמך לא יחשוף endpoints מאובטחים ללא הקשר.',
          ],
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch04',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-4.17',
      },
    },

    /* ------------------------------------------------------------ 4.18 */
    {
      id: '4.18',
      title: 'העץ אחרי פרק 04 — ולאן ממשיכים',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-API של TaskForge שלם: שני פיצ׳רים (Projects, Issues), CRUD מלא, דפדוף, ולידציה, ' +
            '‏ProblemDetails אחיד, ו-OpenAPI שנולד מהקוד. בדקו בעץ מי חדש ומי השתנה.',
        },
        { kind: 'h', text: 'חמישה דברים שלקחתם מהפרק' },
        {
          kind: 'ul',
          items: [
            'DTOs כ-records: immutable, וולידציה ב-attributes, מיפוי ב-FromEntity — מפרידים ישות מחוזה HTTP.',
            'שאילתה דינמית ב-IQueryable: COUNT לפני Include, Include אחרי Take — SQL אחד, לא N+1.',
            '‏`AddValidation()` של ‎.NET 10 + TypedResults + Results<...>: ולידציה לפני Handler, חתימה שמהדר בודק.',
            'MapGroup + named handlers + CreatedAtRoute: ה-URL בנוי מהשם, לא ממחרוזת ידנית.',
            'פיגומים שסיימו תפקידם יורדים — קוד שנשמר "ליתר ביטחון" הוא רעש שמחביא את הכוונה.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'בפרק 05 ה-API יקבל Auth אמיתי, ביד: ‏PBKDF2 לגיבוב סיסמאות, ‏JWT עם refresh token ' +
            'rotation, ‏AddJwtBearer, ‏roles והרשאות מבוססות-חברות בפרויקט. ה-endpoints שבניתם ' +
            'היום יקבלו `RequireAuthorization` — ותראו בדיוק כמה מעט שינוי Auth דורש כשהמבנה נכון.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch04',
        title: 'TaskForge אחרי פרק 04',
      },
    },
  ],

  /* ------------------------------------------------------------ quiz */
  quiz: [
    {
      q: 'מה `Results<Ok<T>, NotFound>` קונה בזמן קומפילציה לעומת החזרת `IResult`?',
      options: [
        'שום דבר — שניהם מתנהגים אותו דבר בזמן ריצה',
        'המהדר בודק שכל מסלול יציאה מה-handler מחזיר אחד מהטיפוסים המוצהרים; ‏OpenAPI מפיק schema מלא עם 200 ו-404',
        'ביצועים טובים יותר בזמן ריצה',
        'מונע שגיאות null reference',
      ],
      answer: 1,
      explain:
        'עם IResult האוניון לא מוצהר — OpenAPI לא יודע מה ה-body של ה-200, והמהדר לא בודק שכיסיתם את כל המקרים. Results<Ok<T>, NotFound> הוא חוזה קומפילציה ותיעוד חי בו-זמנית.',
    },
    {
      q: 'מתי ולידציה של ‎.NET 10 (`AddValidation()`) רצה ביחס ל-handler?',
      options: [
        'אחרי ה-handler, כשמייצרים את התגובה',
        'לפני ה-handler; כישלון מחזיר 400 ValidationProblem מבלי שה-handler מופעל בכלל',
        'בתוך ה-handler, כשקוראים ל-Validate() ידנית',
        'בזמן קומפילציה',
      ],
      answer: 1,
      explain:
        'AddValidation רושם middleware/filter שבודק DataAnnotations לפני שה-handler מקבל את הקלט. Handler מקבל רק קלט שעבר ולידציה — לא צריך if-blocks בתוכו.',
    },
    {
      q: 'מה `CreatedAtRoute` פולט ולמה `WithName` חיוני לכך?',
      options: [
        'פולט 200 עם גוף; ‏WithName הוא אסתטי בלבד',
        'פולט 201 + כותרת Location שמצביעה על URL; ‏WithName מאפשר ל-CreatedAtRoute לאתר את ה-URL ע"פ שם ה-route',
        'פולט 302 redirect; ‏WithName הוא שם הפעולה במסמך OpenAPI בלבד',
        'פולט 201 ללא כותרת Location; ‏WithName מוסיף את ה-URL לגוף התגובה',
      ],
      answer: 1,
      explain:
        'WithName("GetIssueById") רושם operationId. CreatedAtRoute("GetIssueById", new { id }) מחפש route בשם הזה, בונה URL מ-routeValues ומוסיף Location header. בלי שם — אין לאן להצביע.',
    },
    {
      q: 'מה ההבדל בין Endpoint Filter ל-Middleware — ואיזה header מוכיח את ההבדל ב-TaskForge?',
      options: [
        'אין הבדל — שניהם עוטפים את כל הפניות',
        'Middleware עוטף כל בקשה (כולל קבצים סטטיים); פילטר עוטף handler ספציפי. X-Elapsed-Ms (middleware) גדול מ-X-Handler-Ms (פילטר) — ההפרש הוא routing + binding',
        'פילטר עוטף יותר מmiddleware',
        'Middleware לא יכול לגשת ל-HttpContext; פילטר כן',
      ],
      answer: 1,
      explain:
        'X-Elapsed-Ms נמדד מתחילת הבקשה (middleware); X-Handler-Ms נמדד מתחילת ה-handler (filter). ההפרש חושף את עלות ה-routing, ה-binding וה-pipeline עצמו — מדויק לאבחון.',
    },
    {
      q: 'למה ב-GetPagedAsync עושים CountAsync לפני Skip/Take, ומה Include אחרי Take מונע?',
      options: [
        'CountAsync אחרי Skip יותר נכון; ‏Include לפני Take מהיר יותר',
        'CountAsync לפני Skip/Take סופר את כל התוצאות המסוננות (Total נכון); ‏Include אחרי Take מטעין תוויות רק לפריטי העמוד — לא לכל הISsues',
        'CountAsync חייב להיות ראשון כדרישת EF',
        'סדר לא משנה; EF מייעל בכל מקרה',
      ],
      answer: 1,
      explain:
        'CountAsync לפני Skip/Take: סופרים את כל הpages האפשריות עם כל הסינונים. Include אחרי Take: רק ה-K פריטים שחזרו מה-DB ב-Take מקבלים Labels — לא אלפי Issues שלא ביקשנו.',
    },
    {
      q: '`[AsParameters]` על record — מה הוא גורם למנגנון ה-binding לעשות?',
      options: [
        'קורא את כל ה-record מגוף הבקשה כ-JSON',
        'מפרק את ה-record ל-properties ומקשר כל אחד ממקורו: query string, route, שירותי DI וכו\'',
        'מחייב שכל ה-properties יגיעו מה-route',
        'פוצל את הבקשה לכמה בקשות HTTP',
      ],
      answer: 1,
      explain:
        'AsParameters אומר ל-Minimal API: "אל תקרא את האובייקט מגוף ה-JSON — תפרק אותו ותקשור כל property ממקורו". IssueStatus מ-query string, projectId מה-route, ושירות DI מה-container — הכל על record אחד, לא שישה פרמטרים.',
    },
  ],

  /* ------------------------------------------------------------ prove it */
  proveIt: [
    {
      title: 'GET /api/projects מציג openIssues נכון',
      body: 'הריצו את השרת והבאו את רשימת הפרויקטים. בדקו שספירות ה-openIssues של שלושת הפרויקטים נכונות לפי ה-seeder.',
      command: 'GET http://localhost:5080/api/projects',
      expect: 'שלושה פרויקטים עם openIssues: 2, 1, 0 (ה-Done Issues לא נספרים)',
    },
    {
      title: 'סינון ומיון Issues עובד',
      body: 'בקשו את ה-Issues הפתוחים של פרויקט 1 ממוינים לפי עדיפות.',
      command: 'GET http://localhost:5080/api/projects/1/issues?status=Open&sort=priority',
      expect: 'total = 1 (רק הפתוחים); Issues ממוינים Critical ראשון',
    },
    {
      title: 'pageSize=999 מחזיר 400 לפני ה-handler',
      body: 'שלחו pageSize מחוץ לטווח המותר [1, 100] ובדקו שמקבלים ValidationProblem אחיד.',
      command: 'GET http://localhost:5080/api/projects/1/issues?pageSize=999',
      expect: 'status 400, errors.PageSize מוגדר, ה-handler לא הופעל',
    },
    {
      title: 'POST issue מחזיר 201 + Location header',
      body: 'צרו Issue חדש ובדקו שהתגובה היא 201 עם כותרת Location שמצביעה על ה-endpoint בשם GetIssueById.',
      command: 'POST http://localhost:5080/api/projects/1/issues  {"title":"Add dark mode toggle","priority":"High"}',
      expect: 'status 201; Location: /api/issues/{new-id} (ה-id שנוצר)',
    },
    {
      title: 'DELETE Issue: 204 ואז 404',
      body: 'מחקו Issue קיים — 204. מחקו שוב — 404.',
      command: 'DELETE http://localhost:5080/api/issues/2 (פעמיים)',
      expect: 'תגובה ראשונה 204; תגובה שנייה 404 ProblemDetails',
    },
    {
      title: 'GET /openapi/v1.json מציג 6 נתיבים',
      body: 'ב-Development, בדקו שמסמך OpenAPI נוצר ומכיל את כל ה-endpoints.',
      command: 'GET http://localhost:5080/openapi/v1.json',
      expect: 'רשימת paths: /, /healthz, /api/projects, /api/projects/{id}, /api/projects/{projectId}/issues, /api/issues/{id}',
    },
  ],

  /* ------------------------------------------------------------ exercise */
  exercise: {
    prompt:
      'בנו Labels endpoints בעצמכם — אותם דפוסים שלמדתם, פיצ׳ר שלישי: רשימה, צירוף, וניתוק תוויות.',
    tasks: [
      'הוסיפו `ILabelRepository` עם `GetAllAsync`, `AttachToIssueAsync(int issueId, int labelId)` ו-`DetachFromIssueAsync` — ממשק ב-Core, מימוש EF ב-Infrastructure.',
      'בנו `LabelEndpoints.cs` עם שלוש מתודות: `GET /api/labels`, `POST /api/issues/{id}/labels/{labelId}`, `DELETE /api/issues/{id}/labels/{labelId}`.',
      'ב-AttachToIssue: בדקו שה-Issue וה-Label קיימים (404 לכל אחד), הוסיפו לאוסף, שמרו. פעמיים — ה-set לא מוסיף כפילויות.',
      'הוסיפו `WithName`, `Results<...>` מתאים, ורשמו את ה-repository ב-Program.cs.',
    ],
    acceptance: [
      'GET /api/labels מחזיר את כל התוויות שה-seeder יצר.',
      'POST צירוף עובד: Issue מקבל Label; POST פעמיים — עדיין קישור אחד (אידמפוטנטי).',
      'DELETE ניתוק: 204 ואז 404 (אותו דפוס שהוכחתם ב-Issues).',
      'שגיאת 404 חוזרת כ-ProblemDetails אחיד — בלי קוד נוסף.',
    ],
  },
};
