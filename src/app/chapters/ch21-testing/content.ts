import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 21 — Testing: בודקים את מה שבנינו.
 * Wave 5 opener (Quality). Backend: xUnit 2.9.2 + SQLite-in-memory fixture
 * under server/tests/TaskForge.Tests/ — 8 tests, 0 failed, gate-automated.
 * Frontend: vitest pure-unit specs (markdown.spec.ts + fuzzy.spec.ts) —
 * 12 tests, 0 failed, run via `ng test` in the snapshot client.
 * No new app runtime code; no new client dependency (vitest was added in ch06).
 * Verified: dotnet build 0/0, dotnet test 8 passed, ng test 12 passed.
 */
export const CH21_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 21.1 */
    {
      id: '21.1',
      title: 'הפרק: בודקים את מה שבנינו',
      blocks: [
        {
          kind: 'p',
          text:
            'עשרים פרקים. מסד נתונים, auth, repositories, endpoints, signal stores, derived selectors, ' +
            'optimistic updates, markdown, fuzzy search, kanban drag-and-drop — ' +
            'כל זה בנוי ומתפקד. פרק 21 שואל שאלה פשוטה: איך יודעים שהכול עדיין עובד אחרי שמשנים משהו?',
        },
        {
          kind: 'p',
          text:
            'התשובה היא בדיקות אוטומטיות. לא כי "חייבים לבדוק" אלא כי הארכיטקטורה שבנינו — ' +
            'seams ברורים, ממשקים מוגדרים, פונקציות טהורות — הופכת בדיקות לדבר טבעי ולא לעול. ' +
            'פרק זה מגייס כל seam שהשקענו בו: `IProjectRepository` (פרק 04 ו-02), ' +
            '`PasswordHasher` (פרק 05), `EfStatsRepository` (פרק 18), ' +
            '`renderMarkdown` (פרק 19), ו-`fuzzyScore` (פרק 16).',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה הבדיקות זולות כאן?',
          body:
            'בדיקה זולה כשיש לה נקודת כניסה ברורה: פונקציה טהורה, ממשק מוגדר, ' +
            'או seam שמאפשר להחליף תלות. בכל פעם שבנינו `I*Repository` ולא ממשלנו ישירות ב-DbContext, ' +
            'בכל פעם שחלצנו לוגיקה לפונקציה נקייה — שמנו בסיס שהבדיקות דורשות. ' +
            'ה-payoff הוא עכשיו.',
        },
        {
          kind: 'term',
          name: 'פירמידת הבדיקות',
          definition:
            'מודל שמסדר את סוגי הבדיקות לפי עלות ומהירות: בתחתית הרבה בדיקות יחידה מהירות וזולות, ' +
            'באמצע מעט בדיקות אינטגרציה, ובראש מעט מאוד בדיקות קצה-לקצה (e2e) שאיטיות ויקרות. ' +
            'אפליקציית TaskForge: הרבה unit (markdown/fuzzy/PasswordHasher), ' +
            'מעט integration (repos + SQLite), ו-e2e — מתוארות כאן רק קונצפטואלית.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `graph TD
  A["e2e (Playwright)<br/>browser full-stack<br/>few, slow"]
  B["integration<br/>repos + real SQLite-in-memory<br/>fewer"]
  C["unit (pure)<br/>PasswordHasher · fuzzyScore · renderMarkdown<br/>many, fast"]
  A --- B --- C`,
        caption: 'פירמידת הבדיקות של TaskForge — כל שכבה בנויה על ה-seams שפרקים 02–19 הניחו',
      },
    },

    /* ------------------------------------------------------------ 21.2 */
    {
      id: '21.2',
      title: 'פרויקט xUnit: TaskForge.Tests',
      blocks: [
        {
          kind: 'p',
          text:
            'הבדיקות חיות בפרויקט `TaskForge.Tests` תחת `server/tests/`. ' +
            'הבחירה ב-xUnit נובעת מכך שהוא הפריימוורק הנפוץ ביותר ב-.NET, ממוקד ופשוט: ' +
            '`[Fact]` לבדיקה בודדת, `[Theory]` עם `[InlineData]` לבדיקות ממוסרות (parametrize). ' +
            'חבילות: `xunit 2.9.2`, `Microsoft.NET.Test.Sdk 17.12.0`, `xunit.runner.visualstudio 2.8.2`, ' +
            '`Microsoft.EntityFrameworkCore.Sqlite 10.0.9`.',
        },
        {
          kind: 'p',
          text:
            'הפרויקט מפנה ל-`TaskForge.Infrastructure` — ודרכה ל-`TaskForge.Core`. ' +
            'זה אותו seam שהאפליקציה האמיתית משתמשת בו: הבדיקות בוחנות את אותו קוד, ' +
            'לא עותק מיוחד ולא עטיפה. ' +
            'ה-`.slnx` כולל את `tests/TaskForge.Tests/TaskForge.Tests.csproj` — ' +
            'ו-`verify-snapshots.mjs` מזהה ספריית `tests/` ומריץ `dotnet test` אוטומטית לאחר ה-build.',
        },
        {
          kind: 'callout',
          tone: 'dotnet10',
          title: 'המבנה: tests/ בפני עצמה',
          body:
            'ספריית `tests/` נפרדת מ-`TaskForge.Api/`, `TaskForge.Core/` ו-`TaskForge.Infrastructure/`. ' +
            'הפרדה זו היא קונבנציה נפוצה ב-.NET — פרויקטי הבדיקות לא נארזים עם האפליקציה בייצור, ' +
            'ו-`IsPackable=false` / `IsTestProject=true` מגדירים זאת במפורש.',
        },
        {
          kind: 'term',
          name: 'xUnit',
          definition:
            'פריימוורק בדיקות .NET open-source שמבוסס על [Fact] לבדיקה בודדת ' +
            'ו-[Theory]+[InlineData] לבדיקות עם פרמטרים. ' +
            'כל מחלקת בדיקות היא instance חדש (בניגוד ל-NUnit ול-MSTest) — ' +
            'מונע state משותף בין בדיקות ומפשט את ה-lifecycle.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch21',
        file: 'server/tests/TaskForge.Tests/TaskForge.Tests.csproj',
        title: 'TaskForge.Tests.csproj — הגדרת פרויקט xUnit',
      },
    },

    /* ------------------------------------------------------------ 21.3 */
    {
      id: '21.3',
      title: 'Fixture: SQLite In-Memory',
      blocks: [
        {
          kind: 'p',
          text:
            '`SqliteInMemory` היא ה-fixture שמכל בדיקת repository מקבלת. ' +
            'הטריק: `SqliteConnection("Filename=:memory:")` נפתח ונשאר פתוח לכל אורך חיי ה-fixture. ' +
            'ב-SQLite in-memory, ה-DB חי כל עוד החיבור פתוח — ברגע שסוגרים, הוא נעלם. ' +
            '`NewContext()` בונה `TaskForgeDbContext` על אותו חיבור ומפעיל `EnsureCreated()`, ' +
            'שבונה את הסכמה ישירות מהמודל — ללא מיגרציות.',
        },
        {
          kind: 'p',
          text:
            'ה-fixture מממש `IDisposable`: כשהבדיקה מסתיימת, `Dispose()` סוגר את החיבור ' +
            'ו-SQLite מוחק את ה-DB מהזיכרון. כל בדיקה מקבלת DB נקי, מהיר, ' +
            'ושמתנהג בדיוק כמו SQLite האמיתי של האפליקציה — לא mock, לא stub, מסד נתונים אמיתי.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מדוע לא לבדוק מול DB ייצור?',
          body:
            'DB ייצור הוא state משותף בין בדיקות: בדיקה אחת שמוסיפה שורה תשפיע על השנייה. ' +
            'SQLite in-memory מעניק בידוד מלא — כל מחלקת בדיקות יוצרת DB משלה, ' +
            'מאתחלת אותו, ומשאירה אותו לאחר סיומה. אפס דליפה, אפס תלות בסדר ריצה. ' +
            'ה-tradeoff: SQLite אינו זהה ל-PostgreSQL או SQL Server בקורנרים כגון RETURNING, window functions, ' +
            'וJSON. לבדיקות ה-repository של TaskForge — שמשתמש ב-SQLite גם בייצור — זה אידיאלי.',
        },
        {
          kind: 'term',
          name: 'test fixture',
          definition:
            'אובייקט שמכין את הסביבה לפני בדיקה ומנקה אחריה. ' +
            'ב-xUnit: מחלקת בדיקות מממשת IDisposable — xUnit קורא לה ב-constructor ולכד ב-Dispose. ' +
            'SqliteInMemory היא fixture שמנהלת DB חי; ProjectRepositoryTests מחזיק אחת כ-field.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch21',
        file: 'server/tests/TaskForge.Tests/SqliteInMemory.cs',
        region: 'step-21.1',
        diff: true,
        title: 'SqliteInMemory.cs — fixture בידוד DB',
      },
    },

    /* ------------------------------------------------------------ 21.4 */
    {
      id: '21.4',
      title: 'בדיקת יחידה: PasswordHasher',
      blocks: [
        {
          kind: 'p',
          text:
            '`PasswordHasherTests` הוא הדוגמה הנקייה ביותר לבדיקת יחידה: ' +
            'אין DB, אין רשת — רק `new PasswordHasher()` ובדיקות לוגיקה. ' +
            'PBKDF2 עם salt אקראי שנבנה בפרק 05 מקבל כאן את המבחן שלו: ' +
            'ארבע בדיקות, שתי תוצאות (`True`/`False`), ו-`[Theory]` שמריץ שלוש מקרי קלט שגוי.',
        },
        {
          kind: 'p',
          text:
            'הדפוס הוא arrange-act-assert: מסדרים קלט, מפעילים את הקוד שבוחנים, ' +
            'ומוודאים תוצאה. בדיקת ה-salt היא הנאה ביותר: `Hash("same")` פעמיים מחזיר שני ערכים שונים — ' +
            'ושניהם `Verify("same", ...)` מחזירים `true`. ' +
            'זו ההוכחה שה-salt אקראי ולא דטרמיניסטי.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '[Theory] + [InlineData]: בדיקה ממוסרת',
          body:
            '`[Theory]` + `[InlineData("")]` + `[InlineData("not-three-parts")]` + `[InlineData("1.only-two")]` ' +
            'מריץ שלוש בדיקות נפרדות מאותה מתודה. כל שורת InlineData היא בדיקה עצמאית — ' +
            'אם אחת נכשלת, xUnit מדווח בדיוק על איזה קלט. ' +
            'זה עדיף על לולאה בגוף הבדיקה שמפסיקה ב-assertion הראשון.',
        },
        {
          kind: 'term',
          name: 'arrange-act-assert',
          definition:
            'דפוס לכתיבת בדיקות: (1) arrange — מכינים את הקלט והאובייקטים, ' +
            '(2) act — מפעילים את הקוד שבוחנים, (3) assert — מוודאים שהתוצאה היא הצפויה. ' +
            'הפרדה ברורה בין שלושת החלקים מקלה על קריאה ועל אבחון כישלון.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch21',
        file: 'server/tests/TaskForge.Tests/PasswordHasherTests.cs',
        region: 'step-21.2',
        diff: true,
        title: 'PasswordHasherTests.cs — pure unit, [Fact] ו-[Theory]',
      },
    },

    /* ------------------------------------------------------------ 21.5 */
    {
      id: '21.5',
      title: 'בדיקת אינטגרציה: IsMemberAsync',
      blocks: [
        {
          kind: 'p',
          text:
            '`ProjectRepositoryTests` בוחן את `EfProjectRepository.IsMemberAsync` — ' +
            'הפרימיטיב שכל endpoint תלוי בו לבדיקת הרשאה מבוססת-משאב (פרק 04). ' +
            'ה-seed: שני משתמשים, פרויקט, ו-`ProjectMember` אחד בלבד. ' +
            'ה-assert: `IsMemberAsync` מחזיר `true` לחבר ו-`false` לאיש-חוץ.',
        },
        {
          kind: 'p',
          text:
            'שימו לב לשני contexts נפרדים: ה-seed קורה ב-`await using (var seed = ...)` ' +
            'שנסגר לפני ה-act. ה-act פותח context חדש — `await using var db = sqlite.NewContext()`. ' +
            'זה מדמה שתי בקשות HTTP נפרדות: הראשונה מאתחלת, השנייה קוראת. ' +
            'EF לא יכול להשתמש בזיכרון-המטמון שלו מהseed; הוא חייב ללכת ל-DB.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'איזו שגיאה בדיקה זו מונעת?',
          body:
            'כל endpoint שמחזיר נתוני פרויקט קורא ל-`IsMemberAsync` לפני הריצה. ' +
            'אם המימוש היה שגוי — נניח, מחזיר `true` לכולם — כל בדיקת הרשאה הייתה עוברת, ' +
            'והפגיעות הייתה מגיעה ל-production. `ProjectRepositoryTests` נועל את הנתיב הקריטי: ' +
            'הוא מוכיח שמי שאינו חבר — קיבל `false`. ' +
            'זו בדיקת ה-403 path, ישירות מול ה-DB.',
        },
        {
          kind: 'term',
          name: 'בדיקת אינטגרציה',
          definition:
            'בדיקה שמחברת יחד יותר ממרכיב אחד — בדרך כלל קוד + תשתית אמיתית (DB, filesystem, רשת). ' +
            'ProjectRepositoryTests היא integration: EfProjectRepository + TaskForgeDbContext + SQLite-in-memory. ' +
            'יקרה יותר מבדיקת יחידה, אך מוכיחה שה-seam עובד end-to-end.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch21',
        file: 'server/tests/TaskForge.Tests/ProjectRepositoryTests.cs',
        region: 'step-21.3',
        diff: true,
        title: 'ProjectRepositoryTests.cs — IsMemberAsync, שני contexts',
      },
    },

    /* ------------------------------------------------------------ 21.6 */
    {
      id: '21.6',
      title: 'בדיקת אגרגציה: GROUP BY ב-EfStatsRepository',
      blocks: [
        {
          kind: 'p',
          text:
            '`StatsRepositoryTests` מוכיח את שאילתת ה-GROUP BY שפרק 18 בנה. ' +
            'ה-seed: 5 issues עם שילובי סטטוס ועדיפות (Open×2, InProgress×2, Done×1, ' +
            'עדיפויות שונות). ה-assert: `GetForProjectAsync` מחזיר `Total=5`, `Open=2`, ' +
            '`InProgress=2`, `Done=1`, ו-`ByPriority.Sum(p => p.Count) == 5`.',
        },
        {
          kind: 'p',
          text:
            'הבדיקה האחרונה — סכום `ByPriority` שווה ל-`Total` — מוכיחה שלא "נאבדו" issues ' +
            'בגין עדיפות `null` או ערך לא ידוע. זו בדיקת עקביות: שני GROUP BY נפרדים ' +
            '(לפי Status, לפי Priority) חייבים להסתכם לאותו ספירה כוללת.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה לבדוק GROUP BY ולא רק COUNT?',
          body:
            'LINQ GroupBy על IQueryable מתורגם ל-SQL GROUP BY ב-SQLite. ' +
            'אם הנוסחה שגויה — נניח, מסנן issues לפני הספירה — ה-SQL יחזיר ספירות שגויות ' +
            'ורק בדיקה מול DB אמיתי תגלה זאת. Mock שמחזיר ערכים קשיחים לא יגלה באג LINQ. ' +
            'זו הסיבה שבדיקת אינטגרציה עם DB אמיתי-אך-חד-פעמי עדיפה כאן.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch21',
        file: 'server/tests/TaskForge.Tests/StatsRepositoryTests.cs',
        region: 'step-21.4',
        diff: true,
        title: 'StatsRepositoryTests.cs — GROUP BY counts',
      },
    },

    /* ------------------------------------------------------------ 21.7 */
    {
      id: '21.7',
      title: 'vitest בצד הקליינט',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-snapshot client כולל vitest מפרק 06 — לא מוסיפים תלות חדשה. ' +
            '`markdown.spec.ts` ו-`fuzzy.spec.ts` חיים לצד הקבצים שהם בוחנים ב-`core/`. ' +
            'הספקים רצים עם `ng test` בתוך `reference/.build/ch21/client`, וגם מסומנים כ-gate ב-`reference/milestones.json`. ' +
            'פלט אמיתי: 3 test files, 12 tests passed.',
        },
        {
          kind: 'p',
          text:
            'הבדיקות הן pure unit: אין `TestBed`, אין Angular, אין HTTP — ' +
            'רק `import { renderMarkdown } from \'./markdown\'` ו-`import { fuzzyScore, fuzzyRank } from \'./fuzzy\'`. ' +
            'פונקציה נכנסת, מחרוזת יוצאת. vitest + jsdom מאפשרים לבדוק DOM output ' +
            'כשצריך, אבל כאן לא צריך — הפונקציות מחזירות string.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'ng test עכשיו חלק מהשער',
          body:
            'שער `verify:snapshots` עדיין מריץ `ng build`, אבל milestone עם `"test": true` מריץ אחריו גם ' +
            '`ng test --watch=false`. כך `.spec.ts` לא נעלמים מאחורי build ירוק.',
        },
        {
          kind: 'term',
          name: 'vitest',
          definition:
            'פריימוורק בדיקות TypeScript/JavaScript מהיר שבנוי על Vite. ' +
            'תחביר describe/it/expect תואם ל-Jest. Angular CLI משלב אותו כ-test runner ' +
            'כאשר הגדרת `"builder": "@angular/build:unit-test"` בקובץ `angular.json`. ' +
            'מריץ את הספקים ב-jsdom (DOM מדומה) או ב-Node.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `flowchart LR
  subgraph "gate: verify:snapshots"
    B["dotnet build"]
    T["dotnet test (auto)"]
    N["ng build"]
    V["ng test --watch=false"]
    B --> T
    N --> V
  end
  T -.->|"8 xUnit passed"| OK1["server gate green"]
  V -.->|"12 vitest specs pass"| OK2["client gate green"]`,
        caption: 'xUnit ו-vitest רצים כחלק משער ה-snapshot כאשר milestone מסומן test=true',
      },
    },

    /* ------------------------------------------------------------ 21.8 */
    {
      id: '21.8',
      title: 'markdown.spec.ts — escape-first XSS',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-spec הקריטי: מוכיח שפונקציית `renderMarkdown` (פרק 19) מממשת escape-first. ' +
            'כלומר — לפני כל transform, תווי HTML נמלטים. ' +
            'קלט `<script>alert(1)</script>` יוצא כ-`&lt;script&gt;alert(1)&lt;/script&gt;`, ' +
            'לא כ-`<script>` שיופעל ב-DOM.',
        },
        {
          kind: 'p',
          text:
            'הבדיקות הנוספות מכסות את כל ה-transforms: `**bold**` הופך ל-`<strong>b</strong>`, ' +
            '`` `code` `` ל-`<code>c</code>`, `*italic*` ל-`<em>i</em>`, ' +
            '`@maya` ל-`<span class="mention">@maya</span>`, ' +
            'וקישורי `https:` מקבלים `<a href>` בעוד ש-`javascript:` נדחה — ' +
            'טקסט הקישור שורד, אבל ה-anchor לא נוצר.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה "escape-first" אומר, ומה ה-XSS שהוא מונע?',
          body:
            'XSS (Cross-Site Scripting) מתרחש כאשר קלט מהמשתמש מוצג ב-DOM כ-HTML גולמי. ' +
            'escape-first: לפני כל transform, כל `<`, `>`, `"`, `&` הופכים לישויות HTML. ' +
            'כך — גם אם ה-transform שגוי — HTML שהמשתמש הדביק לא יוצג כמרכיב DOM. ' +
            'ה-spec מוכיח זאת: `<script>` בפלט חייב לכלול `&lt;script&gt;`, ' +
            'ואסור שיכלול `<script>`. אם השורה הזו תישבר — ה-XSS חזר.',
        },
        {
          kind: 'term',
          name: 'בדיקת יחידה',
          definition:
            'בדיקה שמבודדת יחידת קוד אחת (פונקציה, מחלקה) ובוחנת אותה בלי תלויות חיצוניות. ' +
            'renderMarkdown ו-fuzzyScore הן יחידות טהורות: קלט מחרוזת, פלט מחרוזת. ' +
            'אין DB, אין HTTP, אין Angular — לכן הבדיקה רצה ב-node בלי jsdom.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch21',
        file: 'client/src/app/core/markdown/markdown.spec.ts',
        region: 'step-21.5',
        diff: true,
        title: 'markdown.spec.ts — XSS escape + transforms',
      },
    },

    /* ------------------------------------------------------------ 21.9 */
    {
      id: '21.9',
      title: 'fuzzy.spec.ts — דירוג ומיון',
      blocks: [
        {
          kind: 'p',
          text:
            '`fuzzy.spec.ts` בוחן את `fuzzyScore` ו-`fuzzyRank` שפרק 16 בנה. ' +
            '`fuzzyScore` מחזיר `-1` אם תו מ-query נעדר מה-string, ' +
            '`0` לquery ריקה, ' +
            'וציון גבוה יותר לתווים שמתחילים בגבול מילה ורצופים בזה-אחר זה.',
        },
        {
          kind: 'p',
          text:
            'ה-assert הכי מעניין: `fuzzyScore("dark mode", "dark")` חייב להיות גבוה מ-`fuzzyScore("do a quick reset", "dark")`. ' +
            'שתי המחרוזות מכילות את אותם תווים `d-a-r-k` — אך ב-"dark mode" הם רצופים ובתחילת מילה. ' +
            'הנוסחה חייבת להבדיל ביניהם. אם מישהו ישנה את `fuzzyScore` ויפגע בדירוג — ' +
            'הבדיקה הזו תאדים אותו.',
        },
        {
          kind: 'p',
          text:
            '`fuzzyRank` מסנן ומסדר: `["Open the board", "Toggle dark mode", "Delete project"]` ' +
            'דורג עם query `"dark"` — `"Toggle dark mode"` מגיע ראשון, ' +
            'ו-`"Open the board"` לא ברשימה כלל (ציון `-1`).',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'test double, mock ו-stub — מה ההבדל?',
          body:
            'test double הוא מונח-גג לכל תחליף לתלות אמיתית בבדיקות. ' +
            'stub: מחזיר ערך קבוע, לא מאמת קריאות. ' +
            'mock: מאמת שנקרא בצורה מסוימת — אחרת הבדיקה נכשלת. ' +
            'fake: מימוש פשוט שמתנהג "אמיתית" (SQLite-in-memory הוא fake, לא mock). ' +
            'spy: wrapper שמתעד קריאות לאובייקט האמיתי. ' +
            'כאן לא משתמשים ב-test doubles — הפונקציות טהורות וה-DB הוא SQLite אמיתי.',
        },
        {
          kind: 'term',
          name: 'test double',
          definition:
            'כינוי כולל לכל תחליף לתלות אמיתית בבדיקות: stub (ערך קבוע), mock (אמת קריאות), ' +
            'fake (מימוש מינימלי שמתנהג אמיתית), spy (מתעד). SQLite-in-memory הוא fake — ' +
            'הוא מסד נתונים אמיתי, לא מדומה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch21',
        file: 'client/src/app/core/commands/fuzzy.spec.ts',
        region: 'step-21.6',
        diff: true,
        title: 'fuzzy.spec.ts — scoring ודירוג',
      },
    },

    /* ------------------------------------------------------------ 21.10 */
    {
      id: '21.10',
      title: 'ה-slnx: רישום פרויקט הבדיקות',
      blocks: [
        {
          kind: 'p',
          text:
            '`TaskForge.slnx` הוא קובץ הפתרון של .NET — הוא מפנה לכל הפרויקטים. ' +
            'פרק 21 מוסיף שורה אחת: `<Project Path="tests/TaskForge.Tests/TaskForge.Tests.csproj" />`. ' +
            'בלי רישום זה, `dotnet build` ו-`dotnet test` בשורש לא יאתרו את פרויקט הבדיקות.',
        },
        {
          kind: 'p',
          text:
            '`verify-snapshots.mjs` מריץ `dotnet build` ברמת ה-solution ואז בודק אם יש ספריית `tests/`. ' +
            'אם כן — הוא מריץ `dotnet test` אוטומטית. ' +
            'לכן הוספת `tests/` ורישום הפרויקט ב-`.slnx` הופכים את הבדיקות ל-gated: ' +
            'הן חייבות לעבור לפני שהסנאפשוט נחשב תקין.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'slnx: פורמט חדש ופשוט יותר מ-.sln',
          body:
            '`.slnx` הוא פורמט XML שהגיע ב-.NET 9 כחלופה ל-`.sln` המסורבל. ' +
            'שורה אחת לפרויקט, ללא GUID, ללא magic strings. ' +
            '`dotnet sln` עדיין עובד עם `.slnx`, ו-Visual Studio 2022+ תומך בו.',
        },
        {
          kind: 'term',
          name: 'SQLite in-memory',
          definition:
            'DB SQLite שחי בזיכרון בלבד: `"Filename=:memory:"`. ' +
            'מהיר ביותר (אין I/O לדיסק), נמחק ברגע שהחיבור נסגר. ' +
            'מתאים לבדיקות כשה-production DB הוא SQLite — אותו מנוע, אותן הגבלות, ' +
            'בלי עלות disk ובלי state שנשאר בין ריצות.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch21',
        file: 'server/TaskForge.slnx',
        title: 'TaskForge.slnx — הוספת פרויקט הבדיקות',
      },
    },

    /* ------------------------------------------------------------ 21.11 */
    {
      id: '21.11',
      title: 'מה לא לבדוק',
      blocks: [
        {
          kind: 'p',
          text:
            'לא כל קוד שווה להיות מכוסה בבדיקות. חוק מעשי: ' +
            'בדקו קוד שמכיל לוגיקה משלכם — אלגוריתם, כלל עסקי, הגנת אבטחה. ' +
            'אל תבדקו framework internals, getters טריוויאליים, או קוד שהוא רק "העברה".',
        },
        {
          kind: 'ul',
          items: [
            'לא לבדוק: getters שמחזירים field ללא לוגיקה (`get Name => _name`)',
            'לא לבדוק: Angular framework — `@if`, two-way binding, routing (Angular Test-Team בודק אותם)',
            'לא לבדוק: mapping ישיר בין DTO לישות ללא לוגיקה (EF עושה זאת נכון)',
            'כן לבדוק: כל נוסחה שכתבתם — rank midpoint, fuzzy score, escape-first',
            'כן לבדוק: בדיקות הרשאה — IsMemberAsync, כי זה ה-403 path',
            'כן לבדוק: כל פונקציה שמקבלת קלט מהמשתמש ומייצרת HTML — XSS',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'coverage 100% — טוב או רע?',
          body:
            'coverage הוא מדד, לא מטרה. 100% coverage יכול להתקבל עם בדיקות שלא מוודאות דבר — ' +
            'הן עוברות את הקוד אבל לא asserting. ' +
            'מצד שני, coverage נמוך מאוד מסגיר שיש קוד שלא נבדק כלל. ' +
            'השאיפה: coverage גבוה על קוד עם לוגיקה, ובדיקות שמוכיחות התנהגות ספציפית — לא שורות.',
        },
        {
          kind: 'term',
          name: 'e2e (end-to-end)',
          definition:
            'בדיקה שמריצה את האפליקציה כולה: browser אמיתי, שרת אמיתי, DB אמיתי. ' +
            'כלים נפוצים: Playwright, Cypress. יקרות (איטיות, שבירות, קשות לתחזוקה) ' +
            'אך מוכיחות שכל המערכת עובדת יחד. TaskForge: הן מתוארות קונצפטואלית — ' +
            'לא נבנו בפרק זה.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `flowchart LR
  A["פונקציה טהורה\nרenderMarkdown, fuzzyScore\nrank midpoint"] -->|"yes: unit test"| T["בדוק"]
  B["repository + DB\nIsMemberAsync\nGetForProjectAsync"] -->|"yes: integration"| T
  C["getter טריוויאלי\nAngular binding\nEF mapping"'] -->|"no: skip"| S["אל תבדוק"]
  D["Framework internals\n@if / router"'] -->|"no: skip"| S`,
        caption: 'כלל האצבע: בדקו לוגיקה שלכם, דלגו על framework',
      },
    },

    /* ------------------------------------------------------------ 21.12 */
    {
      id: '21.12',
      title: 'e2e — מבנה קונצפטואלי',
      blocks: [
        {
          kind: 'p',
          text:
            'בדיקות קצה-לקצה (e2e) מריצות דפדפן אמיתי מול שרת אמיתי. ' +
            'Playwright (מיקרוסופט, open-source) הוא הבחירה הנפוצה ל-.NET + Angular: ' +
            'תמיכה ב-Chromium, Firefox ו-WebKit; מצב headless או visual; ' +
            'API אסינכרוני (async/await); ו-test recorder שמקליט ניווט ויוצר קוד.',
        },
        {
          kind: 'p',
          text:
            'smoke test טיפוסי ל-TaskForge: ניווט ל-localhost:4500, ' +
            'login עם `demo@taskforge.dev` ו-`Passw0rd!`, ' +
            'פתיחת פרויקט, יצירת issue, ניווט ל-kanban, גרירה — ' +
            'ואימות ש-issue מופיע בעמודה הנכונה. ' +
            'בדיקה אחת כזו מכסה path שגוזל שעה בבדיקה ידנית.',
        },
        {
          kind: 'callout',
          tone: 'alt',
          title: 'מתי e2e כן שווים?',
          body:
            'e2e שווים ב-critical paths: login, checkout, signup — פעולות שכישלונן עולה ביוקר. ' +
            'הם לא שווים לכיסוי פונקציות ממוסרות (להשאיר לunit). ' +
            'כלל מעשי: 5-10 e2e tests שמכסים את ה-happy paths החשובים ביותר, ' +
            'ו-unit/integration tests לשאר.',
        },
        {
          kind: 'term',
          name: 'e2e smoke test',
          definition:
            'e2e שבודק שה-happy path המרכזי עובד — לא הכול, רק "האם האפליקציה בכלל קמה ומתפקדת". ' +
            'שם "smoke": אם מדליקים את המעגל ועשן עולה — עצרו. ' +
            'לא מחפשים bagים דקים, רק שלא נשבר דבר ברמה הגסה.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'typescript',
        code:
          '// Playwright smoke — קונצפטואלי (לא חלק מ-verify:snapshots)\n' +
          'import { test, expect } from \'@playwright/test\';\n\n' +
          'test(\'login and create issue\', async ({ page }) => {\n' +
          '  await page.goto(\'http://localhost:4500\');\n' +
          '  await page.fill(\'[name=email]\', \'demo@taskforge.dev\');\n' +
          '  await page.fill(\'[name=password]\', \'Passw0rd!\');\n' +
          '  await page.click(\'button[type=submit]\');\n\n' +
          '  // navigate to project and create issue\n' +
          '  await page.click(\'.project-card:first-child\');\n' +
          '  await page.click(\'[data-testid=new-issue]\');\n' +
          '  await page.fill(\'[name=title]\', \'E2E smoke issue\');\n' +
          '  await page.click(\'button[type=submit]\');\n\n' +
          '  await expect(page.locator(\'.issue-row\', { hasText: \'E2E smoke\' })).toBeVisible();\n' +
          '});',
        file: 'e2e-smoke.spec.ts (קונצפטואלי)',
      },
    },

    /* ------------------------------------------------------------ 21.13 */
    {
      id: '21.13',
      title: 'הדמו: לולאת אדום-ירוק',
      blocks: [
        {
          kind: 'p',
          text:
            'הדמו מציג ארבע assertions על פונקציות טהורות: rank midpoint ו-escape-first. ' +
            'כולן ירוקות. לחצו "הכנס באג" — פונקציה אחת מוחלפת בגרסה שגויה, ' +
            'ובדיקה אחת הופכת לאדומה. לחצו שוב — חזרה לירוק. ' +
            'זו לולאת TDD במיניאטורה: אדום, תקן, ירוק.',
        },
        {
          kind: 'p',
          text:
            'אין כלים, אין שרת, אין Angular TestBed — רק פונקציות ו-assertions. ' +
            'הדמו מראה שבדיקות יחידה טובות לא דורשות תשתית, ' +
            'ושה-feedback loop (שינוי, ראה אדום, תקן, ראה ירוק) הוא הלב של TDD.',
        },
        {
          kind: 'term',
          name: 'TDD (Test Driven Development)',
          definition:
            'תהליך פיתוח שבו כותבים בדיקה כושלת (אדום) לפני הקוד, ' +
            'ואז כותבים קוד מינימלי שמעביר אותה (ירוק), ואז מנקים (refactor). ' +
            'המחזור: red, green, refactor. ' +
            'היתרון: הבדיקה מגדירה את ה-API לפני המימוש, ומונעת over-engineering.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () => import('./demos/test-runner.demo').then((m) => m.TestRunnerDemo),
        caption: 'דמו חי: ארבע assertions ירוקות — "הכנס באג" הופך אחת לאדומה ומראה לולאת TDD במיניאטורה',
      },
    },

    /* ------------------------------------------------------------ 21.14 */
    {
      id: '21.14',
      title: 'ה-seams שרדו: למה הבדיקות זולות',
      blocks: [
        {
          kind: 'p',
          text:
            'כל בדיקה שכתבנו נשענת על החלטה ארכיטקטונית שנעשתה פרקים קודמים. ' +
            '`IsMemberAsync` קל לבדוק כי פרק 02 הציב `IProjectRepository` — ' +
            'בדיקה יכולה ליצור `EfProjectRepository` ישירות, בלי `WebApplicationFactory`. ' +
            '`renderMarkdown` קל לבדוק כי פרק 19 חילץ אותה לפונקציה נקייה ולא השאיר אותה ' +
            'קבורה ברכיב. `fuzzyScore` קל לבדוק כי פרק 16 לא ערבב לוגיקה ל-DOM.',
        },
        {
          kind: 'p',
          text:
            'ה-payoff הוא הפוך גם: כשבדיקה קשה לכתוב, זה סימן שהקוד צמוד מדי לתשתית. ' +
            'אם `IsMemberAsync` היתה מחושבת ישירות בתוך endpoint handler ולא ב-repository, ' +
            'הייתם צריכים `WebApplicationFactory` + auth headers + middleware רק כדי לבדוק שאילתה אחת. ' +
            'הקוּשי לבדוק הוא סימן לאיכות ארכיטקטורה נמוכה.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה לא לבדוק עם WebApplicationFactory?',
          body:
            '`WebApplicationFactory` מרים את כל ה-ASP.NET pipeline: middleware, routing, serialization. ' +
            'היא שווה עבור endpoint integration tests שמוכיחים שה-HTTP contract נשמר. ' +
            'היא יקרה עבור לוגיקה עסקית שאפשר לבדוק ב-repository level. ' +
            'לבדיקת `IsMemberAsync` — `EfProjectRepository` ישירות + SQLite-in-memory מספיקים ' +
            'וזמן הריצה קצר פי עשרות.',
        },
        {
          kind: 'term',
          name: 'DIP — Dependency Inversion Principle',
          definition:
            'עקרון SOLID: מודולים ברמה גבוהה לא תלויים במודולים ברמה נמוכה — שניהם תלויים בהפשטה. ' +
            'ב-TaskForge: endpoints תלויים ב-IProjectRepository (הפשטה), לא ב-EfProjectRepository (מימוש). ' +
            'לכן ניתן לבדוק endpoints עם fake repository בלי EF, ו-EfProjectRepository עם SQLite-in-memory בלי HTTP.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `flowchart LR
  A["פרק 02\nI*Repository (DIP)"] --> B["ch21\nEfProjectRepository\nישירות בבדיקה"]
  C["פרק 16\nfuzzyScore: פונקציה נקייה"] --> D["ch21\nfuzzy.spec.ts\nאפס TestBed"]
  E["פרק 19\nrenderMarkdown: פונקציה נקייה"] --> F["ch21\nmarkdown.spec.ts\nאפס DOM"]
  G["פרק 05\nPasswordHasher: קלאס נקי"] --> H["ch21\nPasswordHasherTests\nאפס DB"]`,
        caption: 'כל seam מפרקים קודמים מתורגם ישירות לנקודת כניסה לבדיקה זולה',
      },
    },

    /* ------------------------------------------------------------ 21.15 */
    {
      id: '21.15',
      title: 'העץ אחרי פרק 21',
      blocks: [
        {
          kind: 'p',
          text:
            'פרק 21 פתח את Wave 5 (Quality) עם שכבת בדיקות אוטומטיות שמגנה על מה שבנינו. ' +
            '8 בדיקות xUnit (PasswordHasher×4, IsMemberAsync×1, GetForProjectAsync×1 + pure helpers) ' +
            'עוברות כ-gate אוטומטי בכל `verify:snapshots`. ' +
            '12 בדיקות vitest (markdown×5, fuzzy×4, fuzzyRank×2 + setup) ' +
            'עוברות באותו שער עבור milestone שמסומן `"test": true`.',
        },
        {
          kind: 'p',
          text:
            'לא נוסף קוד runtime חדש לאפליקציה — רק הוכחה שמה שיש עובד. ' +
            'הפרק הבא (ch22) יעסוק בביצועים ונגישות: bundle audit, Core Web Vitals, ' +
            'ו-keyboard navigation מקצה לקצה.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'הרחבה אפשרית: store tests',
          body:
            'הפרק לא כלל בדיקות Angular stores כי הן דורשות `provideHttpClientTesting` ו-`HttpTestingController`. ' +
            'הדפוס: `TestBed.configureTestingModule({ providers: [IssuesStore, provideHttpClientTesting()] })`, ' +
            'לאחר מכן `flush()` תגובות מדומות ואימות שה-store מעדכן. ' +
            'זהו תרגיל מצוין לאחר שמתרגלים את הבדיקות הפשוטות שבפרק.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch21',
        title: 'TaskForge אחרי פרק 21 — xUnit + vitest, Wave 5 פותחת',
      },
    },
  ],

  quiz: [
    {
      q: 'מה מוכיחה בדיקת `Verify_returns_false_for_a_malformed_hash`?',
      options: [
        'שה-hash מקודד ב-base64',
        'שגם קלט שגוי (ריק / חסר חלקים) לא קורס ומחזיר false בביטחון',
        'שהסיסמה שגויה',
        'שה-PBKDF2 לא מותקן',
      ],
      answer: 1,
      explain:
        '[Theory] עם שלושה InlineData (ריק, "not-three-parts", "1.only-two") מאמת ' +
        'שה-PasswordHasher לא קורס על קלט שגוי אלא מחזיר false. ' +
        'זה מונע NullReferenceException אם hash שבור הגיע מה-DB.',
    },
    {
      q: 'מה הטריק של SqliteInMemory שמבטיח שה-DB לא נמחק בין ה-seed לה-act?',
      options: [
        'הוא שומר את ה-DB בקובץ זמני',
        'הוא פותח SqliteConnection ושומר אותה פתוחה — SQLite in-memory חי כל עוד החיבור פתוח',
        'הוא משתמש ב-TransactionScope',
        'הוא יוצר DB חדש לכל NewContext()',
      ],
      answer: 1,
      explain:
        'SQLite ":memory:" נמחק כשהחיבור נסגר. SqliteInMemory שומרת connection אחת פתוחה לכל אורך חיי ה-fixture. ' +
        'NewContext() בונה DbContext על אותו connection, ולכן כל הcontexts רואים את אותו DB.',
    },
    {
      q: 'מה מוכיחה הבדיקה של `IsMemberAsync` ב-`ProjectRepositoryTests` (חבר מול איש-חוץ)?',
      options: [
        'שה-endpoint מחזיר 403',
        'שמי שאינו חבר בפרויקט מקבל false מ-IsMemberAsync — ה-403 path נעול',
        'שה-JWT תקין',
        'שה-ProjectMember table קיים',
      ],
      answer: 1,
      explain:
        'IsMemberAsync היא ה-primitive שכל endpoint קורא לפני כל פעולה. ' +
        'הבדיקה מוכיחה שאיש-חוץ מקבל false — מה שיגרום ל-403 ב-handler. ' +
        'בלי בדיקה זו, באג ב-IsMemberAsync היה עוקף את כל ההרשאה.',
    },
    {
      q: 'מדוע StatsRepositoryTests מאמת גם ש-ByPriority.Sum(p => p.Count) == 5?',
      options: [
        'כי EF דורש זאת',
        'כדי להוכיח ששני GROUP BY (לפי Status ולפי Priority) מסתכמים לאותו Total — אין issues שנאבדו',
        'כי Total לא מחושב',
        'כדי לבדוק ש-SQLite תומך ב-SUM',
      ],
      answer: 1,
      explain:
        'שני GroupBy נפרדים בשאילתה. אם אחד שגוי — נניח מסנן issues עם priority=null — ' +
        'ה-sum לא יתאים ל-Total. הaassertion הזה מוכיח עקביות בין שני GROUP BY.',
    },
    {
      q: 'מדוע בדיקת ה-XSS ב-markdown.spec.ts חשובה יותר מבדיקת הrender?',
      options: [
        'כי XSS לא קיים ב-Angular',
        'כי כישלון escape-first מאפשר להריץ JavaScript שהמשתמש הדביק — פגיעה אמיתית; כישלון render הוא רק עיצוב',
        'כי הrender לא נבדק',
        'כי Angular DomSanitizer עושה זאת אוטומטית',
      ],
      answer: 1,
      explain:
        'escape-first היא הגנת אבטחה: אם `<script>` מגיע לDOM כ-HTML, הדפדפן מריץ אותו. ' +
        'הבדיקה מוכיחה שה-output מכיל `&lt;script&gt;` ולא `<script>`. ' +
        'כישלון ב-render (bold לא יוצג) הוא באג UX; כישלון ב-XSS הוא פגיעת אבטחה.',
    },
    {
      q: 'מה ההבדל בין fake ל-mock ב-test doubles?',
      options: [
        'אין הבדל — זה אותו דבר',
        'fake: מימוש פשוט שמתנהג אמיתית (SQLite in-memory). mock: מאמת שנקרא בצורה מסוימת — אחרת כישלון',
        'mock: מממש ממשק. fake: רק מחזיר ערכים',
        'fake משמש רק ב-frontend, mock ב-backend',
      ],
      answer: 1,
      explain:
        'SQLite in-memory הוא fake: הוא DB אמיתי שפועל, לא מדומה. ' +
        'mock מאמת שנקרא (verify interactions) — אם `EfProjectRepository.IsMemberAsync` לא נקרא, הבדיקה נכשלת. ' +
        'כאן לא משתמשים ב-mock כי בודקים תוצאה (true/false), לא שנקרא.',
    },
    {
      q: 'איך `verify:snapshots` מריץ גם בדיקות vitest בצד הקליינט?',
      options: [
        'הוא מריץ אותן בכל פרק Angular בלי תנאי',
        'milestone של Angular עם `"test": true` מריץ `ng test --watch=false` אחרי `ng build`',
        'ng build מריץ .spec.ts כברירת מחדל',
        'רק dotnet test יכול לרוץ בשער הזה',
      ],
      answer: 1,
      explain:
        '`verify-snapshots.mjs` מתקין, מריץ `ng build`, ואם ה-milestone מסומן `"test": true` ' +
        'מריץ גם `ng test --watch=false`. כך בדיקות vitest נכנסות לאותו gate בלי להריץ אותן בפרקים שאין בהם specs משמעותיים.',
    },
  ],

  proveIt: [
    {
      title: 'הריצו dotnet test — 8 passed',
      body:
        'בתוך `reference/.build/ch21/server`, הריצו `dotnet test` וראו את הפלט.',
      command: 'cd reference\\.build\\ch21\\server && dotnet test',
      expect:
        'פלט: "Passed! - Failed: 0, Passed: 8, Skipped: 0". ' +
        '8 בדיקות: 4 PasswordHasher, 1 IsMemberAsync, 1 GetForProjectAsync + שתי בדיקות helpers. ' +
        'אפס שגיאות, אפס warnings.',
    },
    {
      title: 'הריצו ng test — 12 passed',
      body:
        'בתוך `reference/.build/ch21/client`, הריצו `ng test --watch=false` וראו את הפלט של vitest.',
      command: 'cd reference\\.build\\ch21\\client && pnpm exec ng test --watch=false',
      expect:
        '3 test files, 12 tests passed. markdown.spec.ts: 5 tests. fuzzy.spec.ts (fuzzyScore + fuzzyRank): 4+3 tests. ' +
        'אפס failed.',
    },
    {
      title: 'הכניסו באג — ראו בדיקה אדומה',
      body:
        'ב-`reference/.build/ch21/client/src/app/core/markdown/markdown.ts`, ' +
        'שנו את הבדיקה `scheme === "https:" || scheme === "http:"` ' +
        'ל-`scheme === "https:"` בלבד, ' +
        'ואז הריצו `ng test --watch=false` שוב.',
      expect:
        'בדיקת "linkifies only safe URL schemes" תעבור (כי https עדיין עובד) — ' +
        'אבל הבדיקה שמוכיחה ש-javascript: נדחה לא תשנה. ' +
        'נסו להחליף את `renderMarkdown("<script>")` לפונקציה שמחזירה קלט ישירות ' +
        '— הבדיקה הראשונה תאדים. שחזרו ותראו את הירוק.',
    },
    {
      title: 'IsMemberAsync מוכיחה את נתיב ה-403',
      body:
        'קראו לendpoint של פרויקט שלא אתם חברים בו — קיבלתם 403. ' +
        'ה-assert ב-ProjectRepositoryTests מוכיח את הפרימיטיב מאחוריו.',
      command:
        'curl -s -o /dev/null -w "%{http_code}" ' +
        '-H "Authorization: Bearer <token-of-maya>" ' +
        'http://localhost:5080/api/projects/1/issues',
      expect:
        'maya@taskforge.dev היא חברה בפרויקט 1 — לכן 200. ' +
        'אם תיצרו משתמש חדש שאינו חבר ותשתמשו בטוקן שלו, תקבלו 403. ' +
        'הבדיקה ProjectRepositoryTests נועלת את ה-false branch — זה המנגנון שעומד מאחורי ה-403.',
    },
  ],

  exercise: {
    prompt:
      'הוסיפו בדיקת repository חדשה: `IssueRepositoryTests` שמוכיחה שסינון לפי סטטוס עובד. ' +
      'הבדיקה תשתמש ב-`SqliteInMemory`, תזרע 3 issues (Open×2, Done×1), ' +
      'ותאמת שסינון `status=Open` מחזיר 2 issues ולא 3.',
    tasks: [
      'צרו `server/tests/TaskForge.Tests/IssueRepositoryTests.cs` עם מחלקה שמממשת IDisposable.',
      'השתמשו ב-`SqliteInMemory` fixture לאתחול DB ו-`EfIssueRepository` לביצוע הסינון.',
      'זרעו פרויקט + 3 issues: שניים עם `IssueStatus.Open`, אחד עם `IssueStatus.Done`.',
      'קראו ל-`GetPagedAsync` עם `IssueListQuery { Status = IssueStatus.Open }` ואמתו שסך ה-issues הוא 2.',
      'הריצו `dotnet test` ואמתו שהבדיקה עוברת (מעבר מ-8 ל-9 passed).',
    ],
    acceptance: [
      'dotnet test מסיים עם 9 passed, 0 failed.',
      'הבדיקה בוחנת ספירה ברמת ה-repository — לא assertion על ה-list ישירות מה-DB.',
      'ה-fixture מנוקה ב-Dispose() — אפס דליפה לבדיקות אחרות.',
      'אין שורות EF שאינן נחוצות (AsNoTracking אם רק קוראים).',
    ],
  },
};
