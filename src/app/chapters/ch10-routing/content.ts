import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 10 — ניתוב.
 * lazy loading, guards ו-resolvers, ה-URL כ-state, ו-route input binding.
 */
export const CH10_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 10.1 */
    {
      id: '10.1',
      title: 'ה-URL הוא עמוד השדרה',
      blocks: [
        {
          kind: 'p',
          text:
            'עד פרק 09 השלד החזיק את `ProjectList` ישירות בתבנית. ' +
            'ה-URL של הדפדפן לא השתנה, לחצן "אחורה" לא עבד, ' +
            'ואי-אפשר היה לשלוח קישור ישיר ללוח של פרויקט ספציפי. ' +
            'מפרק 10 ואילך ה-URL מחליט מה מוצג — לא קוד הרכיב.',
        },
        {
          kind: 'p',
          text:
            'ה-URL `/projects/2?status=Open` מורכב משלושה חלקים: ' +
            '‏`/projects/2` הוא הנתיב שמתאים ל-route record, ' +
            '‏`2` הוא path param שיהפוך ל-`projectId` input, ' +
            'ו-`status=Open` הוא query string שיהפוך ל-`status` input. ' +
            'כל אחד מהחלקים האלה מגיע ישירות ל-`ProjectBoard` כ-input — ' +
            'ללא `ActivatedRoute`, ללא subscriptions.',
        },
        {
          kind: 'ul',
          items: [
            'נתיב (path): ‏`/projects/2` — מזהה את ה-route record ומחלץ את `projectId`.',
            'path param: ‏`:projectId` — חלק דינמי מהנתיב; מגיע כ-string, הופך ל-number עם `numberAttribute`.',
            'query string: ‏`?status=Open` — פרמטר אופציונלי; ‏`withComponentInputBinding` קושר אותו ל-`status` input.',
            'resolver data: ‏`project` — ה-resolver טוען את האובייקט מה-store לפני שהרכיב נוצר; נקשר לפי שם המפתח.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה עכשיו? בפרקים 06–09 בנינו state, ממשק, ועיצוב. ' +
            'אבל כל מה שבנינו חי בדף יחיד — URL אחד, מסך אחד. ' +
            'ניתוב הוא הצעד שהופך קבוצת רכיבים לאפליקציה: ' +
            'כל מסך קיבל כתובת, כל כתובת ניתנת לשיתוף, ' +
            'ולחצן "אחורה" של הדפדפן עובד בחינם.',
        },
      ],
      panel: {
        kind: 'diagram',
        caption: 'הפירוק של /projects/2?status=Open — נתיב, params וקשירה ל-inputs.',
        mermaid: `flowchart TD
  URL["URL: /projects/2?status=Open"]
  RECORD["route record\\npath: 'projects/:projectId'"]
  PARAM["path param\\nprojectId = '2'"]
  QUERY["query string\\nstatus = 'Open'"]
  RESOLVER["resolver data\\nproject: ProjectSummary"]
  BOARD["ProjectBoard\\ninputs: projectId · project · status"]
  URL --> RECORD
  RECORD --> PARAM
  URL --> QUERY
  RECORD --> RESOLVER
  PARAM --> BOARD
  QUERY --> BOARD
  RESOLVER --> BOARD`,
      },
    },

    /* ------------------------------------------------------------ 10.2 */
    {
      id: '10.2',
      title: 'שורה אחת שמשנה הכול',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-Angular, ה-router מחלץ path params, query params ונתוני resolver — ' +
            'אבל כברירת מחדל הוא לא קושר אותם ל-inputs של הרכיב. ' +
            'כדי לאפשר את הקשירה הזו צריך להפעיל את ה-feature `withComponentInputBinding()` ' +
            'ב-`provideRouter()`.',
        },
        {
          kind: 'p',
          text:
            'שינוי אחד ב-`app.config.ts` פותח שלושה ערוצים בו-זמנית: ' +
            'path params מגיעים ל-inputs לפי שם (‏`projectId`), ' +
            'query string מגיע ל-inputs לפי שם (‏`status`), ' +
            'ונתוני resolver מגיעים ל-inputs לפי שם מפתח ה-resolve (‏`project`). ' +
            'אפס `ActivatedRoute`, אפס subscriptions בכל האפליקציה.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה withComponentInputBinding() מאפשר, ומדוע הוא לא ברירת מחדל?',
          body:
            'ה-feature קושר path params, query params ונתוני resolver ישירות ל-inputs של הרכיב — ' +
            'הפרמטר `projectId` מהנתיב מגיע ל-`input()` בשם `projectId`, ' +
            'בלי לכתוב `this.route.paramMap.subscribe(...)`. ' +
            'הוא לא ברירת מחדל מטעמי תאימות לאחור: אפליקציות ישנות שמשתמשות ב-inputs בשם זהה ' +
            'לפרמטרי router עלולות לקבל ערכים לא צפויים. ' +
            'ב-Angular v22 עם codebase חדש — תמיד כדאי להפעיל אותו.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch10',
        file: 'client/src/app/app.config.ts',
        region: 'step-10.2',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 10.3 */
    {
      id: '10.3',
      title: 'מפת הנתיבים',
      blocks: [
        {
          kind: 'p',
          text:
            'כל הניתוב של האפליקציה מוגדר בקובץ אחד: ‏`app.routes.ts`. ' +
            'שלושה רשומות, שלושה דפוסים:',
        },
        {
          kind: 'ul',
          items: [
            'נתיב ריק (`\'\'`): ‏`component: ProjectList` — נטעון מיד (eager). הדף הראשון שהמשתמש רואה לא ממתין ל-import דינמי.',
            'נתיב `\'projects/:projectId\'`: ‏`loadComponent` עם guard ו-resolver — נטעון עצל. הקוד לא יורד עד שמישהו מנווט לשם.',
            'נתיב `\'**\'` (wildcard): ‏`loadComponent` של `NotFound` — תופס כל URL שאף רשומה לא תאמה לו. חייב להיות אחרון.',
          ],
        },
        {
          kind: 'p',
          text:
            '‏`title: \'TaskForge — Projects\'` בכל רשומה מגדיר את כותרת הדפדפן דרך ה-`TitleStrategy` המובנה. ' +
            'ה-router מעדכן את `document.title` בכל ניווט — ללא שורת קוד נוספת ברכיב.',
        },
        {
          kind: 'term',
          name: 'eager vs lazy loading',
          definition:
            'בניתוב Angular, eager loading (‏`component: SomeClass`) אומר שהקוד של הרכיב נמצא ב-bundle הראשי ' +
            'ונטעון בזמן bootstrap. ' +
            'Lazy loading (‏`loadComponent: () => import(...)`) יוצר chunk נפרד בבניית ה-bundle; ' +
            'הקוד מגיע לדפדפן רק כשהמשתמש מנווט לאותו נתיב לראשונה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch10',
        file: 'client/src/app/app.routes.ts',
        region: 'step-10.3',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 10.4 */
    {
      id: '10.4',
      title: 'עצל באמת: ההוכחה ב-build',
      blocks: [
        {
          kind: 'p',
          text:
            'כשכותבים `loadComponent: () => import(\'./features/projects/project-board\').then(m => m.ProjectBoard)`, ' +
            'ה-bundler (Angular CLI עם esbuild) מזהה את ה-dynamic import ומפצל את הקוד לקובץ chunk נפרד. ' +
            'הקוד של `ProjectBoard`, ה-guard, ה-resolver ורכיב `NotFound` ' +
            'לא ייכלל ב-bundle הראשי שהדפדפן מוריד בטעינה הראשונה.',
        },
        {
          kind: 'code',
          lang: 'bash',
          title: 'pnpm build — chunks',
          code: `Initial chunk files   | Names        | Raw size
main-XXXXXXXX.js      | main         | 98.23 kB
polyfills-XXXXXXXX.js | polyfills    |  34.82 kB
styles-XXXXXXXX.css   | styles       |   6.11 kB

Lazy chunk files      | Names        | Raw size
chunk-XXXXXXXX.js     | project-board| 3.14 kB
chunk-XXXXXXXX.js     | not-found    | 630 bytes`,
        },
        {
          kind: 'p',
          text:
            'שימו לב: ‏`not-found` שוקל 630 בייטים בלבד — רכיב שלם עם template ו-styles, ' +
            'אבל נשלח לדפדפן רק אם המשתמש מקיש כתובת לא קיימת. ' +
            '‏`project-board` יגיע רק בניווט הראשון ללוח פרויקט. ' +
            'בכל טעינה ראשונה של האפליקציה, שני ה-chunks האלה לא יורדים כלל.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ההבדל בין component ל-loadComponent בהגדרת route?',
          body:
            '‏`component: ProjectList` מייצר תלות סטטית: Angular CLI כולל את הקוד ב-bundle הראשי. ' +
            '‏`loadComponent: () => import(...)` יוצר תלות דינמית: ה-bundler מפצל chunk נפרד ' +
            'שמגיע לדפדפן רק בניווט הראשון לאותו נתיב. ' +
            'ה-tradeoff: eager קצת מאיץ את הניווט הראשון לאותו דף (הקוד כבר שם), ' +
            'אבל מכביד את הטעינה הראשונית של האפליקציה כולה. ' +
            'ב-TaskForge: הבית (`\'\'`) טעון eager כי הוא המסך הראשון; כל שאר הנתיבים lazy.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch10',
        file: 'client/src/app/app.routes.ts',
      },
    },

    /* ------------------------------------------------------------ 10.5 */
    {
      id: '10.5',
      title: 'השומר בפתח',
      blocks: [
        {
          kind: 'p',
          text:
            'מה קורה כשמישהו מקיש `localhost:4500/projects/99` ישירות ב-URL bar, ' +
            'ופרויקט 99 לא קיים? ' +
            'בלי guard, הרכיב ייוצר, ה-resolver יחפש `store.projects().find(p => p.id === 99)` — ' +
            'ויחזיר `undefined`. ה-`!` שכתבנו ב-resolver יתפוצץ בזמן ריצה.',
        },
        {
          kind: 'p',
          text:
            '‏`projectExistsGuard` הוא `CanActivateFn` — פונקציה שה-router קורא לה לפני שנתיב נטעון. ' +
            'הוא מזריק את `ProjectsStore` ואת `Router` עם `inject()` (אפשרי כי ה-function רץ בהקשר injection), ' +
            'בודק אם הפרויקט קיים, ומחזיר `true` לאפשר ניווט ' +
            'או `router.createUrlTree([\'\/\'])` לחזרה הביתה.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה להחזיר UrlTree מ-guard ולא לקרוא router.navigate בעצמך?',
          body:
            'כששני ניווטים מתחילים בו-זמנית, הדפדפן עלול להיות במצב לא עקבי. ' +
            'כשה-guard מחזיר `UrlTree`, הראוטר מבטל את הניווט הנוכחי באטומיות ומתחיל ניווט חדש — ' +
            'ניהול מושלם של תור הניווטים. ' +
            'כשקוראים ל-`router.navigate()` בתוך ה-guard, שני ניווטים פעילים בו-זמנית: ' +
            'הניווט המקורי ממשיך לרוץ בזמן שהניווט החדש מתחיל — ' +
            'מרוץ (race condition) שקשה לאתר ולשחזר.',
        },
        {
          kind: 'term',
          name: 'CanActivateFn',
          definition:
            'סוג פונקציונלי של route guard ב-Angular: ' +
            '‏`(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => boolean | UrlTree | Observable<...> | Promise<...>`. ' +
            'החזרת `true` מאפשרת ניווט; החזרת `UrlTree` מבטלת ומפנה לנתיב אחר; ' +
            'החזרת `false` מבטלת ללא הפנייה. ' +
            'הפונקציה רצה בהקשר injection ולכן יכולה להשתמש ב-`inject()`.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch10',
        file: 'client/src/app/features/projects/project.guard.ts',
        region: 'step-10.5',
      },
    },

    /* ------------------------------------------------------------ 10.6 */
    {
      id: '10.6',
      title: 'resolver: הנתונים לפני הרכיב',
      blocks: [
        {
          kind: 'p',
          text:
            'Guard בדק שהפרויקט קיים — אבל הרכיב עדיין צריך את נתוני הפרויקט. ' +
            'ה-resolver מריץ לוגיקה לפני שהרכיב נוצר ומספק את הנתונים ישירות ל-inputs שלו. ' +
            'שמו במפתח `resolve: { project: projectResolver }` הוא בדיוק שם ה-input ' +
            'שיקבל את הנתונים: ‏`readonly project = input.required<ProjectSummary>()`.',
        },
        {
          kind: 'p',
          text:
            'כיום הוא סינכרוני — ה-store גר בזיכרון. ' +
            'בפרק 11 ה-guard וה-resolver ייהפכו לאסינכרוניים ויחכו ל-HTTP לפני טעינת הלוח. ' +
            'הרכיב לא ירגיש בהבדל: החתימה `ResolveFn<ProjectSummary>` תישאר, ' +
            'ה-input `project` ימשיך לקבל `ProjectSummary` — ' +
            'הסים נשאר שלם בדיוק כמו `IProjectRepository` מפרק 02.',
        },
        {
          kind: 'p',
          text:
            'ה-`!` בסוף שורת ה-find מתועד בקוד: ' +
            '`// ה-guard כבר אימת קיום — הסימן ! מתועד, לא מנחש`. ' +
            'ה-guard רץ לפני ה-resolver; אם הגענו לכאן — הפרויקט קיים.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה resolver ולא טעינה בתוך הרכיב עם `effect` או `ngOnInit`? ' +
            'resolver מבטיח שהרכיב נוצר רק עם נתונים תקינים — ' +
            'אין מצב ביניים של "טוען...", אין צורך ב-optional chaining בכל השבלונה. ' +
            'בנוסף, resolver מהווה boundary ברור: ' +
            'אם ה-HTTP ייכשל בפרק 11, הניווט ייעצר לפני שהרכיב בכלל נוצר.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch10',
        file: 'client/src/app/features/projects/project.resolver.ts',
        region: 'step-10.6',
      },
    },

    /* ------------------------------------------------------------ 10.7 */
    {
      id: '10.7',
      title: 'שלושה inputs, שלושה מקורות',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`ProjectBoard` הוא תוצאת `withComponentInputBinding`: ' +
            'שלושה inputs, שלושה מקורות שונים, אפס `ActivatedRoute`. ' +
            'ה-router משמש כה-DI של ה-URL.',
        },
        {
          kind: 'ul',
          items: [
            '‏`projectId = input.required({ transform: numberAttribute })` — מגיע מ-`:projectId` בנתיב. Path params הם תמיד strings; ‏`numberAttribute` הוא transform מובנה ב-Angular שממיר `\'2\'` ל-`2`.',
            '‏`project = input.required<ProjectSummary>()` — מגיע מה-resolver לפי שם המפתח `project`. הרכיב לא יודע שה-resolver קיים; הוא מקבל `ProjectSummary` בדיוק כמו input רגיל מהורה.',
            '‏`status = input<string>()` — מגיע מה-query string `?status=Open`. הוא אופציונלי (ללא `required`) כי משתמשים יכולים לנווט ל-`/projects/2` בלי query string.',
          ],
        },
        {
          kind: 'callout',
          tone: 'v22',
          body:
            'ב-Angular v22, ‏`input.required()` הוא signal-based input: ' +
            'קריאה ל-`projectId()` בתבנית היא reactive — ' +
            'אם הראוטר יעדכן את הפרמטר (ניווט לפרויקט אחר בלי לצאת מהדף), ' +
            'כל computed ו-effect שתלוי ב-`projectId()` יתעדכן אוטומטית. ' +
            'זהו הבסיס לניווט "soft" בין לוחות — ללא destroy/create של הרכיב.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch10',
        file: 'client/src/app/features/projects/project-board.ts',
        region: 'step-10.8',
      },
    },

    /* ------------------------------------------------------------ 10.8 */
    {
      id: '10.8',
      title: 'ה-URL הוא ה-state',
      blocks: [
        {
          kind: 'p',
          text:
            'לוח הפרויקט מציג ארבעה chips לסינון: All, Open, InProgress, Done. ' +
            'כל chip הוא `<a routerLink="." [queryParams]="{ status: \'Open\' }">`. ' +
            'הנתיב היחסי `.` אומר "אותו נתיב, queryParams חדש". ' +
            'ה-router מנווט ל-`/projects/2?status=Open` — ומיד ה-`status` input מתעדכן.',
        },
        {
          kind: 'ul',
          items: [
            'רענון דף: ה-URL נשמר על ידי הדפדפן; הרכיב נוצר מחדש עם `status=\'Open\'` ישירות מה-query string.',
            'שיתוף קישור: הנמען פותח את הדף עם אותו סינון פעיל — ללא localStorage, ללא cookies.',
            'לחצן אחורה: הדפדפן שומר את היסטוריית ה-URL; כל לחיצה על chip נוספת לדף ההיסטוריה.',
            '‏`[class.on]="status() === \'Open\'"` מסמן את ה-chip הפעיל — reactive עם signal.',
          ],
        },
        {
          kind: 'p',
          text:
            'הסגנון של chips הסינון מוגדר ב-`client/src/app/features/projects/project-board.scss`: ' +
            'עיגול (‏`border-radius: 999px`), גבול, וצבע ember כשה-class `.on` פעיל עם `color-mix` על הרקע.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה לשמור סינון ב-URL ולא ב-signal פנימי של הרכיב?',
          body:
            'Signal פנימי הוא ephemeral state: אובד ברענון, לא ניתן לשיתוף, ולחצן "אחורה" מתנהג בצורה לא צפויה. ' +
            'URL הוא persistent, shareable state: רענון שומר את הסינון, ' +
            'שיתוף קישור מביא את הנמען לאותו מצב, ' +
            'ולחצן "אחורה" עובד בדיוק כמו שהמשתמש מצפה. ' +
            'חוק האצבע: כל state שהמשתמש "רואה בכתובת" — צריך לגור ב-URL.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch10',
        file: 'client/src/app/features/projects/project-board.html',
      },
    },

    /* ------------------------------------------------------------ 10.9 */
    {
      id: '10.9',
      title: '** תופס את כל השאר',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-router של Angular עובד על עיקרון "first-match wins": ' +
            'הוא עובר על ה-routes array מלמעלה למטה ומנווט לראשון שמתאים. ' +
            'לכן `path: \'**\'` חייב תמיד להיות הרשומה האחרונה — אחרת הוא יתפוס נתיבים תקינים.',
        },
        {
          kind: 'p',
          text:
            '‏`NotFound` הוא single-file component: template ו-styles inline ב-TypeScript. ' +
            'זה מתאים כי הוא קטן — פסקה אחת וקישור אחד. ' +
            'גם לו `title: \'TaskForge — Not found\'` כדי שדף 404 יקבל כותרת מתאימה בלשוניות הדפדפן.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            'שמירת `\'**\'` לא אחרון היא באג קלאסי: ' +
            'כשה-wildcard מגיע לפני `\'projects/:projectId\'`, ' +
            'כל ניווט ל-`/projects/anything` יציג 404 במקום ללוח הפרויקט. ' +
            'הראוטר מצא התאמה ב-`\'**\'` לפני שהגיע לרשומה הנכונה — ויצא מהלולאה. ' +
            'סדר הרשומות הוא חלק מהלוגיקה, לא רק קוסמטיקה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch10',
        file: 'client/src/app/core/ui/not-found.ts',
      },
    },

    /* ------------------------------------------------------------ 10.10 */
    {
      id: '10.10',
      title: 'ה-console.log משלם את החוב',
      blocks: [
        {
          kind: 'p',
          text:
            'בפרק 07 הדמנו את העיקרון: הכרטיס הטיפש פולט `output<number>()`, ' +
            'הרכיב החכם מקבל את ה-id ו... מדפיס `console.log(projectId)`. ' +
            'זה היה placeholder מכוון — ניווט דורש router, שעדיין לא היה. ' +
            'עכשיו הוא כאן.',
        },
        {
          kind: 'p',
          text:
            '‏`ProjectList` מזריק `Router` ומגדיר: ' +
            '`this.router.navigate([\'/projects\', projectId])`. ' +
            'ה-`router.navigate()` מקבל array של segments — Angular מרכיב אותם לנתיב תקין. ' +
            'הכרטיס (`ProjectCard`) ממשיך לפלוט מספר בלבד — ' +
            'הוא לא יודע ולא צריך לדעת על ניתוב. ' +
            'ה-smart component הוא שמחליט לאן ממשיכים.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'ה-pattern הזה — כרטיס טיפש שפולט id, רכיב חכם שמנווט — ' +
            'הוא ביטוי נוסף של הפרדת האחריות מפרק 07. ' +
            'כשמחר נרצה שלחיצה על כרטיס תפתח modal במקום לנווט, ' +
            'רק `ProjectList.onOpen()` ישתנה — לא `ProjectCard` ולא כל מקום שמשתמש בו.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch10',
        file: 'client/src/app/features/projects/project-list.ts',
        region: 'step-10.10',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 10.11 */
    {
      id: '10.11',
      title: 'השלד מפסיק להכיר פיצ׳רים',
      blocks: [
        {
          kind: 'p',
          text:
            'בפרק 07 הצהרנו על המטרה: ה-`App` shell לא יכיר שום feature ישירות. ' +
            'פרק 10 מגשים את זה סוף סוף: ' +
            '‏`ProjectList` יצא מה-imports של `app.ts` — ' +
            'מי שמחליט מה מוצג ב-`<main>` הוא ה-router, לא הקוד של ה-shell.',
        },
        {
          kind: 'p',
          text:
            'שתי תוספות לשלד: ‏`RouterOutlet` (הנחיה ל-router איפה להציב את הרכיב הפעיל) ' +
            'ו-`RouterLink` (כדי שה-`<a routerLink="/">` בתבנית יעבוד). ' +
            'גם בתבנית המותג (`<h1>TaskForge</h1>`) הפך לקישור הביתה:',
        },
        {
          kind: 'code',
          lang: 'html',
          title: 'client/src/app/app.html',
          code: `<header class="app-header">
  <a routerLink="/" class="brand">
    <h1>{{ title() }}</h1>
    <p class="tagline">{{ tagline() }}</p>
  </a>

  <button
    tf-button
    variant="ghost"
    type="button"
    (click)="themeSvc.toggle()"
    [attr.aria-pressed]="themeSvc.theme() === 'light'"
  >
    {{ themeSvc.theme() === 'dark' ? 'Light' : 'Dark' }} mode
  </button>
</header>

<main class="app-main">
  <router-outlet />
</main>

<tf-toast-container />`,
        },
        {
          kind: 'p',
          text:
            'ב-`client/src/app/app.scss` הסגנון של `.brand` מגדיר `text-decoration: none` ו-`color: inherit` — ' +
            'המותג נראה כמו heading, לא כמו קישור כחול.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch10',
        file: 'client/src/app/app.ts',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 10.12 */
    {
      id: '10.12',
      title: 'הטסט מקבל ראוטר',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-shell משתמש עכשיו ב-`<router-outlet>` וב-`routerLink`. ' +
            'שניהם דורשים שהראוטר יהיה מוגדר ב-`TestBed`. ' +
            'בלי `provideRouter()`, Angular זורק שגיאה: ' +
            '`NullInjectorError: No provider for ActivatedRoute`.',
        },
        {
          kind: 'p',
          text:
            'הפתרון: ‏`providers: [provideRouter(routes)]` ב-`beforeEach`. ' +
            'משתמשים באותה `routes` של האפליקציה האמיתית — ' +
            'הטסט בודק את ה-shell בסביבה הכי קרובה לייצור. ' +
            'שתי האסרציות הקיימות ממשיכות לעבור ללא שינוי: ' +
            '`should create the app` ו-`should render the title and tagline from signals`.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'כש-Angular זורק `NullInjectorError` בטסט, הפתרון הנפוץ הוא להוסיף provider חסר. ' +
            'ספקים כמו `provideRouter`, `provideHttpClient` ו-`provideAnimations` ' +
            'לא מוגדרים ב-`TestBed` כברירת מחדל — צריך להצהיר עליהם מפורשות. ' +
            'זה ייצוגי: הטסט מגלה בדיוק מה הרכיב דורש מסביבתו.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch10',
        file: 'client/src/app/app.spec.ts',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 10.13 */
    {
      id: '10.13',
      title: 'המגרש: נתב בעצמכם',
      blocks: [
        {
          kind: 'p',
          text:
            'הדמו החי מדמה את מנגנון הניתוב של TaskForge. ' +
            'הקלידו URL (ה-origin `localhost:4500` קבוע), ' +
            'או בחרו אחד מחמשת ה-presets, וראו את ההחלטה שלב אחר שלב:',
        },
        {
          kind: 'ul',
          items: [
            'Route record: איזו רשומה מהמפה התאימה (עם תווית "lazy" לנתיבים שנטענים עצל).',
            'Inputs: ה-path params וה-query params המחולצים — כל אחד כ-pill נפרד.',
            'canActivate: אם הנתיב כולל guard — האם הפרויקט קיים (pass) או שה-guard מחזיר UrlTree (redirect home). ids 1, 2, 3 קיימים; 99 לא.',
            'resolve: אם ה-guard עבר — ה-resolver טוען את הפרויקט מה-store.',
            'Component: השם הסופי של הרכיב שיוצג, או `(חזרה אל /)` אם ה-guard עצר.',
          ],
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () => import('./demos/routing.demo').then((m) => m.RoutingDemo),
        caption:
          'דמו חי: הקלידו URL ובחנו כיצד הנתב מפרק אותו לשלבים — record, params, guard, resolver, component.',
      },
    },

    /* ------------------------------------------------------------ 10.14 */
    {
      id: '10.14',
      title: 'יש ניווט, יש כתובת',
      blocks: [
        {
          kind: 'p',
          text: 'פרק 10 הוסיף לקליינט עמוד שדרה:',
        },
        {
          kind: 'ul',
          items: [
            '‏`app.config.ts` — ‏`withComponentInputBinding()`: path params, query string ונתוני resolver נקשרים ישירות ל-inputs.',
            '‏`app.routes.ts` — שלוש רשומות: eager (הבית), lazy+guard+resolver (הלוח), wildcard 404.',
            '‏`project.guard.ts` — ‏`CanActivateFn` שמחזיר `UrlTree` לניהול ניווט אטומי.',
            '‏`project.resolver.ts` — ‏`ResolveFn<ProjectSummary>` שמכין נתונים לפני יצירת הרכיב.',
            '‏`project-board.ts` — שלושה inputs, שלושה מקורות: ‏`projectId` מהנתיב, ‏`project` מה-resolver, ‏`status` מה-query string.',
            '‏`project-board.html` — chips עם `routerLink="." [queryParams]`: ה-URL הוא ה-state.',
            '‏`not-found.ts` — wildcard 404, ‏`Route.title` לכותרת הדפדפן.',
            '‏`project-list.ts` — ‏`router.navigate([\'\/projects\', projectId])` במקום `console.log`.',
            '‏`app.ts` + ‏`app.html` — ‏`RouterOutlet` + `RouterLink`; המותג הפך לקישור הביתה.',
          ],
        },
        {
          kind: 'p',
          text:
            'להרצה: ‏`pnpm start` בתוך `client/`. ' +
            'לחצו על כרטיס פרויקט — הדפדפן מנווט ל-`/projects/1` וכותרת הדפדפן משתנה. ' +
            'לחצו chip סינון — ה-URL מתעדכן ל-`?status=Open`. ' +
            'רעננו — הסינון נשמר. ' +
            'נווטו ל-`/projects/99` — חוזרים הביתה (guard). ' +
            'נווטו ל-`/nowhere` — 404.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'לאן ממשיכים',
          body:
            'פרק 11 "HTTP ו-State" יחבר את הקליינט לשרת שבנינו בפרקים 01–05. ' +
            'ה-mock store יוחלף ב-`httpResource`, interceptors פונקציונליים יטפלו ב-JWT, ' +
            'וה-guard וה-resolver יהפכו לאסינכרוניים — בלי שהרכיב ירגיש בשינוי.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch10',
        title: 'עץ הקוד אחרי פרק 10 — הקליינט קיבל ניתוב',
      },
    },
  ],

  quiz: [
    {
      q: 'מה ההבדל בין `component` ל-`loadComponent` בהגדרת route ב-Angular?',
      options: [
        '`component` מיועד לרכיבים קטנים ו-`loadComponent` לרכיבים גדולים',
        '`component` כולל את הקוד ב-bundle הראשי (eager); `loadComponent` יוצר chunk נפרד שמגיע לדפדפן רק בניווט הראשון לאותו נתיב (lazy)',
        '`loadComponent` עובד רק עם Angular Material',
        'אין הבדל פונקציונלי — הם שקולים',
      ],
      answer: 1,
      explain:
        '`component: ProjectList` יוצר תלות סטטית — הבונה כולל את הקוד ב-bundle הראשי. ' +
        '`loadComponent: () => import(...)` יוצר תלות דינמית — הבונה מפצל chunk נפרד. ' +
        'ב-TaskForge הבית נטעון eager (מסך ראשון), הלוח ו-404 נטענים lazy.',
    },
    {
      q: 'למה guard מחזיר `UrlTree` ולא קורא ל-`router.navigate()` ישירות?',
      options: [
        'כי `router.navigate()` אינו זמין בתוך guard',
        'כי `UrlTree` מהיר יותר לחישוב',
        'כי החזרת `UrlTree` מבטלת את הניווט הנוכחי באטומיות ומתחיל ניווט חדש — נמנע race condition בין שני ניווטים מקבילים',
        'כי `router.navigate()` לא עובד עם lazy routes',
      ],
      answer: 2,
      explain:
        'כש-guard קורא ל-`router.navigate()`, שני ניווטים פעילים בו-זמנית — הניווט המקורי ממשיך לרוץ. ' +
        'כש-guard מחזיר `UrlTree`, הראוטר מבטל את הניווט הנוכחי ומתחיל חדש בצורה אטומית. ' +
        'זה מונע race conditions שקשה לאבחן ולשחזר.',
    },
    {
      q: 'מה מטרת resolver, ומה ההבדל בינו לטעינת נתונים בתוך הרכיב עם `effect` או `ngOnInit`?',
      options: [
        'resolver הוא גרסה ישנה של `ngOnInit` — הם שקולים',
        'resolver מריץ לוגיקה לפני שהרכיב נוצר ומספק נתונים מוכנים ל-inputs; הרכיב מעולם לא נמצא במצב "טוען"; אם הטעינה תיכשל (בפרק 11), הניווט ייעצר לפני יצירת הרכיב',
        'resolver מהיר יותר כי הוא רץ ב-Web Worker',
        'resolver עובד רק עם HTTP, לא עם in-memory store',
      ],
      answer: 1,
      explain:
        'טעינה בתוך הרכיב יוצרת מצב ביניים: הרכיב קיים אבל הנתונים עדיין חסרים — צריך optional chaining ומסך loading. ' +
        'Resolver מבטיח שהרכיב נוצר רק עם נתונים תקינים. ' +
        'החתימה `ResolveFn<ProjectSummary>` נשארת בפרק 11 כש-HTTP ייכנס — הרכיב לא ירגיש בשינוי.',
    },
    {
      q: 'אילו מקורות `withComponentInputBinding()` קושר ל-inputs של הרכיב?',
      options: [
        'רק path params (`:projectId`)',
        'path params וגם query string בלבד',
        'path params, query string ונתוני resolver — כל השלושה נקשרים לפי שם ה-input',
        'path params, query string, resolver data וגם route data סטטי (‏`data: { ... }`)',
      ],
      answer: 3,
      explain:
        '`withComponentInputBinding()` קושר ארבעה מקורות: path params, query params, resolver data (‏`resolve: { key: fn }`), ' +
        'ו-route data סטטי (‏`data: { key: value }`). ' +
        'כל אחד נקשר ל-input לפי שם תואם. ' +
        'ב-TaskForge משתמשים בשלושת הראשונים: `projectId`, `status`, ו-`project`.',
    },
    {
      q: 'מדוע `path: \'**\'` חייב להיות הרשומה האחרונה ב-routes array?',
      options: [
        'כי Angular מסדר את הרשומות אלפביתית ו-`**` הוא האחרון',
        'כי Angular בודק רשומות מלמטה למעלה',
        'כי Angular עובד על עיקרון "first-match wins" מלמעלה למטה — אם `\'**\'` תהיה ראשונה, היא תתפוס כל URL ולא ייגיע לרשומות הספציפיות',
        'כי `loadComponent` עם `\'**\'` דורש שכל הרשומות האחרות יהיו eager',
      ],
      answer: 2,
      explain:
        'Angular עובר על ה-routes array מלמעלה למטה ומנווט לרשומה הראשונה שמתאימה. ' +
        '`\'**\'` מתאים לכל URL — לכן מיקומה קובע מה נלכד. ' +
        'אם היא ראשונה, `/projects/2` יציג 404 במקום לנווט ל-ProjectBoard.',
    },
    {
      q: 'למה path params מגיעים ל-input כ-string, ומה `numberAttribute` עושה?',
      options: [
        'path params מגיעים כ-number כברירת מחדל; `numberAttribute` ממיר אותם ל-string',
        'path params מגיעים תמיד כ-string (כי URL הוא טקסט); `numberAttribute` הוא transform מובנה ב-Angular שממיר `\'2\'` ל-`2` — בלי שנצטרך לכתוב `Number(this.route.snapshot.paramMap.get(...))`',
        '`numberAttribute` מגדיר ערך ברירת מחדל של `0` למקרה שה-param חסר',
        'path params מגיעים כ-number אם ה-route מוגדר עם type annotation',
      ],
      answer: 1,
      explain:
        'ה-URL הוא טקסט — כל path param שמגיע מהראוטר הוא string. ' +
        '`input.required({ transform: numberAttribute })` מגדיר transform שרץ אוטומטית על הערך הנכנס. ' +
        '`numberAttribute` הוא ה-transform המובנה של Angular: ממיר `\'2\'` ל-`2` ו-`\'\'`/`null` ל-`NaN`. ' +
        'ללא ה-transform, `projectId()` היה מחזיר `\'2\'` (string) ו-`===` השוואות היו נכשלות.',
    },
  ],

  proveIt: [
    {
      title: 'לחיצה על כרטיס מנווטת + URL משתנה + כותרת משתנה',
      body:
        'הריצו `pnpm start` בתוך `client/`, פתחו `http://localhost:4500`. ' +
        'לחצו על כרטיס פרויקט כלשהו.',
      command: 'cd client && pnpm start',
      expect:
        'ה-URL בדפדפן משתנה ל-`/projects/1` (או id אחר), ' +
        'לוח הפרויקט נטעון עם שם הפרויקט וה-badge של open issues, ' +
        'וכותרת הלשונית בדפדפן משתנה ל-"TaskForge — Board".',
    },
    {
      title: 'deep-link ישיר עם filter: /projects/2?status=Open',
      body:
        'הקלידו `http://localhost:4500/projects/2?status=Open` ישירות ב-URL bar של הדפדפן (רענון מלא).',
      expect:
        'הדף נטעון עם לוח פרויקט 2; chip ה-"Open" מסומן כפעיל (class `.on`). ' +
        'זה מוכיח ש-`status` input מגיע מה-query string גם בטעינה ישירה — לא רק בניווט.',
    },
    {
      title: '/projects/99 מחזיר הביתה (guard)',
      body:
        'נווטו ל-`http://localhost:4500/projects/99` ישירות ב-URL bar.',
      expect:
        'ה-guard מזהה שפרויקט 99 לא קיים ומחזיר `UrlTree(["/"])`. ' +
        'הדפדפן מנווט חזרה ל-`/` ומציג את רשימת הפרויקטים — לא מוצגת שגיאה, לא מוצג 404.',
    },
    {
      title: '/nowhere מציג 404',
      body:
        'נווטו ל-`http://localhost:4500/nowhere`.',
      expect:
        'עמוד ה-NotFound מוצג עם הטקסט "404 — this anvil is empty" וקישור "Back to the forge". ' +
        'כותרת הדפדפן: "TaskForge — Not found".',
    },
    {
      title: 'lazy chunk מופיע ב-Network tab רק בניווט ראשון ללוח',
      body:
        'פתחו DevTools (F12) ועברו ל-Network tab. רעננו את הדף (`/`). ' +
        'בדקו שאין קובץ `chunk-` שמכיל "project-board" בטעינה הראשונית. ' +
        'לאחר מכן לחצו על כרטיס פרויקט.',
      expect:
        'בטעינה הראשונית: אין chunk של project-board ברשימת ה-Network. ' +
        'לאחר הניווט ללוח: מופיע קובץ `chunk-XXXXXXXX.js` חדש ב-Network tab — ' +
        'זה ה-lazy chunk שנוצר ב-build וירד לדפדפן רק עכשיו.',
    },
  ],

  exercise: {
    prompt:
      'הוסיפו שורת chips שנייה ללוח הפרויקט — סינון לפי `priority` (High, Critical) — ' +
      'שעובדת במקביל לסינון ה-`status` הקיים. ' +
      'שני הפרמטרים צריכים להתקיים ב-URL בו-זמנית ולשרוד רענון.',
    tasks: [
      'הוסיפו ל-`ProjectBoard` input חדש: ‏`readonly priority = input<string>()` — זהה לדפוס ה-`status`.',
      'הוסיפו ב-`project-board.html` שורת ניווט שנייה עם chips: All / High / Critical. ' +
        'כל chip: ‏`routerLink="." [queryParams]="{ priority: \'High\' }" queryParamsHandling="merge"`. ' +
        'ה-`queryParamsHandling: \'merge\'` חיוני — בלעדיו לחיצה על priority תמחק את ה-status הקיים.',
      'ודאו ש-chip ה-"All" בשורת ה-priority קובע `[queryParams]="{ priority: null }"` ' +
        'עם `queryParamsHandling="merge"` כדי להסיר את הפרמטר מבלי לגעת ב-status.',
      'הריצו `pnpm test` ו-`pnpm build` ווודאו שהכל עובר.',
    ],
    acceptance: [
      'ניווט ל-`/projects/1?status=Open` ולחיצה על chip "High" מנווט ל-`/projects/1?status=Open&priority=High` — שני הפרמטרים נשמרים.',
      'רענון מלא של הדפדפן עם ‎`?status=Open&priority=High` מציג את שני ה-chips הפעילים עם class `.on`.',
      'לחיצה על chip "All" בשורת ה-priority מסירה רק את `priority` ושומרת את `status`.',
      'כל הטסטים הקיימים ממשיכים לעבור; ‏`pnpm build` מסתיים ללא שגיאות.',
    ],
  },
};
