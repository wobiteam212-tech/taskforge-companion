import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 01 — .NET anatomy: Program.cs as two halves, DI lifetimes,
 * and the middleware pipeline. First chapter with a verified reference
 * snapshot (reference/ch01) — every code panel here is the compiled truth.
 */
export const CH01_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 1.1 */
    {
      id: '1.1',
      title: 'שרת ווב הוא לולאה',
      blocks: [
        {
          kind: 'p',
          text:
            'לפני שורת קוד אחת, המודל המנטלי: שרת ווב הוא לולאה אינסופית שמחכה לבקשות. ' +
            'בכל סיבוב היא מקבלת bytes מה-socket, מפענחת אותם לבקשת HTTP, מעבירה את הבקשה ' +
            'דרך שרשרת תחנות עיבוד, ובסוף כותבת bytes של תשובה חזרה.',
        },
        {
          kind: 'p',
          text:
            'ב-ASP.NET Core ללולאה הזו קוראים Kestrel — שרת ה-HTTP המובנה. הוא מהיר ברמות ' +
            'עולמיות, והוא זה שמאזין לפורט. כל מה שאנחנו כותבים במדריך הוא מה שקורה ' +
            'בין הרגע ש-Kestrel פענח בקשה לרגע שהוא שולח תשובה.',
        },
        {
          kind: 'term',
          name: 'Kestrel',
          definition:
            'שרת ה-HTTP המובנה של ASP.NET Core: מאזין לפורט, מפענח בקשות, וכותב תשובות. אנחנו כמעט אף פעם לא נוגעים בו ישירות — רק בונים את מה שרץ בתוכו.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה להתחיל מהמודל הזה? כי כל מושג בפרק — DI, ‏middleware, ‏endpoints — הוא תשובה לשאלה ' +
            'אחת: "מה בדיוק קורה לבקשה בתוך הלולאה?". כשמחזיקים את התמונה הזו, שום דבר לא קסם.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `flowchart TD
  B["Browser / REST Client"] -- "GET /healthz" --> K["Kestrel<br/>מאזין לפורט 5080"]
  K --> MW1["Middleware: Logging"]
  MW1 --> MW2["Middleware: Timing"]
  MW2 --> R["Routing"]
  R --> EP["Endpoint handler<br/>() => Results.Ok(...)"]
  EP -. "response" .-> R
  R -. "response" .-> MW2
  MW2 -. "response" .-> MW1
  MW1 -. "response" .-> K
  K -. "200 OK" .-> B`,
        caption: 'מסע בקשה אחת: יורדת דרך כל התחנות, והתשובה מטפסת חזרה דרך אותן תחנות בסדר הפוך',
      },
    },

    /* ------------------------------------------------------------ 1.2 */
    {
      id: '1.2',
      title: 'הולדת הפרויקט: dotnet new web',
      blocks: [
        {
          kind: 'p',
          text:
            'ניצור את פרויקט ה-API בתוך תיקיית `server` של הריפו שהקמתם בפרק 00. אנחנו משתמשים ' +
            'בתבנית `web` — התבנית הריקה ביותר שיש: ‏Program.cs מינימלי ושני קובצי הגדרות, בלי ' +
            'שום דבר שלא נבין.',
        },
        {
          kind: 'callout',
          tone: 'alt',
          body:
            'התבנית `webapi` מגיעה עם OpenAPI מובנה ודוגמת WeatherForecast. נחמד לדמו של חמש דקות, ' +
            'אבל גרוע ללמידה: קוד שלא כתבתם הוא קוד שלא תוכלו להסביר בראיון. נוסיף OpenAPI בעצמנו בפרק 04.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            'שימו לב לדגל `-o`: בלעדיו הפרויקט נוצר בתיקייה הנוכחית ולא בתת-תיקייה, ותקבלו ' +
            'בלגן של קבצים בשורש `server`. אם זה קרה — מוחקים ומתחילים נקי.',
        },
        {
          kind: 'p',
          text:
            'אחרי היצירה הריצו את השרת ופתחו את הכתובת בדפדפן — תקבלו "Hello World!". ‏זה כל ' +
            'מה שהתבנית נותנת, ובדיוק בגלל זה בחרנו בה. עכשיו נחליף את התוכן שלה בקוד שלנו, שורה-שורה.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'bash',
        file: 'terminal — create & run the project',
        code: `cd taskforge/server

# התבנית הריקה ביותר: Program.cs + הגדרות, ותו לא
dotnet new web -n TaskForge.Api -o TaskForge.Api

cd TaskForge.Api
dotnet run
# info: Microsoft.Hosting.Lifetime[14]
#       Now listening on: http://localhost:5xxx`,
      },
    },

    /* ------------------------------------------------------------ 1.3 */
    {
      id: '1.3',
      title: 'csproj — תעודת הזהות של הפרויקט',
      blocks: [
        {
          kind: 'p',
          text:
            'הקובץ `server/TaskForge.Api/TaskForge.Api.csproj` הוא תעודת הזהות: איזה SDK, איזו ' +
            'גרסת ‎.NET, ואילו יכולות שפה מופעלות. הוא קצר להפליא — וכל שורה בו עובדת בשבילכם.',
        },
        { kind: 'h', text: 'שורה-שורה' },
        {
          kind: 'ul',
          items: [
            '`Sdk="Microsoft.NET.Sdk.Web"` — ה-SDK של פרויקטי ווב: מקמפל, מצרף אוטומטית את כל חבילות ASP.NET Core, ויודע להריץ שרת.',
            '`TargetFramework: net10.0` — הגרסה שאנחנו מקמפלים אליה. זה מה שקובע אילו APIs זמינים.',
            '`Nullable: enable` — המהדר רודף אחרי null-ים: כל reference type חייב להצהיר אם הוא יכול להיות null. חוסך משפחה שלמה של באגים.',
            '`ImplicitUsings: enable` — usings נפוצים (System, ‏Microsoft.AspNetCore.Builder ועוד) מיובאים אוטומטית, ולכן Program.cs שלנו כמעט בלי שורות using.',
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'אין כאן רשימת קבצים! בניגוד לפרויקטים עתיקים, ה-SDK כולל אוטומטית כל קובץ ‎.cs ' +
            'בתיקייה. מוסיפים קובץ — הוא בפנים. זו הסיבה שקובץ הפרויקט נשאר קטן גם כשהפרויקט גדל.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch01',
        file: 'server/TaskForge.Api/TaskForge.Api.csproj',
      },
    },

    /* ------------------------------------------------------------ 1.4 */
    {
      id: '1.4',
      title: 'Program.cs — שני חצאים סביב Build()',
      blocks: [
        {
          kind: 'p',
          text:
            'זה הקובץ החשוב ביותר בצד השרת, והנה המודל המנטלי שילווה אתכם לתמיד: ‏Program.cs ' +
            'מחולק לשני חצאים על ידי הקריאה `builder.Build()`. לפני — מגדירים יכולות. אחרי — בונים התנהגות.',
        },
        {
          kind: 'ul',
          items: [
            'החצי הראשון (`builder.Services`) — רישום שירותים: "כשמישהו יבקש X, ככה מייצרים אותו". שום דבר לא רץ עדיין.',
            '`builder.Build()` — הרגע שבו ה-container ננעל והאפליקציה נולדת. מכאן אי אפשר לרשום שירותים חדשים.',
            'החצי השני (`app.Use`, ‏`app.MapGet`) — בניית ה-pipeline וה-endpoints: "ככה מטפלים בבקשה".',
            '`app.Run()` — מדליקים את הלולאה. השורה הזו חוסמת עד שהשרת נסגר.',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ההבדל בין builder.Services לבין app.Use, ולמה הסדר ביניהם קשיח?',
          body: [
            '`builder.Services` מאכלס את ה-DI container — קטלוג של "איך מייצרים כל שירות". ‏`app.Use` בונה את שרשרת הטיפול בבקשה.',
            'הקטלוג חייב להינעל ב-`Build()` לפני שהאפליקציה רצה, כי ה-middlewares וה-endpoints נשענים עליו בזמן ריצה.',
            'ניסיון לרשום שירות אחרי `Build()` זורק חריגה — וזה פיצ׳ר: הוא מגן עליכם מ-container שמשתנה תוך כדי תנועה.',
          ],
        },
        {
          kind: 'p',
          text:
            'הקובץ המלא מוצג בפאנל — קראו אותו פעם אחת מלמעלה למטה בלי להיבהל. בארבעת הצעדים ' +
            'הבאים נקליד ונפרק כל אזור בנפרד: הרישום, הגששים, ה-middleware וה-endpoints.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch01',
        file: 'server/TaskForge.Api/Program.cs',
        title: 'התמונה המלאה — נפרק אותה צעד-צעד',
      },
    },

    /* ------------------------------------------------------------ 1.5 */
    {
      id: '1.5',
      title: 'החצי הראשון: רישום ב-DI',
      blocks: [
        {
          kind: 'term',
          name: 'Dependency Injection',
          definition:
            'דפוס שבו מחלקה לא מייצרת את התלויות שלה בעצמה אלא מקבלת אותן מבחוץ. ה-DI Container של ‎.NET הוא המפעל המרכזי שמייצר ומזריק הכול.',
        },
        {
          kind: 'p',
          text:
            'במקום ש-handler ייצר לעצמו שירותים עם `new`, הוא מצהיר מה הוא צריך — וה-container ' +
            'מספק. שלוש שורות הרישום שלנו אומרות: "כשמישהו מבקש Probe, ככה תייצר אותו". ההבדל ' +
            'היחיד בין השלוש הוא מחזור החיים.',
        },
        { kind: 'h', text: 'פירוק השורה' },
        {
          kind: 'ul',
          items: [
            '`builder.Services` — אוסף ההרשמות (`IServiceCollection`). עדיין לא מפעל — רק קטלוג.',
            '`AddSingleton<SingletonProbe>()` — הרשמה גנרית: הטיפוס המבוקש הוא גם הטיפוס שמיוצר. בהמשך נרשום גם זוגות ממשק-מימוש.',
            'שלושת מחזורי החיים: ‏Singleton (מופע אחד לכל חיי האפליקציה), ‏Scoped (מופע אחד לכל בקשת HTTP), ‏Transient (מופע חדש בכל הזרקה).',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה לא פשוט `new` בכל מקום? כי DI נותן נקודת שליטה אחת: להחליף מימוש (אמיתי מול מדומה ' +
            'בבדיקות), לשלוט במחזור חיים, ולשתף מופע אחד יקר (כמו חיבור ל-DB) בין כל מי שצריך.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch01',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-1.5',
      },
    },

    /* ------------------------------------------------------------ 1.6 */
    {
      id: '1.6',
      title: 'שלושת מחזורי החיים — בעיניים',
      blocks: [
        {
          kind: 'term',
          name: 'Service Lifetime',
          definition:
            'כמה זמן חי מופע שה-DI Container ייצר: ‏Singleton לכל חיי האפליקציה, ‏Scoped לאורך בקשת HTTP אחת, ‏Transient נולד מחדש בכל הזרקה.',
        },
        {
          kind: 'p',
          text:
            'במקום לשנן — תראו. בדמו החי כל "בקשה" מזריקה כל גשש פעמיים, בדיוק כמו ה-endpoint ' +
            'שנבנה עוד שני צעדים. צבע זהה פירושו אותו מופע. שלחו שלוש-ארבע בקשות ואז אתחלו את האפליקציה.',
        },
        {
          kind: 'ul',
          items: [
            'ה-singleton שומר על צבע אחד לנצח — עד האתחול, שמדמה הפעלה מחדש של השרת.',
            'ה-scoped מחליף צבע בין בקשות, אבל שתי ההזרקות באותה בקשה חולקות צבע — אותו מופע.',
            'ה-transient שונה אפילו בתוך אותה שורה: כל הזרקה היא `new`.',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מתי תבחרו Scoped, מתי Singleton, ומהי captive dependency?',
          body: [
            'Singleton למה שיקר לייצר ובטוח לשיתוף (קונפיגורציה, ‏HttpClient factory, ‏cache). ‏Scoped למה שקשור לבקשה אחת — הדוגמה הקלאסית היא DbContext של EF Core. ‏Transient לאובייקטים קלים וחסרי state.',
            'Captive dependency היא הטעות שבה Singleton מקבל בהזרקה Scoped: ה-Singleton "כולא" אותו לנצח, וה-Scoped מפסיק להתחדש בין בקשות. ‏ASP.NET Core אף זורק על זה חריגה במצב פיתוח.',
          ],
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () => import('./demos/lifetimes.demo').then((m) => m.LifetimesDemo),
        caption: 'סימולציה נאמנה של ההתנהגות בשרת: צבע זהה = מופע זהה',
      },
    },

    /* ------------------------------------------------------------ 1.7 */
    {
      id: '1.7',
      title: 'הגששים: הקובץ הראשון שלכם',
      blocks: [
        {
          kind: 'p',
          text:
            'הקוד שמאחורי הדמו הוא הקובץ הראשון שתקלידו בפרויקט: `server/TaskForge.Api/Services/LifetimeProbes.cs`. ' +
            'שלוש מחלקות זהות לחלוטין — ההבדל היחיד הוא איך רשמנו אותן ב-container.',
        },
        { kind: 'h', text: 'אנטומיה של הקובץ' },
        {
          kind: 'ul',
          items: [
            '`namespace TaskForge.Api.Services;` — ‏file-scoped namespace: שורה אחת בלי סוגריים מסולסלים, וכל הקובץ בפנים. התיקייה והמרחב תואמים — מוסכמה שתלווה אותנו.',
            '`sealed` — המחלקה לא מיועדת להורשה. ברירת המחדל שלנו לכל מחלקה, עד שיש סיבה הפוכה.',
            '`public Guid Id { get; } = Guid.NewGuid();` — ‏property לקריאה בלבד שמאותחל פעם אחת ברגע היצירה. לכן ה-Id חושף בדיוק מתי נוצר מופע.',
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'הטריק הזה — שדה Guid שנולד ב-constructor — הוא כלי אבחון אמיתי, לא רק תרגיל. ' +
            'כשתחשדו אי-פעם שמשהו נוצר יותר מדי פעמים (או פחות מדי), גשש כזה עונה בשנייה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch01',
        file: 'server/TaskForge.Api/Services/LifetimeProbes.cs',
      },
    },

    /* ------------------------------------------------------------ 1.8 */
    {
      id: '1.8',
      title: 'endpoint הגילוי: ‎/di/lifetimes',
      blocks: [
        {
          kind: 'p',
          text:
            'עכשיו נחבר את הגששים לעולם: ‏endpoint שמזריק כל probe פעמיים ומחזיר את כל המזהים. ' +
            'שימו לב לקסם השקט של Minimal APIs — אנחנו פשוט מצהירים על פרמטרים, וה-framework מזהה ' +
            'שהטיפוסים רשומים ב-DI ומזריק אותם. בלי attributes, בלי טקס.',
        },
        {
          kind: 'ul',
          items: [
            'הפרמטרים `scopedA` ו-`scopedB` הם שתי הזרקות של אותו טיפוס באותה בקשה — ולכן יחזרו עם אותו Id.',
            '`Results.Ok(new { ... })` — אובייקט אנונימי שמסודרל אוטומטית ל-JSON עם status ‏200.',
            'הריצו את הבקשה פעמיים ברצף והשוו: רק ה-singleton שורד בין הבקשות.',
          ],
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            'אם תבקשו בפרמטר טיפוס שלא רשום ב-container, ‏Minimal API ינסה לפרש אותו כגוף הבקשה ' +
            '(JSON body) — ותקבלו שגיאה מבלבלת על body חסר. כששירות "לא מוזרק", הדבר הראשון לבדוק הוא שורת הרישום.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch01',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-1.8',
      },
    },

    /* ------------------------------------------------------------ 1.9 */
    {
      id: '1.9',
      title: 'ה-pipeline: מסע הבקשה',
      blocks: [
        {
          kind: 'term',
          name: 'Middleware',
          definition:
            'תחנת עיבוד בצינור הבקשות: מקבלת את הבקשה, יכולה לפעול לפניה ואחריה, ומחליטה אם להעביר הלאה (next) או לעצור ולענות בעצמה.',
        },
        {
          kind: 'p',
          text:
            'החצי השני של Program.cs בונה צינור: כל בקשה עוברת תחנה-תחנה עד ה-endpoint, והתשובה ' +
            'חוזרת דרך אותן תחנות בסדר הפוך. תחשבו על בצל, או על מטריושקה: התחנה הראשונה עוטפת את כולן, ' +
            'ולכן היא רואה את הבקשה ראשונה ואת התשובה אחרונה.',
        },
        {
          kind: 'p',
          text:
            'שלחו בקשה בדמו ועקבו אחרי הכיוונים: כתום בדרך פנימה, טורקיז בדרך החוצה. לחצו על כל ' +
            'תחנה כדי לקרוא מה תפקידה.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה סדר ה-middlewares קריטי? תנו דוגמה לבאג שנובע מסדר שגוי.',
          body: [
            'כל middleware רואה רק את מה שהתחנות שלפניו העבירו. ‏Authentication חייב לרוץ לפני Authorization — אחרת אין משתמש לבדוק הרשאות עליו.',
            'דוגמה קלאסית: אם רושמים exception handler אחרי ה-endpoints, הוא לעולם לא יתפוס חריגות — הן כבר ברחו במעלה הצינור. עוטפים תמיד מבחוץ.',
          ],
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () => import('./demos/pipeline.demo').then((m) => m.PipelineDemo),
        caption: 'הצינור של TaskForge.Api כפי שבניתם אותו — לחיצה על תחנה מסבירה את תפקידה',
      },
    },

    /* ------------------------------------------------------------ 1.10 */
    {
      id: '1.10',
      title: 'כותבים middleware ביד',
      blocks: [
        {
          kind: 'p',
          text:
            'שני middlewares משלנו, בלי ספריות. הצורה הבסיסית: `app.Use(async (context, next) =>)` — ' +
            'מקבלים את `HttpContext` (כל מה שידוע על הבקשה והתשובה) ואת `next` (הזמנה להמשך הצינור).',
        },
        { kind: 'h', text: 'פירוק שורה-שורה' },
        {
          kind: 'ul',
          items: [
            'קוד לפני `await next(context)` רץ בדרך פנימה; קוד אחריו רץ בדרך החוצה — אחרי שכל מי שבפנים סיים.',
            'middleware הלוגים כותב שתי שורות: אחת לפני ואחת אחרי. בקונסול תראו אותן עוטפות כל בקשה.',
            'middleware הזמן מפעיל Stopwatch, אבל את הכותרת הוא קובע בתוך `Response.OnStarting` — ‏callback שרץ רגע לפני שהתשובה מתחילה לזרום.',
          ],
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            'למה לא להוסיף את הכותרת אחרי `await next`? כי ברגע שגוף התשובה התחיל להיכתב ל-socket, ' +
            'ה-headers כבר נשלחו — ונסיון לשנות אותם זורק `InvalidOperationException`. ‏`OnStarting` הוא ' +
            'החלון האחרון החוקי. זו שאלת ראיון מצוינת בתחפושת של באג.',
        },
        {
          kind: 'callout',
          tone: 'alt',
          body:
            'ל-middleware רב-שימוש כותבים מחלקה עם `InvokeAsync` ורושמים עם `app.UseMiddleware<T>()`. ' +
            'נעשה את זה כשנבנה את ה-exception handler האמיתי. ‏lambda מתאימה לדברים קטנים ומקומיים.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch01',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-1.10',
      },
    },

    /* ------------------------------------------------------------ 1.11 */
    {
      id: '1.11',
      title: 'ה-endpoints הראשונים',
      blocks: [
        {
          kind: 'term',
          name: 'Endpoint',
          definition:
            'היעד הסופי של בקשה: צירוף של תבנית נתיב (route) ו-handler. ‏Routing בוחר endpoint אחד לפי ה-method וה-path — או מחזיר 404 אם אין התאמה.',
        },
        {
          kind: 'p',
          text:
            'שני endpoints פשוטים: שורש שמחזיר מחרוזת (סימן חיים) ו-`/healthz` שמחזיר JSON. ' +
            'שימו לב כמה מעט קוד: ‏lambda שמחזירה ערך, וה-framework כבר יודע לסדרל, לקבוע content-type ולכתוב סטטוס.',
        },
        {
          kind: 'ul',
          items: [
            'מחרוזת חוזרת כ-`text/plain` עם 200; אובייקט חוזר כ-JSON.',
            '`Results.Ok(...)` מפורש יותר — והוא הסגנון שנעמיק בו בפרק 04 עם TypedResults.',
            '`/healthz` הוא המוסכמה לבדיקת חיים: ‏load balancers ו-Kubernetes מצלצלים אליו כדי לדעת שהשרת מתפקד. נרחיב אותו בפרק 17.',
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'בקשה ל-path שלא קיים מקבלת 404 משכבת ה-Routing — ה-handler אף פעם לא רץ, אבל ה-middlewares ' +
            'שלנו כן! בדקו בקונסול: גם 404 מקבל שורות started/finished. הצינור עוטף הכול.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch01',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-1.11',
      },
    },

    /* ------------------------------------------------------------ 1.12 */
    {
      id: '1.12',
      title: 'הגדרות: פורט, סביבה, לוגים',
      blocks: [
        {
          kind: 'term',
          name: 'Environment',
          definition:
            'שם הסביבה שבה האפליקציה רצה (Development / Production / שלכם). נקבע על ידי משתנה הסביבה ASPNETCORE_ENVIRONMENT ומשפיע על קונפיגורציה, לוגים והתנהגות שגיאות.',
        },
        {
          kind: 'p',
          text:
            'שלושה קבצים קובעים איך השרת רץ מקומית. הראשון, ‏`server/TaskForge.Api/Properties/launchSettings.json` ' +
            '(בפאנל), הוא ההגדרות של `dotnet run` בלבד: פורט קבוע 5080 וסביבת Development. הוא לא מגיע לפרודקשן לעולם.',
        },
        {
          kind: 'p',
          text: 'השני הוא `server/TaskForge.Api/appsettings.json` — קונפיגורציה לכל הסביבות:',
        },
        {
          kind: 'code',
          lang: 'json',
          title: 'server/TaskForge.Api/appsettings.json',
          code: `{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}`,
        },
        {
          kind: 'p',
          text:
            'והשלישי, ‏`server/TaskForge.Api/appsettings.Development.json`, נטען מעל הראשון רק כשהסביבה ' +
            'היא Development ודורס בו ערכים — אצלנו הוא מרים את לוג ה-framework ל-Information כדי שנראה יותר בזמן פיתוח:',
        },
        {
          kind: 'code',
          lang: 'json',
          title: 'server/TaskForge.Api/appsettings.Development.json',
          code: `{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Information"
    }
  }
}`,
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'באיזה סדר נטענת קונפיגורציה ב-ASP.NET Core, ומי מנצח בהתנגשות?',
          body: [
            'שכבות, מהבסיס למנצח: ‏appsettings.json, אז appsettings.{Environment}.json, אז user-secrets (בפיתוח), אז משתני סביבה, ולבסוף ארגומנטים משורת הפקודה.',
            'כל שכבה דורסת רק את המפתחות שהיא מגדירה. לכן סודות וערכי פרודקשן חיים במשתני סביבה — לא בקבצים שנכנסים ל-git.',
          ],
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch01',
        file: 'server/TaskForge.Api/Properties/launchSettings.json',
      },
    },

    /* ------------------------------------------------------------ 1.13 */
    {
      id: '1.13',
      title: 'requests.http — מגרש הבדיקות',
      blocks: [
        {
          kind: 'p',
          text:
            'במקום לפתוח Postman לכל בדיקה, נחזיק קובץ `server/TaskForge.Api/requests.http` בתוך ' +
            'הריפו: כל בקשה היא טקסט פשוט, ותוסף REST Client מציג כפתור "Send Request" מעל כל אחת. ' +
            'הקובץ גם משמש תיעוד חי של ה-API — והוא יגדל עם כל פרק.',
        },
        {
          kind: 'ul',
          items: [
            '`@host` — משתנה לכל הקובץ; משנים פעם אחת אם הפורט מתחלף.',
            'כל `###` מפריד בקשה — והערות מעליו מסבירות מה בודקים.',
            'הריצו את `/di/lifetimes` פעמיים ברצף והשוו את התשובות זו לצד זו: זו ההוכחה החיה של צעד 1.6.',
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'אחרי שהרצתם בקשה, פתחו את לשונית התשובה וחפשו את הכותרת `X-Elapsed-Ms` — ‏middleware ' +
            'הזמן שלכם עובד. ככה מאמתים middleware: לא מאמינים, בודקים headers.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch01',
        file: 'server/TaskForge.Api/requests.http',
      },
    },

    /* ------------------------------------------------------------ 1.14 */
    {
      id: '1.14',
      title: 'העץ אחרי פרק 01 — ולאן ממשיכים',
      blocks: [
        {
          kind: 'p',
          text:
            'זה כל מה שקיים אחרי הפרק — שבעה קבצים, וכולם שלכם: הקלדתם או סיירתם בכל אחד. ' +
            'בפאנל אפשר ללחוץ על כל קובץ ולקרוא אותו במלואו; התגית new מסמנת שהוא נולד בפרק הזה.',
        },
        { kind: 'h', text: 'מה לקחתם מהפרק' },
        {
          kind: 'ul',
          items: [
            'Program.cs הוא שני חצאים סביב `Build()`: יכולות לפני, התנהגות אחרי.',
            'DI הוא קטלוג ייצור עם שלושה מחזורי חיים — וגששי Guid חושפים אותם.',
            'ה-pipeline הוא בצל: בקשה נכנסת דרך כולם, תשובה יוצאת דרך כולם הפוך.',
            'קונפיגורציה היא שכבות שדורסות זו את זו, וסודות לא נכנסים ל-git.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'בפרק 02 הקובץ היחיד הזה יתפצל לשלוש שכבות — ‏Core, ‏Infrastructure, ‏Api — ותראו למה ' +
            'הפיצול הזה הוא לא בירוקרטיה אלא חופש: להחליף, לבדוק ולגדול בלי פחד.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch01',
        title: 'TaskForge אחרי פרק 01',
      },
    },
  ],

  /* ------------------------------------------------------------ quiz */
  quiz: [
    {
      q: 'ניסיתם לקרוא ל-builder.Services.AddScoped אחרי builder.Build(). מה יקרה?',
      options: [
        'השירות יירשם רגיל — הסדר לא משנה',
        'תיזרק חריגה: ה-container ננעל ברגע ה-Build ואי אפשר לרשום אחריו',
        'השירות יירשם אבל רק כ-Transient',
        'הקוד יתקמפל אבל השירות פשוט יוחזר כ-null',
      ],
      answer: 1,
      explain:
        'Build() נועל את הקטלוג. זו בדיוק מהות "שני החצאים": הגדרת יכולות מסתיימת לפני שההתנהגות מתחילה.',
    },
    {
      q: 'ב-endpoint אחד הזרקתם ScopedProbe פעמיים (scopedA ו-scopedB). מה תקבלו?',
      options: [
        'שני מופעים שונים עם Id שונה',
        'אותו מופע בדיוק — Id זהה, כי שניהם מאותו request scope',
        'חריגה: אסור להזריק טיפוס פעמיים',
        'תלוי בסדר הפרמטרים',
      ],
      answer: 1,
      explain:
        'Scoped פירושו מופע אחד לכל בקשה. כל ההזרקות באותה בקשה — באותו handler או בשירותים אחרים — מקבלות את אותו אובייקט.',
    },
    {
      q: 'איזה middleware רואה את התשובה אחרון, רגע לפני שהיא חוזרת ל-Kestrel?',
      options: [
        'זה שנרשם אחרון ב-Program.cs',
        'ה-endpoint עצמו',
        'זה שנרשם ראשון — כי הוא העוטף החיצוני של הבצל',
        'Routing',
      ],
      answer: 2,
      explain:
        'הראשון שנרשם עוטף את כל השאר: הבקשה פוגשת אותו ראשון והתשובה עוזבת אותו אחרונה. לכן לוגים ו-exception handlers נרשמים ראשונים.',
    },
    {
      q: 'למה middleware הזמן קובע את X-Elapsed-Ms בתוך Response.OnStarting ולא אחרי await next?',
      options: [
        'כי OnStarting מהיר יותר',
        'כי אחרי שגוף התשובה התחיל להישלח ה-headers כבר יצאו, ושינוי שלהם זורק חריגה',
        'כי אחרי await next אי אפשר לגשת ל-context',
        'אין הבדל — שתי הדרכים עובדות',
      ],
      answer: 1,
      explain:
        'Headers נשלחים לפני הגוף. OnStarting הוא ה-callback האחרון שרץ לפני שהם ננעלים — החלון החוקי היחיד להוסיף כותרות מאוחרות.',
    },
    {
      q: 'בקשה הגיעה ל-GET /does-not-exist. מי מחזיר את ה-404, והאם ה-middlewares שלנו רצים?',
      options: [
        'ה-endpoint מחזיר 404, וה-middlewares רצים',
        'Kestrel חוסם את הבקשה לפני הצינור — שום קוד שלנו לא רץ',
        'שכבת ה-Routing מחזירה 404 כי אין התאמה, וה-middlewares שלנו כן רצים ועוטפים גם אותה',
        'מתקבלת חריגה שמפילה את השרת',
      ],
      answer: 2,
      explain:
        'אין endpoint תואם, אז Routing עונה 404 — אבל הוא יושב בתוך הצינור, ולכן הלוגים והטיימר שלנו עדיין עוטפים את הבקשה.',
    },
    {
      q: 'הגדרתם LogLevel שונה ב-appsettings.json וב-appsettings.Development.json. מי מנצח בזמן dotnet run?',
      options: [
        'appsettings.json — הוא הקובץ הראשי',
        'appsettings.Development.json — קובץ הסביבה נטען מעל הבסיס ודורס את המפתחות שהוא מגדיר',
        'תיזרק חריגת קונפיגורציה כפולה',
        'הערך הנמוך מבין השניים',
      ],
      answer: 1,
      explain:
        'launchSettings מציב ASPNETCORE_ENVIRONMENT=Development, ולכן קובץ הסביבה נטען אחרי הבסיס ומנצח בכל מפתח שהוא מגדיר.',
    },
  ],

  /* ------------------------------------------------------------ prove it */
  proveIt: [
    {
      title: 'השרת עולה על 5080',
      body: 'הריצו את השרת מתיקיית הפרויקט וודאו שהוא מאזין לפורט הקבוע שהגדרתם.',
      command: 'dotnet run',
      expect: 'Now listening on: http://localhost:5080',
    },
    {
      title: 'סימן חיים',
      body: 'בדפדפן או ב-requests.http, קראו לשורש.',
      command: 'GET http://localhost:5080/',
      expect: 'TaskForge API is alive',
    },
    {
      title: 'health check מחזיר JSON',
      body: 'ודאו ש-healthz עונה.',
      command: 'GET http://localhost:5080/healthz',
      expect: '{ "status": "healthy" } עם 200.',
    },
    {
      title: 'מחזורי החיים מתנהגים',
      body: 'הריצו פעמיים ברצף והשוו: singleton זהה בין הריצות, scopedA זהה ל-scopedB בכל ריצה, transientA שונה מ-transientB תמיד.',
      command: 'GET http://localhost:5080/di/lifetimes',
      expect: 'בדיוק ההתנהגות מהדמו של צעד 1.6.',
    },
    {
      title: 'ה-middlewares עובדים',
      body: 'בתשובה של כל בקשה חפשו את כותרת הזמן, ובקונסול את שורות הלוג העוטפות.',
      command: 'GET http://localhost:5080/healthz',
      expect: 'כותרת X-Elapsed-Ms בתשובה, ובקונסול "started" לפני "finished with 200".',
    },
  ],

  /* ------------------------------------------------------------ exercise */
  exercise: {
    prompt:
      'הרחיבו את השרת בכוחות עצמכם: middleware שלישי ו-endpoint חדש. אל תציצו בפרקים הבאים — כל מה שצריך כבר בידיים שלכם.',
    tasks: [
      'כתבו middleware שמייצר Guid קצר לכל בקשה, מוסיף אותו ככותרת X-Request-Id לתשובה, וכולל אותו בשורות הלוג.',
      'מקמו אותו ראשון בצינור — לפני הלוגים — כדי שכל השורות של אותה בקשה יחלקו מזהה.',
      'הוסיפו GET /version שמחזיר JSON עם שם האפליקציה, גרסה ("0.1.0") ושם הסביבה הנוכחית (הזריקו IWebHostEnvironment ל-handler).',
      'הוסיפו את שתי הבקשות החדשות ל-requests.http.',
    ],
    acceptance: [
      'כל תשובה כוללת X-Request-Id שונה, ושורות הלוג של אותה בקשה חולקות את אותו מזהה.',
      'GET /version מחזיר {"name":"TaskForge.Api","version":"0.1.0","environment":"Development"}.',
      'ה-handler של /version מקבל את הסביבה בהזרקה — בלי לקרוא משתני סביבה ידנית.',
      'requests.http מכיל את שתי הבקשות עם הערות מסבירות.',
    ],
  },
};
