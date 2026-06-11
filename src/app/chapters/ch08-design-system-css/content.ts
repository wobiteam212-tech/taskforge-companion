import { ChapterContent } from '../../core/registry/chapter.types';

/**
 * Chapter 08 — מערכת עיצוב ו-CSS מודרני.
 * design tokens, @layer, logical properties ו-RTL, clamp fluid type,
 * container queries, color-mix, וארכיטקטורת dark/light — הזהות של TaskForge.
 */
export const CH08_CONTENT: ChapterContent = {
  steps: [
    /* ------------------------------------------------------------ 8.1 */
    {
      id: '8.1',
      title: 'עיצוב הוא ארכיטקטורה, לא קישוט',
      blocks: [
        {
          kind: 'p',
          text:
            'בפרק 07 הכרטיסים קיבלו מבנה. עכשיו הם מקבלים זהות. ' +
            'אבל מערכת עיצוב היא לא "עוד CSS" — היא ארכיטקטורה ב-CSS. ' +
            'במקום לכתוב `color: #ff8a3d` בעשרה מקומות שונים, ' +
            'מגדירים `--ember: #ff8a3d` פעם אחת ומשתמשים בו בכל מקום.',
        },
        {
          kind: 'ul',
          items: [
            '‏design token — השם המוסכם שמחבר בין ה-"למה" (ember = גחלת, האנרגיה של TaskForge) ל-"מה" (ערך hex).',
            '‏`@layer` — הכרזת סדר ה-cascade עוד לפני שכותבים שורת CSS אחת.',
            'ערכת נושא (theme) — שני מצבים של אותם שמות, ערכים שונים. החלפת נושא = שינוי ערכים בלבד.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'כש-ember עובר ל-ember-2026 בעוד שנה, משנים מקום אחד ב-`_tokens.scss`. ' +
            'כל הרכיבים — כרטיסים, כפתורים, תגיות — מתעדכנים אוטומטית. ' +
            'בלי מערכת עיצוב, זה עשרה חיפושים-ועדכונים ועוד שלוש תקלות רגרסיה.',
        },
        {
          kind: 'term',
          name: 'design token',
          definition:
            'שם מוסכם לערך עיצובי — צבע, ריווח, רדיוס פינות. ' +
            'מיושם כ-CSS custom property (`--ember: #ff8a3d`) כדי שניתן לשנות ערכו בזמן ריצה. ' +
            'מקור האמת היחיד: שינוי הטוקן מתפשט לכל הרכיבים שמשתמשים בו.',
        },
      ],
      panel: {
        kind: 'diagram',
        caption: 'tokens מזינים את השכבות, הרכיבים, ומתג הנושא — מקור אמת אחד לכל האפליקציה.',
        mermaid: `flowchart TD
  T["_tokens.scss\ndesign tokens"]
  L["@layer tokens\nCSS custom props"]
  B["@layer base\nאלמנטים גולמיים"]
  C["@layer components\nרכיבים"]
  TH["ThemeService\ndata-theme attribute"]
  T --> L
  L --> B
  L --> C
  TH --> L`,
      },
    },

    /* ------------------------------------------------------------ 8.2 */
    {
      id: '8.2',
      title: 'שכבות לפני הכול: @layer',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`@layer` היא דרך להכריז על סדר ה-cascade לפני שמגדירים אפילו סלקטור אחד. ' +
            'שכבה מאוחרת ברשימה גוברת על שכבה מוקדמת — לא משנה כמה הסלקטור הראשון ספציפי. ' +
            'זה הופך את קבצי ה-CSS מ"מי ניצח את ה-specificity wars?" ל-"מה הוגדר לבוא אחרון?".',
        },
        {
          kind: 'p',
          text:
            'הבעיה הטכנית: Sass דורש שכל ה-`@use` יבואו לפני כל חוקה אחרת בקובץ. ' +
            'לכן אי-אפשר לכתוב `@layer reset, tokens, base, components;` ב-`styles.scss` ' +
            'לפני ה-`@use` — `@use` יבוא ראשון, ואחר-כך ה-layer declaration יוצג אחרי הפלט של המודול הראשון. ' +
            'הפתרון: ההכרזה גרה בקובץ נפרד `_layers.scss` שנטען ראשון, ' +
            'כי Sass פולט כל מודול במקום ה-`@use` הראשון שלו.',
        },
        {
          kind: 'code',
          lang: 'scss',
          title: 'client/src/styles/_layers.scss',
          code: `// סדר השכבות מוכרז פעם אחת, לפני כל שאר ה-CSS — והוא מנצח כל מלחמת
// specificity: שכבה מאוחרת ברשימה גוברת, לא הסלקטור הארוך יותר.
// (הקובץ חי לבד כי Sass דורש ש-@use יבוא לפני כל חוקה אחרת —
// אז ההכרזה גרה במודול שנטען ראשון.)
@layer reset, tokens, base, components;`,
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            '‏`reset` הוא הכי חלש — כל שכבה אחרת תנצח אותו. ' +
            '‏`components` הוא הכי חזק מבין השכבות שהוגדרו. ' +
            'סטיילים של קומפוננטות Angular (ה-`scss` הנפרד של כל רכיב) חיים מחוץ לשכבות לגמרי — ' +
            'ולכן הם גוברים על `components` בלי שום מאמץ. זו ברירת המחדל הנכונה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch08',
        file: 'client/src/styles.scss',
        region: 'step-8.2',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 8.3 */
    {
      id: '8.3',
      title: 'טוקנים: צבע אחד, מקום אחד',
      blocks: [
        {
          kind: 'p',
          text:
            'הטוקנים מוגדרים כ-CSS custom properties על `:root` — ברירת המחדל היא ה-dark theme. ' +
            'ה-dark theme הוא "forge graphite": רקע `#0f1217` כמו גחלות כבות, ' +
            'עם ember `--ember: #ff8a3d` וteal `--teal: #2dd4bf` כצבעי הדגש. ' +
            'כשה-attribute ‏`[data-theme=\'light\']` נוסף ל-`<html>`, ' +
            'ה-"נייר חם" דורס את הטוקנים בגרסאות בהירות שלהם — ורק את הטוקנים.',
        },
        {
          kind: 'ul',
          items: [
            '‏`--bg`, `--sur`, `--sur2` — שלוש רמות של שטח: רקע, משטח, משטח מוגבה.',
            '‏`--txt1`, `--txt2`, `--txt3` — שלוש רמות של טקסט: ראשי, משני, רמז.',
            '‏`--rad`, `--rad-sm` — רדיוסי פינות עקביים; `--sp-1` עד `--sp-5` — סולם ריווח.',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'למה design tokens הם custom properties ולא משתני SCSS?',
          body:
            'משתני SCSS מוחלפים בזמן קומפילציה — הם נעלמים מה-CSS הסופי. ' +
            'לכן לא ניתן לשנות `$ember` בזמן ריצה כשהמשתמש לוחץ "Dark mode". ' +
            'CSS custom property (`--ember`) הוא חי בדפדפן: ' +
            'כשמוסיפים `[data-theme=\'light\'] { --ember: #e06616 }`, ' +
            'הדפדפן מחשב מחדש את כל המקומות שמשתמשים ב-`var(--ember)` — בלי JavaScript ובלי קומפילציה מחדש.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch08',
        file: 'client/src/styles/_tokens.scss',
        region: 'step-8.3',
      },
    },

    /* ------------------------------------------------------------ 8.4 */
    {
      id: '8.4',
      title: 'reset ו-base: השכבות השקטות',
      blocks: [
        {
          kind: 'p',
          text:
            'ה-reset הוא המינימום: `box-sizing: border-box`, ' +
            '`margin: 0` לכל הכוכבית, ו-`font: inherit` לאלמנטים שהדפדפן לא מוריש להם. ' +
            'הוא חי ב-`@layer reset` — השכבה הכי חלשה — כדי שלא יבטל עיצוב מכוון.',
        },
        {
          kind: 'code',
          lang: 'scss',
          title: 'client/src/styles/_reset.scss',
          code: `// reset מודרני וקטן — רק מה שצריך, בשכבה הכי חלשה.

@layer reset {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  * {
    margin: 0;
  }

  html {
    -webkit-text-size-adjust: 100%;
  }

  body {
    min-height: 100dvh;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }

  img,
  svg {
    display: block;
    max-inline-size: 100%;
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
    color: inherit;
  }
}`,
        },
        {
          kind: 'p',
          text:
            'שכבת ה-`base` מחברת בין הטוקנים לאלמנטים הגולמיים. ' +
            '‏`body` מקבל `background: var(--bg)` ו-`color: var(--txt1)`. ' +
            'כל הריווחים הם logical properties: `margin-block-end`, `padding-block`, `padding-inline` — ' +
            'ולא `margin-bottom` או `padding-left`. הסיבה מגיעה בצעד 8.6.',
        },
        {
          kind: 'term',
          name: 'cascade layer',
          definition:
            '‏`@layer` מאפשר להכריז על סדר עדיפויות ב-cascade לפני שכותבים CSS. ' +
            'שכבה שהוגדרה אחרונה ברשימת ה-`@layer` ניצחת ספציפיות גבוהה בשכבה קודמת. ' +
            'מפשט את ניהול ה-CSS בפרויקטים גדולים: reset, base, components — בסדר קבוע.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch08',
        file: 'client/src/styles/_base.scss',
      },
    },

    /* ------------------------------------------------------------ 8.5 */
    {
      id: '8.5',
      title: 'טיפוגרפיה נוזלית עם clamp',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`clamp(min, preferred, max)` מגדיר גודל גופן שמשתנה בצורה רציפה עם רוחב ה-viewport, ' +
            'בלי נקודות שבירה, בלי `@media`. ' +
            'ה-preferred הוא משוואה שמשתמשת ב-`vw` (אחוז מרוחב החלון), ' +
            'ומוגבל בין min ל-max. ' +
            'כשהחלון צר מאוד — `--fs-body` נעצר ב-`14px`; כשהוא רחב — ב-`16px`.',
        },
        {
          kind: 'ul',
          items: [
            '‏`--fs-body: clamp(14px, 13.2px + 0.25vw, 16px)` — גוף הטקסט: בין 14px ל-16px, עולה לאט.',
            '‏`--fs-h1: clamp(20px, 17px + 1vw, 28px)` — כותרת ראשית: מגיב חזק יותר לשינוי רוחב.',
            '‏`--fs-h2: clamp(17px, 15.5px + 0.5vw, 21px)` — כותרת משנית: שיפוע בינוני.',
            '‏`--fs-small: clamp(12px, 11.5px + 0.15vw, 13px)` — תגיות קטנות: שיפוע עדין מאוד.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'לפני `clamp`, כתבנו `font-size: 14px` בברירת מחדל ו-`font-size: 16px` בתוך `@media (min-width: 768px)`. ' +
            'עם `clamp`, יש ערך אחד שפועל תמיד. ' +
            'הגדרת הטיפוגרפיה כ-custom property אומרת שכל שינוי בטוקן מתפשט לכל הרכיבים שמשתמשים בו.',
        },
        {
          kind: 'term',
          name: 'fluid typography',
          definition:
            'גודל גופן שמשתנה ברציפות עם רוחב ה-viewport באמצעות `clamp(min, preferred, max)`. ' +
            'לא קופץ בנקודות שבירה — מגיב בצורה הדרגתית. ' +
            'כש-preferred כולל `vw`, כל שינוי ברוחב החלון משפיע על גודל הגופן.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch08',
        file: 'client/src/styles/_tokens.scss',
        region: 'step-8.5',
      },
    },

    /* ------------------------------------------------------------ 8.6 */
    {
      id: '8.6',
      title: 'logical properties: ימין ושמאל הם לא עובדה',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`margin-left` מניח שהטקסט זורם שמאלה. ' +
            'אבל ב-Hebrew ו-Arabic הטקסט זורם ימינה (`dir="rtl"`). ' +
            'כשכותבים `padding-inline-start`, הדפדפן מחשב את הצד הנכון לפי כיוון הטקסט: ' +
            'ב-LTR זה שמאל, ב-RTL זה ימין.',
        },
        {
          kind: 'p',
          text:
            'המדריך שאתם קוראים עכשיו הוא בעצמו RTL — ה-UI של הגייד כתוב עם logical properties ' +
            'כדי שיתנהג נכון בעברית. ' +
            'ה-TaskForge עצמו הוא LTR (ממשק באנגלית), אבל כתוב direction-agnostic מהיום הראשון: ' +
            'אם בעתיד מוסיפים לוקליזציה לעברית, ה-CSS לא יצטרך נגיעה.',
        },
        {
          kind: 'ul',
          items: [
            '‏`padding-inline` — קיצור לשני קצוות ציר הטקסט: `padding-inline-start` ו-`padding-inline-end`.',
            '‏`padding-block` — אותו רעיון על הציר האנכי (ב-writing mode רגיל): top ו-bottom.',
            '‏`margin-inline-start` = `margin-left` ב-LTR, `margin-right` ב-RTL — אותה שורת CSS, שני כיוונים.',
            '‏`max-inline-size` = `max-width` ב-writing mode אופקי; ב-writing mode אנכי הוא היה הופך לגובה.',
            '‏`border-block-end` = `border-bottom` (קו הגבול שבסוף ה-block direction).',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מה ההבדל בין margin-left ל-margin-inline-start, ומתי זה משנה?',
          body:
            '‏`margin-left` הוא physical property — תמיד שמאל, לא משנה כיוון הטקסט. ' +
            '‏`margin-inline-start` הוא logical property — "תחילת ה-inline direction": ' +
            'שמאל ב-LTR, ימין ב-RTL. ' +
            'זה משנה כשמוסיפים תמיכה בשפות RTL כמו עברית או ערבית: ' +
            'עם logical properties, אין צורך ל-override CSS בנפרד עבור כל שפה.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch08',
        file: 'client/src/app/app.scss',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 8.7 */
    {
      id: '8.7',
      title: 'השלד לובש את המערכת',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`app.html` מקבל עטיפת מותג ב-header: `.brand` שמחזיק את h1 והתגית, ' +
            'ולצדו כפתור `theme-toggle` שמפעיל `themeSvc.toggle()`. ' +
            'שימו לב לתחילית `attr.`: ‏binding רגיל כמו `[ariaPressed]` מכוון ל-property של האלמנט, ' +
            'ו-aria-pressed הוא attribute, לא property אמין בכל הדפדפנים. ' +
            '‏`[attr.aria-pressed]` כותב את ה-attribute עצמו ל-DOM — מה שקוראי מסך באמת קוראים.',
        },
        {
          kind: 'code',
          lang: 'html',
          title: 'client/src/app/app.html',
          code: `<header class="app-header">
  <div class="brand">
    <h1>{{ title() }}</h1>
    <p class="tagline">{{ tagline() }}</p>
  </div>

  <button
    type="button"
    class="theme-toggle"
    (click)="themeSvc.toggle()"
    [attr.aria-pressed]="themeSvc.theme() === 'light'"
  >
    {{ themeSvc.theme() === 'dark' ? 'Light' : 'Dark' }} mode
  </button>
</header>

<main class="app-main">
  <tf-project-list />
  <router-outlet />
</main>`,
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            '‏`[attr.aria-pressed]` מחזיר `true` כש-theme הוא `light`, ' +
            'ו-`false` כש-dark. קוראי מסך מכריזים "pressed" / "not pressed" — ' +
            'המשתמש עם screen reader יודע מה המצב הנוכחי בלי להסתכל על הכפתור.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch08',
        file: 'client/src/app/app.ts',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 8.8 */
    {
      id: '8.8',
      title: 'ThemeService: signal פנימה, effect החוצה',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`ThemeService` הוא signal store קטן לנושא. ' +
            'ה-signal `theme` מחזיק `\'dark\' | \'light\'`; ' +
            'ה-effect הוא גשר לעולם החיצוני: ' +
            'הוא כותב `document.documentElement.dataset[\'theme\']` ומעדכן `localStorage`. ' +
            'זה שימוש לגיטימי ב-`effect` — פרק 06 לימד שסנכרון עם העולם החיצוני הוא בדיוק מה שהוא מיועד לו.',
        },
        {
          kind: 'ul',
          items: [
            '‏`initialTheme()` בודק קודם כל `localStorage.getItem(\'taskforge-theme\')` — ה-override הנשמר.',
            'אם אין ערך שמור, קוראים `globalThis.matchMedia?.(\'(prefers-color-scheme: light)\')`. ' +
              'ה-`?.` הוא optional call — בכוונה: בסביבת jsdom (tests) ‏`matchMedia` לא קיים, ובלי `?.` הטסטים נופלים.',
            '‏`toggle()` הוא `theme.update((t) => t === \'dark\' ? \'light\' : \'dark\')` — ' +
              'שינוי state דרך מתודה, לא כתיבה ישירה מבחוץ.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'הפרדת ה-signal מה-DOM effect היא הפרדת concerns: ' +
            'ה-signal הוא ה-truth של מה הנושא — הוא יכול להישאל (`themeSvc.theme()`) בלי side effects. ' +
            'ה-effect הוא ה-propagation החוצה — הוא יודע להפסיק ולהתחיל מחדש אוטומטית עם Angular. ' +
            'סנכרון DOM הוא בדיוק הדוגמה שהדוקומנטציה הרשמית של Angular נותנת ל-effect לגיטימי.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch08',
        file: 'client/src/app/core/state/theme.ts',
        region: 'step-8.8',
      },
    },

    /* ------------------------------------------------------------ 8.9 */
    {
      id: '8.9',
      title: 'רשת שנושמת',
      blocks: [
        {
          kind: 'p',
          text:
            'הרשת של הפרויקטים לא מגדירה מספר עמודות קבוע — ' +
            'היא מגדירה כמה עמודות שנכנסות בלי שאף אחת תהיה צרה מ-280px: ' +
            '`repeat(auto-fill, minmax(min(100%, 280px), 1fr))`. ' +
            'ב-viewport רחב — שלוש עמודות; בינוני — שתיים; צר — אחת. ' +
            'אין `@media`, אין breakpoints.',
        },
        {
          kind: 'ul',
          items: [
            '‏`auto-fill`: ממלא עמודות כל עוד הן נכנסות, גם אם ריקות — מכבד את ה-minmax.',
            '‏`auto-fit`: עמודות ריקות מתכווצות ל-0 — האיטמים הקיימים מתפשטים למלא את כל הרוחב.',
            '‏`min(100%, 280px)`: אם הכרטיס בתוך container צר מ-280px (sidebar), ' +
              'המינימום הופך ל-100% — אין overflow אופקי.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'עם `minmax(280px, 1fr)` בלי `min()`, ב-container צר מ-280px יש overflow: ' +
            'הרשת מנסה לשים עמודה של 280px ואין מקום. ' +
            'עם `min(100%, 280px)`, הגבול התחתון נסוג מול המציאות — הרשת לא פורצת.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch08',
        file: 'client/src/app/features/projects/project-list.scss',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 8.10 */
    {
      id: '8.10',
      title: 'הכרטיס מקשיב לעצמו: container queries',
      blocks: [
        {
          kind: 'p',
          text:
            '‏`container-type: inline-size` על `:host` הופך את הכרטיס לנקודת ייחוס: ' +
            'עכשיו `@container (min-width: 340px)` מגיב לרוחב הכרטיס עצמו, לא לרוחב ה-viewport. ' +
            'כשהכרטיס רחב מ-340px, כפתור "Open board" עובר לצד הטקסט (עמודה שנייה); ' +
            'כשהוא צר יותר — הכפתור יורד לשורה שמתחת.',
        },
        {
          kind: 'ul',
          items: [
            'אותו רכיב יכול לחיות ב-sidebar צר (כפתור מתחת) וברשת רחבה (כפתור בצד) — ללא props של פריסה.',
            'הרכיב לא יודע איפה הוא ממוקם; הוא מגיב לרוחב שניתן לו — ה-layout מחליט.',
            'ה-`grid-template-columns: 1fr auto` ב-`@container` מגדיר עמודת תוכן ועמודת כפתור צמד.',
          ],
        },
        {
          kind: 'callout',
          tone: 'interview',
          title: 'מתי container query עדיף על media query?',
          body:
            '‏media query מגיב לרוחב ה-viewport — הוא שואל "כמה גדול החלון?". ' +
            '‏container query מגיב לרוחב ה-container — הוא שואל "כמה מקום נתנו לי?". ' +
            'container query עדיף כשרכיב יכול לחיות בהקשרים שונים: sidebar צר, grid רחב, modal. ' +
            'ב-media query תצטרכו breakpoint אחר לכל הקשר; ' +
            'ב-container query הרכיב מסתדר לבד עם כל container שיכניסו אותו אליו.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch08',
        file: 'client/src/app/features/projects/project-card.scss',
        region: 'step-8.10',
        diff: true,
      },
    },

    /* ------------------------------------------------------------ 8.11 */
    {
      id: '8.11',
      title: 'המגרש: גררו את הקונטיינר',
      blocks: [
        {
          kind: 'p',
          text:
            'הדמו החי מציג כרטיס פרויקט פיקטיבי ("Website Redesign") בתוך container שרוחבו בשליטתכם. ' +
            'Slider מאפשר לשנות את רוחב ה-container בין 240px ל-680px — ' +
            'ה-viewport עצמו לא משתנה.',
        },
        {
          kind: 'ul',
          items: [
            'מתחת ל-340px: כפתור "Open board" נמצא מתחת לטקסט — פריסה צרה.',
            'מ-340px ומעלה: ‏`@container (min-width: 340px)` מופעל — הכפתור עובר לצד ימין של הכרטיס.',
            'תגית המצב ("@container פעיל" / "מתחת לסף") מציגה את הסף הנוכחי.',
          ],
        },
        {
          kind: 'callout',
          tone: 'tip',
          body:
            'בדקו ב-DevTools: פתחו Elements, בחרו את `.cq-box`, שנו את `width` ב-computed styles. ' +
            'תראו את ה-CSS של הכרטיס משתנה בזמן אמת — ‏`@container` מופיע ב-Styles panel כשהסף חוצים.',
        },
      ],
      panel: {
        kind: 'live-demo',
        load: () => import('./demos/cq.demo').then((m) => m.CqDemo),
        caption: 'דמו חי: גררו את ה-slider לשינוי רוחב ה-container. הכרטיס מגיב לרוחב שלו — לא לרוחב החלון.',
      },
    },

    /* ------------------------------------------------------------ 8.12 */
    {
      id: '8.12',
      title: 'צבעים נגזרים: color-mix',
      blocks: [
        {
          kind: 'p',
          text:
            'תגית ה-open issues בכרטיס משתמשת ב-`color-mix` לצבע הרקע שלה: ' +
            '`color-mix(in srgb, var(--ember) 16%, transparent)`. ' +
            'במקום להמציא ערך hex חדש, הצבע נגזר מ-`--ember` עצמו — ' +
            'כשהנושא מתחלף ו-`--ember` מקבל ערך חדש, ' +
            'הרקע של התגית מתעדכן אוטומטית, בלי שום שינוי קוד נוסף.',
        },
        {
          kind: 'ul',
          items: [
            'רקע התגית: `color-mix(in srgb, var(--ember) 16%, transparent)` — ember שקוף ב-84%.',
            'טקסט התגית: `var(--ember)` מלא — קריא על הרקע הכהה שלו.',
            'כשעוברים ל-light theme, `--ember` הופך ל-`#e06616` — שניהם מתעדכנים אוטומטית.',
            'ה-hover border של הכרטיס: `color-mix(in srgb, var(--ember) 55%, var(--bdr))` — ממזג ember ו-border.',
          ],
        },
        {
          kind: 'callout',
          tone: 'why',
          body:
            'בלי `color-mix`, הייתם צריכים להגדיר `--ember-subtle` עם ערך hex ספציפי לכל נושא. ' +
            'עם `color-mix`, הצבע נגזר — כל נושא חדש (כולל ה-high-contrast שתוסיפו בתרגיל) ' +
            'מקבל גרסה נכונה של כל הצבעים הנגזרים בחינם.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch08',
        file: 'client/src/app/features/projects/project-card.scss',
      },
    },

    /* ------------------------------------------------------------ 8.13 */
    {
      id: '8.13',
      title: 'dark ו-light הם אותו CSS',
      blocks: [
        {
          kind: 'p',
          text:
            'הארכיטקטורה של ה-theme switching עובדת כך: ' +
            '`:root` מגדיר את dark כברירת מחדל. ' +
            '‏`[data-theme=\'light\']` דורס את הטוקנים. ' +
            'ה-`ThemeService` מוסיף ומסיר את ה-attribute. ' +
            'הדפדפן עושה את שאר העבודה — כל `var(--bg)` בכל רכיב מתעדכן אוטומטית.',
        },
        {
          kind: 'ul',
          items: [
            'הביקור הראשון: `initialTheme()` שואל את ה-OS (`prefers-color-scheme`) — אם light, מתחיל ב-light.',
            'אחרי לחיצה ראשונה: `localStorage.setItem(\'taskforge-theme\', theme)` שומר את הבחירה.',
            'ריפרש: `localStorage.getItem(\'taskforge-theme\')` מנצח את ה-OS — הבחירה של המשתמש מכובדת.',
            'שינוי ב-OS settings: לא ישפיע עוד — רק לאחר מחיקה ידנית של `localStorage`.',
          ],
        },
        {
          kind: 'callout',
          tone: 'gotcha',
          body:
            'toggle שמחליף class כמו `.dark-mode` ב-body, בזמן שצבעים hardcoded כמו `background: #0f1217` ' +
            'פזורים ברכיבים — לא יעבוד. כשמוסיפים נושא חדש, כל הצבעים ה-hardcoded נשארים. ' +
            'הגישה הנכונה: כל ערך צבעוני הוא `var(--token)`. ' +
            'רק הטוקנים ב-`_tokens.scss` משתנים בין נושאים — שאר ה-CSS לא יודע שיש נושאים.',
        },
      ],
      panel: {
        kind: 'code',
        chapter: 'ch08',
        file: 'client/src/styles/_tokens.scss',
      },
    },

    /* ------------------------------------------------------------ 8.14 */
    {
      id: '8.14',
      title: 'הקליינט קיבל זהות',
      blocks: [
        {
          kind: 'p',
          text: 'בסוף פרק 08 הקליינט כבר לא רק עובד — הוא נראה כמו מוצר. הנה מה שנבנה:',
        },
        {
          kind: 'ul',
          items: [
            '‏`_layers.scss` — הכרזת סדר `@layer` שמנצחת specificity wars לנצח.',
            '‏`_tokens.scss` — design tokens: 3 רמות רקע, 3 רמות טקסט, ember + teal + danger, ריווח, clamp type.',
            '‏`_reset.scss` + `_base.scss` — שכבות שקטות שמחברות טוקנים לאלמנטים.',
            '‏`ThemeService` — signal + effect, dark ברירת מחדל, OS-aware, localStorage-persistent.',
            '‏`app.html` + `app.ts` — כפתור theme toggle עם `aria-pressed`.',
            '‏`app.scss` — רק logical properties; אפס `left` / `right` hardcoded.',
            '‏`project-list.scss` — responsive grid ללא breakpoints: `auto-fill minmax(min(100%, 280px), 1fr)`.',
            '‏`project-card.scss` — container query שמגיב לרוחב הכרטיס; `color-mix` לצבעים נגזרים.',
          ],
        },
        {
          kind: 'p',
          text:
            'כדי לראות: הריצו `pnpm start` בתוך `client/` (port 4500). ' +
            'לחצו "Light mode" — ה-"נייר חם" מתחלף מיידית. ' +
            'רפרשו — הבחירה נשמרת. ' +
            'שנו את גודל החלון ובחנו את הרשת. ' +
            'ב-DevTools, צמצמו `tf-project-card` מתחת ל-340px וצפו ב-`@container` בפעולה.',
        },
        {
          kind: 'callout',
          tone: 'why',
          title: 'לאן ממשיכים',
          body:
            'פרק 09 "ערכת UI משותפת" בונה את שכבת ה-`shared/`: ' +
            'button, field, badge, dialog ו-toast כרכיבים טיפשים מבוססי signals, עם projection ונגישות מובנית. ' +
            'הטוקנים שהגדרנו היום הם הבסיס שעליו כל הרכיבים האלה יעבדו.',
        },
      ],
      panel: {
        kind: 'app-tree',
        chapter: 'ch08',
        title: 'עץ הקוד אחרי פרק 08 — הקליינט קיבל זהות',
      },
    },
  ],

  quiz: [
    {
      q: 'מוגדר `@layer reset, tokens, base, components;`. סלקטור ארוך וספציפי `button#main.primary` יושב ב-`@layer reset`, וסלקטור קצרצר `button` יושב ב-`@layer components`. מי קובע את הרקע?',
      options: [
        'ה-`button#main.primary` — specificity גבוהה תמיד מנצחת',
        'ה-`button` שב-`@layer components` — בין שכבות, סדר ההכרזה קובע, וה-specificity מפסיקה להשתתף במשחק',
        'הם שווים — מנצח מי שמופיע אחרון בקובץ',
        'תלוי בסדר ה-`@use` ב-`styles.scss`',
      ],
      answer: 1,
      explain:
        'בין שכבות, רק סדר ההכרזה ב-`@layer reset, tokens, base, components` קובע (להצהרות רגילות): ' +
        'שכבה מאוחרת גוברת, וה-specificity משווים רק בתוך אותה שכבה. ' +
        'עובדת בונוס לראיון: `!important` מתנהג הפוך — הצהרה important גוברת על רגילות בכל השכבות, ' +
        'ובין הצהרות important, דווקא השכבה ה-מוקדמת ברשימה מנצחת. עוד סיבה לא להזדקק לו.',
    },
    {
      q: 'מה היתרון של CSS custom property (`--ember: #ff8a3d`) על פני Sass variable (`$ember: #ff8a3d`) לצרכי design tokens?',
      options: [
        'CSS custom property מהיר יותר לפרסר',
        'CSS custom property שורד את הקומפילציה וניתן לשינוי בזמן ריצה — כשמחליפים נושא ב-JavaScript, כל `var(--ember)` מתעדכן אוטומטית. Sass variable מוחלף בקומפילציה ואינו קיים ב-CSS הסופי',
        'Sass variable לא תומך בצבעים',
        'CSS custom property פועל רק עם `@layer`',
      ],
      answer: 1,
      explain:
        'Sass variable (`$ember`) הוא תחביר compile-time: לאחר קומפילציה, `$ember` הופך ל-`#ff8a3d` ונעלם. ' +
        'אין דרך לשנותו בזמן ריצה. ' +
        'CSS custom property (`--ember`) קיים ב-DOM ונגיש ל-JS ו-CSS. ' +
        'כשמוסיפים `[data-theme=\'light\'] { --ember: #e06616 }`, הדפדפן מחשב מחדש את כל ה-`var(--ember)` בזמן אמת.',
    },
    {
      q: 'מה `clamp(14px, 13.2px + 0.25vw, 16px)` מחזיר ב-viewport של 800px?',
      options: [
        'תמיד 14px — הגבול התחתון',
        'תמיד 16px — הגבול העליון',
        '`13.2px + 0.25 * 8px = 13.2 + 2 = 15.2px` — בין הגבולות, מחושב לפי ה-preferred',
        'זה שגיאת CSS — לא ניתן למזג px עם vw',
      ],
      answer: 2,
      explain:
        '‏`0.25vw` ב-viewport של 800px = `0.25 * 8px = 2px`. ' +
        'preferred = `13.2px + 2px = 15.2px`. ' +
        'min=14px, max=16px, preferred=15.2px — נמצא בין הגבולות, כך שהתוצאה היא 15.2px. ' +
        '‏`clamp` מחזיר `max(min, min(preferred, max))`.',
    },
    {
      q: 'מתי עדיף להשתמש ב-`@container` על פני `@media`?',
      options: [
        'תמיד — `@container` מהיר יותר מ-`@media`',
        'כשרכיב יכול לחיות בהקשרים שונים (sidebar צר, grid רחב) ואנחנו רוצים שיגיב לרוחב שניתן לו — לא לרוחב ה-viewport',
        'רק ברכיבים עם `display: grid`',
        'כשיש יותר מ-3 breakpoints',
      ],
      answer: 1,
      explain:
        '‏`@media` שואל "כמה גדול החלון?"; `@container` שואל "כמה מקום נתנו לי?". ' +
        'ברכיב שחי בצד אחד בסidebar ובצד שני ב-main grid, ' +
        '`@container` מאפשר לו להתאים את עצמו לפי ה-container שלו — ' +
        'ללא media breakpoints נפרדים לכל הקשר.',
    },
    {
      q: 'מה `color-mix(in srgb, var(--ember) 16%, transparent)` מחזיר כש-`--ember` הוא `#ff8a3d`?',
      options: [
        'שגיאה — לא ניתן למזג עם `transparent`',
        'צבע כתום עם opacity של 16% — גרסה שקופה מאוד של `--ember`',
        'צבע לבן בגלל שקיפות',
        'בדיוק `#ff8a3d` ב-16% opacity',
      ],
      answer: 1,
      explain:
        '‏`color-mix(in srgb, color1 16%, transparent)` ממזג 16% מ-`color1` עם 84% `transparent`. ' +
        'התוצאה היא גרסה שקופה מאוד של הצבע — ember עם opacity נמוך. ' +
        'כשה-theme מתחלף ו-`--ember` מקבל ערך אחר, הצבע המעורב מתעדכן אוטומטית.',
    },
    {
      q: 'איזה שימוש ב-`effect` הוא לגיטימי ב-Angular v22 לפי ארכיטקטורת `ThemeService`?',
      options: [
        'לקרוא signal אחד ולהגדיר ערך signal אחר (state derivation)',
        'לסנכרן עולם חיצוני — DOM attribute, localStorage, EventSource — כתגובה לשינוי signal',
        'לאחזר נתונים מה-API בכל שינוי signal',
        'לעדכן computed signal בתגובה לאירוע',
      ],
      answer: 1,
      explain:
        '‏`effect` מיועד לסנכרון עם עולם חיצוני ל-Angular: DOM attributes, localStorage, WebSocket. ' +
        'ב-`ThemeService`, ה-effect כותב `document.documentElement.dataset[\'theme\']` ו-`localStorage.setItem` — ' +
        'שניהם "מחוץ" למערכת ה-signals. ' +
        'שימוש ב-effect לגזירת state (לקרוא signal X ולכתוב signal Y) הוא anti-pattern — ' +
        'לזה יש `computed`.',
    },
  ],

  proveIt: [
    {
      title: 'מתג הנושא ו-localStorage',
      body:
        'הריצו `pnpm start` בתוך `client/`, פתחו `http://localhost:4500`. ' +
        'לחצו "Light mode" — הרקע אמור להתחלף ל-"נייר חם" בהיר. ' +
        'פתחו DevTools, Application, Local Storage, `localhost:4500`. ' +
        'ודאו שיש ערך `taskforge-theme` עם הערך `light`.',
      command: 'cd client && pnpm start',
      expect: 'מפתח `taskforge-theme` קיים ב-localStorage עם ערך `light` לאחר לחיצה.',
    },
    {
      title: 'ריפרש שומר בחירה',
      body:
        'לאחר שלחצתם "Light mode" (ו-localStorage מכיל `light`), רפרשו את הדף.',
      expect: 'הדף נטען ב-light theme — הבחירה נשמרה. לא חוזר ל-dark.',
    },
    {
      title: 'הרשת מגיבה לגודל החלון',
      body:
        'שנו את רוחב חלון הדפדפן לרוחב שונים: צר (מתחת ל-600px), בינוני, רחב.',
      expect: 'הרשת משנה מספר עמודות אוטומטית: עמודה אחת בצר, שתיים בבינוני, שלוש+ ברחב — ללא breakpoint חד-פעמי.',
    },
    {
      title: 'container query ב-DevTools',
      body:
        'ב-DevTools, בחרו אלמנט `tf-project-card` והוסיפו לו ב-Styles ‏`width: 300px`.',
      expect: 'ה-`@container (min-width: 340px)` לא מופעל — הכפתור "Open board" מתחת לטקסט. ' +
        'שנו ל-380px — הכפתור עובר לצד ימין.',
    },
    {
      title: 'pnpm test + pnpm build ירוקים',
      body: 'הריצו טסטים ו-build מלא.',
      command: 'cd client && pnpm test && pnpm build',
      expect: 'vitest: כל הטסטים עוברים. build: 0 errors, bundle בתקציב.',
    },
  ],

  exercise: {
    prompt:
      'הוסיפו `high-contrast` data-theme variant ועדכנו את `ThemeService.toggle()` לצקל בין שלושה נושאים: ' +
      '`dark`, `light`, `high-contrast`. ' +
      'ה-high-contrast דורס לפחות 3 טוקנים: `--bg` לשחור (#000), `--txt1` ללבן (#fff), `--ember` לצהוב (#ffe500). ' +
      'הבחירה נשמרת ב-localStorage.',
    tasks: [
      'ב-`_tokens.scss`, הוסיפו `[data-theme=\'high-contrast\'] { --bg: #000; --sur: #111; --sur2: #222; --txt1: #fff; --txt2: #eee; --txt3: #bbb; --ember: #ffe500; --bdr: #555; }` — ' +
        'לפחות 3 טוקנים מוגדרים.',
      'ב-`theme.ts`, שנו את `type Theme` ל-`\'dark\' | \'light\' | \'high-contrast\'`.',
      'עדכנו `toggle()` להשתמש ב-`update` עם מחזור: `dark` > `light` > `high-contrast` > `dark`.',
      'עדכנו את `initialTheme()` לקבל \'high-contrast\' כערך תקין מ-`localStorage`.',
      'הריצו `pnpm test` ו-`pnpm build` ווודאו שהכל עובר.',
    ],
    acceptance: [
      'לחיצה שלישית על כפתור ה-toggle מפעילה high-contrast: רקע שחור, טקסט לבן, ember צהוב.',
      'ריפרש שומר את הבחירה `high-contrast` — ‏`localStorage.getItem(\'taskforge-theme\')` מחזיר `\'high-contrast\'`.',
      'כל הטסטים הקיימים (3) ממשיכים לעבור.',
      'Build מסתיים ללא שגיאות.',
    ],
  },
};
