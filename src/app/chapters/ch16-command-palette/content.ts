import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 16 — Cmd-K ו-Command Palette.
 * Wave 4, spine piece #1: keyboard service, command registry/bus, fuzzy ranking,
 * native <dialog> overlay, search service (httpResource reactive URL),
 * ו-GET /api/search?q= עם membership-scoped EF.Functions.Like.
 * Snapshot built, compiled, and runtime-proven before content was authored.
 */
export const CH16_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 16.1 */
    {
      id: '16.1',
      title: 'פתיחת גל 4: Cmd-K ולוח הפקודות',
      blocks: [
        {
          kind: 'p',
          text:
            'כל מה שבנינו עד כה — פרויקטים, issues, תגובות, CSS — זמין דרך ניווט עכבר. ' +
            'פרק 16 מוסיף ממד שני: מקלדת. לחיצה על Cmd-K (Ctrl-K ב-Windows/Linux) פותחת לוח פקודות ' +
            'בסגנון Linear ו-VS Code: מחפשים בטקסט, מנווטים בחיצים, לוחצים Enter.',
        },
        {
          kind: 'p',
          text:
            'אבל הפרק הזה הוא לא רק UX — הוא מלמד את spine piece #1 של ארכיטקטורת TaskForge: ' +
            'ה-command registry (bus). פיצ\'רים רושמים פקודות; ה-palette הוא צרכן טיפש שלא יודע מי רשם. ' +
            'הדפוס הזה יחזור בפרקים 17–20 בכל פעם שנרצה שרכיבים מרוחקים "ידברו" בלי להכיר זה את זה.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה דווקא עכשיו?',
          body:
            'בשלב הזה יש לנו מספיק פקודות שמגיעות ממקורות שונים: ניווט בין מסכים, מצב dark/light, ' +
            'התחברות. ה-palette מחבר אותן לממשק אחד בלי להצמיד כל פיצ\'ר לכל אחד. ' +
            'זו הדוגמה הקלאסית לדפוס publish/subscribe ברמת UI — עם טיפוסים מלאים.',
        },
      ],
      panel: {
        kind: 'filetree',
        title: 'קבצים חדשים בפרק 16',
        lines: [
          { text: 'client/src/app/', depth: 0, kind: 'dir' },
          { text: 'core/', depth: 1, kind: 'dir' },
          { text: 'keyboard/', depth: 2, kind: 'dir' },
          { text: 'keyboard.service.ts', depth: 3, kind: 'file', badge: 'new' },
          { text: 'commands/', depth: 2, kind: 'dir' },
          { text: 'command.model.ts', depth: 3, kind: 'file', badge: 'new' },
          { text: 'command-registry.ts', depth: 3, kind: 'file', badge: 'new' },
          { text: 'fuzzy.ts', depth: 3, kind: 'file', badge: 'new' },
          { text: 'models/', depth: 2, kind: 'dir' },
          { text: 'search.model.ts', depth: 3, kind: 'file', badge: 'new' },
          { text: 'features/', depth: 1, kind: 'dir' },
          { text: 'command-palette/', depth: 2, kind: 'dir' },
          { text: 'palette.service.ts', depth: 3, kind: 'file', badge: 'new' },
          { text: 'command-palette.ts', depth: 3, kind: 'file', badge: 'new' },
          { text: 'command-palette.html', depth: 3, kind: 'file', badge: 'new' },
          { text: 'command-palette.scss', depth: 3, kind: 'file', badge: 'new' },
          { text: 'search.service.ts', depth: 3, kind: 'file', badge: 'new' },
          { text: 'app.ts', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'app.html', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'app.scss', depth: 1, kind: 'file', badge: 'mod' },
          { text: 'server/', depth: 0, kind: 'dir' },
          { text: 'TaskForge.Core/Common/SearchResults.cs', depth: 1, kind: 'file', badge: 'new' },
          { text: 'TaskForge.Core/Abstractions/ISearchRepository.cs', depth: 1, kind: 'file', badge: 'new' },
          { text: 'TaskForge.Infrastructure/Repositories/EfSearchRepository.cs', depth: 1, kind: 'file', badge: 'new' },
          { text: 'TaskForge.Api/Endpoints/SearchEndpoints.cs', depth: 1, kind: 'file', badge: 'new' },
        ],
        caption: 'כל הקבצים החדשים והמשתנים בפרק 16 — client ו-server',
      },
    },

    /* ------------------------------------------------------------ 16.2 */
    {
      id: '16.2',
      title: 'המודל המנטלי: שלוש שכבות',
      blocks: [
        {
          kind: 'p',
          text:
            'לוח פקודות נראה כמו feature אחד, אבל הוא בנוי משלוש שכבות עצמאיות:',
        },
        {
          kind: 'ol',
          items: [
            'שכבת מקלדת (KeyboardService): listener גלובלי אחד, רגיסטר של combo-to-handler, נורמליזציה של mod.',
            'שכבת פקודות (CommandRegistry + fuzzy): מקור אמת לכל הפקודות; כל פיצ\'ר רושם; ה-palette צורך.',
            'שכבת UI (CommandPalette + PaletteService): overlay של `<dialog>` native, focus trap, ניווט, ומיזוג עם תוצאות שרת.',
          ],
        },
        {
          kind: 'p',
          text:
            'ההפרדה קריטית: שכבת המקלדת לא יודעת על פקודות; שכבת הפקודות לא יודעת על ה-overlay; ' +
            'ה-overlay לא יודע מי רשם את הפקודות. כל שכבה ניתנת לבדיקה ולהחלפה באופן עצמאי.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ההבדל בין event bus לבין command registry?',
          body:
            'Event bus הוא כללי: כל אחד יכול לשלוח ולהאזין לאירועים כלשהם. ' +
            'Command registry הוא declarative וטיפוסי: כל פקודה מוצהרת עם ID, כותרת ופונקציית run. ' +
            'ה-registry מאפשר ל-UI לגלות (discover) פקודות ולהציגן, לא רק להגיב לאירועים. ' +
            'בנוסף, ה-registry מחזיר signal — כל subscriber מקבל reactive update כשנוספת פקודה חדשה.',
        },
        {
          kind: 'term',
          name: 'command bus',
          definition:
            'דפוס ארכיטקטוני שמפריד בין הצהרת פקודה (מה אפשר לעשות) לבין ביצועה. ' +
            'פיצ\'רים רושמים פקודות; ה-palette צורך אותן בלי להכיר את הפיצ\'ר שרשם. ' +
            'בניגוד ל-event bus, ה-command bus הוא גם discoverable — ה-UI יכול לרשום ולהציג את כל הפקודות.',
        },
      ],
      panel: {
        kind: 'diagram',
        mermaid:
          'graph TD\n' +
          '  KB["KeyboardService\\n(mod+k)"] --> |"palette.toggle()"| PS["PaletteService\\n(open signal)"]\n' +
          '  PS --> |"open()"| CP["CommandPalette\\n(overlay)"] \n' +
          '  CR["CommandRegistry\\n(signal<Command[]>)"] --> |"commands()"| CP\n' +
          '  SS["SearchService\\n(httpResource)"] --> |"results()"| CP\n' +
          '  App["app.ts"] --> |"register(...)"| CR\n' +
          '  App --> |"bind(mod+k)"| KB',
        caption: 'שלוש שכבות עצמאיות: מקלדת, registry, overlay — כל אחת ניתנת לבדיקה בנפרד',
      },
    },

    /* ------------------------------------------------------------ 16.3 */
    {
      id: '16.3',
      title: 'KeyboardService — שכבת גלובלית אחת',
      blocks: [
        {
          kind: 'p',
          text:
            '`KeyboardService` הוא `@Injectable({ providedIn: \'root\' })` שמוסיף `keydown` listener אחד ל-`document`. ' +
            'במקום שכל רכיב יוסיף listener משלו, הכול עובר דרך שכבה אחת. ' +
            'ה-constructor מגדיר את ה-listener ומנקה אותו ב-`DestroyRef.onDestroy` — ' +
            'אותו דפוס הניקיון שהשתמשנו בו ב-ch09 וב-ch14.',
        },
        {
          kind: 'p',
          text:
            'הלב הוא `comboOf(event)`: הפונקציה מנרמלת `metaKey || ctrlKey` ל-"mod", ' +
            'ומחברת מפתחות עם "+": `"mod+k"`, `"shift+/"`. ' +
            'הנרמול הזה הוא הסיבה שאותו `bind("mod+k", ...)` עובד על macOS עם Cmd ועל Windows עם Ctrl — ' +
            'המתקשר לא צריך לדאוג להבדל.',
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            '`isTyping(target)` בודק האם ה-focus נמצא ב-input/textarea/select/contentEditable. ' +
            'אם כן ואין mod — ה-handler לא מופעל. ' +
            'זה מה שמאפשר ל-Cmd-K לעבוד גם בזמן הקלדה בשדה: ' +
            'כשה-combo כולל `mod`, `isTyping` נבדק אחרי `hasMod`, ולכן Cmd-K עדיין מגיב.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'בדיקה ב-SSR: `if (typeof document === \'undefined\') return` ב-constructor ' +
            'מונעת קריסה בסביבת Node (jsdom בבדיקות) שאין בה `document`. ' +
            'זה guard סטנדרטי לכל שירות שנוגע ב-DOM ישירות.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch16',
        file: 'client/src/app/core/keyboard/keyboard.service.ts',
        region: 'step-16.3',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 16.4 */
    {
      id: '16.4',
      title: 'Command — יחידת פעולה מוצהרת',
      blocks: [
        {
          kind: 'p',
          text:
            '`Command` הוא interface קטן אבל מדויק. כל שדה עושה דבר אחד:',
        },
        {
          kind: 'ul',
          items: [
            '`id` — מזהה יציב. `track cmd.id` ב-template ו-`toHitCommands` שמייצרת IDs כמו `hit.issue.1` מסתמכים עליו.',
            '`title` — הטקסט שמוצג ב-palette. זה גם חלק ממשטח ה-fuzzy.',
            '`group` — קיבוץ לוגי להצגה: "Navigation", "View", "Identity", "Issue", "Project".',
            '`keywords` — מילות מפתח נרדפות לחיפוש. "logout" מאפשר למצוא "התנתקות".',
            '`hint` — תווית קיצור להצגה בלבד (לדוגמה "g p"). ה-keyboard binding נרשם בנפרד ב-KeyboardService.',
            '`run()` — מה קורה כשבוחרים את הפקודה. פונקציה פשוטה, ללא ארגומנטים.',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה פקודה מכילה את ה-run שלה, ולא השולח מגדיר handler חיצוני?',
          body:
            'בדפוס "command object" הפקודה היא יחידה עצמאית: היא יודעת מה לעשות. ' +
            'זה מאפשר ל-palette להריץ כל פקודה באותה שורה קוד (`cmd.run()`), ' +
            'בלי switch-case על ID ובלי צימוד לפיצ\'ר שרשם. ' +
            'זה גם makes פקודות composable: אפשר לעטוף run בלוגינג, undo, ו-analytics בלי לשנות את הרושמת.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch16',
        file: 'client/src/app/core/commands/command.model.ts',
        region: 'step-16.4',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 16.5 */
    {
      id: '16.5',
      title: 'CommandRegistry — ה-bus',
      blocks: [
        {
          kind: 'p',
          text:
            '`CommandRegistry` הוא service יחיד (root) שמחזיק `signal<readonly Command[]>`. ' +
            'ה-API שלו בכוונה קטן: `register(...commands)` מוסיף לרשימה; ' +
            '`commands` הוא `asReadonly()` — ה-palette קורא, לא משנה.',
        },
        {
          kind: 'p',
          text:
            '`register` עושה `update((list) => [...list, ...commands])` — immutable spread. ' +
            'כל מי שצורך את `commands()` (ה-palette) יקבל אוטומטית את הפקודות החדשות ' +
            'ברגע שפיצ\'ר רושם אותן. זה ה-reactivity שמחבר את כל השכבות בלי event.',
        },
        {
          kind: 'callout',
          tone: 'v22',
          title: 'signal כ-bus',
          body:
            'ב-Angular v22 signal הוא primitive בסיסי: reactive, synchronous, typed. ' +
            'כאן הוא משמש כ-event bus מוצהר — לא `Subject` של RxJS, לא `EventEmitter`, ' +
            'אלא פשוט ערך שכל מי שקורא אותו מקבל update. ' +
            'הפשטות הזו מאפשרת ל-`effect` של ה-palette להגיב אוטומטית כשהרשימה מתארכת.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch16',
        file: 'client/src/app/core/commands/command-registry.ts',
        region: 'step-16.5',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 16.6 */
    {
      id: '16.6',
      title: 'fuzzy.ts — ציון ביד',
      blocks: [
        {
          kind: 'p',
          text:
            'ספריות fuzzy (fuse.js ואחרות) עושות את העבודה, אבל כ-50 שורות ביד ' +
            'מלמדות איך הציון עובד. `fuzzyScore(text, query)` עובר תו-תו על ה-query ' +
            'ומחפש כל תו ב-text לפי הסדר. אם ולו תו אחד לא נמצא — מחזיר -1 (אין התאמה).',
        },
        {
          kind: 'p',
          text:
            'על כל תו שנמצא מצטרפים שני בונוסים אפשריים:',
        },
        {
          kind: 'ul',
          items: [
            'בונוס גבול מילה (8 נקודות): התו נמצא בתחילת המחרוזת, או שהתו שלפניו הוא רווח/מקף/לוכסן. "dark" ימצא "Dark mode" בציון גבוה כי \'d\' הוא תחילת מילה.',
            'בונוס רצף (3 נקודות): התו הנוכחי נמצא ממש אחרי התו הקודם. "dar" ב-"dark": ה-d בגבול נותן 8, ו-a ו-r כל אחד 1 (בסיס) + 3 (רצף) = 4 — סך הכול 8+4+4 = 16.',
          ],
        },
        {
          kind: 'p',
          text:
            '`fuzzyRank<T>` מסנן פריטים עם ציון אפס ומעלה, ממיין מהגבוה לנמוך. ' +
            'ה-key function מאפשר לחפש בכל שדה שתרצו — ב-palette מחפשים על `title + group + keywords`.',
        },
        {
          kind: 'term',
          name: 'fuzzy matching',
          definition:
            'חיפוש טקסט שמאפשר הקלדה חלקית: כל תווי ה-query צריכים להופיע לפי הסדר ב-text, ' +
            'אבל לא חייבים להיות צמודים. ציון גבוה יותר לתוצאות "טבעיות": ' +
            'תחילת מילה ורצף של תווים. מאפשר למצוא "dark" כשמקלידים "drk".',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch16',
        file: 'client/src/app/core/commands/fuzzy.ts',
        region: 'step-16.6',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 16.7 */
    {
      id: '16.7',
      title: 'PaletteService — מצב פתיחה כ-signal',
      blocks: [
        {
          kind: 'p',
          text:
            '`PaletteService` הוא הפשוט ביותר: signal בוליאני אחד ושני מתודות. ' +
            '`toggle()` קורא לו `KeyboardService` (דרך `app.ts`). ' +
            '`close()` קורא לו ה-palette עצמו אחרי הרצת פקודה או לחיצת Escape.',
        },
        {
          kind: 'p',
          text:
            'ההפרדה חשובה: ה-shell (app.ts) לא מכיר את ה-`<dialog>` — הוא רק הופך את ה-signal. ' +
            'ה-overlay לא מכיר את המקלדת — הוא רק צורך את ה-signal. ' +
            'שירות הביניים הזה קורא לו לעיתים "state service" — מקור אמת בלי לוגיקה עסקית.',
        },
        {
          kind: 'callout',
          tone: 'alt',
          title: 'אלטרנטיבה: ContextMenu service',
          body:
            'אפשר היה להגדיר את ה-open signal ישירות ב-`CommandPalette` component ולהשתמש ב-`viewChild`. ' +
            'הסיבה לשירות נפרד: `app.ts` צריך לפתוח ולסגור את ה-palette מחוץ לה-component tree. ' +
            'כשמצב ה-open צריך להיות גלוי מחוץ ל-component, הוא עולה ל-service.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch16',
        file: 'client/src/app/features/command-palette/palette.service.ts',
        region: 'step-16.7',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 16.8 */
    {
      id: '16.8',
      title: 'CommandPalette — הרכיב כצרכן טיפש',
      blocks: [
        {
          kind: 'p',
          text:
            '`CommandPalette` הוא הרכיב שמציג הכול — אבל הוא לא יודע מה הוא מציג. ' +
            'הוא מקבל `CommandRegistry.commands()`, מסנן ב-fuzzy, ממזג עם תוצאות שרת, ' +
            'ומריץ `cmd.run()`. שלוש שורות לוגיקה.',
        },
        {
          kind: 'p',
          text:
            'הגשר signal-to-DOM הוא ה-`effect` שצופה ב-`palette.open()`: ' +
            'כש-open נהיה true, `el.showModal()` מופעל; כש-open נהיה false, `el.close()`. ' +
            'זה בדיוק הדפוס של `tf-dialog` מ-ch09: ה-signal הוא מקור האמת, ' +
            'ה-`<dialog>` הוא ה-DOM שצריך להתאים עצמו.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה queueMicrotask לפוקוס?',
          body:
            '`showModal()` הוא synchronous — ה-dialog נפתח מיד. ' +
            'אבל Angular עדיין לא סיים לעדכן את ה-DOM (effect רץ לפני paint). ' +
            '`queueMicrotask(() => input.focus())` דוחה את ה-focus ל-microtask הבא, ' +
            'אחרי שה-DOM מוכן. בלי זה, ה-focus יכשל בשקט.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'איך ה-palette צורך פקודות בלי להכיר את מי שרשם אותן?',
          body:
            'ה-palette מזריק את `CommandRegistry` ומשתמש ב-`registry.commands()` — signal. ' +
            'כשפיצ\'ר קורא `registry.register(...)`, ה-signal מתעדכן ו-`computed` של ה-palette ' +
            'מחשב מחדש. לא import, לא event listener, לא ידיעה — רק צריכת signal.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch16',
        file: 'client/src/app/features/command-palette/command-palette.ts',
        region: 'step-16.8',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 16.9 */
    {
      id: '16.9',
      title: 'command-palette.scss — elevation-3 ותנועה',
      blocks: [
        {
          kind: 'p',
          text:
            '`.cmdk` הוא ה-`<dialog>` עצמו. `inline-size: min(92vw, 36rem)` — overlay שרספונסיבי: ' +
            'ב-375px לוקח 92% מהרוחב; בדסקטופ מוגבל ל-36rem. ' +
            '`margin-block-start: 12vh` מניח אותו קרוב לראש המסך, בסגנון Linear.',
        },
        {
          kind: 'p',
          text:
            '`box-shadow: var(--shadow-3)` — elevation token #3 מ-ch08, הגבוה ביותר שיש. ' +
            'ה-backdrop: `background: rgb(0 0 0 / 0.5)` עם `backdrop-filter: blur(3px)`. ' +
            '`overflow: clip` על `.cmdk` מכסה את פינות ה-border-radius של הרשימה הגלילה.',
        },
        {
          kind: 'p',
          text:
            '`@keyframes cmdk-in` מריץ על `[open]`: מ-opacity 0 וtranslateY(-8px) scale(0.985) ' +
            'לאפס — כניסה מלמעלה, רכה ומהירה (`var(--dur-3)`). ' +
            '`@media (prefers-reduced-motion: reduce)` מבטל את האנימציה ואת ה-transition על `.cmdk-item`.',
        },
        {
          kind: 'term',
          name: 'focus trap',
          definition:
            'מנגנון נגישות ש"כולא" את ה-focus בתוך element פעיל (כמו dialog). ' +
            'Tab לא יוצא מה-dialog; Shift-Tab לא "בורח" לאחור. ' +
            'ה-`<dialog>.showModal()` מספק focus trap מובנה בדפדפן — בחינם, ללא JavaScript.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch16',
        file: 'client/src/app/features/command-palette/command-palette.scss',
        region: 'step-16.9',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 16.10 */
    {
      id: '16.10',
      title: 'app.ts — חיבור Cmd-K ורישום פקודות',
      blocks: [
        {
          kind: 'p',
          text:
            'ב-`app.ts` הכול מתחבר: `keyboard.bind(\'mod+k\', () => palette.toggle())` — ' +
            'שורה אחת שמחברת מקלדת לפתיחת ה-palette. ' +
            'אחר כך `registry.register(...)` עם ארבע פקודות גלובליות:',
        },
        {
          kind: 'ul',
          items: [
            'מעבר לכל הפרויקטים (Navigation) — `router.navigate([\'/\'])`; hint "g p".',
            'החלפת מצב כהה / בהיר (View) — `themeSvc.toggle()`; keywords "theme dark light mode".',
            'התחברות (Identity) — פותח את `loginOpen`; keywords "sign in login".',
            'התנתקות (Identity) — `logout()`; keywords "sign out logout".',
          ],
        },
        {
          kind: 'p',
          text:
            'הרישום מתבצע ב-constructor — פעם אחת. ' +
            'פיצ\'רים עתידיים (ch17–19) יקראו `register()` מהמודול שלהם ללא גישה ל-`app.ts`. ' +
            'זה בדיוק מה שמשמר את הדפוס: ה-shell לא גדל עם כל פיצ\'ר חדש.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch16',
        file: 'client/src/app/app.ts',
        region: 'step-16.10',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 16.10c */
    {
      id: '16.10c',
      title: 'app.html ו-app.scss — טריגר ה-header ו-flex-wrap',
      blocks: [
        {
          kind: 'p',
          text:
            'בנוסף ל-Cmd-K, ה-header מציג כפתור "פקודות ⌘K" כדי שמשתמש מסך לב יוכל לפתוח בלחיצה. ' +
            'הכפתור מוגדר `variant="ghost"` (אותו `tf-button` מ-ch09) ואת `aria-label` מסביר.',
        },
        {
          kind: 'p',
          text:
            'ה-`<kbd class="ltr">⌘K</kbd>` ב-template (ה-`kbd` ב-`.cmdk-trigger`) — ' +
            'כי מה שמוצג הוא "⌘K" שהוא LTR תמיד, גם ב-RTL layout. ' +
            'בתחתית ה-template מתווסף `<tf-command-palette />` — הרכיב תמיד ב-DOM, ' +
            'ה-dialog עצמו נסגר/נפתח.',
        },
        {
          kind: 'p',
          text:
            'ב-`app.scss`, ה-`.header-actions` מקבל `flex-wrap: wrap`. ' +
            'זה מבטיח שב-375px עם הטריגר הנוסף, הפעולות לא ידחפו את הכותרת מחוץ ל-viewport — ' +
            'הן יגלשו לשורה שנייה בלי overflow אופקי.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'בדיקת ה-375px תמיד אחרי הוספת פריט ל-header. כל כפתור נוסף הוא מועמד ל-overflow. ' +
            '`flex-wrap: wrap` הוא ה-fix הנכון: לא `overflow: hidden` שמסתיר, לא font-size קטן.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch16',
        file: 'client/src/app/app.html',
        region: 'step-16.10c',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 16.11 */
    {
      id: '16.11',
      title: 'SearchResults — הקרנות רזות לחיפוש',
      blocks: [
        {
          kind: 'p',
          text:
            '`SearchResults` חי ב-`Core/Common` — אותו מקום שבו `ProjectSummary` מ-ch04. ' +
            'POCO חוצה-שכבות שאינו entity: `ProjectHit(int Id, string Name)` ' +
            'ו-`IssueHit(int Id, int ProjectId, string Title, IssueStatus Status)`. ' +
            'רזים בכוונה — ה-palette צריך מה שמספיק לקפוץ ליעד, לא entity מלא.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch16',
        file: 'server/TaskForge.Core/Common/SearchResults.cs',
        region: 'step-16.11',
        diff: true,
      },
    },

    {
      id: '16.11a',
      title: 'ISearchRepository — seam נפרד לחיפוש',
      blocks: [
        {
          kind: 'p',
          text:
            '`ISearchRepository` מגדיר `SearchForMemberAsync(userId, term, take, ct)`. ' +
            'הוא חי ב-`Core/Abstractions` — אותו מקום שבו כל ה-seams האחרים. ' +
            'הוא חוצה ישויות (פרויקטים + issues), ולכן קיבל חוזה משלו ' +
            'ולא הוסף ל-`IProjectRepository` או ל-`IIssueRepository` הקיימים.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה seam נפרד לחיפוש?',
          body:
            'חיפוש חוצה ישויות — הוא לא שייך ל-project repo ולא ל-issue repo. ' +
            'אפשר היה להוסיף מתודה לכל אחד, אבל אז ה-endpoint צריך להזריק שניהם. ' +
            'seam נפרד (`ISearchRepository`) נותן interface צר ומדויק: ' +
            '"חפש לפי userId+term" — ותו לא. ' +
            'זה גם מאפשר להחליף את המימוש (Elasticsearch, מטמון) בלי לגעת ב-endpoint.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch16',
        file: 'server/TaskForge.Core/Abstractions/ISearchRepository.cs',
        region: 'step-16.11',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 16.11b */
    {
      id: '16.11b',
      title: 'EfSearchRepository — EF.Functions.Like עם membership scope',
      blocks: [
        {
          kind: 'p',
          text:
            '`EfSearchRepository` מממש את החיפוש בשתי שאילתות EF Core עצמאיות. ' +
            'שתיהן כוללות את אותה בדיקת הרשאה: ' +
            '`db.ProjectMembers.Any(m => m.ProjectId == ... && m.UserId == userId)`. ' +
            'זה membership-scoped: כל משתמש רואה רק מה שהוא חבר בפרויקטו.',
        },
        {
          kind: 'p',
          text:
            '`EF.Functions.Like(p.Name, like)` שם ה-like הוא `$"%{term}%"`. ' +
            'זה SQL LIKE עם wildcards — לא חיפוש מדויק, לא full-text search. ' +
            'מספיק ל-palette: המשתמש מקליד "login" ומקבל issues שה-title שלהם מכיל "login". ' +
            '`Take(take)` מגביל ל-5 תוצאות — palette צריך כמה, לא את הכול.',
        },
        {
          kind: 'callout',
          tone: 'dotnet10',
          title: 'AsNoTracking() לשאילתות קריאה',
          body:
            '`AsNoTracking()` מורה ל-EF לא לעקוב אחרי הישויות שחוזרות מהשאילתה. ' +
            'זה חוסך זיכרון ומהיר יותר לשאילתות read-only. ' +
            'לשאילתות חיפוש שלעולם לא ישנו את הנתונים, `AsNoTracking()` הוא best practice.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ההבדל בין EF.Functions.Like ל-Contains?',
          body:
            '`item.Name.Contains(term)` מתורגם ל-EF ל-SQL LIKE בפועל, ' +
            'אבל הדפדן של התרגום משתנה בין ספקים. ' +
            '`EF.Functions.Like(item.Name, $"%{term}%")` הוא מפורש וקבוע: ' +
            'תמיד SQL LIKE עם wildcards. ב-SQLite הם זהים, אבל ב-PostgreSQL ו-SQL Server ' +
            '`EF.Functions.Like` מבהיר את הכוונה ומאפשר להוסיף collation אם צריך.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch16',
        file: 'server/TaskForge.Infrastructure/Repositories/EfSearchRepository.cs',
        region: 'step-16.11b',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 16.12 */
    {
      id: '16.12',
      title: 'SearchEndpoints — GET /api/search?q=',
      blocks: [
        {
          kind: 'p',
          text:
            '`SearchEndpoints.MapSearchEndpoints()` יוצר group תחת `/api` עם תג "Search", ' +
            '`HandlerTimingFilter` (אותו filter מ-ch04) ו-`RequireAuthorization()`. ' +
            'קבוצה שדורשת auth לפני כל route בה — דפוס שחוזר מאז ch05.',
        },
        {
          kind: 'p',
          text:
            'ה-handler `Search` מקבל `string? q` מה-query string, `ClaimsPrincipal user`, ' +
            '`ISearchRepository search` (DI), ו-`CancellationToken`. ' +
            'אם הterm קצר מ-2 תווים — מחזיר `SearchResults` ריק בלי לפגוע ב-DB. ' +
            'אחרת קורא ל-`search.SearchForMemberAsync(user.GetUserId(), term, 5, ct)`.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'ה-guard של `term.Length < 2` חוסם שאילתה על תו אחד בשרת, ' +
            'בדיוק כמו שה-`SearchService` בקליינט חוסמת בקשה ב-`q.length < 2`. ' +
            'כפל ההגנה: הקליינט לא שולח, והשרת לא מאפשר — בלי לסמוך שהקליינט תמיד ישמר.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה אנונימי מקבל מ-GET /api/search?q=login?',
          body:
            'הבקשה נחסמת ב-`RequireAuthorization()` — מחזירה 401. ' +
            'ה-`SearchService` בקליינט כבר בודק `!this.tokenStore.isLoggedIn()` ' +
            'ומחזיר undefined כ-URL, כלומר לא שולח בקשה. ' +
            'כפל ההגנה: לא שולחים ולא מחזירים תוצאות למי שלא מחובר.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch16',
        file: 'server/TaskForge.Api/Endpoints/SearchEndpoints.cs',
        region: 'step-16.12',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 16.13 */
    {
      id: '16.13',
      title: 'Program.cs — רישום DI ו-MapSearchEndpoints',
      blocks: [
        {
          kind: 'p',
          text:
            'שתי שורות ב-`Program.cs`: ' +
            '`builder.Services.AddScoped<ISearchRepository, EfSearchRepository>()` רושם את ה-seam ' +
            'בדיוק כמו כל ה-repos האחרים — אחת לאחת, scope אחת לבקשה. ' +
            'ו-`app.MapSearchEndpoints()` ממפה את הקבוצה, בדיוק כמו `MapProjectEndpoints()` מ-ch04.',
        },
        {
          kind: 'p',
          text:
            'לשים לב לסדר ב-`Program.cs`: `MapSearchEndpoints()` מופיע אחרי `MapCommentEndpoints()`. ' +
            'הסדר לא קריטי לפונקציונליות (Minimal API לא sensitive לסדר הmap), ' +
            'אבל הוא מתעד את סדר הוספת הפיצ\'רים.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch16',
        file: 'server/TaskForge.Api/Program.cs',
        region: 'step-16.13',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 16.14 */
    {
      id: '16.14',
      title: 'search.model.ts — המראה של השרת בקליינט',
      blocks: [
        {
          kind: 'p',
          text:
            '`search.model.ts` הוא מראה טיפוסי של `SearchResults.cs` בצד הקליינט. ' +
            'שלושה interfaces: `ProjectHit { id, name }`, ' +
            '`IssueHit { id, projectId, title, status }`, ו-`SearchResults { projects, issues }`. ' +
            'ה-`status` הוא union string literal: `\'Open\' | \'InProgress\' | \'Done\'` — ' +
            'כי השרת משתמש ב-`JsonStringEnumConverter` (מ-ch04) ומחזיר strings.',
        },
        {
          kind: 'p',
          text:
            'ה-model הזה חי ב-`core/models/` — אותו תיקייה שבה `comment.model.ts` מ-ch14 ' +
            'ו-`issue.model.ts`. כלל: כל DTO שמגיע מהשרת מקבל טיפוס ב-`core/models/`. ' +
            'אין `any`, אין `unknown` שלא מטופל.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch16',
        file: 'client/src/app/core/models/search.model.ts',
        region: 'step-16.14',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 16.15 */
    {
      id: '16.15',
      title: 'SearchService — httpResource ריאקטיבי',
      blocks: [
        {
          kind: 'p',
          text:
            '`SearchService` הוא בדיוק אותו דפוס מ-ch11 ו-ch12: ' +
            '`httpResource<SearchResults>(() => ...)` שה-URL function שלו נגזר מ-signal. ' +
            'אם `q.length < 2` או `!tokenStore.isLoggedIn()` — מחזיר `undefined` ואין בקשה. ' +
            'אחרת: `` `${API_BASE}/search?q=${encodeURIComponent(q)}` ``.',
        },
        {
          kind: 'p',
          text:
            'ה-`results` computed מחזיר `{ projects: [], issues: [] }` כ-default — ' +
            'כך ה-palette תמיד מקבל ערך תקין, לא `undefined`. ' +
            'ה-debounce (200ms) הוא דאגת ה-UI ב-`CommandPalette.onInput` — ' +
            'ה-service עצמו נשאר synchronous ופשוט.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'למה debounce ב-component ולא ב-service?',
          body:
            'ה-service לא יודע שהוא מקבל input מ-UI. הוא פשוט מגיב ל-signal. ' +
            'הdebounce הוא החלטת UI: "לא לשלוח בקשה על כל הקשה". ' +
            'ה-component מחזיק את הטיימר, מנקה אותו ב-`DestroyRef.onDestroy`, ' +
            'וקורא ל-`setQuery` רק אחרי 200ms של שקט.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch16',
        file: 'client/src/app/features/command-palette/search.service.ts',
        region: 'step-16.15',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 16.16 */
    {
      id: '16.16',
      title: 'מיזוג תוצאות: פקודות + hits לרשימה אחת',
      blocks: [
        {
          kind: 'p',
          text:
            '`results` computed מחבר שני מקורות: ' +
            '`fuzzyRank(registry.commands(), query, ...)` על הפקודות המקומיות, ' +
            'ו-`toHitCommands(search.results())` שממפה hits מהשרת ל-`Command` objects. ' +
            'ה-concat: `[...local, ...serverHits]` — פקודות מקומיות קודמות, אחר כך תוצאות שרת.',
        },
        {
          kind: 'p',
          text:
            '`toHitCommands` יוצר Command על-the-fly: לכל `IssueHit` — ID כמו `hit.issue.1`, ' +
            'כותרת מה-title, קבוצה "Issue", ו-`run` שמנווט ל-`/projects/:projectId/issues/:id`. ' +
            'לכל `ProjectHit` — ניווט ל-`/projects/:id`. ' +
            'ה-palette לא יודע שאלה "hit commands" — הוא מריץ `cmd.run()` כמו כל פקודה אחרת.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה היתרון של לייצג hits כ-Command objects?',
          body:
            'ה-palette כבר יודע לנווט במקלדת, להציג, ולהריץ Command. ' +
            'אם hits היו type שונה, היה צריך branch נפרד לכל מקרה (local vs server) בכל מקום. ' +
            'המרת hits ל-Command מאפשרת לאותו UI לטפל בשניהם — ' +
            'ה-"type erasure" הזה מפשט את ה-template לאפס conditions.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch16',
        file: 'client/src/app/features/command-palette/command-palette.ts',
        region: 'step-16.16',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 16.17 */
    {
      id: '16.17',
      title: 'ניווט מקלדת + native dialog a11y',
      blocks: [
        {
          kind: 'p',
          text:
            'ניווט המקלדת ב-`onKeydown`: ArrowDown עושה `(i + 1) % len` (עוטף לסוף), ' +
            'ArrowUp עושה `(i - 1 + len) % len` (עוטף לתחילה), Enter מריץ את `results()[active()]`. ' +
            '`mouseenter` מעדכן את `active` גם לעכבר — ההאפלה זזה.',
        },
        {
          kind: 'p',
          text:
            '`<dialog>.showModal()` מספק focus trap ו-Escape בחינם מהדפדפן: ' +
            'Tab לא יוצא; Escape מפעיל `close` event; backdrop-click אפשרי. ' +
            'ה-`(close)` event binding מנווט ל-`palette.close()` שמסנכרן את ה-signal. ' +
            'כל זה בלי polyfill, בלי ספרייה, בלי שורת קוד נוספת — ' +
            'זה אותו bridge pattern של `tf-dialog` מ-ch09.',
        },
        {
          kind: 'callout',
          tone: 'v22',
          title: 'native dialog ב-2026',
          body:
            'כל הדפדפנים הגדולים תומכים ב-`<dialog>.showModal()` מ-2022. ' +
            'ב-2026 שימוש בו הוא best practice ברור על פני span+role="dialog" ו-aria-modal מנהלים ביד. ' +
            'ה-accessibility tree של `<dialog>` גם מבודד אוטומטית: ' +
            'קוראי מסך לא יכולים לגשת לתוכן מאחוריו.',
        },
        {
          kind: 'term',
          name: 'native dialog',
          definition:
            'האלמנט `<dialog>` ב-HTML5 מספק overlay עם focus trap מובנה (showModal), ' +
            'Escape לסגירה, backdrop, ו-accessibility tree מבודד. ' +
            'ב-2026 מחליף polyfills ותבניות role="dialog" ידניות.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch16',
        file: 'client/src/app/features/command-palette/command-palette.html',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 16.18 */
    {
      id: '16.18',
      title: 'הדמו החי — palette מוקטן בפעולה',
      blocks: [
        {
          kind: 'p',
          text:
            'הדמו מציג palette תמיד-פתוח עם רשימת פקודות מדומות. ' +
            'הקלידו "dark" — רשימת הפקודות מצטמצמת ל-"החלפת מצב כהה / בהיר". ' +
            'נווטו עם חיצים, Enter מוסיף שורה ל-"לוג הרצה" מימין. ' +
            'הקלידו "log" — ה-fuzzy מוצא גם "יצירת issue חדש" (כי "log" מופיע ב-keywords "logout") ' +
            'וגם "התנתקות".',
        },
        {
          kind: 'p',
          text:
            'הדמו לא מתחבר לשרת ולא פותח dialog — הוא מלמד את המנגנון: ' +
            'fuzzy scoring, ניווט מקלדת עם wrap-around, והמרת בחירה ל-action. ' +
            'כל `transition` על `.pal-item` מבוטל כש-`prefers-reduced-motion: reduce` פעיל.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () =>
          import('./demos/palette.demo').then((m) => m.CommandPaletteDemo),
        caption: 'דמו חי: fuzzy filter, ניווט מקלדת, ולוג הרצה — המודל של ch16 ללא dialog ושרת',
      },
    },

    /* ------------------------------------------------------------ 16.19 */
    {
      id: '16.19',
      title: 'העץ אחרי פרק 16',
      blocks: [
        {
          kind: 'p',
          text:
            'בסוף פרק 16 יש לנו: שכבת מקלדת גלובלית (KeyboardService), command bus (CommandRegistry + signal), ' +
            'fuzzy ranking ביד, overlay native dialog עם focus trap, ' +
            'ו-httpResource ריאקטיבי לחיפוש שרת. ' +
            'Cmd-K פועל מכל מסך. ארבע פקודות גלובליות. חיפוש שמחזיר פרויקטים ו-issues.',
        },
        {
          kind: 'p',
          text:
            'הפרק הבא (ch17) מוסיף Drag-and-Drop ל-Kanban. ' +
            'ה-registry שבנינו כאן יאפשר לפקודות "הזז issue לעמודה X" להירשם מ-feature ה-Kanban ' +
            'בלי לשנות שורה ב-`app.ts`. זה spine piece #1 בפעולה.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch16',
        title: 'TaskForge אחרי פרק 16 — keyboard, commands, palette, search',
      },
    },
  ],

  quiz: [
    {
      q: 'מה הפונקציה של "mod" ב-KeyboardService?',
      options: [
        'מייצג Meta key בלבד (macOS)',
        'נורמליזציה של metaKey || ctrlKey — מאפשר אותו bind לעבוד על macOS ו-Windows',
        'מייצג Modifier key כלשהו (Shift, Alt, Meta, Ctrl)',
        'זה שם ה-listener שנרשם ל-document',
      ],
      answer: 1,
      explain:
        '"mod" מנרמל `event.metaKey || event.ctrlKey` לתו אחד. ' +
        'כך `bind("mod+k", ...)` עובד ב-macOS עם Cmd ובכל מקום אחר עם Ctrl — ' +
        'המתקשר לא צריך לכתוב שני bindings.',
    },
    {
      q: 'מה קורה כש-focus נמצא ב-input ומשתמש לוחץ Cmd-K?',
      options: [
        'ה-handler לא מופעל — הקשה ב-input מבוטלת תמיד',
        'ה-handler מופעל — isTyping מוחזר false כי הצירוף כולל mod',
        'ה-handler מופעל רק ב-macOS',
        'ה-browser מבטל את Cmd-K כשה-focus ב-input',
      ],
      answer: 1,
      explain:
        '`isTyping(target)` מחזיר true כשה-focus ב-input. אבל ב-`onKeydown` בודקים: ' +
        'אם `isTyping && !hasMod` — נצא בלי לקרוא לhandler. ' +
        'כשהצירוף מכיל mod (Cmd/Ctrl), `!hasMod` הוא false — ולכן ה-handler מופעל גם מ-input.',
    },
    {
      q: 'מה ציון fuzzy של "dark" על "החלפת מצב כהה / בהיר" (keywords: "theme dark light mode")?',
      options: [
        '-1 (לא נמצא)',
        '8 (התאמה בתחילת מילה ל-"d" בלבד)',
        'גבוה כי "dark" מופיע כמילה שלמה ב-keywords עם בונוס גבול מילה ורצף',
        '0 (query ריק)',
      ],
      answer: 2,
      explain:
        '"dark" מופיע ב-keywords. \'d\' — בונוס גבול מילה (8), \'a\' — בונוס רצף (3+1), ' +
        '\'r\' — בונוס רצף (3+1), \'k\' — בונוס רצף (3+1). ציון: 8+4+4+4 = 20. ' +
        'ה-fuzzy מוצא אותו ומדרג אותו גבוה.',
    },
    {
      q: 'מה מספק `<dialog>.showModal()` בלי קוד נוסף?',
      options: [
        'focus trap, Escape לסגירה, backdrop, ו-accessibility tree מבודד',
        'focus trap בלבד',
        'Escape לסגירה + backdrop בלבד',
        'כלום — כל זה דורש JavaScript',
      ],
      answer: 0,
      explain:
        '`showModal()` מספק focus trap (Tab לא יוצא), Escape מפעיל close event, ' +
        'backdrop אוטומטי (`::backdrop`), ו-accessibility tree מבודד (קוראי מסך לא יכולים לגשת לתוכן מאחורי ה-dialog). ' +
        'הכול מובנה בדפדפן, ללא polyfill.',
    },
    {
      q: 'מתי `SearchService` לא שולח בקשה לשרת?',
      options: [
        'רק כשה-query ריק לחלוטין',
        'כש-query קצר מ-2 תווים, או כשהמשתמש לא מחובר',
        'כשה-palette סגור',
        'כשאין אינטרנט',
      ],
      answer: 1,
      explain:
        'ה-URL function מחזיר `undefined` בשני מקרים: `q.length < 2` או `!tokenStore.isLoggedIn()`. ' +
        '`httpResource` עם URL=undefined לא שולח בקשה. ' +
        'זה אותו דפוס כמו `IssueDetailStore` מ-ch14 שמחזיר undefined כשאין issueId.',
    },
    {
      q: 'מה `take(5)` ב-EfSearchRepository עושה?',
      options: [
        'מגביל את זמן השאילתה ל-5 שניות',
        'מגביל את תוצאות החיפוש ל-5 רשומות לכל קטגוריה',
        'מגביל את מספר ה-connections ל-DB',
        'עושה pagination — מחזיר דף 5',
      ],
      answer: 1,
      explain:
        '`Take(take)` ב-EF Core מתרגם ל-SQL `LIMIT take`. ' +
        'ה-palette צריך כמה תוצאות מובילות, לא את כל ה-issues שמכילים "login". ' +
        'גבול ה-take גם מגן על ה-DB: לא ניתן לקבל אלפי שורות בחיפוש.',
    },
    {
      q: 'למה hits מהשרת ממוּפים ל-Command objects ב-toHitCommands?',
      options: [
        'כי ה-API מחזיר Command JSON',
        'כי TypeScript מחייב type אחיד ב-array',
        'כדי שה-palette יוכל לנווט, להציג ולהריץ hits בדיוק כמו פקודות מקומיות',
        'כי router.navigate דורש Command wrapper',
      ],
      answer: 2,
      explain:
        '`toHitCommands` יוצר `Command` עם `run` שמנווט. ' +
        'ה-palette לא צריך branch נפרד: הוא קורא `cmd.run()` על הכול. ' +
        'ה-type erasure הזה מפשט את ה-template וה-onKeydown לאפס conditions.',
    },
    {
      q: 'מה ה-effect ב-CommandPalette עושה כש-palette.open() הופך ל-true?',
      options: [
        'מוסיף class "open" על ה-dialog',
        'קורא ל-el.showModal(), מנקה את ה-query, ובתוך queueMicrotask מפקס על ה-input',
        'מריץ animation ב-JavaScript',
        'שולח בקשה לשרת לטעינת פקודות',
      ],
      answer: 1,
      explain:
        'ה-effect צופה ב-`palette.open()`. כש-open=true: מאפס query ו-active, ' +
        'קורא `el.showModal()` לפתיחה, ואז `queueMicrotask` לפוקוס על ה-input — ' +
        'כי ה-DOM צריך microtask אחד להתייצב לפני שהפוקוס עובד.',
    },
  ],

  proveIt: [
    {
      title: 'Cmd-K פותח את ה-palette מכל מסך',
      body:
        'הריצו `node tools/materialize-snapshots.mjs`, ואז `dotnet run` ב-`reference/.build/ch16/server/TaskForge.Api`, ' +
        'ואז `pnpm exec ng serve --port 4500` ב-`reference/.build/ch16/client`. ' +
        'התחברו כ-demo@taskforge.dev / Passw0rd!. ' +
        'נווטו ל-`http://localhost:4500/projects`. ' +
        'לחצו Cmd-K (macOS) או Ctrl-K (Windows/Linux). ',
      expect:
        'ה-palette נפתח עם input מפוקס. מוצגות הפקודות הגלובליות. ' +
        'לחצו Escape — ה-palette נסגר. נווטו לפרויקט, לחצו שוב Cmd-K — הוא נפתח שוב.',
    },
    {
      title: 'Fuzzy filter ומעבר dark mode',
      body:
        'עם ה-palette פתוח (same setup), הקלידו "dark" בשדה החיפוש.',
      expect:
        'הרשימה מצטמצמת ל-"החלפת מצב כהה / בהיר". לחצו Enter — ה-theme מוחלף (dark-light), ' +
        'ה-palette נסגר. לחצו Cmd-K שוב, הקלידו "login" — ' +
        'תראו גם "התחברות" (פקודה מקומית) וגם "Fix login redirect loop" (תוצאת שרת, קבוצה Issue). ' +
        'לחצו ArrowDown כדי לסמן את ה-Issue hit, Enter — מנווט ל-`/projects/1/issues/1`.',
    },
    {
      title: 'GET /api/search ישיר עם curl',
      body:
        'עם השרת רץ על `http://localhost:5080`, קבלו Bearer token (POST /api/auth/login, demo@taskforge.dev / Passw0rd!). ' +
        'שלחו: `curl -H "Authorization: Bearer <token>" "http://localhost:5080/api/search?q=login"`. ' +
        'שלחו גם: `curl "http://localhost:5080/api/search?q=login"` (ללא auth). ' +
        'שלחו: `curl -H "Authorization: Bearer <token>" "http://localhost:5080/api/search?q=a"` (תו אחד). ' +
        'שלחו: `curl -H "Authorization: Bearer <token>" "http://localhost:5080/api/search?q=Mobile"`. ',
      expect:
        'עם auth, q=login: `{"projects":[],"issues":[{"id":1,"projectId":1,"title":"Fix login redirect loop","status":"InProgress"}]}`. ' +
        'ללא auth: 401. ' +
        'q=a (תו אחד): `{"projects":[],"issues":[]}`. ' +
        'q=Mobile: `{"projects":[{"id":2,"name":"Mobile App"}],"issues":[]}`. ' +
        'status מחזיר כ-string ("InProgress"), לא כמספר — כי `JsonStringEnumConverter` מ-ch04.',
    },
    {
      title: 'header trigger ו-375px ללא overflow',
      body:
        'ב-DevTools, הגדירו device emulation ל-375px ברוחב. ' +
        'נווטו ל-`http://localhost:4500`. ' +
        'בדקו שה-header לא גולש אופקית (אין scrollbar אופקי, אין element שנחתך).',
      expect:
        'ה-header מציג את הכותרת ואת ה-.header-actions בשתי שורות (flex-wrap: wrap). ' +
        'כפתור "פקודות ⌘K" מוצג. לחיצה עליו פותחת את ה-palette. ' +
        'אין overflow אופקי — בדקו ב-Elements tab שאין אלמנט רחב מ-375px.',
    },
  ],

  exercise: {
    prompt:
      'הוסיפו פקודה חדשה ל-registry ושייכו אליה קיצור מקלדת נפרד.',
    tasks: [
      'ב-`app.ts`, ב-`registry.register(...)`, הוסיפו פקודה חדשה: `{ id: \'nav.issues\', title: \'מעבר לפרויקט הראשון\', group: \'Navigation\', keywords: \'project one first\', hint: \'g 1\', run: () => void this.router.navigate([\'/projects\', 1]) }`.',
      'ב-constructor של `app.ts`, הוסיפו `this.keyboard.bind(\'mod+1\', () => void this.router.navigate([\'/projects\', 1]))` כדי לנווט ישירות ב-Cmd-1/Ctrl-1 ללא פתיחת ה-palette.',
      'פתחו את ה-palette (Cmd-K) והקלידו "first" — ודאו שהפקודה החדשה מופיעה.',
      'לחצו Cmd-1 (ללא פתיחת palette) ובדקו שהניווט עובד ישירות.',
    ],
    acceptance: [
      'ה-palette מציג "מעבר לפרויקט הראשון" כשמחפשים "first" או "g 1".',
      'Cmd-1/Ctrl-1 מנווטים ישירות ל-`/projects/1` בלי לפתוח את ה-palette.',
      'ב-375px אין overflow אופקי חדש.',
      '`pnpm test`, `pnpm verify:coverage` ו-`pnpm build` עוברים.',
    ],
  },
};
