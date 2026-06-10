import { ChapterContent } from '../../core/registry/chapter.types';

const AUTH_FILE_MAP = `# Core entities and contracts
server/TaskForge.Core/Entities/User.cs
server/TaskForge.Core/Entities/RefreshToken.cs
server/TaskForge.Core/Entities/ProjectMember.cs
server/TaskForge.Core/Common/JwtOptions.cs
server/TaskForge.Core/Abstractions/IUserRepository.cs
server/TaskForge.Core/Abstractions/IRefreshTokenRepository.cs
server/TaskForge.Core/Abstractions/IPasswordHasher.cs
server/TaskForge.Core/Abstractions/ITokenService.cs
server/TaskForge.Core/Abstractions/IProjectRepository.cs

# Api contracts, endpoints and pipeline
server/TaskForge.Api/Contracts/AuthContracts.cs
server/TaskForge.Api/Auth/CurrentUserExtensions.cs
server/TaskForge.Api/Endpoints/AuthEndpoints.cs
server/TaskForge.Api/Endpoints/ProjectEndpoints.cs
server/TaskForge.Api/Endpoints/IssueEndpoints.cs
server/TaskForge.Api/Program.cs
server/TaskForge.Api/appsettings.json
server/TaskForge.Api/TaskForge.Api.csproj
server/TaskForge.Api/requests.http

# Infrastructure implementation
server/TaskForge.Infrastructure/Auth/PasswordHasher.cs
server/TaskForge.Infrastructure/Auth/TokenService.cs
server/TaskForge.Infrastructure/Repositories/EfUserRepository.cs
server/TaskForge.Infrastructure/Repositories/EfRefreshTokenRepository.cs
server/TaskForge.Infrastructure/Repositories/EfProjectRepository.cs
server/TaskForge.Infrastructure/Data/TaskForgeDbContext.cs
server/TaskForge.Infrastructure/Data/DbSeeder.cs
server/TaskForge.Infrastructure/TaskForge.Infrastructure.csproj

# EF migration generated from the real model
server/TaskForge.Infrastructure/Migrations/20260610153208_AddAuth.cs
server/TaskForge.Infrastructure/Migrations/20260610153208_AddAuth.Designer.cs
server/TaskForge.Infrastructure/Migrations/TaskForgeDbContextModelSnapshot.cs`;

/**
 * Chapter 05 — Auth by hand.
 * מוסיפים זהות והרשאות בלי להסתיר את המנגנון: PBKDF2, JWT חתום,
 * refresh rotation, claims, חברות בפרויקט, והבדל חד בין 401 ל-403.
 */
