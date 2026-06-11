import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 11 — HTTP ו-State.
 * httpResource, interceptors פונקציונליים, TokenStore, דיאלוג כניסה,
 * ProblemDetails מקצה לקצה — גל 2 נסגר.
 */
export const CH11_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 11.1 */
    {
      id: '11.1',
      title: 'שתי אפליקציות הופכות למוצר',
      blocks: [
        {
          kind: 'p',
          text:
            'בפרקים 01–05 בנינו שרת: ‏.NET 10 Minimal API, SQLite, JWT ופועל על פורט 5080. ' +
            'בפרקים 06–10 בנינו קליינט: Angular v22 zoneless, signals, עיצוב, UI kit וניתוב, על פורט 4500. ' +
            'עד פרק 10 הקליינט האכיל את עצמו ממוק בזיכרון — הבטחנו ב-ch07 שהסים ישלם. ' +
            'פרק 11 הוא הפירעון: שרת ה-API פוגש את הקליינט, והם הופכים למוצר אחד.',
        },
        {
          kind: 'p',
          text:
            'מה משתנה היום: CORS בצד השרת, ‏HttpClient עם שני interceptors פונקציונליים, ' +
            '‏httpResource מחליף את ה-seed, ‏TokenStore לניהול זהות, דיאלוג כניסה, ' +
            'ו-ProblemDetails מתורגם לטוסט בנקודה אחת. ' +
            'מה לא משתנה: תבניות רשימת הפרויקטים והכרטיס נשארות ללא נגיעה — ' +
            'בדיוק הבטחת הסים מ-ch07.',
        },
        {
          kind: 'ul',
          items: [
            'השרת: CORS policy ו-UseCors מוקדם ב-pipeline.',
            'הקליינט: ‏provideHttpClient עם authInterceptor ו-errorInterceptor.',
            '‏ProjectsStore: ‏httpResource מחליף את ה-seed, קריאת route לפי id מחכה ל-HTTP, ו-addProject שולח POST אמיתי.',
            '‏TokenStore + AuthService + LoginDialog: זהות כ-state, login/logout כפקודות.',
            '‏App shell: header מציג שם משתמש או כפתור Sign in.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה כל הסתגלות נמצאת ב-core/ ולא בתוך הרכיבים? ' +
            'CORS, interceptors, TokenStore ו-AuthService הם תשתית — ' +
            'feature אחד שיתווסף מחר (Issues, Members) יקבל את כולם בחינם. ' +
            'רכיבי ה-features לא ידעו שמשהו השתנה בחיבור לרשת.',
        },
      ],
      panel: {
        kind: 'diagram',
        caption: 'ארכיטקטורת גל 2 בשלמותה: browser ב-4500 חוצה גבול CORS אל API ב-5080, JWT מצורף על ידי interceptor, ו-ProblemDetails מגיע חזרה לטוסט.',
        mermaid: `flowchart LR
  Browser["Browser\\n:4500"]
  Interceptor["authInterceptor\\nBearer token"]
  CORS["CORS boundary\\nhttp://localhost:4500"]
  API["TaskForge API\\n:5080 + SQLite + JWT"]
  Error["errorInterceptor\\nProblemDetails → toast"]

  Browser --> Interceptor
  Interceptor -- "Authorization: Bearer ..." --> CORS
  CORS --> API
  API -- "200 / 400 / 401 ProblemDetails" --> CORS
  CORS --> Error
  Error --> Browser`,
      },
    },

    /* ------------------------------------------------------------ 11.2 */
    {
      id: '11.2',
      title: 'CORS: ‏הדפדפן שואל, השרת עונה',
      blocks: [
        {
          kind: 'p',
          text:
            'כשהקליינט ב-`localhost:4500` שולח בקשה ל-`localhost:5080`, ' +
            'הדפדפן מזהה שה-origin שונה (פורט שונה = origin שונה) ' +
            'ומוסיף כותרת `Origin: http://localhost:4500` לבקשה. ' +
            'לבקשות "מורכבות" (כמו POST עם JSON, או בקשות עם Authorization header) ' +
            'הדפדפן שולח קודם בקשת preflight — `OPTIONS` — ' +
            'ורק אם השרת מחזיר `Access-Control-Allow-Origin` מתאים הוא שולח את הבקשה האמיתית.',
        },
        {
          kind: 'p',
          text:
            'חשוב להבין: ‏CORS אינו מנגנון אבטחה שהשרת אוכף — ' +
            'אפשר לקרוא לאותו API ישירות עם `curl` ולקבל תשובה ללא בעיה. ' +
            'זהו מנגנון שהדפדפן אוכף, כדי להגן על המשתמש מפני אתרי צד שלישי ' +
            'שמנסים לשלוח בקשות מאומתות ברקע. ' +
            'ה-policy ב-`AddCors` היא הצהרת אמון של השרת: ' +
            '"origin זה מוכר לי, הדפדפן רשאי לחשוף את התשובה לקוד שרץ שם".',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מי אוכף CORS — השרת או הדפדפן? ומה זה preflight?',
          body:
            'CORS אוכף אותו הדפדפן: הוא מסרב לחשוף את תשובת השרת לקוד JavaScript ' +
            'אם לא הגיעה כותרת `Access-Control-Allow-Origin` מתאימה. ' +
            'Preflight הוא בקשת `OPTIONS` שהדפדפן שולח אוטומטית לפני בקשות "מורכבות" — ' +
            '`POST`/`PUT`/`DELETE` עם JSON, או כל בקשה עם `Authorization`. ' +
            'הדפדפן שואל: "האם מותר לי לשלוח בקשה כזו?" — ' +
            'ורק אם השרת עונה "כן" הוא מוסיף את הבקשה האמיתית. ' +
            'ב-`curl` ובשרת לשרת — אין דפדפן, אין preflight, אין הגבלה.',
        },
        {
          kind: 'p',
          text:
            'ה-policy מצהירה: Origin `http://localhost:4500` מורשה, ' +
            'כל כותרת מותרת (`AllowAnyHeader`), כל מתודה מותרת (`AllowAnyMethod`). ' +
            'ב-production תחליף `WithOrigins` בדומיין האמיתי של הקליינט.',
        },
        {
          kind: 'term',
          name: 'CORS (Cross-Origin Resource Sharing)',
          definition:
            'מנגנון דפדפן שמגן על המשתמש: כשדף ב-origin אחד (פרוטוקול + דומיין + פורט) ' +
            'מנסה לשלוח בקשה HTTP ל-origin שונה, הדפדפן בודק אם השרת הצהיר שה-origin הזה מורשה. ' +
            'אם לא — הדפדפן חוסם את החשיפה של התשובה לקוד JavaScript. ' +
            'ה-policy ב-`AddCors`/`UseCors` היא הצהרת האמון של השרת לדפדפן.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch11',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-11.2',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 11.3 */
    {
      id: '11.3',
      title: 'HttpClient נכנס, עם שני שומרים',
      blocks: [
        {
          kind: 'p',
          text:
            '‏Angular מספק `HttpClient` דרך `provideHttpClient()`. ' +
            'ה-`withInterceptors()` מאפשר להזריק interceptors פונקציונליים לפי סדר. ' +
            'הסדר חשוב: בקשה עוברת את ה-interceptors משמאל לימין — ' +
            'קודם `authInterceptor` (שמצרף Bearer), ואז `errorInterceptor`. ' +
            'תשובה עוברת בכיוון ההפוך — קודם `errorInterceptor` (שמתרגם שגיאות) ' +
            'ואז `authInterceptor` (שפשוט מעביר הלאה).',
        },
        {
          kind: 'p',
          text:
            '‏`API_BASE` מוגדר בקובץ אחד ומיובא על ידי כל מי שצריך — ' +
            'בפרודקשן תשנו ערך אחד ותקבלו שינוי בכל האפליקציה.',
        },
        {
          kind: 'code',
          lang: 'typescript',
          title: 'client/src/app/core/api/api.ts',
          code: `// כתובת ה-API במקום אחד. בפרודקשן זה יגיע מהגדרת סביבה או reverse proxy —
// בפיתוח, השרת חי על 5080 והקליינט על 4500, ו-CORS (צד השרת) מתיר את הפער.
export const API_BASE = 'http://localhost:5080/api';`,
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה שני interceptors נפרדים ולא אחד שעושה הכול? ' +
            'Single Responsibility: ‏`authInterceptor` מכיר את `TokenStore`, ' +
            '‏`errorInterceptor` מכיר את `ToastService`. ' +
            'כשמחר תרצו interceptor שלישי למדידת זמן בקשות — ' +
            'תוסיפו אותו לרשימה בלי לגעת בשניים האחרים.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch11',
        file: 'client/src/app/app.config.ts',
        region: 'step-11.3',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 11.4 */
    {
      id: '11.4',
      title: 'הסים משלם: httpResource',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-ch07 הצהרנו: ה-store ישמור את הציבור זהה גם כשמחליפים את מקור הנתונים. ' +
            'עכשיו מחליפים: מערך ה-`SEED` של המוק נמחק, ' +
            'ו-`httpResource` נכנס במקומו. ' +
            '‏`httpResource` הוא בקשת GET שהיא signal: היא יוצאת מעצמה ברגע שהרכיב נוצר, ' +
            'יודעת לרענן ב-`reload()`, וחושפת `hasValue()` / `value()` / `isLoading()` / `error()` — ' +
            'בלי subscribe ובלי ניהול מחזור חיים ידני.',
        },
        {
          kind: 'p',
          text:
            'הארגומנט הראשון הוא פונקציה שמחזירה URL — ' +
            'אם ה-URL תלוי בסיגנל אחר (פרמטר סינון, מזהה פרויקט), ' +
            '‏Angular יגדיר את הפונקציה כ-computed אוטומטי ויפנה בקשה חדשה בכל שינוי. ' +
            '‏`defaultValue: []` מבטיח שהטיפוס הציבורי הוא `ProjectSummary[]` ' +
            '(ולא `ProjectSummary[] | undefined`) — הרכיבים הקוראים לא צריכים לטפל ב-`null`.',
        },
        {
          kind: 'term',
          name: 'httpResource',
          definition:
            'API מ-Angular v22 (‏`@angular/common/http`) שמגדיר בקשת GET declarative כ-signal. ' +
            'נוצר בשדה-מחלקה (field initializer) עם פונקציית URL. ' +
            'חושף `hasValue()`, `value()`, `isLoading()`, `error()`, `reload()` ו-`status()`. ' +
            'אוטומטית: מבטל תשובות stale (כשנשלחת בקשה חדשה לפני שהישנה חזרה), ' +
            'ומאפשר reload ידני. מתאים לקריאות declarative — לא לפקודות כמו POST.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch11',
        file: 'client/src/app/core/state/projects.store.ts',
        region: 'step-11.5',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 11.5 */
    {
      id: '11.5',
      title: 'הציבור לא השתנה',
      blocks: [
        {
          kind: 'p',
          text:
            'זו הוכחת הסים: ‏`projects()`, ‏`totalOpenIssues()` נשארים אותם computed. ' +
            '‏`loading` ו-`loadError` הם תוספות חדשות — לא שינויים. ' +
            'כל קוד קיים שקרא `store.projects()` ממשיך לעבוד ללא שינוי שורה אחת.',
        },
        {
          kind: 'p',
          text:
            'שימו לב ל-wrapper של `computed`: ' +
            '`projectsResource.hasValue() ? projectsResource.value() : []`. ' +
            'למה לא לחשוף את `projectsResource.value` ישירות? ' +
            'קודם כול, `value()` לא נקרא במצב error בלי guard. ' +
            'מעבר לזה, ה-`projectsResource` הוא פרטי. ' +
            'אם מחר תחליפו את `httpResource` ב-WebSocket subscription, ' +
            'הציבור `projects()` לא ישתנה — שוב אותו עיקרון.',
        },
        {
          kind: 'ul',
          items: [
            '`projects()` — computed בטוח מעל `hasValue()` ו-`value()`. ציבורי, זהה ל-ch07.',
            '`loading()` — computed מעל `isLoading()`. חדש — לא שינוי.',
            '`loadError()` — computed מעל `error()`. חדש — לא שינוי.',
            '`totalOpenIssues()` — computed מעל `projects()`. לא נגע בו.',
            '`findProject(id)` — seam חדש עבור route guard/resolver; קודם בודק את הרשימה, אחר כך מבקש מה-API.',
            '`client/src/app/features/projects/project.guard.ts` ו-`client/src/app/features/projects/project.resolver.ts` — עברו ל-async בלי לשנות את `ProjectBoard`.',
            'תבניות `project-list.html` ו-`project-card.html` — אפס דיפים לצד הקריאות.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה חשוב שהציבור לא ישתנה? ' +
            'בארכיטקטורה אמיתית, ה-store הוא ה-seam — ' +
            'הממשק שמפריד בין "מאיפה מגיעים הנתונים" לבין "מי מציג אותם". ' +
            'כשהציבור יציב, אפשר לשנות את המימוש (mock, HTTP, WebSocket, cache) ' +
            'בלי לגעת בשום רכיב שמשתמש ב-store. ' +
            'זו אותה הבטחה כמו `IProjectRepository` מ-ch02 — רק בצד הלקוח.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch11',
        file: 'client/src/app/core/state/projects.store.ts',
        region: 'step-11.6',
      },
    },

    /* ------------------------------------------------------------ 11.6 */
    {
      id: '11.6',
      title: 'המגרש: מכונת המצבים של resource',
      blocks: [
        {
          kind: 'p',
          text:
            'הדמו מדמה את מחזור החיים של `httpResource` בצורה אינטראקטיבית, עם guard נכון סביב `value()`. ' +
            'לחצו `resource.reload()` ובחנו:',
        },
        {
          kind: 'ul',
          items: [
            'idle: מצב אפשרי כשאין request תקף. ב-`ProjectsStore` שלנו תמיד יש URL, ולכן המסך בפועל עובר מהר ל-loading.',
            'isLoading(): הבקשה בדרך — תג ה-isLoading נדלק; בזמן reload הרשימה יכולה להישאר עם הערך הקודם.',
            'hasValue() ואז value(): תשובה 200 הגיעה; הרשימה מתעדכנת.',
            'error(): ה-"שברו את השרת" Toggle מפעיל 503 — `error()` מוגדר. לא קוראים `value()` בלי `hasValue()`, כי resource במצב error יכול לזרוק בזמן ריצה.',
            'Stale rejection: לחצו כפול מהיר — הלוג מדפיס "response #1 ignored (stale)" כי בקשה #2 כבר יצאה. ‏httpResource עושה את זה אוטומטית.',
          ],
        },
        {
          kind: 'callout',
          tone: 'v22',
          body:
            'ב-Angular v22 ‏`httpResource` מובנה ב-`@angular/common/http` — ' +
            'אין צורך בספרייה חיצונית. ' +
            'ה-stale-response rejection מובנה: ' +
            'כשנשלחת בקשה חדשה לפני שהישנה חזרה, התשובה הישנה נזרקת אוטומטית — ' +
            'בדיוק כמו שהדמו מראה בלוג.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () => import('./demos/resource.demo').then((m) => m.ResourceDemo),
        caption:
          'דמו חי: מחזור החיים של httpResource — idle, isLoading(), hasValue(), value(), error(). שברו את השרת ובדקו ש-value() נקרא רק אחרי hasValue().',
      },
    },

    /* ------------------------------------------------------------ 11.7 */
    {
      id: '11.7',
      title: 'TokenStore: הזהות היא state',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`TokenStore` מיישם את אותו דפוס store שראינו ב-`ProjectsStore`: ' +
            'signal פרטי (`_session`) שנחשף לקריאה בלבד דרך computed signals. ' +
            'ה-session נשמר ב-localStorage תחת המפתח `\'taskforge-auth\'` ' +
            'כדי שרענון דף לא ינתק את המשתמש. ' +
            '`restoreSession()` קוראת מ-localStorage בזמן אתחול — ' +
            'ערך פגום (JSON לא תקין, מחרוזת ריקה) נתפס ב-`catch` ומוחזר `null` בשקט, ' +
            'כדי שבאג ב-localStorage לא יפיל את כל האפליקציה.',
        },
        {
          kind: 'p',
          text:
            '‏`accessToken`, `user` ו-`isLoggedIn` הם computed — ' +
            'קוראים ממנו בתבנית ומקבלים עדכון reactive אוטומטי ברגע שה-session משתנה.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'localStorage וטוקנים: האם זה בטוח?',
          body:
            'טוקן ב-localStorage נגיש לכל JavaScript שרץ בדף — ' +
            'כולל סקריפטים מצד שלישי אם יש XSS vulnerability. ' +
            'החלופה היא httpOnly cookie: הדפדפן שולח אותו אוטומטית בכל בקשה, ' +
            'ו-JavaScript לא יכול לקרוא אותו בכלל. ' +
            'אבל httpOnly cookies יוצרות חשיפה ל-CSRF — ' +
            'שתי הגישות הן tradeoff, לא "אחת בטוחה ואחת לא". ' +
            'לאפליקציית למידה זו localStorage מספיק — ' +
            'פרק ההקשחה (ch17) יסקור את ה-tradeoffs ויציג SameSite cookies.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch11',
        file: 'client/src/app/core/auth/token.store.ts',
        region: 'step-11.10',
      },
    },

    /* ------------------------------------------------------------ 11.8 */
    {
      id: '11.8',
      title: 'ה-interceptor שמצרף את התעודה',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`authInterceptor` הוא `HttpInterceptorFn` — פונקציה, לא class. ' +
            'זהו הסגנון הפונקציונלי של Angular v15+ שמחליף את ה-`HttpInterceptor` הקלאסי. ' +
            'פונקציה פונקציונלית רצה בהקשר injection ולכן `inject()` עובד בתוכה בלי constructor.',
        },
        {
          kind: 'p',
          text:
            'שתי נקודות מפתח: ראשית, בקשות HTTP הן immutable ב-Angular — ' +
            'אי-אפשר לשנות כותרת קיימת, חייבים לקרוא `clone()` עם הכותרות החדשות ' +
            'ולהעביר את ה-clone ל-`next`. ' +
            'שנית, ה-Bearer נשלח רק לבקשות שמיועדות ל-`API_BASE` — ' +
            'אם הקליינט יפנה ל-CDN חיצוני או לשירות אחר, ' +
            'הטוקן לא ידלוף לשם.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה לא לצרף את ה-Bearer לכל בקשה יוצאת?',
          body:
            'אם האפליקציה שולחת בקשות ל-origin חיצוני (CDN, analytics, Google Fonts), ' +
            'צירוף Bearer לכל בקשה יגרום לדלף של טוקן האימות לדומיין זר — ' +
            'כל שרת שמקבל אותה יכול לזייף את הזהות בשרת שלנו. ' +
            'הבדיקה `req.url.startsWith(API_BASE)` מבטיחה שהטוקן נשאר ' +
            'רק בתעבורה בין הקליינט לשרת שלנו.',
        },
        {
          kind: 'term',
          name: 'interceptor פונקציונלי (HttpInterceptorFn)',
          definition:
            'דפוס Angular לעיבוד בקשות ותשובות HTTP: פונקציה מסוג `HttpInterceptorFn` ' +
            'שמקבלת `req` (הבקשה) ו-`next` (ה-handler הבא בשרשרת) ומחזירה Observable. ' +
            'רצה בהקשר injection — `inject()` זמין. ' +
            'מחליף את ה-`HttpInterceptor` class הקלאסי שקדם ל-v15. ' +
            'מוזן ל-`withInterceptors([...])` ב-`provideHttpClient`.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch11',
        file: 'client/src/app/core/auth/auth.interceptor.ts',
        region: 'step-11.8',
      },
    },

    /* ------------------------------------------------------------ 11.9 */
    {
      id: '11.9',
      title: 'שגיאה אחת, שפה אחת: ProblemDetails',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-ch04 הגדרנו בשרת ש-`AddProblemDetails` + `AddValidation` ' +
            'מחזירים כל שגיאה בפורמט RFC 7807: ' +
            'אובייקט JSON עם `title`, `detail`, `status`, ' +
            'ו-`errors` (מילון שגיאות ולידציה). ' +
            'ה-`errorInterceptor` גואל את ההבטחה מפרק 04: ' +
            'קוד אחד ב-core מתרגם את כל הפורמטים לטקסט אנושי.',
        },
        {
          kind: 'p',
          text:
            'היררכיית התרגום: ' +
            'קודם שגיאות ולידציה (מילון `errors` של `AddValidation`) — מציגים את הראשונה. ' +
            'אחר כך `problem.detail`, ואז `problem.title`. ' +
            'לסטטוסים מיוחדים יש הודעות קבועות: ' +
            'status 0 = שרת לא מגיב ("Cannot reach the server"), ' +
            '401 = "You need to sign in for that", ' +
            '403 = "You are not a member of this project".',
        },
        {
          kind: 'p',
          text:
            'שורה אחת קריטית: `return throwError(() => err)`. ' +
            'ה-interceptor מתרגם ולא בולע: ' +
            'הוא מציג את ה-toast ולאחר מכן זורק מחדש את השגיאה. ' +
            'הקורא (store.addProject, auth.login) עדיין מקבל exception ויכול להגיב — ' +
            'למשל, להשאיר דיאלוג פתוח.',
        },
        {
          kind: 'term',
          name: 'ProblemDetails (RFC 7807)',
          definition:
            'תקן HTTP לתגובות שגיאה בפורמט JSON אחיד: ' +
            '`{ "type": "...", "title": "...", "status": 400, "detail": "...", "errors": { ... } }`. ' +
            'מאפשר לכל קליינט (browser, mobile, CLI) לפרסר שגיאות API בצורה עקבית. ' +
            'ב-.NET `AddProblemDetails()` + `AddValidation()` מייצרים את הפורמט אוטומטית. ' +
            'ב-Angular ‏`errorInterceptor` מתרגם אותו להודעה אנושית אחת.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch11',
        file: 'client/src/app/core/api/error.interceptor.ts',
        region: 'step-11.9',
      },
    },

    /* ------------------------------------------------------------ 11.10 */
    {
      id: '11.10',
      title: 'AuthService: פקודות, לא מצב',
      blocks: [
        {
          kind: 'p',
          text:
            'יש הבדל מהותי בין קריאות declarative לפקודות imperative. ' +
            '‏`httpResource` מתאים לקריאות declarative: "תן לי את רשימת הפרויקטים תמיד". ' +
            'אבל login הוא פקודה: "עכשיו, בלחיצת כפתור, שלח POST ועשה משהו עם התוצאה". ' +
            '‏`AuthService` משתמש ב-`HttpClient` ישיר עם `firstValueFrom` — ' +
            '`await` על Observable, פשוט וברור.',
        },
        {
          kind: 'p',
          text:
            '‏`login()` שולח POST ל-`/api/auth/login`, מקבל `AuthSession` ' +
            '(שמכיל `accessToken` ו-`user`) ' +
            'ומעביר אותו ל-`tokenStore.setSession()`. ' +
            'ה-store שומר את הזהות — ה-service רק מתווך. ' +
            '‏`logout()` ניקוי מקומי בלבד: ב-ch17 נוסיף ביטול refresh token בשרת.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה AuthService ולא TokenStore ישלח את ה-POST? ' +
            'הפרדת אחריות: ‏`TokenStore` מחזיק state, ‏`AuthService` מבצע פעולות. ' +
            'store לא שולח HTTP, service לא מחזיק state — ' +
            'שניהם עושים רק דבר אחד וקל לבדוק כל אחד בנפרד.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch11',
        file: 'client/src/app/core/auth/auth.service.ts',
        region: 'step-11.11',
      },
    },

    /* ------------------------------------------------------------ 11.11 */
    {
      id: '11.11',
      title: 'דיאלוג הכניסה: הערכה משלמת שוב',
      blocks: [
        {
          kind: 'p',
          text:
            'הדיאלוג מורכב ממש מהרכיבים שבנינו ב-ch09: ' +
            '‏`TfDialog` כמעטפת, שני `TfField` לאימייל וסיסמה, ו-`TfButton` לכפתורים. ' +
            'אפס CSS חדש כמעט — רק `.dlg-actions` לסידור footer. ' +
            'שני רמזי השדות מציגים את פרטי הדמו הזרועים: ' +
            '`demo@taskforge.dev` ו-`Passw0rd!`.',
        },
        {
          kind: 'p',
          text:
            'ה-`pending` signal מנהל את מצב הכפתור בזמן המתנה לתשובת הרשת. ' +
            'ה-`catch {}` ריק בכוונה — ‏`errorInterceptor` כבר הציג toast. ' +
            'הדיאלוג פשוט נשאר פתוח כדי שהמשתמש יוכל לתקן ולנסות שוב.',
        },
        {
          kind: 'code',
          lang: 'html',
          title: 'client/src/app/features/auth/login-dialog.html',
          code: `<tf-dialog heading="Sign in" [(open)]="open">
  <tf-field label="Email" hint="Try demo@taskforge.dev">
    <input #email type="email" autocomplete="email" placeholder="you@example.com" />
  </tf-field>

  <tf-field label="Password" hint="Seeded demo password: Passw0rd!">
    <input #password type="password" autocomplete="current-password" />
  </tf-field>

  <footer class="dlg-actions">
    <button tf-button variant="ghost" type="button" (click)="open.set(false)">Cancel</button>
    <button
      tf-button
      type="button"
      [disabled]="pending()"
      (click)="submit(email.value, password.value)"
    >
      {{ pending() ? 'Signing in...' : 'Sign in' }}
    </button>
  </footer>
</tf-dialog>`,
        },
        {
          kind: 'ul',
          items: [
            '`client/src/app/features/auth/login-dialog.scss` — סגנון `.dlg-actions`: flex, justify-content end, gap ו-margin-block-start בטוקנים.',
          ],
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch11',
        file: 'client/src/app/features/auth/login-dialog.ts',
        region: 'step-11.13',
      },
    },

    /* ------------------------------------------------------------ 11.12 */
    {
      id: '11.12',
      title: 'השלד מקבל זהות',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-App shell מקבל שני רכיבים חדשים: ‏`LoginDialog` ו-`TfButton`. ' +
            '‏`loginOpen` הוא signal שמשמש כגשר לדיאלוג עם `[(open)]`. ' +
            'ה-header מציג שני מצבים בלחיצה אחת של `@if (tokenStore.user(); as user)`: ' +
            'אם המשתמש מחובר — שמו ו"Sign out"; אחרת — כפתור "Sign in".',
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

  <div class="header-actions">
    @if (tokenStore.user(); as user) {
      <span class="who">{{ user.displayName }}</span>
      <button tf-button variant="ghost" type="button" (click)="logout()">Sign out</button>
    } @else {
      <button tf-button type="button" (click)="loginOpen.set(true)">Sign in</button>
    }

    <button
      tf-button
      variant="ghost"
      type="button"
      (click)="themeSvc.toggle()"
      [attr.aria-pressed]="themeSvc.theme() === 'light'"
    >
      {{ themeSvc.theme() === 'dark' ? 'Light' : 'Dark' }} mode
    </button>
  </div>
</header>

<main class="app-main">
  <router-outlet />
</main>

<tf-login-dialog [(open)]="loginOpen" />
<tf-toast-container />`,
        },
        {
          kind: 'ul',
          items: [
            '`client/src/app/app.scss` — מגדיר `.header-actions { display: flex; align-items: center; gap: var(--sp-2); }` ו-`.who` לשם המשתמש.',
          ],
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch11',
        file: 'client/src/app/app.ts',
        region: 'step-11.14',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 11.13 */
    {
      id: '11.13',
      title: 'כתיבה אמיתית: POST ואז reload',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`addProject` הוא פקודה imperative — `HttpClient.post` עם `firstValueFrom`. ' +
            'אחרי POST מוצלח מיד `projectsResource.reload()`: ' +
            'ה-id שנוצר בשרת, ה-`openIssues` ושאר הנתונים מגיעים מהשרת — ' +
            'לא מנוחשים בקליינט.',
        },
        {
          kind: 'p',
          text:
            'השוו לגישת ch09: שם השתמשנו ב-`Math.max(...ids) + 1` לניחוש ה-id. ' +
            'זה עבד עם מוק, אבל בעולם אמיתי ה-id מחושב על ידי מסד הנתונים ' +
            '(auto-increment ב-SQLite). ' +
            'לאחר ה-reload רשימת הפרויקטים מגיעה טרייה מהשרת — ' +
            'כולל id נכון, מספר open issues מ-DB, ותאריכי יצירה.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה reload ולא לעדכן את ה-signal ידנית עם הנתונים שנשלחו? ' +
            'גישת "optimistic update" מאיצה את תחושת המהירות אבל מנחשת מה השרת יחזיר. ' +
            'ב-TaskForge, `id` הוא auto-increment ו-`openIssues` יכול להיות מחושב. ' +
            'reload מבטיח שה-UI תמיד משקף את מצב ה-DB האמיתי — ' +
            'פשוט, נכון, ולא צריך rollback logic. ' +
            'ch13 (Issues board) ילמד optimistic update עם rollback כשנצטרך.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch11',
        file: 'client/src/app/core/state/projects.store.ts',
        region: 'step-11.12',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 11.14 */
    {
      id: '11.14',
      title: '401 הופך לזרימה, לא לשגיאה',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-`create()` ב-`ProjectList` הפך לאסינכרוני עם try/catch. ' +
            'כשמשתמש לא מחובר לוחץ "New project": ' +
            'ה-POST יוצא, השרת מחזיר 401, ' +
            '‏`errorInterceptor` מציג toast "You need to sign in for that", ' +
            '‏`throwError` עושה rethrow, ה-`catch {}` ב-`create()` תופס — ' +
            'והדיאלוג נשאר פתוח.',
        },
        {
          kind: 'p',
          text:
            'עכשיו המשתמש רואה שני דיאלוגים: ה-"New project" עדיין פתוח, ' +
            'ויכול לפתוח "Sign in" ולהתחבר. ' +
            'אחרי login מוצלח — sign in dialog נסגר, toast "Welcome back!", ' +
            'והמשתמש יכול ללחוץ שוב על "Create" — הפעם עם Bearer בבקשה.',
        },
        {
          kind: 'p',
          text:
            'זו שרשרת האמון שהצגנו ב-ch05 מהצד הלקוחי: ' +
            'שרת שמחזיר 401, קליינט שתרגם אותו ל-UX, ' +
            'ומשתמש שמבין מה לעשות — בלי stack trace בקונסול.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch11',
        file: 'client/src/app/features/projects/project-list.ts',
        region: 'step-11.15',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 11.15 */
    {
      id: '11.15',
      title: 'הטסט מקבל רשת מזויפת',
      blocks: [
        {
          kind: 'p',
          text:
            'כש-`ProjectsStore` משתמש ב-`httpResource`, ' +
            'ה-`TestBed` צריך `provideHttpClient()`. ' +
            'אבל טסט יחידה לא צריך לפנות לשרת אמיתי — ' +
            'ה-`provideHttpClientTesting()` מחליף את ה-backend האמיתי ב-`HttpTestingController`: ' +
            'mock שמאפשר לבדוק שהבקשות נשלחות ולהחזיר תגובות מדויקות.',
        },
        {
          kind: 'p',
          text:
            'שתי האסרציות הקיימות ממשיכות לעבור ללא שינוי: ' +
            '`should create the app` ו-`should render the title and tagline from signals`. ' +
            'הן לא בודקות HTTP — הן בודקות את ה-shell. ' +
            'הוספת `provideHttpClientTesting` רק מונעת שגיאות של "no provider for HttpClient".',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'כלל אצבע: כל שירות שמשתמש ב-`HttpClient` דורש `provideHttpClient()` ב-`TestBed`. ' +
            'הוסיפו תמיד `provideHttpClientTesting()` לצידו — ' +
            'הוא מחליף את ה-backend האמיתי ומבטיח שאף טסט לא יפנה לרשת. ' +
            'טסטים שיוצאים לרשת הם slow, flaky ותלויים בסביבה — ' +
            'הם לא unit tests.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch11',
        file: 'client/src/app/app.spec.ts',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 11.16 */
    {
      id: '11.16',
      title: 'גל 2 נסגר',
      blocks: [
        {
          kind: 'p',
          text: 'שישה פרקים, תשתית שלמה:',
        },
        {
          kind: 'ul',
          items: [
            'ch06 יסודות Angular: zoneless, signals, computed, effect, bootstrap ו-DI.',
            'ch07 ארכיטקטורת קליינט: core/shared/features, רכיבים חכמים מול טיפשים, גבולות state.',
            'ch08 מערכת עיצוב: design tokens, ‏@layer, logical properties, container queries, dark mode.',
            'ch09 ערכת UI: button, field, badge, dialog, toast — projection ונגישות.',
            'ch10 ניתוב: lazy loading, guards, resolvers, URL כ-state, route input binding.',
            'ch11 HTTP ו-State: CORS, httpResource, interceptors, TokenStore, ProblemDetails מקצה לקצה.',
          ],
        },
        {
          kind: 'p',
          text:
            'להרצת ה-stack המלא: ' +
            'פתחו שני טרמינלים — ' +
            'ב-`server/TaskForge.Api/` הריצו `dotnet run`, ' +
            'ב-`client/` הריצו `pnpm start`. ' +
            'פתחו `http://localhost:4500`, לחצו "Sign in", ' +
            'הזינו `demo@taskforge.dev` / `Passw0rd!`, ' +
            'ולחצו "New project" — הפרויקט נשמר ב-SQLite ונשמר גם לאחר רענון.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch11',
        title: 'עץ הקוד אחרי פרק 11 — שני צדדים, מוצר אחד',
      },
    },

    /* ------------------------------------------------------------ 11.17 */
    {
      id: '11.17',
      title: 'לאן ממשיכים: הפיצ׳רים',
      blocks: [
        {
          kind: 'p',
          text:
            'עידן התשתית נגמר. גל 2 הניח את כל היסודות: ' +
            'ממשק עיצוב, ניתוב, HTTP, זהות, טיפול שגיאות. ' +
            'גל 3 מתחיל ב-ch12 "פיצ׳ר הפרויקטים": ' +
            'רשימה, יצירה, ניהול חברים ותפקידים ב-UI — ' +
            'הפיצ׳רים האמיתיים שמשתמשים בכל מה שבנינו.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'לאן ממשיכים',
          body:
            'גל 3 "Features — הלב" מתחיל ב-ch12 "פיצ׳ר הפרויקטים": ' +
            'רשימה, יצירה, ניהול חברים ותפקידים ב-UI. ' +
            'ב-ch13 "לוח ה-Issues": סינון, חיפוש ועדכונים אופטימיים. ' +
            'ב-ch14 "Issue ותגובות": Signal Forms לעומק עם ולידציה אסינכרונית. ' +
            'כל פיצ׳ר יבנה על ה-stack שבנינו — ולא יצטרך להמציא מחדש CORS, interceptors, ' +
            'או טיפול שגיאות.',
        },
      ],
      panel: {
        kind: 'diagram',
        caption: 'בלוקי גל 2 (תשתית) תומכים בפיצ׳רי גל 3.',
        mermaid: `flowchart TB
  subgraph Wave2["גל 2 — תשתית"]
    A["ch06 יסודות Angular"]
    B["ch07 ארכיטקטורה"]
    C["ch08 עיצוב"]
    D["ch09 UI Kit"]
    E["ch10 ניתוב"]
    F["ch11 HTTP + State"]
  end

  subgraph Wave3["גל 3 — פיצ׳רים"]
    G["ch12 פרויקטים"]
    H["ch13 לוח Issues"]
    I["ch14 Issue + תגובות"]
  end

  Wave2 --> Wave3`,
      },
    },
  ],

  quiz: [
    {
      q: 'מי אוכף CORS — השרת או הדפדפן?',
      options: [
        'השרת: הוא חוסם בקשות מ-origin לא מורשה לפני שמעבד אותן',
        'שניהם: השרת חוסם ב-middleware והדפדפן חוסם בצד הלקוח',
        'הדפדפן: הוא בודק את כותרות ה-`Access-Control-Allow-Origin` ומסרב לחשוף את התשובה ל-JavaScript אם חסרות; ‏`curl` ושרת לשרת לא נחסמים כלל',
        'Node.js proxy בין הקליינט לשרת',
      ],
      answer: 2,
      explain:
        'CORS הוא מנגנון דפדפן בלבד. השרת מצהיר אמון דרך כותרות `Access-Control-Allow-Origin`, ' +
        'והדפדפן אוכף: אם הכותרות חסרות, הוא חוסם את חשיפת התשובה ל-JavaScript. ' +
        '`curl`, Postman, שרת לשרת — לא עוברים דרך דפדפן ולא מוגבלים על ידי CORS.',
    },
    {
      q: 'ב-`provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))` — באיזה סדר עוברת הבקשה ובאיזה סדר עוברת התשובה?',
      options: [
        'בקשה: error ואז auth; תשובה: auth ואז error',
        'בקשה ותשובה שתיהן: auth ואז error',
        'בקשה: auth ואז error (שמאל לימין); תשובה: error ואז auth (ימין לשמאל)',
        'הסדר לא קובע — כל interceptor עצמאי',
      ],
      answer: 2,
      explain:
        'הסדר ב-`withInterceptors` קובע: הבקשה עוברת את ה-interceptors משמאל לימין (auth מצרף Bearer, ואז error ממתין לתשובה). ' +
        'התשובה עוברת בכיוון ההפוך (error תופס שגיאות ומציג toast, ואז auth מעביר הלאה). ' +
        'לכן auth צריך לבוא ראשון: הוא מצרף Bearer לבקשה לפני שה-errorInterceptor שולח אותה הלאה.',
    },
    {
      q: 'מתי להשתמש ב-`httpResource` ומתי ב-`HttpClient` ישיר עם `firstValueFrom`?',
      options: [
        '`httpResource` לבקשות GET; `HttpClient` לכל שאר ה-HTTP methods',
        '`httpResource` לקריאות declarative שצריכות reactive state (value/isLoading/error/reload); `HttpClient` ישיר לפקודות imperative (POST/PUT/DELETE, login, פעולות one-shot) שמופעלות בלחיצת כפתור',
        '`httpResource` לפרודקשן; `HttpClient` לפיתוח',
        '`httpResource` כשיש interceptors; `HttpClient` ישיר ללא interceptors',
      ],
      answer: 1,
      explain:
        '`httpResource` מתאים למצב declarative: "תן לי תמיד את המשאב הזה, עם reactive state". ' +
        '`HttpClient` ישיר עם `await firstValueFrom` מתאים לפקודות imperative: login, logout, POST, DELETE — ' +
        'פעולות שמופעלות ב-event handler ולא בשדה-מחלקה. ' +
        'ב-`ProjectsStore`: `httpResource` לקריאות, `http.post` ל-`addProject`.',
    },
    {
      q: 'מה ה-`errorInterceptor` עושה אחרי שהוא מציג את ה-toast?',
      options: [
        'בולע את השגיאה — הקורא לא מקבל exception, הכול שקט',
        'מחזיר Observable.empty() כדי לסיים את הבקשה בנחת',
        'זורק מחדש את השגיאה עם `throwError(() => err)` — הקורא (store, service) עדיין מקבל exception ויכול להגיב',
        'מחזיר null כדי שהקורא ידע שהייתה שגיאה',
      ],
      answer: 2,
      explain:
        '"מתרגמים, לא בולעים" — זו עיקרון ה-`errorInterceptor`. ' +
        'ה-toast מוצג, אבל `throwError(() => err)` גורם ל-Observable לסיים ב-error. ' +
        'הקורא (store.addProject, auth.login) מקבל את ה-exception ב-catch block ' +
        'ויכול להחליט אם לסגור דיאלוג, לאפס state, או לתת למשתמש לנסות שוב.',
    },
    {
      q: 'מאיפה מגיע ה-`id` של פרויקט חדש אחרי `addProject` — מהקליינט או מהשרת?',
      options: [
        'מהקליינט: `Math.max(...ids) + 1` — כמו ב-ch09',
        'מה-UUID שנוצר ב-Angular',
        'מהשרת: `addProject` שולח POST, מחכה לתגובה, ואז קורא `projectsResource.reload()` — הרשימה המלאה כולל ה-id האמיתי מ-SQLite מגיעה ב-GET החדש',
        'מ-localStorage שמשמר את ה-counter',
      ],
      answer: 2,
      explain:
        'ב-ch09 השתמשנו ב-`Math.max(...ids) + 1` כי לא הייתה רשת. ' +
        'ב-ch11 `addProject` שולח POST ואז מיד `projectsResource.reload()` — ' +
        'בקשת GET חדשה לשרת. ' +
        'ה-id מגיע מ-SQLite auto-increment, `openIssues` מ-DB, ' +
        'ושאר הנתונים מדויקים לחלוטין. הקליינט לא מנחש.',
    },
    {
      q: 'מה מחליף `provideHttpClientTesting()` בסביבת הטסטים?',
      options: [
        'את `provideRouter()` — כדי שהניתוב יעבוד בלי דפדפן אמיתי',
        'את ה-backend האמיתי של `HttpClient` — בקשות HTTP לא יוצאות לרשת; ניתן להחזיר תגובות מדויקות עם `HttpTestingController`',
        'את ה-`TestBed` כולו בגרסת mock',
        'את ה-zone.js ב-zoneless testing',
      ],
      answer: 1,
      explain:
        '`provideHttpClientTesting()` מחליף את ה-backend האמיתי של `HttpClient` ב-`HttpTestingController`. ' +
        'ב-test ניתן לבדוק שהבקשה נשלחה עם ה-URL הנכון, ' +
        'ולהחזיר תגובות ידנית עם `.flush(data)`. ' +
        'שום בקשת רשת אמיתית לא יוצאת — הטסטים מהירים, deterministic ולא תלויים בסביבה.',
    },
  ],

  proveIt: [
    {
      title: 'פרויקטים מגיעים מ-SQLite — הכיבוי מוכיח',
      body:
        'ודאו ששני השרתים רצים: `dotnet run` ב-`server/TaskForge.Api/` ו-`pnpm start` ב-`client/`. ' +
        'פתחו `http://localhost:4500` — שלושת הפרויקטים הזרועים (Website Redesign, ‏Mobile App, ‏Internal Tools) מוצגים. ' +
        'עצרו את שרת ה-API (Ctrl+C בטרמינל של dotnet) ורעננו את הדף.',
      expect:
        'toast אדום "Cannot reach the server — is the API running?" מוצג, ' +
        'הרשימה מתרוקנת (או נשארת stale תלוי בזמן הטעינה). ' +
        'זה מאשר שהנתונים מגיעים מה-API, לא ממוק.',
    },
    {
      title: 'יצירת פרויקט בלי להתחבר — 401 toast ודיאלוג פתוח',
      body:
        'שני השרתים רצים. ודאו שאינכם מחוברים (אין שם משתמש בכותרת). ' +
        'לחצו "New project", הזינו שם, לחצו "Create".',
      expect:
        'toast "You need to sign in for that" מוצג; ' +
        'דיאלוג "New project" נשאר פתוח (לא נסגר); ' +
        'אין פרויקט חדש ברשימה.',
    },
    {
      title: 'Login עם הפרטים הזרועים — toast הצלחה ושם בכותרת',
      body:
        'לחצו "Sign in" בכותרת. הזינו `demo@taskforge.dev` / `Passw0rd!` ולחצו "Sign in".',
      expect:
        'toast ירוק "Welcome back!" מוצג; ' +
        'דיאלוג ה-Sign in נסגר; ' +
        'ה-header מציג "Demo User" (שם המשתמש הזרוע) וכפתור "Sign out".',
    },
    {
      title: 'יצירת פרויקט אחרי login — id מהשרת',
      body:
        'לאחר כניסה, לחצו "New project", הזינו שם ייחודי ולחצו "Create". ' +
        'פתחו DevTools ועברו לNetwork tab לבדוק את תגובת ה-POST.',
      expect:
        'toast ירוק "Project \\"[שם]\\" created" מוצג; ' +
        'כרטיס חדש מופיע ברשימה; ' +
        'בDevTools תגובת ה-POST מכילה `"id"` עם ערך מספרי שנקבע על ידי SQLite (לא 1, 2, 3 — תלוי כמה פרויקטים כבר קיימים).',
    },
    {
      title: 'Authorization header רק לבקשות ל-API',
      body:
        'היכנסו עם `demo@taskforge.dev` / `Passw0rd!`. ' +
        'פתחו DevTools, Network tab. רעננו את הדף וסננו לבקשות ל-`localhost:5080`.',
      expect:
        'בקשות ל-`http://localhost:5080/api/projects` מכילות `Authorization: Bearer ...` ב-Request Headers. ' +
        'בקשות לorigin אחר (CDN, assets) לא מכילות Authorization header.',
    },
  ],

  exercise: {
    prompt:
      'הציגו מצב טעינה ב-UI: השתמשו ב-`store.loading()` לרנדר שורת skeleton/spinner ב-`project-list` ' +
      'בזמן שה-GET הראשון בטיסה, וב-`store.loadError()` לרנדר כפתור "נסה שוב" שקורא ל-`store.reload()` חדש. ' +
      'ה-`reload()` הוא מתודה שתחשפו דרך ה-store boundary.',
    tasks: [
      'הוסיפו ב-`ProjectsStore` מתודה ציבורית `reload(): void` שקוראת ל-`this.projectsResource.reload()`.',
      'ב-`project-list.html` הוסיפו `@if (store.loading()) { ... }` עם אלמנט skeleton (div עם class `.skeleton-row`) לפני הרשימה.',
      'הוסיפו `@if (store.loadError()) { ... }` עם כפתור "נסה שוב" שקורא ל-`store.reload()`.',
      'כדי לראות את הskeleton, פתחו DevTools, Network tab, הגדירו throttling ל-"Slow 4G" ורעננו.',
      'הריצו `pnpm test` ו-`pnpm build` ווודאו שהכל עובר.',
    ],
    acceptance: [
      'ב-Slow 4G throttling מוצגת שורת skeleton בזמן שה-GET בטיסה — ונעלמת כשהנתונים מגיעים.',
      'עצרו את ה-API ורעננו: `loadError()` מוחזר, כפתור "נסה שוב" מוצג; לחיצה עליו שולחת GET נוסף ומציגה toast שגיאה שוב.',
      '`store.reload()` חשוף ועוטף את `projectsResource.reload()` — רכיבים לא נוגעים ב-resource ישירות.',
      'כל הטסטים הקיימים ממשיכים לעבור; ‏`pnpm build` מסתיים ללא שגיאות.',
    ],
  },
};
