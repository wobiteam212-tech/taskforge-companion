import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 03 — the data layer: EF Core + SQLite.
 * The seam from ch02 pays off: a real database replaces the in-memory
 * list, and only Infrastructure plus one registration line change.
 */
export const CH03_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 3.1 */
    {
      id: '3.1',
      title: 'EF Core: המתרגם בין עולמות',
      blocks: [
        {
          kind: 'term',
          name: 'ORM',
          definition:
            'Object-Relational Mapper — שכבה שמתרגמת בין אובייקטים בקוד לטבלאות ב-DB: שאילתות LINQ הופכות ל-SQL, שורות הופכות לישויות, ושינויים באובייקטים הופכים ל-INSERT/UPDATE/DELETE.',
        },
        {
          kind: 'p',
          text:
            'עד עכשיו הנתונים שלנו חיו ברשימה בזיכרון ומתו עם השרת. היום הם עוברים ל-SQLite — ' +
            'קובץ DB אמיתי — דרך EF Core, ה-ORM הרשמי של ‎.NET. אתם תכתבו LINQ על ישויות; ' +
            'EF יכתוב את ה-SQL, יפתח חיבורים, ימפה תוצאות ויעקוב אחרי שינויים.',
        },
        {
          kind: 'p',
          text:
            'ובאותה הזדמנות הדומיין גדל: לצד Project מצטרפים Issue (עם סטטוס ועדיפות), ‏Label, ' +
            'והקשרים ביניהם — אחד-לרבים ורבים-לרבים. זו המפה שנממש בפרק.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ORM נותן ומה הוא עולה? מתי תרדו ל-SQL ידני?',
          body: [
            'נותן: מהירות פיתוח, type-safety על שאילתות, מיגרציות מסודרות, הגנה מובנית מ-SQL injection דרך פרמטריזציה.',
            'עולה: שכבת הפשטה שיכולה להסתיר שאילתות גרועות (בעיית N+1 המפורסמת), ושליטה פחותה ב-SQL קיצוני.',
            'יורדים ל-SQL ידני (או Dapper) בנקודות חמות שנמדדו: דוחות כבדים, ‏bulk operations. לא כברירת מחדל — כאופטימיזציה ממוקדת עם ראיות.',
          ],
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `erDiagram
  PROJECT ||--o{ ISSUE : "has many"
  ISSUE }o--o{ LABEL : "tagged with"
  PROJECT {
    int Id PK
    string Name
    string Description "nullable"
    datetime CreatedAtUtc
  }
  ISSUE {
    int Id PK
    string Title
    string Status "enum as text"
    string Priority "enum as text"
    int ProjectId FK
  }
  LABEL {
    int Id PK
    string Name UK
    string Color "nullable"
  }`,
        caption: 'מפת הדומיין של הפרק: פרויקט מכיל Issues; ‏Issue נושא תוויות; ‏EF יבנה את טבלת החיבור לבד',
      },
    },

    /* ------------------------------------------------------------ 3.2 */
    {
      id: '3.2',
      title: 'החבילות: NuGet נכנס לתמונה',
      blocks: [
        {
          kind: 'term',
          name: 'NuGet Package',
          definition:
            'יחידת הקוד המשותף של ‎.NET: ספרייה ארוזה עם גרסה ותלויות. PackageReference בקובץ הפרויקט מוריד אותה בזמן restore והופך אותה לזמינה לקומפילציה.',
        },
        {
          kind: 'p',
          text:
            'שתי חבילות, כל אחת במקום המדויק שלה: ‏`Microsoft.EntityFrameworkCore.Sqlite` נכנסת ' +
            'ל-Infrastructure — כי רק שכבת הנתונים יודעת על EF. ‏`Microsoft.EntityFrameworkCore.Design` ' +
            'נכנסת ל-Api — כלי עזר לזמן עיצוב שמאפשר ל-`dotnet ef` להריץ מיגרציות דרכו.',
        },
        {
          kind: 'code',
          lang: 'bash',
          title: 'terminal — install the packages',
          code: `cd taskforge/server

dotnet add TaskForge.Infrastructure package Microsoft.EntityFrameworkCore.Sqlite
dotnet add TaskForge.Api package Microsoft.EntityFrameworkCore.Design`,
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'שימו לב מה לא קרה: ה-Core נשאר בלי אף חבילה. הדומיין לא יודע ש-EF קיים — ' +
            'הישויות שלו הן מחלקות C# רגילות (לכן קוראים לזה POCO). חוק התלות מפרק 02 ממשיך לעבוד.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'הפס הכתום בפאנל מראה בדיוק מה נוסף ל-csproj: ‏ItemGroup אחד עם PackageReference אחד. ' +
            'הגרסה מוצמדת במפורש — build היום ו-build בעוד שנה מורידים את אותם bytes.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch03',
        file: 'server/TaskForge.Infrastructure/TaskForge.Infrastructure.csproj',
        diff: true,
        title: 'מה שנוסף בפרק הזה — מודגש',
      },
    },

    /* ------------------------------------------------------------ 3.3 */
    {
      id: '3.3',
      title: 'Issue: סטטוס, עדיפות, ובעלים',
      blocks: [
        {
          kind: 'p',
          text:
            'הישות המרכזית של TaskForge: `server/TaskForge.Core/Entities/Issue.cs`. היא מדגימה ' +
            'שלושה דפוסים שתפגשו בכל דומיין אמיתי: ‏enum כשפת דומיין, זוג FK+navigation, ואוסף ' +
            'ל-many-to-many.',
        },
        { kind: 'h', text: 'פירוק שורה-שורה' },
        {
          kind: 'ul',
          items: [
            '`enum IssueStatus / IssuePriority` — סט ערכים סגור שהמהדר אוכף. ‏"Opne" שגוי-איות לא מתקמפל; ‏switch בלי מקרה מקבל אזהרה.',
            '`Status = IssueStatus.Open` — ברירת מחדל עסקית מוצהרת בישות עצמה: כל Issue נולד פתוח.',
            'הזוג `ProjectId` + `Project?` — ה-FK הוא העמודה שתשב בטבלה; ה-navigation הוא הדרך של הקוד "ללכת" לפרויקט. ‏EF מזהה את הזוג לפי מוסכמת השמות.',
            '`List<Label> Labels = []` — אוסף שמאותחל ריק; דרכו EF יבין שיש קשר רבים-לרבים (בצעד 3.6 נשלים את הצד השני).',
          ],
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            'ה-navigation מוגדר `Project?` (nullable) בכוונה: כשטוענים Issue בלי Include לפרויקט, ' +
            'ה-property הוא null — וזה מצב חוקי, לא שגיאה. מי שמסמן אותו required מגלה את זה ' +
            'בריצה, בצורת הפתעות.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch03',
        file: 'server/TaskForge.Core/Entities/Issue.cs',
      },
    },

    /* ------------------------------------------------------------ 3.4 */
    {
      id: '3.4',
      title: 'Label, והשלמת הקשרים',
      blocks: [
        {
          kind: 'p',
          text:
            'תווית היא ישות קטנה — אבל הצד השני של רבים-לרבים: גם ל-`Label` יש `List<Issue>`. ' +
            'כששני הצדדים מחזיקים אוסף, ‏EF מסיק לבד שצריך טבלת חיבור (IssueLabel) ובונה אותה ' +
            'במיגרציה — בלי שנכתוב לה ישות.',
        },
        {
          kind: 'p',
          text:
            'נשאר לעדכן את הצד של הפרויקט: גם `server/TaskForge.Core/Entities/Project.cs` מקבל ' +
            'אוסף — השלמת האחד-לרבים:',
        },
        {
          kind: 'code',
          lang: 'csharp',
          title: 'server/TaskForge.Core/Entities/Project.cs — התוספת',
          code: `// צד ה"אחד" של אחד-לרבים: לפרויקט יש אוסף Issues
public List<Issue> Issues { get; set; } = [];`,
        },
        {
          kind: 'callout',
          tone: 'alt',
          body:
            'אפשר להגדיר את טבלת החיבור כישות מפורשת (IssueLabel עם שדות משלה, למשל "מי תייג ומתי"). ' +
            'עושים את זה רק כשלקשר עצמו יש נתונים. אצלנו אין — אז ה-skip navigation הפשוט עדיף: ' +
            'פחות קוד, אותה טבלה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch03',
        file: 'server/TaskForge.Core/Entities/Label.cs',
      },
    },

    /* ------------------------------------------------------------ 3.5 */
    {
      id: '3.5',
      title: 'DbContext: יחידת העבודה',
      blocks: [
        {
          kind: 'term',
          name: 'DbContext',
          definition:
            'הלב של EF Core: מייצג סשן עבודה אחד מול ה-DB — פותח חיבורים, מריץ שאילתות, עוקב אחרי ישויות, ושומר שינויים בטרנזקציה אחת ב-SaveChanges.',
        },
        {
          kind: 'p',
          text:
            'הקובץ `server/TaskForge.Infrastructure/Data/TaskForgeDbContext.cs` — שימו לב איפה הוא ' +
            'גר: ב-Infrastructure, כי הוא פרט מימוש של אחסון. ה-Core לא יודע עליו כלום.',
        },
        { kind: 'h', text: 'פירוק שורה-שורה' },
        {
          kind: 'ul',
          items: [
            '`class TaskForgeDbContext(DbContextOptions<...> options) : DbContext(options)` — ‏primary constructor: ההגדרות (איזה DB, איזו מחרוזת חיבור) מוזרקות מבחוץ; ה-context לא יודע שהוא SQLite.',
            'כל `DbSet<T>` הוא שער לטבלה: ‏`db.Projects` מתחיל שאילתה, ‏`db.Projects.Add` מוסיף.',
            'התבנית `=> Set<T>()` במקום auto-property עוקפת אזהרות nullable — ה-DbSet זמין תמיד, בלי מצב ביניים.',
            '`OnModelCreating` — חדר המפות: שם נגדיר את כל חוקי המיפוי. צוללים אליו בצעד הבא.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה ה-context הוא Scoped (מופע לכל בקשה)? כי הוא יחידת עבודה: צובר שינויים של פעולה ' +
            'עסקית אחת ושומר אותם יחד. לשתף אותו בין בקשות (Singleton) זה לערבב טרנזקציות של ' +
            'משתמשים שונים — ובדיוק בגלל זה הכנו את ה-seam שלנו כ-Scoped בפרק 02.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch03',
        file: 'server/TaskForge.Infrastructure/Data/TaskForgeDbContext.cs',
        title: 'הקובץ המלא — ה-Fluent API מפורק בצעד הבא',
      },
    },

    /* ------------------------------------------------------------ 3.6 */
    {
      id: '3.6',
      title: 'Fluent API: חוקי המיפוי',
      blocks: [
        {
          kind: 'p',
          text:
            'EF מסיק הרבה לבד ממוסכמות (Id הוא מפתח, ‏ProjectId הוא FK), אבל את השאר מצהירים ' +
            'ב-`OnModelCreating`. בחרנו ב-Fluent API ולא ב-attributes על הישויות — מאותה סיבה ' +
            'שכל הפרק בנוי עליה: הישויות ב-Core נשארות נקיות מ-EF.',
        },
        { kind: 'h', text: 'מה כל חוק עושה' },
        {
          kind: 'ul',
          items: [
            '`HasMaxLength + IsRequired` — אילוצים שהופכים לעמודות NOT NULL עם אורך מוגבל; ה-DB שומר על עצמו גם בלי הקוד שלנו.',
            '`HasMany(p => p.Issues).WithOne(...).HasForeignKey(...)` — הצהרת האחד-לרבים המלאה, כולל `OnDelete(Cascade)`: מחיקת פרויקט גוררת את ה-Issues שלו. החלטה עסקית, מוצהרת במקום אחד.',
            '`HasConversion<string>()` — ה-enum נשמר כטקסט ("Open") ולא כמספר. קריא ב-DB, ועמיד לשינוי סדר הערכים ב-enum.',
            '`HasIndex(i => new { i.ProjectId, i.Status })` — אינדקס מורכב שתפור על שאילתת הלוח של פרק 13: "כל הפתוחים בפרויקט X".',
            '`HasIndex(l => l.Name).IsUnique()` — אין שתי תוויות באותו שם; הפרה תזרוק DbUpdateException.',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'Data Annotations או Fluent API — במה תבחרו ולמה?',
          body: [
            'שלוש רמות: מוסכמות (חינם), ‏attributes על הישות (קצר אבל מצמיד את הדומיין ל-EF), ‏Fluent API (הכול במקום אחד, הישויות נקיות).',
            'בארכיטקטורת שכבות ההכרעה כמעט אוטומטית: ‏Fluent API, כי הישויות ב-Core לא יכולות להחזיק תלות ב-EF בכלל — לפרויקט שלהן אין את החבילה.',
            'נקודת בונוס בראיון: ‏Fluent API גם מבטא חוקים ש-attributes לא יודעים — אינדקסים מורכבים, המרות, התנהגות מחיקה.',
          ],
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch03',
        file: 'server/TaskForge.Infrastructure/Data/TaskForgeDbContext.cs',
        region: 'step-3.6',
      },
    },

    /* ------------------------------------------------------------ 3.7 */
    {
      id: '3.7',
      title: 'רישום ב-DI ומחרוזת החיבור',
      blocks: [
        {
          kind: 'term',
          name: 'Connection String',
          definition:
            'המחרוזת שאומרת לספק ה-DB איך להתחבר: אצל SQLite פשוט נתיב קובץ (Data Source=taskforge.db); אצל שרתים מלאים גם כתובת, משתמש וסיסמה — ולכן היא שייכת לקונפיגורציה, לא לקוד.',
        },
        {
          kind: 'p',
          text:
            '`AddDbContext` עושה שני דברים: רושם את ה-context כ-Scoped, ומגדיר לו ספק — ‏`UseSqlite` ' +
            'עם מחרוזת חיבור שמגיעה מ-`builder.Configuration`. הקוד לא יודע איפה הקובץ — ' +
            'הקונפיגורציה יודעת.',
        },
        {
          kind: 'p',
          text: 'התוספת ל-`server/TaskForge.Api/appsettings.json` (זוכרים את שכבות הקונפיגורציה מפרק 01?):',
        },
        {
          kind: 'code',
          lang: 'json',
          title: 'server/TaskForge.Api/appsettings.json — התוספת',
          code: `"ConnectionStrings": {
  "Default": "Data Source=taskforge.db"
}`,
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            '`GetConnectionString("Default")` הוא קיצור ל-`Configuration["ConnectionStrings:Default"]` — ' +
            'המפתח ConnectionStrings הוא מוסכמה שכל הכלים של ‎.NET מכירים. בפרודקשן הערך יגיע ' +
            'ממשתנה סביבה וידרוס את הקובץ, בלי לשנות שורת קוד.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה SQLite ללמידה? אפס התקנה, ‏DB שלם בקובץ אחד שאפשר לפתוח ולבדוק, ואותו EF Core ' +
            'API בדיוק כמו PostgreSQL או SQL Server. ההחלפה לשרת אמיתי היא חבילה אחרת ושורת ' +
            'UseNpgsql במקום UseSqlite — עוד seam.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch03',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-3.7',
      },
    },

    /* ------------------------------------------------------------ 3.8 */
    {
      id: '3.8',
      title: 'מיגרציה ראשונה: dotnet ef',
      blocks: [
        {
          kind: 'term',
          name: 'Migration',
          definition:
            'קובץ קוד שמתאר שינוי סכמה אחד: מה להוסיף (Up) ואיך לבטל (Down). שרשרת המיגרציות היא ההיסטוריה המלאה של ה-DB — ו-git עוקב אחריה כמו אחרי כל קוד.',
        },
        {
          kind: 'p',
          text:
            'הכלי `dotnet-ef` מותקן כ-tool מקומי דרך קובץ מניפסט — `server/.config/dotnet-tools.json` — ' +
            'כך שכל מי שמשכפל את הריפו מקבל את אותה גרסה עם `dotnet tool restore`. בלי "אצלי זה עובד".',
        },
        {
          kind: 'code',
          lang: 'json',
          title: 'server/.config/dotnet-tools.json',
          code: `{
  "version": 1,
  "isRoot": true,
  "tools": {
    "dotnet-ef": {
      "version": "10.0.9",
      "commands": ["dotnet-ef"]
    }
  }
}`,
        },
        {
          kind: 'ul',
          items: [
            '`--project TaskForge.Infrastructure` — איפה ה-DbContext גר ולאן ייכתבו קובצי המיגרציה.',
            '`--startup-project TaskForge.Api` — מי מחזיק את הקונפיגורציה ואת רישום ה-DbContext; הכלי מריץ אותו עד Build() כדי לגלות את המודל.',
            'השם InitialCreate הוא תיעוד: עוד מיגרציות יבואו (אחת כבר בתרגיל), וכל אחת מתארת את השינוי שלה.',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה מיגרציות ולא EnsureCreated או סנכרון סכמה אוטומטי?',
          body: [
            'EnsureCreated בונה את הסכמה הנוכחית בלי היסטוריה — הוא לא יודע לעדכן DB קיים, רק ליצור מאפס. טוב לבדיקות, מסוכן לחיים האמיתיים.',
            'מיגרציות הן השינוי עצמו כקוד: ‏code review על שינויי סכמה, פריסה הדרגתית, ו-Down לחזרה אחורה. ה-DB של הפרודקשן מתעדכן בלי לאבד נתונים.',
          ],
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'bash',
        file: 'terminal — install the tool & create the migration',
        code: `cd taskforge/server

# מניפסט כלים מקומי + התקנת dotnet-ef (חד-פעמי לריפו)
dotnet new tool-manifest
dotnet tool install dotnet-ef

# המיגרציה הראשונה: צילום של המודל המלא
dotnet ef migrations add InitialCreate \\
  --project TaskForge.Infrastructure \\
  --startup-project TaskForge.Api

# Build started...
# Build succeeded.
# Done. To undo this action, use 'ef migrations remove'`,
      },
    },

    /* ------------------------------------------------------------ 3.9 */
    {
      id: '3.9',
      title: 'קוראים את מה שנוצר',
      blocks: [
        {
          kind: 'p',
          text:
            'נוצרה תיקיית Migrations עם שלושה קבצים. את הראשון — בפאנל — לא מקלידים, אבל חובה ' +
            'לקרוא: ‏`Up` בונה את ארבע הטבלאות (כולל IssueLabels שלא כתבנו לה ישות!), ו-`Down` ' +
            'יודע למחוק הכול. כל חוק Fluent מצעד 3.6 מופיע כאן כ-SQL-לעתיד.',
        },
        { kind: 'h', text: 'שלושת הקבצים' },
        {
          kind: 'ul',
          items: [
            '`server/TaskForge.Infrastructure/Migrations/20260610091413_InitialCreate.cs` — ‏Up/Down; הקובץ שקוראים ובודקים ב-code review.',
            '`server/TaskForge.Infrastructure/Migrations/20260610091413_InitialCreate.Designer.cs` — צילום המודל שהמיגרציה הזו מניחה; קובץ עזר של EF, לא נוגעים.',
            '`server/TaskForge.Infrastructure/Migrations/TaskForgeDbContextModelSnapshot.cs` — המודל המצטבר אחרי כל המיגרציות; מולו EF מחשב את המיגרציה הבאה.',
          ],
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            'חותמת הזמן בשם הקובץ היא חלק מהזהות שלו — אל תשנו שמות ואל תערכו מיגרציה שכבר ' +
            'הוחלה איפשהו. טעיתם? ‏`dotnet ef migrations remove` לפני שהיא רצה, או מיגרציה חדשה ' +
            'שמתקנת אחרי.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'חפשו ב-Up את התוצרים של ההחלטות שלכם: ‏`Status` כ-TEXT עם maxLength 20 (ה-HasConversion), ' +
            'האינדקס המורכב על ProjectId+Status, וה-cascade על ה-FK. שום קסם — הכול נולד מצעד 3.6.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch03',
        file: 'server/TaskForge.Infrastructure/Migrations/20260610091413_InitialCreate.cs',
        title: 'נוצר על ידי הכלי — נקרא על ידכם',
      },
    },

    /* ------------------------------------------------------------ 3.10 */
    {
      id: '3.10',
      title: 'DbSeeder: נתוני פיתוח',
      blocks: [
        {
          kind: 'p',
          text:
            'DB חדש נולד ריק, ופיתוח מול אפליקציה ריקה הוא עיוורון. ‏`server/TaskForge.Infrastructure/Data/DbSeeder.cs` ' +
            'מזריע את שלושת הפרויקטים המוכרים — הפעם עם Issues ותוויות אמיתיים — ורק כשה-DB ריק.',
        },
        { kind: 'h', text: 'הרעיון המרכזי: שמירת גרף' },
        {
          kind: 'ul',
          items: [
            'בנינו אובייקטים מקוננים: פרויקט שמכיל Issues שמכילים תוויות. עצים שלמים, בזיכרון.',
            '`db.Projects.AddRange(website, mobile, tools)` — מוסיפים רק את השורשים; ה-Change Tracker מטייל בגרף ומסמן הכול כ-Added.',
            '`SaveChanges` אחד כותב את כל הטבלאות — כולל טבלת החיבור — בטרנזקציה אחת ובסדר הנכון (פרויקטים לפני Issues, כי ה-FK צריך מפתח).',
            'אותו מופע `bug` משותף לשני Issues שונים — ולכן ב-DB תהיה תווית אחת עם שני קישורים, לא שתי תוויות.',
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          body:
            'ה-seeder הזה הוא כלי פיתוח: בדיקת `AnyAsync` ויציאה. נתוני ייצור אמיתיים (תפקידים, ' +
            'הגדרות מערכת) מקבלים טיפול אחר — ‏HasData במיגרציה או סקריפט מבוקר. אל תערבבו בין השניים.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch03',
        file: 'server/TaskForge.Infrastructure/Data/DbSeeder.cs',
      },
    },

    /* ------------------------------------------------------------ 3.11 */
    {
      id: '3.11',
      title: 'בעליית השרת: Migrate ואז Seed',
      blocks: [
        {
          kind: 'p',
          text:
            'מי מפעיל את כל זה? ‏Program.cs, מיד אחרי Build: ‏`MigrateAsync` מיישם כל מיגרציה ' +
            'שעוד לא רצה (ויוצר את הקובץ אם אינו), ואז ה-seeder ממלא DB ריק. השרת עולה תמיד ' +
            'עם סכמה עדכנית ונתונים לעבוד איתם.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            'למה `CreateScope`? ה-DbContext רשום Scoped — מופע לכל בקשת HTTP. אבל קוד האתחול רץ ' +
            'לפני שיש בקשות, ומחוץ לכל scope. בקשת DbContext ישירות מ-`app.Services` זורקת ' +
            'InvalidOperationException. יוצרים scope ידני, משתמשים, וה-using מנקה. זו מלכודת ' +
            'שכל מפתח ‎.NET פוגש פעם אחת — עכשיו אתם מחוסנים.',
        },
        {
          kind: 'callout',
          tone: 'alt',
          body:
            'בפרודקשן עם כמה עותקים של השרת, ‏Migrate-בעלייה יוצר מרוץ: שני עותקים מנסים לעדכן ' +
            'סכמה יחד. שם מריצים מיגרציות כצעד נפרד ב-pipeline של הפריסה (`dotnet ef database update` ' +
            'או סקריפט SQL מיוצר). לסביבת פיתוח ולמדריך — בעלייה זה מושלם.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch03',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-3.11',
      },
    },

    /* ------------------------------------------------------------ 3.12 */
    {
      id: '3.12',
      title: 'EfProjectRepository: המימוש השני',
      blocks: [
        {
          kind: 'p',
          text:
            'ועכשיו לרגע שבשבילו בנינו את פרק 02: מימוש שני לאותו חוזה. ‏`server/TaskForge.Infrastructure/Repositories/EfProjectRepository.cs` ' +
            'מממש את IProjectRepository מול ה-DbContext — ושימו לב כמה הוא דומה לממשק עצמו: ' +
            'שאילתת LINQ אחת לכל מתודה.',
        },
        { kind: 'h', text: 'פירוק שורה-שורה' },
        {
          kind: 'ul',
          items: [
            '`class EfProjectRepository(TaskForgeDbContext db)` — ‏primary constructor שמזריק את ה-context. ‏Scoped מקבל Scoped — מחזורי החיים מתואמים.',
            '`AsNoTracking()` — שאילתת קריאה בלבד: ‏EF מדלג על רישום הישויות ב-Change Tracker. מהיר יותר וחסכוני בזיכרון — ברירת המחדל הנכונה לכל GET.',
            '`ToListAsync(cancellationToken)` — הרגע שבו השאילתה באמת רצה. עד אליו `db.Projects.OrderBy(...)` הוא רק ביטוי שמחכה לתרגום.',
            '`FirstOrDefaultAsync(p => p.Id == id)` — מתורגם ל-SELECT עם WHERE ו-LIMIT; ה-null מהחוזה (`Project?`) זורם טבעי.',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מתי משתמשים ב-AsNoTracking ומה הוא חוסך?',
          body: [
            'בכל שאילתת קריאה שלא מתכוונת לערוך את התוצאות. המעקב קיים בשביל לזהות שינויים ל-SaveChanges — קריאה טהורה לא צריכה אותו.',
            'החיסכון: פחות זיכרון (אין רישום ב-tracker) ופחות CPU. ההשלכה: שינוי בישות כזו לא יישמר — וזה בדיוק מה שרוצים ב-GET.',
            'נקודת בונוס: ב-EF אפשר גם להגדיר את זה כברירת מחדל ל-context שלם של קריאות (QueryTrackingBehavior).',
          ],
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch03',
        file: 'server/TaskForge.Infrastructure/Repositories/EfProjectRepository.cs',
      },
    },

    /* ------------------------------------------------------------ 3.13 */
    {
      id: '3.13',
      title: 'הפדיון: שורה אחת מתחלפת',
      blocks: [
        {
          kind: 'p',
          text:
            'בסוף פרק 02 ביקשנו מכם לנבא אילו קבצים ישתנו כשנחליף את האחסון. הנה התשובה, ' +
            'מודגשת בכתום בפאנל: שורת רישום אחת. ‏InMemoryProjectRepository יוצא, ‏EfProjectRepository ' +
            'נכנס. ה-endpoint, הממשק, הישות — אף אחד מהם לא נגעו בו.',
        },
        {
          kind: 'ul',
          items: [
            'הקובץ InMemoryProjectRepository נשאר בריפו בכוונה: בפרק 15 הוא יחזור לתפקיד חדש — ‏fake מהיר לבדיקות יחידה, בלי DB.',
            'הקליינטים של החוזה לא יודעים שמשהו קרה: אותה חתימה, אותם טיפוסים, התנהגות זהה — רק שהנתונים שורדים עכשיו restart.',
            'זה ה-seam מצעד 2.9 משלם בפעם הראשונה. הוא ישלם שוב בבדיקות, ושוב אם נחליף את SQLite ב-PostgreSQL.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'אם הייתם בונים את ה-API ישירות מול הרשימה שבזיכרון — בלי ממשק — ההחלפה היום הייתה ' +
            'נוגעת בכל endpoint. ההשקעה של שני קבצים בפרק 02 (ממשק + מימוש) קנתה את השקט של היום. ' +
            'ככה נראית ארכיטקטורה שמרוויחה את קיומה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch03',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-3.13',
        diff: true,
        title: 'כל מה שהשתנה כדי לעבור ל-DB אמיתי',
      },
    },

    /* ------------------------------------------------------------ 3.14 */
    {
      id: '3.14',
      title: 'ה-Change Tracker — בעיניים',
      blocks: [
        {
          kind: 'term',
          name: 'Change Tracker',
          definition:
            'מנגנון המעקב של DbContext: כל ישות שהוא הגיש או קיבל מסומנת במצב (Unchanged / Added / Modified / Deleted), ו-SaveChanges מתרגם את המצבים ל-SQL המינימלי הנדרש.',
        },
        {
          kind: 'p',
          text:
            'המודל המנטלי האחרון של הפרק, וזה שמסביר "איך EF יודע מה לשמור": הוא פשוט זוכר. ' +
            'שחקו עם הדמו — טענו, שנו, הוסיפו, מחקו — ולחצו SaveChanges. שימו לב ששום SQL לא ' +
            'נשלח עד הלחיצה, ושכל המצבים מתאפסים אחריה.',
        },
        {
          kind: 'ul',
          items: [
            'טעינה רגילה מסמנת Unchanged; שינוי property מעביר ל-Modified (ההשוואה היא לערכים מהטעינה).',
            'Add מסמן Added; ‏Remove מסמן Deleted — הישות עוד בזיכרון, אבל גורלה נחרץ.',
            'SaveChanges שולח את הכול בטרנזקציה אחת: או שהכול נשמר, או שכלום.',
            'וזה בדיוק מה ש-AsNoTracking מדלג עליו: הישויות חוזרות "שקופות" למעקב — ולכן הוא מושלם לקריאות.',
          ],
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            'הבאג הקלאסי: לטעון ישות, לשנות אותה — ולשכוח SaveChanges. הקוד "עובד", הבדיקה הידנית ' +
            'מראה את הערך החדש (הוא בזיכרון!), וה-DB לא השתנה. כשעדכון נעלם — הדבר הראשון שבודקים ' +
            'הוא אם SaveChanges נקרא.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () => import('./demos/tracker.demo').then((m) => m.TrackerDemo),
        caption: 'מכונת המצבים של ה-Change Tracker: צבע = מצב; SaveChanges מתרגם מצבים ל-SQL',
      },
    },

    /* ------------------------------------------------------------ 3.15 */
    {
      id: '3.15',
      title: 'העץ אחרי פרק 03 — ולאן ממשיכים',
      blocks: [
        {
          kind: 'p',
          text:
            'הצד של הנתונים שלם: ישויות עם קשרים, ‏DbContext עם חוקי מיפוי, מיגרציה אמיתית, ' +
            'seeder, ו-repository מול DB. שימו לב בעץ מי new ומי mod — ובדקו שהניבוי שלכם ' +
            'מסוף פרק 02 התאמת.',
        },
        { kind: 'h', text: 'מה לקחתם מהפרק' },
        {
          kind: 'ul',
          items: [
            'ישויות נשארות POCO נקיים; כל חוקי המיפוי גרים ב-Fluent API בתוך ה-Infrastructure.',
            'מיגרציות הן היסטוריית הסכמה כקוד: נוצרות בכלי, נקראות בעיניים, חיות ב-git.',
            'ה-Change Tracker זוכר מצבים; ‏SaveChanges מתרגם אותם ל-SQL בטרנזקציה אחת; ‏AsNoTracking מדלג על כל זה לקריאות.',
            'ההחלפה מזיכרון ל-DB עלתה שורת רישום אחת — ה-seam מפרק 02 שילם.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'בפרק 04 נבנה את ה-API המלא של Projects ו-Issues: ‏DTOs כ-records, ‏MapGroup, סינון ' +
            'ומיון ודפדוף, ‏TypedResults, ‏ProblemDetails והוולידציה החדשה של ‎.NET 10 — כל מה ' +
            'שהופך endpoints לחוזה מקצועי. שכבת הנתונים שבניתם היום היא הקרקע שהכול יעמוד עליה.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch03',
        title: 'TaskForge אחרי פרק 03',
      },
    },
  ],

  /* ------------------------------------------------------------ quiz */
  quiz: [
    {
      q: 'איפה גרות חבילות ה-NuGet של EF Core, ולמה ה-Core נשאר בלי אף חבילה?',
      options: [
        'הכול ב-Api — הוא נקודת ההרכבה',
        'Sqlite ב-Infrastructure (פרט מימוש של אחסון) ו-Design ב-Api (כלי design-time); ה-Core נשאר POCO נקי בלי תלות ב-EF',
        'בכל שלושת הפרויקטים, ליתר ביטחון',
        'ב-Core — כי הישויות צריכות את EF',
      ],
      answer: 1,
      explain:
        'חוק התלות חל גם על חבילות: הדומיין לא יודע ש-EF קיים. לכן גם אין לו איך לקבל attributes של EF — וזה מה שדחף אותנו ל-Fluent API.',
    },
    {
      q: 'למה הגדרנו את Status עם HasConversion<string>() במקום לשמור את ה-enum כמספר?',
      options: [
        'כי SQLite לא תומך במספרים',
        'כי טקסט תופס פחות מקום',
        'כדי שה-DB יהיה קריא ("Open" ולא 0) ועמיד לשינוי סדר הערכים ב-enum',
        'כי זו ברירת המחדל של EF',
      ],
      answer: 2,
      explain:
        'ברירת המחדל היא דווקא מספר. מספר שביר: הוספת ערך באמצע ה-enum משנה את המשמעות של כל הנתונים הקיימים. טקסט שורד שינויי סדר וקריא לכל מי שפותח את ה-DB.',
    },
    {
      q: 'למה קוד האתחול עוטף את ה-DbContext ב-CreateScope?',
      options: [
        'בשביל ביצועים',
        'כי ה-DbContext רשום Scoped, וקוד שרץ מחוץ לבקשה אין לו scope — בקשה ישירה מ-app.Services תזרוק חריגה',
        'כדי שהמיגרציות ירוצו במקביל',
        'זו דרישה של SQLite בלבד',
      ],
      answer: 1,
      explain:
        'Scoped חי בתוך scope. בקשות HTTP מקבלות scope אוטומטית; קוד עלייה לא — ולכן יוצרים אחד ידנית, משתמשים, ומנקים עם using.',
    },
    {
      q: 'מה ההבדל בין MigrateAsync ל-EnsureCreated?',
      options: [
        'אין הבדל מעשי',
        'EnsureCreated מהיר יותר ולכן עדיף תמיד',
        'MigrateAsync מיישם את שרשרת המיגרציות (כולל עדכון DB קיים עם נתונים); EnsureCreated בונה סכמה מאפס בלי היסטוריה ולא יודע לעדכן',
        'MigrateAsync עובד רק עם SQL Server',
      ],
      answer: 2,
      explain:
        'EnsureCreated טוב לבדיקות חד-פעמיות. לכל דבר חי משתמשים במיגרציות — הן היחידות שיודעות לקחת DB מגרסה לגרסה בלי לאבד נתונים.',
    },
    {
      q: 'מתי נכון להוסיף AsNoTracking לשאילתה?',
      options: [
        'תמיד — זה תמיד מהיר יותר',
        'בכל שאילתת קריאה שלא מתכוונת לערוך ולשמור את התוצאות — כמו כל ה-GET שלנו',
        'רק בשאילתות שמחזירות ישות אחת',
        'אף פעם — זה מסוכן',
      ],
      answer: 1,
      explain:
        'המעקב משרת את SaveChanges. קריאה טהורה לא צריכה אותו — מדלגים וחוסכים זיכרון ו-CPU. אבל ישות כזו ששיניתם לא תישמר, אז לעריכות נשארים עם מעקב.',
    },
    {
      q: 'החלפנו את InMemoryProjectRepository ב-EfProjectRepository. אילו קבצים מחוץ ל-Infrastructure השתנו בשביל זה?',
      options: [
        'ה-endpoint, הממשק והישות',
        'רק Program.cs — שורת ה-AddScoped (ועוד using); שום צרכן של החוזה לא הרגיש',
        'כל הקבצים שמשתמשים בפרויקטים',
        'requests.http',
      ],
      answer: 1,
      explain:
        'זה המבחן של ה-seam: חוזה יציב + נקודת הרכבה אחת. ההחלפה היא החלטת הרכבה, לא שינוי רוחבי.',
    },
  ],

  /* ------------------------------------------------------------ prove it */
  proveIt: [
    {
      title: 'הכלי משוחזר מהמניפסט',
      body: 'מתיקיית server, ודאו ש-dotnet-ef זמין דרך המניפסט המקומי.',
      command: 'dotnet tool restore && dotnet ef --version',
      expect: 'Entity Framework Core .NET Command-line Tools 10.0.9',
    },
    {
      title: 'המיגרציה קיימת',
      body: 'בדקו שתיקיית Migrations נוצרה עם שלושת הקבצים.',
      command: 'ls TaskForge.Infrastructure/Migrations',
      expect: 'xxxxx_InitialCreate.cs, ‏xxxxx_InitialCreate.Designer.cs, ‏TaskForgeDbContextModelSnapshot.cs',
    },
    {
      title: 'ה-DB נולד בעלייה',
      body: 'הריצו את השרת ובדקו שקובץ ה-DB נוצר ליד הפרויקט.',
      command: 'dotnet run --project TaskForge.Api',
      expect: 'קובץ taskforge.db מופיע בתיקיית TaskForge.Api.',
    },
    {
      title: 'הנתונים מגיעים מה-DB',
      body: 'אותו endpoint מפרק 02 — אבל הפעם התשובה חוזרת מ-SQLite דרך EF.',
      command: 'GET http://localhost:5080/api/projects',
      expect: 'שלושת הפרויקטים, כולל "description": null אצל Internal Tools.',
    },
    {
      title: 'הנתונים שורדים restart — וגם לידה מחדש',
      body: 'עצרו את השרת, הריצו שוב — הנתונים שם (זה ה-DB). עכשיו מחקו את taskforge.db והריצו שוב.',
      command: 'rm TaskForge.Api/taskforge.db && dotnet run --project TaskForge.Api',
      expect: 'השרת עולה נקי: מיגרציה רצה, ה-seeder מזריע, ו-GET מחזיר שוב את השלושה.',
    },
  ],

  /* ------------------------------------------------------------ exercise */
  exercise: {
    prompt:
      'תרגלו את מחזור החיים המלא של שינוי סכמה: הוסיפו ל-Issue תאריך יעד, מהישות ועד ה-DB — בלי לאבד את הנתונים הקיימים.',
    tasks: [
      'הוסיפו לישות Issue שדה DueDateUtc מסוג DateTime? (חייב להיות nullable — חשבו למה לפני שתמשיכו).',
      'צרו מיגרציה שנייה בשם AddIssueDueDate עם אותם דגלי project ו-startup-project.',
      'פתחו את קובץ המיגרציה החדש וקראו: ‏Up אחד קצר עם AddColumn — השוו לגודל של InitialCreate.',
      'הריצו את השרת (MigrateAsync ייישם רק את החדשה) וודאו שהנתונים הקיימים שרדו.',
      'אתגר: עדכנו את ה-seeder לתת ל-Issue אחד תאריך יעד — ובדקו למה הוא לא מופיע ב-DB קיים (רמז: AnyAsync).',
    ],
    acceptance: [
      'dotnet ef migrations list מציג שתי מיגרציות, שתיהן מיושמות.',
      'ה-Issues הישנים עדיין ב-DB, עם NULL בעמודה החדשה — לא נמחק כלום.',
      'אתם יודעים להסביר למה עמודה חדשה על טבלה עם נתונים חייבת להיות nullable או עם ברירת מחדל.',
      'אתם יודעים להסביר למה ה-seeder לא רץ שוב על DB קיים, ומה הייתם עושים כדי "לאפס" סביבת פיתוח (למחוק את הקובץ).',
    ],
  },
};