export const CH05_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 5.1 */
    {
      id: '5.1',
      title: 'מה Auth חייב להוכיח',
      blocks: [
        {
          kind: 'p',
          text:
            'עד עכשיו TaskForge ידע לנהל פרויקטים ו-Issues, אבל לא ידע לענות על השאלה הכי בסיסית: ' +
            'מי עומד מול השרת, ומה מותר לו לעשות. בפרק הזה אנחנו מוסיפים זהות, טוקנים והרשאה מבוססת משאב.',
        },
        {
          kind: 'p',
          text:
            'המודל פשוט: סיסמה נשמרת רק כ-hash, גישה קצרה נחתמת ב-JWT, רענון ארוך נשמר ב-DB, ' +
            'וכל פעולה רגישה בודקת גם משתמש וגם חברות בפרויקט.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ההבדל בין Authentication ל-Authorization?',
          body:
            'Authentication עונה מי המשתמש. Authorization עונה האם למשתמש הזה מותר לבצע פעולה מסוימת. ' +
            'בפרק הזה `AddJwtBearer` מזהה את המשתמש, ו-`IsMemberAsync` מחליט אם מותר ליצור Issue בפרויקט.',
        },
        {
          kind: 'term',
          name: 'Authentication',
          definition: 'שלב זיהוי המשתמש: בדיקת טוקן, חתימה, תוקף, מנפיק וקהל.',
        },
      ],
      panel: {
        kind: 'diagram',
        caption: 'מפת האמון: הסיסמה לא יוצאת מהשרת, ה-JWT קצר חיים, וה-refresh נשלט דרך DB.',
        mermaid: `sequenceDiagram
  participant Browser
  participant Api
  participant Db
  Browser->>Api: POST /api/auth/login
  Api->>Db: find user by email
  Api->>Api: PBKDF2 verify
  Api->>Api: sign JWT
  Api->>Db: store refresh token
  Api-->>Browser: accessToken + refreshToken
  Browser->>Api: POST /api/projects/1/issues
  Api->>Api: validate Bearer token
  Api->>Db: check ProjectMember
  Api-->>Browser: 201 or 403`,
      },
    },

    /* ------------------------------------------------------------ 5.2 */
    {
      id: '5.2',
      title: 'מפת הקבצים של Auth',
      blocks: [
        {
          kind: 'p',
          text:
            'Auth נוגע בכל שכבה, ולכן קודם מסדרים את המפה. Core מחזיק מושגים וחוזים, Infrastructure מחזיק ' +
            'קריפטוגרפיה ו-EF, וה-Api מחזיק HTTP, pipeline ו-endpoints.',
        },
        {
          kind: 'code',
          lang: 'bash',
          title: 'קבצי Auth לפי שכבה',
          code: AUTH_FILE_MAP,
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'זו לא רשימת קניות. זו בדיקת ארכיטקטורה: אם קוד JWT נכנס ל-Core, או DTO של HTTP נכנס ל-Infrastructure, ' +
            'חוק התלות נשבר. המפה הזו עוזרת לראות את הגבולות לפני שנוגעים בקוד.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch05',
        title: 'TaskForge אחרי פרק 05',
      },
    },

    /* ------------------------------------------------------------ 5.3 */
    {
      id: '5.3',
      title: 'הדומיין מקבל משתמשים וחברות',
      blocks: [
        {
          kind: 'p',
          text:
            '`User` הוא הזהות, `RefreshToken` הוא סשן מתחדש שניתן לבטל, ו-`ProjectMember` הוא הקשר שמחליט ' +
            'מי שייך לאיזה פרויקט ובאיזה תפקיד.',
        },
        {
          kind: 'ul',
          items: [
            '`User.Role` הוא תפקיד גלובלי, למשל Admin.',
            '`ProjectMember.Role` הוא תפקיד בתוך פרויקט, למשל Owner.',
            '`RefreshToken.IsActive` מאפשר rotation וביטול בלי לחכות ל-expiration.',
          ],
        },
        {
          kind: 'term',
          name: 'Resource authorization',
          definition:
            'הרשאה שנבדקת מול משאב ספציפי. לא מספיק להיות מחובר, צריך להיות חבר בפרויקט המסוים.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch05',
        file: 'server/TaskForge.Core/Entities/User.cs',
      },
    },

    /* ------------------------------------------------------------ 5.4 */
    {
      id: '5.4',
      title: 'סיסמה לא שומרים, סיסמה גוזרים',
      blocks: [
        {
          kind: 'p',
          text:
            'השרת לעולם לא שומר את הסיסמה המקורית. הוא מייצר salt אקראי, מריץ PBKDF2, ושומר פורמט שמכיל ' +
            'iterations, salt ו-hash. בעת Login חוזרים על אותה גזירה ומשווים בזמן קבוע.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'למה לא SHA256(password)?',
          body:
            'כי סיסמאות הן חלשות וצפויות. PBKDF2 מוסיף salt ייחודי ועלות חישובית מכוונת, כך שגם אם DB דולף, ' +
            'תקיפה רחבה נהיית יקרה בהרבה.',
        },
        {
          kind: 'term',
          name: 'PBKDF2',
          definition:
            'פונקציה לגזירת מפתח מסיסמה. היא משתמשת ב-salt ובהרבה איטרציות כדי להאט ניחוש סיסמאות.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch05',
        file: 'server/TaskForge.Infrastructure/Auth/PasswordHasher.cs',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 5.5 */
    {
      id: '5.5',
      title: 'JWT הוא קבלה חתומה, לא מקור אמת',
      blocks: [
        {
          kind: 'p',
          text:
            'Access token קצר חיים מכיל claims שהשרת חותם עליהם: מזהה משתמש, אימייל, שם ותפקיד. הקליינט יכול לקרוא, ' +
            'אבל לא יכול לשנות בלי לשבור את החתימה.',
        },
        {
          kind: 'p',
          text:
            'Refresh token שונה לגמרי: הוא לא JWT. הוא ערך אקראי חזק שמקבל משמעות רק כי יש שורה מתאימה ב-DB. ' +
            'לכן אפשר לבטל אותו ברגע.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה access token קצר ו-refresh token נשמר ב-DB?',
          body:
            'JWT קצר מפחית נזק אם הוא דולף. Refresh token ארוך נשמר בשרת כדי שאפשר יהיה לבטל, לסובב ולזהות שימוש חוזר. ' +
            'זו החלוקה בין מהירות בדיקה לבין שליטה בסשן.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch05',
        file: 'server/TaskForge.Infrastructure/Auth/TokenService.cs',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 5.6 */
    {
      id: '5.6',
      title: 'ה-DbContext מצייר את גבולות הזהות',
      blocks: [
        {
          kind: 'p',
          text:
            'המודל מקבל שלוש טבלאות חדשות: Users, RefreshTokens ו-ProjectMembers. האילוצים הם חלק מהאבטחה: ' +
            'אימייל ייחודי, refresh token ייחודי, ומפתח מורכב שמונע חברות כפולה באותו פרויקט.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'כשכללי הזהות נמצאים גם ב-DB, לא רק בקוד, הם שורדים באגים. גם אם handler שוכח לבדוק כפילות, unique index עדיין מגן.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch05',
        file: 'server/TaskForge.Infrastructure/Data/TaskForgeDbContext.cs',
        region: 'step-5.6',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 5.7 */
    {
      id: '5.7',
      title: 'Seed אמיתי, לא דלת אחורית',
      blocks: [
        {
          kind: 'p',
          text:
            'משתמש הדמו נוצר עם אותו `PasswordHasher` של הרשמה אמיתית. אין סיסמה שמורה בצד, אין shortcut, ' +
            'ואין נתיב שמדלג על הקריפטוגרפיה.',
        },
        {
          kind: 'p',
          text:
            'אחרי שהפרויקטים מקבלים Id אמיתי, ה-seeder מוסיף חברות Owner לכל פרויקט. זו הכנה ישירה לבדיקת 403 בהמשך.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch05',
        file: 'server/TaskForge.Infrastructure/Data/DbSeeder.cs',
        region: 'step-5.7',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 5.8 */
    {
      id: '5.8',
      title: 'מחברים Options ושירותי Auth',
      blocks: [
        {
          kind: 'p',
          text:
            '`JwtOptions` הוא ה-POCO שמחבר בין appsettings, מנפיק הטוקנים ומאמת הטוקנים. שני הצדדים קוראים מאותו מקור אמת.',
        },
        {
          kind: 'ul',
          items: [
            '`IPasswordHasher` ו-`ITokenService` הם Stateless ולכן Singleton מתאים.',
            '`JwtOptions.SectionName` מונע string literal מפוזר.',
            'בפרודקשן המפתח לא אמור להישאר ב-`appsettings.json`; הוא מגיע מסוד סביבתי.',
          ],
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch05',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-5.8',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 5.9 */
    {
      id: '5.9',
      title: 'AddJwtBearer בודק את הקבלה',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-handler של Bearer עושה את הבדיקה הכבדה לכל בקשה עם Authorization header: חתימה, issuer, audience, lifetime ומפתח.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'ClockSkew ברירת מחדל',
          body:
            'ברירת המחדל של JWT validation נותנת כמה דקות חסד. כאן מצמצמים ל-30 שניות כדי שטוקנים קצרים באמת יתנהגו כקצרים.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch05',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-5.9',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 5.10 */
    {
      id: '5.10',
      title: 'סדר ה-pipeline קשיח',
      blocks: [
        {
          kind: 'p',
          text:
            '`UseAuthentication` חייב לרוץ לפני `UseAuthorization`. הראשון בונה `ClaimsPrincipal`, השני מחליט אם ה-principal הזה עובר את הדרישות.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה יקרה אם נהפוך בין Authentication ו-Authorization?',
          body:
            'Authorization ירוץ לפני שיש משתמש מזוהה, ולכן דרישות שמבוססות על claims או roles לא יוכלו לעבוד נכון. הסדר הוא חלק מהאבטחה, לא סגנון.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch05',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-5.10',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 5.11 */
    {
      id: '5.11',
      title: 'קבוצת Auth היא שער הכניסה',
      blocks: [
        {
          kind: 'p',
          text:
            '`/api/auth/register`, `/login` ו-`/refresh` פתוחים כי הם הדרך לקבל זהות. `/me` שונה: הוא מוכיח שהטוקן הנוכחי תקף.',
        },
        {
          kind: 'p',
          text:
            'שימו לב שהקבוצה עצמה לא דורשת Authorization. הדרישה נמצאת רק על endpoint אחד, כי לא כל פעולות auth דורשות טוקן קודם.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch05',
        file: 'server/TaskForge.Api/Endpoints/AuthEndpoints.cs',
        region: 'step-5.11',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 5.12 */
    {
      id: '5.12',
      title: 'Register ו-Login חולקים הנפקה אחת',
      blocks: [
        {
          kind: 'p',
          text:
            'הרשמה יוצרת משתמש ומחזירה 201. התחברות מאתרת משתמש, מאמתת סיסמה, ומחזירה 200. בשני המקרים, הנפקת הטוקנים עוברת דרך `IssueTokensAsync` אחד.',
        },
        {
          kind: 'callout',
          tone: 'warn',
          body:
            'ב-Login מחזירים 401 אחיד גם כשאין אימייל וגם כשסיסמה שגויה. אחרת ה-API הופך למנוע שמגלה אילו אימיילים קיימים.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch05',
        file: 'server/TaskForge.Api/Endpoints/AuthEndpoints.cs',
        region: 'step-5.12',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 5.13 */
    {
      id: '5.13',
      title: 'Refresh rotation שורף את הישן',
      blocks: [
        {
          kind: 'p',
          text:
            'Refresh לא “מאריך” את אותו טוקן. הוא מוצא טוקן פעיל, מבטל אותו, ואז יוצר זוג חדש. שימוש חוזר בטוקן הישן מחזיר 401.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'Rotation נותן אות פריצה: אם refresh token שומש פעמיים, אחד מהשימושים כנראה הגיע ממקום לא אמור. בלי rotation אין דרך לראות את זה.',
        },
        {
          kind: 'term',
          name: 'Refresh rotation',
          definition: 'כל רענון מבטל את ה-refresh token הקודם ומנפיק חדש, כדי לזהות שימוש חוזר.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch05',
        file: 'server/TaskForge.Api/Endpoints/AuthEndpoints.cs',
        region: 'step-5.13',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 5.14 */
    {
      id: '5.14',
      title: 'יוצר הפרויקט הופך ל-Owner באותה טרנזקציה',
      blocks: [
        {
          kind: 'p',
          text:
            'יצירת פרויקט לא יכולה להשאיר פרויקט יתום. ה-repository מוסיף את הפרויקט ואת שורת ProjectMember באותו SaveChanges.',
        },
        {
          kind: 'p',
          text:
            'זה המקום שבו דומיין והרשאה נפגשים: מי שיצר את המשאב מקבל בעלות מיידית, ואז בדיקות חברות בפרק הזה יכולות להיות אמיתיות.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch05',
        file: 'server/TaskForge.Infrastructure/Repositories/EfProjectRepository.cs',
        region: 'step-5.14',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 5.15 */
    {
      id: '5.15',
      title: '401 הוא מי אתה, 403 הוא אסור לך',
      blocks: [
        {
          kind: 'p',
          text:
            'כל קבוצת Issues דורשת משתמש מאומת. אחרי זה CreateIssue מוסיף בדיקה שנייה: האם המשתמש חבר בפרויקט הזה.',
        },
        {
          kind: 'ul',
          items: [
            'אין Bearer token, מקבלים 401 לפני ה-handler.',
            'יש טוקן תקף אבל אין חברות בפרויקט, מקבלים 403 מתוך ה-handler.',
            'יש טוקן תקף ויש חברות, נוצרת Issue עם 201.',
          ],
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch05',
        file: 'server/TaskForge.Api/Endpoints/IssueEndpoints.cs',
        region: 'step-5.15',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 5.16 */
    {
      id: '5.16',
      title: 'בודקים את הזרימה כמו משתמש',
      blocks: [
        {
          kind: 'p',
          text:
            'הסימולטור מסכם את חוזה ההתנהגות: login מחזיר זוג טוקנים, `/me` קורא claims מאומתים, refresh rotation מבטל ישן, ו-Issue בלי חברות נחסם.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'ב-REST Client הקובץ `requests.http` שומר את תוצאת ה-login בשם, ואז שולף `accessToken` ו-`refreshToken` לבקשות הבאות. זו דרך מצוינת לבדוק Auth בלי UI.',
        },
      ],
      panel: {
        kind: 'simulator',
        scenario: {
          title: 'Auth smoke — ארבע הוכחות',
          blurb: 'Login, me, rotation והרשאת פרויקט',
          requests: [
            {
              method: 'POST',
              path: '/api/auth/login',
              body: '{"email":"demo@taskforge.dev","password":"Passw0rd!"}',
              note: 'משתמש seeded, סיסמה עוברת PBKDF2 אמיתי',
            },
            {
              method: 'GET',
              path: '/api/auth/me',
              note: 'Bearer token תקף מצורף לכותרת',
            },
            {
              method: 'POST',
              path: '/api/auth/refresh',
              body: '{"refreshToken":"old-refresh-token"}',
              note: 'נסו אותו refresh פעמיים',
            },
            {
              method: 'POST',
              path: '/api/projects/999/issues',
              body: '{"title":"Forbidden check","priority":"High"}',
              note: 'משתמש מאומת, אבל לא חבר בפרויקט',
            },
          ],
          responses: [
            {
              status: 200,
              title: 'AuthResponse עם accessToken, refreshToken ו-user',
              body: JSON.stringify(
                {
                  accessToken: 'eyJhbGciOiJIUzI1NiIs...',
                  refreshToken: 'strong-random-value',
                  expiresAtUtc: '2026-06-10T12:15:00Z',
                  user: { id: 1, email: 'demo@taskforge.dev', displayName: 'Demo User', role: 'Admin' },
                },
                null,
                2,
              ),
            },
            {
              status: 200,
              title: 'השרת מחזיר את המשתמש לפי claims מאומתים',
              body: '{"id":1,"email":"demo@taskforge.dev","displayName":"Demo User","role":"Admin"}',
            },
            {
              status: 401,
              title: 'שימוש חוזר ב-refresh הישן נכשל',
              body: '',
            },
            {
              status: 403,
              title: 'המשתמש מזוהה, אבל אינו חבר במשאב',
              body: '',
            },
          ],
          insight: '401 ו-403 הם לא ניואנס. הם מספרים איפה בדיוק נכשלה שרשרת האמון.',
        },
      },
    },

    /* ------------------------------------------------------------ 5.17 */
    {
      id: '5.17',
      title: 'מה השתנה בסוף פרק 05',
      blocks: [
        {
          kind: 'p',
          text:
            'בסוף הפרק יש ל-TaskForge מערכת זהות מלאה מספיק לשלב הבא: משתמשים, סיסמאות מגובבות, JWT קצר, refresh מבוטל, והרשאת חברות בפרויקט.',
        },
        {
          kind: 'p',
          text:
            'בפרק 06 מתחיל הקליינט. עכשיו כשהשרת יודע מי המשתמש, Angular יכול לבנות חוויית login, guard ו-interceptor סביב חוזה אמיתי.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'איך היית מסביר את כל פרק Auth בדקה?',
          body:
            'השרת שומר רק hashes, מנפיק JWT קצר חתום, שומר refresh tokens ב-DB כדי לשלוט בסשן, מסובב refresh בכל שימוש, ' +
            'ומבדיל בין זיהוי המשתמש לבין הרשאה מול פרויקט ספציפי.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch05',
        title: 'עץ הקוד אחרי Auth',
      },
    },
  ],

  quiz: [
    {
      q: 'איזה משפט מתאר נכון את ההבדל בין access token ל-refresh token בפרק הזה?',
      options: [
        'שניהם JWT, רק עם תוקף שונה',
        'access token הוא JWT חתום וקצר חיים; refresh token הוא ערך אקראי שנשלט דרך DB',
        'refresh token נשמר רק בקליינט ולכן אי אפשר לבטל אותו',
        'access token נבדק מול DB בכל בקשה',
      ],
      answer: 1,
      explain:
        'ה-JWT נבדק לפי חתימה ותוקף ולכן מהיר. Refresh token מקבל משמעות משורה ב-DB, ולכן אפשר לבטל ולסובב אותו.',
    },
    {
      q: 'למה משתמשים ב-`CryptographicOperations.FixedTimeEquals`?',
      options: [
        'כדי שה-hash יהיה קצר יותר',
        'כדי למנוע הבדל זמן שמדליף כמה bytes כבר התאימו',
        'כדי להצפין את הסיסמה לפני שמירה',
        'כדי שה-JWT יהיה חתום',
      ],
      answer: 1,
      explain:
        'השוואה רגילה עלולה לעצור מוקדם ולחשוף מידע דרך זמן ריצה. השוואה בזמן קבוע מצמצמת את ערוץ הדליפה הזה.',
    },
    {
      q: 'מה מחזיר API כשאין Bearer token מול endpoint שמוגן ב-`RequireAuthorization`?',
      options: ['401', '403', '404', '409'],
      answer: 0,
      explain:
        '401 אומר שהמשתמש לא מזוהה. 403 שמור למצב שבו המשתמש מזוהה, אבל אסור לו לבצע פעולה על המשאב.',
    },
    {
      q: 'מה תפקיד `ProjectMember` בפרק הזה?',
      options: [
        'לשמור את רשימת ה-Issues של פרויקט',
        'לקשר משתמש לפרויקט ולתפקיד שלו בתוך אותו פרויקט',
        'לייצר JWT חדש',
        'להחליף את UserRole הגלובלי',
      ],
      answer: 1,
      explain:
        'ProjectMember הוא טבלת הקשר שמאפשרת הרשאה מבוססת משאב. משתמש יכול להיות Owner בפרויקט אחד וחבר רגיל באחר.',
    },
    {
      q: 'למה refresh rotation מועיל?',
      options: [
        'כי הוא מבטל את הצורך ב-access tokens',
        'כי כל שימוש ב-refresh מבטל את הקודם, ושימוש חוזר בטוקן ישן יכול לחשוף גניבה',
        'כי הוא הופך JWT להצפנה סימטרית',
        'כי הוא מאפשר login בלי סיסמה',
      ],
      answer: 1,
      explain:
        'Rotation מצמצם חלון שימוש ומוסיף איתות אבטחתי. אם טוקן ישן חוזר, השרת יודע שמשהו לא תקין.',
    },
    {
      q: 'איפה נכון לשים DTOs של Auth לפי ההחלטה בפרק הזה?',
      options: [
        'ב-Core, כי כל שכבה צריכה אותם',
        'ב-Api/Contracts, כי הם חוזה HTTP ולא מושג דומיין נקי',
        'ב-Infrastructure, כי EF משתמש בהם',
        'בתוך Program.cs כדי שיהיו קרובים ל-endpoints',
      ],
      answer: 1,
      explain:
        'RegisterRequest, LoginRequest ו-AuthResponse הם wire contract של HTTP. הדומיין לא צריך להכיר את צורת ה-JSON.',
    },
  ],

  proveIt: [
    {
      title: 'Login מחזיר זוג טוקנים',
      body: 'הריצו את השרת ושלחו Login עם משתמש הדמו.',
      command: 'POST http://localhost:5080/api/auth/login  {"email":"demo@taskforge.dev","password":"Passw0rd!"}',
      expect: '200 עם accessToken, refreshToken, expiresAtUtc ו-user.role = Admin',
    },
    {
      title: '/me דורש Bearer',
      body: 'שלחו `/api/auth/me` פעם אחת בלי token ופעם אחת עם token מה-login.',
      command: 'GET http://localhost:5080/api/auth/me',
      expect: 'בלי token מקבלים 401; עם token מקבלים את Demo User',
    },
    {
      title: 'Refresh rotation מבטל את הישן',
      body: 'שלחו refresh עם הטוקן שקיבלתם, ואז נסו לשלוח שוב את אותו refresh token.',
      command: 'POST http://localhost:5080/api/auth/refresh',
      expect: 'הפעם הראשונה מחזירה זוג חדש; הפעם השנייה מחזירה 401',
    },
    {
      title: 'יצירת Project דורשת משתמש ומייצרת Owner',
      body: 'צרו פרויקט עם Bearer token ובדקו שניתן ליצור בו Issue לאחר מכן.',
      command: 'POST http://localhost:5080/api/projects',
      expect: '201 לפרויקט; יצירת Issue באותו projectId מצליחה כי היוצר Owner',
    },
    {
      title: 'Issue בלי חברות נחסם',
      body: 'נסו ליצור Issue בפרויקט שהמשתמש אינו חבר בו.',
      command: 'POST http://localhost:5080/api/projects/{not-member-project-id}/issues',
      expect: '403, לא 401, כי המשתמש מזוהה אבל אינו מורשה למשאב',
    },
  ],

  exercise: {
    prompt:
      'הוסיפו Logout שמבטל refresh token אחד. זה תרגיל קטן שמכריח אתכם לחשוב על session control, לא רק על login.',
    tasks: [
      'הוסיפו `LogoutRequest(string RefreshToken)` ל-`AuthContracts.cs`.',
      'הוסיפו `POST /api/auth/logout` ב-`AuthEndpoints.cs`: חפשו refresh פעיל, ואם קיים בטלו אותו.',
      'החליטו אם logout של טוקן לא קיים מחזיר 204 אידמפוטנטי או 401, ותעדו את הבחירה.',
      'הוסיפו בקשה מתאימה ל-`requests.http`.',
    ],
    acceptance: [
      'Refresh token פעיל מתבטל ולא יכול לשמש אחר כך.',
      'קריאה חוזרת ל-logout לא שוברת את השרת ולא מדליפה אם token היה קיים.',
      'הקוד עדיין עובר build וכל חוזי Auth הקיימים לא נשברים.',
    ],
  },
};
