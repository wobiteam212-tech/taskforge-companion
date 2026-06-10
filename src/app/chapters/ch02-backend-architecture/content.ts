import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 02 — backend architecture: the single project splits into
 * Core / Infrastructure / Api with a one-way dependency rule.
 * First chapter that MODIFIES existing files — diff-gutter panels debut.
 */
export const CH02_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 2.1 */
    {
      id: '2.1',
      title: 'הבעיה: הכול בפרויקט אחד',
      blocks: [
        {
          kind: 'p',
          text:
            'פרק 01 הסתיים עם פרויקט אחד שמכיל הכול: ‏endpoints, שירותים, ובקרוב גם ישויות, ' +
            'גישה לנתונים, ולידציה ו-auth. בקנה מידה קטן זה נוח. אבל כל שורת קוד חדשה תצטרך ' +
            'להחליט "איפה אני גרה?" — ובלי מבנה, התשובה תמיד תהיה "ליד מה שנוח עכשיו".',
        },
        {
          kind: 'p',
          text:
            'ככה נולד "כדור הבוץ הגדול": הדומיין יודע על HTTP, הגישה לנתונים מפוזרת בכל מקום, ' +
            'ואי אפשר לבדוק שום דבר בלי להרים שרת שלם. הפתרון הוא לא יותר קבצים — הוא גבולות.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה לפצל דווקא עכשיו, כשיש בקושי שבעה קבצים? כי גבולות זולים כשהם ריקים ויקרים ' +
            'כשהם באיחור. בפרק 03 מגיע EF Core, בפרק 05 מגיע Auth — ואם נחכה, נפצל תחת לחץ ' +
            'עם עשרות קבצים שכבר התרגלו לגעת זה בזה.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מתי ארכיטקטורת שכבות היא overkill, ומתי היא חובה?',
          body: [
            'תשובה כנה מנצחת בראיון: לסקריפט חד-פעמי או ל-API של שני endpoints — פרויקט אחד מספיק, והפיצול הוא טקס מיותר.',
            'היא הופכת חובה כשיש דומיין אמיתי (ישויות וחוקים עסקיים), יותר ממקור נתונים פוטנציאלי אחד, או צורך בבדיקות יחידה על הלוגיקה בלי תשתית.',
            'TaskForge עומד בכל שלושת הקריטריונים — ולכן מפצלים עכשיו, לפני שהקוד מתבגר בלי גבולות.',
          ],
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `flowchart TD
  subgraph Mud["פרויקט אחד, בלי גבולות"]
    EP1["endpoints"] --- DB1["data access"]
    DB1 --- DOM1["domain rules"]
    DOM1 --- EP1
    EP1 --- AUTH1["auth"]
    AUTH1 --- DB1
    DOM1 --- AUTH1
  end
  Mud -. "כל שינוי נוגע בהכול" .-> PAIN["שינוי = פחד"]`,
        caption: 'כדור הבוץ: כשהכול יכול לגעת בהכול, כל שינוי הוא הימור',
      },
    },

    /* ------------------------------------------------------------ 2.2 */
    {
      id: '2.2',
      title: 'שלוש שכבות, חץ אחד',
      blocks: [
        {
          kind: 'p',
          text:
            'המבנה שנבנה היום ילווה את TaskForge עד הסוף: שלושה פרויקטים עם חוק תלות חד-כיווני. ' +
            '`TaskForge.Core` במרכז — ישויות, חוזים (ממשקים) ולוגיקה עסקית, בלי שום תלות. ' +
            '`TaskForge.Infrastructure` מממש את החוזים מול העולם (נתונים, קבצים, שירותים חיצוניים). ' +
            '`TaskForge.Api` מרכיב הכול ומדבר HTTP.',
        },
        { kind: 'h', text: 'המודל המנטלי: כיוון החצים' },
        {
          kind: 'ul',
          items: [
            'כל החצים מצביעים אל ה-Core. הוא לא מכיר אף אחד — כולם מכירים אותו.',
            'ה-Api מכיר את שניהם: הוא נקודת ההרכבה (Composition Root) שמחברת חוזה למימוש ב-DI.',
            'ה-Infrastructure לא מכיר את ה-Api בכלל. אם תנסו לייבא ממנו endpoint — אין דרך, אין הפניה.',
            'המבחן הפשוט: אפשר לקמפל את ה-Core לבדו? אם כן — חוק התלות חי.',
          ],
        },
        {
          kind: 'callout',
          tone: 'alt',
          body:
            'יש פרויקטים שמוסיפים שכבת Application נפרדת (use cases / handlers) בין ה-Core ל-Api — ' +
            'זה לב ה-Clean Architecture המלא. בגודל של TaskForge זו קומה ריקה: נשאיר שלוש שכבות, ' +
            'ונדע בדיוק מה להוסיף אם המערכת תצדיק את זה.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `flowchart TD
  API["TaskForge.Api<br/>endpoints · middleware · DI wiring"]
  INFRA["TaskForge.Infrastructure<br/>repositories · data access"]
  CORE["TaskForge.Core<br/>entities · interfaces · business rules"]
  API --> CORE
  API --> INFRA
  INFRA --> CORE
  style CORE fill:#ff8a3d,color:#1a0e04`,
        caption: 'חוק התלות: שלושה חצים בלבד, וכולם נגמרים ב-Core (או יוצאים מה-Api)',
      },
    },

    /* ------------------------------------------------------------ 2.3 */
    {
      id: '2.3',
      title: 'הפקודות: פתרון ושתי ספריות',
      blocks: [
        {
          kind: 'p',
          text:
            'ארבע פקודות בונות את כל המבנה. שימו לב לתבנית `classlib` — ספריית מחלקות בלי שום ' +
            'יכולת ווב, בדיוק מה שצריך לשכבות הפנימיות. ול-`--format slnx` — פורמט הפתרון החדש ' +
            'והקריא של ‎.NET, שנקלד ביד בלי כאב.',
        },
        {
          kind: 'ul',
          items: [
            '`dotnet new sln` יוצר את קובץ הפתרון; ‏`dotnet sln add` מצרף אליו פרויקטים.',
            '`dotnet new classlib` יוצר ספרייה עם `Class1.cs` לדוגמה — מחקו אותו מיד; אצלנו כל קובץ נולד בכוונה.',
            '`dotnet add reference` יוצר את החצים מהדיאגרמה: ‏Infrastructure מצביע על Core, ‏Api על שניהם.',
          ],
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            'נסו בכוונה להוסיף הפניה הפוכה — `dotnet add TaskForge.Core reference TaskForge.Api` — ' +
            'והמהדר יעצור אתכם עם שגיאת מעגל ברגע ששני הכיוונים ייפגשו. חוק התלות אצלנו אינו ' +
            'מוסכמה ג׳נטלמנית: הוא נאכף על ידי גרף ההפניות עצמו.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'bash',
        file: 'terminal — solution + class libraries',
        code: `cd taskforge/server

# קובץ פתרון בפורמט slnx החדש
dotnet new sln -n TaskForge --format slnx

# שתי ספריות מחלקות — בלי web, בכוונה
dotnet new classlib -n TaskForge.Core -o TaskForge.Core
dotnet new classlib -n TaskForge.Infrastructure -o TaskForge.Infrastructure

# מצרפים את שלושת הפרויקטים לפתרון
dotnet sln add TaskForge.Api TaskForge.Core TaskForge.Infrastructure

# החצים: Infrastructure מצביע על Core; Api על שניהם
dotnet add TaskForge.Infrastructure reference TaskForge.Core
dotnet add TaskForge.Api reference TaskForge.Core TaskForge.Infrastructure

# מעכשיו build אחד בונה הכול
dotnet build`,
      },
    },

    /* ------------------------------------------------------------ 2.4 */
    {
      id: '2.4',
      title: 'TaskForge.slnx — הפתרון כקובץ',
      blocks: [
        {
          kind: 'term',
          name: 'Solution',
          definition:
            'קובץ שמאגד כמה פרויקטים ליחידת עבודה אחת: build אחד, פתיחה אחת ב-IDE, ניהול תלויות משותף. הפרויקטים הם יחידות הקומפילציה; הפתרון הוא רק המארגן.',
        },
        {
          kind: 'p',
          text:
            'הקובץ `server/TaskForge.slnx` הוא כל מה שצריך כדי ש-`dotnet build` אחד יבנה את שלושת ' +
            'הפרויקטים בסדר הנכון (לפי גרף ההפניות). שלוש שורות תוכן — השוו את זה לפורמט ‎.sln ' +
            'הישן עם ה-GUIDs הכפולים, ותבינו למה ‎.NET עבר ל-XML נקי.',
        },
        {
          kind: 'callout',
          tone: 'dotnet10',
          body:
            'פורמט slnx יצא מ-preview והפך לאזרח מן המניין בכלי ה-CLI המודרניים: ‏build, ‏sln add, ' +
            'IDEs — כולם מבינים אותו. בפרויקטים חדשים אין סיבה לפתוח ‎.sln קלאסי.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'הסדר בקובץ לא קובע את סדר הבנייה — גרף ההפניות קובע. ‏MSBuild בונה קודם את מי שאין ' +
            'לו תלויות (Core), ואז את מי שתלוי בו, במקביל כשאפשר.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch02',
        file: 'server/TaskForge.slnx',
      },
    },

    /* ------------------------------------------------------------ 2.5 */
    {
      id: '2.5',
      title: 'TaskForge.Core.csproj — ספרייה טהורה',
      blocks: [
        {
          kind: 'term',
          name: 'Class Library',
          definition:
            'פרויקט שמתקמפל ל-DLL ומיועד לצריכה על ידי פרויקטים אחרים — בלי נקודת כניסה, בלי שרת, בלי הרצה עצמאית.',
        },
        {
          kind: 'p',
          text:
            'השוו את `server/TaskForge.Core/TaskForge.Core.csproj` לזה של ה-Api: ההבדל היחיד ' +
            'המהותי הוא שורת ה-SDK. ‏`Microsoft.NET.Sdk` הרגיל לא מצרף שום חבילת ASP.NET — ' +
            'ולכן אי אפשר אפילו בטעות לכתוב קוד HTTP בתוך הדומיין.',
        },
        {
          kind: 'ul',
          items: [
            'אותם `Nullable` ו-`ImplicitUsings` כמו ב-Api — מוסכמות הפרויקט אחידות בכל השכבות.',
            'אין `ItemGroup` של הפניות: ה-Core לא תלוי באף אחד. זה לא חוסר — זו ההגדרה שלו.',
            'מה שחשוב הוא דווקא מה שהקובץ הזה מונע: ‏using של Microsoft.AspNetCore בתוך ה-Core פשוט לא יתקמפל.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'בחירת SDK היא החלטה ארכיטקטונית, לא טכנית: ה-SDK קובע אילו עולמות זמינים לקוד. ' +
            'שכבה פנימית עם SDK מינימלי היא גבול שנאכף בקומפילציה — חינם, לתמיד.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch02',
        file: 'server/TaskForge.Core/TaskForge.Core.csproj',
      },
    },

    /* ------------------------------------------------------------ 2.6 */
    {
      id: '2.6',
      title: 'הישות הראשונה: Project',
      blocks: [
        {
          kind: 'p',
          text:
            'הקובץ `server/TaskForge.Core/Entities/Project.cs` הוא הרגע שבו TaskForge מקבל דומיין. ' +
            'ישות היא מחלקה שמייצגת מושג עסקי עם זהות — לפרויקט יש Id, והוא נשאר "אותו פרויקט" ' +
            'גם כשהשם משתנה.',
        },
        { kind: 'h', text: 'פירוק שורה-שורה' },
        {
          kind: 'ul',
          items: [
            '`required string Name` — אי אפשר לכתוב `new Project()` בלי לתת שם; המהדר עוצר. חוקים עסקיים שאפשר לאכוף בקומפילציה עדיפים על ולידציה בזמן ריצה.',
            '`string? Description` — ה-`?` מצהיר: ‏null הוא ערך חוקי כאן. עם `Nullable enable`, כל מה שבלי `?` מובטח לא-null.',
            '`DateTime CreatedAtUtc` — הסיומת Utc היא מוסכמה מחייבת אצלנו: זמן נשמר תמיד ב-UTC, והמרות לאזור זמן קורות רק בקצה (בקליינט).',
            'מה שאין: ‏attributes של JSON, של ולידציית HTTP או של DB. הישות לא יודעת שהיא תסודרל או תישמר — וזה בדיוק חוק התלות.',
          ],
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            'הפיתוי לשים `[JsonPropertyName]` או `[Required]` של ASP.NET על הישות הוא הדרך הקלאסית ' +
            'שבה HTTP מחלחל לדומיין. ברגע שזה קורה, אי אפשר לשנות את ה-API בלי לגעת בלב המערכת. ' +
            'בפרק 04 נפתור את זה נכון — עם DTOs נפרדים.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch02',
        file: 'server/TaskForge.Core/Entities/Project.cs',
      },
    },

    /* ------------------------------------------------------------ 2.7 */
    {
      id: '2.7',
      title: 'החוזה: IProjectRepository — בתוך ה-Core',
      blocks: [
        {
          kind: 'term',
          name: 'Repository Pattern',
          definition:
            'דפוס שמסתיר את פרטי האחסון מאחורי ממשק שמדבר בשפת הדומיין: "תן לי את כל הפרויקטים", לא "תריץ SELECT". הצרכנים תלויים בחוזה, לא במימוש.',
        },
        {
          kind: 'p',
          text:
            'וכאן ההחלטה החשובה ביותר בפרק: הממשק `IProjectRepository` יושב ב-`server/TaskForge.Core/Abstractions/IProjectRepository.cs` — ' +
            'בתוך ה-Core, לא בתוך ה-Infrastructure. הדומיין הוא זה שמגדיר אילו שירותים הוא צריך מהעולם; ' +
            'העולם מתיישר.',
        },
        {
          kind: 'ul',
          items: [
            'כל מתודה מקבלת `CancellationToken` עם ברירת מחדל — מוסכמה לכל קוד אסינכרוני אצלנו; כשהקליינט מתנתק, העבודה נעצרת.',
            '`IReadOnlyList<Project>` ולא `List` — החוזה מבטיח שהצרכן לא ישנה את האוסף שקיבל.',
            '`Task<Project?>` — ה-`?` הופך את "אולי לא נמצא" לחלק מהחוזה שהמהדר אוכף על כל קורא.',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה הממשק מוגדר ב-Core ולא ב-Infrastructure, לצד המימוש שלו?',
          body: [
            'זה עקרון היפוך התלות (ה-D של SOLID): שכבות גבוהות לא תלויות בנמוכות — שתיהן תלויות בהפשטה, וההפשטה שייכת לשכבה הגבוהה.',
            'אם הממשק היה ב-Infrastructure, ה-Core היה חייב הפניה אליו — והחץ היה מתהפך: הדומיין תלוי בפרטי אחסון.',
            'התוצאה המעשית: אפשר לזרוק את כל ה-Infrastructure ולכתוב אותו מחדש (וזה בדיוק מה שנעשה בפרק 03 עם EF Core) בלי לגעת בשורת Core אחת.',
          ],
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch02',
        file: 'server/TaskForge.Core/Abstractions/IProjectRepository.cs',
      },
    },

    /* ------------------------------------------------------------ 2.8 */
    {
      id: '2.8',
      title: 'Infrastructure: ההפניה הראשונה',
      blocks: [
        {
          kind: 'term',
          name: 'Project Reference',
          definition:
            'הפניה מפרויקט לפרויקט באותו פתרון: המפנה רואה את הטיפוסים הציבוריים של המופנה, ו-MSBuild בונה אותם בסדר הנכון. זו הדרך שבה חוק התלות הופך לגרף שהמהדר אוכף.',
        },
        {
          kind: 'p',
          text:
            'הקובץ `server/TaskForge.Infrastructure/TaskForge.Infrastructure.csproj` זהה לזה של ה-Core ' +
            'חוץ מתוספת אחת: ‏`ItemGroup` עם `ProjectReference` ל-Core. השורה הזו היא חץ מהדיאגרמה ' +
            'של צעד 2.2, כתוב ב-XML.',
        },
        {
          kind: 'ul',
          items: [
            'הנתיב יחסי לקובץ ה-csproj עצמו — `..\\TaskForge.Core\\...` מטפס תיקייה ויורד לשכן.',
            'ההפניה חד-כיוונית: ‏Infrastructure רואה את Core; ‏Core לא יודע ש-Infrastructure קיים.',
            'בזכותה נוכל מיד לכתוב `using TaskForge.Core.Abstractions` בתוך המימוש.',
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'ההפניות הן גם תיעוד: פתחו csproj של פרויקט זר ותוך שניות תדעו על מי הוא נשען. ' +
            'אם רשימת ההפניות של שכבה פנימית מתארכת — זה ריח של גבול שנשבר.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch02',
        file: 'server/TaskForge.Infrastructure/TaskForge.Infrastructure.csproj',
      },
    },

    /* ------------------------------------------------------------ 2.9 */
    {
      id: '2.9',
      title: 'המימוש: רשימה בזיכרון, בכוונה',
      blocks: [
        {
          kind: 'term',
          name: 'Seam',
          definition:
            'נקודת תפר במערכת שבה אפשר להחליף התנהגות בלי לשנות את הקוד שמסביב. ממשק + DI הם ה-seam הקלאסי: מחליפים מימוש בשורת רישום אחת.',
        },
        {
          kind: 'p',
          text:
            'המימוש הראשון של החוזה, `server/TaskForge.Infrastructure/Repositories/InMemoryProjectRepository.cs`, ' +
            'הוא רשימה סטטית של שלושה פרויקטים. לא כי אנחנו עצלנים — כי זה מוכיח את הארכיטקטורה ' +
            'לפני שמסבכים אותה: בפרק 03 הקובץ הזה יוחלף ב-EF Core, ואף קובץ אחר לא יזוז.',
        },
        { kind: 'h', text: 'פירוק שורה-שורה' },
        {
          kind: 'ul',
          items: [
            '`List<Project> Seed = [ ... ]` — ‏collection expression: תחביר האתחול המודרני של C#, עובד על כל אוסף.',
            '`new() { Id = 1, ... }` — ‏target-typed new: הטיפוס ברור מההקשר, לא חוזרים עליו.',
            '`Task.FromResult(...)` — אין כאן I/O אמיתי, אבל החוזה אסינכרוני; עוטפים ערך מוכן ב-Task בלי לשלם על thread.',
            'פרויקט 3 נולד עם `Description = null` בכוונה — שיהיה לנו מקרה קצה אמיתי לבדוק מול ה-JSON.',
          ],
        },
        {
          kind: 'callout',
          tone: 'alt',
          body:
            'אפשר היה לדחות את הממשק "עד שיהיו שני מימושים", כמו שטוענים מתנגדי ההפשטות. אבל המימוש ' +
            'השני כבר מתוכנן (פרק 03), והשלישי יגיע בבדיקות (פרק 15) — fake בזיכרון הוא בדיוק הקובץ ' +
            'הזה בתחפושת. ה-seam הזה ירוויח את עצמו שלוש פעמים.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch02',
        file: 'server/TaskForge.Infrastructure/Repositories/InMemoryProjectRepository.cs',
      },
    },

    /* ------------------------------------------------------------ 2.10 */
    {
      id: '2.10',
      title: 'מחברים את ה-Api: שתי הפניות',
      blocks: [
        {
          kind: 'p',
          text:
            'עכשיו ה-Api צריך לראות את שתי השכבות — את ה-Core בשביל הממשק והישות, ואת ה-Infrastructure ' +
            'בשביל לרשום את המימוש ב-DI. פתחו את `server/TaskForge.Api/TaskForge.Api.csproj` והוסיפו ' +
            'את ה-`ItemGroup`.',
        },
        {
          kind: 'p',
          text:
            'שימו לב לפס הכתום בשולי הפאנל: מהפרק הזה והלאה, קבצים שכבר קיימים מסומנים בדיוק ' +
            'במה שהשתנה בהם — אלו השורות שאתם מוסיפים עכשיו, והשאר נשאר כשהיה. ככה תמיד תדעו ' +
            'מה חדש ומה ירושה.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'רגע — אם ה-Api מפנה גם ל-Infrastructure, מה מונע ממנו לעקוף את הממשק ולקרוא ישירות ' +
            'ל-InMemoryProjectRepository? כלום, חוץ ממשמעת: ההפניה קיימת רק כדי שנקודת ההרכבה תוכל ' +
            'לרשום את הזוג ב-DI. זה הפשרה המעשית של שלוש שכבות — ובדיוק מה שנבדוק בביקורות קוד.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch02',
        file: 'server/TaskForge.Api/TaskForge.Api.csproj',
        diff: true,
        title: 'הפס הכתום = מה שהשתנה בפרק הזה',
      },
    },

    /* ------------------------------------------------------------ 2.11 */
    {
      id: '2.11',
      title: 'נקודת ההרכבה: רישום ה-seam',
      blocks: [
        {
          kind: 'p',
          text:
            'שורה אחת ב-Program.cs סוגרת את המעגל: "כשמישהו מבקש `IProjectRepository`, תן לו ' +
            '`InMemoryProjectRepository`". זו הפעם הראשונה שאנחנו רושמים זוג ממשק-מימוש — ' +
            'בפרק 01 הטיפוס המבוקש והמיוצר היו זהים.',
        },
        {
          kind: 'ul',
          items: [
            'הפרמטר הגנרי הראשון הוא מה שמבקשים; השני הוא מה שמקבלים. הצרכנים לעולם לא פוגשים את השני.',
            'בחרנו Scoped — מופע לכל בקשה — כי זה בדיוק מחזור החיים שיהיה ל-DbContext שיחליף אותו בפרק 03. ההחלפה תהיה שקופה גם בממד הזה.',
            'שתי שורות using חדשות למעלה: ‏Abstractions מה-Core, ‏Repositories מה-Infrastructure. זו כל הנגיעה של ה-Api בשכבות.',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה זה Composition Root ולמה חשוב שיהיה רק אחד?',
          body: [
            'נקודת ההרכבה היא המקום היחיד שבו המערכת "מכירה את כולם" ומחברת חוזים למימושים — אצלנו Program.cs.',
            'כשהחיבורים מפוזרים (new בתוך שירותים, ‏service locator בכל מקום), אי אפשר להבין או להחליף את גרף התלויות. נקודה אחת = מקום אחד לקרוא, מקום אחד לשנות.',
          ],
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch02',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-2.8',
      },
    },

    /* ------------------------------------------------------------ 2.12 */
    {
      id: '2.12',
      title: 'ה-endpoint העסקי הראשון',
      blocks: [
        {
          kind: 'p',
          text:
            '`GET /api/projects` הוא ה-endpoint הראשון שמדבר עם הדומיין — והוא עושה את זה דרך ' +
            'הממשק בלבד. ה-handler מבקש `IProjectRepository` בפרמטר, ‏DI מספק את המימוש הרשום, ' +
            'וה-handler אפילו לא יודע איך קוראים לו.',
        },
        {
          kind: 'ul',
          items: [
            '`CancellationToken ct` בפרמטר — ‏Minimal API מחבר אותו אוטומטית לביטול של הבקשה עצמה; אנחנו רק מעבירים אותו פנימה.',
            '`all.Select(p => new { ... })` — הקרנה לאובייקט אנונימי: שולחים רק מה שהקליינט צריך, לא את הישות כולה. ‏DTOs אמיתיים כ-records — בפרק 04.',
            'הנתיב פותח את המוסכמה `/api/...` — ההפרדה בין endpoints עסקיים לתפעוליים (`/healthz`).',
          ],
        },
        {
          kind: 'p',
          text: 'ואל תשכחו לתעד את הבקשה החדשה ב-`server/TaskForge.Api/requests.http`:',
        },
        {
          kind: 'code',
          lang: 'http',
          title: 'server/TaskForge.Api/requests.http — התוספת',
          code: `### Projects — הבקשה העסקית הראשונה, דרך ה-seam של ה-repository
GET {{host}}/api/projects`,
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            'מחזירים את הישות ישירות בלי הקרנה? היום זה "עובד", ומחר מוסיפים לישות שדה רגיש ' +
            '(עלות? בעלים?) — והוא דולף לכל קליינט בלי שאף אחד החליט. הקרנה היא לא ייפוי — ' +
            'היא ההחלטה המודעת מה יוצא החוצה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch02',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-2.9',
      },
    },

    /* ------------------------------------------------------------ 2.13 */
    {
      id: '2.13',
      title: 'ההוכחה על הקו',
      blocks: [
        {
          kind: 'p',
          text:
            'הריצו `dotnet run` ולחצו על הבקשות בסימולטור — זו בדיוק ההתנהגות שהשרת שלכם מציג ' +
            'עכשיו. שימו לב לפרויקט 3: ה-`Description` הוא `null` ב-JSON, בדיוק כמו שהגדרנו ב-seed. ' +
            'מקרי קצה לא בודקים את עצמם.',
        },
        {
          kind: 'ul',
          items: [
            'שלושת הפרויקטים חוזרים עם שלושת השדות שבחרנו בהקרנה — לא יותר.',
            'נתיב שלא קיים עדיין מחזיר 404 משכבת ה-Routing, וה-middlewares מפרק 01 עוטפים גם אותו.',
            'הכותרת X-Elapsed-Ms ממשיכה להופיע על כל תשובה — שום דבר מפרק 01 לא נשבר.',
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'זה הרגל שכדאי לסגל אחרי כל שינוי ארכיטקטוני: להריץ את כל הבקשות הישנות ב-requests.http, ' +
            'לא רק את החדשה. רפקטור מוצלח הוא כזה שאף התנהגות קיימת לא הרגישה אותו.',
        },
      ],
      panel: {
        kind: 'simulator',
        scenario: {
          title: 'TaskForge API — אחרי הפיצול',
          blurb: 'ההתנהגות החיה של השרת בסוף פרק 02. לחצו ובדקו.',
          requests: [
            { method: 'GET', path: '/api/projects', note: 'ה-handler מדבר עם IProjectRepository; ‏DI מספק את המימוש שבזיכרון.' },
            { method: 'GET', path: '/healthz', note: 'ה-endpoints התפעוליים מפרק 01 לא זזו.' },
            { method: 'GET', path: '/api/issues', note: 'עוד לא קיים — ‏Routing מחזיר 404. יגיע בפרק 04.' },
          ],
          responses: [
            {
              status: 200,
              title: 'OK',
              body: '[\n  { "id": 1, "name": "Website Redesign", "description": "Refresh the marketing site end to end" },\n  { "id": 2, "name": "Mobile App", "description": "iOS + Android companion app" },\n  { "id": 3, "name": "Internal Tools", "description": null }\n]',
            },
            { status: 200, title: 'OK', body: '{ "status": "healthy" }' },
            { status: 404, title: 'Not Found' },
          ],
          insight: 'ה-handler לא יודע מאיפה הנתונים — וזו לא חולשה, זו התכונה שתאפשר לפרק 03 להחליף הכול מתחתיו.',
        },
      },
    },

    /* ------------------------------------------------------------ 2.14 */
    {
      id: '2.14',
      title: 'העץ אחרי פרק 02 — ולאן ממשיכים',
      blocks: [
        {
          kind: 'p',
          text:
            'מ-7 קבצים ל-13: שישה חדשים (הפתרון, שתי הספריות והדומיין הראשון) ושלושה ששונו ' +
            '(תגית mod). פתחו את Program.cs בעץ וראו את התמונה המלאה אחרי השינויים.',
        },
        { kind: 'h', text: 'מה לקחתם מהפרק' },
        {
          kind: 'ul',
          items: [
            'גבולות נאכפים בקומפילציה: ‏SDK מינימלי + גרף הפניות חד-כיווני, לא משמעת בלבד.',
            'הממשק גר אצל מי שצריך אותו (ה-Core), לא אצל מי שמממש אותו — היפוך התלות.',
            'Program.cs הוא נקודת ההרכבה היחידה: שורת AddScoped אחת מחברת חוזה למימוש.',
            'מימוש בזיכרון הוא לא פשרה — הוא הוכחת ה-seam שתשתלם בפרקים 03 ו-15.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'בפרק 03 נפדה את ההבטחה: ‏EF Core עם SQLite יחליף את הרשימה שבזיכרון. תצפו מראש ' +
            'איזה קבצים ישתנו — אם הניבוי שלכם הוא "רק Infrastructure ושורת רישום אחת", הבנתם את הפרק.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch02',
        title: 'TaskForge אחרי פרק 02',
      },
    },
  ],

  /* ------------------------------------------------------------ quiz */
  quiz: [
    {
      q: 'כמה הפניות (ProjectReference) יש ל-TaskForge.Core, ולמה?',
      options: [
        'אחת — ל-Infrastructure, כדי לקרוא נתונים',
        'שתיים — ל-Api ול-Infrastructure',
        'אפס — ה-Core הוא מרכז הגרף: כולם מצביעים אליו, הוא לא מצביע על אף אחד',
        'תלוי בגודל הפרויקט',
      ],
      answer: 2,
      explain:
        'חוק התלות: הדומיין לא תלוי בכלום. אפס הפניות זה לא מקרה — זה המבחן שהארכיטקטורה חיה.',
    },
    {
      q: 'למה IProjectRepository מוגדר ב-Core ולא ב-Infrastructure, ליד המימוש?',
      options: [
        'כי קבצים קטנים שמים בפרויקט הקטן',
        'היפוך תלות: הדומיין מגדיר אילו שירותים הוא צריך; אם הממשק היה ב-Infrastructure, ה-Core היה תלוי בפרטי אחסון',
        'כי ממשקים חייבים להיות באותו פרויקט כמו הישויות מסיבה טכנית',
        'אין הבדל — זה עניין של טעם',
      ],
      answer: 1,
      explain:
        'זה ה-D של SOLID: שתי השכבות תלויות בהפשטה, וההפשטה שייכת לשכבה הגבוהה. ככה אפשר להחליף את כל ה-Infrastructure בלי לגעת ב-Core.',
    },
    {
      q: 'בפרק 03 EF Core יחליף את הרשימה שבזיכרון. אילו קבצים יצטרכו להשתנות?',
      options: [
        'כל השכבות — החלפת אחסון נוגעת בהכול',
        'ה-Core וה-Infrastructure',
        'רק ה-Infrastructure (מימוש חדש) ושורת הרישום ב-Program.cs',
        'רק Program.cs',
      ],
      answer: 2,
      explain:
        'זה בדיוק ה-seam: מימוש חדש לצד (או במקום) הישן, ועדכון שורת ה-AddScoped. הממשק, הישות וה-endpoint לא זזים.',
    },
    {
      q: 'מה ההבדל המעשי בין Microsoft.NET.Sdk לבין Microsoft.NET.Sdk.Web בקובץ csproj?',
      options: [
        'רק שם — היכולות זהות',
        'ה-Web SDK מצרף את עולם ASP.NET Core ונקודת כניסה של שרת; ה-SDK הרגיל נותן ספרייה טהורה שלא יכולה אפילו לקמפל קוד HTTP',
        'ה-SDK הרגיל מהיר יותר לבנייה ולכן עדיף תמיד',
        'ה-Web SDK נדרש לכל פרויקט שיש בו async',
      ],
      answer: 1,
      explain:
        'בחירת ה-SDK היא גבול ארכיטקטוני: בשכבות הפנימיות, using של AspNetCore פשוט לא יתקמפל. הגבול נאכף חינם, בכל build.',
    },
    {
      q: 'למה רשמנו את ה-repository כ-Scoped דווקא?',
      options: [
        'כי Scoped הוא ברירת המחדל היחידה המותרת לממשקים',
        'כי הוא הכי מהיר',
        'כדי לשקף מראש את מחזור החיים של DbContext שיחליף אותו — מופע לכל בקשה — כך שההחלפה בפרק 03 תהיה שקופה גם בממד הזה',
        'במקרה — אין לזה משמעות',
      ],
      answer: 2,
      explain:
        'DbContext של EF Core הוא Scoped קלאסי (יחידת עבודה לכל בקשה). רישום ה-seam באותו מחזור חיים מראש מבטל הפתעות בהחלפה.',
    },
    {
      q: 'ניסיתם להוסיף ל-TaskForge.Core הפניה ל-TaskForge.Api. מה יקרה?',
      options: [
        'יעבוד — הפניות הן דו-כיווניות ממילא',
        'ייווצר מעגל בגרף ההפניות (Api מפנה ל-Core שמפנה ל-Api) והבנייה תיכשל עם שגיאת circular dependency',
        'יעבוד אבל עם אזהרה',
        'ה-CLI ימיר את ההפניה ל-NuGet אוטומטית',
      ],
      answer: 1,
      explain:
        'MSBuild בונה לפי גרף חסר-מעגלים. ברגע ששני פרויקטים מצביעים זה על זה — אין סדר בנייה חוקי, והכלים עוצרים אתכם. חוק התלות נאכף במכונה.',
    },
  ],

  /* ------------------------------------------------------------ prove it */
  proveIt: [
    {
      title: 'הפתרון בונה את שלושת הפרויקטים',
      body: 'מתיקיית server, בנייה אחת צריכה לעבור על Core, אז Infrastructure, אז Api.',
      command: 'dotnet build',
      expect: 'Build succeeded עם שלושה פרויקטים, בלי אזהרות.',
    },
    {
      title: 'ל-Core אין הפניות',
      body: 'ודאו שחוק התלות מתקיים בפועל.',
      command: 'dotnet list TaskForge.Core/TaskForge.Core.csproj reference',
      expect: 'There are no Project to Project references in project... — בדיוק מה שרצינו.',
    },
    {
      title: 'ה-endpoint העסקי עובד',
      body: 'הריצו את השרת וקראו לפרויקטים.',
      command: 'GET http://localhost:5080/api/projects',
      expect: 'מערך של 3 פרויקטים עם id, ‏name ו-description בלבד.',
    },
    {
      title: 'מקרה הקצה של ה-null',
      body: 'בדקו את פרויקט 3 בתשובה.',
      command: 'GET http://localhost:5080/api/projects',
      expect: '"description": null אצל Internal Tools — ה-? מהישות הגיע עד ה-JSON.',
    },
    {
      title: 'שום דבר מפרק 01 לא נשבר',
      body: 'הריצו את כל הבקשות הישנות ב-requests.http.',
      command: 'GET http://localhost:5080/di/lifetimes',
      expect: 'אותה התנהגות מוכרת + X-Elapsed-Ms על כל תשובה.',
    },
  ],

  /* ------------------------------------------------------------ exercise */
  exercise: {
    prompt:
      'השלימו את ה-seam בכוחות עצמכם: ‏endpoint לפרויקט בודד. החוזה כבר קיים (GetByIdAsync) — נשאר רק לחבר אותו לעולם.',
    tasks: [
      'הוסיפו GET /api/projects/{id} שמקבל int id בפרמטר ה-handler וקורא ל-GetByIdAsync עם ה-CancellationToken.',
      'כשהפרויקט לא נמצא החזירו Results.NotFound(); כשנמצא — Results.Ok עם אותה הקרנה בדיוק כמו ברשימה.',
      'הוסיפו ל-requests.http שתי בקשות: אחת ל-id קיים (2) ואחת ל-id שלא קיים (99).',
      'אתגר: חלצו את ההקרנה הכפולה (שני המקומות שממפים פרויקט לאובייקט האנונימי) למתודה סטטית אחת קטנה ב-Program.cs.',
    ],
    acceptance: [
      'GET /api/projects/2 מחזיר 200 עם Mobile App; ‏GET /api/projects/99 מחזיר 404 ריק.',
      'ה-handler תלוי אך ורק ב-IProjectRepository — שום אזכור של InMemory בקוד ה-endpoint.',
      'ה-id מגיע מהנתיב בלי attribute — ‏Minimal API מזהה לבד פרמטר route לפי השם.',
      'אין שכפול של אובייקט ההקרנה בשני מקומות.',
    ],
  },
};
