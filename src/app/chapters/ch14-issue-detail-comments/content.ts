import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 14 — Issue ותגובות.
 * Snapshot first: issue detail route, comments, Signal Forms, async validation
 * and View Transitions were compiled before this content was authored.
 */
export const CH14_CONTENT: ChapterContent = {
  steps: [
    {
      id: '14.1',
      title: 'למה detail route ולא modal',
      blocks: [
        {
          kind: 'p',
          text:
            'לוח issues מצוין לסריקה, אבל עריכת כותרת, תיאור ותגובות דורשת מקום, URL, ורענון עצמאי. ' +
            'לכן פרק 14 מוסיף route אמיתי: `projects/:projectId/issues/:issueId`. ' +
            'זה אומר שאפשר לפתוח issue ישירות מקישור, לחזור אחורה ללוח, ולשמור את כל ה-state החשוב ב-URL.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'Route הוא חוזה, modal הוא מצב',
          body:
            'Modal טוב לפעולה קצרה. Detail page טוב למסך עבודה. ' +
            'ברגע שיש תגובות, ולידציה אסינכרונית ושמירה, ה-URL הופך לחלק מהפיצ׳ר ולא רק ניווט.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch14',
        file: 'client/src/app/app.routes.ts',
        region: 'step-14.10',
        diff: true,
      },
    },
    {
      id: '14.2',
      title: 'Comment entity: בעלים כפולים',
      blocks: [
        {
          kind: 'p',
          text:
            '`server/TaskForge.Core/Entities/Comment.cs` הוא entity קטן אבל חשוב: ' +
            'תגובה שייכת גם ל-`Issue` וגם ל-`User`. ' +
            'ה-issue קובע באיזה פרויקט ההרשאה נבדקת, וה-user קובע מי כתב את התגובה.',
        },
        {
          kind: 'p',
          text:
            '`server/TaskForge.Core/Entities/Issue.cs` מקבל `Comments` navigation. ' +
            'זה הופך את התגובות לחלק מחיי ה-issue: מוחקים issue, מוחקים גם את thread התגובות שלו.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch14',
        file: 'server/TaskForge.Core/Entities/Comment.cs',
        diff: true,
      },
    },
    {
      id: '14.3',
      title: 'DbContext ומיגרציה',
      blocks: [
        {
          kind: 'p',
          text:
            '`server/TaskForge.Infrastructure/Data/TaskForgeDbContext.cs` מוסיף `DbSet<Comment>` ' +
            'ומיפוי: `Body` עד 1200 תווים, אינדקס לפי `IssueId` ו-`CreatedAtUtc`, ' +
            'cascade מ-issue, ו-`Restrict` מול author כדי שלא נמחק תגובות היסטוריות בטעות.',
        },
        {
          kind: 'p',
          text:
            'המיגרציה `server/TaskForge.Infrastructure/Migrations/20260613053113_AddComments.cs` ' +
            'נוצרה עם `dotnet ef`, לא נכתבה ביד. גם קובץ ה-designer ' +
            '`server/TaskForge.Infrastructure/Migrations/20260613053113_AddComments.Designer.cs` ' +
            'ו-`TaskForgeDbContextModelSnapshot.cs` נשמרו כדי שה-snapshot ירוץ על DB חדש.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch14',
        file: 'server/TaskForge.Infrastructure/Data/TaskForgeDbContext.cs',
        region: 'step-14.3',
        diff: true,
      },
    },
    {
      id: '14.4',
      title: 'Repository דק לתגובות',
      blocks: [
        {
          kind: 'p',
          text:
            '`server/TaskForge.Core/Abstractions/ICommentRepository.cs` מגדיר שתי פעולות בלבד: ' +
            'קריאת תגובות לפי issue והוספת תגובה. ' +
            '`server/TaskForge.Infrastructure/Repositories/EfCommentRepository.cs` מממש אותן עם `Include(c => c.Author)` ' +
            'כדי שה-DTO יוכל להציג author name בלי שאילתת המשך.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'לא כל repository צריך להיות “עשיר”. החוזה צריך להכיל בדיוק את מה שה-API צריך עכשיו. ' +
            'עריכה ומחיקה של תגובות יהיו תרגיל המשך, לא API ריק שמחכה לשימוש.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch14',
        file: 'server/TaskForge.Infrastructure/Repositories/EfCommentRepository.cs',
        diff: true,
      },
    },
    {
      id: '14.5',
      title: 'CommentEndpoints: אותה הרשאה כמו הלוח',
      blocks: [
        {
          kind: 'p',
          text:
            '`server/TaskForge.Api/Contracts/CommentContracts.cs` מגדיר `CreateCommentRequest` ו-`CommentResponse`. ' +
            '`server/TaskForge.Api/Endpoints/CommentEndpoints.cs` מוסיף `GET /api/issues/{issueId}/comments` ' +
            'ו-`POST /api/issues/{issueId}/comments`.',
        },
        {
          kind: 'p',
          text:
            'ה-handler קודם טוען את ה-issue. אם אין issue, מחזיר 404. ' +
            'אם יש issue אבל המשתמש אינו חבר בפרויקט של ה-issue, מחזיר 403. ' +
            'רק אחרי זה קוראים או מוסיפים תגובות. זה אותו דפוס שנוקשה באודיט של ch13.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch14',
        file: 'server/TaskForge.Api/Endpoints/CommentEndpoints.cs',
        region: 'step-14.5',
        diff: true,
      },
    },
    {
      id: '14.6',
      title: 'IssueEndpoints מקבל title availability',
      blocks: [
        {
          kind: 'p',
          text:
            '`server/TaskForge.Api/Endpoints/IssueEndpoints.cs` מקבל endpoint חדש: ' +
            '`GET /api/projects/{projectId}/issues/title-available`. ' +
            'הוא קיים בשביל async validation של Signal Forms, אבל הוא עדיין API רגיל: ' +
            'אותה בדיקת 404/403, ואז תשובה קטנה `TitleAvailabilityResponse`.',
        },
        {
          kind: 'p',
          text:
            '`server/TaskForge.Api/Contracts/IssueContracts.cs` מוסיף את `TitleAvailabilityResponse`, ' +
            'ו-`server/TaskForge.Core/Abstractions/IIssueRepository.cs` מוסיף `TitleExistsAsync`. ' +
            'המימוש ב-`server/TaskForge.Infrastructure/Repositories/EfIssueRepository.cs` מתעלם מה-issue הנוכחי דרך `excludeIssueId`.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch14',
        file: 'server/TaskForge.Api/Endpoints/IssueEndpoints.cs',
        region: 'step-14.7',
        diff: true,
      },
    },
    {
      id: '14.7',
      title: 'Program.cs ו-seed מחברים את הכול',
      blocks: [
        {
          kind: 'p',
          text:
            '`server/TaskForge.Api/Program.cs` רושם `ICommentRepository` וממפה `MapCommentEndpoints()`. ' +
            'זו אותה צורה של ch12: endpoint file לפי פיצ׳ר, שורה אחת ב-`Program.cs`.',
        },
        {
          kind: 'p',
          text:
            '`server/TaskForge.Infrastructure/Data/DbSeeder.cs` מוסיף שתי תגובות seed ל-issue הראשון. ' +
            'הן נוצרות אחרי `SaveChanges`, כי רק אז ל-issues ול-users יש IDs אמיתיים לקשירת FK.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch14',
        file: 'server/TaskForge.Infrastructure/Data/DbSeeder.cs',
        region: 'step-14.2',
        diff: true,
      },
    },
    {
      id: '14.8',
      title: 'מודלי הקליינט',
      blocks: [
        {
          kind: 'p',
          text:
            '`client/src/app/core/models/comment.model.ts` הוא המראה של `CommentContracts.cs`. ' +
            'הוא נשאר פשוט: `Comment` לקריאה ו-`CreateCommentRequest` לכתיבה.',
        },
        {
          kind: 'p',
          text:
            '`client/src/app/core/models/issue.model.ts` מוסיף `TitleAvailabilityResponse`. ' +
            'זה intentional: גם תשובת ולידציה קטנה מקבלת טיפוס, כדי שה-`validateHttp` ב-form לא יעבוד על `unknown`.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch14',
        file: 'client/src/app/core/models/comment.model.ts',
        diff: true,
      },
    },
    {
      id: '14.9',
      title: 'IssueDetailStore: שני resources ופקודות',
      blocks: [
        {
          kind: 'p',
          text:
            '`client/src/app/core/state/issue-detail.store.ts` מחזיק `issueId` signal אחד. ' +
            'ממנו נגזרים שני `httpResource`: אחד ל-issue עצמו ואחד לתגובות. ' +
            'אם אין issue על המסך או אין login, ה-URL function מחזיר `undefined` ואין בקשה.',
        },
        {
          kind: 'p',
          text:
            'השמירה והוספת תגובה הן פקודות: `saveIssue` עושה `PUT /api/issues/{id}` ואז `reload`, ' +
            'ו-`addComment` עושה `POST` ואז מרענן רק את resource התגובות. ' +
            'ה-store לא יודע על form state, רק על API state.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch14',
        file: 'client/src/app/core/state/issue-detail.store.ts',
        region: 'step-14.9',
        diff: true,
      },
    },
    {
      id: '14.10',
      title: 'View Transitions כ-progressive enhancement',
      blocks: [
        {
          kind: 'p',
          text:
            '`client/src/app/app.config.ts` מוסיף `withViewTransitions({ skipInitialTransition: true })`. ' +
            'ה-router עובד גם בדפדפן בלי View Transitions; בדפדפן שתומך בזה, המעבר מקבל crossfade קטן.',
        },
        {
          kind: 'p',
          text:
            '`client/src/styles.scss` מכיל את `::view-transition-old(root)` ו-`::view-transition-new(root)`. ' +
            'אלה pseudo-elements גלובליים, ולכן הם לא שייכים ל-SCSS של קומפוננטה. ' +
            'ה-CSS גם מכבד `prefers-reduced-motion`.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch14',
        file: 'client/src/styles.scss',
        region: 'step-14.11b',
        diff: true,
      },
    },
    {
      id: '14.11',
      title: 'השורה בלוח הופכת לקישור',
      blocks: [
        {
          kind: 'p',
          text:
            '`client/src/app/features/issues/issue-row.ts` מוסיף `RouterLink`, ' +
            'ו-`client/src/app/features/issues/issue-row.html` הופך את הכותרת לקישור יחסי: `issues/{id}`. ' +
            'כי הרכיב כבר נמצא תחת `/projects/:projectId`, הקישור נשאר קצר.',
        },
        {
          kind: 'p',
          text:
            '`client/src/app/features/issues/issue-row.scss` שומר על המראה הקודם של השורה, ' +
            'אבל מוסיף hover עדין לכותרת. `client/src/app/features/issues/issue-board.html` לא מקבל state חדש; ' +
            'הוא רק ממשיך לצייר rows.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch14',
        file: 'client/src/app/features/issues/issue-row.html',
        diff: true,
      },
    },
    {
      id: '14.12',
      title: 'Signal Forms: המודל הוא signal',
      blocks: [
        {
          kind: 'p',
          text:
            '`client/src/app/features/issues/issue-detail.ts` מתחיל בשני model signals: ' +
            '`issueModel` לעריכת ה-issue ו-`commentModel` לתגובה חדשה. ' +
            'אין `FormGroup`, אין `FormControl`, ואין `null` בשדות הטופס. ' +
            'תיאור ריק מתורגם ל-null רק ברגע ששולחים ל-API.',
        },
        {
          kind: 'callout',
          tone: 'v22',
          title: 'Signal Forms',
          body:
            'ה-form נגזר מהמודל: `form(this.issueModel, schema)`. ' +
            'השדה עצמו הוא עץ, אבל state קוראים אחרי קריאה: `issueForm.title().errors()`, ' +
            'לא `issueForm.title.errors()`.',
        },
        {
          kind: 'term',
          name: 'Signal Form',
          definition:
            'טופס שנגזר מ-signal model. ה-form tree מספק state כמו `valid`, `pending`, `dirty` ו-`errors`, ' +
            'אבל הערכים עצמם נשארים במודל הסיגנלי.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch14',
        file: 'client/src/app/features/issues/issue-detail.ts',
        region: 'step-14.12',
        diff: true,
      },
    },
    {
      id: '14.13',
      title: 'ולידציה סינכרונית ושדה מצב',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-`issueForm` יש `required`, `minLength` ו-`maxLength`. ' +
            'ב-`client/src/app/features/issues/issue-detail.html` לא כותבים `name`, `value` או `disabled` על input עם `[formField]`; ' +
            'ה-directive מנהל את זה. ה-template קורא `issueForm.title().pending()` ו-`errors()` כדי להציג feedback.',
        },
        {
          kind: 'p',
          text:
            '`client/src/app/features/issues/issue-detail.scss` נותן layout צפוף: כרטיס form, grid לשדה סטטוס/עדיפות, ' +
            'ורספונסיביות פשוטה ב-720px. אין card בתוך card, ואין טקסט שצריך להידחס לתוך כפתור.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () =>
          import('./demos/signal-form-state.demo').then((m) => m.SignalFormStateDemo),
        caption:
          'דמו חי: כתבו title קצר מדי ואז תקנו אותו. ה-state בצד מתעדכן מתוך אותו Signal Form.',
      },
    },
    {
      id: '14.14',
      title: 'validateHttp: ולידציה אסינכרונית בלי effect',
      blocks: [
        {
          kind: 'p',
          text:
            '`validateHttp` על `issueForm.title` מקבל `request`, `onSuccess`, `onError` ו-`debounce`. ' +
            'אם הכותרת קצרה מדי או זהה לכותרת המקורית, `request` מחזיר `undefined` ולא יוצאת בקשה. ' +
            'אחרת הוא קורא ל-`title-available` ומחזיר שגיאה אם `available` הוא false.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            'אל תכתבו effect שמקשיב ל-title ושולח HTTP. זה עוקף את מנגנון ה-pending/errors של הטופס. ' +
            'Async validation שייכת לסכמה של הטופס, לא לקוד צדדי.',
        },
        {
          kind: 'term',
          name: 'async validation',
          definition:
            'ולידציה שמחזירה תשובה מאוחר יותר, בדרך כלל משרת. ב-Signal Forms היא מחוברת לשדה עצמו, ' +
            'ולכן השדה יודע מתי הוא `pending` ומתי להציג שגיאה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch14',
        file: 'client/src/app/features/issues/issue-detail.ts',
        region: 'step-14.14',
        diff: true,
      },
    },
    {
      id: '14.15',
      title: 'PriorityPicker: control מותאם',
      blocks: [
        {
          kind: 'p',
          text:
            '`client/src/app/features/issues/priority-picker.ts` מיישם `FormValueControl<IssuePriority>`. ' +
            'החוזה דורש דבר אחד: `value = model<IssuePriority>(...)`. ' +
            'בגלל זה `client/src/app/features/issues/priority-picker.html` יכול לשבת בתוך `[formField]="issueForm.priority"` כמו input רגיל.',
        },
        {
          kind: 'p',
          text:
            '`client/src/app/features/issues/priority-picker.scss` שומר על אותו token vocabulary של האפליקציה: ' +
            '`--bdr`, `--sur2`, `--txt1`, `--ember`. ' +
            'זה control חדש, אבל הוא לא מביא שפה ויזואלית חדשה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch14',
        file: 'client/src/app/features/issues/priority-picker.ts',
        region: 'step-14.15',
        diff: true,
      },
    },
    {
      id: '14.16',
      title: 'submit: פעולה רק כשהטופס תקין',
      blocks: [
        {
          kind: 'p',
          text:
            '`saveIssue` ו-`addComment` קוראים `submit(form, async () => ...)`. ' +
            'ה-submit מסמן שדות כ-touched, בודק sync ו-async validators, ורק אם הכול תקין מריץ את הפעולה. ' +
            'לכן כפתור יכול להיחסם על `form().invalid() || form().pending()` בלי state כפול.',
        },
        {
          kind: 'p',
          text:
            'אחרי שמירה מוצלחת, `IssueDetailStore.reload()` מחזיר את האמת מהשרת. ' +
            'אחרי תגובה מוצלחת, רק comments resource מתרענן. ' +
            'זה ההבדל בין “שמירת entity” לבין “הוספת item ל-thread”.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch14',
        file: 'client/src/app/features/issues/issue-detail.ts',
        region: 'step-14.16',
        diff: true,
      },
    },
    {
      id: '14.17',
      title: 'העץ אחרי פרק 14',
      blocks: [
        {
          kind: 'p',
          text:
            'בסוף הפרק יש לנו detail route, טופס עריכה, תגובות, ולידציה אסינכרונית ו-transition. ' +
            'זה כבר feature עומק, לא רק מסך רשימה. ' +
            'שימו לב שגם ch13 קיבל תיקון אבטחה: לוח שמציג ומעדכן issues חייב להיות resource-authorized.',
        },
        {
          kind: 'p',
          text:
            'הפרק הבא עובר לאיכות: בדיקות. עכשיו כשיש server endpoints, forms ו-navigation, ' +
            'אפשר ללמד איזה חלק נבדק ב-xUnit, איזה ב-TestBed, ואיזה ב-Playwright.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch14',
        title: 'TaskForge אחרי פרק 14',
      },
    },
  ],

  quiz: [
    {
      q: 'למה issue detail נבנה כ-route ולא כ-modal?',
      options: [
        'כי modal לא עובד עם Angular',
        'כי המסך צריך URL, deep link, refresh וחזרה טבעית ללוח',
        'כי Signal Forms דורש route',
        'כי comments חייבים lazy chunk נפרד',
      ],
      answer: 1,
      explain:
        'Modal מתאים לפעולה קצרה. Issue detail הוא מסך עבודה עם שמירה, תגובות וולידציה, ולכן URL עצמאי הוא חלק מהחוזה.',
    },
    {
      q: 'מה סדר ההרשאה הנכון ב-CommentEndpoints?',
      options: [
        'קודם לבדוק membership, אחר כך לבדוק שה-issue קיים',
        'קודם 404 אם ה-issue לא קיים, אחר כך 403 אם המשתמש אינו חבר בפרויקט',
        'RequireAuthorization מספיק לכל פעולה',
        'להחזיר 404 גם כשמשתמש אינו חבר בפרויקט',
      ],
      answer: 1,
      explain:
        'ה-handler צריך לדעת לאיזה פרויקט ה-issue שייך לפני בדיקת membership. לכן קודם טוענים issue, ואז בודקים חברות בפרויקט שלו.',
    },
    {
      q: 'מה אסור לעשות על input שמחובר עם `[formField]`?',
      options: [
        'אסור לשים אותו בתוך label',
        'אסור לכתוב static או bound value/name/disabled במקום לתת ל-directive לנהל אותם',
        'אסור להציג errors בתבנית',
        'אסור להשתמש ב-textarea',
      ],
      answer: 1,
      explain:
        'Signal Forms מנהל name/value/disabled דרך directive. כתיבה ידנית שלהם יוצרת חוזה כפול ועלולה להישבר בקומפילציה.',
    },
    {
      q: 'למה validateHttp עדיף כאן על effect ששולח fetch?',
      options: [
        'כי effect לא יכול לשלוח HTTP',
        'כי validateHttp מתחבר ל-pending/errors של השדה ומריץ רק אחרי sync validators',
        'כי validateHttp שומר אוטומטית ל-localStorage',
        'כי effect עובד רק בצד שרת',
      ],
      answer: 1,
      explain:
        'Async validation היא חלק מסכמת הטופס. כך הכפתור וה-UI יודעים על pending/errors בלי state נוסף.',
    },
    {
      q: 'מה הדבר המינימלי ש-custom FormValueControl חייב לספק?',
      options: [
        '`value = model<T>(...)`',
        '`ControlValueAccessor`',
        '`FormGroup`',
        '`@Output() changed`',
      ],
      answer: 0,
      explain:
        'ב-Signal Forms control מותאם שמייצג ערך מספק model signal בשם value. ה-directive מסנכרן אותו עם field tree.',
    },
    {
      q: 'איפה מגדירים CSS של View Transitions?',
      options: [
        'ב-SCSS של כל route component',
        'רק בקובץ TypeScript של ה-router',
        'ב-global stylesheet, כי `::view-transition-*` הם pseudo-elements גלובליים',
        'בתוך template עם style binding בלבד',
      ],
      answer: 2,
      explain:
        'ה-pseudo-elements של View Transitions אינם חלק מ-view encapsulation של קומפוננטה. לכן הם חיים ב-styles.scss.',
    },
  ],

  proveIt: [
    {
      title: 'הרצת snapshot פרק 14',
      body:
        'הריצו `pnpm verify:snapshots` מתוך `taskforge-companion/`. ' +
        'ה-gate בונה גם את השרת וגם את הקליינט של ch14.',
      command: 'pnpm verify:snapshots',
      expect: 'בסוף הפלט מופיעים `ch14 (dotnet) compiles`, `ch14 (ng) compiles`, ואז OK.',
    },
    {
      title: 'בדיקת comments API',
      body:
        'אחרי `node tools/materialize-snapshots.mjs`, הריצו את ch14 API על `http://localhost:5080`, ' +
        'התחברו כ-`demo@taskforge.dev` וקראו `GET /api/issues/1/comments`.',
      command: 'node tools/materialize-snapshots.mjs',
      expect: 'מתקבל מערך עם שתי תגובות seed, כולל `authorName`.',
    },
    {
      title: 'בדיקת title availability',
      body:
        'עם Bearer token של demo, קראו ' +
        '`/api/projects/1/issues/title-available?title=Fix login redirect loop&excludeIssueId=2`.',
      expect: '`available` חוזר false; עם `excludeIssueId=1` הוא חוזר true.',
    },
    {
      title: 'בדיקת detail route בדפדפן',
      body:
        'הריצו את API ואת client ch14, התחברו, פתחו `http://localhost:4500/projects/1`, ' +
        'ולחצו על כותרת issue בלוח.',
      expect: 'ה-URL עובר ל-`/projects/1/issues/<id>`, הטופס נטען, וניתן להוסיף תגובה.',
    },
    {
      title: 'בדיקת pending של title',
      body:
        'במסך detail שנו את הכותרת לשם קיים בפרויקט. צפו בשדה title ובכפתור save.',
      expect: 'השדה מציג בדיקה/שגיאה, וכפתור save חסום בזמן pending או invalid.',
    },
  ],

  exercise: {
    prompt:
      'הוסיפו עריכה ומחיקה של תגובות, בלי לשבור את דפוס ההרשאה של הפרק.',
    tasks: [
      'בשרת: הוסיפו `PUT /api/comments/{id}` ו-`DELETE /api/comments/{id}` ב-`CommentEndpoints`.',
      'ב-repository: הוסיפו מתודות שמחזירות 404 אם התגובה לא קיימת ו-403 אם המשתמש אינו חבר בפרויקט של ה-issue.',
      'בקליינט: הוסיפו כפתורי Edit/Delete לכל תגובה במסך `IssueDetail`.',
      'ב-UI: בזמן עריכה השתמשו ב-Signal Form קטן לגוף התגובה ושמרו על `[formField]` בלי `name` או `value`.',
    ],
    acceptance: [
      'חבר בפרויקט יכול לערוך ולמחוק תגובה.',
      'משתמש מחובר שאינו חבר בפרויקט מקבל 403.',
      'אחרי פעולה מוצלחת רשימת התגובות מתרעננת בלי לרענן את ה-issue כולו.',
      '`pnpm verify:snapshots`, `pnpm test`, `pnpm verify:coverage` ו-`pnpm build` עוברים.',
    ],
  },
};
