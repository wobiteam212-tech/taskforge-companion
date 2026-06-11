import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 07 — ארכיטקטורת הקליינט.
 * תיקיות שמשקפות את חוק התלות של השרת, מודלים מיד-ממוזרים,
 * signal store עם גבול asReadonly, ורכיבים חכמים מול טיפשים.
 */
export const CH07_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 7.1 */
    {
      id: '7.1',
      title: 'תיקיות הן ארכיטקטורה',
      blocks: [
        {
          kind: 'p',
          text:
            'בפרק 02 השרת קיבל שלוש שכבות: ‏`Core`, ‏`Infrastructure`, ‏`Api`. ' +
            'כל שכבה מצהירה מה היא תלויה בו — ו-Core לא יכולה להכיר את Infrastructure. ' +
            'עכשיו הקליינט מקבל את אותה משמעת, בשמות שמתאימים לעולם הדפדפן.',
        },
        {
          kind: 'ul',
          items: [
            '‏`core/` — מודלים וסטייט. אין UI, אין ייבוא מ-`features/`. זוהי ה-Core של הקליינט.',
            '‏`features/` — מסכים חכמים שמכירים את ה-`core/` ומזריקים לעצמם services דרך `inject()`.',
            '‏`shared/` — רכיבי UI "טיפשים" שלא מכירים אף אחד. מגיע כשלמות בפרק 09.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'אותו חוק תלות שמנע מ-`Core` להכיר את `Infrastructure` בשרת ' +
            'עכשיו מונע מ-`core/` להכיר את `features/` בקליינט. ' +
            'כשרכיב עומד לבד, אפשר לבדוק אותו, להזיז אותו, ולעשות אותו מחדש — בלי לגעת בשאר.',
        },
      ],
      panel: {
        kind: 'diagram',
        caption: 'חוק התלות של הקליינט: features יודע על core, shared לא יודע על אף אחד, core לא יודע על features.',
        mermaid: `flowchart TD
  F["features/\nמסכים חכמים"]
  C["core/\nmodels + state"]
  S["shared/\nUI atoms"]
  F --> C
  F --> S`,
      },
    },

    /* ------------------------------------------------------------ 7.2 */
    {
      id: '7.2',
      title: 'מפת היעד של הפרק',
      blocks: [
        {
          kind: 'p',
          text:
            'בפרק הזה נוסיף אחד-עשר קבצים חדשים לשלד שנוצר בפרק 06, ונעדכן ארבעה קיימים. ' +
            'כל קובץ גר בדיוק בשכבה שחוק התלות קובע לו.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'כשתפתחו את ה-repo חודשים מעכשיו, שם התיקייה יספר לכם מיד: ' +
            '"זה DTO", "זה סטייט", "זה מסך". ' +
            'החוק שבנינו בפרק 02 לשרת עובד כאן מאותן סיבות.',
        },
      ],
      panel: {
        kind: 'filetree',
        title: 'הקבצים שנוצרים בפרק 07',
        caption: 'כל קובץ גר בשכבה הנכונה — core, state, features.',
        lines: [
          { text: 'client/src/app/', depth: 0, kind: 'dir' },
          { text: 'core/', depth: 1, kind: 'dir' },
          { text: 'models/', depth: 2, kind: 'dir' },
          { text: 'api.model.ts', depth: 3, kind: 'file', badge: 'new' },
          { text: '— PagedResult<T>: חוזה הדפדוף הגנרי', depth: 3, kind: 'comment' },
          { text: 'issue.model.ts', depth: 3, kind: 'file', badge: 'new' },
          { text: '— IssueStatus, IssuePriority, Issue, LabelRef', depth: 3, kind: 'comment' },
          { text: 'project.model.ts', depth: 3, kind: 'file', badge: 'new' },
          { text: '— ProjectSummary: ה-projection שהשרת מחזיר', depth: 3, kind: 'comment' },
          { text: 'auth.model.ts', depth: 3, kind: 'file', badge: 'new' },
          { text: '— AuthSession, AuthUser, UserRole (לגל 3)', depth: 3, kind: 'comment' },
          { text: 'state/', depth: 2, kind: 'dir' },
          { text: 'projects.store.ts', depth: 3, kind: 'file', badge: 'new' },
          { text: '— signal store עם SEED ו-asReadonly', depth: 3, kind: 'comment' },
          { text: 'features/', depth: 1, kind: 'dir' },
          { text: 'projects/', depth: 2, kind: 'dir' },
          { text: 'project-list.ts', depth: 3, kind: 'file', badge: 'new' },
          { text: '— רכיב חכם, מזריק store', depth: 3, kind: 'comment' },
          { text: 'project-list.html', depth: 3, kind: 'file', badge: 'new' },
          { text: 'project-list.scss', depth: 3, kind: 'file', badge: 'new' },
          { text: 'project-card.ts', depth: 3, kind: 'file', badge: 'new' },
          { text: '— רכיב טיפש, input.required + output', depth: 3, kind: 'comment' },
          { text: 'project-card.html', depth: 3, kind: 'file', badge: 'new' },
          { text: 'project-card.scss', depth: 3, kind: 'file', badge: 'new' },
          { text: 'app.ts', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'app.html', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'app.spec.ts', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'angular.json', depth: 1, kind: 'file', badge: 'mod' },
        ],
      },
    },

    /* ------------------------------------------------------------ 7.3 */
    {
      id: '7.3',
      title: 'קידומת tf והצהרת בעלות',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-scaffold של פרק 06 נוצר עם `"prefix": "app"`. ' +
            'פרק 07 מחליף אותו ל-`"tf"` — קידומת שמזהה את כל הרכיבים של TaskForge.',
        },
        {
          kind: 'ul',
          items: [
            'רכיב שנוצר עם `ng generate component` יקבל אוטומטית selector בצורת `tf-...`.',
            'חיפוש `tf-` ב-codebase מוצא את כל הרכיבים של האפליקציה — ולא רכיבים של ספריות צד שלישי.',
            'הרכיב הראשי `app-root` לא מושפע: הוא הוגדר בפרק 06 עם selector מפורש, והמדריך ממשיך עם `app-root`.',
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'אפשר לבחור קידומת לפי שם הארגון, שם המוצר, או שם הצוות. ' +
            'החשוב הוא שהיא קצרה (2-4 תווים), ייחודית בתוך ה-repo, ' +
            'ומוגדרת מוקדם — לשנות קידומת אחרי עשרות רכיבים זה כאב ראש.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch07',
        file: 'client/angular.json',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 7.4 */
    {
      id: '7.4',
      title: 'המראה הראשונה: PagedResult',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-`server/TaskForge.Core/Common/PagedResult.cs` יש `TotalPages` שהוא `get`-only property: ' +
            'הוא לא מאוחסן, הוא מחושב. ' +
            'אבל `System.Text.Json` מסריאלייז גם properties כאלה — ולכן הקליינט רואה `totalPages` בתשובה.',
        },
        {
          kind: 'p',
          text:
            'כלל התרגום: `PascalCase` בצד C# הופך ל-`camelCase` על הקו. ' +
            'את זה לא הגדרנו בשום פרק — זו ברירת המחדל של ASP.NET Core ‏(`JsonSerializerDefaults.Web`). ' +
            'אז `TotalPages` מגיע כ-`totalPages`, ‏`Items` כ-`items`, וכן הלאה.',
        },
        {
          kind: 'term',
          name: 'wire contract',
          definition:
            'הצורה המדויקת של ה-JSON שעובר בין שרת ללקוח. ' +
            'לא הישות הפנימית ולא ה-DTO בשרת — אלא מה שרואים בפועל ב-Network tab של DevTools.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch07',
        file: 'client/src/app/core/models/api.model.ts',
        region: 'step-7.4',
      },
    },

    /* ------------------------------------------------------------ 7.5 */
    {
      id: '7.5',
      title: 'enums על הקו: מחרוזות, לא מספרים',
      blocks: [
        {
          kind: 'p',
          text:
            'בפרק 04 הגדרנו `JsonStringEnumConverter` על שרת ה-API. ' +
            'התוצאה: ‏`IssueStatus.InProgress` מגיע על הקו כ-`"InProgress"`, לא כ-`1`. ' +
            'שמות החברים הם PascalCase — בדיוק כמו שהם מוגדרים ב-C#.',
        },
        {
          kind: 'p',
          text:
            'בצד הקליינט, הבחירה היא `string literal union` ולא TypeScript enum. ' +
            '‏`type IssueStatus = \'Open\' | \'InProgress\' | \'Done\'` מתעד את מה שה-JSON מכיל, ' +
            'מגן עליו בזמן קומפילציה, ולא מוסיף שורת קוד אחת ב-bundle — כי הוא נמחק לחלוטין בזמן ריצה.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה union של מחרוזות ולא enum של TypeScript למודל API?',
          body:
            'TS enum קומפיילט לאובייקט JavaScript בזמן ריצה: `{ InProgress: "InProgress", ... }`. ' +
            'ה-bundle גדל, ויש פוטנציאל לשגיאות אם הערך הנומרי והמחרוזתי מתבלבלים. ' +
            'Union של מחרוזות הוא type-level only: הוא נמחק בקומפילציה, מתעד בדיוק את ה-wire format, ' +
            'ו-TypeScript מגן שלא תכניסו ערך שאינו בחוזה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch07',
        file: 'client/src/app/core/models/issue.model.ts',
        region: 'step-7.5',
      },
    },

    /* ------------------------------------------------------------ 7.6 */
    {
      id: '7.6',
      title: 'שני המודלים שנשארו',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`ProjectSummary` הוא לא הישות — הוא ה-projection. ' +
            'ב-`server/TaskForge.Core/Common/ProjectSummary.cs` מוגדר `sealed record` ' +
            'שמכיל רק `Id`, `Name`, `Description` ו-`OpenIssues`. ' +
            'הכול מחושב ב-SQL; ה-Issues עצמם לא טוענים לזיכרון.',
        },
        {
          kind: 'code',
          lang: 'typescript',
          title: 'client/src/app/core/models/auth.model.ts',
          code: `// המראה של server/TaskForge.Api/Contracts/AuthContracts.cs על הקו.
// השימוש המלא מגיע עם מסך ההתחברות (גל 3) — אבל החוזה מוגדר כבר עכשיו,
// כי הוא חלק מהשפה המשותפת של שני הצדדים.
export type UserRole = 'Member' | 'Admin';

/** המראה של UserResponse */
export interface AuthUser {
  id: number;
  email: string;
  displayName: string;
  role: UserRole;
}

/** המראה של AuthResponse — הזוג המלא + מתי ה-access פג */
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
  user: AuthUser;
}`,
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה `interface` ולא `class` עבור DTO? ' +
            'ל-DTO אין התנהגות — אין מתודות, אין לוגיקה. ' +
            '‏`interface` מוחק לחלוטין ב-JS; `class` מוסיף קוד runtime. ' +
            'TypeScript הוא structural: אם האובייקט שחזר מה-API עונה על הצורה, הוא עובר — אין צורך ב-instantiation.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch07',
        file: 'client/src/app/core/models/project.model.ts',
      },
    },

    /* ------------------------------------------------------------ 7.7 */
    {
      id: '7.7',
      title: 'ProjectsStore: signal פנימה, asReadonly החוצה',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`ProjectsStore` מגדיר גבול ברור: ‏`_projects` הוא ה-signal הפרטי שאפשר לכתוב אליו. ' +
            'החוצה יוצא רק `projects` — אותו signal, אבל עטוף ב-`asReadonly()`. ' +
            'קומפוננטה שתנסה לקרוא ל-`projects.set(...)` תקבל שגיאת קומפילציה.',
        },
        {
          kind: 'ul',
          items: [
            '‏`asReadonly()` מחזיר `Signal<T>` ולא `WritableSignal<T>` — ה-type מונע כתיבה בזמן קומפילציה.',
            '‏`computed(() => this.projects().reduce(...))` — `totalOpenIssues` מחושב אוטומטית מ-`projects`.',
            'שינוי state עובר רק דרך מתודות (`rename`): הקורא מבקש, ה-store מחליט.',
          ],
        },
        {
          kind: 'term',
          name: 'store',
          definition:
            'שירות injectable שמנהל state מרכזי. ' +
            'חושף signals לקריאה-בלבד ומאפשר שינוי רק דרך מתודות מוגדרות. ' +
            'בפרק הזה הוא מוק; בפרק 11 הוא ירוץ מול ה-API האמיתי.',
        },
        {
          kind: 'term',
          name: 'asReadonly / state boundary',
          definition:
            'גבול ה-state: ‏`WritableSignal.asReadonly()` מחזיר signal שאי-אפשר לכתוב אליו. ' +
            'כל קומפוננטה יכולה לקרוא; רק ה-store עצמו יכול לשנות.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'איך מונעים מרכיב לשנות state של store ישירות?',
          body:
            'חושפים את ה-signal דרך `asReadonly()`: הטיפוס שחוזר הוא `Signal<T>` בלי `set` ו-`update`, ' +
            'אז הקומפיילר עוצר כל ניסיון כתיבה. שינויים עוברים רק דרך מתודות של ה-store, ' +
            'ושם אפשר לאכוף ולידציה, לוגים או אופטימיות. ההגנה היא ברמת הטיפוסים — בזמן ריצה זה אותו אובייקט.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch07',
        file: 'client/src/app/core/state/projects.store.ts',
        region: 'step-7.7',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 7.8 */
    {
      id: '7.8',
      title: 'המוק זורע בדיוק כמו השרת',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-`SEED` בקליינט מגדיר שלושה פרויקטים — אותם שלושה ש-`DbSeeder` זורע בשרת: ' +
            '`Website Redesign` עם 2 open issues, ‏`Mobile App` עם 1, ו-`Internal Tools` עם 0. ' +
            'שימו לב ש-`Internal Tools` מגיע עם `description: null` — אותה edge case שה-`DbSeeder` זורע גם כן.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'בפרק 11, שורת ה-SEED תוחלף בקריאת `httpResource` לכתובת `/api/projects`. ' +
            'הממשק הציבורי של ה-store — ‏`projects`, ‏`totalOpenIssues`, ‏`rename` — לא משתנה. ' +
            'זה בדיוק תפקידו של `IProjectRepository` בשרת: החוזה נשאר, המימוש מתחלף. ' +
            'קומפוננטה שמשתמשת ב-store היום תמשיך לעבוד בדיוק אותו דבר אחרי המעבר.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch07',
        file: 'client/src/app/core/state/projects.store.ts',
        region: 'step-7.8',
      },
    },

    /* ------------------------------------------------------------ 7.9 */
    {
      id: '7.9',
      title: 'הרכיב החכם: project-list',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`ProjectList` הוא "חכם" בהגדרה מדויקת: הוא יודע מאיפה הנתונים מגיעים. ' +
            '‏`inject(ProjectsStore)` הוא הקשר היחיד לעולם החיצוני — ' +
            'כל הלוגיקה של "מאיפה מגיעים הפרויקטים" גרה כאן, ולא בכרטיסים שמתחתיו.',
        },
        {
          kind: 'ul',
          items: [
            'ה-selector הוא `tf-project-list` — הקידומת `tf` שהגדרנו ב-7.3 בפעולה.',
            '‏`onOpen(projectId)` מתעד את הכוונה ל-console. ניווט אמיתי מגיע בפרק 10.',
            'הרכיב לא יודע כיצד כרטיס נראה — הוא מאציל את זה ל-`ProjectCard`.',
          ],
        },
        {
          kind: 'term',
          name: 'smart component',
          definition:
            'רכיב שמכיר את ה-store, את השירותים, ואת ה-routing. ' +
            'יודע מאיפה הנתונים מגיעים, אבל לא יודע איך לצייר כרטיס בודד. ' +
            'מאציל את ה-rendering לרכיבים טיפשים ומנהל אירועים שחוזרים מהם.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch07',
        file: 'client/src/app/features/projects/project-list.ts',
        region: 'step-7.9',
      },
    },

    /* ------------------------------------------------------------ 7.10 */
    {
      id: '7.10',
      title: 'הרכיב הטיפש: project-card',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`ProjectCard` מיישם את העיקרון ההפוך: אפס ידע על העולם. ' +
            'כל מה שהוא צריך לדעת נכנס דרך `input.required<ProjectSummary>()` — ' +
            'המהדר אוכף שימוש תמיד עם `[project]`, בלי ברירת מחדל. ' +
            'כשהמשתמש לוחץ "Open board", הכרטיס לא מנווט — הוא מוציא `output<number>()` ומחכה.',
        },
        {
          kind: 'code',
          lang: 'html',
          title: 'client/src/app/features/projects/project-card.html',
          code: `<article class="card">
  <header>
    <h3>{{ project().name }}</h3>
    <span class="count">{{ project().openIssues }} open</span>
  </header>

  <p class="desc">{{ project().description ?? 'No description yet' }}</p>

  <button type="button" (click)="open.emit(project().id)">Open board</button>
</article>`,
        },
        {
          kind: 'p',
          text:
            '‏`client/src/app/features/projects/project-card.scss` מינימלי בכוונה — ' +
            'פרק 08 (מערכת עיצוב ו-CSS מודרני) ייתן לכרטיס את הזהות שלו.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה מרוויחים מהפרדת רכיבים חכמים וטיפשים?',
          body:
            'רכיב טיפש ניתן לבדיקה ב-isolation: מעבירים לו input, בודקים את ה-DOM, מאשרים שה-output נורה. ' +
            'אין צורך ב-store mock. ' +
            'רכיב חכם ניתן לבדיקה עם store mock בלי לדאוג לעיצוב הכרטיס. ' +
            'ובמישור העסקי — אפשר להזיז כרטיס ל-feature אחרת בלי לגרור את ה-store איתו.',
        },
        {
          kind: 'term',
          name: 'dumb component',
          definition:
            'רכיב ללא הזרקות: כל הקלט מגיע דרך `input`, כל הפלט יוצא דרך `output`. ' +
            'לא מכיר את ה-store, את ה-router, ולא את האחים שלו. ' +
            'ניתן לבדיקה, לשימוש חוזר, ולהזזה בין features.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch07',
        file: 'client/src/app/features/projects/project-card.ts',
        region: 'step-7.10',
      },
    },

    /* ------------------------------------------------------------ 7.11 */
    {
      id: '7.11',
      title: 'המגרש: הסבב המלא input ואז output',
      blocks: [
        {
          kind: 'p',
          text:
            'הדמו החי מציג הורה חכם ושלושה ילדים טיפשים. ' +
            'ה-`IoDemo` (ההורה) מחזיק `signal<MiniProject[]>` עם שלושה פרויקטים. ' +
            'לכל `demo-io-card` (הילד) מועבר `[item]="p"` כ-input.',
        },
        {
          kind: 'ul',
          items: [
            'לחיצה על "boost +1": הילד מוציא `boost.emit(item().id)` — הוא לא יודע מה יקרה. ' +
              'ההורה מקבל ב-`(boost)="onBoost($event)"`, מעדכן את ה-signal, ' +
              'וה-input של הילד הנכון יורד מחדש עם ה-`boosts` המעודכן.',
            'כפתור "איפוס": ההורה קורא ל-`reset()`, מאפס את כל ה-boosts ב-signal, ' +
              'וכל הילדים מקבלים inputs טריים — בלי לדעת למה.',
            'ה-log (עד 5 שורות) מציג את הסבב: output עלה, ההורה עדכן, input ירד.',
          ],
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () => import('./demos/io.demo').then((m) => m.IoDemo),
        caption: 'דמו חי: הורה חכם שולט ב-state, ילדים טיפשים מדווחים כוונות. לחצו boost ובחנו את ה-log.',
      },
    },

    /* ------------------------------------------------------------ 7.12 */
    {
      id: '7.12',
      title: 'חיבור לשלד',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`app.ts` מייבא `ProjectList` ומוסיף אותו ל-`imports` של הרכיב הראשי. ' +
            'הראוטר עדיין ריק — `<router-outlet>` שמור, אבל פרק 10 הוא שיגדיר את הנתיבים. ' +
            'בינתיים `tf-project-list` נטען ישירות לשלד.',
        },
        {
          kind: 'code',
          lang: 'html',
          title: 'client/src/app/app.html',
          code: `<header class="app-header">
  <h1>{{ title() }}</h1>
  <p class="tagline">{{ tagline() }}</p>
</header>

<main class="app-main">
  <tf-project-list />
  <router-outlet />
</main>`,
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'לשים `<tf-project-list />` ישירות ב-`app.html` הוא פשרה מכוונת: ' +
            'זה חוסך route configuration בשלב מוקדם שבו ה-router עדיין ריק. ' +
            'כשפרק 10 יגיע, זו השורה שתוחלף בניווט אמיתי דרך `<router-outlet>`.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch07',
        file: 'client/src/app/app.ts',
        region: 'step-7.11',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 7.13 */
    {
      id: '7.13',
      title: 'התבנית של הרשימה: @for עם track',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`@for (p of store.projects(); track p.id)` — שני חלקים: ' +
            '`@for` מייצר DOM per item, ו-`track p.id` אומר ל-Angular להשתמש ב-`id` ' +
            'כדי לזהות איזה DOM element שייך לאיזה פרויקט.',
        },
        {
          kind: 'ul',
          items: [
            'ללא `track`, כל שינוי ברשימה מוחק ויוצר מחדש את כל ה-DOM — גם כשרק ערך אחד השתנה.',
            '`@empty` — ענף שמוצג כשהרשימה ריקה. Angular control flow, לא directive.',
            '‏`{{ store.totalOpenIssues() }}` בכותרת — computed שחוצה את גבול הרכיב: ' +
              'ה-store מחשב, התבנית קוראת, Angular מעדכן כשהסכום משתנה.',
          ],
        },
        {
          kind: 'code',
          lang: 'scss',
          title: 'client/src/app/features/projects/project-list.scss',
          code: `// עיצוב מינימלי בכוונה — פרק 08 (מערכת העיצוב) ישדרג את הכול.
.projects {
  display: grid;
  gap: 14px;

  h2 {
    margin: 0;
    font-size: 18px;

    .total {
      margin-inline-start: 10px;
      color: #8a93a5;
      font-size: 13px;
      font-weight: 400;
    }
  }

  .empty {
    color: #8a93a5;
  }
}`,
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch07',
        file: 'client/src/app/features/projects/project-list.html',
      },
    },

    /* ------------------------------------------------------------ 7.14 */
    {
      id: '7.14',
      title: 'הטסט השלישי: הרשת נבדקת',
      blocks: [
        {
          kind: 'p',
          text:
            'ל-`app.spec.ts` נוסף טסט שלישי: ‏`querySelectorAll("tf-project-card")` צריך להחזיר בדיוק 3 אלמנטים. ' +
            'הטסט לא מייבא את `ProjectsStore` ישירות — הוא מאפשר ל-`App` להרכיב הכול, ' +
            'ואז בודק שהתבנית יצרה את כל הכרטיסים.',
        },
        {
          kind: 'ul',
          items: [
            '‏`await fixture.whenStable()` — כמו בטסטים הקודמים: מחכה ש-signals יתייצבו לפני בדיקת ה-DOM.',
            'הטסט בוחן את כל השרשרת: `App` מרנדר `ProjectList`, ' +
              'שמזריק `ProjectsStore`, שמחזיר 3 פרויקטים מה-SEED, ' +
              'שהתבנית ממירה ל-3 `tf-project-card`.',
            'אם ה-SEED ישתנה מ-3 פרויקטים, הטסט ייכשל — וזה מכוון: הוא מגן על ההנחה.',
          ],
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch07',
        file: 'client/src/app/app.spec.ts',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 7.15 */
    {
      id: '7.15',
      title: 'הקליינט קיבל עמוד שדרה',
      blocks: [
        {
          kind: 'p',
          text:
            'בסוף פרק 07 הקליינט כבר לא scaffold ריק. הנה מה שנבנה:',
        },
        {
          kind: 'ul',
          items: [
            '‏`core/models/` — ארבעה קבצי interface שמשקפים את חוזי ה-API של השרת, כולל enums כ-string unions.',
            '‏`core/state/projects.store.ts` — signal store עם גבול `asReadonly` ו-`computed totalOpenIssues`.',
            '‏`features/projects/` — רכיב חכם (`project-list`) ורכיב טיפש (`project-card`) עם `input.required` ו-`output`.',
            '‏`angular.json` — קידומת `tf` לכל הרכיבים הבאים.',
            '‏`app.spec.ts` — שלושה טסטים ירוקים, כולל בדיקה שמאמתת את כל שרשרת ה-rendering.',
          ],
        },
        {
          kind: 'p',
          text:
            'להרצה: בתוך `client/` הריצו `pnpm start` ופתחו `http://localhost:4500`. ' +
            'תראו שלושה כרטיסי פרויקטים עם "3 open issues" בכותרת. ' +
            'לחיצה על "Open board" מדפיסה `open project X` ל-console.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'לאן ממשיכים',
          body:
            'פרק 08 "מערכת עיצוב ו-CSS מודרני" ייקח את הכרטיסים האלה ויעניק להם זהות: ' +
            'design tokens, @layer, logical properties ו-RTL, container queries, color-mix, clamp, וארכיטקטורת dark mode. ' +
            'הכרטיסים שנבנו היום יקבלו את ה-CSS שהם ראויים לו.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch07',
        title: 'עץ הקוד אחרי פרק 07 — הקליינט קיבל עמוד שדרה',
      },
    },
  ],

  quiz: [
    {
      q: 'למה ‏`IssueStatus` בקוד הקליינט הוא `type IssueStatus = \'Open\' | \'InProgress\' | \'Done\'` ולא TypeScript enum?',
      options: [
        'כי TypeScript enum לא תומך במחרוזות',
        'כי union של מחרוזות מתועד בדיוק את ה-wire format, נמחק בקומפילציה, ואין קוד runtime — בניגוד ל-TS enum שמוסיף אובייקט JS',
        'כי `JsonStringEnumConverter` דורש union בצד הקליינט',
        'כי Angular v22 לא תומך ב-TypeScript enums',
      ],
      answer: 1,
      explain:
        'TypeScript enum קומפיילט לאובייקט JavaScript. ' +
        'Union של מחרוזות הוא type-level only: הוא נמחק לחלוטין, מגן מפני ערכים לא חוקיים, ' +
        'ומתעד בדיוק מה שמגיע על הקו מהשרת.',
    },
    {
      q: 'מה ההבדל הפונקציונלי בין "רכיב חכם" ל-"רכיב טיפש" ב-Angular?',
      options: [
        'רכיב חכם יש לו יותר שורות קוד',
        'רכיב חכם מכיר services ו-store, מנהל אירועים, ומאציל rendering לרכיבים טיפשים שמתקשרים רק דרך input/output',
        'רכיב טיפש לא יכול להשתמש ב-@for ו-@if',
        'רכיב חכם מרנדר מהיר יותר כי הוא קרוב ל-store',
      ],
      answer: 1,
      explain:
        'רכיב חכם מזריק services, יודע מאיפה הנתונים מגיעים, ומנהל ניווט. ' +
        'רכיב טיפש לא מכיר כלום — כל קלט דרך input, כל פלט דרך output. ' +
        'ההפרדה מאפשרת בדיקה, שימוש חוזר, והזזה בין features.',
    },
    {
      q: 'מה מספקת `asReadonly()` על signal ב-Angular?',
      options: [
        'ממירה את ה-signal ל-Observable',
        'מונעת ב-compile-time כתיבה ל-signal מחוץ לקלאס שיצר אותו — מחזירה Signal<T> ולא WritableSignal<T>',
        'הופכת את ה-signal לא-reactive — הוא לא מעדכן את התבנית',
        'מקפיאה את הערך הנוכחי כ-snapshot',
      ],
      answer: 1,
      explain:
        '`asReadonly()` מחזיר `Signal<T>` — ללא `set`, `update` או `mutate`. ' +
        'כל קומפוננטה שתנסה לקרוא `projects.set(...)` תקבל שגיאת TypeScript. ' +
        'ה-signal עדיין reactive: קריאה לו בתבנית גורמת לרינדור כשהוא משתנה.',
    },
    {
      q: 'למה `track p.id` ב-`@for` חשוב?',
      options: [
        'בלי track, @for לא עובד בכלל ב-Angular v22',
        'track מאפשר ל-Angular לזהות איזה DOM element שייך לאיזה item, ולעדכן רק את שהשתנה — במקום למחוק ולייצר מחדש את הכול',
        'track p.id מגביל את הרשימה ל-ids ייחודיים',
        'track נדרש רק ב-zoneless',
      ],
      answer: 1,
      explain:
        'ללא `track`, שינוי כלשהו ברשימה (הוספה, מחיקה, סדר) גורם ל-Angular לזרוק את כל ה-DOM ולבנות מחדש. ' +
        'עם `track p.id`, Angular ממפה item לפי מזהה ומעדכן רק את ה-element הרלוונטי. ' +
        'זה שומר state פנימי של רכיב (focus, animation) ומשפר ביצועים.',
    },
    {
      q: 'מה ישתנה ב-`ProjectsStore` בפרק 11 כשהמוק יוחלף ב-API אמיתי?',
      options: [
        'כל הממשק הציבורי ישתנה — projects, totalOpenIssues ו-rename יצטרכו שינוי',
        'רק `SEED` יוחלף ב-httpResource; הממשק הציבורי של ה-store — projects, totalOpenIssues, rename — נשאר זהה',
        'ProjectsStore יימחק ויוחלף בשירות HTTP ישיר',
        'הקומפוננטות יצטרכו לייבא מ-core/services במקום core/state',
      ],
      answer: 1,
      explain:
        'ה-SEED הוא מימוש, לא חוזה. ' +
        'הממשק הציבורי — `projects` (readonly signal), `totalOpenIssues` (computed), ו-`rename` (method) — נשאר. ' +
        'זה אותו עיקרון כמו `IProjectRepository` בשרת: החוזה מגן על הקוראים כשהמימוש משתנה.',
    },
    {
      q: 'למה ה-models בקליינט הם `interface` ולא `class`?',
      options: [
        'כי Angular v22 לא תומך ב-classes כמודלים',
        'כי interface נמחק לחלוטין ב-JavaScript, לא מוסיף קוד runtime, ו-TypeScript structural typing מספיק לבדיקת הצורה',
        'כי class לא יכול להכיל שדות nullable',
        'כי interface מהיר יותר לפרסור ב-JSON.parse',
      ],
      answer: 1,
      explain:
        'DTO הוא נתון בלי התנהגות. `interface` מוחק לחלוטין ב-JS; `class` מוסיף prototype וקוד ל-bundle. ' +
        'TypeScript הוא structural: אם אובייקט עונה על הצורה שה-interface מגדיר, הוא תואם — אין צורך ב-`new`.',
    },
  ],

  proveIt: [
    {
      title: 'שלושה כרטיסים ומונה open issues',
      body:
        'הריצו `pnpm start` בתוך `client/`, פתחו `http://localhost:4500`. ' +
        'אמורים להופיע שלושה כרטיסי פרויקטים, וכותרת "Projects 3 open issues" (2+1+0).',
      command: 'cd client && pnpm start',
      expect: 'שלושה כרטיסים: Website Redesign, Mobile App, Internal Tools. כותרת "3 open issues".',
    },
    {
      title: 'console log מ-Open board',
      body:
        'לחצו "Open board" על אחד הכרטיסים ופתחו את DevTools Console.',
      expect: 'מופיע `open project 1` (או 2 או 3 בהתאם לכרטיס שנלחץ).',
    },
    {
      title: 'HMR עם עריכת SEED',
      body:
        'ערכו את `openIssues` של `Website Redesign` ב-`projects.store.ts` מ-2 ל-5 ושמרו.',
      expect: 'הדפדפן מתעדכן: הכרטיס מציג "5 open", והכותרת מציגה "6 open issues". בלי רענון עמוד.',
    },
    {
      title: 'pnpm test — שלושה טסטים ירוקים',
      body: 'הריצו את הטסטים של ה-client.',
      command: 'cd client && pnpm test',
      expect: 'vitest מדווח 3 passed, 0 failed.',
    },
    {
      title: 'pnpm build — build נקי',
      body: 'הריצו build מלא של ה-client.',
      command: 'cd client && pnpm build',
      expect: 'build מסתיים ב-0 errors; bundle size רחוק מגבולות ה-budget.',
    },
  ],

  exercise: {
    prompt:
      'בחרו אחת משתי אפשרויות: (א) הוסיפו רכיב טיפש `tf-issue-status-chip` שמקבל `IssueStatus` כ-input ' +
      'ומציג תג צבעוני (Open=ירוק, InProgress=כחול, Done=אפור) — ללא outputs, ללא injections; ' +
      '(ב) הוסיפו מתודה `addProject(name: string)` ל-`ProjectsStore` ' +
      'וכפתור זמני ב-`project-list.html` שקורא לה עם שם ברירת מחדל.',
    tasks: [
      'אפשרות א: צרו `client/src/app/shared/issue-status-chip.ts` עם selector `tf-issue-status-chip`, `input.required<IssueStatus>()`, ותבנית עם `@if` או `[class]` שמשנה צבע.',
      'אפשרות א: ייבאו את `IssueStatus` מ-`core/models/issue.model.ts` — לא להגדיר מחדש.',
      'אפשרות ב: הוסיפו ל-`ProjectsStore` את `addProject(name: string)` שדוחפת `ProjectSummary` חדשה ל-`_projects` עם `id` גבוה מהמקסימום הקיים.',
      'אפשרות ב: הוסיפו לתבנית `project-list.html` כפתור `<button (click)="store.addProject(\'New\')">הוסף</button>` — זמני, יוסר בפרק 12.',
      'הריצו `pnpm test` ו-`pnpm build` ווודאו שהכל עובר.',
    ],
    acceptance: [
      'אפשרות א: `tf-issue-status-chip` מציג צבע שונה לכל status.',
      'אפשרות ב: לחיצה על "הוסף" מוסיפה כרטיס נוסף לרשימה בזמן אמת ומעדכנת את `totalOpenIssues`.',
      'כל הטסטים הקיימים (3) ממשיכים לעבור.',
      'Build מסתיים ללא שגיאות.',
    ],
  },
};
