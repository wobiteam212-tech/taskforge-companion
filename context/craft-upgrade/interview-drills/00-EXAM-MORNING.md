# 00 — Exam Morning Crib (קרא 10 דק' לפני)

ארבעה משפטי-פתיחה + ארבעת ה-Q&A הקשים. אם תזכור רק את הדף הזה — אתה מכוסה. פירוט מלא: `ch27..ch30-*.md`.

---

## T1 · ארכיטקטורה — "תבנה todo app"
**משפט-פתיחה:** "דאטה זורם בטבעת: `component → store → HTTP → endpoint → repository → DB`, וחוזר כ-DTO. לכל
שכבה תפקיד אחד." **סדר דיבור:** scope→ישות אחת · **חוזה קודם** (DTO+endpoints+status codes) · שרת בשלוש
שכבות (Core seam / Infrastructure EF / Api Minimal) · קליינט `core/shared/features` + smart vs dumb ·
סיבוב של קליק אחד (optimistic + rollback) · cross-cutting (interceptor, error states).
**זכור:** smart מחזיק state, dumb מקבל `input()`/פולט `output()`. state חי ב-store יחיד כ-signals; נגזרות `computed`.

## T2 · Pagination — "מה הדרכים?"
**משפט-פתיחה:** "זו פונקציית חלון. שתי שאלות: מי מחזיק את הדאטה (local slice / server fetch) ואיך ממענים
(offset פשוט-אבל-זז / keyset יציב)." **התפריט:** local · server-offset · keyset/cursor · infinite (IntersectionObserver+scan)
· virtual scroll (רינדור, אורתוגונלי). **RxJS:** `switchMap` מבטל בקשה ישנה (לא mergeMap/concatMap) ·
חיפוש: `debounceTime+distinctUntilChanged` · `tap` תופעות לוואי · `take(1)/takeUntilDestroyed` teardown ·
`scan` צבירה. **לא** שמים debounce על דפדוף.

## T3 · אינטראקציות — "DnD / ציור / resize / host binding"
**משפט-פתיחה:** "כולן אותה מכונת-מצבים: `pointerdown` (capture+נקודת התחלה) → `pointermove` (delta) →
`pointerup` (commit). גרירה=מיקום, resize=גודל, ציור=נקודה." **זכור:** `setPointerCapture` כדי לא 'ליפול';
**transform** ולא top/left (אין reflow); ציור=canvas (strokes כמערכים כדי לשרוד resize) מול SVG (vector,
hit-test); `@HostListener` קורא אירוע / `@HostBinding` כותב ל-host / `host:{}` שקול; directive=התנהגות
לשימוש-חוזר. CDK (פרק 17) למיון-רשימות+נגישות; ידני למיקום חופשי.

## T4 · Auth + withCredentials
**משפט-פתיחה:** "מוכיחים זהות פעם אחת ונושאים הוכחה בכל בקשה. Bearer ב-header (אתה מצרף ב-interceptor) או
cookie `HttpOnly` (הדפדפן מצרף, צריך `withCredentials`)." **הזרימה:** login→verify→access(15m)+refresh(rotated)→
carry→validate→401→**refresh בשקט+retry**→403 על משאב. **withCredentials:** שולח cookies cross-origin; אז CORS
חייב `AllowCredentials()` + **origin מפורש** (אסור `AllowAnyOrigin`!) + cookie `SameSite=None; Secure`. **401-retry:**
interceptor `catchError`→refresh יחיד (shared, בלי stampede)→`switchMap` retry של המקורי.

---

## ארבעת ה-Q&A שחייבים לרוץ חלק
1. **switchMap מול mergeMap בדפדוף?** → רוצים רק את האחרון; switchMap מבטל את הקודם.
2. **למה אי אפשר `AllowCredentials` + `AllowAnyOrigin`?** → תקן CORS אוסר `*` עם credentials; חייב origin מפורש.
3. **401 מול 403?** → 401 לא-מאומת (רענן/התחבר); 403 מאומת-אבל-לא-מורשה (בדיקת resource).
4. **transform מול top/left לגרירה?** → transform על ה-compositor בלי reflow; top/left מחשב layout כל פריים.

## פתיחה אם נתקעת (אמור את זה בקול)
"אני אתחיל מהמודל המנטלי ואז ארד לקוד." — זה קונה לך שנייה לסדר את הראש ומראה מתודולוגיה.
הדמואים החיים: `/chapters/drill-pagination`, `/drill-interactions`, `/drill-auth`, `/drill-architecture` (port 4400).
