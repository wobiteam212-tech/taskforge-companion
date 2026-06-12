import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 13 — לוח ה-Issues.
 * Wave 3 ממשיך: סינון/חיפוש/מיון/דפדוף מסונכרנים ל-URL,
 * עדכונים אופטימיים עם rollback, ‎@defer ו-virtual scroll.
 */
export const CH13_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 13.1 */
    {
      id: '13.1',
      title: 'ה-seed מקבל רשימה אמיתית',
      blocks: [
        {
          kind: 'p',
          text:
            'פרק 12 הותיר את "Website Redesign" עם שני issues בלבד. ' +
            'כדי שסינון, מיון, דפדוף ו-virtual scroll יהיו מורגשים, צריך נפח אמיתי. ' +
            '`DbSeeder` מקבל לולאה שמוסיפה 58 issues נוספים — ' +
            'סה"כ 60 issues בפרויקט הזה. ' +
            'הנתונים דטרמיניסטיים: לולאה עם `modulo` על מערכי verbs ו-areas, ללא `Random`. ' +
            'כל `dotnet run` על DB חדש מייצר אותו DB בדיוק — אותה שאילתה, אותם צילומי מסך.',
        },
        {
          kind: 'p',
          text:
            'הסטטוס נקבע על ידי `(IssueStatus)(i % 3)` — ' +
            '0 = Open, 1 = InProgress, 2 = Done. ' +
            'העדיפות על ידי `(IssuePriority)(i % 4)`. ' +
            'התאריכים מרווחים בשבע שעות בין issue ל-issue. ' +
            'התוצאה: בקשה עם `pageSize=50` מחזירה "Page 1 of 2 — 60 issues".',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'דטרמיניזם ב-seed הוא מדיניות, לא נוחות. ' +
            'כשכל `dotnet run` מייצר אותו DB, ' +
            'תמיד ניתן לחזור לאותה נקודה — גם בבדיקות, גם בהדגמות, גם בצילומי מסך. ' +
            '`Random` ב-seed הוא bug latent שמופיע רק כשצריך לשחזר משהו.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch13',
        file: 'server/TaskForge.Infrastructure/Data/DbSeeder.cs',
        region: 'step-13.1',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 13.2 */
    {
      id: '13.2',
      title: 'מודל הקליינט: IssueListQuery ו-IssueSort',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-ch07 הוגדרו `IssueStatus` ו-`IssuePriority` כ-string unions. ' +
            'פרק 13 מוסיף שני טיפוסים חדשים ל-`issue.model.ts`: ' +
            '`IssueSort` — string union שמשקף את ארבעת מפתחות המיון שהשרת תומך בהם, ' +
            'ו-`IssueListQuery` — ממשק שמשקף את `IssueListParams` מ-ch04 בצד השרת (`[AsParameters]`). ' +
            'גם `UpdateIssueRequest` מוגדר — המראה של `PUT /api/issues/{id}` שיופעל בעדכון אופטימי.',
        },
        {
          kind: 'p',
          text:
            'למה לשקף את `IssueListParams` בקליינט? ' +
            'ה-store צריך לדעת אילו שדות לשלוח ב-query string ואילו ברירות מחדל להשמיט. ' +
            'בלי ממשק מפורש, ברירות המחדל יפוזרו בין הרכיב לבין ה-store. ' +
            'עם `IssueListQuery`, הממשק מגדיר מה קיים, ' +
            'וה-store מחליט מה לשים ב-URL על פי כללי "השמט ברירות מחדל".',
        },
        {
          kind: 'term',
          name: 'IssueListQuery',
          definition:
            'ממשק TypeScript שמשקף את `IssueListParams` בשרת. ' +
            'מגדיר `projectId`, `status`, `search`, `sort`, `page` ו-`pageSize`. ' +
            'ה-store ממיר אותו ל-`URLSearchParams` תוך השמטת ברירות מחדל, ' +
            'כך שה-URL היוצא נקי בדיוק כמו שאנשים מצפים לראות בשורת הכתובת.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch13',
        file: 'client/src/app/core/models/issue.model.ts',
        region: 'step-13.2',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 13.3 */
    {
      id: '13.3',
      title: 'IssuesStore: query signal + URL ריאקטיבי',
      blocks: [
        {
          kind: 'p',
          text:
            '`IssuesStore` אינו singleton גלובלי עם state רחב כמו `ProjectsStore`. ' +
            'ה-state שלו הוא `query` — signal אחד שמחזיק את `IssueListQuery | null`. ' +
            '`null` אומר "אין לוח על המסך, אין בקשה". ' +
            'הרכיב קורא ל-`setQuery(query)` בכל פעם שה-inputs שלו משתנים.',
        },
        {
          kind: 'p',
          text:
            '`httpResource` מקבל URL function. הפונקציה תלויה בשני signals: ' +
            '`query()` ו-`tokenStore.isLoggedIn()`. ' +
            'אם אחד מהם מחזיר null או false — הפונקציה מחזירה `undefined` ' +
            'ו-Angular לא שולח בקשה כלל. ' +
            'זה אותו דפוס מ-ch12 (`ProjectMembers`) — אך הפעם `query` לא נגזר מ-projectId בלבד, ' +
            'אלא מכלל הסינון הנוכחי.',
        },
        {
          kind: 'p',
          text:
            'ה-`URLSearchParams` בונה את ה-query string תוך השמטת ברירות מחדל: ' +
            '`status` מושמט אם null, `search` מושמט אם null, ' +
            '`sort` מושמט אם הוא `-created` (ברירת המחדל של השרת), ' +
            '`page` מושמט אם הוא 1. ' +
            'התוצאה: ה-URL של ה-`httpResource` זהה לחלוטין ל-URL שבשורת הכתובת.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה להשמיט ברירות מחדל מה-URL היוצא? ' +
            'כי URL עם ברירות מחדל מפורשות (`?sort=-created&page=1`) ' +
            'נראה מסורבל ומקשה על שיתוף קישורים. ' +
            'ב-ch10 למדנו ש-URL הוא state — ' +
            'URL נקי הוא state נקי. ' +
            'הרכיב מנרמל: אם הפרמטר חסר, הוא מניח ברירת מחדל.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch13',
        file: 'client/src/app/core/state/issues.store.ts',
        region: 'step-13.3',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 13.4 */
    {
      id: '13.4',
      title: 'linkedSignal — computed שמותר לכתוב אליו',
      blocks: [
        {
          kind: 'p',
          text:
            '`computed` הוא תמיד read-only: הוא נגזר מ-signals אחרים ואי-אפשר לכתוב אליו. ' +
            '`linkedSignal` הוא computed שמותר לכתוב אליו. ' +
            'ב-`IssuesStore`: `readonly issues = linkedSignal<Issue[]>(() => ' +
            'this.pageResource.hasValue() ? this.pageResource.value().items : [])`. ' +
            'בכל פעם ש-`pageResource` מחזיר ערך חדש מהשרת, ' +
            'ה-`linkedSignal` מתאפס לאמת החדשה. ' +
            'אבל בין תשובות — פקודה אופטימית יכולה לכתוב אליו: ' +
            '`issues.update(list => ...)` — ו-UI מתעדכן מיד.',
        },
        {
          kind: 'callout',
          tone: 'v22',
          title: 'linkedSignal — חדש ב-Angular v22',
          body:
            'לפני `linkedSignal`, פתרון נפוץ היה לשמור `WritableSignal` נפרד ו-`effect` ' +
            'שסנכרן אותו עם ה-resource. ' +
            'הבעיה: סנכרון ב-effect מייצר מצבים לא-עקביים בין renders. ' +
            '`linkedSignal` פותר את זה: האמת מהשרת קובעת תמיד — ' +
            'כל תגובת שרת מאפסת אותו, אבל בין תגובות הוא ניתן לעריכה מקומית. ' +
            'זה מאפשר עדכון אופטימי ללא state נוסף.',
        },
        {
          kind: 'term',
          name: 'linkedSignal',
          definition:
            'פרימיטיב חדש ב-Angular v22. כמו `computed` אך ניתן לכתיבה. ' +
            'מקבל פונקציה שמגדירה את ה"אמת" ממקור אחר — ' +
            'בכל פעם שהמקור משתנה ה-signal מתאפס לערך החדש. ' +
            'בין איפוסים, ניתן לכתוב אליו עם `.set()` או `.update()`. ' +
            'שימוש קלאסי: רשימה שמגיעה מ-httpResource, שניתן לערוך אותה אופטימית.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch13',
        file: 'client/src/app/core/state/issues.store.ts',
        region: 'step-13.4',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 13.5 */
    {
      id: '13.5',
      title: 'עדכון אופטימי עם rollback',
      blocks: [
        {
          kind: 'p',
          text:
            '`setStatus` היא הפקודה האופטימית. השלבים: ' +
            'ראשית — שמירת המצב הנוכחי: `const before = this.issues()`. ' +
            'שנית — עדכון מיידי של ה-`linkedSignal`: ' +
            '`this.issues.update(list => list.map(i => i.id === issue.id ? ...i, status} : i))`. ' +
            'ה-UI מציג את השינוי מיד, לפני שיצאה בקשה לשרת. ' +
            'שלישית — `PUT /api/issues/{id}` בלוק `try`. ' +
            'הצלחה: `this.pageResource.reload()` — מיישר את הרשימה מול השרת. ' +
            'כישלון: `this.issues.set(before)` — הרשימה חוזרת לאמת הקודמת. ' +
            'ה-toast כבר הופיע מה-`errorInterceptor` של ch11.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מתי לבחור עדכון אופטימי ומתי פסימי?',
          body:
            'עדכון אופטימי מתאים כש: (א) הפעולה בדרך כלל מצליחה (PUT לשינוי status), ' +
            '(ב) rollback קל ומוגדר, (ג) הפיגור מורגש למשתמש (800ms+ עד ה-API). ' +
            'עדכון פסימי עדיף כש: (א) הפעולה עלולה להיכשל מסיבות עסקיות (יצירת פרויקט שהשם תפוס), ' +
            '(ב) ה-rollback מורכב (עדכון שתלוי ב-id שהשרת מייצר), ' +
            '(ג) שגיאה גלויה עדיפה על הבטחה שבורה. ' +
            'שינוי סטטוס: אופטימי. יצירת פרויקט: פסימי (ch12 `addProject` המתין ל-201).',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch13',
        file: 'client/src/app/core/state/issues.store.ts',
        region: 'step-13.5',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 13.6 */
    {
      id: '13.6',
      title: 'IssueBoard: inputs + query נגזר + effect ל-store',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-ch10 הוגדר `withComponentInputBinding` ב-`app.config.ts`. ' +
            'הודות לזה, `ProjectBoard` קיבל את `projectId` מ-URL בלי `ActivatedRoute`. ' +
            'פרק 13 מרחיב: `ProjectBoard` מוסיף inputs עבור `status`, `q`, `sort` ו-`page` — ' +
            'כולם query-params מה-URL. ' +
            'הוא מעביר אותם ל-`IssueBoard` כ-inputs. ' +
            'ה-`IssueBoard` הוא הרכיב החכם: הוא מנרמל את ה-inputs ל-`IssueListQuery` מחושב, ' +
            'וב-`effect` כותב אותו ל-`IssuesStore`.',
        },
        {
          kind: 'p',
          text:
            'נורמליזציה היא חובה: ה-URL פתוח לכולם. ' +
            'ערכים לא-חוקיים (status לא בקבוצה, page שלילי) מוחזרים לברירת המחדל. ' +
            'ה-`computed` מגדיר את חוזה הנורמליזציה פעם אחת — ' +
            'ה-store ו-ה-API אף פעם לא מקבלים ערכים פגומים. ' +
            '`effect(() => this.store.setQuery(this.query()))` ' +
            'מחבר בין המחושב לפקודה של ה-store בצורה הכי קצרה שיש.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה ה-state לא גר ב-`IssueBoard` כ-`WritableSignal`? ' +
            'כי אז "URL כ-state" מ-ch10 הייתה שקר למחצה: ' +
            'הרענון היה מאבד את המצב, הכפתור אחורה לא היה עובד, ' +
            'ושיתוף קישור היה שולח משתמשים לדף ריק. ' +
            'ה-state גר ב-URL — הרכיב רק קורא ממנו ומנווט אליו.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch13',
        file: 'client/src/app/features/issues/issue-board.ts',
        region: 'step-13.6',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 13.7 */
    {
      id: '13.7',
      title: 'patchUrl + debounce לחיפוש + מיון + דפדוף',
      blocks: [
        {
          kind: 'p',
          text:
            '`patchUrl` היא הפרימיטיב של הרכיב: ' +
            '`router.navigate([], { relativeTo: this.route, queryParams: patch, queryParamsHandling: "merge" })`. ' +
            '`merge` שומר על כל query-params שאינם ב-`patch`. ' +
            '`null` בערך של פרמטר מוחק אותו מה-URL. ' +
            'כל שינוי מסנן קורא ל-`patchUrl` עם `{ page: null }` — ' +
            'כי שינוי סינון תמיד חוזר לעמוד 1.',
        },
        {
          kind: 'p',
          text:
            'חיפוש מקבל debounce של 250ms: `clearTimeout(this.searchTimer); this.searchTimer = setTimeout(...)`. ' +
            'זה debounce פשוט בלי rxjs — setTimeout רגיל שנמחק בכל הקשה. ' +
            'ה-DestroyRef מנקה את ה-timer בהריסת הרכיב: `destroyRef.onDestroy(() => clearTimeout(this.searchTimer))`. ' +
            'עקרון: debounce הוא דאגת UI — ה-store נשאר סינכרוני ופשוט.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'ניקוי ה-timer ב-`onDestroy` הוא הרגל שמונע memory leak ו-race condition: ' +
            'timer שמסתיים אחרי שהרכיב נהרס ינסה לנווט לאחר שה-route כבר השתנה. ' +
            'ב-ch11 וב-ch12 ניקינו timers של demo ב-DestroyRef — כאן אותו כלל חל על קוד production.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch13',
        file: 'client/src/app/features/issues/issue-board.ts',
        region: 'step-13.7',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 13.7b */
    {
      id: '13.7b',
      title: 'ה-toolbar: chips + חיפוש + מיון',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-toolbar של `issue-board.html` בנוי משלושה פקדים. ' +
            'ה-chips לסינון סטטוס הם `<a routerLink>` עם `queryParamsHandling="merge"` — ' +
            'אותו דפוס שלמדנו ב-ch10 לסינון URL. ' +
            'ה-chip "All" מנווט עם `{ status: null, page: null }` — מוחק גם את ה-status וגם את הדף. ' +
            'שדה החיפוש מחזיק `[value]="search() ?? \'\'"` — קורא מה-input, ' +
            'ומאזין ל-`(input)` שקורא ל-`onSearch()`. ' +
            'ה-select למיון מאזין ל-`(change)` שקורא ל-`onSort()`.',
        },
        {
          kind: 'p',
          text:
            'שלושת הפקדים לא מחזיקים state מקומי. ' +
            'כל אחד מהם קורא ערך מ-input (שבא מ-URL) ופולט שינוי שמנווט את ה-URL. ' +
            'כשה-URL משתנה, ה-router מעדכן את ה-inputs, ' +
            'שמעדכנים את ה-query, שמעדכנים את ה-resource — מעגל שלם. ' +
            'רענון דף שומר את הסינון. כפתור אחורה צועד אחורה בהיסטוריית הסינון.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch13',
        file: 'client/src/app/features/issues/issue-board.html',
        region: 'step-13.7b',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 13.8 */
    {
      id: '13.8',
      title: 'changeStatus ו-trackId — ממשק עם ה-store',
      blocks: [
        {
          kind: 'p',
          text:
            '`changeStatus(issue, status)` היא הפקודה שה-template קורא לה. ' +
            'הרכיב רק מעביר הלאה: `void this.store.setStatus(issue, status)`. ' +
            'הוא לא יודע על הפרטים — לא על `before`, לא על rollback, לא על ה-PUT. ' +
            'גבול האחריות ברור: הרכיב מתרגם event לפקודה, ה-store מבצע.',
        },
        {
          kind: 'p',
          text:
            '`trackId` הוא פונקציית `trackBy` ל-`*cdkVirtualFor`: ' +
            '`(_: number, issue: Issue) => issue.id`. ' +
            'כשה-`linkedSignal` מתעדכן אופטימית ואחר כך מתאפס מהשרת, ' +
            'Angular צריך לדעת אילו שורות לשמר. ' +
            'בלי `trackBy`, כל עדכון היה הורס ובונה את כל ה-DOM של ה-viewport. ' +
            'עם `trackBy`, רק השורה שה-id שלה השתנה מתרענן.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch13',
        file: 'client/src/app/features/issues/issue-board.ts',
        region: 'step-13.8',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 13.9 */
    {
      id: '13.9',
      title: 'מכונת מצבים + defer on viewport + cdk-virtual-scroll-viewport',
      blocks: [
        {
          kind: 'p',
          text:
            'מכונת המצבים של ה-board: ' +
            '`!tokenStore.isLoggedIn()` — "Sign in to see the issue board." (' +
            'אנונימי; בקשה לא נשלחת כלל). ' +
            '`store.loadError() && !store.issues().length` — כרטיס שגיאה עם "Try again". ' +
            '`store.loading() && !store.issues().length` — skeleton list (5 שורות). ' +
            '`!store.issues().length` — "No issues match." עם "Clear filters". ' +
            'ברירת מחדל — הרשימה האמיתית.',
        },
        {
          kind: 'p',
          text:
            'הרשימה עצמה עטופה ב-`@defer (on viewport)`. ' +
            'זה אומר: Angular לא יוריד את קוד `IssueRow` לדפדפן ' +
            'עד שהאלמנט נכנס ל-viewport. ' +
            'ה-`@placeholder` מציג skeleton — מונע layout shift. ' +
            'בתוך ה-defer: `<cdk-virtual-scroll-viewport [itemSize]="56">` ' +
            'עם `*cdkVirtualFor`. ' +
            'בדיקה ב-DevTools: עם 50 items בעמוד, ' +
            'רק 11-12 אלמנטי `tf-issue-row` קיימים ב-DOM.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה גם דפדוף וגם virtual scroll?',
          body:
            'דפדוף פותר עלות רשת: לא שולחים 60 issues אם המשתמש רואה 12. ' +
            'virtual scroll פותר עלות DOM: 50 nodes ב-DOM כבדים מ-12 nodes. ' +
            'השניים פותרים בעיות שונות ומשלימים זה את זה. ' +
            'pageSize=50 הוא trade-off: גדול מספיק כדי שה-virtual scroll יהיה מורגש, ' +
            'קטן מספיק כדי שהרשת לא תסבול.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch13',
        file: 'client/src/app/features/issues/issue-board.html',
        region: 'step-13.9',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 13.9b */
    {
      id: '13.9b',
      title: 'SCSS: גובה קבוע כחוזה ה-viewport',
      blocks: [
        {
          kind: 'p',
          text:
            '`cdk-virtual-scroll-viewport` דורש גובה מפורש — בלי זה, ה-recycler לא יודע כמה items להציג. ' +
            '`.vs { height: min(52vh, 460px) }` נותן גובה קבוע שמתאים הן למסכים קטנים הן לגדולים. ' +
            'ה-`.stale` modifier מוסיף `opacity: 0.6` — מסמן "מחכה לתשובה חדשה" בזמן שהנתונים הישנים עדיין גלויים.',
        },
        {
          kind: 'p',
          text:
            'skeleton list משתמש ב-`skel-row` בגובה 52px — ' +
            'זהה ל-`itemSize` של ה-viewport. ' +
            'כך מעבר בין skeleton לרשימה אמיתית חלק ללא layout shift. ' +
            'האנימציה על `opacity` בלבד — זולה ל-compositor, ' +
            'בדיוק כמו ב-ch12.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            'cdk-virtual-scroll-viewport לא עובד ב-`overflow: auto` של אב. ' +
            'אם רכיב אב מגביל את ה-scroll, ה-viewport לא יזהה את הגלילה ' +
            'ויציג רק את ה-items הראשונים. ' +
            'פתרון: ה-viewport עצמו הוא ה-scroll container — ' +
            '`overflow: auto` ו-`height` קבוע רק עליו.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch13',
        file: 'client/src/app/features/issues/issue-board.scss',
        region: 'step-13.9b',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 13.10 */
    {
      id: '13.10',
      title: 'IssueRow: רכיב טיפש עם output',
      blocks: [
        {
          kind: 'p',
          text:
            '`IssueRow` הוא הרכיב הטיפש של הפרק: ' +
            '`issue` נכנס כ-`input.required<Issue>()`, ' +
            '`statusChange` יוצא כ-`output<IssueStatus>()`. ' +
            'הוא לא מכיר את ה-store, לא את הראוטר, לא את ה-optimistic logic. ' +
            '`toneOf(status)` ממפה status ל-tone של `TfBadge`. ' +
            '`onSelect(value)` פולט `statusChange` רק אם הערך שונה מהנוכחי.',
        },
        {
          kind: 'p',
          text:
            'הפרדה זו היא שמאפשרת ל-virtual scroll לעבוד נכון. ' +
            'ה-recycler של CDK מחזיר מחדש node של DOM שהיה issue #5 ' +
            'כדי להציג issue #23. ' +
            'אם ה-row היה מזריק `IssuesStore` ישירות, ' +
            'ה-component instance הישן היה מנסה לקרוא store query עבור id שהשתנה. ' +
            'רכיב טיפש שמקבל data כ-input לא סובל מבעיה זו.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מדוע IssueRow הוא רכיב נפרד ולא markup ישיר ב-board?',
          body:
            'שני טעמים שמשלימים זה את זה. ' +
            'ראשית, lazy chunk: כשאנגולר מבנה `@defer`, ' +
            'כל component שמיובא רק שם מקבל chunk משלו. ' +
            '`IssueRow` יובא רק ב-`IssueBoard`, ' +
            'שנמצא ב-`@defer` — ולכן ה-build מייצר chunk נפרד לשורה. ' +
            'שנית, virtual scroll recycling: ה-recycler של CDK מחזיר אלמנטים ב-DOM ' +
            'ומעדכן אותם דרך inputs — ' +
            'רכיב ש"יודע יותר מדי" לא ניתן למחזור בבטחה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch13',
        file: 'client/src/app/features/issues/issue-row.ts',
        region: 'step-13.10',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 13.10b */
    {
      id: '13.10b',
      title: 'IssueRow SCSS: עיצוב השורה',
      blocks: [
        {
          kind: 'p',
          text:
            'כל שורה היא flex container: `row-main` גדל (בעל `margin-inline-end: auto`), ' +
            '`tf-badge` ו-`status-pick` נשארים בגודל טבעי. ' +
            'שורת issue עם סטטוס `Done` מקבלת `.row--done` — ' +
            'הכותרת עוברת `text-decoration: line-through` ו-`color: var(--txt3)`. ' +
            'זה signal ויזואלי: "הפריט סגור, אפשר להתעלם ממנו".',
        },
        {
          kind: 'p',
          text:
            'צבעי `prio`: Critical = `--danger`, High = `color-mix(in srgb, var(--danger) 65%, var(--txt2))`, ' +
            'Medium = `--ember`, Low = `--txt3`. ' +
            'זה אותו ספקטרום שה-demo משתמש בו — ' +
            'הגדרה אחת, שני מקומות, אותה שפה ויזואלית.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch13',
        file: 'client/src/app/features/issues/issue-row.scss',
        region: 'step-13.10b',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 13.11 */
    {
      id: '13.11',
      title: 'ProjectBoard מוסיף query-param inputs',
      blocks: [
        {
          kind: 'p',
          text:
            '`ProjectBoard` הוא ה-route component — הוא הבעלים של חוזה ה-URL. ' +
            'עם `withComponentInputBinding`, הראוטר מקשר קווי query-params ישירות ל-inputs. ' +
            'פרק 13 מוסיף `status`, `q`, `sort` ו-`page` כ-inputs אופציונליים. ' +
            'שימו לב לשינוי השם: ב-URL הפרמטר נקרא `q` (קצר), ' +
            'ולכן ה-input ב-`ProjectBoard` חייב להיקרא `q` — הראוטר קושר לפי שם. ' +
            'ההמרה לשם המלא קורית בתבנית: `[search]="q()"` — ' +
            'ה-`IssueBoard` מקבל `search` ולא יודע שה-URL השתמש ב-`q`.',
        },
        {
          kind: 'p',
          text:
            'אחריות ה-`ProjectBoard`: לקבל params מהראוטר ולהעביר הלאה. ' +
            'אחריות ה-`IssueBoard`: לנרמל ולהפוך ל-query. ' +
            'מה ש-`ProjectBoard` לא עושה: שולח בקשות, מנהל state, מכיר את ה-store. ' +
            'הוא רק מארח — בדיוק כפי שהמחבר כתב ב-ch12.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch13',
        file: 'client/src/app/features/projects/project-board.ts',
        region: 'step-13.11',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 13.11b */
    {
      id: '13.11b',
      title: 'project-board.html: IssueBoard מוטמע',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-ch12 היה placeholder "תגיע issue board". ' +
            'עכשיו הוא מוחלף ב-`<tf-issue-board [projectId]="projectId()" [status]="status()" ' +
            '[search]="q()" [sort]="sort()" [page]="page() ?? 1" />`. ' +
            'הערכים זורמים מה-URL דרך `ProjectBoard` אל `IssueBoard`. ' +
            '`<tf-project-members>` נשאר מתחת — אותה ארכיטקטורה. ' +
            'ה-board אינו יודע מה גר בתוך `tf-issue-board` — הוא מסר ערכים ועף.',
        },
        {
          kind: 'p',
          text:
            'מסנני הסטטוס שהיו ב-ch10 ישירות ב-`project-board.html` עברו פנימה ל-`tf-issue-board`. ' +
            'ה-URL API זהה: `?status=Open` עדיין עובד — ' +
            'רק מי שמצייר אותו ומגיב אליו שונה (עכשיו: ה-board).',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch13',
        file: 'client/src/app/features/projects/project-board.html',
        region: 'step-13.11b',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 13.12 */
    {
      id: '13.12',
      title: 'issue-row.html — תבנית השורה',
      blocks: [
        {
          kind: 'p',
          text:
            'תבנית `issue-row.html` מרכיבה את השורה: ' +
            '`row-main` עם title ו-meta (priority + labels), ' +
            'אחריו `tf-badge` עם tone לפי סטטוס, ' +
            'ואחריו `status-pick` עם select. ' +
            'ה-select מחזיק `[name]="\'issue-status-\' + issue().id"` — ' +
            'שם ייחודי לכל שורה (נגישות). ' +
            '`(change)="onSelect($any($event.target).value)"` פולט את הערך החדש. ' +
            'ה-`@for` על labels מציג תגיות כ-chips קטנים.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'שדה select בלי `aria-label` ובלי `<label>` מחובר הוא בלתי נגיש. ' +
            '`visually-hidden` span עם "Change status of..." עוזר לקורא מסך ' +
            'לזהות את הפקד — הטקסט גלוי רק לטכנולוגיות מסייעות.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch13',
        file: 'client/src/app/features/issues/issue-row.html',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 13.13 */
    {
      id: '13.13',
      title: 'defer on viewport — אנטומיה וחלוקת chunk',
      blocks: [
        {
          kind: 'p',
          text:
            '`@defer (on viewport)` הוא אחד מ-triggers שמגדיר Angular. ' +
            'הוא מפקח על viewport intersection: ברגע שה-placeholder נכנס ל-viewport, ' +
            'Angular מוריד את ה-bundle של הרכיבים המדוחים ומציג אותם. ' +
            'עד לאותו רגע — ה-`@placeholder` גלוי (skeleton). ' +
            'ה-effect: chunk נפרד ב-dist שכולל `IssueRow` ואת כל מה שמיובא רק שם.',
        },
        {
          kind: 'p',
          text:
            'בדיקת ה-build מוכיחה: ה-chunk `issue-row` שוקל 3.24 kB בנפרד. ' +
            'ה-chunk `project-board` שוקל 42.91 kB וכולל את קוד CDK Scrolling. ' +
            'ה-`@defer` הוא הגבול: `ScrollingModule` נמצא ב-`IssueBoard` (ב-`project-board` chunk), ' +
            '`IssueRow` נמצא רק בתוך ה-`@defer` ולכן מקבל chunk משלו.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'triggers נוספים של `@defer`: ' +
            '`on idle` (כשה-browser פנוי), ' +
            '`on interaction` (על click/focus על ה-placeholder), ' +
            '`on timer(2s)` (אחרי עיכוב), ' +
            '`when condition` (כשתנאי בוליאני מתקיים). ' +
            'ניתן לשלב: `@defer (on viewport; on idle)` — הראשון שמתרחש.',
        },
        {
          kind: 'term',
          name: '@defer',
          definition:
            'בלוק Angular שדוחה טעינת קוד וקומפוננטות עד לתנאי מסוים. ' +
            'עם trigger `on viewport`, Angular ממתין עד שה-placeholder נכנס לתחום הראייה. ' +
            'התוצאה: code splitting אוטומטי — כל מה שמיובא רק בתוך `@defer` ' +
            'מקבל lazy chunk נפרד.',
        },
      ],
      panel: {
        kind: 'diagram',
        caption: 'defer on viewport: ה-placeholder גלוי, הקוד לא יורד. כניסה ל-viewport = Angular מוריד chunk ומחליף.',
        mermaid: `sequenceDiagram
  participant Browser
  participant Angular
  participant Server as CDN/Server

  Note over Browser: page loads — placeholder visible
  Browser->>Angular: viewport intersects placeholder
  Angular->>Server: fetch issue-row chunk (3.24 kB)
  Server-->>Angular: chunk received
  Angular->>Browser: render cdk-virtual-scroll-viewport + IssueRow`,
      },
    },

    /* ------------------------------------------------------------ 13.14 */
    {
      id: '13.14',
      title: 'virtual scroll: itemSize, recycling ו-DOM count',
      blocks: [
        {
          kind: 'p',
          text:
            '`[itemSize]="56"` מגדיר את גובה כל שורה בפיקסלים. ' +
            'CDK משתמש בערך הזה לחישוב: ' +
            '"כמה items יכולים להיות גלויים ב-viewport בגובה 460px?" ' +
            'התשובה: כ-8 items ועוד buffer. ' +
            'לכן עם 50 items ב-store, רק 11-12 אלמנטי `tf-issue-row` ' +
            'קיימים ב-DOM בכל רגע — לא 50.',
        },
        {
          kind: 'p',
          text:
            'כשמגללים — CDK לוקח שורות שיצאו מה-viewport ' +
            'ומשנה את ה-inputs שלהן לנתונים החדשים. ' +
            'ה-DOM node לא נהרס ונוצר מחדש — הוא מוחזר. ' +
            'זה ה-recycling. לכן `trackBy` חשוב: ' +
            'בלי `trackBy`, Angular לא יודע אם שינוי ב-input הוא עדכון של issue ישן ' +
            'או החלפה ל-issue חדש לגמרי.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            'גובה שורה משתנה שובר את `[itemSize]`. ' +
            'CDK Virtual Scroll בסיסי מניח שכל שורה בגובה זהה. ' +
            'אם issues שונים גדולים שונה (description ארוך, labels רבות), ' +
            'ה-scroll position יקפוץ. ' +
            'פתרון: כולאים את גובה ה-row ב-CSS (`overflow: hidden`, גובה קבוע), ' +
            'או עוברים ל-`AutoSizeVirtualScrollStrategy` מ-CDK Experimental.',
        },
      ],
      panel: {
        kind: 'diagram',
        caption: 'Virtual scroll: מ-50 issues ב-store, רק 11-12 אלמנטים קיימים ב-DOM. גלילה = recycling, לא יצירה.',
        mermaid: `flowchart TD
  Store["issues: 50 items"]
  VS["cdk-virtual-scroll-viewport\\nheight: 460px, itemSize: 56"]
  DOM["DOM: ~11-12 tf-issue-row nodes"]
  Recycle["Recycler: מחזיר nodes שיצאו\\nמעדכן inputs לנתונים חדשים"]

  Store --> VS
  VS --> DOM
  DOM --> Recycle
  Recycle --> DOM`,
      },
    },

    /* ------------------------------------------------------------ 13.15 */
    {
      id: '13.15',
      title: 'דמו חי — עדכון אופטימי עם rollback',
      blocks: [
        {
          kind: 'p',
          text:
            'הדמו מממש את אותו מחזור שנמצא ב-`IssuesStore.setStatus`: ' +
            '`linkedSignal` מחזיק רשימת issues מדומה. ' +
            'כשמשנים סטטוס, הרשימה מתעדכנת מיד (optimistic). ' +
            'אחרי ~900ms, בקשה מדומה "חוזרת": ' +
            'בלי "Break the server" — `serverIssues` מתעדכן, ה-linkedSignal מתאפס לאמת החדשה. ' +
            'עם "Break the server" — `issues.set(before)` מחזיר לסטטוס הקודם.',
        },
        {
          kind: 'ul',
          items: [
            'ללא "Break the server": badge מתהפך מיד לסטטוס החדש (optimistic), ואחרי ~900ms ה-log מציג Confirmed.',
            'עם "Break the server": badge מתהפך (optimistic), ואחרי ~900ms חוזר לסטטוס הקודם (rollback) + שורת שגיאה ב-log.',
            'כל ה-timer נוקה ב-DestroyRef.onDestroy — אין memory leak גם אם הסרת הדמו מה-DOM.',
            'ה-`pendingId` signal מנטרל לחיצות כפולות: כשיש בקשה פעילה, כל ה-selects מנוטרלים עד שהיא מסתיימת.',
          ],
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () =>
          import('./demos/optimistic-rollback.demo').then((m) => m.OptimisticRollbackDemo),
        caption:
          'דמו חי: עדכון אופטימי עם rollback. "Break the server" מפעיל rollback לאחר ~900ms. ה-log מתעד את כל שלבי המחזור.',
      },
    },

    /* ------------------------------------------------------------ 13.16 */
    {
      id: '13.16',
      title: 'ה-URL כמקור האמת — ניווט, רענון, שיתוף',
      blocks: [
        {
          kind: 'p',
          text:
            'הוכחת ה-URL כ-state (מ-ch10) בפעולה על board אמיתי: ' +
            'ניווט ל-`?status=Open` מציג 21 issues. ' +
            'הוספת `?status=Open&q=navbar` מציג 3 issues. ' +
            'הוספת `&sort=priority` מסדר מחדש: ' +
            '"Fix the navbar (01)" עולה ראשון — כל שלושת ה-navbar+Open הם Low priority, ' +
            'ה-tiebreak הוא `CreatedAtUtc` ascending, ' +
            'ולכן הישן ביותר קודם. ' +
            'שינוי מסנן מוחק את `page` מה-URL — חזרה לעמוד 1.',
        },
        {
          kind: 'p',
          text:
            'רענון באמצע סינון: ה-inputs מאוכלסים מ-URL, ה-query מחושב מחדש, ' +
            'הבקשה יוצאת עם אותם params — המסך חוזר לאותה תוצאה. ' +
            'כפתור אחורה: כל `router.navigate` נרשם ב-history. ' +
            'אחורה = ה-URL הקודם = הסינון הקודם = הבקשה הקודמת. ' +
            'שיתוף קישור: URL עם params = מצב מדויק שניתן לשתף.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה היתרון של URL כ-state על פני signal מקומי?',
          body:
            'signal מקומי (`private readonly statusFilter = signal("Open")`) ' +
            'מת ברענון, לא ניתן לשתף, וכפתור אחורה לא עוזר. ' +
            'URL כ-state: (א) ניתן לשמור בבוקמרק, (ב) רענון שומר state, ' +
            '(ג) כפתור אחורה עובד, (ד) שיתוף קישור עם קולגה שולח אותם לאותה תצוגה. ' +
            'ב-ch10 למדנו את העקרון; פרק 13 הוא היישום הראשון ב-feature אמיתי.',
        },
      ],
      panel: {
        kind: 'diagram',
        caption: 'מחזור URL כ-state: input bindings קוראים מה-URL, actions מנווטים אליו, resource גוזר בקשה מה-query.',
        mermaid: `flowchart LR
  URL["URL Params\\n?status&q&sort&page"]
  PB["ProjectBoard\\ninputs"]
  IB["IssueBoard\\ncomputed query"]
  Store["IssuesStore\\nhttpResource"]
  API["GET /api/projects/{id}/issues"]
  UI["Virtual Scroll List"]

  URL --> PB
  PB --> IB
  IB --> Store
  Store --> API
  API --> Store
  Store --> UI
  UI -->|"user action: navigate"| URL`,
      },
    },

    /* ------------------------------------------------------------ 13.17 */
    {
      id: '13.17',
      title: 'client/package.json — CDK ^22',
      blocks: [
        {
          kind: 'p',
          text:
            '`@angular/cdk: "^22.0.0"` נוסף ל-`package.json` של הקליינט. ' +
            'גרסת CDK חייבת להתאים למייג׳ור של Angular — ' +
            '`^22` תמנע מ-pnpm להתקין CDK ^21 שאינו תואם. ' +
            'ב-`IssueBoard`, `imports: [ScrollingModule]` — ' +
            'מ-`@angular/cdk/scrolling`. ' +
            '`cdk-virtual-scroll-viewport` ו-`*cdkVirtualFor` הם חלק מ-`ScrollingModule`.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            'caret `^22.0.0` אומר "כל 22.x.x" — Angular CLI ו-CDK ' +
            'צריכים לחלוק את אותו major. ' +
            'npm/pnpm יוכלו לבחור `22.1.0`, `22.2.3` וכו\' — ' +
            'אבל לא `23.0.0` ולא `21.x`. ' +
            'אם תתקלו ב-`Peer dependency conflict`, בדקו שהגרסאות של `@angular/core` ' +
            'ו-`@angular/cdk` זהות.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch13',
        file: 'client/package.json',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 13.18 */
    {
      id: '13.18',
      title: 'פינאלה — לוח Issues שלם',
      blocks: [
        {
          kind: 'p',
          text:
            'המסך הראשון שמרגיש כמו מוצר. ' +
            'הצינור שנבנה לאורך 12 פרקים מסתיים כאן: ' +
            'URL כ-state (ch10), httpResource ריאקטיבי (ch11), ' +
            'linkedSignal ו-optimistic update (ch13), ' +
            'virtual scroll ו-@defer לביצועים, ' +
            'errorInterceptor שתופס כישלון (ch11) ומאפשר rollback. ' +
            'כל חלק עצמאי, כל חלק ניתן לבדיקה בנפרד.',
        },
        {
          kind: 'ul',
          items: [
            'server: DbSeeder — 60 issues דטרמיניסטיים.',
            'client: issue.model.ts — IssueListQuery, IssueSort, UpdateIssueRequest.',
            'client: issues.store.ts — query signal, httpResource ריאקטיבי, linkedSignal, setStatus אופטימי.',
            'client: issue-board.ts/.html/.scss — smart component, toolbar, state machine, @defer + virtual scroll.',
            'client: issue-row.ts/.html/.scss — dumb component, output, recycling-safe.',
            'client: project-board.ts/.html — inputs לquery-params, העברה ל-IssueBoard.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'לאן ממשיכים',
          body:
            'פרק 14 "Issue ותגובות" פותח את Signal Forms לעומק: ' +
            'ולידציות מדויקות, ולידציה אסינכרונית (unique title?), ' +
            'רכיבי טופס מותאמים (custom form controls), ' +
            'ו-View Transitions לניווט חלק בין הלוח לדף ה-issue. ' +
            'ה-`projectId` שזורם היום ל-`IssueBoard` ישמש גם לניווט ל-`IssueDetail`.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch13',
        title: 'עץ הקוד אחרי פרק 13 — לוח Issues שלם',
      },
    },
  ],

  quiz: [
    {
      q: 'linkedSignal נבדל מ-computed בכך ש:',
      options: [
        'הוא מחושב בצורה lazy ולא eager',
        'הוא ניתן לכתיבה — ניתן לקרוא לו .set()/.update() בין תשובות שרת',
        'הוא לא תלוי בsignal אחרים — הוא signal עצמאי',
        'הוא מסנכרן אוטומטית עם localStorage',
      ],
      answer: 1,
      explain:
        'computed הוא תמיד read-only: ניסיון לקרוא ל-.set() על computed יזרוק שגיאה בזמן ריצה. ' +
        'linkedSignal הוא computed שניתן לכתוב אליו — בכל פעם שהמקור (pageResource) משתנה, ' +
        'הוא מתאפס לאמת החדשה, אבל בין תגובות שרת ניתן לערוך אותו מקומית עם update() לצורך optimistic update.',
    },
    {
      q: 'מדוע URLSearchParams ב-IssuesStore משמיט sort="-created" מה-URL היוצא?',
      options: [
        'כי "-created" הוא ערך לא חוקי ב-URLSearchParams',
        'כי ה-server לא מכיר את הערך הזה',
        'כי -created הוא ברירת המחדל של השרת — URL ללא sort פרמטר = sorted by -created, וה-URL נשאר נקי',
        'כי query-params עם מקף לא עובדים ב-Angular router',
      ],
      answer: 2,
      explain:
        'השרת מוגדר (מ-ch04) להשתמש ב-OrderByDescending(CreatedAtUtc) כברירת מחדל כש-sort חסר. ' +
        'ולכן אם הסדר הנבחר הוא -created, אין טעם לשלוח sort=-created ב-URL — ' +
        'ה-URL יהיה מסורבל והתוצאה זהה. ' +
        'URL נקי = state מינימלי = קישורים נוחים לשיתוף.',
    },
    {
      q: 'cdk-virtual-scroll-viewport דורש height מפורש — מה קורה בלי זה?',
      options: [
        'הרכיב נזרק שגיאה בזמן compile',
        'כל ה-50 items נטענים ב-DOM כרגיל, בלי recycling',
        'ה-viewport מתמוטט לגובה 0 ו-recycler לא מציג כלום',
        'ה-scroll לא עובד אבל כל הנתונים גלויים',
      ],
      answer: 2,
      explain:
        'ה-recycler של CDK צריך לדעת כמה pixels יש לו לעבוד איתם. ' +
        'בלי height קבוע על viewport, גובהו יהיה 0 (כי תוכנו מוחלף דינמית). ' +
        'תוצאה: הרשימה לא מוצגת כלל. ' +
        'ב-SCSS: .vs { height: min(52vh, 460px) } — זה החוזה שה-recycler מסתמך עליו.',
    },
    {
      q: 'מה קורה ב-IssuesStore כשהמשתמש לא מחובר ו-query מוגדר?',
      options: [
        'נשלחת בקשה ל-API ומחזירה 401, ה-interceptor מציג toast',
        'ה-URL function מחזירה undefined — Angular לא שולח בקשה כלל',
        'ה-store זורק שגיאה שנתפסת ב-try/catch',
        'httpResource שולח בקשה ללא Authorization header',
      ],
      answer: 1,
      explain:
        'ה-URL function בודקת `this.tokenStore.isLoggedIn()` לפני בנית ה-URL. ' +
        'אם false, מחזירה undefined. ' +
        'Angular מפרש undefined מ-URL function כ-"אל תשלח בקשה" — ' +
        'resource נשאר idle, לא loading, לא error. ' +
        'זה מונע 401 spam בכל טעינת עמוד ומשפר חוויה לאנונימי.',
    },
    {
      q: 'מה היתרון של trackBy ב-cdkVirtualFor כשיש optimistic update?',
      options: [
        'trackBy מונע את ה-optimistic update מלהתבצע פעמיים',
        'trackBy מאפשר ל-CDK לדעת אילו DOM nodes לשמר ואילו לעדכן, גם כשהרשימה משתנה',
        'ללא trackBy, Angular יזרוק runtime error ב-virtual scroll',
        'trackBy מוחק nodes שיצאו מה-viewport כדי לחסוך זיכרון',
      ],
      answer: 1,
      explain:
        'כשה-linkedSignal מתעדכן אופטימית (issue #3 status = Done) ואחר כך מתאפס מהשרת, ' +
        'Angular צריך לדעת מה השתנה. ' +
        'עם trackBy: id קבוע — Angular מזהה ששורה 3 היא עדיין issue #3 ומעדכן רק אותה. ' +
        'בלי trackBy: כל עדכון משמיד ובונה מחדש את כל ה-DOM של ה-viewport הגלוי.',
    },
    {
      q: 'IssueRow הוא "רכיב טיפש" — מה זה אומר בהקשר של virtual scroll?',
      options: [
        'הוא לא יכול לבצע שאילתות HTTP',
        'הוא לא מכיר את ה-store — issue נכנס כ-input, בקשת שינוי יוצאת כ-output; ה-recycler יכול להחליף את ה-input בחופשיות',
        'הוא לא משתמש ב-signals',
        'הוא מוגדר כ-ChangeDetectionStrategy.OnPush',
      ],
      answer: 1,
      explain:
        'recycling ב-CDK Virtual Scroll = לקחת DOM node שהציג issue #5 ולגרום לו להציג issue #23 ' +
        'על ידי שינוי ה-inputs. ' +
        'אם ה-row היה מזריק IssuesStore ישירות ומגיב לנתוניו, ' +
        'ה-recycled node היה מנסה לעבוד עם id ישן. ' +
        'רכיב שמקבל את כל המידע שלו כ-input הוא בטוח למחזור: שנה input, עדכן view.',
    },
    {
      q: 'שינוי מסנן (status, search, sort) תמיד מאפס את page ל-1 — כיצד זה מיושם?',
      options: [
        'ה-store מאפס את page signal בכל שינוי ב-query',
        'patchUrl תמיד כולל page: null בנוסף לפרמטר המשתנה, וה-router מוחק פרמטרים ש-null',
        'Angular router מוחק אוטומטית פרמטרים ישנים בניווט חדש',
        'ה-IssueBoard מזהה שינוי ב-status ומעדכן page signal מקומי',
      ],
      answer: 1,
      explain:
        'בכל קריאה ל-patchUrl (onSearch, onSort, chip click) מועבר גם page: null. ' +
        'עם queryParamsHandling: "merge", Angular משלב את ה-patch עם הפרמטרים הקיימים. ' +
        'ערך null = "מחק את הפרמטר הזה מה-URL". ' +
        'כתוצאה, page נמחק מה-URL, ה-router מעדכן את ה-input page ל-undefined, ' +
        'הנורמליזציה מחזירה 1 כברירת מחדל.',
    },
  ],

  proveIt: [
    {
      title: 'הרצת ה-stack המלא של פרק 13',
      body:
        'הריצו `node tools/materialize-snapshots.mjs` מתוך `taskforge-companion/`. ' +
        'פתחו שני טרמינלים: ' +
        'בראשון הריצו `dotnet run` בתוך `reference/.build/ch13/server/TaskForge.Api`. ' +
        'בשני הריצו `pnpm exec ng serve --port 4500` בתוך `reference/.build/ch13/client`. ' +
        'התחברו כ-`demo@taskforge.dev` / `Passw0rd!`. ' +
        'נווטו ל-"Website Redesign".',
      command: 'node tools/materialize-snapshots.mjs',
      expect:
        'לוח Issues גלוי. ב-Network tab: GET /api/projects/1/issues?pageSize=50 מחזיר 200. ' +
        'ה-pager מציג "Page 1 of 2 — 60 issues".',
    },
    {
      title: 'סינון וחיפוש מסונכרנים ל-URL',
      body:
        'לחצו על chip "Open". ' +
        'הקלידו "navbar" בשדה החיפוש. ' +
        'בחרו "Priority" ב-sort. ' +
        'צפו ב-URL ובתוצאות.',
      expect:
        'אחרי chip Open: URL מציג ?status=Open, 21 issues. ' +
        'אחרי הקלדת "navbar": URL מציג ?status=Open&q=navbar, 3 issues. ' +
        'אחרי sort=priority: URL מציג ?status=Open&q=navbar&sort=priority, ' +
        '"Fix the navbar (01)" ראשון. ' +
        'רענון דף: אותן תוצאות, chip פעיל, טקסט החיפוש ממולא.',
    },
    {
      title: 'עדכון אופטימי עם rollback',
      body:
        'עם השרת עובד: שנו סטטוס של issue. ' +
        'שימו לב שה-badge מתהפך מיד. ' +
        'לאחר מכן עצרו את `dotnet run`. ' +
        'שנו סטטוס של issue נוסף.',
      expect:
        'עם שרת עובד: badge מתהפך מיד, והרשימה מתעדכנת מהשרת. ' +
        'עם שרת כבוי: badge מתהפך מיד, וכשהבקשה נכשלת הוא חוזר לסטטוס הקודם (rollback) + toast שגיאה.',
    },
    {
      title: 'virtual scroll — בדיקת DOM count',
      body:
        'פתחו DevTools (F12), עברו ל-Elements. ' +
        'בחרו `cdk-virtual-scroll-viewport`. ' +
        'ספרו כמה אלמנטי `tf-issue-row` ישנם ב-DOM.',
      expect:
        'למרות ש-50 issues נטענו (page 1), רק 11-12 אלמנטי tf-issue-row קיימים ב-DOM. ' +
        'גלילה: מספר זה נשאר יציב — שורות ישנות מוחזרות עם נתונים חדשים.',
    },
    {
      title: 'משתמש אנונימי — אין בקשת API',
      body:
        'התנתקו. נווטו ל-"/projects/1". ' +
        'פתחו DevTools, Network tab, סננו לבקשות ל-localhost:5080.',
      expect:
        'לוח מציג "Sign in to see the issue board." ' +
        'ב-Network tab: אין בקשה ל-/api/projects/1/issues כלל. ' +
        'ה-URL function מחזירה undefined כשה-user לא מחובר.',
    },
  ],

  exercise: {
    prompt:
      'הוסיפו לסינון תמיכה ב-priority: chip לכל עדיפות (Low/Medium/High/Critical) ' +
      'בנוסף לסינון הסטטוס הקיים. ' +
      'ה-priority חי ב-URL (`?priority=High`), ' +
      'עובר נורמליזציה ב-`IssueBoard`, ' +
      'ומועבר ל-`IssuesStore` כחלק מ-`IssueListQuery`. ' +
      'השרת (מ-ch04) כבר תומך בפרמטר `priority` ב-`IssueListParams`.',
    tasks: [
      'הוסיפו `priority: IssuePriority | null` ל-`IssueListQuery` ב-`issue.model.ts`.',
      'עדכנו את ה-URL serializer ב-`IssuesStore`: אם `q.priority`, הוסיפו `params.set("priority", q.priority)`. ' +
        'עדכנו את ה-computed `query` ב-`IssueBoard` לנרמל את ה-`priority` input (בדיוק כמו status).',
      'הוסיפו ל-`ProjectBoard`: `readonly priority = input<string>()` ' +
        'והעבירו ל-`IssueBoard` כ-`[priority]="priority()"`. ' +
        'הוסיפו `readonly priority = input<string>()` ל-`IssueBoard`.',
      'הוסיפו ב-`issue-board.html` nav עם chip לכל priority (Low/Medium/High/Critical + All). ' +
        'שינוי ב-chip יקרא ל-`patchUrl({ priority: ... , page: null })`.',
      'הריצו `pnpm test` ו-`pnpm build` ווידאו שהכל עובד.',
    ],
    acceptance: [
      'לחיצה על chip "High" מוסיפה ?priority=High ל-URL ומחזירה רק issues עם עדיפות High.',
      'שינוי priority מאפס את page ל-1 (page נמחק מ-URL).',
      'ניתן לשלב priority + status + search יחד — שלושת הפרמטרים מופיעים ב-URL.',
      'רענון שומר את ה-priority chip הפעיל.',
      'כל הטסטים הקיימים עוברים; pnpm build מסתיים ללא שגיאות.',
    ],
  },
};
