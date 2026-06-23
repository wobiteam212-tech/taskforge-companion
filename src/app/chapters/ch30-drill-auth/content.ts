import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 30 — Auth Flow ו-withCredentials (Interview Drill T4).
 * Wave 7 interview drill. Covers the full auth flow end-to-end:
 * two carriers (Bearer header / Cookie), withCredentials deep-dive,
 * 401->refresh->retry interceptor with single in-flight (no stampede),
 * Bearer-vs-Cookie trade-offs, CORS-with-credentials rules, token
 * over WebSocket (ch24 pattern). Live demo: auth-flow.demo (simulated).
 * Source of truth: context/craft-upgrade/interview-drills/ch30-auth.md.
 */
export const CH30_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 30.1 */
    {
      id: '30.1',
      title: 'המודל המנטלי: שני נשאים',
      blocks: [
        {
          kind: 'p',
          text:
            'Auth = להוכיח זהות פעם אחת, ואז לשאת את ההוכחה בכל בקשה. ' +
            'יש שני נשאים (carriers) לאותה הוכחה, וזה ההבדל שכל שאלת ראיון מתחילה ממנו.',
        },
        {
          kind: 'ul',
          items: [
            'Bearer token ב-header `Authorization` — JavaScript קורא אותו, אתה מצרף ב-interceptor. זה מה ש-TaskForge עושה.',
            'Cookie שהדפדפן מצרף לבד — `HttpOnly` (בטוח מ-XSS), אבל cross-origin דורש `withCredentials: true`, ו-CORS-credentials, ו-הגנה מ-CSRF.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה שני נשאים ולא אחד?',
          body:
            'כל נשא מגן מפני סוג שונה של מתקפה. Bearer token פשוט לניהול אבל JS יכול לקרוא אותו. ' +
            'Cookie HttpOnly מגן מ-XSS אבל פגיע ל-CSRF. ' +
            'אין פתרון חינם — כל ארכיטקטורה בוחרת איזה סיכון יותר קל לה לנהל.',
        },
        {
          kind: 'term',
          name: 'Bearer token',
          definition:
            'טוקן (בדרך כלל JWT) שהלקוח שומר בעצמו ומצרף ב-header של כל בקשה: `Authorization: Bearer <token>`. ' +
            'JavaScript קורא אותו בחופשיות — נוח לניהול, אבל חשוף ל-XSS אם הטוקן שמור ב-`localStorage`.',
        },
        {
          kind: 'term',
          name: 'withCredentials',
          definition:
            'דגל על `HttpClient` / XHR שאומר לדפדפן לשלוח cookies בבקשות cross-origin ולקבל `Set-Cookie` בחזרה. ' +
            'ברירת המחדל בבקשות cross-origin: הדפדפן זורק את כל ה-cookies. ' +
            '`withCredentials: true` מוריד את ברירת המחדל הזו, אבל דורש תגובה מתאימה מהשרת.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () => import('./demos/auth-flow.demo').then((m) => m.AuthFlowDemo),
        caption:
          'הדמו: טוגל Bearer header / Cookie + withCredentials — login, call API, expire token, ראה 401 ואז refresh ואז retry',
      },
    },

    /* ------------------------------------------------------------ 30.2 */
    {
      id: '30.2',
      title: 'הזרימה המלאה — תאמר בסדר הזה',
      blocks: [
        {
          kind: 'p',
          text:
            'שאלת ראיון קלאסית: "תאר את זרימת ה-auth מהלחיצה על Login ועד לתשובה המאובטחת." ' +
            'חשוב לדעת לענות בסדר הנכון — שמונה שלבים:',
        },
        {
          kind: 'ol',
          items: [
            'login — `POST /api/auth/login { email, password }`.',
            'השרת מאמת סיסמה (PBKDF2) ובונה claims.',
            'השרת מנפיק access token (קצר, בערך 15 דקות) ו-refresh token (ארוך, מסתובב/rotated).',
            'הקליינט שומר את ההוכחה (Bearer: בזיכרון או localStorage; Cookie: הדפדפן שומר `HttpOnly`).',
            'כל בקשה נושאת את ההוכחה (header או cookie).',
            'השרת מאמת חתימה, תוקף, וclaims.',
            'תוקף פג: `401` — הקליינט מרענן בשקט (`/auth/refresh`) וחוזר על הבקשה המקורית.',
            'מאומת אבל לא מורשה (למשל: לא חבר בפרויקט): `403` — בדיקת resource, לא "מי אתה".',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: '401 מול 403 — מה ההבדל?',
          body:
            '401 Unauthorized = לא מאומת: אין טוקן, הטוקן פג, או החתימה לא תקינה. ' +
            'הפעולה הנכונה: רענן טוקן או הפנה ל-login. ' +
            '403 Forbidden = מאומת אבל לא מורשה למשאב הזה: יש טוקן תקין, אבל המשתמש אינו חבר בפרויקט. ' +
            'הפעולה הנכונה: הצג הודעת "אין הרשאה", אל תנסה לרענן טוקן.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `sequenceDiagram
  participant C as Client
  participant S as Server
  C->>S: POST /api/auth/login
  S-->>C: 200 accessToken (15m) + refreshToken (7d)
  C->>S: GET /api/resource [Bearer token]
  alt token valid
    S-->>C: 200 data
  else token expired
    S-->>C: 401 Unauthorized
    C->>S: POST /api/auth/refresh
    S-->>C: 200 new accessToken + rotated refreshToken
    C->>S: GET /api/resource (retry)
    S-->>C: 200 data
  end
  note over S: 403 if authenticated but not a member`,
        caption: 'זרימת auth מלאה: login, request, 401 + refresh + retry, ענף 403',
      },
    },

    /* ------------------------------------------------------------ 30.3 */
    {
      id: '30.3',
      title: 'שלב 1–3: login ויצירת tokens',
      blocks: [
        {
          kind: 'p',
          text:
            'הסימולטור מממש את שלושת השלבים הראשונים. ' +
            'שלח `POST /api/auth/login` עם `{ email, password }` וראה את תגובת השרת: ' +
            'ב-Bearer mode — גוף ה-JSON נושא `accessToken` ו-`refreshToken`; ' +
            'ב-Cookie mode — `Set-Cookie: access=...; HttpOnly; SameSite=None; Secure` בheader.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'refresh token rotation',
          body:
            'בכל קריאה ל-`/auth/refresh` השרת מנפיק refresh token חדש ומבטל את הישן. ' +
            'זה מונע שימוש חוזר בטוקן שנגנב: אם תוקפן ניסה להשתמש בו, הגיתמה תזהה שהוא בטל ותבטל את כל ה-session. ' +
            'TaskForge מממש rotation מפרק 05.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'localStorage חשוף ל-XSS',
          body:
            'Bearer token ב-`localStorage` נגיש לכל JavaScript באותו origin — כולל סקריפט זדוני שהוזרק דרך XSS. ' +
            'אלטרנטיבה: שמור ב-`sessionStorage` (לא שורד refresh) או ב-memory בלבד (לא שורד navigation). ' +
            'בשתי האפשרויות שומרים refresh token ב-`HttpOnly` cookie ו-access token בזיכרון.',
        },
      ],
      panel: {
        kind: 'simulator',
        scenario: {
          title: 'POST /api/auth/login',
          blurb: 'שלב 1 בזרימה: login ויצירת tokens.',
          requests: [
            {
              method: 'POST',
              path: '/api/auth/login',
              body: '{ "email": "demo@taskforge.dev", "password": "Passw0rd!" }',
              note: 'credentials בגוף הבקשה',
            },
          ],
          responses: [
            {
              status: 200,
              title: 'tokens הונפקו',
              body: '{ "accessToken": "eyJ...", "refreshToken": "dGZy...", "expiresIn": 900 }',
            },
          ],
          insight:
            'השרת מאמת PBKDF2, בונה JWT עם claims (userId, email, role), ומחזיר שני tokens. ' +
            'accessToken חי ~15 דקות; refreshToken חי ~7 ימים ומסתובב בכל שימוש.',
        },
      },
    },

    /* ------------------------------------------------------------ 30.4 */
    {
      id: '30.4',
      title: '`withCredentials` — הצלילה',
      blocks: [
        {
          kind: 'p',
          text:
            'זה הנושא שנתקעים עליו בראיון. ללא `withCredentials`, כל בקשת XHR / Fetch cross-origin ' +
            'לא שולחת cookies בכלל ולא מקבלת `Set-Cookie` חזרה. ' +
            'הדפדפן מסתיר אותם כהגנת אבטחה ברירת מחדל.',
        },
        {
          kind: 'p',
          text:
            '`http.get(url, { withCredentials: true })` (או בinterceptor) מורה לדפדפן: ' +
            '"אני מסכים שהבקשה הזאת תישא cookies (ו-TLS client certificates) גם cross-origin, ואני מוכן לקבל Set-Cookie בחזרה." ' +
            'בלי זה — בקשה cross-origin לעולם לא תראה את ה-cookie.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'שלושה תנאים שחייבים להתקיים יחד ב-cookie mode',
          body: [
            'קליינט: `withCredentials: true` על הבקשה (או ב-interceptor).',
            'שרת CORS: `AllowCredentials()` וגם origin מפורש (`WithOrigins("http://localhost:4500")`) — אסור `AllowAnyOrigin` יחד עם `AllowCredentials`.',
            'ה-cookie: `SameSite=None; Secure; HttpOnly` — בלעדיהם הדפדפן לא שולח אותו cross-site.',
          ],
        },
        {
          kind: 'term',
          name: 'refresh token rotation',
          definition:
            'בכל קריאה ל-`/auth/refresh` השרת מנפיק refresh token חדש ומבטל את הישן. ' +
            'אם token שנגנב משמש לרענון, השרת מזהה שהissuance chain נשבר ומבטל את כל ה-session. ' +
            'TaskForge מממש rotation מפרק 05.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'typescript',
        code: `// Angular — withCredentials ב-interceptor
export const cookieAuthInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};

// Bearer mode: לא צריך withCredentials — מצרף header ידנית
export const bearerAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { Authorization: \`Bearer \${token}\` } }));
};`,
        file: 'interceptor: withCredentials vs Bearer header',
      },
    },

    /* ------------------------------------------------------------ 30.5 */
    {
      id: '30.5',
      title: 'CORS עם credentials — הכלל שאסור לשכוח',
      blocks: [
        {
          kind: 'p',
          text:
            'כאשר הקליינט שולח `withCredentials: true`, הדפדפן בודק שתי כותרות בתגובת השרת. ' +
            'אם אחת מהן חסרה או שגויה — הדפדפן חוסם את התגובה, לא הבקשה עצמה.',
        },
        {
          kind: 'ul',
          items: [
            '`Access-Control-Allow-Origin` חייב להיות origin מפורש, לא `*`. הדפדפן דוחה wildcard כשיש credentials.',
            '`Access-Control-Allow-Credentials: true` חייב להיות בתגובה.',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה אסור `AllowCredentials` יחד עם `AllowAnyOrigin`?',
          body:
            'תקן ה-CORS אוסר את השילוב הזה: credentials עם wildcard origin משמעו שכל אתר ברשת יכול לשלוח cookies של המשתמש לשרת שלך. ' +
            'הדפדפן אוכף את האיסור — הוא חוסם תגובה עם `*` כשהבקשה נשלחה עם `withCredentials`. ' +
            'ASP.NET Core מחיל את הבדיקה גם בצד השרת: `AllowAnyOrigin().AllowCredentials()` זורק `InvalidOperationException` בעלייה.',
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: 'cookie SameSite=None דורש Secure',
          body:
            'ב-2020 כרום שינה את ברירת המחדל: cookie ללא `SameSite` מקבל `SameSite=Lax` אוטומטית. ' +
            'ל-cross-site cookies חייב `SameSite=None`, אבל זה מחייב גם `Secure` — כלומר HTTPS בלבד. ' +
            'בפיתוח local: `localhost` מקבל פטור, אבל staging/production חייבים TLS.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'csharp',
        code: `// ASP.NET Core — CORS עם credentials (ב-Program.cs)
builder.Services.AddCors(o => o.AddPolicy("client", p => p
    .WithOrigins("http://localhost:4500")   // מפורש — חובה עם credentials
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()));                  // אסור עם AllowAnyOrigin

// cookie שה-API מנפיק ב-cookie mode:
// Set-Cookie: access=...; HttpOnly; SameSite=None; Secure`,
        file: 'Program.cs — CORS עם credentials',
      },
    },

    /* ------------------------------------------------------------ 30.6 */
    {
      id: '30.6',
      title: 'Bearer מול Cookie — הטבלה שמסכמת הכל',
      blocks: [
        {
          kind: 'p',
          text:
            'ראיונות אוהבים "בחר וסנגר". התשובה הנכונה אינה "Bearer תמיד טוב יותר" — ' +
            'זו הבחנה של trade-offs. TaskForge בחר Bearer מסיבות ספציפיות שחשוב להסביר.',
        },
        {
          kind: 'callout',
          tone: 'alt',
          title: 'Bearer (header) מול Cookie (HttpOnly) — trade-offs',
          body: [
            'Bearer: מי מצרף — אתה, ב-interceptor. XSS — JS קורא את הטוקן, חשוף אם שמור ב-localStorage. CSRF — חסין (הדפדפן לא שולח header אוטומטית). cross-origin — עובד תמיד. הגדרה — פשוט (מה ש-TaskForge בחר).',
            'Cookie HttpOnly: מי מצרף — הדפדפן, אוטומטית. XSS — JS לא יכול לקרוא, בטוח יותר. CSRF — חשוף (cookie נשלח אוטומטית), צריך anti-forgery token. cross-origin — דורש withCredentials + CORS-credentials. הגדרה — יותר תצורה (CORS + SameSite + anti-CSRF).',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'ל-SPA ו-API נפרדים — מה תבחר?',
          body:
            'ל-SPA עם API נפרד (כמו TaskForge): Bearer פשוט — אין CORS-credentials ואין CSRF. ' +
            'המחיר: אם שומרים ב-localStorage, XSS יחשוף את הטוקן. ' +
            'פשרה טובה: access token בזיכרון בלבד (אובד ב-refresh), refresh token ב-HttpOnly cookie. ' +
            'ל-SSR או לאתר שאינו SPA: cookie HttpOnly עדיף — הדפדפן מנהל את הכל.',
        },
        {
          kind: 'term',
          name: 'CSRF (Cross-Site Request Forgery)',
          definition:
            'מתקפה שבה אתר זדוני גורם לדפדפן המשתמש לשלוח בקשה לשרת שלך (עם cookies שלו). ' +
            'הגנה נפוצה: anti-forgery token — ערך סודי שנשלח ב-header נוסף שאתר אחר לא יכול לקרוא. ' +
            'Bearer tokens חסינים מ-CSRF כי הדפדפן לא שולח Authorization header אוטומטית.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `graph LR
  A[Bearer header] --> B[JS מצרף ב-interceptor]
  A --> C[חסין CSRF]
  A --> D[JS קורא הטוקן - חשוף ל-XSS]
  E[Cookie HttpOnly] --> F[דפדפן מצרף אוטומטית]
  E --> G[JS לא קורא - בטוח מ-XSS]
  E --> H[חשוף CSRF - צריך anti-forgery]
  E --> I[cross-origin: withCredentials + CORS]`,
        caption: 'Bearer header מול Cookie HttpOnly — כל נשא עם היתרונות והחסרונות שלו',
      },
    },

    /* ------------------------------------------------------------ 30.7 */
    {
      id: '30.7',
      title: '401 פג, refresh, retry: האינטרספטור',
      blocks: [
        {
          kind: 'p',
          text:
            'כאשר access token פג, השרת מחזיר 401. ' +
            'המשתמש לא אמור לראות זאת — ה-interceptor תופס את ה-401, מרענן בשקט, וחוזר על הבקשה המקורית. ' +
            'המשתמש רואה רק עיכוב קל.',
        },
        {
          kind: 'p',
          text:
            '`catchError` על 401 מפעיל `auth.refresh()`. ' +
            'בהצלחה: `switchMap` לניסיון-חוזר של הבקשה המקורית עם הטוקן החדש — `cloned` + token חדש. ' +
            'כישלון ברענון (refresh token פג גם הוא): `throwError` ו-redirect ל-login.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'loop אינסופי: אל תרענן על כישלון של /auth/refresh עצמו',
          body:
            'אם `POST /api/auth/refresh` עצמו מחזיר 401, אסור לנסות לרענן שוב — זה לולאה אינסופית. ' +
            'הבדיקה: `if (err.status !== 401 || req.url.includes(\'/auth/refresh\')) return throwError(() => err)`. ' +
            'בקשת הרענון מוחרגת מה-retry logic.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'typescript',
        code: `import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, shareReplay, finalize, throwError } from 'rxjs';
import { Observable } from 'rxjs';

let refresh$: Observable<string> | null = null;

export const authRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  return next(addToken(req, auth.token())).pipe(
    catchError((err: HttpErrorResponse) => {
      // אל תרענן על בקשות שאינן 401, ואל תרענן על /auth/refresh עצמו
      if (err.status !== 401 || req.url.includes('/auth/refresh'))
        return throwError(() => err);

      // רענון יחיד בתעופה — N בקשות עם 401 מחכות לאותו refresh$
      refresh$ ??= auth.refresh().pipe(
        shareReplay(1),
        finalize(() => (refresh$ = null)),
      );
      // switchMap: כשהרענון הסתיים, חזור על הבקשה המקורית עם הטוקן החדש
      return refresh$.pipe(switchMap(token => next(addToken(req, token))));
    }),
  );
};`,
        file: 'auth-refresh.interceptor.ts',
      },
    },

    /* ------------------------------------------------------------ 30.8 */
    {
      id: '30.8',
      title: 'refresh stampede — N בקשות, רענון אחד',
      blocks: [
        {
          kind: 'p',
          text:
            'דמיין שב-SPA יש חמש בקשות שיוצאות בו-זמנית, וכולן מחזירות 401. ' +
            'ללא מנגנון מיוחד, כל אחת מהן תנסה לרענן — חמישה `POST /auth/refresh` במקביל. ' +
            'חלקם ייכשלו (refresh token כבר הסתובב אחרי השימוש הראשון), ו-session ייהרס.',
        },
        {
          kind: 'p',
          text:
            'הפתרון: `refresh$` משותף. המשתנה הגלובלי `refresh$` מאחסן את ה-Observable של הרענון. ' +
            'הבקשה הראשונה שפוגעת ב-401 יוצרת אותו עם `shareReplay(1)`. ' +
            'שאר הבקשות מוצאות `refresh$` קיים ומחכות לאותו Observable — רענון אחד בלבד. ' +
            '`finalize` מאפס ל-`null` כשהרענון הסתיים.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה `shareReplay(1)` עושה ב-refresh$?',
          body:
            '`shareReplay(1)` הופך Observable "קר" (שמייצר עבודה בכל subscribe) ל-"חם": ' +
            'הוא שומר את הפלט האחרון ב-cache ומשתף אותו עם כל ה-subscribers. ' +
            'כך חמישה `catchError` שמבצעים `refresh$.pipe(switchMap(...))` יקבלו כולם את אותו טוקן מאותו POST, ' +
            'בלי חמישה POSTs. `finalize` מנקה את ה-cache אחרי שהרענון הסתיים.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'הדמו מדגים את הנתיב הזה',
          body:
            'בדמו: לחץ login, ואז expire token, ואז call API. ' +
            'תראה בלוג: `GET ... [Bearer ...]` — `401 Unauthorized` — `interceptor catches 401` — ' +
            '`POST /api/auth/refresh` — `200 new access + rotated refresh` — `switchMap retries` — `GET (retry)` — `200`.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `sequenceDiagram
  participant B1 as בקשה 1
  participant B2 as בקשה 2
  participant I as Interceptor
  participant S as Server

  B1->>S: GET /resource (token פג)
  B2->>S: GET /other (token פג)
  S-->>B1: 401
  S-->>B2: 401
  Note over I: B1 מייצרת refresh$ עם shareReplay(1)
  Note over I: B2 ממתינה לאותו refresh$
  I->>S: POST /auth/refresh (פעם אחת בלבד)
  S-->>I: 200 new token
  I-->>B1: retry עם token חדש
  I-->>B2: retry עם token חדש`,
        caption: 'refresh$ משותף: N בקשות עם 401, רענון אחד, כולן ממתינות ומקבלות את אותו token',
      },
    },

    /* ------------------------------------------------------------ 30.9 */
    {
      id: '30.9',
      title: 'הדמו החי: לצפות בזרימה',
      blocks: [
        {
          kind: 'p',
          text:
            'הדמו מממש את הזרימה המלאה — אנימציה מדומה ללא רשת אמיתית. ' +
            'ניתן לראות כל שלב בלוג: הבקשה, ה-401, ה-intercept, ה-refresh, והretry.',
        },
        {
          kind: 'ol',
          items: [
            'לחץ "login" — ראה `POST /api/auth/login` ואת התגובה (Bearer mode: JSON עם tokens; Cookie mode: `Set-Cookie` HttpOnly).',
            'לחץ "call API" — ראה `GET /api/projects/1/issues` ו-`200`.',
            'לחץ "expire token" — גורם ל-access token "לפוג".',
            'לחץ שוב "call API" — ראה את הזרימה המלאה: `401`, interceptor, `POST /auth/refresh`, `200 (rotated)`, retry, `200`.',
            'החלף ל-Cookie mode עם הטוגל — ראה איך ה-config משתנה: `withCredentials: true`, `AllowCredentials()`, לא `AllowAnyOrigin`.',
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'pills ב-demo',
          body:
            'הדמו מציג pills שמראים את מצב ה-session: האם מחובר, האם הטוקן פג, ואיזה carrier בשימוש. ' +
            'ה-pills מסייעים להבין את ה-state לפני כל לחיצה.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () => import('./demos/auth-flow.demo').then((m) => m.AuthFlowDemo),
        caption:
          'Bearer / Cookie טוגל: login, call API, expire, call API שוב — צפה בזרימה המלאה',
      },
    },

    /* ------------------------------------------------------------ 30.10 */
    {
      id: '30.10',
      title: 'Token over WebSocket — פרק 24',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-SignalR (פרק 24) יש בעיה ייחודית: הדפדפן לא יכול לשלוח `Authorization` header ב-WebSocket handshake. ' +
            'ה-WebSocket API של הדפדפן לא חושף API לכותרות. ' +
            'הפתרון: `accessTokenFactory` של `@microsoft/signalr` שולח את הטוקן ב-query string.',
        },
        {
          kind: 'p',
          text:
            'בצד השרת: `OnMessageReceived` ב-`Program.cs` מרים את הטוקן מה-query string — ' +
            'אבל רק לנתיבים שמתחילים ב-`/hubs`. ' +
            'הסינן קריטי: לא רוצים שטוקן ב-URL ייחשב כהאמנה על בקשות REST רגילות.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'איך טוקן מגיע ל-WebSocket, ולמה לא ב-header?',
          body:
            'הדפדפן לא מאפשר ל-JavaScript לקבוע כותרות על ה-WebSocket handshake. ' +
            '`new WebSocket(url)` מקבל רק URL — ב-HTTP upgrade request הדפדפן שולח כותרות ברירת מחדל בלבד. ' +
            'לכן `accessTokenFactory` ב-`@microsoft/signalr` שם את הטוקן ב-query string: `?access_token=<jwt>`. ' +
            'השרת קורא אותו ב-`OnMessageReceived` ורק לנתיבי `/hubs`.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'typescript',
        code: `// SignalR / WebSocket — אי אפשר header, אז הטוקן ב-query string
import { HubConnectionBuilder } from '@microsoft/signalr';

const connection = new HubConnectionBuilder()
  .withUrl(\`\${HUB_BASE}/board\`, {
    // accessTokenFactory נקרא בכל handshake ובכל reconnect
    accessTokenFactory: () => this.tokenStore.accessToken() ?? '',
  })
  .withAutomaticReconnect()
  .build();

// השרת קורא את הטוקן ב-OnMessageReceived (Program.cs):
// options.Events = new JwtBearerEvents {
//   OnMessageReceived = context => {
//     var token = context.Request.Query["access_token"];
//     var path = context.HttpContext.Request.Path;
//     if (!string.IsNullOrEmpty(token) && path.StartsWithSegments("/hubs"))
//       context.Token = token;
//     return Task.CompletedTask;
//   }
// };`,
        file: 'board-connection.ts + Program.cs (ch24)',
      },
    },

    /* ------------------------------------------------------------ 30.11 */
    {
      id: '30.11',
      title: 'שאלות ראיון: carrier ו-withCredentials',
      blocks: [
        {
          kind: 'callout',
          tone: 'interview',
          title: 'Cookie מול Bearer — בחר והגן',
          body:
            'ל-SPA עם API נפרד (כמו TaskForge): Bearer פשוט — אין CORS-credentials ואין CSRF. ' +
            'המחיר: XSS חושף את הטוקן אם הוא שמור ב-localStorage. ' +
            'הפשרה הטובה: access token בזיכרון, refresh token ב-HttpOnly cookie. ' +
            'Cookie HttpOnly בטוח מ-XSS אבל דורש withCredentials + CORS-credentials + anti-CSRF.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה בדיוק `withCredentials` עושה?',
          body:
            'מורה לדפדפן לצרף cookies (ו-TLS client certificates) לבקשות cross-origin ולקבל `Set-Cookie` חזרה. ' +
            'ברירת המחדל של cross-origin XHR / Fetch: לא לשלוח cookies בכלל. ' +
            '`withCredentials: true` מוריד את ברירת המחדל — אבל דורש גם `AllowCredentials()` + origin מפורש בשרת.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'איפה שומרים טוקן ומה ה-trade-off?',
          body:
            'localStorage: נוח, שורד רענון דף, אבל כל XSS ב-origin שלך קורא אותו. ' +
            'sessionStorage: לא שורד רענון. ' +
            'זיכרון (signal/variable): הכי בטוח מ-XSS, אבל אובד ברענון דף — לכן משלבים: access token בזיכרון, refresh token ב-HttpOnly cookie. ' +
            'HttpOnly cookie: JS לא קורא, אבל חשוף ל-CSRF. אין חינם.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'תאר silent refresh ואיך מונעים stampede',
          body:
            'interceptor תופס 401, מרענן פעם אחת (shared `refresh$` עם `shareReplay(1)`), ' +
            'ושאר הבקשות שמחכות ל-401 ממתינות לאותו Observable ואז חוזרות על עצמן עם הטוקן החדש. ' +
            '`finalize` מאפס את `refresh$` ל-`null` כשנגמר — הרענון הבא ייצור Observable חדש.',
        },
      ],
      panel: {
        kind: 'simulator',
        scenario: {
          title: '401, POST /auth/refresh, ואז retry',
          blurb: 'הזרימה שאחרי פקיעת access token.',
          requests: [
            {
              method: 'GET',
              path: '/api/projects/1/issues',
              note: 'access token פג',
            },
            {
              method: 'POST',
              path: '/api/auth/refresh',
              body: '{ "refreshToken": "dGZy..." }',
              note: 'interceptor מרענן בשקט',
            },
            {
              method: 'GET',
              path: '/api/projects/1/issues',
              note: 'retry עם token חדש',
            },
          ],
          responses: [
            {
              status: 401,
              title: 'access token פג',
              body: '{ "title": "Unauthorized", "status": 401 }',
            },
            {
              status: 200,
              title: 'tokens חדשים',
              body: '{ "accessToken": "eyJ...", "refreshToken": "dGZy-rotated..." }',
            },
            {
              status: 200,
              title: 'issues page',
              body: '{ "items": [...], "totalCount": 60 }',
            },
          ],
          insight:
            'המשתמש לא ראה את ה-401 — ה-interceptor תפס אותו, ריענן, וחזר על הבקשה. ' +
            'refresh token הסתובב (rotated) — הישן בטל.',
        },
      },
    },

    /* ------------------------------------------------------------ 30.12 */
    {
      id: '30.12',
      title: 'קשרים לפרקים קודמים',
      blocks: [
        {
          kind: 'p',
          text:
            'פרק 30 מקשר ידע מכמה פרקים. ' +
            'להבין את הקשרים עוזר לענות על שאלות "איך TaskForge בנוי" בראיון:',
        },
        {
          kind: 'ul',
          items: [
            'פרק 05 (auth): PBKDF2, JWT, refresh token rotation, TokenStore — בסיס הזרימה שנלמדת כאן.',
            'פרק 11 (HTTP + interceptors): `authInterceptor` שמצרף `Authorization: Bearer` על כל בקשת API — Bearer carrier בפעולה.',
            'פרק 24 (SignalR): `accessTokenFactory` שולח token ב-query string; `OnMessageReceived` מרים אותו; CORS `AllowCredentials` — token over WebSocket.',
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'שאלת מלכודת נפוצה: AllowCredentials + AllowAnyOrigin',
          body:
            'כמעט בכל ראיון ASP.NET + Angular מופיעה שאלה על CORS-credentials. ' +
            'דע בעל פה: `AllowCredentials` עם `AllowAnyOrigin` = crash בעלייה ב-ASP.NET Core. ' +
            'הסיבה: הספציפיקציה אוסרת `*` עם credentials. ' +
            'הפתרון: `WithOrigins("http://localhost:4500")` — origin מפורש אחד.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'bearer vs cookie — היכן לראות בדמו',
          body:
            'בדמו: הטוגל בין Bearer ל-Cookie מחליף את שורת ה-config שמוצגת. ' +
            'ב-Bearer: interceptor + CORS פשוט (ללא `AllowCredentials`). ' +
            'ב-Cookie: `withCredentials: true` + `AllowCredentials()` + "not AllowAnyOrigin" + `SameSite=None; Secure; HttpOnly`.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'csharp',
        code: `// Program.cs — פרק 24 + פרק 30 ביחד
// CORS שמאפשר גם REST וגם SignalR עם credentials:
builder.Services.AddCors(o => o.AddPolicy("client", p => p
    .WithOrigins("http://localhost:4500")   // origin מפורש (חובה)
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()));                  // לSignalR negotiate + cookie mode

// JWT: הרמת token מ-query string לנתיבי /hubs בלבד (פרק 24)
options.Events = new JwtBearerEvents {
  OnMessageReceived = context => {
    var token = context.Request.Query["access_token"];
    var path  = context.HttpContext.Request.Path;
    if (!string.IsNullOrEmpty(token) && path.StartsWithSegments("/hubs"))
      context.Token = token;
    return Task.CompletedTask;
  }
};`,
        file: 'Program.cs — CORS + JWT over WebSocket (ch24 pattern)',
      },
    },
  ],

  quiz: [
    {
      q: 'מה בדיוק `withCredentials: true` מורה לדפדפן לעשות?',
      options: [
        'לשלוח `Authorization` header אוטומטית',
        'לצרף cookies לבקשות cross-origin ולקבל `Set-Cookie` חזרה',
        'להצפין את גוף הבקשה',
        'לדלג על preflight בCORS',
      ],
      answer: 1,
      explain:
        'ברירת המחדל של XHR/Fetch cross-origin: הדפדפן לא שולח cookies ולא מקבל Set-Cookie. ' +
        '`withCredentials: true` מוריד את ברירת המחדל הזו. ' +
        'אבל נדרשת גם תגובה מתאימה מהשרת: `Access-Control-Allow-Credentials: true` ו-origin מפורש (לא `*`).',
    },
    {
      q: 'מה קורה אם משלבים `AllowCredentials()` עם `AllowAnyOrigin()` ב-ASP.NET Core?',
      options: [
        'הכל עובד, אבל הדפדפן עשוי לחסום בצד הלקוח',
        'ASP.NET Core זורק `InvalidOperationException` בעלייה',
        'הדפדפן מדלג על הבדיקה',
        'ה-CORS headers לא נשלחים',
      ],
      answer: 1,
      explain:
        'ASP.NET Core מאכף את תקן ה-CORS: credentials עם wildcard origin אסורים. ' +
        'ה-validation מתבצע ב-startup — `InvalidOperationException` נזרקת לפני שהשרת מקבל בקשות. ' +
        'הפתרון: `WithOrigins("http://localhost:4500")` — origin מפורש.',
    },
    {
      q: 'מדוע bearer access token ב-localStorage חשוף יותר מ-cookie HttpOnly?',
      options: [
        'כי localStorage נשלח אוטומטית בכל בקשה',
        'כי JavaScript יכול לקרוא מ-localStorage, ולכן XSS שהוזרק ל-origin שלך יכול לגנוב אותו',
        'כי localStorage לא מוצפן',
        'כי localStorage שורד redirect',
      ],
      answer: 1,
      explain:
        '`localStorage` נגיש לכל JavaScript שרץ ב-origin שלך — כולל קוד זדוני שהוזרק דרך XSS. ' +
        'cookie `HttpOnly` אסור לקריאה ל-JS בכלל — הדפדפן שומר אותו ומצרף אותו לבקשות, אבל `document.cookie` לא יחזיר אותו. ' +
        'לכן cookie HttpOnly בטוח יותר מ-XSS, אבל חשוף ל-CSRF.',
    },
    {
      q: 'מה מטרת המשתנה `refresh$` האינטרספטור, ואיך הוא מונע stampede?',
      options: [
        'הוא שומר את הטוקן בזיכרון',
        'הוא מאחסן את ה-Observable של הרענון כך שN בקשות עם 401 ממתינות לאותו POST אחד ולא שולחות N POSTs',
        'הוא מבטל בקשות כפולות',
        'הוא מקבץ שגיאות 401',
      ],
      answer: 1,
      explain:
        '`refresh$` מחזיק Observable אחד של ה-refresh עם `shareReplay(1)`. ' +
        'הבקשה הראשונה שפוגעת ב-401 יוצרת אותו; שאר הבקשות מוצאות אותו קיים ומחכות. ' +
        'כולן מקבלות את אותו טוקן חדש, בלי N בקשות refresh. ' +
        '`finalize` מאפס ל-`null` כשנגמר.',
    },
    {
      q: 'למה הדפדפן לא יכול לשלוח `Authorization` header ב-WebSocket handshake?',
      options: [
        'כי WebSocket לא תומך בכותרות HTTP',
        'כי ה-WebSocket JavaScript API לא מאפשר הגדרת כותרות על ה-handshake — הדפדפן שולח רק כותרות ברירת מחדל',
        'כי האמנה JWT לא עובדת מעל WebSocket',
        'כי CORS חוסם כותרות ב-WebSocket',
      ],
      answer: 1,
      explain:
        '`new WebSocket(url)` מקבל URL בלבד — אין פרמטר לכותרות. ' +
        'ה-upgrade request נשלח על ידי הדפדפן עם כותרות ברירת המחדל שלו. ' +
        'הפתרון: `accessTokenFactory` ב-`@microsoft/signalr` שולח `?access_token=<jwt>` ב-query string. ' +
        'השרת קורא אותו ב-`OnMessageReceived` רק לנתיבי `/hubs`.',
    },
    {
      q: 'מה ההבדל בין 401 ל-403?',
      options: [
        '401 = לא מאומת (אין/פג טוקן); 403 = מאומת אבל לא מורשה למשאב',
        '401 = שגיאת שרת; 403 = שגיאת לקוח',
        '401 = session פגה; 403 = טוקן לא חתום',
        '401 = wrong password; 403 = account locked',
      ],
      answer: 0,
      explain:
        '401 Unauthorized: לא מאומת — אין טוקן, פג, או חתימה לא תקינה. הפעולה: רענן טוקן או הפנה ל-login. ' +
        '403 Forbidden: מאומת אבל אין הרשאה למשאב הספציפי — למשל, המשתמש אינו חבר בפרויקט. ' +
        'הפעולה: הצג שגיאת הרשאה, אל תנסה לרענן טוקן.',
    },
    {
      q: 'אילו שלושה תנאים חייבים להתקיים יחד כדי ש-cookie יישלח ב-cross-origin request?',
      options: [
        'withCredentials על הקליינט; AllowCredentials + WithOrigins על השרת; SameSite=None;Secure;HttpOnly על ה-cookie',
        'withCredentials על הקליינט; AllowAnyOrigin על השרת; SameSite=Strict על ה-cookie',
        'Authorization header; AllowCredentials על השרת; SameSite=Lax על ה-cookie',
        'withCredentials; AllowAnyOrigin; HttpOnly בלבד',
      ],
      answer: 0,
      explain:
        'שלושת התנאים יחד: ' +
        '(1) קליינט: `withCredentials: true` על הבקשה. ' +
        '(2) שרת: `AllowCredentials()` עם origin מפורש (`WithOrigins`), לא wildcard. ' +
        '(3) Cookie: `SameSite=None; Secure` כדי לרכוב cross-site (Secure = HTTPS); `HttpOnly` להגנה מ-XSS. ' +
        'כישלון בתנאי אחד — ה-cookie לא יישלח.',
    },
    {
      q: 'מה קורה בדמו כשלוחצים "expire token" ואז "call API"?',
      options: [
        'הדמו מציג 403 Forbidden',
        'הדמו מדגים GET עם 401, interceptor, POST /auth/refresh, 200, switchMap retry, GET 200',
        'הדמו מנתק את ה-session',
        'הדמו מציג הודעת שגיאה ומפנה ל-login',
      ],
      answer: 1,
      explain:
        'אחרי "expire token" ו-"call API": הלוג מציג GET עם carrier, ואז 401, ואז "interceptor catches 401 - one in-flight refresh (no stampede)", ואז ' +
        'POST /auth/refresh, ואז 200 עם tokens חדשים, ואז "switchMap retries the ORIGINAL request", ואז GET (retry), ואז 200. ' +
        'זוהי הדגמה מדויקת של הזרימה שנלמדת.',
    },
  ],

  proveIt: [
    {
      title: 'צפו בזרימה המלאה בדמו',
      body:
        'פתחו את הדמו בכתובת `http://localhost:4400/chapters/drill-auth`. ' +
        'בצד Bearer: לחצו "login", ואז "call API" (אמור להחזיר 200). ' +
        'לחצו "expire token", ואז "call API" שוב. ' +
        'ב-Cookie mode: בצעו את אותו ניסוי וראו את ההבדל ב-config המוצג.',
      expect:
        'ב-Bearer mode אחרי expire: הלוג מציג `GET ... [Authorization: Bearer eyJ...]`, ואז ' +
        '`401 Unauthorized — access token expired`, ואז `interceptor catches 401`, ואז ' +
        '`POST /api/auth/refresh { refreshToken }`, ואז `200 — new access + rotated refresh`, ואז ' +
        '`switchMap retries the ORIGINAL request with the new token`, ואז `GET (retry)`, ואז `200`. ' +
        'ב-Cookie mode: הרענון מציג `POST /api/auth/refresh [refresh cookie auto-sent]`.',
    },
    {
      title: 'בדקו auth על hub: 401 ללא טוקן, 200 עם טוקן',
      body:
        'הריצו את השרת על `http://localhost:5080`. ' +
        'שלחו negotiate ללא טוקן — אמור להחזיר 401. ' +
        'השיגו טוקן ב-login ושלחו negotiate עם access_token בquery string.',
      command:
        'TOKEN=$(curl -s -X POST http://localhost:5080/api/auth/login -H "Content-Type: application/json" -d \'{"email":"demo@taskforge.dev","password":"Passw0rd!"}\' | jq -r .accessToken) && echo "=== ללא טוקן ===" && curl -i -X POST "http://localhost:5080/hubs/board/negotiate?negotiateVersion=1" && echo "" && echo "=== עם טוקן ===" && curl -i -X POST "http://localhost:5080/hubs/board/negotiate?negotiateVersion=1&access_token=$TOKEN"',
      expect:
        'ללא טוקן: `HTTP/1.1 401`. ' +
        'עם טוקן: `HTTP/1.1 200` עם JSON הכולל `connectionId` ו-`availableTransports`. ' +
        'זה מוכיח שה-`[Authorize]` על `BoardHub` פועל, והטוקן מגיע דרך query string.',
    },
    {
      title: 'בדקו Bearer header ב-Authorization על REST endpoint',
      body:
        'התחברו עם demo@taskforge.dev / Passw0rd! וקבלו access token. ' +
        'שלחו `GET /api/projects` עם ובלי header — ראו את ההבדל.',
      command:
        'TOKEN=$(curl -s -X POST http://localhost:5080/api/auth/login -H "Content-Type: application/json" -d \'{"email":"demo@taskforge.dev","password":"Passw0rd!"}\' | jq -r .accessToken) && echo "=== ללא Bearer ===" && curl -i http://localhost:5080/api/projects && echo "" && echo "=== עם Bearer ===" && curl -i -H "Authorization: Bearer $TOKEN" http://localhost:5080/api/projects',
      expect:
        'ללא Bearer: `HTTP/1.1 401`. ' +
        'עם Bearer: `HTTP/1.1 200` עם רשימת projects. ' +
        'זה מאמת שה-interceptor ב-TaskForge מצרף `Authorization: Bearer` על כל בקשה, ובלעדיו השרת דוחה.',
    },
    {
      title: 'השוו Cookie mode ל-Bearer mode בדמו',
      body:
        'בדמו בכתובת `http://localhost:4400/chapters/drill-auth`: ' +
        'החליפו ל-Cookie mode עם הטוגל. ' +
        'בצעו login ו-call API ו-expire ו-call API שוב. ' +
        'שימו לב לשורת ה-config שמוצגת תחת הלוג.',
      expect:
        'ב-Bearer: `withCredentials: false | Authorization: Bearer eyJ... | CORS: AllowAnyHeader + AllowAnyMethod`. ' +
        'ב-Cookie: `withCredentials: true | Cookie auto-sent | AllowCredentials() | NOT AllowAnyOrigin | SameSite=None; Secure; HttpOnly`. ' +
        'הרענון ב-Cookie mode מציג `POST /api/auth/refresh [refresh cookie auto-sent]` במקום `{ refreshToken }` בגוף.',
    },
  ],

  exercise: {
    prompt:
      'הוסיפו את ה-`authRefreshInterceptor` לקוד TaskForge האמיתי — ' +
      'interceptor שתופס 401, מרענן בשקט, וחוזר על הבקשה המקורית עם מניעת stampede.',
    tasks: [
      'צרו `client/src/app/core/auth/auth-refresh.interceptor.ts` עם `refresh$` גלובלי ו-`authRefreshInterceptor: HttpInterceptorFn`.',
      'ב-`catchError`: החרגו בקשות שאינן 401, והחרגו `/auth/refresh` עצמו (למניעת לולאה).',
      'השתמשו ב-`refresh$ ??= auth.refresh().pipe(shareReplay(1), finalize(() => refresh$ = null))`.',
      'ב-`switchMap`: חזרו על הבקשה המקורית עם הטוקן החדש מ-`addToken(req, token)`.',
      'רשמו את האינטרספטור ב-`app.config.ts` לאחר `authInterceptor` (הסדר חשוב: Bearer header קודם, refresh אחריו).',
      'אמתו: login, קרא endpoint, בטלו את ה-access token ידנית (שנו אותו ל-string מזויף ב-DevTools localStorage), קראו שוב — ראו שה-401 נתפס והרענון מתבצע בשקט.',
    ],
    acceptance: [
      'בקשה עם 401 מרועננת בשקט ומוחזרת עם הטוקן החדש — המשתמש לא רואה דף login.',
      '`POST /auth/refresh` לא מנסה לרענן שוב כשהוא עצמו מחזיר 401.',
      'N בקשות עם 401 בו-זמניות שולחות refresh POST אחד בלבד (`refresh$` משותף).',
      'build ירוק (`pnpm build` בתיקיית הלקוח), אפס שגיאות TypeScript.',
    ],
  },
};
