# ch30 — Auth Flow ו-withCredentials (T4)

> דרil T4. בסימולציה נתקעת על `withCredentials()` ועל "הזרימה הכוללת". המטרה: לדעת לתאר את כל הזרימה בסדר,
> ולהסביר בדיוק מה `withCredentials` עושה, למה CORS, ואיך עובד 401 → refresh → retry.

## המודל המנטלי
**"Auth = להוכיח זהות פעם אחת, ואז לשאת את ההוכחה בכל בקשה. שני נשאים:
(A) **Bearer token** ב-header `Authorization` — JS קורא אותו, אתה מצרף ב-interceptor (מה ש-TaskForge עושה).
(B) **Cookie** שהדפדפן מצרף לבד — `HttpOnly` (בטוח מ-XSS), אבל חייב **`withCredentials`** ל-cross-origin,
וצריך להתמודד עם CSRF + CORS-credentials."**

## הזרימה המלאה (תאמר בסדר הזה)
1. **login** — `POST /api/auth/login {email, password}`.
2. השרת **מאמת** סיסמה (PBKDF2) ובונה claims.
3. מנפיק **access token** (קצר, ~15 דק') + **refresh token** (ארוך, מסתובב/rotated).
4. הקליינט **שומר** את ההוכחה (Bearer: בזיכרון/localStorage; Cookie: הדפדפן שומר `HttpOnly`).
5. כל בקשה **נושאת** את ההוכחה (header או cookie).
6. השרת **מאמת** חתימה + תוקף + claims.
7. תוקף פג → **`401`** → הקליינט **מרענן בשקט** (`/auth/refresh`) **וחוזר על הבקשה המקורית**.
8. מאומת-אבל-לא-מורשה (למשל לא חבר בפרויקט) → **`403`** (בדיקת resource, לא רק "מי אתה").

## withCredentials — הצלילה (הדבר שנתקעת עליו)
- **קליינט:** `http.get(url, { withCredentials: true })` (או באינטרספטור) אומר לדפדפן **לשלוח cookies בבקשה
  cross-origin** ו**לקבל `Set-Cookie` בחזרה**. בלעדיו — XHR cross-origin **זורק את ה-cookies לגמרי**.
- **שרת CORS חייב אז:** `AllowCredentials()` **וגם** origin **מפורש** `WithOrigins("http://localhost:4500")`.
  **אסור** `AllowCredentials` יחד עם `AllowAnyOrigin` — הדפדפן דוחה `*` עם credentials. (זו שאלת-מלכודת נפוצה.)
- **ה-cookie** חייב `SameSite=None; Secure` כדי לרכוב cross-site; ו-`HttpOnly` כדי ש-JS לא יקרא אותו.
- כי cookie נשלח אוטומטית → חשוף ל-**CSRF** → צריך anti-forgery token.

### Bearer מול Cookie — איך לבחור ולהגן
| | Bearer (header) | Cookie (`HttpOnly`) |
|---|---|---|
| מי מצרף | אתה, ב-interceptor | הדפדפן, אוטומטית |
| cross-origin | עובד תמיד | צריך `withCredentials` + CORS-credentials |
| XSS | JS קורא את הטוקן → חשוף אם יש XSS | `HttpOnly` → JS לא קורא, בטוח יותר |
| CSRF | חסין (אין שליחה אוטומטית) | חשוף → צריך anti-forgery |
| SPA + API נפרדים | פשוט (מה ש-TaskForge בחר) | יותר תצורה |

## 401 → refresh → retry (מה שחסר ב-TaskForge היום, וצריך לדעת לכתוב)
interceptor פונקציונלי: `catchError` על 401 → קורא ל-`/auth/refresh` → בהצלחה **`switchMap` לניסיון-חוזר של
הבקשה המקורית** (cloned, עם הטוקן החדש). **רענון יחיד בתעופה** (`refresh$` משותף) כדי ש-N בקשות עם 401 בו-זמני
ימתינו לרענון אחד, לא יפוצצו N רענונים (refresh stampede).
```typescript
let refresh$: Observable<string> | null = null;
export const authRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  return next(addToken(req, auth.token())).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || req.url.includes('/auth/refresh')) return throwError(() => err);
      refresh$ ??= auth.refresh().pipe(shareReplay(1), finalize(() => (refresh$ = null)));
      return refresh$.pipe(switchMap(token => next(addToken(req, token)))); // retry המקורי
    }),
  );
};
```
```csharp
// server — אותו AddCors שכבר קיים ב-TaskForge (לשם SignalR) הוא ה-seam ל-cookie mode
builder.Services.AddCors(o => o.AddPolicy("client", p => p
    .WithOrigins("http://localhost:4500")   // מפורש — חובה עם credentials
    .AllowAnyHeader().AllowAnyMethod()
    .AllowCredentials()));
```
```typescript
// SignalR / WebSocket — אי אפשר header, אז הטוקן ב-query string (פרק 24)
new HubConnectionBuilder().withUrl(`${HUB}/board`, {
  accessTokenFactory: () => this.tokenStore.accessToken() ?? '',
});
```

## הדמו החי (verified facts לכותב)
רכיב `demo-auth-flow` (`auth-flow.demo.ts`) — אנימציה מדומה (אין רשת אמיתית). טוגל **Bearer header / Cookie +
withCredentials**, כפתורים `login` · `call API` · `expire token` · `reset`. אחרי `login` ואז `expire token`,
לחיצה על `call API` משחקת בלוג: `GET … → 401 → interceptor → POST /auth/refresh → 200 (rotated) → retry →
200`. שורת ה-config משתנה עם הטוגל: ב-Bearer מציגה את ה-interceptor + CORS פשוט; ב-Cookie מציגה
`withCredentials: true` + `AllowCredentials()` + "not AllowAnyOrigin" + cookie `SameSite=None; Secure; HttpOnly`.
pills מראים session/expiry/carrier. timers מנוקים ב-`DestroyRef`.

## Interview Q&A
- **"cookie מול Bearer — בחר והגן."** — ל-SPA+API נפרדים: Bearer פשוט (אין CORS-credentials/CSRF), המחיר הוא
  XSS אם הטוקן נגיש ל-JS. cookie `HttpOnly` בטוח מ-XSS אבל דורש withCredentials+CORS+CSRF.
- **"מה בדיוק `withCredentials` עושה?"** — מורה לדפדפן לצרף cookies (ו-TLS client certs) בבקשת cross-origin
  ולקבל Set-Cookie. ברירת המחדל cross-origin היא לא לשלוח אותם.
- **"למה אי אפשר AllowCredentials עם AllowAnyOrigin?"** — תקן ה-CORS אוסר `*` עם credentials; הדפדפן דורש
  origin מפורש כששולחים cookies, אחרת חוסם.
- **"401 מול 403?"** — 401 = לא מאומת (אין/פג טוקן) → רענן/התחבר. 403 = מאומת אבל לא מורשה למשאב הזה.
- **"איפה שומרים את הטוקן וה-trade-off?"** — localStorage נוח אבל חשוף ל-XSS; `HttpOnly` cookie בטוח מ-XSS
  אבל חשוף ל-CSRF. אין חינם.
- **"תאר silent refresh ואיך מונעים stampede."** — interceptor תופס 401, מרענן פעם אחת (shared `refresh$`),
  ושאר הבקשות ממתינות לאותו רענון ואז חוזרות.
- **"איך הטוקן מגיע ל-WebSocket?"** — אין headers ב-WS מהדפדפן; `accessTokenFactory` שם אותו ב-query string
  ב-handshake; השרת קורא אותו ב-`OnMessageReceived` עבור נתיבי `/hubs` (פרק 24).

## פאנלים מומלצים
`live-demo` → `auth-flow.demo` · `code-inline` ל-interceptor/CORS/SignalR · `diagram` (mermaid: login → tokens →
request → 401 → refresh → retry; ענף 403) · `simulator` (POST /auth/login → 200, ואז GET עם 401→refresh) · טבלת
Bearer/Cookie כ-`callout alt`. קשר לפרקים 05 (auth) ו-11 (interceptor/TokenStore) ו-24 (token over WS).
