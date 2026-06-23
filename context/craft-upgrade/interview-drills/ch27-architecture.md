# ch27 — Build & Explain: ארכיטקטורת fullstack (T1)

> דרil T1. המטרה: שתוכל לקבל את השאלה "תבנה לי todo/task app — ספר לי איך אתה ניגש, מה הארכיטקטורה,
> ה-components, ה-API" ולענות בזרימה אחת, רגועה, בלי להיתקע. הקוד אנגלית, ההסבר בעל-פה עברית.

## המודל המנטלי (משפט אחד שמחזיק הכול)
**"דאטה זורם בטבעת: `component → service/store → HTTP → endpoint → repository → DB`, וחוזר כ-DTO מטיפוס.
לכל שכבה תפקיד אחד והיא מדברת רק עם השכן."**
ציֵיר את הטבעת על הלוח. סמן את ה-**seams** (ממשקים) — הנקודות שבהן אתה מחליף מימוש או כותב טסט:
`IIssueRepository`, ה-interceptor, חוזה ה-DTO.

## ה-Talk-Track (סדר המשפטים שאתה אומר)
1. **"קודם אני מצמצם scope ובוחר ישות אחת."** — Task/Issue: `id, title, status, createdAt`. אל תבנה הכול; בנה
   vertical slice אחד מקצה לקצה ואז משכפל.
2. **"אני מתחיל מהחוזה, לא מה-DB."** — ה-DTO וה-endpoints: `GET /api/issues?page=&pageSize=` (רשימה
   מדפדפת), `POST` (201 + Location), `PUT/PATCH`, `DELETE` (204). status codes: `200/201/204/400/401/403/404`.
   "החוזה הוא מה ש-frontend ו-backend מסכימים עליו — שניהם נבנים ממנו במקביל."
3. **"בשרת אני עובד בשלוש שכבות לפי כיוון התלות."**
   - **Core** — הישות + ה-seam `IIssueRepository` (interface). אפס תלות בתשתית.
   - **Infrastructure** — EF `DbContext` + `EfIssueRepository` שמממש את ה-seam.
   - **Api** — Minimal API: `MapGroup("/api/issues")`, ולידציה של ‎.NET 10, `TypedResults`, `ProblemDetails`.
   "החוק: Api ו-Infrastructure תלויים ב-Core, לא הפוך. לכן אפשר להחליף DB בלי לגעת בלוגיקה."
4. **"בקליינט אני מחלק `core / shared / features`."**
   - **core** — ה-store (signal state) + ה-HTTP service + interceptors. ה-state חי כאן, פעם אחת.
   - **features** — רכיב **חכם** (smart/container) שמזמין מה-store ומתזמר.
   - **shared** — רכיבים **טיפשים** (presentational): מקבלים `input()`, פולטים `output()`, אפס לוגיקת דאטה.
   "חכם יודע מאיפה הדאטה בא; טיפש רק מצייר את מה שנתת לו ומדווח אירועים."
5. **"עכשיו אני מתאר את הסיבוב של קליק אחד."** — "add task": הרכיב קורא ל-`store.add(dto)` → ה-store עושה
   **optimistic insert** (מצייר מיד) + `POST` → `201 + Location` → אם נכשל, **rollback**. הרשימה היא
   `computed` מעל ה-state, אז היא מתעדכנת לבד.
6. **"ולבסוף ה-cross-cutting."** — interceptor שמצרף auth, מיפוי שגיאות ל-`ProblemDetails`, ומצבי
   `loading / empty / error` בכל מסך. "המצבים האלה הם 80% מהאיכות הנתפסת."

## ה-Build (סדר בנייה אמיתי — "מבחוץ פנימה בחוזה, מבפנים החוצה בבנייה")
1. ישות + `DbContext` + migration.  2. `IIssueRepository` + מימוש EF.  3. endpoints + DTOs + ולידציה.
4. רוץ ב-`.http`/Swagger — החוזה חי.  5. בקליינט: models שתואמים ל-DTO.  6. store עם signals + HTTP service.
7. רכיב חכם.  8. רכיבים טיפשים.  9. interceptor + error mapping.  10. מצבי loading/empty/error.

