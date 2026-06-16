import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 23 — Production Hardening: הקשחה לפרודקשן.
 * Wave 6 opener. Backend only (no new client dependency):
 *   - OutputCache with custom StatsCachePolicy (vary-by-user + projectId, tag eviction, TTL 15s)
 *   - ResponseCompression (Brotli + Gzip, EnableForHttps)
 *   - RateLimiter ("auth" fixed-window 5/30s on login+register; global per-IP 100/10s)
 *   - Security headers middleware (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, CSP) + HSTS in prod
 *   - Secrets fail-fast: Jwt:Key missing throws at startup
 *   - Client error.interceptor extended: 429 branch shows 'info' toast, reads Retry-After header
 * Verified runtime: br compression on /stats, cache hit replay (same X-Handler-Ms), eviction after POST,
 * 429 on 6th login attempt with Retry-After: 30, security headers on all responses, startup crash without Jwt:Key.
 * All from ASP.NET Core shared framework — zero new NuGet packages.
 */
export const CH23_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 23.1 */
    {
      id: '23.1',
      title: 'הפרק: הקשחה לפרודקשן',
      blocks: [
        {
          kind: 'p',
          text:
            'TaskForge פועל — ״עובד על המחשב שלי״. ' +
            'פרק 23 שואל: מה צריך לשנות כדי שיהיה ראוי להתמודד עם תעבורה אמיתית, ' +
            'ניסיונות פריצה, ומשתמשים שלא תמיד מתנהגים יפה?',
        },
        {
          kind: 'p',
          text:
            'ארבעה תחומים: (1) ביצועים — OutputCaching ל-`/stats`, ' +
            'כשה-endpoint היקר ביותר מוגן מפני בקשות חוזרות; ' +
            '(2) רוחב פס — ResponseCompression כדי שה-JSON לא יגיע כטקסט גולמי; ' +
            '(3) הגנה — RateLimiter שמגן על נתיב ה-auth מניחושים; ' +
            '(4) אמינות — כותרות אבטחה וסודות שנכשלים ב-startup ולא ב-runtime.',
        },
        {
          kind: 'callout',
          tone: 'dotnet10',
          title: 'אפס חבילות NuGet חדשות',
          body:
            'OutputCaching, ResponseCompression ו-RateLimiting הם חלק מה-shared framework של ASP.NET Core — ' +
            'לא תלויות שצריך להוסיף. הם זמינים מ-.NET 7+ ומשודרגים ב-.NET 10. ' +
            'מספיק `using` + `builder.Services.Add*` + `app.Use*`.',
        },
        {
          kind: 'term',
          name: 'output caching',
          definition:
            'מנגנון ASP.NET Core שמאחסן את גוף התשובה של endpoint בזיכרון השרת ומשיב ממנו בבקשות הבאות, ' +
            'מבלי להריץ את ה-handler שוב. מוגדר לפי מדיניות (policy) עם TTL, vary-by ו-tags לפינוי.',
        },
        {
          kind: 'term',
          name: 'cache invalidation',
          definition:
            'תהליך ביטול רשומה ב-cache כדי שה-hit הבא ייאלץ לחשב מחדש. ' +
            'ב-ASP.NET Core OutputCaching: `IOutputCacheStore.EvictByTagAsync("tag")` מפנה את כל הרשומות שתוייגו. ' +
            'אחת מבעיות המחשוב הקשות ביותר — ״ישנם שתי בעיות קשות: naming things ו-cache invalidation״.',
        },
      ],
      panel: {
        kind: 'filetree',
        title: 'קבצים חדשים ומשתנים בפרק 23',
        lines: [
          { text: 'server/TaskForge.Api/', depth: 0, kind: 'dir' },
          { text: 'Caching/', depth: 1, kind: 'dir' },
          { text: 'StatsCachePolicy.cs', depth: 2, kind: 'file', badge: 'new' },
          { text: 'Program.cs', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'Endpoints/', depth: 1, kind: 'dir' },
          { text: 'DashboardEndpoints.cs', depth: 2, kind: 'file', badge: 'mod' },
          { text: 'IssueEndpoints.cs', depth: 2, kind: 'file', badge: 'mod' },
          { text: 'AuthEndpoints.cs', depth: 2, kind: 'file', badge: 'mod' },
          { text: 'appsettings.json', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'appsettings.Development.json', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'client/src/app/core/api/', depth: 0, kind: 'dir' },
          { text: 'error.interceptor.ts', depth: 1, kind: 'file', badge: 'mod' },
        ],
        caption:
          'קובץ C# חדש אחד + שישה שינויים — אפס תלות חדשה, backend בלבד פרט לענף 429 בקליינט',
      },
    },

    /* ------------------------------------------------------------ 23.2 */
    {
      id: '23.2',
      title: 'OutputCache: רישום ה-service',
      blocks: [
        {
          kind: 'p',
          text:
            'בפרק 18 סומן `GET /api/projects/1/stats` כמועמד לcaching: ' +
            'הוא מבצע אגרגציה מורכבת ב-DB, נקרא לעתים קרובות, ומשתנה רק כשמשהו נכתב. ' +
            'פרק 23 מממש את ה-seam הזה.',
        },
        {
          kind: 'p',
          text:
            '`builder.Services.AddOutputCache` מוסיף את ה-store לזיכרון ואת מנגנון המדיניות. ' +
            'ב-`options.AddPolicy("StatsCache", ...)` נרשמת מדיניות בשם עם `excludeDefaultPolicy: true`. ' +
            'הדגל הזה קריטי — בלעדיו מדיניות ברירת המחדל הייתה בודקת את הבקשה ראשונה ומסרבת לשמור אותה, ' +
            'משום שיש בה כותרת `Authorization`.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה ברירת המחדל מסרבת לשמור בקשות מאומתות?',
          body:
            'OutputCache ברירת המחדל מניחה שבקשות עם `Authorization` הן פרסונליות — ' +
            'שתי בקשות עם טוקנים שונים צריכות לקבל תשובות שונות. ' +
            'הנחה זו בטוחה ושגויה במקרה שלנו: `/stats` אכן פרסונלי לפרויקט ולמשתמש, ' +
            'אבל אנחנו יודעים לנהל vary-by נכון. לכן: `excludeDefaultPolicy: true` + מדיניות מפורשת.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה `excludeDefaultPolicy: true` עושה ב-`AddPolicy`?',
          body:
            'כשמגדירים policy דרך `options.AddPolicy(name, builder, excludeDefaultPolicy: true)`, ' +
            'מדיניות ברירת המחדל (DefaultPolicy) לא מצטרפת לפני ה-policy שהגדרנו. ' +
            'בלי הדגל: ברירת המחדל תרוץ ראשונה ותגדיר `EnableOutputCaching = false` עבור בקשות מאומתות, ' +
            'ואז המדיניות שלנו לא תעלה בכלל. הדגל מאפשר לנו לשלוט על הכול.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch23',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-23.2',
        diff: true,
        title: 'Program.cs — AddOutputCache עם "StatsCache" policy',
      },
    },

    /* ------------------------------------------------------------ 23.3 */
    {
      id: '23.3',
      title: '`StatsCachePolicy`: המדיניות המותאמת',
      blocks: [
        {
          kind: 'p',
          text:
            '`StatsCachePolicy` מממש `IOutputCachePolicy` — ממשק בן שלוש שיטות. ' +
            'ב-`CacheRequestAsync` נקבעות ארבע החלטות: ' +
            'האם לאפשר lookup? האם לאחסן? מה ה-TTL? מה מפתח ה-vary?',
        },
        {
          kind: 'p',
          text:
            'ה-TTL הוא 15 שניות — קצר מספיק שיהיה רלוונטי, ארוך מספיק שיחסוך בקשות DB. ' +
            'ה-vary מורכב משני חלקים: ערך ה-route `projectId` (כל פרויקט — cache נפרד) ' +
            'ו-claim `NameIdentifier` של המשתמש המאומת (כל משתמש — cache נפרד). ' +
            'ב-`ServeResponseAsync`: רק סטטוס 200 נשמר — 403/404 לא נכנסים ל-cache.',
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: 'vary-by-user: אבטחה, לא רק נוחות',
          body:
            'ב-cache hit, ה-handler לא רץ. כלומר: בדיקת החברות (`IsMemberAsync`) נדלגת. ' +
            'אם המפתח היה כולל רק `projectId`, cached hit עבור פרויקט 1 היה מוגש לכל בקשה ל-`/stats/1` — ' +
            'כולל משתמש שאינו חבר ושאמור לקבל 403. ' +
            'vary-by user מבטיח שכל משתמש מקבל רשומה משלו ב-cache. ' +
            'זה interview gold: caching + auth חייבים לתאם מפתח.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה הסיכון של OutputCache על endpoint מאומת ללא vary-by-user?',
          body:
            'cache hit מחזיר תשובה מאוחסנת מבלי להריץ את ה-handler. ' +
            'בדיקות הרשאה שנמצאות ב-handler (כמו `IsMemberAsync`) נדלגות. ' +
            'אם מפתח ה-cache אינו כולל את זהות המשתמש, משתמש B עשוי לקבל תשובה שנשמרה עבור משתמש A — ' +
            'כולל נתונים של פרויקט שB אינו חבר בו. הפתרון: `CacheVaryByRules.VaryByValues["user"] = userId`.',
        },
        {
          kind: 'term',
          name: 'IOutputCachePolicy',
          definition:
            'ממשק ASP.NET Core המגדיר מדיניות OutputCaching מותאמת. ' +
            'שלוש שיטות: `CacheRequestAsync` (האם לחפש ולשמור, מה ה-vary?), ' +
            '`ServeFromCacheAsync` (לאחר lookup מוצלח), `ServeResponseAsync` (לאחר handler — האם לשמור?). ' +
            'מאפשר שליטה מלאה שה-fluent API הרגיל לא נותן.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch23',
        file: 'server/TaskForge.Api/Caching/StatsCachePolicy.cs',
        region: 'step-23.3',
        diff: true,
        title: 'StatsCachePolicy.cs — vary-by-user + tag דינמי + TTL 15s',
      },
    },

    /* ------------------------------------------------------------ 23.4 */
    {
      id: '23.4',
      title: '`.CacheOutput("StatsCache")` ב-`/stats`',
      blocks: [
        {
          kind: 'p',
          text:
            'שורה אחת מחברת את המדיניות ל-endpoint: `.CacheOutput("StatsCache")` אחרי `MapGet("/stats", GetStats)`. ' +
            'הפרמטר הוא שם ה-policy שנרשם ב-`AddOutputCache`. ' +
            'מרגע זה: GET ראשון ל-`/api/projects/1/stats` מריץ את `GetStats` ושומר; ' +
            'GETים הבאים תוך 15 שניות — תשובה מ-cache, ה-handler לא רץ.',
        },
        {
          kind: 'p',
          text:
            'אפשר לאמת זאת בעזרת כותרת `X-Handler-Ms` שמסומנת על ידי `HandlerTimingFilter` מפרק 01: ' +
            'בבקשה ראשונה (MISS) ה-handler רץ ומייצר ערך ב-`X-Handler-Ms`. ' +
            'בבקשה שנייה תוך 15 שניות (HIT) — אותו ערך מוקפא מוחזר, ' +
            'מה שמוכיח שה-handler לא הופעל.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch23',
        file: 'server/TaskForge.Api/Endpoints/DashboardEndpoints.cs',
        region: 'step-23.4',
        diff: true,
        title: 'DashboardEndpoints.cs — .CacheOutput("StatsCache") על /stats',
      },
    },

    /* ------------------------------------------------------------ 23.5 */
    {
      id: '23.5',
      title: 'פינוי ה-cache אחרי כתיבה: `EvictStatsAsync`',
      blocks: [
        {
          kind: 'p',
          text:
            'Caching קל. Invalidation — זה החלק הקשה. ' +
            'כשיוצרים issue חדש, הספירות משתנות — ה-`total`, ה-`open`, ה-`byStatus`. ' +
            'אם ה-cache עדיין מחזיר את התשובה הישנה, המשתמש רואה מספרים שקריים. ' +
            'ה-tag `stats-{projectId}` הוגדר ב-`StatsCachePolicy` בדיוק למטרה זו.',
        },
        {
          kind: 'p',
          text:
            '`EvictStatsAsync` היא helper פרטי ב-`IssueEndpoints`: ' +
            'קוראת `cache.EvictByTagAsync($"stats-{projectId}", ct)`. ' +
            'היא מוזרקת בארבעה handlers: `CreateIssue`, `UpdateIssue`, `ReorderIssue`, `DeleteIssue`. ' +
            'כל כתיבה ל-issue מפנה את ה-stats של הפרויקט שלו — ולא פרויקטים אחרים.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'שכחתם handler? cache משקר.',
          body:
            'כל מסלול כתיבה שלא קורא ל-`EvictStatsAsync` ישאיר את ה-cache עם נתונים ישנים. ' +
            'לדוגמה: אם `DeleteIssue` לא יפנה — מחיקת issue לא תשתקף ב-stats עד שה-TTL יפוג. ' +
            'הדרך לוודא: קריאת ה-code עם רשימה של כל mutations. ' +
            'ב-ch23: `CreateIssue`, `UpdateIssue`, `ReorderIssue`, `DeleteIssue` — כולם מפנים.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מדוע שימוש ב-tag ולא ב-evict לפי מפתח מדויק?',
          body:
            'מפתח ה-cache כולל `projectId` ו-`userId` — שני ממדים. ' +
            'אם מפנים לפי מפתח מדויק, צריך לדעת את ה-userId של כל משתמש שקיבל cache לפרויקט זה. ' +
            'tag `stats-{projectId}` מפנה את כל המשתמשים בפרויקט בקריאה אחת, ' +
            'ללא ידיעה מוקדמת על מי מחזיק רשומה ב-cache.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch23',
        file: 'server/TaskForge.Api/Endpoints/IssueEndpoints.cs',
        region: 'step-23.4b',
        diff: true,
        title: 'IssueEndpoints.cs — EvictStatsAsync: נקודת הפינוי המרכזית',
      },
    },

    /* ------------------------------------------------------------ 23.6 */
    {
      id: '23.6',
      title: 'הדמו: caching ו-invalidation בפעולה',
      blocks: [
        {
          kind: 'p',
          text:
            'הדמו מדמה `GET /api/projects/1/stats` עם TTL של 15 שניות. ' +
            '"GET /stats" מבצע CACHE MISS ראשון (ריצת DB מדומה) ומציג countdown bar. ' +
            'לחיצה שנייה בתוך 15 שניות — CACHE HIT מיידי, אותה תשובה.',
        },
        {
          kind: 'p',
          text:
            'לחצן "create issue" מגדיל את הספירה ב-DB המדומה. ' +
            'כאשר "evict on write" מסומן — create מפנה את ה-cache, ' +
            'ו-GET הבא הוא MISS עם מספרים מעודכנים. ' +
            'כאשר לא מסומן — ה-cache ממשיך להגיש את המספרים הישנים עם תג STALE, ' +
            'בעוד ה-DB כבר התקדם. זהו הלקח המרכזי: caching קל, invalidation הוא המאתגר.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'STALE: מתי הוא בעיה?',
          body:
            'נתון STALE (ישן) הוא בעיה כשהמשתמש מצפה לראות שינוי שהוא עצמו יצר. ' +
            'ב-TaskForge: יצרת issue, חזרת לדשבורד, `total` עדיין מציג את המספר הישן — ' +
            'חווית משתמש שבורה. TTL קצר (15s) מפחית את החלון, אבל eviction מיידי אחרי כתיבה מבטל אותו לחלוטין.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () =>
          import('./demos/cache-invalidation.demo').then(
            (m) => m.CacheInvalidationDemo,
          ),
        caption:
          'דמו חי: CACHE HIT ו-MISS — לחצו "create issue" עם evict on/off וראו את ההבדל בין מספרים עדכניים לנתוני STALE',
      },
    },

    /* ------------------------------------------------------------ 23.7 */
    {
      id: '23.7',
      title: '`UseOutputCache`: מיקום ב-pipeline',
      blocks: [
        {
          kind: 'p',
          text:
            '`app.UseOutputCache()` ממוקם אחרי `UseAuthentication` ו-`UseAuthorization`. ' +
            'הסדר קריטי: ה-`User` חייב להיות מאוכלס כבר כשה-OutputCache בונה את מפתח ה-cache — ' +
            'כי `StatsCachePolicy` קורא `context.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)`. ' +
            'לפני auth — `User` ריק, ה-vary-by-user לא עובד.',
        },
        {
          kind: 'p',
          text:
            'יתרון נוסף: בקשה לא-מאומתת מקבלת 401 מ-`UseAuthorization` לפני שמגיעה ל-OutputCache. ' +
            'ה-cache לא רואה אותה כלל. ' +
            'תשובות שגיאה (401, 403) לא נשמרות ב-cache — הוגדר גם ב-`ServeResponseAsync`.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: '`UseOutputCache` לפני auth: תרחיש שבור',
          body:
            'אם `UseOutputCache` היה לפני `UseAuthentication`: `User` ריק ב-`StatsCachePolicy`. ' +
            'כל המשתמשים היו מקבלים `userId = "anonymous"` — מפתח cache אחד לכולם. ' +
            'המשתמש הראשון שיבקש `/stats/1` ייצור cache hit לכל שאר המשתמשים, כולל לא-חברים. ' +
            'זו הדגמת אבטחה ב-placement order.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch23',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-23.2b',
        diff: true,
        title: 'Program.cs — app.UseOutputCache() אחרי auth',
      },
    },

    /* ------------------------------------------------------------ 23.8 */
    {
      id: '23.8',
      title: 'ResponseCompression: Brotli + Gzip',
      blocks: [
        {
          kind: 'p',
          text:
            'JSON של `/stats` הוא כ-700 תווים של שדות, מערכים ומספרים — ' +
            'מבנה עם הרבה חזרות וטקסט ASCII. דחיסה מוריד אותו משמעותית. ' +
            '`AddResponseCompression` מגדיר שני ספקים: `BrotliCompressionProvider` (מועדף) ' +
            'ו-`GzipCompressionProvider` כגיבוי. ' +
            'הלקוח מכריז מה הוא תומך בו ב-`Accept-Encoding`; השרת בוחר.',
        },
        {
          kind: 'p',
          text:
            '`EnableForHttps = true` מאשר דחיסה גם תחת TLS. ' +
            'ברירת המחדל היא `false` כי דחיסה על HTTPS עם תוכן שנשלט על ידי התוקף ' +
            'עלולה לאפשר התקפת BREACH. ב-API שלנו: הגוף הוא JSON שנוצר על ידי השרת בלבד, ' +
            'לא עם קלט צד-לקוח שמוטמע — `EnableForHttps = true` בטוח.',
        },
        {
          kind: 'callout',
          tone: 'dotnet10',
          title: 'Brotli מועדף על Gzip',
          body:
            'Brotli (br) מגיע עם יחסי דחיסה טובים יותר מ-Gzip לטקסט JSON, ' +
            'ומנהל מצב מהיר יותר לדחיסה ב-streaming. ' +
            'דפדפנים מודרניים כולם תומכים ב-`br` — Chrome, Firefox, Safari, Edge. ' +
            'ב-`Providers`: הסדר קובע — ראשון = מועדף. Brotli קודם, Gzip אחריו.',
        },
        {
          kind: 'term',
          name: 'response compression',
          definition:
            'תהליך דחיסת גוף תגובת HTTP לפני שליחתה ללקוח. ' +
            'הלקוח מכריז `Accept-Encoding: br, gzip` בבקשה; השרת דוחס ומוסיף `Content-Encoding: br` לתשובה. ' +
            'תקני: RFC 7231. ב-ASP.NET Core: `ResponseCompression` middleware מממש זאת.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch23',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-23.5',
        diff: true,
        title: 'Program.cs — AddResponseCompression (Brotli + Gzip)',
      },
    },

    /* ------------------------------------------------------------ 23.9 */
    {
      id: '23.9',
      title: '`UseResponseCompression`: מיקום ב-pipeline',
      blocks: [
        {
          kind: 'p',
          text:
            '`app.UseResponseCompression()` ממוקם בתחילת ה-pipeline — לפני CORS, auth, ו-OutputCache. ' +
            'הסיבה: הוא עוטף את זרם הכתיבה (response body stream). ' +
            'כל middleware שרץ לאחריו כותב לזרם הדחוס — כולל cache hits. ' +
            'תשובה שמוחזרת מה-cache גם היא יוצאת דחוסה אם הלקוח תומך.',
        },
        {
          kind: 'callout',
          tone: 'alt',
          title: 'דחיסה ב-reverse proxy: מתי עדיף?',
          body:
            'בפרודקשן עם nginx/IIS/Kestrel מאחורי gateway: לפעמים עדיף לבצע דחיסה ב-proxy ' +
            '(gateway מטפל בחיבורי TLS ודחיסה, ה-API פנימי מקבל HTTP גולמי). ' +
            'ב-TaskForge שמריץ Kestrel ישירות ללא proxy — `UseResponseCompression` הוא הפתרון הנכון.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch23',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-23.5b',
        diff: true,
        title: 'Program.cs — app.UseResponseCompression() בתחילת pipeline',
      },
    },

    /* ------------------------------------------------------------ 23.10 */
    {
      id: '23.10',
      title: 'RateLimiter: הגנת brute-force על auth',
      blocks: [
        {
          kind: 'p',
          text:
            '`AddRateLimiter` מגדיר שתי שכבות הגנה. ' +
            'שכבה ראשונה — policy בשם `"auth"`: `FixedWindowLimiter` עם 5 בקשות ל-30 שניות. ' +
            'זהו החלון שמגן על `login` ו-`register` מניחוש סיסמאות. ' +
            '5 ניסיונות לחצי דקה — מספיק לשימוש לגיטימי, אוטם brute-force. ' +
            '`QueueLimit = 0`: דחייה מיידית, ללא תור המתנה.',
        },
        {
          kind: 'p',
          text:
            'שכבה שנייה — `GlobalLimiter`: `PartitionedRateLimiter` לפי IP, ' +
            '100 בקשות ל-10 שניות. ' +
            'זוהי רשת ביטחון מפני הצפה כללית. ' +
            'ה-global limiter חל על כל endpoint; ' +
            'ה-`"auth"` policy חל רק על endpoints שביקשו אותו עם `.RequireRateLimiting("auth")`.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'fixed-window ולא token-bucket?',
          body:
            '`FixedWindowLimiter` פשוט ומדויק להגנת auth: ' +
            'X בקשות בחלון Y שניות — כולם בסוף החלון, ה-counter מאפס. ' +
            '`TokenBucketRateLimiter` מאפשר burst עד לגודל הדלי לפני שמגביל — ' +
            'פחות מתאים לauth כי burst של 20 ניחושים עדיין מסוכן. ' +
            '`SlidingWindowLimiter` חלק יותר, אך מורכב יותר לניפוי. ' +
            'לauth: fixed window הוא הנכון.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ההבדל בין FixedWindow ל-TokenBucket ל-SlidingWindow?',
          body:
            '`FixedWindow`: חלון קבוע בזמן, counter מאפס בסוף כל חלון. פשוט, אבל קצה-חלון יכול לאפשר burst כפול (סוף חלון N + תחילת חלון N+1). ' +
            '`SlidingWindow`: חלון נע — תמיד מסתכל X שניות אחורה. חלק יותר, ללא בעיית הקצה. ' +
            '`TokenBucket`: דלי עם X tokens, מתמלא בקצב קבוע — מאפשר burst מבוקר. ' +
            'ASP.NET Core תומך בכל השלושה + `ConcurrencyLimiter` (מגביל מקביליות).',
        },
        {
          kind: 'term',
          name: 'rate limiting',
          definition:
            'מגבלת קצב: מספר בקשות מרבי שלקוח (IP, משתמש, key) יכול לבצע בחלון זמן. ' +
            'מטרות: מניעת brute-force על auth, הגנה על DB מהצפה, מניעת scraping. ' +
            'ב-ASP.NET Core: `AddRateLimiter` + middleware + `RequireRateLimiting`.',
        },
        {
          kind: 'term',
          name: 'fixed window',
          definition:
            'אלגוריתם rate limiting: סופרים בקשות בחלון זמן קבוע (לדוגמה 30 שניות). ' +
            'כשמגיעים ל-PermitLimit, כל הבקשות הנוספות נדחות עד שהחלון מסתיים ומאפס. ' +
            'פשוט ויעיל להגנת auth — ב-TaskForge: 5 בקשות/30 שניות על login+register.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch23',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-23.6',
        diff: true,
        title: 'Program.cs — AddRateLimiter: "auth" + GlobalLimiter + OnRejected',
      },
    },

    /* ------------------------------------------------------------ 23.11 */
    {
      id: '23.11',
      title: '`RequireRateLimiting` על auth endpoints',
      blocks: [
        {
          kind: 'p',
          text:
            '`MapPost("/login", Login).RequireRateLimiting("auth")` — שורה אחת מצמידה את ה-policy. ' +
            'אותו הדבר על `/register`. ' +
            'ה-`/refresh` endpoint מכוון NOT מוגבל: ה-SPA קורא לו שגרתית לרענון שקט לפני פקיעת ה-access token. ' +
            'טוקן רענון הוא סוד ארוך וחד-פעמי — לא סיסמה שמנחשים.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה `refresh` לא מוגבל?',
          body:
            'ה-SPA קורא ל-`refresh` כל 15 דקות (זמן חיי ה-access token). ' +
            'אם ה-rate limiter היה חל עליו, לאחר 5 refreshים תוך 30 שניות (על load עמוס) ' +
            'המשתמש היה מנותק. ' +
            'טוקן רענון הוא credential ארוך, מוצפן, חד-פעמי (rotation בפרק 05) — ' +
            'ניחוש אינו אפשרי מעשית, ולכן rate limiting לא מוסיף ערך.',
        },
        {
          kind: 'p',
          text:
            'כשהגבלה מופעלת, `OnRejected` ב-`AddRateLimiter` מחזיר 429 עם כותרת `Retry-After` בשניות. ' +
            'הקליינט (בפרק 23.9) קורא את הכותרת ומציג הודעה ידידותית. ' +
            'ניתן לאמת: 5 POSTים ל-`/api/auth/login` מחזירים 200; ' +
            'ה-6 מחזיר 429 עם `Retry-After: 30` וגוף `{"title":"Too many requests","detail":"Slow down and try again shortly."}`.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch23',
        file: 'server/TaskForge.Api/Endpoints/AuthEndpoints.cs',
        region: 'step-23.6c',
        diff: true,
        title: 'AuthEndpoints.cs — .RequireRateLimiting("auth") על login+register',
      },
    },

    /* ------------------------------------------------------------ 23.12 */
    {
      id: '23.12',
      title: 'כותרות אבטחה + HSTS',
      blocks: [
        {
          kind: 'p',
          text:
            'middleware פנימי קטן מוסיף ארבע כותרות אבטחה על כל תשובה — ' +
            'כולל שגיאות ו-cache hits (כי הוא מוקדם ב-pipeline): ' +
            '`X-Content-Type-Options: nosniff` מונע type sniffing בדפדפן; ' +
            '`X-Frame-Options: DENY` מונע טעינה ב-iframe; ' +
            '`Referrer-Policy: no-referrer` לא שולח כתובת מגיע בבקשות חיצוניות; ' +
            '`Content-Security-Policy: default-src \'none\'; frame-ancestors \'none\'` — ' +
            'ה-API לא מגיש HTML, אז "שום דבר לא מותר" הוא הנכון.',
        },
        {
          kind: 'p',
          text:
            '`UseHsts()` ממוקם בגוש `if (!app.Environment.IsDevelopment())`. ' +
            'HSTS (HTTP Strict Transport Security) מוסיף `Strict-Transport-Security` header ' +
            'שמורה לדפדפן לדבר עם הדומיין הזה תמיד על HTTPS בלבד. ' +
            'בפיתוח על `http://localhost` — HSTS מזיק (יכביל לHTTPS גם בפיתוח), ' +
            'לכן אינו ב-Development.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'הגנת עומק זולה',
          body:
            'כותרות אבטחה הן "defense in depth": לא מסירות חולשה מהקוד, ' +
            'אבל מקשות על ניצולה. ' +
            '`X-Content-Type-Options: nosniff` מונע תרחיש שבו קובץ JSON מפורש כ-HTML ומריץ script. ' +
            '`X-Frame-Options: DENY` מונע clickjacking. ' +
            'עלות: 4 שורות. תועלת: מגדירות את ה-security posture ב-pen-test ראשון.',
        },
        {
          kind: 'term',
          name: 'security headers',
          definition:
            'כותרות HTTP שמורות לדפדפן כיצד לפרש את התשובה מבחינת אבטחה. ' +
            'שכיחות: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Content-Security-Policy`, `Strict-Transport-Security`. ' +
            'נבדקות על ידי כלים כמו securityheaders.com בתהליך security audit.',
        },
        {
          kind: 'term',
          name: 'HSTS',
          definition:
            'HTTP Strict Transport Security: header שמורה לדפדפן לדבר עם הדומיין רק על HTTPS, ' +
            'לתקופה המוגדרת ב-`max-age`. מונע downgrade attacks ו-SSL-strip. ' +
            'ב-ASP.NET Core: `app.UseHsts()` בפרודקשן בלבד — ב-dev על http://localhost הוא מזיק.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch23',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-23.7',
        diff: true,
        title: 'Program.cs — security headers middleware + UseHsts() בפרודקשן',
      },
    },

    /* ------------------------------------------------------------ 23.13 */
    {
      id: '23.13',
      title: 'Secrets fail-fast: `Jwt:Key` ב-startup',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-`appsettings.json` שנשלח (ב-git) כולל את כל ערכי ה-Jwt — Issuer, Audience, ' +
            'משך חיי token — אך ללא `Key`. ' +
            'בפרודקשן, `Key` מגיע מ-`Jwt__Key` כמשתנה סביבה (הקו התחתון הכפול הוא הוריאנט של `:`), ' +
            'או מ-Key Vault. ' +
            'בפיתוח, הוא מגיע מ-`appsettings.Development.json` שמספק throwaway key לדוגמה.',
        },
        {
          kind: 'p',
          text:
            'בקוד: אחרי `builder.Configuration.GetSection("Jwt").Get<JwtOptions>()`, ' +
            'בדיקה: `if (string.IsNullOrWhiteSpace(jwt.Key))` — ואם חסר, זורקים `InvalidOperationException`. ' +
            'האפליקציה קורסת ב-startup ולא מנפיקה טוקנים עם מפתח ריק. ' +
            'הכישלון מוקדם, מפורש, ואי-אפשר להחמיצו.',
        },
        {
          kind: 'callout',
          tone: 'warn',
          title: 'אל תשמרו סודות ב-`appsettings.json`',
          body:
            'קובץ זה נמצא ב-git. אם `Jwt:Key` היה שם — הוא היה מוסרף לכל מי שרואה את ה-repo. ' +
            '`appsettings.Development.json` מכיל key לצורך demo בלבד, עם הערה ברורה שאינו לשימוש אמיתי. ' +
            'בצוות אמיתי — גם הוא לא היה ב-git, אלא ב-user-secrets (`dotnet user-secrets set`).',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'איך `Jwt__Key` (קו תחתון כפול) ממפה ל-`Jwt:Key`?',
          body:
            '`Microsoft.Extensions.Configuration` קורא משתני סביבה ומחליף `__` ב-`:` להרכבת מפתח היררכי. ' +
            'כך `Jwt__Key=secret` ממפה ל-`Jwt:Key` בתצורה — עובד ב-Docker, Kubernetes, Azure App Service. ' +
            'זה ה-convention הרגיל ב-.NET ל-configuration hierarchy באמצעות env vars.',
        },
        {
          kind: 'term',
          name: 'user-secrets',
          definition:
            'מנגנון .NET לאחסון סודות פיתוח מחוץ לתיקיית הפרויקט (ב-`%APPDATA%\\Microsoft\\UserSecrets`). ' +
            '`dotnet user-secrets init` + `dotnet user-secrets set "Jwt:Key" "..."`. ' +
            'הם לא נכנסים ל-git, ואינם חלק מה-build. מיועדים לפיתוח בלבד — בפרודקשן: env vars או Key Vault.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch23',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-23.8',
        diff: true,
        title: 'Program.cs — fail-fast: throw אם Jwt:Key חסר',
      },
    },

    /* ------------------------------------------------------------ 23.14 */
    {
      id: '23.14',
      title: '`appsettings`: prod ללא key, dev עם throwaway',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-`appsettings.json` הבסיסי כולל את כל ההגדרות הציבוריות של Jwt: ' +
            '`Issuer`, `Audience`, `AccessTokenMinutes`, `RefreshTokenDays`. ' +
            'שדה `Key` אינו שם — בכוונה. ' +
            'כך, בפרודקשן, האפליקציה תעלה רק אם `Jwt__Key` סופק בסביבה. ' +
            'אחרת: `InvalidOperationException` ב-startup.',
        },
        {
          kind: 'p',
          text:
            '`appsettings.Development.json` מוסיף את `Jwt.Key` עם ערך throwaway: ' +
            '`"dev-only-signing-key-CHANGE-IN-PRODUCTION-..."`. ' +
            'ה-comment בקובץ מסביר: "In a real team even this would live in user-secrets". ' +
            'כך הדוגמה פועלת out of the box ב-Development (`dotnet run`) ' +
            'ומתנגשת בפרודקשן אם המפתח לא הוזן דרך סביבה.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: '`appsettings.Development.json` עם הגדרות LogLevel',
          body:
            '`appsettings.Development.json` גם מעלה את ה-`LogLevel` של `Microsoft.AspNetCore` ל-`Information` — ' +
            'בפרודקשן הוא `Warning` (פחות רעש). ' +
            'זה הדפוס הנכון: logging verbosity שונה לפי סביבה, מוגדר ב-config ולא בקוד.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'json',
        file: 'server/TaskForge.Api/appsettings.json',
        code: `// appsettings.json — ללא Jwt:Key (נשלח ב-git; Key חייב להגיע מהסביבה)
{
  "ConnectionStrings": { "Default": "Data Source=taskforge.db" },
  "Jwt": {
    "Issuer": "TaskForge",
    "Audience": "TaskForge.Client",
    "AccessTokenMinutes": 15,
    "RefreshTokenDays": 7
    // NOTE: Key חסר בכוונה — fail-fast אם לא סופק מהסביבה
  },
  ...
}

// appsettings.Development.json — throwaway key לשימוש local בלבד
{
  "Jwt": {
    "Key": "dev-only-signing-key-CHANGE-IN-PRODUCTION-7f3a9c1e5b8d2046"
  }
}`,
      },
    },

    /* ------------------------------------------------------------ 23.15 */
    {
      id: '23.15',
      title: 'קליינט: ענף 429 ב-`errorInterceptor`',
      blocks: [
        {
          kind: 'p',
          text:
            'בפרקים 11 ו-12 בנינו `errorInterceptor` — "מתרגם יחיד" שכל שגיאת HTTP עוברת דרכו. ' +
            'פרק 12 לימד אותו ניב חדש (409 Conflict עם גוף string). ' +
            'פרק 23 מלמד אותו ניב נוסף: 429 Too Many Requests.',
        },
        {
          kind: 'p',
          text:
            'ענף 429 מוסיף בדיקה לפני ה-`toastSvc.show(problemText(err), \'danger\')` הכללי: ' +
            'כש-`err.status === 429`, קוראים `retryText(err)` ומציגים toast עם tone `\'info\'`, לא `\'danger\'`. ' +
            'הגיון: 429 אינה שגיאה (השרת פעל נכון), אלא בקשה למשתמש להאט — ' +
            'טון אינפורמטיבי מתאים יותר מאדום מבהיל.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'אחד מתרגם, אפס רכיבים יודעים',
          body:
            'אם 429 היה מטופל ברכיב ה-login, `register`, ו-כל מקום אחר — ' +
            'שינוי הטקסט היה מחייב עריכה בכל מקום. ' +
            'המתרגם היחיד לומד ניב חדש פעם אחת; כל הרכיבים מרוויחים אוטומטית. ' +
            'זהו הסים של פרק 11 שמשתלם שוב — ״One Place To Update The World״.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch23',
        file: 'client/src/app/core/api/error.interceptor.ts',
        region: 'step-23.9',
        diff: true,
        title: 'error.interceptor.ts — ענף 429: info toast במקום danger',
      },
    },

    /* ------------------------------------------------------------ 23.16 */
    {
      id: '23.16',
      title: '`retryText`: קריאת `Retry-After` header',
      blocks: [
        {
          kind: 'p',
          text:
            'פונקציה קטנה `retryText(err: HttpErrorResponse)` קוראת `err.headers.get(\'Retry-After\')`, ' +
            'ממירה ל-`Number`, ובודקת `Number.isFinite(seconds) && seconds > 0`. ' +
            'אם יש — `"Too many attempts — try again in 30s"`. ' +
            'אחרת (הכותרת חסרה או לא-מספרית) — `"Too many attempts — slow down and try again"`. ' +
            'Graceful degradation: הודעה תמיד מוצגת, פחות מדויקת אם אין כותרת.',
        },
        {
          kind: 'p',
          text:
            'ה-`Retry-After` נשלח על ידי `OnRejected` ב-`AddRateLimiter`: ' +
            'כש-`context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter)` מצליח, ' +
            'מוסיפים `context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString()`. ' +
            'הקשר: שני קצות — שרת שולח, קליינט קורא — מחוברים דרך header סטנדרטי.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'CORS ו-`Retry-After`: הכותרת חייבת להיות exposed',
          body:
            'ב-CORS, headers בתשובה אינם גלויים לJS ברירת מחדל אלא אם ה-policy מאפשר. ' +
            'ה-policy בפרק 11 משתמש ב-`AllowAnyHeader()` לבקשות — ' +
            'לחשיפת response headers צריך `WithExposedHeaders("Retry-After")` ב-policy. ' +
            'בסביבת פיתוח עם `localhost:4500` אל `localhost:5080` ללא nginx: ' +
            'ב-simple scenarios זה עשוי לעבוד, אך בפרודקשן יש לוודא שהכותרת חשופה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch23',
        file: 'client/src/app/core/api/error.interceptor.ts',
        region: 'step-23.9b',
        diff: true,
        title: 'error.interceptor.ts — retryText: קריאת Retry-After + graceful degradation',
      },
    },

    /* ------------------------------------------------------------ 23.17 */
    {
      id: '23.17',
      title: 'העץ אחרי פרק 23',
      blocks: [
        {
          kind: 'p',
          text:
            'פרק 23 פתח את Wave 6 (Production). ' +
            'ה-API של TaskForge קיבל ארבע שכבות הקשחה: ' +
            'OutputCache על `/stats` עם פינוי טגי לאחר כתיבה, ' +
            'ResponseCompression (Brotli קודם, Gzip כגיבוי), ' +
            'RateLimiter עם שתי שכבות (auth + global), ' +
            'ו-security headers על כל תשובה. ' +
            'כל זאת מה-shared framework — אפס NuGet חדשות.',
        },
        {
          kind: 'p',
          text:
            'Wave 6 ממשיכה: פרק 24 מוסיף SignalR לעדכונים בזמן-אמת, ' +
            'פרק 25 מלמד Docker ו-CI, ופרק 26 הוא ה-capstone שמחבר הכול. ' +
            'ה-seams שבנינו לאורך 23 פרקים — repositories, endpoints, interceptors — ' +
            'מוכיחים את עצמם שוב: כל שכבת הקשחה צורכת seam קיים ולא שובר את הסובב אותה.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'כיצד תתאר את ארכיטקטורת ה-caching של TaskForge לפרוסה ב-production?',
          body:
            'OutputCache ב-memory store עם מדיניות מותאמת: TTL 15s, vary-by `(userId, projectId)`, ' +
            'tag `stats-{projectId}` לפינוי מדויק. פינוי מוצמד לכל mutation (Create, Update, Reorder, Delete). ' +
            'OutputCache ממוקם אחרי auth — `User` מאוכלס לפני lookup. ' +
            '`excludeDefaultPolicy: true` מאפשר caching של בקשות מאומתות בשליטה מלאה. ' +
            'Compression עוטפת את כולו — גם cache hits יוצאים דחוסים.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch23',
        title: 'TaskForge אחרי פרק 23 — OutputCache + Compression + RateLimit + Security headers',
      },
    },
  ],

  quiz: [
    {
      q: 'מדוע `AddOutputCache` מקבל `excludeDefaultPolicy: true` עבור ה-`"StatsCache"` policy?',
      options: [
        'כדי לאפשר caching מהיר יותר',
        'כי ברירת המחדל מסרבת לשמור בקשות עם כותרת Authorization — ואנחנו רוצים לשמור אותן עם vary-by מפורש',
        'כי ה-endpoint אינו מאומת',
        'כי TTL אינו תואם לברירת המחדל',
      ],
      answer: 1,
      explain:
        'ברירת המחדל של OutputCache מסרבת לאחסן בקשות שיש בהן `Authorization` (ומניחה שהן פרסונליות). ' +
        '`excludeDefaultPolicy: true` מאפשר ל-`StatsCachePolicy` לשלוט לבד — היא מפעילה caching ' +
        'ומגדירה vary-by `(userId, projectId)` כדי לאבטח את הפרסונליות.',
    },
    {
      q: 'מה יקרה אם `UseOutputCache()` יופיע לפני `UseAuthentication()` ב-pipeline?',
      options: [
        'הכול יעבוד כרגיל',
        'ה-cache יחשב לכל המשתמשים userId="anonymous", ויוכל להגיש תשובה של משתמש A למשתמש B',
        'ה-cache לא יפעל',
        'תיזרק חריגה ב-startup',
      ],
      answer: 1,
      explain:
        '`StatsCachePolicy` קורא `context.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)`. ' +
        'לפני `UseAuthentication`, `User` ריק — התוצאה תמיד `"anonymous"`. ' +
        'מפתח ה-cache יהיה `(anonymous, projectId)` — כולם חולקים אותו. ' +
        'מצב זה מסוכן: משתמש לא-חבר יכול לקבל cache hit עם נתוני פרויקט שאינו שלו.',
    },
    {
      q: 'מה קורה ב-OutputCache כש-`ServeResponseAsync` מגדיר `AllowCacheStorage = false`?',
      options: [
        'התשובה נשמרת ב-cache אבל לא מוגשת',
        'התשובה מוגשת לקליינט אבל אינה נשמרת ב-cache — הבקשה הבאה תהיה MISS',
        'התשובה נחסמת',
        'ה-cache מנוקה לחלוטין',
      ],
      answer: 1,
      explain:
        '`ServeResponseAsync` רץ אחרי שה-handler ייצר את התשובה אך לפני שהיא נשמרת. ' +
        'הגדרת `AllowCacheStorage = false` מבטלת את השמירה. ' +
        'ב-`StatsCachePolicy`: רק תשובות 200 נשמרות; 403/404 עוברות לקליינט ללא שמירה.',
    },
    {
      q: 'מדוע ה-`/refresh` endpoint אינו מוגבל ב-`RequireRateLimiting("auth")`?',
      options: [
        'כי refresh אינו קריטי לאבטחה',
        'כי ה-SPA קורא לו שגרתית ואוטומטית, וטוקן הרענון הוא סוד ארוך וחד-פעמי שלא ניתן לנחש',
        'כי rate limiter אינו תומך ב-refresh',
        'כי 5 ניסיונות ל-30 שניות מספיקים לו',
      ],
      answer: 1,
      explain:
        'ה-SPA קורא ל-`/refresh` אוטומטית כל ~15 דקות כדי לחדש את ה-access token. ' +
        'rate limiting עליו היה מנתק משתמשים לאחר 5 רענונים. ' +
        'בנוסף: טוקן רענון הוא מחרוזת אקראית ארוכה + חד-פעמית (rotation) — ניחוש אינו אפשרי מעשית.',
    },
    {
      q: 'מה ההבדל בין tag-based eviction ל-eviction לפי מפתח מדויק?',
      options: [
        'אין הבדל — שניהם עובדים אותו דבר',
        'tag מפנה את כל הרשומות שתוייגו (כל המשתמשים של פרויקט), ללא צורך לדעת כל מפתח; מפתח מדויק מחייב ידיעת ה-userId',
        'מפתח מדויק יעיל יותר',
        'tag לא נתמך ב-ASP.NET Core',
      ],
      answer: 1,
      explain:
        'מפתח cache ב-TaskForge = `(userId, projectId)`. ' +
        'לפנות לפי מפתח מדויק אחרי כתיבה — צריך לדעת אילו userIds יש להם cache לפרויקט זה. ' +
        '`EvictByTagAsync("stats-1")` מפנה את כל הרשומות שתוייגו `stats-1`, ' +
        'כולל כל המשתמשים, בקריאה אחת וללא ידיעה מוקדמת.',
    },
    {
      q: 'איזה טון toast מציג ה-`errorInterceptor` בתגובה ל-429, ומדוע?',
      options: [
        '\'danger\' — כי זו שגיאה',
        '\'warn\' — כי השרת חסם',
        '\'info\' — כי 429 אינה שגיאה אלא בקשה להאט; tone אינפורמטיבי לא מבהיל',
        '\'success\' — כי ה-rate limiter פעל כמצופה',
      ],
      answer: 2,
      explain:
        '429 Too Many Requests אומר: "קצב בקשותיך גבוה מדי — נסה שוב בעוד X שניות". ' +
        'זה לא כישלון של המשתמש ולא שגיאת שרת — זו הנחיה. ' +
        'toast אדום (`danger`) מבהיל ואינו מועיל; `info` מתאים: מציג זמן retry בלי לעורר חרדה.',
    },
    {
      q: 'מדוע `app.UseHsts()` מוגבל ל-`!app.Environment.IsDevelopment()`?',
      options: [
        'כי HSTS לא עובד ב-localhost',
        'כי בפיתוח על http://localhost, HSTS יוסיף header שמורה לדפדפן לדבר רק על HTTPS — מה שישבור את הפיתוח',
        'כי HSTS פועל רק ב-.NET 10',
        'כי HSTS מחייב תעודת SSL',
      ],
      answer: 1,
      explain:
        'HSTS מוסיף `Strict-Transport-Security: max-age=...` שמורה לדפדפן לדבר עם הדומיין רק על HTTPS. ' +
        'ב-Development, השרת רץ על `http://localhost:5080` (ללא TLS). ' +
        'אם HSTS היה פעיל, הדפדפן ינסה להתחבר ל-`https://localhost:5080` ויכשל. ' +
        'בפרודקשן עם TLS — HSTS חיוני ומגן מ-downgrade attacks.',
    },
    {
      q: 'כיצד `Jwt__Key` (קו תחתון כפול) הופך ל-`Jwt:Key` ב-configuration של .NET?',
      options: [
        'דרך קובץ mapping ייעודי',
        'Microsoft.Extensions.Configuration מחליף `__` ב-`:` בעת קריאת משתני סביבה, כדי לייצג היררכיה',
        'זה עובד רק ב-Linux',
        'צריך להגדיר זאת ב-`Program.cs`',
      ],
      answer: 1,
      explain:
        'מערכת ה-configuration של .NET קוראת משתני סביבה ומחליפה `__` ב-`:` ליצירת מפתחות היררכיים. ' +
        'כך `Jwt__Key=secret` ממפה ל-section `Jwt`, מפתח `Key`. ' +
        'זה עובד בכל הסביבות: Docker, Kubernetes, Azure App Service — ' +
        'מכיוון ש-`:` אינו תו חוקי במשתני סביבה ב-Linux.',
      },
  ],

  proveIt: [
    {
      title: 'אמתו compression: Content-Encoding: br',
      body:
        'הריצו שני-שרתים (API על http://localhost:5080). ' +
        'כנסו ל-`GET /api/auth/login` עם `demo@taskforge.dev / Passw0rd!` וקבלו access token. ' +
        'אחר כך: `GET /api/projects/1/stats` עם `Accept-Encoding: br, gzip` ו-`Authorization: Bearer <token>`.',
      command:
        'TOKEN=$(curl -s -X POST http://localhost:5080/api/auth/login -H "Content-Type: application/json" -d \'{"email":"demo@taskforge.dev","password":"Passw0rd!"}\' | jq -r .accessToken) && curl -sI http://localhost:5080/api/projects/1/stats -H "Authorization: Bearer $TOKEN" -H "Accept-Encoding: br, gzip"',
      expect:
        'כותרות התשובה כוללות `Content-Encoding: br` ו-`Vary: Accept-Encoding`. ' +
        'הגוף הוא JSON דחוס בפורמט Brotli.',
    },
    {
      title: 'אמתו OutputCache + eviction: X-Handler-Ms קפוא אחר-כך קופץ',
      body:
        'עם access token בידכם: שלחו `GET /api/projects/1/stats` פעמיים תוך 15 שניות. ' +
        'השוו את ה-`X-Handler-Ms` header. אחר-כך: צרו issue חדש. ' +
        'שלחו GET שלישי ובדקו שה-`total` קפץ ו-`X-Handler-Ms` שונה.',
      command:
        'TOKEN=... && curl -s http://localhost:5080/api/projects/1/stats -H "Authorization: Bearer $TOKEN" -H "Accept-Encoding: identity" -D - | grep -E "(X-Handler-Ms|total)"',
      expect:
        'GET ראשון (MISS): `X-Handler-Ms` עם ערך כלשהו, `total` = 60. ' +
        'GET שני (HIT תוך 15s): אותו `X-Handler-Ms` מוקפא — ה-handler לא רץ. ' +
        'לאחר `POST /api/projects/1/issues` (201), GET שלישי: `X-Handler-Ms` שונה, `total` = 61.',
    },
    {
      title: 'אמתו rate limiting: 429 אחרי 5 בקשות login',
      body:
        'שלחו 6 בקשות `POST /api/auth/login` ברצף מהיר עם אישורים שגויים. ' +
        'הבקשות 1–5 צריכות להחזיר 401 (אישורים שגויים). ' +
        'הבקשה ה-6 צריכה להחזיר 429.',
      command:
        'for i in $(seq 1 6); do echo "Request $i:"; curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:5080/api/auth/login -H "Content-Type: application/json" -d \'{"email":"x@x.com","password":"wrong"}\'; echo; done',
      expect:
        'בקשות 1–5: `401`. בקשה 6: `429` עם header `Retry-After: 30` ' +
        'וגוף `{"title":"Too many requests","detail":"Slow down and try again shortly."}`.',
    },
    {
      title: 'אמתו security headers: ארבע כותרות על כל תשובה',
      body:
        'שלחו `GET /` לשרת (endpoint ה-alive) וצפו בכותרות התשובה.',
      command: 'curl -sI http://localhost:5080/',
      expect:
        'כותרות: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, ' +
        '`Referrer-Policy: no-referrer`, `Content-Security-Policy: default-src \'none\'; frame-ancestors \'none\'`. ' +
        'כותרת `Strict-Transport-Security` אינה מופיעה (Development mode).',
    },
    {
      title: 'אמתו fail-fast: הפעלה ב-Production ללא Jwt:Key',
      body:
        'הריצו את ה-API עם `ASPNETCORE_ENVIRONMENT=Production` וללא `Jwt__Key`. ' +
        'ה-API צריך לקרוס ב-startup. ' +
        'הדגל `--no-launch-profile` הכרחי: בלעדיו `dotnet run` קורא את `launchSettings.json` ' +
        'שמכריח `ASPNETCORE_ENVIRONMENT=Development`, וה-dev key היה נטען ומסתיר את ה-fail-fast.',
      command:
        'cd reference/.build/ch23/server/TaskForge.Api && ASPNETCORE_ENVIRONMENT=Production dotnet run --no-launch-profile 2>&1 | head -20',
      expect:
        'תפוקה מכילה `System.InvalidOperationException: Jwt:Key is not configured. ' +
        'Provide it via user-secrets (dev) or the Jwt__Key environment variable (prod).` ' +
        'והתהליך יוצא עם שגיאה. ב-Development (ברירת המחדל) — האפליקציה עולה רגיל.',
    },
  ],

  exercise: {
    prompt:
      'הרחיבו את שכבת ה-caching: הוסיפו OutputCache על endpoint `/activity` ' +
      'עם TTL של 30 שניות ופינוי נפרד, ואז הוסיפו כותרת אבטחה נוספת לבחירתכם.',
    tasks: [
      'צרו policy חדש `"ActivityCache"` ב-`AddOutputCache` עם `StatsCachePolicy` (אפשר לשתף) ' +
        'או policy חדש עם TTL של 30 שניות ו-vary-by `(userId, projectId)`.',
      'הוסיפו tag `activity-{projectId}` ל-policy.',
      'ב-`DashboardEndpoints.cs`: הוסיפו `.CacheOutput("ActivityCache")` על `MapGet("/activity", GetActivity)`.',
      'ב-`IssueEndpoints.cs`: הוסיפו קריאת eviction ל-`activity-{projectId}` ב-`CreateIssue` (כי activity feed משתנה עם issue חדש).',
      'ב-`Program.cs`: הוסיפו כותרת `Permissions-Policy: geolocation=(), microphone=()` ב-middleware כותרות האבטחה.',
      'אמתו: GET `/activity` פעמיים — hit ב-30 שניות; צרו issue — GET שלישי הוא miss.',
    ],
    acceptance: [
      '`GET /api/projects/1/activity` עם handler timing filter: hit תוך 30 שניות — אותו `X-Handler-Ms`.',
      'אחרי `POST /api/projects/1/issues`: GET הבא ל-`/activity` הוא MISS (handler רץ מחדש).',
      '`curl -sI http://localhost:5080/` מחזיר `Permissions-Policy: geolocation=(), microphone=()`.',
      'build ירוק (`dotnet build` + `pnpm build`), אפס שגיאות.',
    ],
  },
};
