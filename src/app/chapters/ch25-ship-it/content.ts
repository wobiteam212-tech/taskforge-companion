import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 25 — Ship It: משחררים.
 * Wave 6. Packages TaskForge as production Docker images and automates every
 * manual gate from the book into a GitHub Actions pipeline.
 * Artifacts: server/Dockerfile, server/.dockerignore, client/Dockerfile,
 * client/.dockerignore, client/nginx.conf, docker-compose.yml, .env.example,
 * .github/workflows/ci.yml — config/yaml only, zero compiled code.
 */
export const CH25_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 25.1 */
    {
      id: '25.1',
      title: 'הפרק: מדע המחשב לפרודקשן',
      blocks: [
        {
          kind: 'p',
          text:
            'TaskForge עובד על המחשב שלך. עכשיו צריך שיעבוד על כל שרת, ' +
            'בלי "עובד אצלי", בלי "שכחתי להתקין". ' +
            'פרק 25 עושה בדיוק זאת: אורז את ה-API ואת ה-client בתוך Docker images, ' +
            'מחווט אותם ב-Compose, ומאמת שכל gate שהרצנו ידנית כל הספר רץ ' +
            'אוטומטית על כל push ו-PR דרך GitHub Actions.',
        },
        {
          kind: 'p',
          text:
            'חשוב: פרק זה לא מוסיף קוד TypeScript או C# חדש. ' +
            'הוא מוסיף שמונה קבצי תשתית — Dockerfiles, nginx, compose, env, ci.yml. ' +
            'הקוד כבר שלם; אנחנו לומדים כיצד לארוז אותו ולהפוך את הבדיקות ' +
            'לשומר-סף אוטומטי.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה Docker ולא "העלאה ישירה"?',
          body:
            'העלאה ישירה של קבצי DLL ופלט ng build דורשת שבשרת היעד יהיו ' +
            'אותן גרסאות של .NET, Node, ו-nginx — ואותן הגדרות. ' +
            'Docker מאחסן את כל אלה בתוך ה-image: מי שמריץ `docker compose up` ' +
            'מקבל בדיוק את הסביבה שבה הבדקנו. ' +
            '"Works on my machine" הופך ל-"works in the image".',
        },
        {
          kind: 'term',
          name: 'image (Docker)',
          definition:
            'תמונת-מצב לקריאה-בלבד של מערכת קבצים — שכבות של שינויים מוקפאים. ' +
            'בונים image מ-Dockerfile; מריצים אותו כ-container. ' +
            'image רב-שלבי (multi-stage) בונה בשלב כבד (SDK/Node) ומוציא רק את ' +
            'הפלט לשלב runtime רזה.',
        },
        {
          kind: 'term',
          name: 'container',
          definition:
            'מופע ריצה של image. בידוד תהליכים, רשת, ומערכת קבצים — ' +
            'ה-container לא "יודע" שיש לו שכנים אלא דרך הרשת ה-virtual של Compose. ' +
            'כשה-container נמחק, כל מה שכתב לשכבה שלו אובד — אלא אם משתמשים ב-volume.',
        },
        {
          kind: 'term',
          name: 'multi-stage build',
          definition:
            'טכניקת Dockerfile שמשתמשת ביותר מ-`FROM` אחד. שלב ה-build כולל ' +
            'את כל הכלים הכבדים (SDK, Node, pnpm); שלב ה-runtime מקבל רק את הפלט. ' +
            'ה-image הסופי לא נושא SDK, node_modules, או קוד מקור — קטן ובטוח יותר.',
        },
        {
          kind: 'term',
          name: 'CI/CD',
          definition:
            'Continuous Integration / Continuous Delivery. ' +
            'CI = כל commit עובר אוטומטית בדיקות + build; CD = הפלט מוכן לפריסה. ' +
            'ב-GitHub Actions: workflow מוגדר ב-.yml, רץ על runner מנוהל, ' +
            'ומחזיר "ירוק" (כל ה-jobs עברו) או "אדום" (אחד כשל — merge חסום).',
        },
        {
          kind: 'term',
          name: 'reverse proxy',
          definition:
            'שרת שמקבל בקשות מה-client ומעבירן לשירות הפנימי המתאים. ' +
            'ב-TaskForge: nginx הוא ה-reverse proxy — הוא מגיש את ה-SPA ומעביר ' +
            '`/api/` ו-`/hubs/` ל-API. החוץ רואה רק את nginx (פורט 4500).',
        },
        {
          kind: 'term',
          name: 'WebSocket upgrade',
          definition:
            'תהליך ה-HTTP שבו חיבור HTTP/1.1 רגיל עולה לחיבור WebSocket מתמשך. ' +
            'ב-nginx: `proxy_http_version 1.1` + כותרות `Upgrade` ו-`Connection "upgrade"` ' +
            'הם החיבורים שמאפשרים לנגנן SignalR של פרק 24 להחזיק חיבור WS דרך ה-proxy.',
        },
        {
          kind: 'term',
          name: 'docker-compose',
          definition:
            'כלי לתיאור ולהפעלה של סטאק מרובה-שירותים. `docker-compose.yml` ' +
            'מגדיר services, רשתות, volumes, ו-env — ו-`docker compose up --build` ' +
            'בונה את כולם ומריץ אותם כיחידה אחת.',
        },
        {
          kind: 'term',
          name: '12-factor config',
          definition:
            'עיקרון מ-12factor.net: קונפיגורציה (URLs, secrets, מפתחות) מגיעה ' +
            'מהסביבה (env vars), לא מקובצי קוד. ' +
            'ב-TaskForge: `Jwt__Key` ו-`ConnectionStrings__Default` מגיעים מ-Compose/env, ' +
            'לא מ-appsettings. הקוד זהה בכל סביבה; רק הסביבה משתנה.',
        },
        {
          kind: 'term',
          name: 'volume',
          definition:
            'מנגנון Docker לאחסון מתמשך מחוץ לשכבה הארעית של ה-container. ' +
            'ב-TaskForge: `taskforge-data` הוא named volume שמחזיק את ה-SQLite DB — ' +
            'rebuild/restart של הקונטיינר לא מוחק את הנתונים.',
        },
        {
          kind: 'term',
          name: 'layer cache',
          definition:
            'Docker שומר כל שכבת build. שכבה שמקבל אותם קלטים (אותם קבצים) ' +
            'נשמרת מ-build קודם וה-step מדולג. ' +
            'לכן ה-Dockerfile מעתיק קודם קבצי `.csproj`/`package.json` ורצ restore ' +
            'לפני העתקת שאר הקוד — אם רק הקוד השתנה, שכבת ה-restore משוחררת מ-cache.',
        },
      ],
      panel: {
        kind: 'filetree',
        title: 'שמונה קבצי תשתית — כל הסטאק',
        lines: [
          { text: 'reference/ch25/', depth: 0, kind: 'dir' },
          { text: 'server/', depth: 1, kind: 'dir' },
          { text: 'Dockerfile', depth: 2, kind: 'file', badge: 'new' },
          { text: '.dockerignore', depth: 2, kind: 'file', badge: 'new' },
          { text: 'client/', depth: 1, kind: 'dir' },
          { text: 'Dockerfile', depth: 2, kind: 'file', badge: 'new' },
          { text: '.dockerignore', depth: 2, kind: 'file', badge: 'new' },
          { text: 'nginx.conf', depth: 2, kind: 'file', badge: 'new' },
          { text: 'docker-compose.yml', depth: 1, kind: 'file', badge: 'new' },
          { text: '.env.example', depth: 1, kind: 'file', badge: 'new' },
          { text: '.github/', depth: 1, kind: 'dir' },
          { text: 'workflows/', depth: 2, kind: 'dir' },
          { text: 'ci.yml', depth: 3, kind: 'file', badge: 'new' },
        ],
        caption:
          'אפס קוד TypeScript או C# — רק תשתית. ' +
          'server/Dockerfile + server/.dockerignore (שלבים 25.2–25.3), ' +
          'client/Dockerfile + client/.dockerignore + client/nginx.conf (שלבים 25.4–25.5), ' +
          'docker-compose.yml + .env.example (שלב 25.6), ' +
          '.github/workflows/ci.yml (שלב 25.7).',
      },
    },

    /* ------------------------------------------------------------ 25.2 */
    {
      id: '25.2',
      title: '`server/Dockerfile`: multi-stage לשרת ה-API',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-Dockerfile של השרת הוא שני שלבים ב-FROM אחד אחרי השני. ' +
            'שלב ה-build: `mcr.microsoft.com/dotnet/sdk:10.0` — image שמכיל את ' +
            'כל ה-SDK המלא: קומפיילר, dotnet-restore, dotnet-publish. ' +
            'שלב ה-runtime: `mcr.microsoft.com/dotnet/aspnet:10.0` — image רזה ' +
            'שמכיל רק את מה שדרוש להרצת DLLים; אין SDK, אין כלי build.',
        },
        {
          kind: 'p',
          text:
            'הטריק הקריטי: בשלב ה-build מעתיקים קודם את כל קבצי ה-`.csproj` ' +
            'ואת `TaskForge.slnx`, ואז `dotnet restore`. ' +
            'רק אחר-כך מעתיקים את שאר הקוד ומריצים `dotnet publish`. ' +
            'כך Docker יכול לשמור את שכבת ה-restore ב-cache: כל עוד התלויות ' +
            'לא השתנו, הריצה הבאה מדלגת על שלב ה-restore כולו.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'מדוע `EXPOSE 8080` ולא `EXPOSE 5080` שמשתמשים בו בפיתוח?',
          body:
            'בפיתוח השרת רץ ישירות על המחשב שלך על פורט 5080. ' +
            'בתוך Docker, הקונטיינר חי ברשת virtual פרטית; ' +
            'הפורט "הרגיל" ל-HTTP ב-containers הוא 8080. ' +
            '`EXPOSE 8080` הוא הצהרה (לא פתיחה אוטומטית) לאיזה פורט השרת מאזין. ' +
            '`ENV ASPNETCORE_URLS=http://+:8080` הוא מה שבאמת מגדיר לאיזה פורט Kestrel מאזין.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה יקרה אם נשכח לעתיק את קבצי `.csproj` לפני `dotnet restore`?',
          body:
            'Docker מבצע layer caching לפי hash של הקלטים לכל שלב. ' +
            'אם מעתיקים את כל הקוד ב-`COPY . .` לפני restore, ' +
            'כל שינוי בקוד — גם בקובץ `.cs` שאינו משנה את התלויות — ' +
            'יוביל ל-cache miss ו-restore מחדש מהרשת. ' +
            'העתקת `.csproj` קודם מבודדת את שכבת ה-restore: cache-miss רק כשהתלויות משתנות.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'image ה-runtime: SDK לא נכנס',
          body:
            'ב-`FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime`: שם image שונה מ-sdk. ' +
            '`aspnet` (לא `sdk`) מכיל את ה-runtime בלבד — csc.exe, dotnet-restore, כלי הbuild ' +
            'לא קיימים. ה-image הסופי קטן יותר, ומשטח-התקיפה שלו קטן יותר: ' +
            'אין כלי שיכולים לשמש לבניית קוד זדוני בתוך הקונטיינר.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch25',
        file: 'server/Dockerfile',
        region: 'step-25.2',
        title: 'server/Dockerfile — multi-stage: sdk build + aspnet runtime',
      },
    },

    /* ------------------------------------------------------------ 25.3 */
    {
      id: '25.3',
      title: '`server/.dockerignore`: מה לא נכנס ל-build context',
      blocks: [
        {
          kind: 'p',
          text:
            'לפני ש-Docker מריץ `docker build`, הוא שולח את כל ה-"build context" — ' +
            'ספרייה שמכילה את כל הקבצים שהוא יכול להעתיק — לה-daemon. ' +
            'ה-`.dockerignore` מונע מ-context לכלול קבצים מיותרים: ' +
            'תיקיות `bin/` ו-`obj/` (פלט build מקומי), תיקיית `.vs/` (IDE), ' +
            'וכל קבצי `.db`, `.db-shm`, `.db-wal` (ה-SQLite המקומי).',
        },
        {
          kind: 'p',
          text:
            'שניים מהפריטים בקובץ חשובים במיוחד: ' +
            '`**/bin` ו-`**/obj` מונעים שפלט build ישן ייכנס ל-image ויצור ' +
            'חוסר-עקביות בין מה שה-Docker build מייצר לבין מה שהיה קיים מקומית. ' +
            '`*.db` מונע שה-SQLite המקומי עם הנתונים האישיים שלך ייכנס ל-image.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'build context גדול = build איטי + דליפת מידע',
          body:
            'בלי `.dockerignore`, `docker build` שולח את כל `bin/`, `obj/`, ו-`taskforge.db` ' +
            'ל-daemon לפני כל build. זה מאיט את ה-build, מגדיל את ה-image, ' +
            'ואם ה-image מועלה ל-registry ציבורי — חושף נתונים מקומיים. ' +
            'הכלל: כל Dockerfile זקוק ל-`.dockerignore` לצדו.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch25',
        file: 'server/.dockerignore',
        region: 'step-25.2b',
        title: 'server/.dockerignore — מוחרג: bin, obj, .vs, קבצי SQLite מקומיים',
      },
    },

    /* ------------------------------------------------------------ 25.4 */
    {
      id: '25.4',
      title: '`client/Dockerfile`: multi-stage לאפליקציית Angular',
      blocks: [
        {
          kind: 'p',
          text:
            'גם ה-client עובר multi-stage. שלב ה-build: `node:22-alpine` — ' +
            'image Node.js רזה. מפעילים `corepack enable` ואחר כך ' +
            '`corepack prepare pnpm@10.28.0 --activate` לוודא pnpm בדיוק באותה גרסה ' +
            'כמו ב-CI (ולא גרסה חדשה שעלולה לשנות התנהגות). ' +
            'אחר כך: `pnpm install` ואז `pnpm exec ng build`.',
        },
        {
          kind: 'p',
          text:
            'שלב ה-runtime: `nginx:alpine`. ' +
            'הוא מקבל שני העתקות מ-`COPY --from=build`: ' +
            'ראשית את `nginx.conf` ל-`/etc/nginx/conf.d/default.conf`, ' +
            'ואחר כך את פלט ה-ng build — שחי ב-`dist/taskforge-client/browser` — ' +
            'ל-`/usr/share/nginx/html`. ' +
            'ה-image הסופי לא מכיל Node, pnpm, `node_modules`, או קוד TypeScript.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'מדוע `COPY package.json ./` לפני `pnpm install`?',
          body:
            'אותה טכניקה כמו ב-server: `package.json` מגדיר את התלויות. ' +
            'אם מעתיקים אותו לפני `pnpm install` ואחר כך את שאר הקוד, ' +
            'שינוי ב-`app.component.ts` לא יוביל ל-cache miss על שכבת ה-install. ' +
            '`pnpm install` רץ מחדש רק כשה-`package.json` עצמו משתנה.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה נמצא ב-`dist/taskforge-client/browser` ולא ב-`dist/taskforge-client`?',
          body:
            'Angular builder עם SSR או prerendering מייצר תיקיות `browser/` ו-`server/` ' +
            'בנפרד. גם בבuild סטנדרטי ללא SSR Angular 17+ שם את ה-static output ' +
            'תחת `browser/`. ' +
            '`COPY --from=build /app/dist/taskforge-client/browser /usr/share/nginx/html` ' +
            'מעתיק בדיוק את תיקיית ה-browser — לא את ה-wrapper החיצוני.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch25',
        file: 'client/Dockerfile',
        region: 'step-25.4',
        title: 'client/Dockerfile — node:22-alpine build + nginx:alpine runtime',
      },
    },

    /* ------------------------------------------------------------ 25.5 */
    {
      id: '25.5',
      title: '`client/.dockerignore`: מה לא נכנס ל-build context של ה-client',
      blocks: [
        {
          kind: 'p',
          text:
            'שלושה פריטים: `node_modules`, `dist`, `.angular`. ' +
            'כולם נבנים מחדש בתוך ה-Docker image; שליחתם ל-context רק מאיטה את ה-build ' +
            'ועלולה לגרום לחוסר-עקביות בין מה שנבנה מקומית לבין מה ש-Docker בונה בעצמו.',
        },
        {
          kind: 'p',
          text:
            '`node_modules` הוא הפריט הקריטי ביותר: הוא יכול לשקול מאות MB, ' +
            'וה-symlinks ו-hard links שבתוכו עשויים להתנהג אחרת על filesystem שונה. ' +
            '`pnpm install` בתוך ה-image מייצר `node_modules` נקי ועקבי.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'שכחת `.angular/` ב-`.dockerignore`: build ארוך מהצפוי',
          body:
            '`.angular/` מכיל cache של Angular compiler — עשויה להגיע ל-GB אחד. ' +
            'אם לא תסנן אותה, `docker build` ישלח אותה כולה ל-daemon בכל פעם. ' +
            'על machines עם cache ישנה, ה-`ng build` בתוך ה-image יכול גם להתנגש ' +
            'עם ה-cache החיצוני שהועתק פנימה. תמיד כלול `.angular` ב-`.dockerignore`.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch25',
        file: 'client/.dockerignore',
        region: 'step-25.4b',
        title: 'client/.dockerignore — מוחרג: node_modules, dist, .angular',
      },
    },

    /* ------------------------------------------------------------ 25.6 */
    {
      id: '25.6',
      title: '`client/nginx.conf`: SPA fallback, API proxy, WebSocket upgrade',
      blocks: [
        {
          kind: 'p',
          text:
            'nginx ב-client container עושה שלושה דברים. ' +
            'ראשית: `location /` עם `try_files $uri $uri/ /index.html` — SPA fallback. ' +
            'כשמשתמש מנווט ל-`/projects/1/board`, nginx מחפש קובץ בשם זה, ' +
            'לא מוצא, ומחזיר `index.html`. Angular router מטפל בנתיב בצד הלקוח. ' +
            'בלי זה כל deep link היה מחזיר 404.',
        },
        {
          kind: 'p',
          text:
            'שנית: `location /api/` עם `proxy_pass http://api:8080` — ' +
            'כל בקשת REST מועברת ל-API container (ששמו ברשת ה-compose הוא `api`). ' +
            'שלישית: `location /hubs/` עם אותו proxy_pass, ' +
            'אבל עם `proxy_http_version 1.1` ושתי כותרות קריטיות: ' +
            '`proxy_set_header Upgrade $http_upgrade` ו-`proxy_set_header Connection "upgrade"`. ' +
            'זהו ה-WebSocket upgrade: בלעדיו SignalR של פרק 24 לא יכול להחזיק חיבור WS דרך nginx.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'תופעת לוואי: ה-CORS מפרק 11 הופך מיותר בפרודקשן',
          body:
            'בפיתוח: client על פורט 4500, API על 5080 — שני origins שונים, CORS נדרש. ' +
            'בפרודקשן (דרך nginx): client ו-API חולקים origin אחד (הכול דרך nginx:4500). ' +
            'הדפדפן לא שולח preflight על same-origin — ה-CORS שהגדרנו בפרק 11 ' +
            'לא נדרש ולא מפריע. הוא נשאר בקוד לפיתוח; בפרודקשן הוא פשוט לא מופעל.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה `proxy_read_timeout 1h` עושה ולמה הוא דרוש ל-SignalR?',
          body:
            'nginx מנתק חיבורים שלא העבירו תוכן זמן רב. ' +
            'ברירת המחדל היא 60 שניות — מספיקה לבקשות REST, לא לחיבורי WebSocket שיכולים ' +
            'לחיות שעות ללא תעבורה (רק heartbeat SignalR אחת לכמה עשרות שניות). ' +
            '`proxy_read_timeout 1h` מונע מ-nginx לנתק WS connections עצלים שבאמת חיים.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch25',
        file: 'client/nginx.conf',
        region: 'step-25.5',
        title: 'client/nginx.conf — SPA fallback + /api/ proxy + /hubs/ WebSocket upgrade',
      },
    },

    /* ------------------------------------------------------------ 25.7 */
    {
      id: '25.7',
      title: '`docker-compose.yml`: ה-api service',
      blocks: [
        {
          kind: 'p',
          text:
            '`docker-compose.yml` מגדיר שני services ו-volume אחד. ' +
            'ה-`api` service: `build: ./server` — Docker מחפש `./server/Dockerfile`. ' +
            'תחת `environment`: שלושה משתנים. ' +
            '`ASPNETCORE_ENVIRONMENT=Production` מגדיר את סביבת .NET. ' +
            '`Jwt__Key=${JWT_KEY}` — ה-`${JWT_KEY}` נקרא מקובץ `.env` בספרייה הנוכחית; ' +
            'זהו הסוד שלמדנו בפרק 23 לא לשמור בקוד.',
        },
        {
          kind: 'p',
          text:
            'המשתנה השלישי: `ConnectionStrings__Default=Data Source=/data/taskforge.db`. ' +
            'ה-SQLite DB יושב על `/data/taskforge.db` — שזה ה-path בתוך ה-volume. ' +
            'ה-`volumes: - taskforge-data:/data` ממפה את ה-named volume `taskforge-data` ' +
            'לתיקייה `/data` בתוך הקונטיינר. ' +
            'כך rebuild של ה-container (למשל עדכון קוד) לא מוחק את הנתונים.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'חיבור בין פרק 23 לפרק 25: fail-fast ו-`Jwt__Key`',
          body:
            'בפרק 23 הגדרנו fail-fast: אם `Jwt__Key` חסר ב-startup, השרת לא עולה. ' +
            'כאן ה-Compose מספק אותו דרך `${JWT_KEY}` מה-`.env`. ' +
            'אם שכחת ליצור `.env` עם ה-key, `docker compose up` יפעיל את ה-container, ' +
            'השרת יכשל ב-startup ה-first, ו-Compose ידווח שה-api exited. ' +
            'הfail-fast שכתבנו הופך לפידבק מוקדם גם בהפעלת Compose.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה `taskforge-data` הוא named volume ולא bind mount?',
          body:
            'bind mount (`./data:/data`) קושר לתיקייה ספציפית על הhost. ' +
            'זה מתאים לפיתוח אבל לא לפרודקשן: הhost אמור להיות stateless. ' +
            'named volume מנוהל על ידי Docker daemon, ניתן לbackup ולגיבוי, ' +
            'ואינו תלוי במבנה הספריות של הhost. ' +
            'ב-`docker compose down` הוא לא נמחק — רק `docker compose down -v` מוחק.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch25',
        file: 'docker-compose.yml',
        region: 'step-25.6',
        title: 'docker-compose.yml — api: Jwt__Key מ-env, SQLite על named volume',
      },
    },

    /* ------------------------------------------------------------ 25.8 */
    {
      id: '25.8',
      title: '`docker-compose.yml`: ה-client service, volume ורשת',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-`client` service: `build: ./client` — Docker מחפש `./client/Dockerfile`. ' +
            '`ports: - "4500:80"` ממפה פורט 4500 של ה-host לפורט 80 של nginx בתוך הקונטיינר. ' +
            'החוץ רואה רק את ה-client על פורט 4500; הapi אינו חשוף ישירות לאינטרנט. ' +
            '`depends_on: - api` מבטיח שה-api container יהיה מוכן לפני שה-client עולה.',
        },
        {
          kind: 'p',
          text:
            'בתחתית הקובץ: `volumes: taskforge-data:` (שורה ריקה אחרי השם) — ' +
            'הצהרה שה-volume הזה הוא named volume מנוהל על ידי Docker. ' +
            'Compose יוצר אותו אוטומטית בפעם הראשונה. ' +
            'הרשת בין `api` ל-`client` נוצרת אוטומטית על ידי Compose — ' +
            'לכן nginx יכול ל-proxy אל `http://api:8080` בשמו.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'מדוע ה-`api` אינו חושף ports ישירות?',
          body:
            'ב-`docker-compose.yml`: ל-`api` אין `ports:`. ' +
            'רק ה-`client` (nginx) חושף פורט 4500 לחוץ. ' +
            'ה-api נגיש רק מהרשת הפנימית של Compose, כלומר רק מה-nginx. ' +
            'זה עיקרון הגנה בשכבות: ה-client הוא פאסאד; ' +
            'מי שרוצה לגשת ל-API חייב לעבור דרכו.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch25',
        file: 'docker-compose.yml',
        region: 'step-25.6',
        title: 'docker-compose.yml — client: ports 4500:80, depends_on api, named volume',
      },
    },

    /* ------------------------------------------------------------ 25.9 */
    {
      id: '25.9',
      title: '`.env.example`: הסוד שלא נכנס ל-git',
      blocks: [
        {
          kind: 'p',
          text:
            '`.env.example` הוא תבנית ציבורית שנכנסת ל-git. ' +
            'הוא מכיל שורה אחת: `JWT_KEY=replace-with-a-long-random-production-signing-key`. ' +
            'הפריסה הראשונה: מעתיקים ל-`.env`, ממלאים ערך אמיתי וארוך. ' +
            '`.env` עצמו נכנס ל-`.gitignore` ולא עולה ל-repo.',
        },
        {
          kind: 'p',
          text:
            'בפרודקשן אמיתי, `.env` יכול להיות מוחלף ב-secret manager (GitHub Secrets, ' +
            'AWS Secrets Manager, Vault). Compose תומך ב-`secrets:` כחלופה ל-`env`. ' +
            'אבל עיקרון 12-factor נשמר בכל מקרה: הסוד מגיע מהסביבה, ' +
            'לא מה-image ולא מה-code.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'secret ב-image = דליפה לכל מי שמוריד אותו',
          body:
            'אם `Jwt__Key` היה מוקשה ב-`appsettings.json` (או אפילו ב-Dockerfile), ' +
            'הוא היה חלק מה-image. כל מי שמוריד את ה-image מ-registry ' +
            'יכול לחלץ אותו עם `docker run --entrypoint cat image /app/appsettings.json`. ' +
            '`${JWT_KEY}` מ-env: ה-image עצמו לא מכיל את הסוד — רק בעל ה-env יודע אותו.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'כיצד מייצרים `JWT_KEY` חזק?',
          body:
            'ב-bash/PowerShell: `openssl rand -base64 64` מייצר 64 בתים אקראיים ב-base64. ' +
            'זה מספיק לכל אלגוריתם HMAC-SHA256 או RSA. ' +
            'ב-GitHub Actions: מגדירים כ-Repository Secret (Settings -> Secrets) ' +
            'ומשתמשים ב-`${{ secrets.JWT_KEY }}` ב-yaml.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch25',
        file: '.env.example',
        region: 'step-25.6b',
        title: '.env.example — תבנית: JWT_KEY נקרא מ-env, לא מה-image',
      },
    },

    /* ------------------------------------------------------------ 25.10 */
    {
      id: '25.10',
      title: '`ci.yml`: GitHub Actions — triggers ו-setup',
      blocks: [
        {
          kind: 'p',
          text:
            'הCI מוגדר ב-`.github/workflows/ci.yml`. ' +
            'הבלוק `on:` מגדיר שני triggers: `push: branches: [main]` ' +
            'ו-`pull_request:` (כל PR על כל branch). ' +
            'כלומר: כל commit שנדחף ל-main, וכל PR שנפתח, מפעיל את ה-workflow. ' +
            'PR ירוק = מותר למזג; PR אדום = merge חסום.',
        },
        {
          kind: 'p',
          text:
            'ה-job `verify` רץ על `ubuntu-latest` — runner מנוהל של GitHub. ' +
            'שלבי ה-setup: `actions/checkout@v4` מוריד את ה-code, ' +
            '`actions/setup-dotnet@v4` עם `dotnet-version: "10.0.x"` מתקין .NET, ' +
            '`pnpm/action-setup@v4` עם `version: 10.28.0` מתקין pnpm, ' +
            'ו-`actions/setup-node@v4` עם `node-version: 22` ו-`cache: pnpm` מתקין Node ' +
            'ומפעיל cache של pnpm store.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'גרסאות מדויקות: `10.28.0` ולא `latest`',
          body:
            'ה-`pnpm/action-setup` מקבל `version: 10.28.0` — גרסה מדויקת, לא `latest`. ' +
            'זהו אותו עיקרון של `corepack prepare pnpm@10.28.0` ב-Dockerfile: ' +
            'lockfile עם gרסה מדויקת. CI שמשתמש ב-`latest` עשוי לשבור כאשר ' +
            'pnpm מוציא גרסה חדשה עם שינויי התנהגות.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch25',
        file: '.github/workflows/ci.yml',
        region: 'step-25.7',
        title: 'ci.yml — on: push/PR + setup: dotnet 10 + pnpm 10.28.0 + Node 22',
      },
    },

    /* ------------------------------------------------------------ 25.11 */
    {
      id: '25.11',
      title: '`ci.yml`: ה-gates — הצינור שהכרנו',
      blocks: [
        {
          kind: 'p',
          text:
            'אחרי ה-setup: `pnpm install`, ואז ה-gates בדיוק בסדר שהרצנו אותם לאורך כל הספר. ' +
            '`pnpm gen:manifest` מחדש את קובץ ה-manifest מהsnapshots. ' +
            '`pnpm verify:coverage` מוודא שכל קובץ בsnapshot מלמד על-ידי פרק. ' +
            '`pnpm test` מריץ את `content-rules.spec.ts` — unique step ids, ban-arrows, quiz integrity. ' +
            '`pnpm build` בונה את האפליקציה.',
        },
        {
          kind: 'p',
          text:
            'ה-gate האחרון והכבד: `pnpm verify:snapshots`. ' +
            'הוא מממש את ה-snapshot, בונה כל milestone: ' +
            '`dotnet build`/`dotnet test` לכל מיילסטון C#, ' +
            '`ng build`/`ng test` לכל מיילסטון Angular. ' +
            'זו ההבטחה של הספר: "בנו פרק אחרי פרק — הכל מתקמפל". ' +
            'ה-CI מוכיח את ההבטחה על כל commit.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה מונע ממישהו למזג PR שבורה את ה-snapshots?',
          body:
            'בלי CI: כלום. הbranch protection rules ב-GitHub יכולות לדרוש שכל ' +
            '"required status check" יהיה ירוק לפני merge. ' +
            'הגדרה: Settings -> Branches -> Branch protection rule -> ' +
            '"Require status checks to pass before merging" -> בחירת ה-job `verify`. ' +
            'עם זאת הגדרה, GitHub חוסם את כפתור Merge עד שה-CI ירוק.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'מדוע `verify:snapshots` הוא ה-gate האחרון ולא הראשון?',
          body:
            'הוא ה-gate הכי איטי (בונה ובודק עשרות חבילות). ' +
            'כשה-gates מסודרים מהמהיר לאיטי, gate מהיר שנכשל חוסך את הזמן של כל ה-gates שאחריו. ' +
            'אם `pnpm test` נכשל (שניות), אין סיבה לחכות ל-`verify:snapshots` (דקות). ' +
            'זה עיקרון "fail fast, fail cheap" בצינור CI.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch25',
        file: '.github/workflows/ci.yml',
        region: 'step-25.7',
        title: 'ci.yml — 6 gates: gen:manifest, verify:coverage, test, build, verify:snapshots',
      },
    },

    /* ------------------------------------------------------------ 25.12 */
    {
      id: '25.12',
      title: 'הדמו: ה-gates כצינור',
      blocks: [
        {
          kind: 'p',
          text:
            'הדמו מממש ויזואלית את ה-CI pipeline. ' +
            'לחיצה על "Run pipeline" מריצה את ששת ה-gates בתורם: ' +
            '`pnpm install`, `gen:manifest`, `verify:coverage`, `test`, `build`, `verify:snapshots`. ' +
            'כל gate מאיר ירוק כשהוא עובר; הבא מתחיל רק כשהקודם הסתיים בהצלחה.',
        },
        {
          kind: 'p',
          text:
            'ה-toggle "break a test" מדמה כישלון בשלב ה-`test`: ' +
            'הוא מאדים ועוצר את הצינור — כל ה-gates שאחריו מקבלים סטטוס "skipped". ' +
            'פסק-הדין: "red — merge blocked". ' +
            'זהו בדיוק ה-mental model של CI: אדום אחד חוסם את הכל שאחריו.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'ה-gates שרצת לאורך הספר = הצינור',
          body:
            'כל gate ב-CI הוא פקודה שהרצת בטרמינל בסוף כל פרק. ' +
            'ה-CI לא מוסיף לוגיקה חדשה — הוא רק אוטומט את מה שעשית ידנית. ' +
            'ההבדל: בפיתוח ידני אפשר לשכוח gate; ב-CI לא יוצאים בלי ירוק על כולם.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () =>
          import('./demos/ci-pipeline.demo').then((m) => m.CiPipelineDemo),
        caption:
          'ה-gates כצינור: Run ירוק משמאל לימין; "break a test" עוצר אדום ומסמן skipped לכל מה שאחריו',
      },
    },

    /* ------------------------------------------------------------ 25.13 */
    {
      id: '25.13',
      title: 'Mental model: Docker + Compose + CI כמכלול',
      blocks: [
        {
          kind: 'p',
          text:
            'שלושה כלים, שלוש שאלות שונות. ' +
            'Docker עונה: "איך אורזים אפליקציה שתרוץ בכל מקום?" — images ו-multi-stage build. ' +
            'Compose עונה: "איך מחווטים כמה services יחד?" — רשת, volumes, env, depends_on. ' +
            'CI עונה: "איך מוודאים שה-code תמיד שביר?" — pipeline אוטומטי על כל commit.',
        },
        {
          kind: 'p',
          text:
            'ביחד: Compose בונה את ה-images בעזרת ה-Dockerfiles, Compose מריץ אותם, ' +
            'ו-CI מוודא שהbuild תמיד ירוק לפני שמזגים קוד חדש. ' +
            'ה-nginx שמחווט ב-Compose הוא גם ה-reverse proxy שמאפשר WebSocket, ' +
            'שמחייב גם את הSPA fallback, שמוודא שפרק 11 (CORS) הופך מיותר בפרודקשן.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'אם pipeline נשבר — מה הצעד הראשון?',
          body:
            'ראשית: בדוק איזה gate נכשל (הצינור עוצר בראשון שנכשל). ' +
            'אם `pnpm test`: קרא את הפלט של `content-rules.spec.ts` — בדרך כלל arrow, unique-id, או region חסר. ' +
            'אם `pnpm verify:coverage`: קובץ בsnapshot לא מוזכר בפרק — הוסף panel. ' +
            'אם `pnpm build`: שגיאת TypeScript/template — תקן. ' +
            'אם `pnpm verify:snapshots`: `dotnet build` נכשל ב-snapshot מסוים — קרא את הoutput של ה-MSBuild.',
        },
        {
          kind: 'callout',
          tone: 'dotnet10',
          title: 'SDK image 10.0 + aspnet image 10.0: LTS עד 2027',
          body:
            'שני ה-base images (`mcr.microsoft.com/dotnet/sdk:10.0` ו-`mcr.microsoft.com/dotnet/aspnet:10.0`) ' +
            'הם LTS (.NET 10 Long Term Support עד מאי 2027). ' +
            'Microsoft מפרסמת patch images אוטומטית — tag `10.0` תמיד מצביע על הpatch האחרון. ' +
            'כדי לקבל patches: רק `docker pull` מחדש ו-rebuild.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `graph TD
  subgraph "CI pipeline (GitHub Actions)"
    A[push / PR] --> B[pnpm install]
    B --> C[gen:manifest]
    C --> D[verify:coverage]
    D --> E[test]
    E --> F[build]
    F --> G[verify:snapshots]
    G --> H{ירוק?}
    H -- כן --> I[merge OK]
    H -- לא --> J[merge חסום]
  end
  subgraph "Production (Docker Compose)"
    K[client:80] -- proxy /api/ --> L[api:8080]
    K -- proxy /hubs/ WebSocket --> L
    L -- volume --> M[(taskforge-data)]
  end`,
        caption:
          'CI מגן על ה-repo; Compose מריץ את הסטאק. nginx מחווט ביניהם ב-runtime.',
      },
    },

    /* ------------------------------------------------------------ 25.14 */
    {
      id: '25.14',
      title: 'סיכום: ה-seams משתלמים עד הסוף',
      blocks: [
        {
          kind: 'p',
          text:
            'לאורך הספר בנינו seams: `IBoardNotifier`, `IProjectRepository`, ' +
            '`IOutputCacheStore`, functional interceptors. ' +
            'פרק 25 לא מוסיף seams — הוא מראה שהם כבר שם. ' +
            'ה-`Jwt__Key` שנקרא מה-env עובר בדיוק דרך המנגנון שהגדרנו בפרק 23 (fail-fast). ' +
            'ה-WebSocket שנשמר ב-nginx עובר בדיוק דרך `/hubs/` שמיפינו בפרק 24.',
        },
        {
          kind: 'p',
          text:
            'ה-Dockerfiles הם תיעוד חי: הם מראים בדיוק איזה SDK דרוש, ' +
            'איזה gרסה, ואיזה פלט נוצר. ' +
            'מפתח חדש שמגיע לפרויקט לא צריך לקרוא README ארוך — ' +
            'הוא מריץ `docker compose up --build` ומקבל את כל הסטאק על המחשב שלו.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ההבדל בין `docker compose up` ל-`docker compose up --build`?',
          body:
            '`docker compose up` מריץ containers קיימים (images שנבנו בפעם הקודמת). ' +
            '`docker compose up --build` בונה מחדש את כל ה-images לפני הרצה — ' +
            'מבטיח שהקוד החדש קיים ב-image. ' +
            'לאחר שינויים בקוד: תמיד `--build`. ' +
            'לאחר שינוי ב-`.env` בלבד (ללא שינוי קוד): `up` בלי `--build` מספיק.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'הספר נגמר; הבסיס נשאר',
          body:
            'TaskForge עם Docker + CI הוא תשתית אמיתית. ' +
            'שלבים הבאים: הוסיפו health-check ל-api service ב-Compose, ' +
            'הגדירו branch protection rules ב-GitHub שמחייבות ירוק לפני merge, ' +
            'שקלו Kubernetes (k8s) כשצריך scale מעבר לserver אחד. ' +
            'כל אלה בנויים מאותם עקרונות: images, env-config, pipeline.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch25',
        title: 'מצב הסטאק המלא — סוף פרק 25',
      },
    },
  ],

  quiz: [
    {
      q: 'מדוע ב-`server/Dockerfile` מעתיקים קודם את קבצי ה-`.csproj` ומריצים `dotnet restore`, ורק אחר כך `COPY . .`?',
      options: [
        'כי Docker דורש זאת כדי להפעיל multi-stage',
        'כדי שרק שינוי בתלויות ה-NuGet יוביל ל-cache miss על שלב ה-restore — שינוי בקוד C# בלבד ישתמש ב-cached restore layer',
        'כי `dotnet restore` לא יודע לעבוד עם קוד מלא',
        'כדי לצמצם את גודל ה-image',
      ],
      answer: 1,
      explain:
        'Docker שומר כל שכבה ב-cache לפי hash של הקלטים. ' +
        'העתקת `.csproj` לפני `dotnet restore` יוצרת שכבה שה-hash שלה ' +
        'משתנה רק כש-`.csproj` משתנה (תלויות חדשות). ' +
        'שינוי ב-`.cs` לא משנה את הhash של שכבת ה-restore, ' +
        'ולכן ה-restore משוחרר מcache ו-build מהיר בהרבה.',
    },
    {
      q: 'מדוע `client/nginx.conf` זקוק לשלוש הכותרות `proxy_http_version 1.1`, `Upgrade`, ו-`Connection "upgrade"` ב-`location /hubs/`?',
      options: [
        'כדי לאפשר CORS',
        'כדי שה-nginx יוכל לעבד JSON מה-hub',
        'כי WebSocket דורש upgrade של החיבור מ-HTTP/1.1 — בלי כותרות אלה nginx לא מעביר WebSocket ו-SignalR של פרק 24 לא יחזיק חיבור',
        'כדי להגביל את זמן ה-timeout',
      ],
      answer: 2,
      explain:
        'חיבור WebSocket מתחיל ב-HTTP/1.1 `Upgrade` handshake. ' +
        'nginx כ-reverse proxy חייב להעביר את ה-upgrade request לאחור לשרת. ' +
        'בלי `proxy_http_version 1.1` הוא ישתמש ב-HTTP/1.0 שלא תומך ב-Upgrade; ' +
        'בלי `proxy_set_header Upgrade $http_upgrade` הכותרת לא תועבר; ' +
        'בלי `proxy_set_header Connection "upgrade"` החיבור לא ישודרג. ' +
        'ה-SignalR של פרק 24 יתנגש לlong-polling מאחר שה-WS upgrade ייכשל.',
    },
    {
      q: 'מה קורה לנתוני ה-SQLite כאשר מריצים `docker compose down` ואחר כך `docker compose up --build`?',
      options: [
        'הנתונים נמחקים כי ה-container נמחק',
        'הנתונים נשמרים ב-named volume `taskforge-data` שנמשך בין restart/rebuild של containers',
        'הנתונים נשמרים בתוך ה-image',
        'הנתונים עוברים ל-.env',
      ],
      answer: 1,
      explain:
        '`docker compose down` מוחק containers ורשתות אבל לא named volumes. ' +
        'ה-SQLite DB נשמר ב-`taskforge-data` volume שחי מחוץ לshכבת הcontainer. ' +
        'rebuild ו-restart של `api` container לא נוגע ב-volume — ' +
        'הDB נגיש שוב כי ה-mount `/data` ממפה לאותו volume. ' +
        'רק `docker compose down -v` מוחק את ה-volume (ואת הנתונים).',
    },
    {
      q: 'מדוע `ASPNETCORE_ENVIRONMENT=Production` ב-Compose גורם לכך שה-CORS מפרק 11 "לא מופעל" בפועל?',
      options: [
        'כי Production mode מבטל CORS',
        'לא קשור ל-Production mode — בפרודקשן client ו-API חולקים origin אחד (הכול דרך nginx:4500), ולכן אין cross-origin ואין preflight',
        'כי nginx מסנן CORS headers',
        'כי `ASPNETCORE_ENVIRONMENT=Production` שמפעיל דגל אחר ב-.NET שמבטל CORS',
      ],
      answer: 1,
      explain:
        'CORS נדרש רק כשה-client ו-API חיים על origins שונים (scheme + host + port). ' +
        'בפיתוח: client על 4500, API על 5080 — שני origins, CORS נדרש. ' +
        'בפרודקשן: client = nginx על 4500; nginx מעביר `/api/` ל-api container פנימית. ' +
        'מנקודת הדפדפן, כל הבקשות יוצאות מ-`:4500` ל-`:4500` — same origin. ' +
        'אין preflight, אין CORS. ה-middleware נשאר בקוד אבל לא נוגע.',
    },
    {
      q: 'מה הייחודי ב-`verify:snapshots` שמסביר מדוע הוא ה-gate האחרון בצינור ה-CI?',
      options: [
        'הוא Gate יחיד שבודק את ה-TypeScript',
        'הוא הGate הכי כבד: מחדש, בונה, ובודק כל snapshot של כל פרק (dotnet build + ng build לכל milestone). הוא נמצא אחרון כדי שgate מהיר שנכשל קודמו יחסוך את זמנו',
        'הוא Gate שרץ רק על main ולא על PRים',
        'הוא Gate שרץ רק על machines עם Docker',
      ],
      answer: 1,
      explain:
        '`pnpm verify:snapshots` מממש overlays ובונה כל milestone ב-`reference/milestones.json`. ' +
        'בפרויקט עם 25 פרקים ועשרות milestones זה עשוי לקחת דקות. ' +
        'Gate כמו `pnpm test` (שניות) נכשל מהר אם יש arrow בפרק — ' +
        'לא נרצה לחכות ל-`verify:snapshots` לאחר כישלון `test`. ' +
        'סדר: מהיר לאיטי = fail fast.',
    },
    {
      q: 'מדוע ה-`api` service ב-`docker-compose.yml` אינו מגדיר `ports:`?',
      options: [
        'כי ה-api לא תומך בחשיפת ports',
        'כדי שרק nginx (ה-client service) יהיה נגיש מ-host — ה-api נגיש רק מהרשת הפנימית של Compose, דרך nginx כ-reverse proxy',
        'כי Compose פותח ports אוטומטית',
        'כי ה-api רץ על פורט 80 שכבר תפוס',
      ],
      answer: 1,
      explain:
        'Compose יוצר רשת internal בין כל ה-services. ' +
        'ה-`client` service (nginx) יכול ל-proxy אל `http://api:8080` בשמו. ' +
        'אם ה-`api` היה מגדיר `ports: - "8080:8080"`, הוא היה נגיש גם ישירות מה-host — ' +
        'מעקף ל-nginx ולכל ה-headers שהוא מוסיף. ' +
        'לא חושפים: הגנה בשכבות, nginx הוא הפאסאד היחיד.',
    },
    {
      q: 'תיקיית `dist/taskforge-client/browser` — מה משמעות `browser/` וב-Dockerfile של ה-client מאיפה נעתקת?',
      options: [
        '`browser/` היא תיקייה שנוצרת רק ב-SSR; ב-build רגיל הפלט הוא ב-`dist/taskforge-client/` ישירות',
        '`browser/` היא תיקיית הפלט הסטנדרטית של Angular 17+ builder; מ-שלב ה-build בDocker (`--from=build /app/dist/taskforge-client/browser`) לתיקיית nginx',
        '`browser/` נוצרת רק ב-production mode',
        '`browser/` היא alias ל-`public/`',
      ],
      answer: 1,
      explain:
        'Angular 17+ application builder שם תמיד את static output בתוך `browser/` ' +
        '(גם ללא SSR) כדי להכין את המבנה לתמיכה עתידית ב-SSR. ' +
        'ב-Dockerfile: `COPY --from=build /app/dist/taskforge-client/browser /usr/share/nginx/html` ' +
        'מעתיק בדיוק את תיקייה זו. ' +
        'העתקת `dist/taskforge-client/` כולה היתה מעתיקה wrapper ריק ב-nginx root.',
    },
    {
      q: 'מה עושה `corepack prepare pnpm@10.28.0 --activate` ב-`client/Dockerfile`, ולמה לא מסתפקים ב-`corepack enable`?',
      options: [
        '`corepack enable` כבר מתקין pnpm; `prepare` מיותר',
        '`corepack enable` מאפשר corepack לנהל package managers, אבל `prepare` מוריד ומפעיל גרסה מדויקת. בלי `prepare`, corepack עלול להשתמש בגרסה שונה של pnpm',
        '`prepare` דרוש רק ב-Windows',
        '`prepare` מהיר יותר מ-`npm install -g pnpm`',
      ],
      answer: 1,
      explain:
        '`corepack enable` משנה את ה-PATH כך ש-`pnpm` מנוהל על ידי corepack. ' +
        'אבל corepack "עצלן" — הוא מוריד את הgרסה הנכונה לפי `packageManager` ב-`package.json` ' +
        'רק בריצה הראשונה. `corepack prepare pnpm@10.28.0 --activate` מוריד ומקבע גרסה ' +
        'מדויקת כבר בשלב ה-build של ה-image, מבטיח בסיס עקבי ומנע הפתעות.',
    },
  ],

  proveIt: [
    {
      title: 'בנו את ה-server image ידנית',
      body:
        'כדי לאמת שה-Dockerfile תקין, בנו את image השרת ידנית מתוך תיקיית ה-server בsnapshot. ' +
        'השתמשו ב-`reference/.build/ch25/server` (אחרי `node tools/materialize-snapshots.mjs`). ' +
        'לאחר הbuild בדקו שה-image קיים ושם tag ניתן לו.',
      command:
        'cd C:/dev/angualr-aspcore-me/taskforge-companion && node tools/materialize-snapshots.mjs && docker build -t taskforge-api:ch25 reference/.build/ch25/server',
      expect:
        'ה-build מסיים בהצלחה ומדפיס `Successfully built ...` ו-`Successfully tagged taskforge-api:ch25`. ' +
        'שכבת ה-restore (`dotnet restore`) מדולגת ב-build שני (cache hit). ' +
        '`docker images taskforge-api` מראה את ה-image.',
    },
    {
      title: 'בנו את ה-client image ידנית',
      body:
        'בנו את image הclient ידנית מתוך `reference/.build/ch25/client`. ' +
        'צפו בדפסות: שלב build (node, pnpm install, ng build) ואחר כך שלב runtime (nginx).',
      command:
        'docker build -t taskforge-client:ch25 C:/dev/angualr-aspcore-me/taskforge-companion/reference/.build/ch25/client',
      expect:
        'Build מסתיים בשתי שלבי `FROM`. ' +
        'ב-output יופיעו שורות כמו `Step N/M: COPY --from=build ...`. ' +
        '`docker images taskforge-client` מראה image בסדר MB (אין node_modules).',
    },
    {
      title: 'הרצת הסטאק המלא עם `docker compose up`',
      body:
        'צרו קובץ `.env` ב-`reference/.build/ch25/` עם `JWT_KEY=dev-test-key-must-be-at-least-32chars`. ' +
        'אחר כך הריצו `docker compose up --build` מאותה תיקייה. ' +
        'המתינו שה-client ו-api יעלו (הlog מדפיס "Now listening on http://+:8080").',
      command:
        'echo "JWT_KEY=dev-test-key-must-be-at-least-32-characters-long" > C:/dev/angualr-aspcore-me/taskforge-companion/reference/.build/ch25/.env && docker compose -f C:/dev/angualr-aspcore-me/taskforge-companion/reference/.build/ch25/docker-compose.yml up --build -d',
      expect:
        'הlogs מציגים שני services עולים. `docker compose ps` מראה `Up` לשניהם. ' +
        'פתחו דפדפן על `http://localhost:4500` — אפליקציית TaskForge עולה.',
    },
    {
      title: 'אמתו SPA fallback ו-API proxy דרך nginx',
      body:
        'עם הstack רץ על פורט 4500: (1) נסו deep link ישיר; (2) בדקו שה-REST API עובד דרך nginx.',
      command:
        'curl -s -o /dev/null -w "%{http_code}" http://localhost:4500/projects/1/board && echo "" && curl -s -X POST http://localhost:4500/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"demo@taskforge.dev\",\"password\":\"Passw0rd!\"}" | python -m json.tool',
      expect:
        '`curl .../projects/1/board` מחזיר קוד 200 (nginx מחזיר `index.html` — SPA fallback). ' +
        '`curl .../api/auth/login` מחזיר JSON עם `accessToken` — nginx proxy ל-API עובד. ' +
        'שני origins, URL אחד.',
    },
    {
      title: 'אמתו WebSocket upgrade לSignalR דרך nginx',
      body:
        'השיגו JWT token ואמתו ש-negotiate ל-SignalR עובד דרך nginx (פורט 4500, לא 8080). ' +
        'זה מוכיח שה-`proxy_http_version 1.1` + upgrade headers פועלים.',
      command:
        'TOKEN=$(curl -s -X POST http://localhost:4500/api/auth/login -H "Content-Type: application/json" -d \'{"email":"demo@taskforge.dev","password":"Passw0rd!"}\' | python -c "import sys,json; print(json.load(sys.stdin)[\'accessToken\'])") && curl -s -X POST "http://localhost:4500/hubs/board/negotiate?negotiateVersion=1&access_token=$TOKEN" | python -m json.tool',
      expect:
        'Response 200 עם JSON הכולל `connectionId` ו-`availableTransports` עם WebSockets. ' +
        'הבקשה עוברת דרך nginx (פורט 4500) ולא ישירות ל-API (פורט 8080). ' +
        'SignalR negotiation דרך reverse proxy עובד.',
    },
    {
      title: 'אמתו שה-SQLite שורד rebuild',
      body:
        'צרו issue חדש בממשק (כניסה עם demo@taskforge.dev / Passw0rd!). ' +
        'רשמו את ה-ID שלו. ' +
        'הריצו `docker compose down` ו-`docker compose up --build` ב-`reference/.build/ch25/`. ' +
        'בדקו שה-issue עדיין קיים.',
      command:
        'docker compose -f C:/dev/angualr-aspcore-me/taskforge-companion/reference/.build/ch25/docker-compose.yml down && docker compose -f C:/dev/angualr-aspcore-me/taskforge-companion/reference/.build/ch25/docker-compose.yml up --build -d',
      expect:
        'אחרי rebuild ו-up: `http://localhost:4500` עולה. ' +
        'ה-issue שיצרתם קיים (ה-SQLite ב-volume לא נמחק). ' +
        '`docker volume ls` מציג `taskforge-data` עדיין.',
    },
  ],

  exercise: {
    prompt:
      'הוסיפו health-check ל-`api` service ב-`docker-compose.yml` כך ש-`client` ימתין ' +
      'עד שה-API באמת מוכן (לא רק שהcontainer עלה), ' +
      'ואחר כך הוסיפו `--fail-fast` flag ל-`verify:snapshots` ב-`ci.yml` ' +
      'כך שכישלון snapshot בודד עוצר את כל ה-verify באופן מיידי.',
    tasks: [
      'ב-`docker-compose.yml`: הוסיפו `healthcheck:` ל-`api` service עם `test: ["CMD", "curl", "-f", "http://localhost:8080/health"]`, `interval: 10s`, `retries: 3`.',
      'שנו `depends_on: - api` של ה-`client` ל-`depends_on: api: condition: service_healthy`.',
      'ב-`server/TaskForge.Api/Program.cs` (ב-`reference/ch25/`): הוסיפו `app.MapHealthChecks("/health")` ו-`builder.Services.AddHealthChecks()` (חינמי, אין NuGet).',
      'ב-`.github/workflows/ci.yml`: שנו את שלב `pnpm verify:snapshots` ל-`run: pnpm verify:snapshots || exit 1` (כבר fail-fast) ‒ אלטרנטיבית, חקרו אם `verify:snapshots` כבר מחזיר exit code נכון.',
      'בדקו ש-`docker compose up --build` ממתין לhealth-check לפני ש-nginx מתחיל לפעול (צפו ב-logs).',
    ],
    acceptance: [
      '`docker compose ps` מציג `(healthy)` ל-api לאחר עלייה.',
      '`client` container לא מתחיל עד שה-api מדווח `healthy`.',
      '`curl http://localhost:4500/health` (דרך nginx proxy) מחזיר 200.',
      '`docker compose up --build` לוג מציג שה-client מחכה לapi.',
      '`pnpm build` ירוק (אם ערכתם משהו בclient — גם `pnpm test`).',
    ],
  },
};