### קוד-ליבה (code-inline panels)
```csharp
// Core — ה-seam. אפס תלות בתשתית.
public interface IIssueRepository {
    Task<PagedResult<Issue>> ListAsync(IssueQuery q, CancellationToken ct);
    Task<Issue?> FindAsync(int id, CancellationToken ct);
    Task<Issue> AddAsync(Issue issue, CancellationToken ct);
}
```
```csharp
// Api — Minimal API endpoint group
var issues = app.MapGroup("/api/issues").RequireAuthorization();
issues.MapGet("/", async ([AsParameters] IssueQuery q, IIssueRepository repo, CancellationToken ct)
    => TypedResults.Ok(await repo.ListAsync(q, ct)));
issues.MapPost("/", async (CreateIssue dto, IIssueRepository repo, CancellationToken ct) => {
    var created = await repo.AddAsync(dto.ToEntity(), ct);
    return TypedResults.Created($"/api/issues/{created.Id}", IssueResponse.From(created));
});
```
```typescript
// core/state — signal store, ה-state חי פעם אחת
@Injectable({ providedIn: 'root' })
export class IssuesStore {
  private readonly http = inject(HttpClient);
  private readonly _items = signal<Issue[]>([]);
  readonly items = this._items.asReadonly();
  readonly open = computed(() => this._items().filter(i => i.status === 'Open'));

  add(dto: CreateIssue) {
    const temp = { ...dto, id: -Date.now(), status: 'Open' } as Issue;
    this._items.update(x => [temp, ...x]);                 // optimistic
    this.http.post<Issue>('/api/issues', dto).subscribe({
      next: saved => this._items.update(x => x.map(i => i === temp ? saved : i)),
      error: () => this._items.update(x => x.filter(i => i !== temp)), // rollback
    });
  }
}
```
```typescript
// shared — רכיב טיפש: input פנימה, output החוצה, אפס דאטה משלו
@Component({ selector: 'app-issue-card', /* ... */ })
export class IssueCard {
  issue = input.required<Issue>();
  toggle = output<number>();
}
```

## Interview Q&A (callout title = השאלה)
- **"smart מול presentational?"** — חכם מחזיק/מביא state ומתזמר; טיפש מקבל `input()` ופולט `output()`, ניתן
  לבדיקה בקלות ולשימוש חוזר. הגבול שומר על הרכיבים הטיפשים "טהורים".
- **"איפה ה-state גר?"** — ב-store יחיד ב-`core`, כ-signals; נגזרות הן `computed`. רכיבים קוראים, לא משכפלים.
- **"למה interface ל-repository?"** — seam: מחליף EF ל-in-memory בטסטים, הופך תלות, מכבד את חוק התלות.
- **"optimistic update?"** — מציירים מיד, שולחים לשרת, מתחרטים (rollback) אם נכשל. תחושת מהירות + נכונות.
- **"איך ה-DTO של הקליינט נשאר מסונכרן עם ה-record בשרת?"** — מקור-אמת אחד הוא החוזה; ‎OpenAPI/טיפוסים
  משותפים; שינוי שובר מתגלה בקומפילציה/בטסט חוזה.
- **"zoneless — מה זה משנה?"** — אין Zone.js; CD מונע signals. כל קריאה/כתיבה של signal מסמנת view ל-render.

## פאנלים מומלצים (לכותב ה-content)
`diagram` (mermaid של הטבעת) · `code-inline` ל-4 הקטעים מעל · `filetree` של `core/shared/features` + `Core/Infrastructure/Api`
· `simulator` (POST /api/issues → 201) · `app-tree` chapter `'ch11'` (המצב המצטבר). **בלי `code` עם region**
(להימנע מכשל manifest) — השתמש ב-`code-inline`. קשר במפורש לפרקים 02/04/07/11.
