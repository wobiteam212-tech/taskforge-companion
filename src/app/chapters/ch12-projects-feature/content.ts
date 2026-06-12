import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 12 — פיצ׳ר הפרויקטים.
 * Wave 3 נפתח: רשימה, יצירה, ניהול חברים ותפקידים ב-UI.
 * הסימים מ-ch02 / ch07 / ch11 משלמים — ללא כתיבת רכיב מחדש.
 */
export const CH12_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 12.1 */
    {
      id: '12.1',
      title: 'גל 3 נפתח — הסימים משלמים',
      blocks: [
        {
          kind: 'p',
          text:
            'שישה פרקים של תשתית הונחו: auth, store, interceptors, ניתוב ו-UI kit. ' +
            'פרק 12 הוא הנקודה שבה התשתית פוגשת פיצ׳ר אמיתי. ' +
            'שלושה סימים מפרקים קודמים משלמים היום בלי שום שינוי ברכיבים: ' +
            '`IProjectRepository` מ-ch02 (חוזה שהוגדר לפני שהייתה אפליקציה), ' +
            '`ProjectsStore` מ-ch07 (ציבור שנשמר יציב), ' +
            'ו-`errorInterceptor` מ-ch11 (מתרגם שנמצא במקום אחד). ' +
            'כשמוסיפים endpoint חדש, כל אחד מהם לומד "ניב" חדש ללא נגיעה בקוראיו.',
        },
        {
          kind: 'p',
          text:
            'מה יוצא מפרק זה: endpoint לחברי פרויקט (GET + POST), ' +
            'הרשאה מבוססת-משאב (תפקיד לפי נתוני DB, לא לפי role גלובלי), ' +
            'מודל `ProjectMember` בקליינט, `httpResource` עם URL ריאקטיבי שמחזיר `undefined` כשהמשתמש לא מחובר, ' +
            'ומכונת מצבים ב-UI שמייצגת skeleton / error / empty / data — בלי state נפרד.',
        },
        {
          kind: 'ul',
          items: [
            'Server: `ProjectMemberInfo` (projection), הרחבת `IProjectRepository`, `EfProjectRepository`, `MemberContracts`, `MemberEndpoints`, `Program.cs`, `DbSeeder`.',
            'Client: `member.model.ts`, `project.model.ts`, `projects.store.ts`, `project-list` (skeleton + navigate), `project-members` (httpResource ריאקטיבי, דיאלוג add), `project-board` (host).',
            'errorInterceptor: ענף חדש לגוף string — 409 toast מהשרת.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה "הרשאה מבוססת-משאב" שונה מרולים גלובליים? ' +
            'ב-ch05 הגדרנו `UserRole.Admin` / `UserRole.Member` — ' +
            'תפקידים גלובליים שנוגעים לכל המערכת. ' +
            'בפרויקטים יש ממד נוסף: "מי Owner של פרויקט ספציפי?". ' +
            'זה לא נובע מה-JWT אלא מ-DB — ' +
            'ולכן השאילתה `GetRoleAsync` היא חלק בלתי נפרד מה-handler, לא ב-attribute.',
        },
      ],
      panel: {
        kind: 'diagram',
        caption: 'Client features connect to API endpoints; error interceptor and store are the shared infrastructure.',
        mermaid: `flowchart LR
  PL["ProjectList\\nfeature"]
  PB["ProjectBoard\\nfeature"]
  PM["ProjectMembers\\nfeature"]

  PS["ProjectsStore\\ncore/state"]
  EI["errorInterceptor\\ncore/api"]

  ProjectsAPI["GET /api/projects\\nPOST /api/projects"]
  MembersAPI["GET /api/projects/{id}/members\\nPOST /api/projects/{id}/members"]

  PL --> PS
  PS --> ProjectsAPI
  PB --> PM
  PM --> MembersAPI
  ProjectsAPI --> EI
  MembersAPI --> EI`,
      },
    },

    /* ------------------------------------------------------------ 12.2 */
    {
      id: '12.2',
      title: 'ProjectMemberInfo — הקרנה, לא ישות',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-`User` entity מכיל `PasswordHash`, `Role` גלובלי, `CreatedAtUtc` ועוד שדות ' +
            'שאף מסך לא צריך לדעת עליהם. ' +
            'ה-`ProjectMemberInfo` record הוא הקרנה — בדיוק מה שמסך רשימת החברים צריך: ' +
            '`UserId`, `DisplayName`, `Email` ו-`ProjectRole`. ' +
            'הגישה הזו מוכרת מ-ch04: `ProjectSummary` גם הוא projection שממנע טעינת כל ה-issues לזיכרון.',
        },
        {
          kind: 'p',
          text:
            '`PasswordHash` לא עוזב את השרת לעולם. ' +
            'לא בגלל שכתבנו `[JsonIgnore]` — אלא כי הוא פשוט לא נמצא ב-`ProjectMemberInfo`. ' +
            'כשמגדירים projection מלכתחילה, לא צריך לזכור לסנן שדות בכל endpoint. ' +
            'הארכיטקטורה עצמה אוכפת את האבטחה.',
        },
        {
          kind: 'term',
          name: 'projection (הקרנה)',
          definition:
            'record או DTO שמכיל רק את השדות שמשתמש אחד (endpoint, מסך, דוח) זקוק להם, ' +
            'ממופה ישירות ב-`Select(...)` של LINQ כך ש-EF מתרגם לשאילתת SQL מינימלית. ' +
            'בניגוד ל-entity מלא שנטען עם כל הניווטים, projection מגן על ביצועים ועל מידע רגיש.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch12',
        file: 'server/TaskForge.Core/Common/ProjectMemberInfo.cs',
        region: 'step-12.2',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 12.3 */
    {
      id: '12.3',
      title: 'החוזה גדל — GetRoleAsync',
      blocks: [
        {
          kind: 'p',
          text:
            '`IProjectRepository` קיבל שלוש מתודות חדשות. ' +
            'כל אחת מוצהרת בממשק Core לפני שנכתב מימוש — ' +
            'זה חוק התלות שלמדנו ב-ch02: ה-domain מוביל, ה-infrastructure עוקב. ' +
            'שימו לב ל-`GetRoleAsync` שמחזיר `ProjectRole?` עם nullable: ' +
            '`null` אומר "המשתמש לא חבר בכלל", בניגוד ל-`Member` שאומר "חבר עם תפקיד Member". ' +
            'ה-null הזה הוא ה-seam שמאפשר ל-endpoint להחליט בין 403 ל-404.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מדוע GetRoleAsync מחזיר null ולא זורק NotMemberException?',
          body:
            '"לא חבר" הוא תשובה לגיטימית לשאילתה, לא מצב חריג. ' +
            'חריגה (exception) מיועדת לדברים שלא אמורים לקרות — ' +
            'bug, תשתית שלא עובדת, נתונים פגומים. ' +
            '"המשתמש לא חבר" קורה בשימוש רגיל, בכל פעם שמשתמש מנסה לגשת לפרויקט שאינו שלו. ' +
            'כשה-repository מחזיר `null`, ה-endpoint הוא שמתרגם את התשובה לסטטוס הנכון — ' +
            '403 כשהפרויקט קיים, אחרי שכבר נבדק 404. חריגה הייתה גוזלת את ההחלטה הזו ממנו.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch12',
        file: 'server/TaskForge.Core/Abstractions/IProjectRepository.cs',
        region: 'step-12.3',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 12.4 */
    {
      id: '12.4',
      title: 'מימוש EF — Select-into-record וצירוף אידמפוטנטי',
      blocks: [
        {
          kind: 'p',
          text:
            '`GetMembersAsync` משתמש בדפוס `Select(m => new ProjectMemberInfo(...))` ' +
            'שראינו ב-`GetSummariesAsync` מ-ch04. ' +
            'EF מתרגם את הניווט ל-`m.User!.DisplayName` ל-JOIN ב-SQL — ' +
            'בלי לטעון את ה-`User` entity לזיכרון כלל. ' +
            'הסדר: Owners קודם (`OrderByDescending(m => m.Role)`) ואחר כך לפי שם — ' +
            'סדר יציב שהקליינט לא צריך לחשב.',
        },
        {
          kind: 'p',
          text:
            '`AddMemberAsync` מחזיר `bool`: ' +
            '`true` = צורף, `false` = כבר חבר. ' +
            'הוא לא זורק חריגה כי "כבר חבר" הוא תשובה לגיטימית, לא שגיאה. ' +
            'ה-endpoint הוא שמחליט מה לעשות עם ה-`false` — ' +
            'במקרה שלנו, `TypedResults.Conflict` עם הסבר.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch12',
        file: 'server/TaskForge.Infrastructure/Repositories/EfProjectRepository.cs',
        region: 'step-12.4',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 12.5 */
    {
      id: '12.5',
      title: 'החוזה: הוספת חבר לפי אימייל',
      blocks: [
        {
          kind: 'p',
          text:
            '`AddMemberRequest` מקבל `Email` ו-`Role`. ' +
            'שני attribute-ים על ה-`Email`: ' +
            '`[Required]` מונע string ריק, ו-`[EmailAddress]` מוודא פורמט חוקי. ' +
            'ב-.NET 10 `AddValidation()` מ-ch04 בודק את ה-attributes אוטומטית לפני ה-handler ' +
            'ומחזיר 400 ValidationProblem אחיד — השרת לא מגיע לקוד שלנו עם email פגום.',
        },
        {
          kind: 'p',
          text:
            'למה לקבל `Email` ולא `UserId`? ' +
            'הבעלים יודע את כתובת האימייל של העמית — לא את ה-id הפנימי שלו ב-DB. ' +
            'השרת מתרגם את האימייל ל-`UserId` עם `users.GetByEmailAsync`. ' +
            'הקליינט לא מנחש id פנימי לעולם.',
        },
        {
          kind: 'callout',
          tone: 'dotnet10',
          body:
            '`AddValidation()` ב-.NET 10 מאפשר ולידציה אוטומטית של `[DataAnnotations]` ב-Minimal API ' +
            'בלי `ModelState.IsValid` ובלי middleware ידני. ' +
            'הגדרת `[Required, EmailAddress]` על property של record = ולידציה חינם, ' +
            'ותגובת 400 ValidationProblem בפורמט RFC 7807 שה-`errorInterceptor` שלנו כבר מכיר.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch12',
        file: 'server/TaskForge.Api/Contracts/MemberContracts.cs',
        region: 'step-12.5',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 12.6 */
    {
      id: '12.6',
      title: 'GET members — 403 לעומת 404',
      blocks: [
        {
          kind: 'p',
          text:
            '`GetMembers` עונה על שאלת ההרשאה בשני שלבים: ' +
            'ראשית בודק אם הפרויקט קיים בכלל — אם לא, 404. ' +
            'אחר כך בודק אם המשתמש הנוכחי חבר בפרויקט הזה — אם לא, 403. ' +
            'ה-403 אומר: "הפרויקט קיים, אבל אסור לך להציץ פנימה". ' +
            '404 אומר: "אין פרויקט כזה". ' +
            'ההבדל הזה חשוב ל-UI: הרכיב יכול להציג הודעה מתאימה לכל מצב.',
        },
        {
          kind: 'p',
          text:
            '`RequireAuthorization()` על ה-group מבטיח 401 לכל אנונימי לפני שמגיעים לשורת הקוד הראשונה. ' +
            'ה-`GetRoleAsync` לבדיקת חברות היא הרשאה מבוססת-משאב: ' +
            'לא `[Authorize(Roles = "Admin")]`, אלא שאילתה לנתוני ה-DB של הפרויקט הספציפי. ' +
            'שורה אחת מחברת את ה-group ל-`app` ב-`Program.cs`:',
        },
        {
          kind: 'code',
          lang: 'csharp',
          title: 'server/TaskForge.Api/Program.cs — region step-12.6b',
          code: `// קבוצת ה-members מצטרפת לאותו דפוס: קובץ לפי פיצ׳ר, שורה אחת כאן
app.MapMemberEndpoints();`,
        },
        {
          kind: 'term',
          name: 'resource-based authorization (הרשאה מבוססת-משאב)',
          definition:
            'הרשאה שתלויה בנתוני משאב ספציפי ולא רק בתפקיד גלובלי. ' +
            'לדוגמה: "האם המשתמש הזה הוא Owner של פרויקט #5?" — ' +
            'התשובה נמצאת בטבלת `ProjectMembers` ב-DB, לא ב-JWT claim. ' +
            'מיושם ב-handler עצמו (לא ב-attribute) כי דורש שאילתת DB.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch12',
        file: 'server/TaskForge.Api/Endpoints/MemberEndpoints.cs',
        region: 'step-12.6',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 12.7 */
    {
      id: '12.7',
      title: 'POST member — Union type כחוזה מהמהדר',
      blocks: [
        {
          kind: 'p',
          text:
            '`AddMember` מחזיר `Results<Ok<IReadOnlyList<MemberResponse>>, NotFound, ForbidHttpResult, Conflict<string>>`. ' +
            'ה-union type הזה הוא חוזה: המהדר לא יאפשר להחזיר תגובה שלא מוצהרת. ' +
            'כל מסלול יציאה נמצא: ' +
            '404 אם הפרויקט לא קיים, 403 אם המשתמש אינו Owner, ' +
            '404 שוב אם האימייל לא מכיר משתמש ב-DB, ' +
            '409 אם כבר חבר — עם גוף string שמסביר את הבעיה בדיוק.',
        },
        {
          kind: 'p',
          text:
            '`TypedResults.Conflict($"{request.Email} is already a member of this project")` ' +
            'שולח 409 עם גוף שהוא string רגיל (לא JSON). ' +
            'ה-`errorInterceptor` ב-ch11 לא הכיר ניב כזה — עד עכשיו. ' +
            'בצעד 12.16 נראה איך שורה אחת ב-interceptor לומדת את הניב החדש, ' +
            'ואף רכיב לא צריך לדעת שמשהו השתנה.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה 409 Conflict ולא 400 Bad Request עבור "כבר חבר"? ' +
            '400 = "הבקשה עצמה פגומה" — שגיאת ולידציה. ' +
            '409 = "הבקשה תקינה, אבל מתנגשת עם המצב הנוכחי של המשאב". ' +
            '"כבר חבר" זה בדיוק conflict: הנתון תקין, אבל הפעולה אינה אפשרית עכשיו. ' +
            'הבחנה זו עוזרת לקליינט לדעת שלא כדאי לנסות שוב עם אותה בקשה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch12',
        file: 'server/TaskForge.Api/Endpoints/MemberEndpoints.cs',
        region: 'step-12.7',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 12.8 */
    {
      id: '12.8',
      title: 'ה-seed מקבל משתמשת שנייה',
      blocks: [
        {
          kind: 'p',
          text:
            'כדי שמסך החברים יספר סיפור, צריך יותר ממשתמש אחד. ' +
            '`maya@taskforge.dev` (Passw0rd!) נוספת ל-`DbSeeder` עם `UserRole.Member`. ' +
            'לאחר שהפרויקטים נוצרים ומקבלים Id אמיתי מ-SQLite, ' +
            'מאיה מצורפת כ-`Member` ל-"Website Redesign" — ' +
            'כדי שה-UI יראה שני תפקידים שונים (Owner + Member).',
        },
        {
          kind: 'p',
          text:
            '"Mobile App" נשאר בכוונה ללא מאיה: ' +
            'הוא הפרויקט שישמש לדמו של הוספת חבר. ' +
            'כשמתחברים כ-`demo@taskforge.dev` ולוחצים "Add member" ב-Mobile App — ' +
            'ניתן להזין `maya@taskforge.dev` ולראות את הזרימה כולה, ' +
            'כולל ה-409 כשמנסים להוסיף אותה פעמיים.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch12',
        file: 'server/TaskForge.Infrastructure/Data/DbSeeder.cs',
        region: 'step-12.8',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 12.9 */
    {
      id: '12.9',
      title: 'מודל הקליינט: ProjectMember ו-ProjectDetail',
      blocks: [
        {
          kind: 'p',
          text:
            '`member.model.ts` מגדיר `ProjectRole` כ-string union: `\'Member\' | \'Owner\'`. ' +
            'הסיבה: ב-ch04 הגדרנו בשרת `JsonStringEnumConverter` — ' +
            'ה-API שולח `"Member"` ו-`"Owner"` כטקסט, לא כמספר. ' +
            'string union ב-TypeScript מאפשר השוואה ישירה (`role === \'Owner\'`) ' +
            'בלי enum mapping, ו-TypeScript מוודא שלא מכניסים ערך לא חוקי.',
        },
        {
          kind: 'code',
          lang: 'typescript',
          title: 'client/src/app/core/models/project.model.ts — region step-12.9',
          code: `// המראה של ProjectResponse — מה ש-POST /api/projects מחזיר ב-201.
// הקליינט צריך בעיקר את ה-id, כדי לנווט ישר ללוח החדש.
export interface ProjectDetail {
  id: number;
  name: string;
  description: string | null;
  createdAtUtc: string;
}`,
        },
        {
          kind: 'p',
          text:
            '`ProjectDetail` הוא התוספת ל-`project.model.ts`: ' +
            'מה ש-`POST /api/projects` מחזיר ב-201. ' +
            'ה-`ProjectsStore.addProject` השתמש ב-ch11 ב-`firstValueFrom` בלי לקרוא את גוף התגובה; ' +
            'עכשיו הוא מחזיר `created.id` — כדי שרשימת הפרויקטים תוכל לנווט ישר ללוח החדש.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch12',
        file: 'client/src/app/core/models/member.model.ts',
        region: 'step-12.12',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 12.10 */
    {
      id: '12.10',
      title: 'Store: reload() כפקודה ציבורית',
      blocks: [
        {
          kind: 'p',
          text:
            '`reload()` הוא תוספת קטנה אבל חשובה: ' +
            'היא הופכת `projectsResource.reload()` לפקודה ציבורית של ה-store, ' +
            'ולא לגישה ישירה ל-resource. ' +
            'ב-`project-list.html` כפתור ה-"Try again" קורא ל-`store.reload()` — ' +
            'הוא לא היה יכול לקרוא ל-`store.projectsResource.reload()` ' +
            'כי `projectsResource` הוא `private`.',
        },
        {
          kind: 'p',
          text:
            'עיקרון ה-encapsulation נשמר: ' +
            'אם מחר `httpResource` יוחלף ב-WebSocket subscription, ' +
            'רק המימוש הפנימי של `reload()` ישתנה — ' +
            'ורכיבי ה-features לא יידעו שמשהו קרה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch12',
        file: 'client/src/app/core/state/projects.store.ts',
        region: 'step-12.10',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 12.11 */
    {
      id: '12.11',
      title: 'מכונת המצבים של הרשימה',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-`project-list.html` יש שרשרת `@if` אחת שממפה שלושה signals (' +
            '`store.loading()`, `store.loadError()`, `store.projects().length`) ' +
            'לארבעה מצבים ויזואליים: skeleton, error, empty, data. ' +
            'שימו לב לתנאי המדויק: ' +
            '`store.loading() && !store.projects().length` — ' +
            'אם יש כבר נתונים מרענון ישן, הם מוצגים גם בזמן טעינה (stale data). ' +
            'השלד מוצג רק כשעדיין אין מה להציג.',
        },
        {
          kind: 'p',
          text:
            'בגישת "state machine UI" — ' +
            'הענף שייבחר נגזר מה-signals, לא נשמר ב-signal נפרד בשם `currentView`. ' +
            'אם היה `currentView`, היינו צריכים לזכור לסנכרן אותו עם כל שינוי ב-loading/error — ' +
            'ומצבים בלתי-אפשריים (loading=true וגם error=true) יכולים להתגנב פנימה. ' +
            'כשהענף נגזר, מצבים בלתי-אפשריים הם בלתי-ניתנים לייצוג.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ההבדל בין "state machine UI" ל-flag רגיל כמו isLoading?',
          body:
            'flag רגיל כמו `isLoading = true` יכול לדור יחד עם `hasError = true` — ' +
            'מצב שהוא לוגית בלתי-אפשרי אבל קוד לא-מתוחזק יכול להגיע אליו. ' +
            'כשהענף שייבחר בתבנית נגזר בכל רגע מאותה אמת (ה-signals), ' +
            'אין state נוסף שצריך לסנכרן — ' +
            'ולכן שלד ושגיאה ביחד פשוט אינם ניתנים לייצוג. ' +
            '"Impossible states unrepresentable" — עיקרון שהגיע מעולם מערכות הטיפוסים הפונקציונליות.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch12',
        file: 'client/src/app/features/projects/project-list.html',
        region: 'step-12.10b',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 12.12 */
    {
      id: '12.12',
      title: 'דמו חי — מכונת המצבים בפעולה',
      blocks: [
        {
          kind: 'p',
          text:
            'הדמו מדמה את אותה מכונת מצבים בדיוק שמוצגת ב-`project-list.html`. ' +
            'שלושה כפתורים מפעילים תרחיש: עם נתונים, ריק, ושגיאה. ' +
            'בכל לחיצה: `items.set([])`, `error.set(false)`, `loading.set(true)` — ' +
            'ואחרי עיכוב מדומה של 1.1 שניות, הסיגנל המתאים מקבל ערך. ' +
            'וה-`branch` computed גוזר את הענף לפי אותו היגיון בדיוק כמו ב-HTML האמיתי.',
        },
        {
          kind: 'ul',
          items: [
            'הכפתור הראשון (תשובת 200 עם נתונים): skeleton כ-1.1 שניות, ואז שלושה כרטיסי פרויקט.',
            'הכפתור השני (תשובת 200 עם מערך ריק): skeleton ואז הודעת "No projects yet".',
            'הכפתור השלישי (תשובת 503): skeleton ואז כרטיס שגיאה עם "Try again" — לחיצה עליו קוראת ל-`retry()` שמפעיל את `load()` שוב.',
            'שימו לב ל-pills בחלק העליון: הם מציגים איזה תנאי בשרשרת ה-`@if` נבחר כרגע — הענף נגזר מה-signals.',
          ],
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () => import('./demos/list-states.demo').then((m) => m.ListStatesDemo),
        caption:
          'דמו חי: מכונת המצבים של רשימת הפרויקטים — skeleton בזמן טעינה, כרטיס שגיאה עם Retry, מצב ריק, ונתונים אמיתיים. הענף נגזר מ-loading/error/items.',
      },
    },

    /* ------------------------------------------------------------ 12.13 */
    {
      id: '12.13',
      title: 'סגנון: skeleton + error state',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-SCSS של `project-list.scss` מוסיף שלושה בלוקים חדשים. ' +
            'ה-`.skeleton` בגודל כרטיס אמיתי: ' +
            'border, padding ו-grid זהים לכרטיס הרגיל — כך ה-grid לא "קופץ" ברגע שהנתונים מגיעים. ' +
            'האנימציה על `opacity` בלבד: זולה ל-compositor, שקטה ויזואלית.',
        },
        {
          kind: 'p',
          text:
            'ה-`.load-error` משתמש ב-`color-mix(in srgb, var(--danger) 55%, var(--bdr))` לגבול ' +
            'ו-`color-mix(in srgb, var(--danger) 10%, var(--sur))` לרקע. ' +
            'אין טוקן CSS חדש בשם `--danger-surface` — ' +
            'וזה בכוונה: טוקן נולד רק כשיש לו שלושה צרכנים. ' +
            'עכשיו יש רק אחד — ולכן `color-mix` גוזר את הצבע ישירות מ-`--danger`.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'Skeleton screen שומרת על גודל הרכיב בזמן הטעינה. ' +
            'בלי זה, ה-grid יתכווץ לגובה אפס ואז יתרחב — ' +
            'layout shift שמוריד ניקוד Cumulative Layout Shift ב-Core Web Vitals. ' +
            'הכלל: לכל אלמנט טעינה-אפשרית יש placeholder בגודל הממוצע של התוכן הצפוי.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch12',
        file: 'client/src/app/features/projects/project-list.scss',
        region: 'step-12.10c',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 12.14 */
    {
      id: '12.14',
      title: 'יצירה מחזירה id — navigate ישר ללוח',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-ch11 `addProject` לא קרא את גוף התגובה — ' +
            'הוא פשוט עשה POST ואז `projectsResource.reload()`. ' +
            'עכשיו הוא מחזיר `Promise<number>`: ' +
            'הוא קורא את `created.id` מה-201 ומעביר אותו לקורא. ' +
            'ה-`projectsResource.reload()` נשאר — הרשימה עדיין מתרעננת מה-DB.',
        },
        {
          kind: 'code',
          lang: 'typescript',
          title: 'client/src/app/features/projects/project-list.ts — region step-12.11b',
          code: `// pending הוא state של הפקודה, לא של הנתונים — ולכן הוא גר כאן,
// ברכיב, ולא ב-store. הצלחה = ניווט ישר ללוח של הפרויקט החדש:
// ה-id חזר מהשרת ב-201, לא נוחש בקליינט.
protected readonly pending = signal(false);

protected async create(name: string): Promise<void> {
  // ...
  const id = await this.store.addProject(trimmed);
  this.toastSvc.show(\`Project "\${trimmed}" created\`, 'success');
  this.newProjectOpen.set(false);
  this.router.navigate(['/projects', id]);
  // ...
}`,
        },
        {
          kind: 'p',
          text:
            'הניווט ל-`/projects/{id}` אחרי יצירה הוא חוויית UX ברורה: ' +
            'המשתמש יוצר פרויקט ומיד רואה את הלוח שלו. ' +
            '`pending` signal גר ברכיב, לא ב-store — ' +
            'זה state של הפקודה, לא של הנתונים.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch12',
        file: 'client/src/app/core/state/projects.store.ts',
        region: 'step-12.11',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 12.15 */
    {
      id: '12.15',
      title: 'ProjectMembers: httpResource עם URL ריאקטיבי',
      blocks: [
        {
          kind: 'p',
          text:
            '`ProjectMembers` הוא רכיב חדש שמשתמש ב-`httpResource` עם URL ריאקטיבי. ' +
            'הטריק: הפונקציה שמגדירה את ה-URL מחזירה `undefined` כשהמשתמש לא מחובר. ' +
            'ב-Angular, `undefined` מ-URL function = "אל תשלח בקשה כלל". ' +
            'מעבר בין פרויקטים משנה את `projectId()` — הפונקציה מחושבת מחדש, ' +
            'ה-URL משתנה, ובקשה חדשה יוצאת אוטומטית.',
        },
        {
          kind: 'p',
          text:
            '`myRole` נגזר מהנתונים: ' +
            'מחפש ברשימת החברים שחזרה מה-API את המשתמש הנוכחי (לפי `tokenStore.user().id`) ' +
            'ומחזיר את תפקידו. ' +
            '`isOwner` computed מ-`myRole`. ' +
            '`forbidden` computed מה-`error()` של ה-resource: ' +
            'אם השגיאה היא `HttpErrorResponse` עם סטטוס 403, ' +
            'זה מצב לגיטימי של המסך — לא רק toast חולף.',
        },
        {
          kind: 'term',
          name: 'reactive URL / conditional fetch',
          definition:
            'דפוס שבו ה-URL של `httpResource` הוא פונקציה שיכולה להחזיר `undefined`. ' +
            'כל סיגנל שהפונקציה תלויה בו (כמו `isLoggedIn()` או `projectId()`) ' +
            'גורם ל-Angular לחשב מחדש את ה-URL ולשלוח בקשה חדשה אם הוא השתנה. ' +
            '`undefined` = "לא עכשיו" — שאילתה לא יוצאת, ואין 401 מיותר.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch12',
        file: 'client/src/app/features/projects/project-members.ts',
        region: 'step-12.12b',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 12.16 */
    {
      id: '12.16',
      title: 'דיאלוג הוספת חבר + 409 toast',
      blocks: [
        {
          kind: 'p',
          text:
            'תבנית `project-members.html` בנויה משני חלקים: ' +
            'רשימת החברים עם מכונת מצבים (לא-מחובר / forbidden / טוען / רשימה), ' +
            'ו-`<tf-dialog>` להוספת חבר — גלוי רק ל-Owner (אם `isOwner()`). ' +
            'הרכיב מייבא את `TfBadge`, `TfButton`, `TfDialog`, `TfField` — ' +
            'UI kit מ-ch09 ואפס CSS חדש לדיאלוג עצמו. ' +
            '`client/src/app/features/projects/project-members.scss` מגדיר avatar עגול עם `color-mix` ' +
            'ורשימה גמישה — בדיוק אותם design tokens שהכיר ch08.',
        },
        {
          kind: 'p',
          text:
            'הסים משלם שוב: `errorInterceptor` לומד ניב חדש — ' +
            'גוף `string` של 409 Conflict. ' +
            'שורה אחת מוסיפה את הטיפול:',
        },
        {
          kind: 'code',
          lang: 'typescript',
          title: 'client/src/app/core/api/error.interceptor.ts — region step-12.14',
          code: `// הסים משלם שוב: השרת למד ניב חדש (409 עם גוף string מ-TypedResults.Conflict),
// ורק המתרגם האחד הזה צריך לדעת על זה — אף רכיב לא נגע.
if (typeof err.error === 'string' && err.error) return err.error;`,
        },
        {
          kind: 'p',
          text:
            'כשמנסים להוסיף חבר שכבר קיים בפרויקט: ' +
            'השרת מחזיר 409 עם גוף `"maya@taskforge.dev is already a member of this project"`. ' +
            'ה-interceptor מזהה `typeof err.error === \'string\'` ומחזיר את ה-string ישירות. ' +
            'ה-toast מציג את הטקסט המדויק מהשרת. ' +
            'הדיאלוג נשאר פתוח — הקורא `catch {}` תופס את ה-rethrow.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch12',
        file: 'client/src/app/features/projects/project-members.html',
        region: 'step-12.13b',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 12.17 */
    {
      id: '12.17',
      title: 'הלוח מארח את הפאנל — פינאלה',
      blocks: [
        {
          kind: 'p',
          text:
            '`project-board.html` מוסיף שורה אחת: `<tf-project-members [projectId]="projectId()" />`. ' +
            '`projectId` זורם פנימה כ-input — הרכיב לא יודע כלום על הראוטר. ' +
            'ה-board פשוט אומר: "פרויקט `{id}` — זה מה שיש לי". ' +
            '`ProjectMembers` עושה את כל השאר: שולח את הבקשה, מנהל מצבים, מציג.',
        },
        {
          kind: 'ul',
          items: [
            'server: `ProjectMemberInfo.cs` — projection שמונע דליפת PasswordHash.',
            'server: `MemberContracts.cs` — add by email, ולידציה אוטומטית.',
            'server: `MemberEndpoints.cs` — 403 vs 404, TypedResults union, 409 conflict.',
            'client: `member.model.ts` — string union ProjectRole.',
            'client: `projects.store.ts` — reload() ציבורי, addProject מחזיר id.',
            'client: `project-members.ts` — httpResource ריאקטיבי, myRole מהנתונים, forbidden כ-state.',
            'client: `project-members.html` / `project-members.scss` — UI kit + list + dialog.',
            'client: `error.interceptor.ts` — ניב string מ-409 ברגע אחד.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'לאן ממשיכים',
          body:
            'פרק 13 "לוח ה-Issues" פותח את ה-board האמיתי: ' +
            'סינון וחיפוש ומיון מסונכרנים ל-URL (כל שינוי ב-filters = URL ייחודי שניתן לשתף), ' +
            'עדכונים אופטימיים עם rollback, ' +
            '`@defer` ו-virtual scroll לביצועים. ' +
            'ה-`projectId` שזורם היום כ-input ל-`ProjectMembers` ' +
            'יזרום באותו אופן ל-`IssueBoard` — ' +
            'ה-board לא ישנה כי הוא רק מארח.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch12',
        title: 'עץ הקוד אחרי פרק 12 — פיצ׳ר הפרויקטים שלם',
      },
    },
  ],

  quiz: [
    {
      q: 'GetRoleAsync מחזיר ProjectRole? (nullable) — מה ההבדל בין null ל-ProjectRole.Member?',
      options: [
        'אין הבדל — שניהם אומרים שהמשתמש חבר עם הרשאות מוגבלות',
        'null = משתמש לא קיים במערכת; ProjectRole.Member = חבר בפרויקט',
        'null = המשתמש לא חבר בפרויקט הזה כלל; ProjectRole.Member = חבר עם תפקיד Member',
        'null = שגיאת DB; ProjectRole.Member = חבר מלא',
      ],
      answer: 2,
      explain:
        'null מ-GetRoleAsync אומר "לא נמצאה שורה ב-ProjectMembers עבור המשתמש הזה בפרויקט הזה". ' +
        'ProjectRole.Member אומר "נמצאה שורה ותפקידו Member". ' +
        'ה-null הזה הוא הסיגנל שה-endpoint משתמש בו כדי להחזיר 403 — ' +
        '"הפרויקט קיים, אבל אתה לא חבר". ' +
        'בלי ה-null, היינו צריכים שתי שאילתות נפרדות: IsMemberAsync ו-GetRoleAsync.',
    },
    {
      q: 'GetMembers מחזיר 403 כשהמשתמש מחובר אבל לא חבר בפרויקט — מדוע 403 ולא 404?',
      options: [
        'כי 404 שמור לשגיאות ניתוב בלבד, לא לנתונים',
        'כי הפרויקט קיים — ה-403 אומר "פרויקט קיים אבל אין לך גישה"; 404 אומר "לא קיים"',
        'כי 401 ו-403 ו-404 זהים ב-.NET ואפשר לבחור כל אחד',
        'כי RequireAuthorization אוטומטית בוחר 403 לכל שגיאת הרשאה',
      ],
      answer: 1,
      explain:
        '404 Not Found = "אין דבר כזה" — גורם לקליינט לחשוב שה-URL שגוי. ' +
        '403 Forbidden = "אני יודע מה אתה מחפש, אבל אתה לא רשאי". ' +
        'החיבור הזה חשוב ל-UI: רכיב יכול להציג "Members are visible to project members only" כשמקבל 403, ' +
        'ו"No such project" כשמקבל 404. ' +
        'ב-GetMembers: קודם ExistsAsync (404), אחר כך GetRoleAsync (403) — הסדר קשיח.',
    },
    {
      q: 'מדוע AddMemberRequest מקבל Email ולא UserId?',
      options: [
        'כי TypeScript לא יודע להעביר numbers בטופס HTML',
        'כי הבעלים יודע כתובת אימייל, לא id פנימי של DB; השרת מתרגם אימייל ל-UserId',
        'כי JWT לא מכיל UserId',
        'כי id פנימי הוא רגיש ואסור להעביר ב-HTTP',
      ],
      answer: 1,
      explain:
        'id פנימי הוא מידע שגר ב-DB ולא נחשף ב-UI. ' +
        'הבעלים מכיר את האימייל של העמית — ' +
        'זה מה שהוא מקליד בדיאלוג "Add member". ' +
        'השרת מבצע `users.GetByEmailAsync(request.Email)` ומוצא את ה-UserId. ' +
        'גישה זו מונעת "leakage" של מזהים פנימיים ומאפשרת לקליינט להישאר פשוט.',
    },
    {
      q: 'httpResource ב-ProjectMembers מחזיר undefined כשהמשתמש לא מחובר — מה קורה אז?',
      options: [
        'Angular זורק שגיאה "undefined URL is not valid"',
        'נשלחת בקשה GET ריקה לשרת, שמחזירה 401',
        'Angular מזהה undefined ולא שולח בקשה כלל — resource נשאר ב-idle',
        'הרכיב נהרס ונוצר מחדש',
      ],
      answer: 2,
      explain:
        'כש-URL function מחזירה undefined, Angular מבין "אין בקשה כעת". ' +
        'ה-resource נשאר ב-idle — לא loading, לא error, לא value. ' +
        'ברגע שהמשתמש מתחבר, `tokenStore.isLoggedIn()` משתנה, ' +
        'Angular מחשב מחדש את ה-URL function, ' +
        'ומקבל URL אמיתי — ואז שולח את הבקשה. ' +
        'זה מונע 401 spam על כל טעינת עמוד לפני login.',
    },
    {
      q: 'AddMember מחזיר Conflict<string> עם גוף "maya@... is already a member" — איך ה-toast יודע להציג את הטקסט הזה?',
      options: [
        'ה-toast בודק את קוד הסטטוס ומציג הודעה קבועה עבור 409',
        'ה-ProjectMembers component מפענח את גוף ה-409 ידנית',
        'ה-errorInterceptor בודק typeof err.error === "string" — אם כן, מחזיר אותו ישירות כטקסט ל-toast',
        'הדפדפן ממיר 409 לטקסט אוטומטית',
      ],
      answer: 2,
      explain:
        'ב-ch11 ה-errorInterceptor ידע לטפל ב-ProblemDetails JSON. ' +
        'ב-ch12 הוא לומד ניב חדש: `if (typeof err.error === "string" && err.error) return err.error`. ' +
        '`TypedResults.Conflict<string>` שולח 409 שגופו JSON string (מחרוזת אחת בתוך מירכאות). ' +
        'Angular מפרסר את ה-JSON, ולכן `err.error` הוא string רגיל — ' +
        'ה-guard תופס ומחזיר את הטקסט ישירות. ' +
        'אף רכיב לא נגע — רק המתרגם האחד שיושב ב-core.',
    },
    {
      q: 'מדוע ה-SCSS של project-list לא מגדיר טוקן CSS בשם --danger-surface?',
      options: [
        'כי design tokens לא תומכים בצבעים שמופקים מצבעים אחרים',
        'כי color-mix לא עובד עם CSS variables',
        'כי טוקן נולד רק כשיש לו שלושה צרכנים — עכשיו יש רק אחד, ולכן color-mix גוזר את הצבע ישירות',
        'כי --danger כבר מוגדר וצריך להשתמש בו ישירות',
      ],
      answer: 2,
      explain:
        'כלל design tokens שלמדנו ב-ch08: טוקן הוא הפשטה — ' +
        'הוא מצדיק את עצמו רק כשכמה מקומות מסתמכים עליו. ' +
        'אם רק `load-error` צריך "danger שקוף", אז `color-mix(in srgb, var(--danger) 10%, var(--sur))` ' +
        'הוא ביטוי מוטבע, לא טוקן. ' +
        'כשיהיו שלושה צרכנים, נוציא לטוקן. ' +
        'זה מונע token sprawl — system design נקי.',
    },
  ],

  proveIt: [
    {
      title: 'הרצת ה-stack המלא של פרק 12',
      body:
        'הריצו `node tools/materialize-snapshots.mjs` מתוך `taskforge-companion/`. ' +
        'פתחו שני טרמינלים: ' +
        'בראשון הריצו `dotnet run` בתוך `reference/.build/ch12/server/TaskForge.Api`. ' +
        'בשני הריצו `pnpm install --silent`, ואז `pnpm exec ng serve --port 4500`, ' +
        'בתוך `reference/.build/ch12/client`. ' +
        'פתחו `http://localhost:4500`.',
      command: 'node tools/materialize-snapshots.mjs',
      expect:
        'שלושת הפרויקטים מוצגים. ' +
        'ב-Network tab: GET /api/projects מחזיר 200 עם נתונים מ-SQLite.',
    },
    {
      title: 'GET members — 401 ללא auth, 200 אחרי login',
      body:
        'מהטרמינל, שלחו בקשה ללא Authorization header: ' +
        '`curl -i http://localhost:5080/api/projects/1/members`.',
      command: 'curl -i http://localhost:5080/api/projects/1/members',
      expect:
        'תגובה 401 Unauthorized עם גוף ProblemDetails. ' +
        'לאחר מכן: התחברו ב-UI כ-`demo@taskforge.dev` / `Passw0rd!`, ' +
        'נווטו ל-Website Redesign, וצפו ברשימת החברים (Demo User + Maya Levi) — ' +
        'GET /api/projects/1/members מחזיר 200.',
    },
    {
      title: 'הוספת מאיה ל-Mobile App — ו-409 בניסיון הוספה כפול',
      body:
        'התחברו כ-`demo@taskforge.dev` / `Passw0rd!`. ' +
        'נווטו ל-Mobile App. לחצו "Add member", הזינו `maya@taskforge.dev`, לחצו "Add member". ' +
        'לאחר הצלחה, נסו להוסיף את אותה כתובת שוב.',
      expect:
        'הוספה ראשונה: toast ירוק "maya@taskforge.dev added to the project", ' +
        'Maya Levi מופיעה ברשימה. ' +
        'הוספה שנייה: toast אדום "maya@taskforge.dev is already a member of this project", ' +
        'הדיאלוג נשאר פתוח.',
    },
    {
      title: 'Login כמאיה — כפתור "Add member" נעלם',
      body:
        'התנתקו. התחברו כ-`maya@taskforge.dev` / `Passw0rd!`. ' +
        'נווטו ל-Website Redesign.',
      expect:
        'רשימת החברים מוצגת (מאיה רואה כי היא חברה). ' +
        'כפתור "Add member" לא מוצג — כי `isOwner()` = false למאיה. ' +
        'מאיה נרשמת כ-Member ב-badge שלה.',
    },
    {
      title: 'POST חבר מאנונימי — 401 עם curl',
      body:
        'שלחו POST ללא Authorization header:',
      command: 'curl -i -X POST http://localhost:5080/api/projects/1/members -H "Content-Type: application/json" -d "{\"email\":\"maya@taskforge.dev\",\"role\":\"Member\"}"',
      expect:
        'תגובה 401 Unauthorized עם גוף ProblemDetails. ' +
        'אין 403 ואין 409 — כי `RequireAuthorization()` על ה-group מחסם לפני ה-handler.',
    },
  ],

  exercise: {
    prompt:
      'הוסיפו אפשרות הסרת חבר מפרויקט: ' +
      'endpoint `DELETE /api/projects/{projectId}/members/{userId}` (Owner בלבד, ' +
      'Owner לא יכול להסיר את עצמו — 409 Conflict), ' +
      'וכפתור "Remove" בצד כל חבר ברשימה ב-`ProjectMembers`.',
    tasks: [
      'הוסיפו ל-`IProjectRepository` מתודה `RemoveMemberAsync(int projectId, int userId)` שמחזירה `Task<bool>` (false = לא נמצא).',
      'ממשו ב-`EfProjectRepository`: חפשו את השורה ב-`ProjectMembers`, הסירו עם `db.ProjectMembers.Remove`, שמרו.',
      'הוסיפו ב-`MemberEndpoints` handler עבור `MapDelete("/{userId:int}", RemoveMember)` עם `Results<Ok<IReadOnlyList<MemberResponse>>, NotFound, ForbidHttpResult, Conflict<string>>` — Owner בלבד; מניעת הסרה עצמית = `TypedResults.Conflict("You cannot remove yourself as the project owner")`.',
      'ב-`project-members.html` הוסיפו `<button>` "Remove" ליד כל חבר שאינו המשתמש הנוכחי (שמרו על `@if (isOwner())`). ב-`project-members.ts` הוסיפו `async remove(userId: number)` שקוראת `DELETE` ואז `members.reload()`.',
      'הריצו `pnpm test` ו-`pnpm build` ווידאו שהכל עובד.',
    ],
    acceptance: [
      'Owner יכול להסיר כל חבר שאינו הוא עצמו — לאחר הסרה הרשימה מתרעננת.',
      'ניסיון Owner להסיר את עצמו מחזיר 409 עם הודעה ב-toast והרשימה נשארת.',
      'Member שמנסה לקרוא ל-DELETE (באמצעות curl עם Bearer של מאיה) מקבל 403.',
      'קליינט שמנסה ל-DELETE ללא auth מקבל 401 toast ואין שינוי ב-UI.',
      'כל הטסטים הקיימים עוברים; `pnpm build` מסתיים ללא שגיאות.',
    ],
  },
};
