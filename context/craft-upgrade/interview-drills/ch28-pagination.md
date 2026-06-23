# ch28 — Pagination, כל הדרכים (T2)

> דרil T2. בסימולציה נשאלת "איך מממשים pagination ומה הדרכים — rxjs, query, tap, take, local/server".
> המטרה: שתדע למנות את כל האפשרויות, להסביר מתי כל אחת, ולכתוב את גרסת ה-RxJS על הלוח.

## המודל המנטלי
**"Pagination זו פונקציית חלון מעל קבוצה מסודרת. שתי שאלות מחליטות הכול: (1) **מי מחזיק את הדאטה** — אם
הקליינט כבר מחזיק הכול, חותכים מקומית; אם השרת מחזיק, מבקשים חלון. (2) **איך ממענים את החלון** — offset
(`page/pageSize`, פשוט אבל זז כשמכניסים שורות) או keyset/cursor (`after=…`, יציב, append-only)."**

## התפריט (תמנה את כולן — זו התשובה ל"מה הדרכים")
| דרך | איך | מתי | חיסרון |
|---|---|---|---|
| **local slice** | `computed(() => items().slice(start, start+size))` | קבוצה קטנה שכבר נטענה | שולח הכול לקליינט |
| **server offset** | `?page=&pageSize=` → `Skip((p-1)*size).Take(size)` + מעטפת `total` | pager ממוספר קלאסי | עמודים עמוקים איטיים; drift בכתיבות |
| **server keyset/cursor** | `?after=<lastId/rank>` → `WHERE rank > @after ORDER BY rank LIMIT n` | פיד אינסופי, סדר יציב | אין קפיצה לעמוד שרירותי |
| **infinite scroll** | `IntersectionObserver` על זקיף → טוען חלון → מצרף (`scan`) | פיד | קשה לקפוץ/לשתף מיקום |
| **virtual scroll** | `cdk-virtual-scroll-viewport` — מרנדר רק את הנראה | רשימות ענק | אורתוגונלי: אופטימיזציית **רינדור**, מצטרף לכל דרך |

> טריק עניית-זהב: "Virtual scroll זו לא דרך לדפדף — זו אופטימיזציית רינדור. אפשר לשלב אותה עם server offset."

## ה-RxJS (האופרטורים שנשאלת עליהם)
- **`switchMap`** — על שינוי עמוד: `page$.pipe(switchMap(p => http.get(...)))`. **מבטל את הבקשה הישנה** כשלוחצים
  מהר. (vs `mergeMap` = מרוץ/תוצאות לא בסדר, `concatMap` = תור, `exhaustMap` = מתעלם עד שהנוכחי נגמר).
- **`debounceTime(300)` + `distinctUntilChanged()`** — על שדה חיפוש: ממתין לשקט ומסנן ערכים זהים, כדי לא
  לירות בקשה על כל הקלדה. **שים לב:** על *דפדוף* לא שמים debounce — אנחנו דווקא רוצים לראות את כל הבקשות
  נורות וה-switchMap מבטל.
- **`tap`** — תופעות לוואי בלי לשנות את הזרם: `loading=true`, scroll-to-top, לוג.
- **`take(1)` / `firstValueFrom`** — one-shot (פקודה בודדת). **`takeUntilDestroyed()`** — teardown אוטומטי.
- **`scan((acc, page) => [...acc, ...page], [])`** — צבירה ל-infinite scroll.
- **גשר signals↔rxjs:** `toObservable(pageSignal)` → אופרטורים → `toSignal(...)`. או פשוט `httpResource` עם URL
  שהוא `computed` (מה ש-TaskForge עושה ב-`issues.store.ts` פרק 13).

