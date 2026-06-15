import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 20 — State Architecture Capstone (@ngrx/signals).
 * Wave 4 Closer. Spine pieces #2-#4 consolidated: EntityStore (ch17),
 * derived selectors (ch18), command bus (ch16). Then ONE store — IssuesStore,
 * the richest — is refactored to @ngrx/signals, mapping hand-rolled patterns
 * to library conventions while the public surface is preserved exactly.
 * No backend changes. Frontend: signalStore + withEntities + withComputed +
 * withMethods + withHooks replacing EntityStore + optimistic util.
 * Verified: board/kanban behave identically; build clean; lazy chunk +~4kB.
 * Runtime smoke: "Page 1 of 2 — 60 issues"; kanban Open 21 / InProgress 20 / Done 19;
 * drag-reorder persisted rank 7680 via @ngrx optimistic updateEntity + PATCH.
 */
export const CH20_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 20.1 */
    {
      id: '20.1',
      title: 'הפרק: Capstone של ארכיטקטורת State',
      blocks: [
        {
          kind: 'p',
          text:
            'Wave 4 פתחה עם ארבעה spine pieces שבנינו ביד: פרק 16 הניח command registry ו-keyboard bus; ' +
            'פרק 17 הוסיף EntityStore גנרי ופונקציית optimistic לשימוש חוזר; פרק 18 הציג derived selectors ' +
            'שמעצבים נתוני-שרת למודלי-תצוגה; פרק 19 הרחיב את מסך ה-issue עם activity timeline, ' +
            'attachments, ו-undo. בכל פעם שמנו את האריחים — עכשיו מסתכלים על הבניין.',
        },
        {
          kind: 'p',
          text:
            'פרק 20 עושה שני דברים: מכנה את הדפוסים שבנינו ומגלה שהם בדיוק מה שספריית state מובנת מסדרת. ' +
            'ואז ממפה store אחד — IssuesStore, העשיר ביותר — ל-`@ngrx/signals`, מבלי לגעת ב-issue-board ' +
            'או ב-kanban-board. הם לא יודעים שמשהו זז מתחתיהם.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה store אחד ולא כולם?',
          body:
            'ProjectsStore, IssueDetailStore ו-DashboardStore נשארים ביד — בכוונה. הניגוד הוא הנקודה: ' +
            'אתם רואים את שני הסגנונות זה לצד זה, ומבינים מה הספרייה עושה כי כתבתם את זה בעצמכם. ' +
            'אם הכול היה ספרייה מרגע ראשון, ה-"magic" היה אטום.',
        },
      ],
      panel: {
        kind: 'filetree',
        title: 'קבצים חדשים ומשתנים בפרק 20',
        lines: [
          { text: 'client/', depth: 0, kind: 'dir' },
          { text: 'package.json', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'src/app/core/state/', depth: 1, kind: 'dir' },
          { text: 'issues.store.ts', depth: 2, kind: 'file', badge: 'mod' },
          { text: 'server/', depth: 0, kind: 'dir' },
          { text: '(ללא שינויים — backend לא נגע)', depth: 1, kind: 'comment' },
          { text: 'src/app/features/issues/', depth: 1, kind: 'dir' },
          { text: 'issue-board.ts, kanban-board.ts', depth: 2, kind: 'file' },
          { text: '(לא נוגעים — public surface נשמרה)', depth: 2, kind: 'comment' },
        ],
        caption: 'שינוי של קובץ state אחד — שני רכיבי ה-features לא עודכנו כלל',
      },
    },

    /* ------------------------------------------------------------ 20.2 */
    {
      id: '20.2',
      title: 'ה-spine שבנינו: סיכום ארכיטקטורה',
      blocks: [
        {
          kind: 'p',
          text:
            'לפני שממפים לספרייה, כדאי לרשום מה יש לנו. פרק 16 בנה command registry: כל פעולה היא ' +
            'אובייקט שרשום ב-CommandRegistry ומאוחד דרך CommandBus — מעין שכבת ניהול כוונות מרוכזת. ' +
            'פרק 17 בנה EntityStore גנרי: מפת signal לפי id, `linkedSignal` שמתאפס לאמת-השרת, ו-`optimistic()` ' +
            'שמצייר-מיד-ומתחרט-אחרי.',
        },
        {
          kind: 'p',
          text:
            'פרק 18 הוסיף derived selectors: `computed` שגוזרים מבנה-תצוגה ממספרי-גלם. פרק 19 השלים ' +
            'IssueDetailStore עם undo/redo — snapshot stack שמשחזר מצב קודם. כל זה יחד מרכיב state ' +
            'architecture שלמה: store בסיסי, derived view-model, optimistic mutations עם rollback.',
        },
        {
          kind: 'term',
          name: 'public surface (seam)',
          definition:
            'החתימות הציבוריות שרכיב צורך מ-store: computed signals ופקודות. ' +
            'כל עוד ה-seam נשמר, המימוש הפנימי יכול להחליף מחלקה בספרייה — ' +
            'וה-consumers לא מרגישים שינוי. זו ה-"תפרת" שפרקים 13-19 בנו בעקביות.',
        },
        {
          kind: 'callout',
          tone: 'v22',
          title: 'הקשר לפרקים קודמים',
          body:
            'EntityStore (פרק 17) בנוי על `linkedSignal` מפרק 13; derived selectors (פרק 18) ' +
            'הם `computed` שלמדנו בפרק 06; command bus (פרק 16) מנצל את DI של Angular. ' +
            'פרק 20 הוא הפרק שבו השמות נפגשים עם שמות שהתעשייה משתמשת בהם.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid: `flowchart LR
  subgraph "Hand-rolled (ch16-19)"
    CR["CommandRegistry\n(ch16)"] --> CB["CommandBus"]
    ES["EntityStore\n(ch17)\nlinkedSignal + Map"] --> OP["optimistic()\napply / persist / rollback"]
    DS["derived selectors\n(ch18)\ncomputed"]
    UD["undo stack\n(ch19)\nsnapshot[]"]
  end
  subgraph "@ngrx/signals (ch20)"
    WE["withEntities"]
    WC["withComputed"]
    WM["withMethods"]
    WH["withHooks (onInit effect)"]
  end
  ES -- "maps to" --> WE
  DS -- "maps to" --> WC
  OP -- "maps to" --> WM
  CB -- "same concept" --> WM`,
        caption: 'כל spine piece שבנינו ביד מתמפה לפיצ׳ר ספרייה אחד',
      },
    },

    /* ------------------------------------------------------------ 20.3 */
    {
      id: '20.3',
      title: 'ה-dependency: @ngrx/signals',
      blocks: [
        {
          kind: 'p',
          text:
            'פרק 20 מוסיף תלות אחת: `@ngrx/signals` גרסה ^21.1.1. חשוב לומר זאת בגלוי: ' +
            'ספריית @ngrx/signals v21 מצהירה על peer dependency של `@angular/core: ^21.0.0`, ' +
            'בעוד שה-TaskForge client רץ על Angular v22. זו פגיעה בטווח ה-peer declared.',
        },
        {
          kind: 'p',
          text:
            'pnpm מתנהג במצב הזה כהתראה, לא כשגיאה — ה-install מצליח, הקומפילציה מצליחה, ' +
            'ובפועל אין קריסה בזמן-ריצה כי ה-API הציבורי של `signalStore` יציב בין גרסאות. ' +
            'אימתנו: build ירוק, אפס שגיאות console ו-@ngrx בזמן ריצה.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'ספריית state מוצהרת ל-Angular 21 — כדאי לאמץ ב-Angular 22?',
          body:
            'כן, אם אתם בוחנים את שלושת השאלות: (1) האם ה-API שמשתמשים בו יציב? `signalStore` / `withEntities` ' +
            'יציבים בין גרסאות ו-@ngrx מקדימה תמיד להתחייב ל-compatibility. (2) האם המנטיינרים תומכים? ' +
            'כן — @ngrx מוציאה release תואם Angular N כבר קרוב לצאת Angular N. (3) האם ניתן לאפס? ' +
            'כן — ה-public surface נשמרה וניתן לחזור ל-hand-rolled בכל עת. ה-gap הזה (ספרייה מאחרת ' +
            'גרסה אחת) הוא מצב נפוץ ומקובל, ולא סיבה לסירוב.',
        },
        {
          kind: 'term',
          name: 'peer dependency gap',
          definition:
            'מצב שבו ספרייה מצהירה תמיכה ב-Angular N אבל הפרויקט כבר על N+1. ' +
            'package manager מתריע אבל לא חוסם. כדאי לבדוק: האם ה-API שנוגעים בו יציב? ' +
            'האם יש תוכנית release? ובמידת הספק — להריץ smoke קטן.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch20',
        file: 'client/package.json',
        diff: true,
        title: 'package.json — @ngrx/signals ^21.1.1',
      },
    },

    /* ------------------------------------------------------------ 20.4 */
    {
      id: '20.4',
      title: 'IssuesState: הטיפוס שבנוי בידינו',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-IssuesStore הישן (ch17) ה-state הפנימי היה מפוזר: `query` היה `signal<IssueListQuery|null>` ' +
            'בנפרד, `loading`, `loadError`, `total`, `totalPages` היו `computed` מהם `httpResource`. ' +
            'ב-`@ngrx/signals` כל ה-state שאינו ישויות מוגדר בטיפוס ברור אחד: `IssuesState`.',
        },
        {
          kind: 'p',
          text:
            '`buildUrl` נשמר כפונקציה חיצונית — פשוט, טהורה, קלה לבדיקה. היא מקבלת `IssueListQuery` ' +
            'ומחזירה URL נקי (ברירות-מחדל מושמטות). אין שינוי בלוגיקה עצמה — רק מיקום.',
        },
        {
          kind: 'term',
          name: 'signalStore',
          definition:
            'הפונקציה היוצרת של @ngrx/signals: `signalStore(features...)`. ' +
            'מחזירה injectable class שמורכב מ-features. `{ providedIn: "root" }` הופך אותה לסינגלטון ' +
            'בדיוק כמו `@Injectable({ providedIn: "root" })` של ה-class הישן.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'טיפוס ה-state כתיעוד',
          body:
            '`IssuesState` עם כל שדותיו הוא תיעוד חי: ברגע שפותחים את הקובץ רואים בדיוק מה מנוהל ' +
            'בחלק ה-"state" (לא ישויות). ה-class הישן הסתיר אותו בתוך computed expressions מפוזרים.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch20',
        file: 'client/src/app/core/state/issues.store.ts',
        region: 'step-20.1',
        diff: true,
        title: 'issues.store.ts — IssuesState ו-buildUrl',
      },
    },

    /* ------------------------------------------------------------ 20.5 */
    {
      id: '20.5',
      title: 'signalStore: withEntities ו-withState',
      blocks: [
        {
          kind: 'p',
          text:
            '`signalStore({ providedIn: "root" }, ...)` מחליף את `@Injectable({ providedIn: "root" }) export class`. ' +
            '`withEntities<Issue>()` מחליף את ה-`EntityStore<Issue>` שכתבנו ביד בפרק 17: ' +
            'מתחת לכסות הוא מנהל מפת ישויות ומספק `entities()`, `entityMap()`, ועוד. ' +
            '`withState<IssuesState>(...)` מצהיר על שאר ה-state ונותן ל-`patchState` לעדכן אותו.',
        },
        {
          kind: 'p',
          text:
            'כל feature מוסיף מה שלו לאותו store. Features מוערמים בסדר: `withEntities` ראשון ' +
            'כי `withMethods` ו-`withComputed` יכולים להשתמש ב-`store.entities()`. ' +
            'ה-order חשוב — feature לא יכול להתייחס לדברים שיוגדרו אחריו.',
        },
        {
          kind: 'term',
          name: 'withEntities',
          definition:
            'feature של @ngrx/signals שמוסיף ניהול אוסף ישויות ל-store: ' +
            'entity map, entities() signal נגזר, וסט entity updaters (setAllEntities, updateEntity, removeEntity...). ' +
            'הוא מחליף בדיוק את ה-EntityStore הגנרי מפרק 17.',
        },
        {
          kind: 'term',
          name: 'withState',
          definition:
            'feature שמוסיף state שרירותי ל-store (כל שדה שאינו ישות). ' +
            'הערכים הופכים ל-DeepSignal שניתן לקרוא מ-store, ו-patchState יכול לעדכן אותם.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch20',
        file: 'client/src/app/core/state/issues.store.ts',
        region: 'step-20.2',
        diff: true,
        title: 'issues.store.ts — signalStore + withEntities + withState',
      },
    },

    /* ------------------------------------------------------------ 20.6 */
    {
      id: '20.6',
      title: 'withComputed: ה-derived selectors',
      blocks: [
        {
          kind: 'p',
          text:
            'בפרק 18 למדנו derived selectors: `computed` שמעצבים נתוני-שרת למודלי-תצוגה. ' +
            'ב-`IssuesStore` החדש זה `withComputed((store) => ({ issues: computed(() => store.entities()) }))`. ' +
            'בפשטות: `issues()` הוא alias ל-`entities()` — כך שהחוזה הציבורי נשאר `issues()` ' +
            'ולא `entities()`, בדיוק כמו שהיה ב-class הישן.',
        },
        {
          kind: 'p',
          text:
            'כאן `withComputed` קצר — חישוב אחד. ב-DashboardStore (פרק 18) ה-selectors היו ' +
            'summaryCards, statusSlices, trend — חישובים עשירים. `withComputed` יכול להכיל כל מספר ' +
            'של selectors, כולם עטופים ב-`computed`.',
        },
        {
          kind: 'term',
          name: 'withComputed',
          definition:
            'feature שמוסיף computed signals ל-store. ' +
            'מקביל ל-derived selectors מפרק 18: הוא מקבל store והחזרה שלו היא רשומה של computed. ' +
            'כל computed מתעדכן אוטומטית כשה-state שהוא תלוי בו משתנה.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'שמרו על שם ה-alias',
          body:
            'issue-board וkanban-board קוראים `store.issues()`, לא `store.entities()`. ' +
            'ה-`issues` alias ב-`withComputed` הוא זה שנותן להם את ה-API שציפו לו. ' +
            'בלעדיו, כל הרכיבים היו צריכים לעדכן ל-`store.entities()` — שינוי מיותר.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch20',
        file: 'client/src/app/core/state/issues.store.ts',
        region: 'step-20.3',
        diff: true,
        title: 'issues.store.ts — withComputed: issues alias',
      },
    },

    /* ------------------------------------------------------------ 20.7 */
    {
      id: '20.7',
      title: 'withMethods: הפקודה load ו-patchState',
      blocks: [
        {
          kind: 'p',
          text:
            'הלב של ה-refactor: `patchState` מחליף את כל עדכוני ה-store. `setAllEntities(page.items)` ' +
            'הוא entity updater שמחליף את כל מפת הישויות — בדיוק מה ש-`EntityStore.restore(new Map(...))` ' +
            'עשה ביד. הצירוף `patchState(store, setAllEntities(items), { total, totalPages, loading })` ' +
            'מעדכן ישויות וstate-שאינו-ישויות בפעולה אטומית אחת.',
        },
        {
          kind: 'p',
          text:
            'null/מנותק מנקה: `patchState(store, setAllEntities<Issue>([]), { total: 0, ... })`. ' +
            'מקביל ל-`this.entities.restore(new Map())` ב-class הישן. ' +
            'אבל כאן זה יותר מוצהר — `setAllEntities([])` מבהיר בכוונה שמרוקנים את האוסף.',
        },
        {
          kind: 'term',
          name: 'patchState',
          definition:
            'הפונקציה לעדכון state ב-@ngrx/signals: `patchState(store, ...updaters)`. ' +
            'מקבל store ואפס עד הרבה updaters (אובייקטי partial-state או entity updaters). ' +
            'מחליף את כל שיחות ה-signal.set/update מהמימוש הישן.',
        },
        {
          kind: 'term',
          name: 'entity updater',
          definition:
            'פונקציה שמחזירה partial entities-state: `setAllEntities(items)`, `updateEntity({id, changes})`, ' +
            '`removeEntity(id)`, ועוד. מועברת ל-patchState ומחשבת את המפה החדשה אטומית.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch20',
        file: 'client/src/app/core/state/issues.store.ts',
        region: 'step-20.4',
        diff: true,
        title: 'issues.store.ts — load via setAllEntities',
      },
    },

    /* ------------------------------------------------------------ 20.8 */
    {
      id: '20.8',
      title: 'withMethods: הפקודות האופטימיות',
      blocks: [
        {
          kind: 'p',
          text:
            'זה המיפוי המרכזי של הפרק. ב-class הישן: `snapshot()` צילם את המפה, `optimistic(apply, persist, rollback)` ' +
            'ניהל את הזרימה, ו-`restore(before)` החזיר. ב-`@ngrx/signals`: `before = store.entities()` ' +
            'צולם — `updateEntity({ id, changes })` צובע מיד — בכישלון `setAllEntities(before)` משחזר. ' +
            'הלוגיקה זהה, הניסוח הוא של הספרייה.',
        },
        {
          kind: 'p',
          text:
            'אימתנו בפועל: הזזת כרטיס Open בין עמודות ב-kanban שמרה rank 7680 ' +
            '(נקודת אמצע בין 6144 ל-9216) דרך PATCH. rollback עם שרת שבור החזיר את הכרטיס ' +
            'למקומו המקורי — בדיוק כמו ב-class הישן. שני הרכיבים לא שונו כלל.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          title: 'שתי קריאות withMethods',
          body:
            '`withMethods` נקרא פעמיים — פעם עם `load` ופעם עם שאר הפקודות. ' +
            'זה חוקי ומכוון: הפרדה לוגית. הפקודות שצריכות `inject(TokenStore)` בשניה ' +
            'יכולות לקרוא ל-`store.load(...)` כי היא כבר הוגדרה בקריאה הראשונה.',
        },
        {
          kind: 'term',
          name: 'withMethods',
          definition:
            'feature שמוסיף פקודות ל-store. מקביל ל-methods של class: ' +
            'מקבל store (ואופציונלית inject()) ומחזיר רשומה של פונקציות. ' +
            'כל פונקציה ניגשת ל-state דרך store signals ומעדכנת דרך patchState.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch20',
        file: 'client/src/app/core/state/issues.store.ts',
        region: 'step-20.5',
        diff: true,
        title: 'issues.store.ts — setQuery / reload / setStatus / reorder',
      },
    },

    /* ------------------------------------------------------------ 20.9 */
    {
      id: '20.9',
      title: 'withHooks: ה-onInit effect',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-class הישן `httpResource` היה ה-reactive engine: URL שתלוי ב-query ו-isLoggedIn, ' +
            'וכשאחד מהם השתנה — בקשה חדשה יצאה אוטומטית. ב-`@ngrx/signals` אין `httpResource`, ' +
            'אז ה-reactivity בא מ-`effect` ידני ב-`withHooks.onInit`: ' +
            '`effect(() => store.load(store.query(), tokenStore.isLoggedIn()))`. ' +
            'כל שינוי ב-`query` או ב-`isLoggedIn` מפעיל את `load` מחדש.',
        },
        {
          kind: 'p',
          text:
            '`onInit` רץ בהקשר injection של Angular — לכן `inject(TokenStore)` עובד שם. ' +
            'ה-effect חי כל אורך חיי ה-store (root-level). אין `DestroyRef` נחוץ כי ' +
            'root providers חיים עד סגירת האפליקציה.',
        },
        {
          kind: 'term',
          name: 'withHooks',
          definition:
            'feature של @ngrx/signals שמאפשר להגדיר `onInit` ו-`onDestroy`. ' +
            '`onInit` רץ בהקשר injection ומתאים לאתחול effects ריאקטיביים. ' +
            'מחליף את קריאת `effect()` ישירות ב-constructor של class.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          title: 'effect בתוך onInit, לא בחוץ',
          body:
            'הגדרת `effect()` מחוץ להקשר injection (למשל בגוף ה-`withMethods` callback) ' +
            'תיכשל. `withHooks.onInit` מריץ את הפונקציה שלו בתוך injection context — ' +
            'לכן `inject()` ו-`effect()` עובדים שם בצורה תקינה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch20',
        file: 'client/src/app/core/state/issues.store.ts',
        region: 'step-20.6',
        diff: true,
        title: 'issues.store.ts — withHooks onInit reactive load',
      },
    },

    /* ------------------------------------------------------------ 20.10 */
    {
      id: '20.10',
      title: 'ה-seam שרד: issue-board ו-kanban-board',
      blocks: [
        {
          kind: 'p',
          text:
            'זו הנקודה המרכזית שחזרנו עליה מאז פרק 13: issue-board וkanban-board לא שונו כלל. ' +
            'שניהם מזריקים את `IssuesStore` בדיוק כמו קודם, קוראים `store.issues()`, ' +
            '`store.loading()`, `store.total()`, `store.totalPages()`, `store.loadError()`, ' +
            '`store.setQuery()`, `store.clearQuery()`, `store.reload()`, ' +
            '`store.setStatus()`, ו-`store.reorder()` — כולם זמינים בדיוק כמו קודם.',
        },
        {
          kind: 'p',
          text:
            'אימתנו: רשימת issues מציגה "Page 1 of 2 — 60 issues" בדיוק כמו ב-ch17. ' +
            'לוח kanban מציג Open 21, InProgress 20, Done 19. ' +
            'הכל מתפקד בלי שגיאות console ובלי שורת קוד ב-issue-board או kanban-board.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מתי להחליף store ל-@ngrx/signals — ומתי לא?',
          body:
            'GAIN: אחידות ו-conventions שכל מפתח שמכיר @ngrx יכול לקרוא מיד; entity updaters בחינם; ' +
            'תמיכה ב-Redux DevTools; פחות boilerplate כשהפרויקט גדל. ' +
            'GIVE UP: תלות חיצונית ו-version cadence (ראינו peer gap של גרסה); ' +
            '4kB לאחריית lazy chunk; שקיפות — "אין magic" נעלם. ' +
            'WHEN NOT TO: אפליקציה קטנה עם store אחד-שניים, zero-dependency מדיניות, ' +
            'או כשרוצים לשלוט בכל שורת קוד. ה-hand-rolled spine מפרקים 16-19 עובד מצוין — ' +
            'ועכשיו אתם יודעים בדיוק מה הספרייה עושה כי כתבתם אותה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch17',
        file: 'client/src/app/core/state/issues.store.ts',
        title: 'issues.store.ts — ה-class הישן (ch17): EntityStore + optimistic',
      },
    },

    /* ------------------------------------------------------------ 20.11 */
    {
      id: '20.11',
      title: 'Side-by-side: EntityStore ומולו withEntities',
      blocks: [
        {
          kind: 'p',
          text:
            'הנה ה-mapping שורה-לשורה. בצד שמאל ה-class `EntityStore<T>` מפרק 17: ' +
            '`private readonly entities: WritableSignal<Map<number,T>>` (המפה), ' +
            '`readonly all: Signal<T[]> = computed(...)` (הרשימה), ' +
            '`patch(id, change)` (עדכון ממוקד), `snapshot()/restore(s)` (rollback).',
        },
        {
          kind: 'p',
          text:
            'בצד ימין `withEntities<Issue>()`: ' +
            '`store.entityMap()` — המפה (Map), ' +
            '`store.entities()` — הרשימה (Signal<Issue[]>), ' +
            '`patchState(store, updateEntity({id, changes}))` — עדכון ממוקד, ' +
            '`const before = store.entities()` ואז `patchState(store, setAllEntities(before))` — rollback. ' +
            'אפס מושגים חדשים; רק ניסוח של ספרייה על אותן רעיונות.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה ה-mapping חשוב כל כך?',
          body:
            'כשאתם מגיעים לקוד @ngrx ב-codebase חדש ורואים `updateEntity`, אתם כבר יודעים ' +
            'בדיוק מה הוא עושה — כי כתבתם את `patch()`. כשרואים `setAllEntities(before)` ' +
            'בcatch, אתם מזהים rollback. ה-mapping הזה הופך documentation לידע עמוק.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch17',
        file: 'client/src/app/core/state/entity-store.ts',
        region: 'step-17.6',
        diff: false,
        title: 'entity-store.ts (ch17) — ה-EntityStore שמיפינו',
      },
    },

    /* ------------------------------------------------------------ 20.12 */
    {
      id: '20.12',
      title: 'Side-by-side: optimistic() ומולו withMethods + updateEntity',
      blocks: [
        {
          kind: 'p',
          text:
            'פונקציית `optimistic(apply, persist, rollback)` מפרק 17 היא שלושה שלבים: ' +
            '`apply()`, `await persist()`, ובכישלון `rollback()`. ' +
            'ב-`@ngrx/signals`, `reorder` ב-`withMethods` עושה בדיוק אותו דבר בשלוש שורות: ' +
            '`before = store.entities()`, `patchState(..., updateEntity({id, changes}))`, ' +
            'ובcatch `patchState(..., setAllEntities(before))`.',
        },
        {
          kind: 'p',
          text:
            'ה-optimistic util הישן הסתיר את הזרימה בתוך callback. `withMethods` מפרש אותה ' +
            'ישירות בגוף הפונקציה — קל יותר לקרוא לאחרים שלא כתבו את ה-util. ' +
            'שני הסגנונות עובדים; הספרייה מציעה convention, לא כפייה.',
        },
        {
          kind: 'callout',
          tone: 'alt',
          title: 'rxMethod: חלופה reactive',
          body:
            '`@ngrx/signals` מציעה גם `rxMethod` שמאפשרת לתחבר RxJS pipes ל-withMethods. ' +
            'כאן בחרנו `async/await` + `firstValueFrom` כי זה מה שה-class הישן עשה, ' +
            'וההמשכיות היא הנקודה. `rxMethod` עדיפה כשיש pipelines מורכבים עם switch/merge.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch17',
        file: 'client/src/app/core/state/entity-store.ts',
        region: 'step-17.7',
        diff: false,
        title: 'entity-store.ts (ch17) — optimistic() שמיפינו',
      },
    },

    /* ------------------------------------------------------------ 20.13 */
    {
      id: '20.13',
      title: 'הדמו: store כתוב ביד מול @ngrx/signals',
      blocks: [
        {
          kind: 'p',
          text:
            'הדמו מציג store רשימה פשוטה הכתוב ביד — ללא שום תלות בחוץ. ' +
            '`map` (signal של Map) מחליף את `withEntities`; ' +
            '`entities`, `doneCount`, `remaining` (computed) מחליפים את `withComputed`; ' +
            '`add`, `toggle`, `remove` מחליפים את `withMethods`. ' +
            'התנהגות: הוסיפו פריטים, סמנו כהושלמו, מחקו — הספירות מתעדכנות מיד.',
        },
        {
          kind: 'p',
          text:
            'הפאנלים בפרק מראים את המקבילה ב-`@ngrx/signals` שורה-לשורה. ' +
            'הדמו עצמו לא מייבא `@ngrx/signals` — הוא ה-hand-rolled twin. ' +
            'ה-`signalStore` הרשמי ב-`IssuesStore` יושב בצד השרת ומטפל ב-60 issues אמיתיים.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () => import('./demos/signal-store.demo').then((m) => m.SignalStoreDemo),
        caption: 'דמו חי: store ביד — signal Map (withEntities), computed (withComputed), פקודות (withMethods). הפאנלים מראים את @ngrx המקביל',
      },
    },

    /* ------------------------------------------------------------ 20.14 */
    {
      id: '20.14',
      title: 'Bundle delta ו-trade-offs',
      blocks: [
        {
          kind: 'p',
          text:
            'בדקנו את ה-bundle לפני ואחרי: ה-lazy chunk `project-board` גדל מ-~116kB ל-~120kB — ' +
            'כ-4kB דלתא. זה המחיר של `@ngrx/signals` בנתיב ה-issues. ' +
            'פרויקט ש-IssuesStore הוא רק חלק קטן מ-store גדול יחלוק את העלות הזו בין stores רבים.',
        },
        {
          kind: 'ul',
          items: [
            'GAIN: conventions שכל מפתח @ngrx מזהה; entity updaters; devtools; פחות boilerplate',
            'GIVE UP: 4kB per code path; peer-version cadence (ראינו gap); "no magic" נעלם — אתם סומכים על הספרייה',
            'WHEN NOT TO: אפליקציה קטנה עם store אחד-שניים; zero-dependency policy; רצון בשקיפות מלאה',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה @ngrx/signals ולא Zustand, Jotai, או NgXS?',
          body:
            'כל הספריות האלו פותרות בעיה דומה — ניהול state עם signals/atoms. @ngrx/signals נבנתה ' +
            'מהאדמה לאנגולר: DI-first, injection context, ותמיכה ב-DevTools. Zustand מצוין ל-React. ' +
            'NgXS יותר Redux-ish ועם boilerplate יותר. אין תשובה אחת — ה-fit לפרויקט חשוב יותר מה-name.',
        },
        {
          kind: 'term',
          name: 'custom feature',
          definition:
            'feature של @ngrx/signals שכותבים בעצמכם: `signalStoreFeature(withState(...), withMethods(...))`. ' +
            'מאפשר לחלץ דפוס חוזר (למשל optimistic update) לחלק לשימוש חוזר — ' +
            'בדיוק כמו שחילצנו `optimistic()` מפרק 17, אבל בשפת הספרייה.',
        },
      ],
      panel: {
        kind: 'code-inline',
        lang: 'bash',
        code:
          '# גודל ה-lazy chunk של project-board (ng build, raw size)\n' +
          '# לפני (IssuesStore כתוב-ביד):      ~116 kB\n' +
          '# אחרי (IssuesStore על @ngrx/signals): ~120 kB\n' +
          '#\n' +
          '# delta מדוד: ~4 kB (כ-3.4%) — זו עלות הספרייה בנתיב הקוד של ה-issues.\n' +
          '# שאר ה-stores נשארו כתובים-ביד, ולכן לא נושאים את העלות הזו.',
      },
    },

    /* ------------------------------------------------------------ 20.15 */
    {
      id: '20.15',
      title: 'העץ אחרי פרק 20',
      blocks: [
        {
          kind: 'p',
          text:
            'בסוף פרק 20 יש לנו: IssuesStore שנכתב מחדש ב-`@ngrx/signals` תוך שימור מלא של ה-public surface; ' +
            'ידע מעמיק על מה הספרייה עושה כי כתבנו את זה ביד; ' +
            'ו-Wave 4 שלמה — command palette (פרק 16), kanban (פרק 17), dashboard (פרק 18), ' +
            'issue עשיר (פרק 19), state capstone (פרק 20). ' +
            'שאר ה-stores (ProjectsStore, IssueDetailStore, DashboardStore) נשארים ביד — הניגוד הוא הנקודה.',
        },
        {
          kind: 'p',
          text:
            'Wave 5 תפתח בפרק 21: Testing — xUnit + WebApplicationFactory לשרת, Vitest + TestBed לקליינט, ' +
            'ו-Playwright e2e על האפליקציה המלאה. כל ה-seams שבנינו (ה-public surface של ה-stores, ' +
            'פונקציות handlers ב-C#, רכיבים טיפשים) יהפכו לנקודות בדיקה טבעיות.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch20',
        title: 'TaskForge אחרי פרק 20 — @ngrx/signals IssuesStore, Wave 4 שלמה',
      },
    },
  ],

  quiz: [
    {
      q: 'איזה feature מחליף את EntityStore שכתבנו ביד בפרק 17?',
      options: [
        'withState',
        'withEntities',
        'withComputed',
        'withHooks',
      ],
      answer: 1,
      explain:
        '`withEntities<Issue>()` מוסיף ניהול אוסף ישויות: מפת signal לפי id, `entities()` נגזר, ' +
        'ו-entity updaters כמו `setAllEntities` ו-`updateEntity`. הוא מחליף בדיוק את ה-EntityStore מ-ch17.',
    },
    {
      q: 'מה עושה `patchState(store, setAllEntities(before))` בcatch?',
      options: [
        'שולח בקשת rollback לשרת',
        'מחיק את כל ה-issues',
        'משחזר את מפת הישויות לצילום שנלקח לפני הפעולה האופטימית',
        'סוגר את ה-store',
      ],
      answer: 2,
      explain:
        '`before = store.entities()` צולם לפני הציור האופטימי. בcatch, `setAllEntities(before)` ' +
        'מחזיר את האוסף לאמת שלפני — בדיוק מה ש-`restore(before)` עשה ב-EntityStore מפרק 17.',
    },
    {
      q: 'למה `withComputed` מגדיר `issues` כ-alias ל-`entities()`?',
      options: [
        'כי entities() לא עובד ישירות',
        'כדי לשמור על ה-public surface — הרכיבים קוראים issues() ולא entities()',
        'כי withComputed לא יכול לגשת ל-entities() ישירות',
        'זו חובה של @ngrx/signals',
      ],
      answer: 1,
      explain:
        'issue-board וkanban-board קוראים `store.issues()`. בלי ה-alias הזה ב-`withComputed` ' +
        'הם היו צריכים לעדכן ל-`store.entities()`. ה-seam שנשמר הוא ה-lesson של כל Wave 4.',
    },
    {
      q: 'מה עושה `withHooks.onInit` ב-IssuesStore?',
      options: [
        'מאתחל את ה-database',
        'מפעיל effect שטוען issues כשה-query או isLoggedIn משתנים',
        'מגדיר את ה-initial state',
        'בודק אם ה-user מחובר',
      ],
      answer: 1,
      explain:
        '`effect(() => store.load(store.query(), tokenStore.isLoggedIn()))` מפעיל את `load` ' +
        'כשאחד מהתלויים משתנה. זה מחליף את ה-reactivity שה-httpResource נתן בחינם בclass הישן.',
    },
    {
      q: 'מה peer dependency gap, ולמה הוא לא בלם אותנו?',
      options: [
        '@ngrx/signals לא תואם Angular 22 ולא ניתן להשתמש בו',
        '@ngrx/signals מצהירה ^21 אבל ה-API יציב; pnpm מתריע, לא חוסם; עבדנו ב-runtime',
        'הצגנו workaround ולכן הוא לא מורגש',
        'Angular 22 backwards-compatible עם כל @ngrx',
      ],
      answer: 1,
      explain:
        '`@ngrx/signals ^21.1.1` מצהירה `@angular/core: ^21.0.0`. pnpm מציג warning, לא error. ' +
        'ה-signalStore API יציב בין גרסאות ו-@ngrx מוציאה release תואם בקרוב. אימתנו build + runtime.',
    },
    {
      q: 'אילו stores נשארו hand-rolled ולא עברו ל-@ngrx/signals?',
      options: [
        'כל ה-stores עברו',
        'ProjectsStore, IssueDetailStore, DashboardStore — הניגוד הוא הנקודה',
        'רק TokenStore נשאר',
        'רק IssueDetailStore עבר',
      ],
      answer: 1,
      explain:
        'רק IssuesStore עבר ל-@ngrx/signals. שאר ה-stores נשארים ביד בכוונה: ' +
        'הניגוד מאפשר לראות את שני הסגנונות זה לצד זה ולהבין מה הספרייה מוסיפה.',
    },
    {
      q: 'מה מדדנו כ-bundle delta אחרי הוספת @ngrx/signals?',
      options: [
        'הchunk גדל ב-400kB',
        'הchunk קטן ב-4kB',
        'ה-lazy chunk project-board גדל מ-~116kB ל-~120kB (~4kB)',
        'לא היה שינוי כלל',
      ],
      answer: 2,
      explain:
        'ה-lazy chunk `project-board` גדל מ-~116kB ל-~120kB — כ-4kB דלתא. ' +
        'זה המחיר של הספרייה בנתיב קוד ה-issues. פרויקטים גדולים יותר מחלקים את העלות הזו.',
    },
  ],

  proveIt: [
    {
      title: 'רשימת Issues — זהה לפני ואחרי',
      body:
        'התחברו (demo@taskforge.dev / Passw0rd!), פתחו פרויקט "Website Redesign" ועברו לתצוגת רשימה.',
      expect:
        'מוצגת הכתובת "Page 1 of 2 — 60 issues". דפדוף לדף 2 עובד. ' +
        'סינון לפי סטטוס, חיפוש ומיון פועלים — כל אלה מועברים דרך setQuery ל-load, ' +
        'בדיוק כמו בגרסה הישנה.',
    },
    {
      title: 'לוח Kanban — עמודות, reorder, rollback',
      body:
        'עברו ל-?view=kanban. ספרו את הכרטיסים בכל עמודה. גררו כרטיס לעמודה אחרת ' +
        'ורעננו את הדף. ואז עצרו את ה-API (Ctrl+C בטרמינל) וגררו שוב.',
      expect:
        'Open 21, InProgress 20, Done 19 — תואם לדשבורד (פרק 18). ' +
        'הכרטיס נשאר במיקומו החדש אחרי רענון (rank נשמר). ' +
        'עם שרת מנותק: הכרטיס זז לרגע ואז קופץ חזרה — rollback ב-patchState + setAllEntities(before).',
    },
    {
      title: 'בדיקת ה-peer gap בפועל',
      body:
        'הריצו pnpm install בתוך reference/.build/ch20/client (אחרי materialize) ' +
        'וראו את הפלט.',
      command:
        'cd reference\\.build\\ch20\\client && pnpm install 2>&1 | findstr /i "warn peer"',
      expect:
        'Warning על peer dependency: @ngrx/signals requires @angular/core ^21.0.0 but Angular 22 installed. ' +
        'זו אזהרה בלבד, לא שגיאה — pnpm מסיים את ה-install בהצלחה.',
    },
    {
      title: 'bundle delta — השוואת chunk sizes',
      body:
        'בנו את הלקוח של ch17 ואת הלקוח של ch20 וראו את גודל ה-chunk.',
      command:
        'cd reference\\.build\\ch20\\client && pnpm build 2>&1 | findstr /i "project-board"',
      expect:
        'ה-chunk project-board מופיע בגודל ~120kB. מול ~116kB ב-ch17 — דלתא של כ-4kB.',
    },
  ],

  exercise: {
    prompt:
      'הוסיפו custom feature בשם `withOptimistic` שמאפשר לכל store לבצע עדכון אופטימי ' +
      'עם rollback דרך API אחיד — כך ש-IssueDetailStore יוכל לאמץ אותו בלי לכתוב את ' +
      'הזרימה מחדש.',
    tasks: [
      'צרו `client/src/app/core/state/with-optimistic.feature.ts` ש-export `withOptimistic<T>()` — custom signalStoreFeature.',
      'ה-feature מוסיף שיטה `applyOptimistic(before: T[], apply: () => void, persist: () => Promise<unknown>): Promise<boolean>` ' +
      'שמבצע את הזרימה: apply, await persist, ובcatch `patchState(store, setAllEntities(before))`.',
      'שלבו את `withOptimistic()` ב-IssuesStore במקום הלוגיקה הכפולה ב-setStatus וב-reorder.',
      'ודאו שה-public surface לא השתנתה ושהבדיקות עוברות.',
    ],
    acceptance: [
      'setStatus וreorder קוראים ל-applyOptimistic ולא כותבים before/patchState בעצמם.',
      'rollback עדיין עובד: עצרו את ה-API וגררו כרטיס — הוא חוזר למקומו.',
      'custom feature מיוצא ב-index.ts של core/state ומוסבר בתגובה.',
      'אין שגיאות console; build ירוק.',
    ],
  },
};
