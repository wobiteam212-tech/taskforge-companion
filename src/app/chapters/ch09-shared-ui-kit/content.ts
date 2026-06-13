import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 09 — ערכת UI משותפת.
 * button / field / badge / dialog / toast כרכיבים טיפשים מבוססי signals,
 * עם content projection, ונגישות מובנית.
 */
export const CH09_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 9.1 */
    {
      id: '9.1',
      title: 'ערכה אחת, שפה אחת',
      blocks: [
        {
          kind: 'p',
          text:
            'פרק 08 נתן לאפליקציה טוקנים — קבועים של צבע, מרווח, רדיוס וטיפוגרפיה. ' +
            'אבל טוקנים לבד הם כמו מילון ללא משפטים: ידוע מה כל מילה אומרת, ' +
            'אבל אי-אפשר לדבר. ' +
            'פרק 09 בונה את המשפטים: רכיבים שמדברים את השפה שפרק 08 הגדיר.',
        },
        {
          kind: 'p',
          text:
            'חמשת הרכיבים שנבנה כאן — ‏`tf-button`, ‏`tf-badge`, ‏`tf-field`, ‏`tf-dialog`, ‏`tf-toast-container` — ' +
            'גרים ב-`shared/ui/`. ' +
            'הגדרה: כל מה שנמצא בתיקייה הזו לא יכיר store, לא יזריק HTTP, ולא ידע ממה פיצ׳ר הוא חלק. ' +
            'הוא מקבל inputs, מוציא outputs, ומציג. זה הכול.',
        },
        {
          kind: 'ul',
          items: [
            '‏`shared/ui/` — רכיבים טיפשים: inputs בלבד, אפס הזרקות, אפס ידע על features.',
            '‏`features/` — רכיבים חכמים: יודעים על store ומשתמשים ב-shared/ui כ-building blocks.',
            '‏`core/` — מודלים, state, ושירותים: לא מכיר את features, לא מכיר את shared/ui ישירות.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה עכשיו? בפרקים 07–08 בנינו מסכים ישירות — ‏`<button>` גולמי, ‏`<span class="count">`. ' +
            'ברגע שמסכים מתרבים, כל אחד ממציא מחדש את אותה פיסת UI. ' +
            'ערכה משותפת היא ההשקעה שמניבה ריבית: כל feature חדש מרוויח מרכיבים שכבר נבדקו, ' +
            'וכל שדרוג עיצובי מתפשט אוטומטית לכל המקומות.',
        },
      ],
      panel: {
        kind: 'diagram',
        caption: 'הטוקנים של פרק 08 בבסיס, רכיבי shared/ui מעליהם, features צורכים את שניהם.',
        mermaid: `flowchart TD
  T["design tokens\\nch08"]
  S["shared/ui\\ntf-button · tf-badge\\ntf-field · tf-dialog · tf-toast"]
  F["features/\\nproject-card · project-list · app"]
  S --> T
  F --> S
  F --> T`,
      },
    },

    /* ------------------------------------------------------------ 9.2 */
    {
      id: '9.2',
      title: 'מפת הערכה',
      blocks: [
        {
          kind: 'p',
          text:
            'חמישה רכיבים, חמש תיקיות. כל תיקייה מכילה את ה-TypeScript, ה-HTML (אם יש), והסגנון שלה. ' +
            'שם תיקייה = שם ה-selector בלי הקידומת `tf-`.',
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'כשרכיב כולל קובץ HTML נפרד, הוא גדול מספיק כדי להיות קריא — ‏`templateUrl` עדיף על `template` inline. ' +
            'כשהתבנית קצרה (שורה אחת של `<ng-content />`), היא נשארת inline.',
        },
      ],
      panel: {
        kind: 'filetree',
        title: 'מבנה shared/ui — חמישה רכיבים בחמש תיקיות',
        caption: 'כל תיקייה = רכיב אחד. שם = selector בלי tf-.',
        lines: [
          { text: 'client/src/app/shared/ui/', depth: 0, kind: 'dir' },
          { text: 'button/', depth: 1, kind: 'dir' },
          { text: 'button.ts', depth: 2, kind: 'file', badge: 'new' },
          { text: '— attribute selector + variant input', depth: 2, kind: 'comment' },
          { text: 'button.scss', depth: 2, kind: 'file', badge: 'new' },
          { text: '— primary / ghost / danger דרך host classes', depth: 2, kind: 'comment' },
          { text: 'badge/', depth: 1, kind: 'dir' },
          { text: 'badge.ts', depth: 2, kind: 'file', badge: 'new' },
          { text: '— tone input: open / progress / done / count', depth: 2, kind: 'comment' },
          { text: 'badge.scss', depth: 2, kind: 'file', badge: 'new' },
          { text: '— color-mix מטוקני פרק 08, אפס צבעים קשיחים', depth: 2, kind: 'comment' },
          { text: 'field/', depth: 1, kind: 'dir' },
          { text: 'field.ts', depth: 2, kind: 'file', badge: 'new' },
          { text: '— label / error / hint inputs', depth: 2, kind: 'comment' },
          { text: 'field.html', depth: 2, kind: 'file', badge: 'new' },
          { text: '— label עוטף, ng-content מוקרן פנימה', depth: 2, kind: 'comment' },
          { text: 'field.scss', depth: 2, kind: 'file', badge: 'new' },
          { text: 'dialog/', depth: 1, kind: 'dir' },
          { text: 'dialog.ts', depth: 2, kind: 'file', badge: 'new' },
          { text: '— model() two-way + effect לגשר signals-DOM', depth: 2, kind: 'comment' },
          { text: 'dialog.html', depth: 2, kind: 'file', badge: 'new' },
          { text: '— native <dialog> + close listener', depth: 2, kind: 'comment' },
          { text: 'dialog.scss', depth: 2, kind: 'file', badge: 'new' },
          { text: 'toast/', depth: 1, kind: 'dir' },
          { text: 'toast.service.ts', depth: 2, kind: 'file', badge: 'new' },
          { text: '— store קטן: signal פרטי, show/dismiss, setTimeout', depth: 2, kind: 'comment' },
          { text: 'toast-container.ts', depth: 2, kind: 'file', badge: 'new' },
          { text: '— tf-toast-container: aria-live="polite" בשלד', depth: 2, kind: 'comment' },
          { text: 'toast-container.html', depth: 2, kind: 'file', badge: 'new' },
          { text: 'toast-container.scss', depth: 2, kind: 'file', badge: 'new' },
        ],
      },
    },

    /* ------------------------------------------------------------ 9.3 */
    {
      id: '9.3',
      title: 'כפתור שהוא עדיין כפתור',
      blocks: [
        {
          kind: 'p',
          text:
            'כשמגדירים רכיב Angular עם `selector: \'tf-button\'`, כותבים ‏`<tf-button>` בתבנית ' +
            'ו-Angular מחליף אותו עם custom element. ' +
            '‏`TfButton` בוחר מסלול אחר: ה-selector הוא ‏`\'button[tf-button], a[tf-button]\'` — ' +
            'attribute selector, לא element selector.',
        },
        {
          kind: 'p',
          text:
            'מה זה אומר בפועל: כותבים ‏`<button tf-button>New project</button>`. ' +
            'ה-`<button>` נשאר `<button>` אמיתי ב-DOM — Angular רק מוסיף לו זהות ויזואלית ' +
            'דרך host classes שנגזרות מה-`variant` input.',
        },
        {
          kind: 'ul',
          items: [
            'מקלדת: ‏`Tab`, מקש הרווח ו-Enter עובדים בלי שורת קוד נוספת.',
            'פוקוס: הדפדפן נותן focusability; ה-CSS שלנו נותן `:focus-visible` ברור בצבע ember.',
            'טפסים: ‏`type="submit"` פועל; ‏`[disabled]` עוצר הגשה.',
            'קורא מסך: הדפדפן כבר יודע ש-`<button>` הוא interactive — אין צורך ב-`role="button"`.',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה selector של attribute ולא selector של element לכפתור?',
          body:
            'Selector של element (`tf-button`) יוצר custom element בפועל: ‏`<tf-button>` ב-DOM. ' +
            'הדפדפן לא יודע שזה כפתור — צריך להוסיף `role="button"`, tabIndex, keyboard handlers ידנית. ' +
            'Attribute selector שומר את ה-`<button>` המקורי ב-DOM: ' +
            'כל התנהגות הנגישות, פוקוס, טפסים — חינם מהפלטפורמה. ' +
            'Angular רק מוסיף זהות ויזואלית; הסמנטיקה נשארת של הדפדפן.',
        },
        {
          kind: 'term',
          name: 'attribute selector',
          definition:
            'selector של רכיב שנצמד לאלמנט קיים לפי attribute (למשל `button[tf-button]`) ' +
            'במקום להחליף אותו ב-custom element. האלמנט נשאר הוא עצמו — ' +
            'מקלדת, פוקוס וטפסים מהפלטפורמה — והרכיב מוסיף רק התנהגות ועיצוב.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch09',
        file: 'client/src/app/shared/ui/button/button.ts',
        region: 'step-9.3',
      },
    },

    /* ------------------------------------------------------------ 9.4 */
    {
      id: '9.4',
      title: 'הסגנון של הכפתור',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`button.scss` מגדיר שלושה variants דרך host classes: ' +
            '‏`tf-btn--primary`, ‏`tf-btn--ghost`, ‏`tf-btn--danger`. ' +
            'כל variant בנוי מטוקנים של פרק 08 בלבד — אין צבעים קשיחים.',
        },
        {
          kind: 'ul',
          items: [
            'Primary: ‏`background: var(--ember)` + `color-mix` ב-hover.',
            'Ghost: ‏`background: transparent`; hover מציב `border-color: var(--ember)` + `color: var(--ember)`.',
            'Danger: ‏`color: var(--danger)`; border נגזר עם `color-mix(in srgb, var(--danger) 55%, var(--bdr))`.',
            'תנועה אחידה: ה-transition משתמש ב-`--dur-1` ו-`--ease-out`, וה-`active` מוריד את הכפתור פיקסל אחד לתחושת לחיצה.',
            'Primary מקבל `box-shadow: var(--shadow-1)` — elevation קל שמגיע ממערכת העיצוב, לא מצל אקראי.',
            '‏`:focus-visible` עם `outline: 2px solid var(--ember)` — נגישות מקלדת גלויה, בצבע הדגש היחיד.',
            '‏`:disabled` עם `opacity: 0.5` — מצב מנוטרל.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'למה `:host(.tf-btn--primary)` ולא `::ng-deep` או class על הילד? ' +
            'הרכיב הוא ה-host element עצמו — ה-`<button>` בפועל. ' +
            'לכן `:host(...)` הוא הדרך הטבעית לסגנן אותו בהתאם ל-class שה-component מוסיף לעצמו.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch09',
        file: 'client/src/app/shared/ui/button/button.scss',
      },
    },

    /* ------------------------------------------------------------ 9.5 */
    {
      id: '9.5',
      title: 'tf-badge: צבע נגזר, לא נקבע',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`TfBadge` הוא רכיב של שורה אחת של לוגיקה: ‏`tone` input מוגדר, ' +
            'host classes מגיבים לו, ו-CSS נותן את הצבע. ' +
            'ל-badge אין מצב פנימי, אין outputs, אין הזרקות.',
        },
        {
          kind: 'p',
          text:
            'הטוקנים מגיעים מפרק 08 — ‏`var(--teal)` לסטטוס open, ‏`var(--ember)` לסטטוס progress, ' +
            '‏`var(--txt3)` לסטטוס done. ' +
            'הצבע לא קשיח: הוא חי ב-`badge.scss` בצורת `color-mix(in srgb, var(--teal) 16%, transparent)` — ' +
            'כך dark mode עובד בחינם. גם הצורה והצפיפות מגיעות מטוקנים: `--rad-full`, ‏`--control-h-sm`, ו-`--fw-semibold`.',
        },
        {
          kind: 'code',
          lang: 'scss',
          title: 'client/src/app/shared/ui/badge/badge.scss',
          code: `:host {
  display: inline-flex;
  align-items: center;
  min-block-size: var(--control-h-sm);
  border-radius: var(--rad-full);
  padding-block: 0;
  padding-inline: var(--sp-2);
  font-size: var(--fs-small);
  font-weight: var(--fw-semibold);
  white-space: nowrap;
}

:host(.tf-badge--count) {
  background: color-mix(in srgb, var(--ember) 16%, transparent);
  color: var(--ember);
}

:host(.tf-badge--open) {
  background: color-mix(in srgb, var(--teal) 16%, transparent);
  color: var(--teal);
}

:host(.tf-badge--progress) {
  background: color-mix(in srgb, var(--ember) 16%, transparent);
  color: var(--ember);
}

:host(.tf-badge--done) {
  background: color-mix(in srgb, var(--txt3) 18%, transparent);
  color: var(--txt3);
}`,
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch09',
        file: 'client/src/app/shared/ui/badge/badge.ts',
      },
    },

    /* ------------------------------------------------------------ 9.6 */
    {
      id: '9.6',
      title: 'tf-field: ה-label עוטף, התוכן מוקרן',
      blocks: [
        {
          kind: 'p',
          text:
            'כשכותבים `<label for="my-input">Name</label><input id="my-input" />`, ' +
            'חייבים לנהל `id` ו-`for` ידנית בכל מקום. ' +
            '‏`TfField` פותר את זה בצורה אלגנטית: הפקד (input, select, textarea) מוקרן ' +
            'פנימה בתוך ה-`<label>` עצמו. לחיצה על טקסט ה-label מעבירה את הפוקוס לפקד — ' +
            'ברירת מחדל של הדפדפן, בלי `for` בכל שימוש.',
        },
        {
          kind: 'code',
          lang: 'html',
          title: 'client/src/app/shared/ui/field/field.html',
          code: `<label class="tf-field">
  <span class="tf-field-label">{{ label() }}</span>
  <ng-content />
  @if (error(); as e) {
    <span class="tf-field-error" role="alert">{{ e }}</span>
  } @else if (hint(); as h) {
    <span class="tf-field-hint">{{ h }}</span>
  }
</label>`,
        },
        {
          kind: 'p',
          text:
            'הסגנון ב-`client/src/app/shared/ui/field/field.scss` משתמש ב-`::ng-deep` ' +
            'לסגנן `input`, `select` ו-`textarea` שמוקרנים פנימה — ' +
            'כי הם נמצאים ב-light DOM של ההורה, לא בתוך ה-encapsulation של ה-field. ' +
            'שם גם מוגדרים transition קצר, border ב-ember בזמן focus, ו-`:focus-visible` עקבי.',
        },
        {
          kind: 'p',
          text:
            'עוד שכבת נגישות קטנה חיה ב-`field.ts`: אם הפקד המוקרן הגיע בלי `id` או `name`, ' +
            'הרכיב מייצר אותם מה-label. ה-label העוטף עדיין נותן פוקוס בלחיצה, ' +
            'ו-Chrome/autofill/בדיקות טפסים מקבלים שם יציב לשדה.',
        },
        {
          kind: 'term',
          name: 'content projection',
          definition:
            'מנגנון Angular שמאפשר לרכיב הורה לכניס תוכן לתוך "חורים" ברכיב ילד. ' +
            'ה-`<ng-content />` מסמן איפה התוכן ייפול. ' +
            'ב-`tf-field`, הפקד (input/select) מוקרן לתוך ה-label — ' +
            'כך הרכיב קיבל גמישות (כל סוג פקד) מבלי לדעת מה בדיוק יכנס.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch09',
        file: 'client/src/app/shared/ui/field/field.ts',
        region: 'step-9.6',
      },
    },

    /* ------------------------------------------------------------ 9.7 */
    {
      id: '9.7',
      title: 'המגרש: חורים בתבנית',
      blocks: [
        {
          kind: 'p',
          text:
            'הדמו החי מראה בדיוק איך content projection עובד. ' +
            'יש רכיב-מסגרת (`demo-frame`) עם שלושה `<ng-content>` slots: ' +
            'אחד עם `select="[icon]"`, אחד ברירת מחדל, ואחד עם `select="[actions]"`. ' +
            'רכיב ההורה (`ProjectionDemo`) מחזיק שלושה signals — ‏`withIcon`, ‏`withBody`, ‏`withActions` — ' +
            'שמשפיעים על מה שנכנס לכל חור.',
        },
        {
          kind: 'ul',
          items: [
            'כשה-icon slot פעיל: ‏`<span icon class="chip">` נכנס לחור `select="[icon]"` כי יש לו attribute `icon`.',
            'תוכן ברירת מחדל (פסקת הטקסט): אין attribute מיוחד, אז הוא נופל ל-`<ng-content />` הכללי.',
            'כשה-actions slot פעיל: ‏`<span actions class="chip">` נכנס לחור `select="[actions]"` כי יש לו attribute `actions`.',
            'חור שלא מתמלא: נשאר עם גבול קטוע (dashed). חור שמתמלא: נצבע בגוון ה-ember עם גבול בולט.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'מתי להשתמש ב-projection ולא ב-input? ' +
            'כשהתוכן הוא HTML עשיר — תמונה, אייקון, כפתורים, רכיבים מקוננים. ' +
            'Input מספיק למחרוזת פשוטה; projection מספיק לכל מה שמורכב יותר. ' +
            'בדיוק כמו שה-browser משתמש ב-`<slot>` לאותה מטרה ב-Web Components.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () => import('./demos/projection.demo').then((m) => m.ProjectionDemo),
        caption:
          'דמו חי: שלושה כפתורי toggle שולטים במה שנכנס לכל חור. הדליקו slot ובחנו איזה חור נדלק.',
      },
    },

    /* ------------------------------------------------------------ 9.8 */
    {
      id: '9.8',
      title: 'tf-dialog: הפלטפורמה כבר בנתה את זה',
      blocks: [
        {
          kind: 'p',
          text:
            'הרוב המכריע של "dialogs" ב-web הם `<div>` מסוגנן עם `position: fixed`. ' +
            'הגישה הזו דורשת לטפל ידנית ב-focus trap, בסגירה עם Escape, ב-backdrop, ' +
            'ובמניעת גלילת הדף מאחורי ה-dialog. ' +
            '‏`TfDialog` לא מגדיר שום מנגנון כזה — כי הוא עוטף את `<dialog>` המקורי של הדפדפן.',
        },
        {
          kind: 'p',
          text:
            '‏`showModal()` נותן בחינם: focus trap (הפוקוס לא יכול לצאת), ' +
            'סגירה עם Escape (ה-browser מוציא אירוע `close`), backdrop מובנה, ' +
            'ו-`z-index` על גבי הכול. ' +
            'הגשר שנחוץ הוא רק בין עולם signals לעולם DOM הציווי — וזה בדיוק מה ש-`effect` עושה.',
        },
        {
          kind: 'p',
          text:
            'שימו לב ל-`viewChild` שמוגדר ‏`viewChild<ElementRef<HTMLDialogElement>>(\'dlg\')` בלי ‏`{ required: true }`. ' +
            'ב-Angular, ה-`effect` יכול לרוץ בפעם הראשונה לפני ש-`viewChild` התיישב. ' +
            'הגנה שקטה (`if (!el) return;`) עדיפה על שגיאת NG0951 בזמן ריצה.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה מקבלים בחינם מ-dialog המקורי לעומת div מעוצב?',
          body:
            'הדפדפן מטפל בשלושה דברים קריטיים בחינם: ' +
            '(1) Focus trap — Tab ו-Shift+Tab מסתובבים רק בתוך ה-dialog; ' +
            '(2) Escape — הדפדפן מוציא אירוע `close` אוטומטית; ' +
            '(3) Backdrop מובנה עם `::backdrop`. ' +
            'עם `<div>` צריך לממש את כל השלושה ידנית, להתמודד עם edge cases של focus management, ' +
            'ולוודא שה-ARIA roles נכונים. ' +
            'ב-`<dialog>` הסמנטיקה והנגישות מגיעות מהדפדפן עצמו — תעדיפו אותו.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch09',
        file: 'client/src/app/shared/ui/dialog/dialog.ts',
        region: 'step-9.8',
      },
    },

    /* ------------------------------------------------------------ 9.9 */
    {
      id: '9.9',
      title: 'תבנית הדיאלוג ועיצובו',
      blocks: [
        {
          kind: 'p',
          text:
            'תבנית ה-dialog פשוטה: ‏`<dialog #dlg>` עם template variable לזיהוי ה-`viewChild`, ' +
            '`(close)="onNativeClose()"` שמסנכרן את ה-signal חזרה כשהדפדפן סוגר (Escape), ' +
            'וכפתור ✕ שקורא `open.set(false)` — וזה מפעיל את ה-effect שסוגר את ה-dialog.',
        },
        {
          kind: 'code',
          lang: 'html',
          title: 'client/src/app/shared/ui/dialog/dialog.html',
          code: `<dialog #dlg class="tf-dialog" (close)="onNativeClose()">
  <header class="tf-dialog-head">
    <h2>{{ heading() }}</h2>
    <button type="button" class="tf-dialog-x" (click)="open.set(false)" aria-label="Close">
      ✕
    </button>
  </header>

  <div class="tf-dialog-body">
    <ng-content />
  </div>
</dialog>`,
        },
        {
          kind: 'p',
          text:
            '‏`dialog.scss` מסגנן את ה-dialog עצמו עם `border-radius: var(--rad)`, ' +
            '`background: var(--sur)`, ו-`box-shadow: var(--shadow-3)` שמפריד אותו מהתוכן מאחוריו. ' +
            'כשה-dialog פתוח הוא מקבל animation קצר דרך `--dur-3` ו-`--ease-out`, וה-`::backdrop` מקבל גם blur עדין — ' +
            'תכונה שאפשר לסגנן רק ב-`<dialog>` מקורי.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch09',
        file: 'client/src/app/shared/ui/dialog/dialog.scss',
      },
    },

    /* ------------------------------------------------------------ 9.10 */
    {
      id: '9.10',
      title: 'ToastService: ה-store הקטן ביותר',
      blocks: [
        {
          kind: 'p',
          text:
            'פרק 07 הציג `ProjectsStore` — signal פרטי, `asReadonly` החוצה, מתודות בלבד. ' +
            '‏`ToastService` הוא אותו דפוס בזעיר אנפין: ' +
            '‏`_toasts` כ-`signal<Toast[]>([])` בתוך השירות, ' +
            '`toasts` כ-`asReadonly()` החוצה, ' +
            'ו-`show` ו-`dismiss` כמתודות בלבד.',
        },
        {
          kind: 'p',
          text:
            'כל toast שנוצר מקבל `id` ייחודי מ-`nextId++`. ' +
            'מיד אחרי ה-`update`, ‏`setTimeout(() => this.dismiss(id), 4000)` מתזמן סגירה עצמאית. ' +
            'אם המשתמש לוחץ לפני שהטיימר פג, ‏`dismiss` מסיר את ה-toast מה-signal, ' +
            'וה-`setTimeout` שיורה אחרי 4 שניות פשוט לא ימצא toast עם ה-id הזה.',
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה state של toasts גר בשירות ולא עובר ב-inputs?',
          body:
            'Toast הוא cross-cutting concern: כל feature באפליקציה צריך יכולת להוציא הודעה. ' +
            'אם ה-state היה ב-component, כל feature היה צריך להעביר את ה-toast event ' +
            'דרך כל שרשרת הרכיבים עד ל-root. ' +
            'שירות singleton עם `providedIn: \'root\'` הוא פתרון אחד לכולם — כל מי שצריך מזריק ומשתמש.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch09',
        file: 'client/src/app/shared/ui/toast/toast.service.ts',
        region: 'step-9.10',
      },
    },

    /* ------------------------------------------------------------ 9.11 */
    {
      id: '9.11',
      title: 'המכולה: aria-live',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`ToastContainer` חי פעם אחת בשלד (`app.html`). ' +
            'הוא מזריק `ToastService` ומציג את `toastSvc.toasts()` ב-`@for`. ' +
            'כל toast מוצג כ-`<button>` — לחיצה עליו קוראת ל-`toastSvc.dismiss(t.id)`.',
        },
        {
          kind: 'code',
          lang: 'html',
          title: 'client/src/app/shared/ui/toast/toast-container.html',
          code: `<div class="tf-toasts" aria-live="polite">
  @for (t of toastSvc.toasts(); track t.id) {
    <button
      type="button"
      class="tf-toast"
      [class.tf-toast--success]="t.tone === 'success'"
      [class.tf-toast--danger]="t.tone === 'danger'"
      (click)="toastSvc.dismiss(t.id)"
      title="Dismiss"
    >
      {{ t.text }}
    </button>
  }
</div>`,
        },
        {
          kind: 'p',
          text:
            'שני קבצים משלימים את המכולה:',
        },
        {
          kind: 'ul',
          items: [
            '‏`client/src/app/shared/ui/toast/toast-container.ts` — ה-component class: מזריק `ToastService`, selector ‏`tf-toast-container`, ‏`templateUrl` ו-`styleUrl`.',
            '‏`client/src/app/shared/ui/toast/toast-container.scss` — `position: fixed` בפינה התחתונה-קצה בשיטת logical properties (‏`inset-block-end`, ‏`inset-inline-end`), עם `z-index: 50`, ‏`box-shadow: var(--shadow-2)`, animation דרך `--ease-spring`, וצבעי success/danger דרך `color-mix`.',
          ],
        },
        {
          kind: 'term',
          name: 'aria-live',
          definition:
            'attribute של HTML שמסמן אזור שתוכנו יכול להשתנות דינמית. ' +
            '`aria-live="polite"` אומר לקוראי מסך להמתין עד שהמשתמש יסיים את הפעולה הנוכחית, ' +
            'ואז לקרוא את ההודעה החדשה — בלי לקטוע. ' +
            'ללא `aria-live`, משתמש שמתעוור לא ידע ש-toast הופיע.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch09',
        file: 'client/src/app/shared/ui/toast/toast-container.ts',
      },
    },

    /* ------------------------------------------------------------ 9.12 */
    {
      id: '9.12',
      title: 'החנות לומדת להוסיף',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`ProjectsStore` קיבל מתודה שנייה: ‏`addProject(name: string)`. ' +
            'היא עוקבת אחרי אותו חוק שכבר הגדרנו: ' +
            'שינוי state עובר רק דרך מתודות של ה-store; ' +
            'אף קומפוננטה לא יכולה לגעת ב-`_projects` ישירות.',
        },
        {
          kind: 'p',
          text:
            'ה-id של הפרויקט החדש נגזר עם ‏`Math.max(0, ...list.map((p) => p.id)) + 1`. ' +
            'זהו בדיוק autoincrement של SQLite — ' +
            'ה-max הקיים פלוס אחד. ' +
            'בפרק 11 שורת ה-`addProject` תוחלף ב-POST ל-`/api/projects` ' +
            'ו-id יחזור מהשרת; הממשק הציבורי של ה-store לא ישתנה.',
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'הסים הזה — מימוש שיתחלף מחר בלי שהצרכנים שלו ירגישו — ' +
            'הוא אותו עיקרון כמו `IProjectRepository` בשרת מפרק 02. ' +
            'הגבול שה-store שומר על ה-state הוא החוזה; המימוש (מוק או HTTP) הוא הפרט.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch09',
        file: 'client/src/app/core/state/projects.store.ts',
        region: 'step-9.12',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 9.13 */
    {
      id: '9.13',
      title: 'הפיצ׳ר מתחבר: דיאלוג, שדה, טוסט',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`ProjectList` הוא המקום שבו כל הרכיבים מהפרק הזה מתחברים. ' +
            'הוא מחזיק ‏`newProjectOpen = signal(false)` — ' +
            'ה-signal שולט על הדיאלוג דרך ‏`[(open)]="newProjectOpen"`. ' +
            'הסינטקס ‏`[(open)]` הוא "banana-in-a-box": Angular מרחיב אותו ל-`[open]="newProjectOpen" (openChange)="newProjectOpen.set($event)"`.',
        },
        {
          kind: 'p',
          text:
            'בתוך ה-dialog: ‏`tf-field` עוטף ‏`<input #nameInput>`. ' +
            'כשהמשתמש לוחץ "Create", ‏`create(nameInput.value)` נקרא, ' +
            'ו-`nameInput.value = \'\'` מאפס את השדה ידנית — ' +
            'כי Angular לא מנהל את ה-value של input גולמי בלי forms.',
        },
        {
          kind: 'code',
          lang: 'html',
          title: 'client/src/app/features/projects/project-list.html',
          code: `<section class="projects">
  <h2>
    Projects <span class="total">{{ store.totalOpenIssues() }} open issues</span>
    <button tf-button class="new-btn" (click)="newProjectOpen.set(true)">New project</button>
  </h2>

  @for (p of store.projects(); track p.id) {
    <tf-project-card [project]="p" (open)="onOpen($event)" />
  } @empty {
    <p class="empty">No projects yet.</p>
  }
</section>

<tf-dialog heading="New project" [(open)]="newProjectOpen">
  <tf-field label="Project name" hint="Visible to the whole team">
    <input #nameInput type="text" placeholder="e.g. Mobile App v2" />
  </tf-field>

  <footer class="dlg-actions">
    <button tf-button variant="ghost" (click)="newProjectOpen.set(false)">Cancel</button>
    <button tf-button (click)="create(nameInput.value); nameInput.value = ''">Create</button>
  </footer>
</tf-dialog>`,
        },
        {
          kind: 'p',
          text:
            'לוגיקת `create()` ב-`project-list.ts`: מריצה `trim()`, ' +
            'ואם הוא ריק — `toastSvc.show(\'Project name is required\', \'danger\')` ו-return. ' +
            'אם עבר — `store.addProject(trimmed)`, ' +
            '`toastSvc.show(...)` עם tone success, ו-`newProjectOpen.set(false)` לסגירת ה-dialog.',
        },
        {
          kind: 'term',
          name: 'model() / two-way binding',
          definition:
            'ב-Angular v17+, ‏`model()` מגדיר signal שהרכיב יכול לקרוא ולכתוב. ' +
            'הורה שמעביר ‏`[(open)]="sig"` מקבל two-way binding: ' +
            'שינוי מבחוץ מעדכן את הרכיב, ושינוי מבפנים (‏`open.set(false)`) מעדכן את ה-signal של ההורה. ' +
            'ה-`input()` הרגיל הוא one-way בלבד.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch09',
        file: 'client/src/app/features/projects/project-list.ts',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 9.14 */
    {
      id: '9.14',
      title: 'הרפקטור משלם: הכרטיס מתקצר',
      blocks: [
        {
          kind: 'p',
          text:
            'כשהערכה קיימת, הקוד הישן מתקצר. ' +
            '‏`project-card` השתנה בשלושה קבצים:',
        },
        {
          kind: 'ul',
          items: [
            '‏`client/src/app/features/projects/project-card.ts` — מייבא `TfBadge` ו-`TfButton`; הלוגיקה לא השתנתה.',
            '‏`client/src/app/features/projects/project-card.html` — ‏`<span class="count">` הוחלף ב-`<tf-badge tone="count">`, וה-`<button>` הגולמי הוחלף ב-`<button tf-button variant="ghost">`.',
            '‏`client/src/app/features/projects/project-card.scss` — ה-container query נשאר, ה-CSS של `.count` נמחק, והכרטיס קיבל `--shadow-1/2`, ‏`--dur-2`, ‏`--ease-out` ו-hover `translateY`.',
          ],
        },
        {
          kind: 'p',
          text:
            'גם השלד עודכן: ‏`client/src/app/app.ts` מייבא ‏`TfButton` ו-`ToastContainer`, ' +
            'ו-`client/src/app/app.html` מציג `<button tf-button variant="ghost">` לכפתור toggle ה-theme ' +
            'ומוסיף `<tf-toast-container />` בסוף — כך ה-toasts זמינים לכל הדף. ' +
            'כמו כן, ‏`client/src/app/features/projects/project-list.scss` קיבל `.dlg-actions` ' +
            'שמסגנן את footer ה-dialog עם `justify-content: flex-end`.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch09',
        file: 'client/src/app/features/projects/project-card.html',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 9.15 */
    {
      id: '9.15',
      title: 'יש לנו שפה',
      blocks: [
        {
          kind: 'p',
          text: 'בסוף פרק 09 הקליינט קיבל ערכת UI שלמה:',
        },
        {
          kind: 'ul',
          items: [
            '‏`shared/ui/button/` — attribute selector שמשאיר `<button>` אמיתי; variant input, host classes, motion tokens, active transform ו-elevation קל.',
            '‏`shared/ui/badge/` — tone input; צבעים מ-`color-mix`; צפיפות ורדיוס דרך `--control-h-sm` ו-`--rad-full`.',
            '‏`shared/ui/field/` — label עוטף; פקד מוקרן פנימה; error/hint inputs; ember focus ו-transition קצר.',
            '‏`shared/ui/dialog/` — `<dialog>` מקורי עם focus trap, Escape ו-backdrop חינם; `model()` two-way; elevation ו-entry motion.',
            '‏`shared/ui/toast/` — store קטן עם `asReadonly`; self-dismiss לאחר 4 שניות; `aria-live="polite"`; shadow ו-spring motion.',
            '‏`project-card`, ‏`project-list`, ‏`app` — כולם עברו רפקטורינג לצרוך את הערכה, כולל hover lift בכרטיס.',
          ],
        },
        {
          kind: 'p',
          text:
            'להרצה: ‏`pnpm start` בתוך `client/`. ' +
            'לחצו "New project", הקלידו שם ולחצו "Create" — אמור להופיע toast ירוק וכרטיס חדש. ' +
            'נסו לשלוח טופס ריק — toast אדום. ' +
            'פתחו את ה-dialog ולחצו Escape — ה-dialog נסגר והסמן חוזר לכפתור.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'לאן ממשיכים',
          body:
            'פרק 10 "ניתוב" יוסיף lazy loading, guards ו-resolvers, ה-URL כ-state, ו-route input binding. ' +
            '‏`onOpen(projectId)` שעדיין מדפיס ל-console יהפוך לניווט אמיתי לדף ה-board של הפרויקט.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch09',
        title: 'עץ הקוד אחרי פרק 09 — הקליינט קיבל שפה',
      },
    },
  ],

  quiz: [
    {
      q: 'למה `TfButton` משתמש ב-selector של attribute (`button[tf-button]`) ולא ב-selector של element (`tf-button`)?',
      options: [
        'כי attribute selector מהיר יותר ל-Angular לפרסר',
        'כי selector של element יוצר custom element שלדפדפן אין סמנטיקה עבורו — keyboard, focus ו-screen reader דורשים קוד נוסף; attribute selector שומר `<button>` אמיתי ומקבל הכול חינם מהפלטפורמה',
        'כי Angular v22 לא תומך ב-selector של element לרכיבי UI',
        'כי attribute selector מאפשר לכתוב `variant` ישירות על ה-HTML element',
      ],
      answer: 1,
      explain:
        '`<button>` HTML הוא semantic element: הדפדפן כבר יודע שזה interactive, focusable, ו-keyboard-accessible. ' +
        'Attribute selector מוסיף ל-`<button>` קיים זהות ויזואלית בלי להמיר אותו ל-custom element לא-semantic.',
    },
    {
      q: 'מה מקבלים חינם כשמשתמשים ב-`<dialog>` המקורי לעומת `<div>` מסוגנן?',
      options: [
        'צבעים אוטומטיים ו-z-index גבוה',
        'focus trap (Tab לא יוצא), סגירה עם Escape, `::backdrop` pseudo-element, ו-`showModal()` שמכניס ל-top layer',
        'screen reader announcements אוטומטיות וכפתור Close',
        'animation בפתיחה וסגירה',
      ],
      answer: 1,
      explain:
        '`<dialog>.showModal()` מכניס את ה-dialog ל-top layer של הדפדפן, מפעיל focus trap אוטומטי, ' +
        'מאפשר סגירה עם Escape (אירוע `close`), ומאפשר סגנון ה-backdrop דרך `::backdrop`. ' +
        'עם `<div>` כל אלה דורשים מימוש ידני.',
    },
    {
      q: 'מה ההבדל בין `model()` ל-זוג `input()` + `output()` ב-Angular?',
      options: [
        'אין הבדל — `model()` הוא רק סוכר סינטקטי שמייצר `input()` ו-`output()` נפרדים',
        '`model()` יוצר signal שהרכיב יכול לקרוא ולכתוב; ה-`output` מופעל אוטומטית; ההורה יכול להשתמש ב-`[(name)]` לשמירת state דו-כיווני — `input()` הוא one-way בלבד',
        '`model()` מיועד רק לרכיבי טופס ו-`input()` לשאר',
        '`model()` לא יכול לקבל ברירת מחדל',
      ],
      answer: 1,
      explain:
        '`model()` מגדיר WritableSignal שהרכיב יכול לקרוא ב-template ולכתוב ישירות (‏`open.set(false)`). ' +
        'Angular מייצר אוטומטית `openChange` output שיורה בכל `set`. ' +
        'ההורה יכול לכתוב `[(open)]="sig"` לsync דו-כיווני. ' +
        'עם `input()` + `output()` הרכיב לא יכול לכתוב ישירות לערך.',
    },
    {
      q: 'למה state של toasts גר ב-`ToastService` ולא ב-component input chain?',
      options: [
        'כי `ToastService` הוא singleton ולכן גדול יותר ב-bundle',
        'כי toast הוא cross-cutting concern — כל feature באפליקציה צריך יכולת להוציא הודעה; הזרקת שירות ישירה עדיפה על העברת event דרך כל שרשרת הרכיבים עד ל-root',
        'כי Angular אינו תומך ב-output chains ארוכות',
        'כי services מהירים יותר מ-signals',
      ],
      answer: 1,
      explain:
        'Toast notifications נחוצות בכל feature: שמירת פרויקט, מחיקת issue, שגיאת network. ' +
        'אם ה-state היה ב-component, כל feature היה מאלץ להעביר event דרך כל ה-component tree. ' +
        'שירות `providedIn: \'root\'` — כל מי שרוצה מזריק ומשתמש.',
    },
    {
      q: 'מה עושה `aria-live="polite"` על ה-toast container?',
      options: [
        'מסתיר את ה-toast container ממשתמשים שמשתמשים בעכבר',
        'מסמן לקוראי מסך שהאזור הזה מתעדכן דינמית, וכשתוכן חדש מופיע יש להקריא אותו לאחר סיום הפעולה הנוכחית — בלי לקטוע',
        'מוסיף animation לאפקט הכניסה של ה-toast',
        'מגביל את כמות ה-toasts ל-polite=3',
      ],
      answer: 1,
      explain:
        '`aria-live="polite"` אומר ל-assistive technology: "כשתוכן ב-region הזה משתנה, המתן עד שהמשתמש יסיים מה שהוא עושה, ואז קרא את השינוי." ' +
        'ללא `aria-live`, משתמש עיוור לא יידע ש-toast הופיע.',
    },
    {
      q: 'מתי עדיף content projection על פני input של מחרוזת להזרקת תוכן לרכיב?',
      options: [
        'תמיד — projection מהיר יותר מ-input',
        'כשהתוכן הוא HTML עשיר: תמונות, אייקונים, רכיבים מקוננים, או כפתורים — כי input מחרוזת לא יכול לקבל HTML; projection מאפשר להזריק כל מה שצריך',
        'רק כשיש יותר משני slots',
        'כשהרכיב הוא dumb ולא smart',
      ],
      answer: 1,
      explain:
        'Input מחרוזת מספיק לטקסט פשוט. ' +
        'כשרוצים להכניס לרכיב אייקון, כפתור פעולה, או מבנה HTML שלם — projection הוא הכלי. ' +
        'ב-`tf-field`, הפקד מוקרן פנימה בגלל שצריך לתמוך ב-input, select, ו-textarea — ' +
        'אי-אפשר להעביר אלמנט DOM כ-string input.',
    },
  ],

  proveIt: [
    {
      title: 'יצירת פרויקט מקצה לקצה: toast ירוק + כרטיס חדש',
      body:
        'הריצו `pnpm start` בתוך `client/`, פתחו `http://localhost:4500`. ' +
        'לחצו "New project", הקלידו שם (למשל "Test Project"), לחצו "Create".',
      command: 'cd client && pnpm start',
      expect:
        'ה-dialog נסגר, מופיע toast ירוק עם הטקסט המדויק ‏`Project "Test Project" created`, ' +
        'וכרטיס חדש נוסף לרשימה.',
    },
    {
      title: 'שם ריק: toast אדום',
      body:
        'פתחו את ה-dialog מחדש, השאירו את השדה ריק, לחצו "Create".',
      expect:
        'מופיע toast אדום (danger) עם "Project name is required". ' +
        'ה-dialog נשאר פתוח, ולא נוסף כרטיס.',
    },
    {
      title: 'Escape סוגר ומסנכרן',
      body:
        'פתחו את ה-dialog. לחצו Escape.',
      expect:
        'ה-dialog נסגר. לחצו "New project" שוב — הדיאלוג נפתח מחדש (signal חזר ל-true), ' +
        'מה שמוכיח ש-`onNativeClose()` סנכרן את ה-model signal ל-false.',
    },
    {
      title: 'dismiss לפני 4 שניות',
      body:
        'צרו פרויקט — toast ירוק מופיע. לחצו עליו מיד.',
      expect: 'ה-toast נסגר מיד בלחיצה, לפני שהטיימר של 4 שניות פג.',
    },
    {
      title: 'pnpm test + pnpm build ירוקים',
      body:
        'הריצו טסטים ו-build מלא.',
      command: 'cd client && pnpm test && pnpm build',
      expect: 'vitest מדווח passed ללא failed; build מסתיים ב-0 errors.',
    },
  ],

  exercise: {
    prompt:
      'הוסיפו `closeLabel = input(\'Close\')` + footer slot ל-`tf-dialog`, ' +
      'ועשו בו שימוש לאישור מחיקת פרויקט מחובר ל-`store.removeProject()` חדש. ' +
      'המטרה: לתרגל הרחבה של רכיב ערכה + שינוי ה-store.',
    tasks: [
      'הוסיפו ל-`TfDialog` input: ‏`readonly closeLabel = input(\'Close\')` ו-`<ng-content select="[dialog-footer]" />` מתחת ל-`tf-dialog-body`.',
      'הוסיפו ל-`ProjectsStore` מתודה `removeProject(id: number)` שמסירה פרויקט לפי id מה-signal.',
      'הוסיפו כפתור "מחק" לכל `tf-project-card` (output `remove = output<number>()` וב-`project-list` השתמשו ב-`removeProject`).',
      'פתחו dialog אישור עם `closeLabel="Cancel"` וב-footer slot הכניסו כפתור danger "Delete" שמפעיל את `removeProject` ומציג toast success.',
      'הריצו `pnpm test` ו-`pnpm build` ווודאו שהכל עובר.',
    ],
    acceptance: [
      'לחיצה על "מחק" פותחת dialog; לחיצה על "Delete" מוחקת את הפרויקט מהרשימה ומוציאה toast.',
      'לחיצה על "Cancel" (הכפתור שמשתמש ב-`closeLabel`) סוגרת את ה-dialog בלי מחיקה.',
      'כל הטסטים הקיימים (5+) ממשיכים לעבור.',
      'Build מסתיים ללא שגיאות.',
    ],
  },
};