### קוד-ליבה (code-inline)
```typescript
// השדרה: page$ ישר ל-switchMap, search$ דרך debounce; combineLatest מאחד
const page$   = toObservable(this.page);
const search$ = toObservable(this.search).pipe(debounceTime(300), distinctUntilChanged());

combineLatest([page$, search$]).pipe(
  map(([page, search]) => ({ page, search })),
  tap(() => this.loading.set(true)),
  switchMap(q => this.http.get<PagedResult<Issue>>(url(q))),   // מבטל בקשה ישנה
  tap(() => this.loading.set(false)),
  takeUntilDestroyed(),
).subscribe(res => this.result.set(res));
```
```csharp
// server offset — מעטפת total כדי שהקליינט יידע כמה עמודים יש
public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize) {
    public int TotalPages => (int)Math.Ceiling((double)Total / PageSize);
}
// בריפו: var total = await query.CountAsync(ct);
//         var items = await query.OrderBy(x => x.Id).Skip((page-1)*size).Take(size).ToListAsync(ct);
```
```csharp
// keyset — יציב תחת הכנסות, אין drift
var items = await db.Issues.Where(i => i.Rank > afterRank)
                          .OrderBy(i => i.Rank).Take(size).ToListAsync(ct);
```

## הדמו החי (מה שבנינו — verified facts לכותב)
רכיב `demo-pagination` (`pagination-modes.demo.ts`), dataset של **137** שורות, `pageSize = 10`, latency
מדומה **700ms**. ארבעה טאבים: `local slice` · `server offset` · `RxJS switchMap` · `infinite scroll`.
- **RxJS tab:** כפתור **"rapid ×4"** יורה 4 קפיצות-עמוד ב-150ms הפרש. הלוג מראה `request page N` ואז
  `cancelled page N` (קו חוצה, אדום) לכל בקשה שה-`switchMap` ביטל, ו-`applied page N` (ירוק) רק לאחרונה.
  שדה החיפוש עובר `debounceTime(300)+distinctUntilChanged`.
- **offset:** כל מעבר עמוד = בקשה עם spinner; מעטפת total קובעת `page X / Y`.
- **infinite:** `IntersectionObserver` על זקיף בתחתית `pg-scroll`; כל הצטלבות מצרפת חלון (`scan`-style) עד 137.
- **local:** `computed` חותך מערך בזיכרון — מיידי, בלי רשת.
ה-state בלבד; אין שרת אמיתי. timers מנוקים ב-`DestroyRef`; הזרם ב-`takeUntilDestroyed`.

## Interview Q&A
- **"למה switchMap ולא mergeMap כאן?"** — רוצים את העמוד האחרון בלבד; switchMap מבטל את הקודם. mergeMap היה
  משאיר תוצאות מירוץ; concatMap היה מעכב מאחורי בקשות ישנות.
- **"מה נשבר ב-offset כשמכניסים שורות במקביל, ואיך keyset פותר?"** — offset סופר מהתחלה, אז הכנסה מזיזה את
  החלון (רואים כפילות/דילוג). keyset ממען לפי ערך עוגן (rank/id), אז החלון יציב ללא תלות בהכנסות.
- **"איפה שמים debounce ולמה?"** — על קלט חיפוש, לא על דפדוף. כדי לא לירות בקשה על כל תו.
- **"client מול server — איך מחליטים?"** — גודל הקבוצה. קטן וחסום → local. גדול/לא חסום → server.
- **"איך מחושב total/TotalPages?"** — `COUNT` בשרת לצד החלון, ו-`ceil(total/pageSize)`.
- **"מה ההבדל בין virtual scroll ל-pagination?"** — virtual scroll מרנדר רק שורות נראות (רינדור); pagination
  מגביל כמה דאטה מביאים (רשת/DB). משלימים, לא מחליפים.

## פאנלים מומלצים
`live-demo` → `pagination-modes.demo` (הטאב הראשי) · `code-inline` ל-3 הקטעים · טבלת התפריט כ-`ul`/`callout alt`
· `diagram` (mermaid: client-holds-data? → slice / fetch-window → offset|keyset). אין צורך ב-`code` עם region.
