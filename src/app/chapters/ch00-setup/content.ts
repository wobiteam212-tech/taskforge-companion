import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 00 — Setup: the tools, the product, the map.
 * No app code is written yet (reference snapshots start at ch01);
 * panels here are inline commands, diagrams and a product-taste simulator.
 */
export const CH00_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 0.1 */
    {
      id: '0.1',
      title: 'ברוכים הבאים למסגרה',
      blocks: [
        {
          kind: 'p',
          text:
            'אתם עומדים לבנות ביד, שורה אחרי שורה, אפליקציית פולסטאק שלמה ומודרנית בשם TaskForge: ' +
            'מערכת לניהול פרויקטים ו-Issues, בסגנון Jira רזה. צד שרת ב-‎.NET 10 Minimal APIs, ' +
            'צד קליינט ב-Angular v22, ובאמצע חוזה HTTP נקי שתבינו עד הבורג האחרון.',
        },
        {
          kind: 'p',
          text:
            'הכלל המרכזי של המדריך: שום קובץ לא מופיע בקסם. כל קובץ שקיים באפליקציה הסופית ' +
            'או נכתב כאן ביד יחד אתכם, או נפתח ומוסבר שורה-שורה. בלי "תעתיקו ותסמכו עליי".',
        },
        { kind: 'h', text: 'מה תדעו בסוף המסע' },
        {
          kind: 'ul',
          items: [
            'לעצב ולממש API מלא: ניתוב, ולידציה, שגיאות, אבטחה, בדיקות.',
            'לבנות קליינט Angular מודרני: zoneless, signals, טפסים, ניתוב, state.',
            'לחבר את שני הצדדים נכון: חוזים, CORS, auth מקצה לקצה, טיפול בשגיאות.',
            'להסביר כל בחירה בקול רם בראיון עבודה, כולל האלטרנטיבות שנפסלו.',
          ],
        },
        {
          kind: 'term',
          name: 'Minimal API',
          definition:
            'סגנון כתיבת שרת ב-ASP.NET Core שבו ממפים endpoints ישירות על האפליקציה, בלי Controllers — מינימום טקס, מקסימום שליטה והבנה.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה ביד? כי scaffolding מהיר מייצר אפליקציה שעובדת אבל מפתחים שלא יודעים למה היא עובדת. ' +
            'הקלדה ידנית של כל קובץ, עם הסבר של כל שורה, היא הדרך היחידה לבעלות אמיתית על הידע.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `flowchart TD
  TF(("TaskForge"))
  TF --- P["Projects<br/>צוותים ותפקידים"]
  TF --- I["Issues<br/>סטטוס, עדיפות, תוויות"]
  TF --- C["Comments<br/>דיון על כל Issue"]
  TF --- A["Auth<br/>JWT + Refresh"]
  TF --- B["Board<br/>סינון, מיון, דפדוף"]
  TF --- R["Real-time<br/>SignalR (גל 6)"]`,
        caption: 'TaskForge במבט אחד: הדומיין שתבנו לאורך כל המדריך',
      },
    },

    /* ------------------------------------------------------------ 0.2 */
    {
      id: '0.2',
      title: 'טעימה: ככה ה-API שלכם יתנהג',
      blocks: [
        {
          kind: 'p',
          text:
            'לפני שמתקינים אפילו כלי אחד, שווה לראות לאן חותרים. הסימולטור משמאל מציג שלוש ' +
            'בקשות אמיתיות שה-API שלכם ידע לענות עליהן בסוף גל 1. לחצו על כל בקשה וקראו את התשובה.',
        },
        {
          kind: 'ul',
          items: [
            'רשימת פרויקטים חוזרת כ-JSON עם status `200 OK`.',
            'יצירת Issue מחזירה `201 Created` עם הכתובת של המשאב החדש.',
            'בקשה לא חוקית מקבלת `400` בפורמט ProblemDetails — תקן שגיאות אחיד.',
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'תרגישו בנוח "לשחק" עם כל דבר אינטראקטיבי במדריך. הפאנלים אינם קישוט: הם המודל המנטלי ' +
            'בצורת צעצוע. מי שמשחק, זוכר.',
        },
        {
          kind: 'term',
          name: 'ProblemDetails',
          definition:
            'תקן (RFC 7807) למבנה אחיד של תשובת שגיאה ב-HTTP API: type, title, status, detail — כדי שכל קליינט יידע לקרוא כל שגיאה.',
        },
      ],
      panel: {
        kind: 'simulator',
        scenario: {
          title: 'TaskForge API — הצצה לעתיד',
          blurb: 'שלוש בקשות שתממשו בעצמכם בפרקים 03 עד 05. לחצו ובדקו את התשובות.',
          requests: [
            { method: 'GET', path: '/api/projects', note: 'רשימת הפרויקטים של המשתמש המחובר.' },
            {
              method: 'POST',
              path: '/api/projects/1/issues',
              body: '{\n  "title": "Fix login redirect",\n  "priority": "High"\n}',
              note: 'יצירת Issue חדש בפרויקט 1.',
            },
            {
              method: 'POST',
              path: '/api/projects/1/issues',
              body: '{\n  "title": ""\n}',
              note: 'מה קורה כששולחים כותרת ריקה? ולידציה עוצרת את זה בדלת.',
            },
          ],
          responses: [
            {
              status: 200,
              title: 'OK',
              body: '[\n  { "id": 1, "name": "Website Redesign", "openIssues": 7 },\n  { "id": 2, "name": "Mobile App", "openIssues": 3 }\n]',
            },
            {
              status: 201,
              title: 'Created',
              body: '{\n  "id": 42,\n  "title": "Fix login redirect",\n  "status": "Open",\n  "priority": "High"\n}',
            },
            {
              status: 400,
              title: 'Bad Request',
              body: '{\n  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",\n  "title": "One or more validation errors occurred.",\n  "status": 400,\n  "errors": { "Title": ["The Title field is required."] }\n}',
            },
          ],
          insight: 'שימו לב לעקביות: הצלחות מחזירות משאבים, כישלונות מחזירים ProblemDetails. עקביות היא תכונה.',
        },
      },
    },

    /* ------------------------------------------------------------ 0.3 */
    {
      id: '0.3',
      title: 'הארכיטקטורה במבט-על',
      blocks: [
        {
          kind: 'p',
          text:
            'שתי אפליקציות נפרדות, חוזה אחד. הדפדפן טוען אפליקציית Angular סטטית; היא מדברת עם ' +
            'שרת ‎.NET דרך HTTP בלבד. השרת בנוי בשלוש שכבות עם חוק תלות חד-כיווני, וה-DB הוא SQLite — ' +
            'קובץ אחד, אפס התקנות, מושלם ללמידה.',
        },
        { kind: 'h', text: 'המודל המנטלי' },
        {
          kind: 'ul',
          items: [
            '`TaskForge.Core` — הדומיין: ישויות, DTOs, ממשקים. לא תלוי בכלום.',
            '`TaskForge.Infrastructure` — המימושים: EF Core, DbContext, גישה לנתונים.',
            '`TaskForge.Api` — הקצה: endpoints, ולידציה, auth, הרכבת הכול ב-DI.',
            'הקליינט מכיר רק את החוזה: הוא לא יודע ולא צריך לדעת מה יש מאחורי ה-HTTP.',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה לחלק את השרת לשכבות, ולא לכתוב הכול ב-Program.cs אחד?',
          body: [
            'תשובת מודל: הפרדת אחריות. הדומיין (Core) לא תלוי בטכנולוגיה, ולכן קל לבדוק אותו ולהחליף מימושים.',
            'ה-API תלוי ב-Infrastructure רק דרך ממשקים שמוגדרים ב-Core, ולכן אפשר להחליף DB בלי לגעת בלוגיקה.',
            'בפרויקט קטן זה מרגיש "יותר מדי", אבל זה בדיוק הגודל שבו לומדים את ההרגל — בפרק 02 נצלול לעומק.',
          ],
        },
        {
          kind: 'term',
          name: 'Dependency Rule',
          definition:
            'חוק התלות בארכיטקטורת שכבות: התלות מצביעה תמיד פנימה, אל הדומיין. ה-Core לא יודע ש-EF Core או HTTP קיימים בעולם.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `flowchart LR
  subgraph Client["client/ (Angular v22)"]
    UI["Components<br/>signals + zoneless"] --> ST["Stores + httpResource"]
  end
  subgraph Server["server/ (.NET 10)"]
    API["TaskForge.Api<br/>Minimal API endpoints"] --> CORE["TaskForge.Core<br/>entities · DTOs · interfaces"]
    INFRA["TaskForge.Infrastructure<br/>EF Core · DbContext"] --> CORE
    API --> INFRA
  end
  ST -- "HTTP + JSON" --> API
  INFRA --> DB[("SQLite")]`,
        caption: 'חוק התלות: כל החצים בצד השרת מצביעים אל ה-Core, לעולם לא ממנו החוצה',
      },
    },

    /* ------------------------------------------------------------ 0.4 */
    {
      id: '0.4',
      title: 'איך לומדים עם המדריך הזה',
      blocks: [
        {
          kind: 'p',
          text:
            'לכל צעד יש חוזה קבוע: מה בונים, למה דווקא עכשיו, מה המודל המנטלי, הקוד עצמו (שאתם ' +
            'מקלידים ביד!), מה האלטרנטיבות שנפסלו, ואיך זה נשמע בראיון. בסוף כל פרק: חידון, ' +
            'משימות "הוכיחו שזה עובד", תרגיל, וכל קוד הפרק.',
        },
        { kind: 'h', text: 'לולאת הלמידה בכל צעד' },
        {
          kind: 'ol',
          items: [
            'קוראים את הצעד ומבינים את ה"למה" לפני ה"איך".',
            'מקלידים את הקוד ביד בפרויקט שלכם. לא מעתיקים-מדביקים, חוץ מפקודות טרמינל.',
            'מריצים ובודקים מול משימות ה"הוכיחו שזה עובד".',
            'עונים על החידון. פספסתם? חוזרים לצעד הרלוונטי, הסימנייה שומרת מקום.',
          ],
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            'הפיתוי הכי גדול הוא ללחוץ "העתקה" על כל פאנל קוד. כפתור ההעתקה קיים לפקודות טרמינל ' +
            'ולהשוואת תוצרים — לא להקלדת הקוד עצמו. שרירי האצבעות הם חלק מהזיכרון.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'ההתקדמות, הסימניות וציוני החידונים נשמרים בדפדפן (localStorage). אפשר לסגור הכול ' +
            'ולחזור מחר — הבאנר "המשך מאיפה שעצרת" יחזיר אתכם בדיוק לצעד הנכון.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `flowchart TD
  A["קוראים צעד<br/>(מודל מנטלי)"] --> B["מקלידים ביד<br/>(הקוד שלכם)"]
  B --> C["מריצים ובודקים<br/>(prove it)"]
  C --> D{"עובד?"}
  D -- "כן" --> E["חידון + צעד הבא"]
  D -- "לא" --> F["קוראים שוב את ה-gotcha<br/>ומשווים לקוד הפרק"]
  F --> B`,
        caption: 'הלולאה שתחזרו עליה מאות פעמים במדריך — והיא בדיוק הלולאה של עבודה אמיתית',
      },
    },

    /* ------------------------------------------------------------ 0.5 */
    {
      id: '0.5',
      title: 'מתקינים: ‎.NET 10 SDK',
      blocks: [
        {
          kind: 'p',
          text:
            'צד השרת דורש את ה-SDK של ‎.NET 10. ה-SDK כולל את המהדר, כלי ה-CLI ‏(`dotnet`) ' +
            'ואת ה-Runtime. מורידים מהאתר הרשמי או מתקינים עם winget, ואז מאמתים בטרמינל.',
        },
        {
          kind: 'term',
          name: 'SDK',
          definition:
            'Software Development Kit — כל מה שצריך כדי לפתח ולקמפל: מהדר, ספריות, כלי CLI. ה-Runtime לבדו יודע רק להריץ אפליקציה שכבר קומפלה.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ההבדל בין ‎.NET SDK ל-‎.NET Runtime?',
          body: [
            'ה-SDK מיועד למכונת הפיתוח: קומפילציה, תבניות, ניהול חבילות, הרצת בדיקות.',
            'ה-Runtime מיועד לשרת הייצור: רק להריץ DLLs שקומפלו. קטן יותר, משטח תקיפה קטן יותר.',
            'בדוקר מקובל build עם אימג׳ SDK ו-runtime עם אימג׳ רזה — נראה את זה בעיניים בפרק 19.',
          ],
        },
        {
          kind: 'callout',
          tone: 'warn',
          body:
            'אם `dotnet --list-sdks` מציג רק גרסאות ישנות, סגרו ופתחו מחדש את הטרמינל אחרי ההתקנה — ' +
            'משתני סביבה נטענים רק לטרמינלים חדשים.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'bash',
        file: 'terminal — install & verify .NET 10',
        code: `# Windows (winget) — או הורדה ידנית מ-dotnet.microsoft.com
winget install Microsoft.DotNet.SDK.10

# אימות: אילו SDK מותקנים?
dotnet --list-sdks
# 10.0.xxx [C:\\Program Files\\dotnet\\sdk]

# ומה הגרסה שתשמש כברירת מחדל?
dotnet --version
# 10.0.xxx`,
      },
    },

    /* ------------------------------------------------------------ 0.6 */
    {
      id: '0.6',
      title: 'מתקינים: Node.js ו-pnpm',
      blocks: [
        {
          kind: 'p',
          text:
            'צד הקליינט רץ על כלי הבנייה של Angular, שדורשים Node.js עדכני (גרסה 22 ומעלה; ' +
            'אנחנו עובדים עם 24). כמנהל חבילות נשתמש ב-pnpm — מהיר, חסכוני בדיסק, ועם lockfile קשיח.',
        },
        {
          kind: 'term',
          name: 'pnpm',
          definition:
            'מנהל חבילות ל-Node שמאחסן כל חבילה פעם אחת בדיסק ומקשר אליה בקישורים קשיחים — התקנות מהירות וחיסכון עצום במקום לעומת npm.',
        },
        {
          kind: 'callout',
          tone: 'alt',
          body:
            'אפשר לעבוד גם עם npm או yarn — הפקודות במדריך כמעט זהות. בחרנו pnpm כי כך עובדים ' +
            'גם הפרויקטים האחים בריפו, וכי monorepo עתידי ירוויח ממנו מאוד.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            'אל תערבבו מנהלי חבילות באותו פרויקט: אם קיים `pnpm-lock.yaml`, כל התקנה חייבת להיות ' +
            'עם pnpm. ערבוב משאיר שני lockfiles סותרים ובאגים מסתוריים של "אצלי זה עובד".',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'bash',
        file: 'terminal — install & verify Node + pnpm',
        code: `# בדיקת Node (מותקן? גרסה 22 ומעלה?)
node -v
# v24.x.x

# הפעלת pnpm דרך corepack (מגיע עם Node)
corepack enable pnpm

# אימות
pnpm -v
# 10.x.x`,
      },
    },

    /* ------------------------------------------------------------ 0.7 */
    {
      id: '0.7',
      title: 'מתקינים: Angular CLI v22',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-CLI של Angular הוא הכלי שמייצר פרויקטים, מריץ שרת פיתוח עם HMR, בונה לפרודקשן ' +
            'ומריץ בדיקות. נתקין אותו גלובלית ונוודא שאנחנו על גרסה 22.',
        },
        {
          kind: 'term',
          name: 'CLI',
          definition:
            'Command Line Interface — כלי שמפעילים מהטרמינל. ה-Angular CLI ‏(`ng`) הוא הדרך הרשמית לייצר, להריץ ולבנות פרויקטי Angular.',
        },
        {
          kind: 'callout',
          tone: 'v22',
          body:
            'ב-Angular v22 ברירת המחדל היא אפליקציות zoneless עם change detection מבוסס signals, ' +
            'ו-OnPush היא ברירת המחדל האפקטיבית. את כל המשמעויות נפרק לעומק בפרק 06 — בינתיים רק תתקינו.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'bash',
        file: 'terminal — install & verify Angular CLI',
        code: `# התקנה גלובלית של Angular CLI v22
pnpm add -g @angular/cli@22

# אימות — שימו לב לשורת Angular CLI
ng version
# Angular CLI: 22.x.x
# Node: 24.x.x
# Package Manager: pnpm 10.x.x`,
      },
    },

    /* ------------------------------------------------------------ 0.8 */
    {
      id: '0.8',
      title: 'עורך הקוד והתוספים',
      blocks: [
        {
          kind: 'p',
          text:
            'אפשר לעבוד בכל עורך, אבל המדריך מניח VS Code (חינמי, מצוין לשני הצדדים) או Rider. ' +
            'בפרויקט נשמור קובץ `extensions.json` שממליץ לכל מי שפותח את הריפו על אותם תוספים — ' +
            'זה הקובץ הראשון שתקלידו ביד.',
        },
        {
          kind: 'ul',
          items: [
            '`C# Dev Kit` — אינטליסנס, דיבוג והרצת בדיקות ל-‎.NET.',
            '`Angular Language Service` — השלמות ושגיאות בתוך templates.',
            '`EditorConfig` — אכיפת כללי עיצוב אחידים בין עורכים.',
            '`REST Client` — הרצת קובצי ‎.http ישירות מהעורך; נשתמש בו המון מול ה-API.',
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'קובצי ‎.http יהיו "מגרש הבדיקות" הקבוע שלנו מול השרת: כל endpoint שנבנה ילווה בבקשת ' +
            'דוגמה שאפשר להריץ בלחיצה. הרבה יותר מהר מ-Postman לפיתוח יומיומי.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'json',
        file: '.vscode/extensions.json',
        code: `{
  "recommendations": [
    "ms-dotnettools.csdevkit",
    "angular.ng-template",
    "editorconfig.editorconfig",
    "humao.rest-client"
  ]
}`,
      },
    },

    /* ------------------------------------------------------------ 0.9 */
    {
      id: '0.9',
      title: 'שלד הריפו: server, client, docs',
      blocks: [
        {
          kind: 'p',
          text:
            'TaskForge יחיה בריפו אחד עם שתי אפליקציות אחיות: `server/` ל-‎.NET ו-`client/` ל-Angular. ' +
            'מבנה כזה (monorepo קטן) שומר את החוזה בין הצדדים קרוב, ומאפשר commit אחד לשינוי מקצה לקצה.',
        },
        {
          kind: 'term',
          name: 'Monorepo',
          definition:
            'ריפו אחד שמכיל כמה אפליקציות או חבילות קשורות. היתרון: שינוי חוזה משותף הוא commit אטומי אחד; החיסרון: דורש משמעת בהפרדת תלויות.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            'אל תריצו עדיין `dotnet new` או `ng new`! יצירת הפרויקטים היא רגע למידה שלם — ' +
            'כל קובץ שנוצר יוסבר כשנגיע אליו: השרת בפרק 01, הקליינט בפרק 06.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה `docs/`? כי החלטות ארכיטקטורה ראויות לתיעוד בקוד (ADR — Architecture Decision Records). ' +
            'נכתוב אחת קצרה בכל פעם שנקבל החלטה גדולה, וזה נכס מטורף בראיונות.',
        },
      ],
      panel: {
        kind: 'filetree',
        title: 'taskforge/ — the repo skeleton',
        lines: [
          { text: 'taskforge/', depth: 0, kind: 'dir' },
          { text: '.git/', depth: 1, kind: 'dir', badge: 'new' },
          { text: '.vscode/', depth: 1, kind: 'dir', badge: 'new' },
          { text: 'extensions.json', depth: 2, kind: 'file', badge: 'new' },
          { text: 'server/', depth: 1, kind: 'dir', badge: 'new' },
          { text: '(ריק — מתמלא בפרק 01)', depth: 2, kind: 'comment' },
          { text: 'client/', depth: 1, kind: 'dir', badge: 'new' },
          { text: '(ריק — מתמלא בפרק 06)', depth: 2, kind: 'comment' },
          { text: 'docs/', depth: 1, kind: 'dir', badge: 'new' },
          { text: 'README.md', depth: 1, kind: 'file', badge: 'new' },
          { text: '.gitignore', depth: 1, kind: 'file', badge: 'new' },
        ],
        caption: 'השלד שתיצרו בתרגיל של הפרק — בלי קוד עדיין, רק בית מסודר',
      },
    },

    /* ------------------------------------------------------------ 0.10 */
    {
      id: '0.10',
      title: 'מפת הדרכים: 7 גלים, 27 פרקים (ch00–ch26)',
      blocks: [
        {
          kind: 'p',
          text:
            'המסע בנוי בגלים, וכל גל נשען על קודמו: קודם שרת שלם (כי החוזה נולד שם), אז יסודות ' +
            'קליינט ועיצוב, אז הפיצ׳רים האמיתיים, אז איכות, ולבסוף production אמיתי עם Docker, ' +
            'CI וזמן אמת.',
        },
        {
          kind: 'ul',
          items: [
            'גל 1 — Backend Core: אנטומיה, ארכיטקטורה, נתונים, API מלא, Auth (ch01–05).',
            'גל 2 — Frontend Foundation: יסודות Angular, ארכיטקטורה, עיצוב, UI, ניתוב, HTTP (ch06–11).',
            'גל 3 — Features: פרויקטים, לוח Issues, תגובות וטפסים (ch12–14). הלב.',
            'גל 4 — Craft & Polish: CSS מודרני, command palette, Kanban DnD, דשבורד, issue עשיר, ו-state capstone (ch15–20).',
            'גל 5 — Quality: בדיקות בכל השכבות, ביצועים ונגישות (ch21–22).',
            'גל 6 — Production: הקשחה, SignalR בזמן אמת, Docker + CI, ופינאלה (ch23–26).',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה שרת לפני קליינט? כי הקליינט צורך חוזה. כשמתחילים מה-UI, ה-API יוצא בצורת המסכים ' +
            'במקום בצורת הדומיין — ואז כל מסך חדש שובר אותו. דומיין קודם, מסכים אחר כך.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'קצב מומלץ: פרק אחד בישיבה, עם הפסקות אמיתיות. עדיף פרק אחד שהוקלד והובן לעומק ' +
            'מחמישה שנקראו ברפרוף.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `flowchart LR
  W0["Wave 0<br/>Setup"] --> W1["Wave 1<br/>Backend Core<br/>ch01-05"]
  W1 --> W2["Wave 2<br/>Frontend Foundation<br/>ch06-11"]
  W2 --> W3["Wave 3<br/>Features<br/>ch12-14"]
  W3 --> W4["Wave 4<br/>Craft & Polish<br/>ch15-20"]
  W4 --> W5["Wave 5<br/>Quality<br/>ch21-22"]
  W5 --> W6["Wave 6<br/>Production<br/>ch23-26"]
  style W0 fill:#ff8a3d,color:#1a0e04`,
        caption: 'כל גל נשען על קודמו — ואתם כבר בסוף גל 0',
      },
    },
  ],

  /* ------------------------------------------------------------ quiz */
  quiz: [
    {
      q: 'מה ההבדל המרכזי בין ‎.NET SDK ל-‎.NET Runtime?',
      options: [
        'אין הבדל — אלה שני שמות לאותו דבר',
        'ה-SDK כולל כלי פיתוח וקומפילציה; ה-Runtime יודע רק להריץ אפליקציה שכבר קומפלה',
        'ה-Runtime כולל את ה-SDK בתוכו',
        'ה-SDK מיועד ללינוקס וה-Runtime לחלונות',
      ],
      answer: 1,
      explain:
        'ה-SDK הוא ערכת הפיתוח המלאה (מהדר, תבניות, dotnet CLI); ה-Runtime הוא סביבת ההרצה הרזה שמתאימה לשרת ייצור.',
    },
    {
      q: 'למה המדריך מתעקש שתקלידו את הקוד ביד במקום להעתיק?',
      options: [
        'כדי שהמדריך ייקח יותר זמן',
        'כי העתקה לא חוקית',
        'כי הקלדה פעילה בונה זיכרון והבנה — בעלות אמיתית על הידע במקום אשליית הבנה',
        'כי כפתור ההעתקה לא עובד',
      ],
      answer: 2,
      explain:
        'למידה פעילה מנצחת צפייה פסיבית. ההקלדה מאלצת את המוח לעבד כל שורה, והשגיאות שתעשו בדרך הן חלק מהלמידה.',
    },
    {
      q: 'למה בונים קודם את צד השרת ורק אחר כך את הקליינט?',
      options: [
        'כי ‎.NET חשוב יותר מ-Angular',
        'כי הקליינט צורך חוזה — וה-API צריך לקבל את צורת הדומיין, לא את צורת המסכים',
        'כי זה מה שכולם עושים',
        'אין סיבה — אפשר באותה מידה הפוך',
      ],
      answer: 1,
      explain:
        'כשמעצבים API לפי מסכים הוא נשבר בכל מסך חדש. דומיין יציב קודם, ואז כל UI שהוא רק עוד צרכן של החוזה.',
    },
    {
      q: 'מה תפקיד שכבת `TaskForge.Core` בארכיטקטורה?',
      options: [
        'לארח את ה-endpoints של ה-API',
        'לדבר עם בסיס הנתונים דרך EF Core',
        'להחזיק את הדומיין: ישויות, DTOs וממשקים — בלי תלות בשום טכנולוגיה',
        'להגיש את קובצי ה-Angular לדפדפן',
      ],
      answer: 2,
      explain:
        'ה-Core הוא הלב הנקי: הוא לא יודע ש-HTTP או EF Core קיימים. כל החצים מצביעים אליו — זה חוק התלות.',
    },
    {
      q: 'איזו פקודה בודקת אילו גרסאות ‎.NET SDK מותקנות במחשב?',
      options: ['dotnet --version', 'dotnet --list-sdks', 'dotnet info sdks', 'ng version'],
      answer: 1,
      explain:
        '`dotnet --list-sdks` מציגה את כל ה-SDK המותקנים; `dotnet --version` מציגה רק את הגרסה שתשמש כברירת מחדל בתיקייה הנוכחית.',
    },
  ],

  /* ------------------------------------------------------------ prove it */
  proveIt: [
    {
      title: '‎.NET 10 מותקן',
      body: 'ודאו שה-SDK של ‎.NET 10 מותקן וזמין בטרמינל.',
      command: 'dotnet --list-sdks',
      expect: 'שורה שמתחילה ב-10.0 (לצד גרסאות ישנות אם יש).',
    },
    {
      title: 'Node עדכני',
      body: 'ודאו ש-Node בגרסה 22 ומעלה.',
      command: 'node -v',
      expect: 'v22 ומעלה (במדריך אנחנו על v24).',
    },
    {
      title: 'pnpm פעיל',
      body: 'ודאו ש-pnpm זמין דרך corepack.',
      command: 'pnpm -v',
      expect: 'גרסה 10 ומעלה.',
    },
    {
      title: 'Angular CLI v22',
      body: 'ודאו שה-CLI הגלובלי הוא בגרסה 22.',
      command: 'ng version',
      expect: 'Angular CLI: 22.x.x ולידו Node ו-pnpm שזיהה.',
    },
    {
      title: 'הריפו חי',
      body: 'בתוך תיקיית taskforge, ודאו ש-git מזהה ריפו תקין.',
      command: 'git status',
      expect: 'On branch main (או master) — בלי שגיאת "not a git repository".',
    },
  ],

  /* ------------------------------------------------------------ exercise */
  exercise: {
    prompt:
      'הקימו את שלד הריפו של TaskForge בדיוק כמו בעץ של צעד 0.9, כולל commit ראשון. זה הבית של כל מה שתבנו מכאן והלאה.',
    tasks: [
      'צרו תיקייה בשם taskforge והריצו בתוכה git init.',
      'צרו את התיקיות server, client, docs (אפשר עם קובץ ‎.gitkeep ריק בכל אחת כדי ש-git יעקוב אחריהן).',
      'צרו ‎.vscode/extensions.json עם ארבעת התוספים מצעד 0.8 — מוקלד ביד.',
      'כתבו README.md קצר: מה זה TaskForge, מה ה-stack, ומה מבנה התיקיות.',
      'צרו ‎.gitignore בסיסי (bin/, obj/, node_modules/, dist/) ועשו commit ראשון.',
    ],
    acceptance: [
      'git log מציג commit אחד לפחות עם הודעה ברורה.',
      'git status נקי — שום קובץ לא עוקב שלא בכוונה.',
      'פתיחת הריפו ב-VS Code מציעה להתקין את התוספים המומלצים.',
      'ה-README מסביר את מבנה הריפו במשפטים שלכם, לא בהעתקה מהמדריך.',
    ],
  },
};
