# CH13 PLAN — לוח ה-Issues (issue-board)

Cold-start handoff. Read `taskforge-companion/context/CH07-09-PLAN.md` §"conventions/pipeline/gotchas"
first — everything there still applies. State as of this file: ch00–ch12 ready (commit c957cf5),
12 milestones compile, 78 tests, 111 covered files.

## What ch13 delivers (registry blurb, locked)
סינון/חיפוש/מיון/דפדוף מסונכרנים ל-URL, עדכונים אופטימיים עם rollback, ‎@defer ו-virtual scroll.

## Server: NOTHING NEW NEEDED
- `GET /api/projects/{id}/issues` + `IssueListParams` ([AsParameters]: status, search, sort, page,
  pageSize w/ Range validation) + `PagedResult<IssueResponse>` — all from ch04.
- `PUT /api/issues/{id}` (UpdateAsync(id, Action<Issue>)) — ch04; RequireAuthorization since ch05;
  CreateIssue membership guard 403 — ch05.
- milestones.json gets ONLY `{ "chapter": "ch13", "kind": "ng", "dir": "client" }`.
- (Re-verify before writing prose: read `.build/ch12/server/TaskForge.Api/Contracts/IssueContracts.cs`
  for the exact param names/sort keys — do NOT trust this file's memory of them.)

## Client snapshot design (reference/ch13/client, ~12 files)

### Decisions (locked after ch12 review)
1. **Filters live in the URL** — the board reads `status` / `q` / `sort` / `page` as router-bound
   inputs (withComponentInputBinding from ch10 already on). Changing a filter = `router.navigate`
   with `queryParams` + `queryParamsHandling: 'merge'`. Back button / share / refresh work free.
   This extends the ch10 "URL is the state" chips that already exist on the board.
2. **IssuesStore** (`core/state/issues.store.ts`): NOT root-singleton-with-global-state like
   ProjectsStore; it holds a `query` signal (set by the board from its inputs via effect or
   directly computed) + `httpResource` whose URL function serializes the query (URLSearchParams,
   omit defaults). Reactive URL = ch12's pattern scaled up: every filter change refetches, stale
   responses auto-dropped (teach: httpResource cancels/ignores stale — already demoed ch11).
3. **Optimistic updates via `linkedSignal`** — the teaching centerpiece:
   `board = linkedSignal(() => resource.hasValue() ? resource.value().items : [])` — server truth
   resets it on every fetch, but `setStatus()` can write locally first:
   mutate linkedSignal copy, fire `PUT /issues/{id}`, on success `resource.reload()` (or accept
   server echo), on error restore (`board.set(previous)`) — toast already comes from interceptor.
   Demo MUST show rollback visibly (break-server toggle like ch11 resource demo).
4. **Virtual scroll**: add `@angular/cdk` dependency, `<cdk-virtual-scroll-viewport itemSize=...>`
   for the issue list (board can be one scrolling list grouped by status chip filter, NOT a 3-column
   kanban — kanban drag-n-drop is ch14+ scope creep; the blurb promises a board with filters, not DnD).
   GOTCHA: cdk version must match Angular major (^22). pnpm install in snapshot during milestone run.
5. **`@defer`**: the issue list block defers `on viewport` with skeleton placeholder
   (`@placeholder` reuses ch12 skeleton pattern); teach @defer triggers + what gets code-split
   (check dist chunks like ch10 did — REAL chunk names in prose only if verified from build output).
6. Keep ch09 kit boundary: status select / search input wrapped in `tf-field`; new shared primitive
   ONLY if genuinely reusable (a `tf-select` is NOT needed — native select inside tf-field works,
   ch12 proved it in the add-member dialog).

### Files
- `core/models/issue.model.ts` — mod (ch07 file): add `IssueListQuery` mirror of IssueListParams +
  maybe `UpdateIssueRequest` mirror. Regions step-13.2.
- `core/state/issues.store.ts` — NEW: query signal, httpResource w/ URL serializer, linkedSignal,
  setStatus optimistic command, total/page computeds. Regions step-13.3 (resource), step-13.4
  (linkedSignal), step-13.5 (optimistic setStatus).
- `features/issues/issue-board.ts/.html/.scss` — NEW smart feature (gets projectId input from
  board route same as ProjectMembers), toolbar (search debounced via signal + effect? simpler:
  input event → navigate; AVOID rxjs debounce — use `setTimeout` clear pattern or just navigate
  per change, URL churn is acceptable and honest), status chips reuse existing board filter style,
  sort select, pagination buttons (prev/next, page X of Y from PagedResult.totalPages — ch07
  api.model already serializes totalPages). Regions step-13.6..13.9.
- `features/issues/issue-row.ts/.html/.scss` — NEW dumb row (badge tone by status, priority,
  title, optimistic-pending dimming via input). Region step-13.10.
- `features/projects/project-board.html/.ts` — mod: replace the ch12 "placeholder" paragraph with
  `<tf-issue-board [projectId]="projectId()" />`; KEEP `<tf-project-members>` below. The ch10
  status chips on project-board MOVE into issue-board's toolbar (the chips were teaching URL-state;
  the real toolbar inherits that). Region step-13.11.
- `package.json` — mod: add @angular/cdk ^22.
- Possibly `app.config.ts` untouched. NO new interceptor work.

### Verification gate (same as ch12)
materialize → `dotnet run` .build/ch13/server (ch12 server carries forward) + `ng serve` .build/ch13/client
(launch config `taskforge-client-snapshot` exists but points at ch12 — EDIT path to ch13 or serve manually).
Browser matrix: filters change URL + back button restores; refresh mid-filter keeps state; optimistic
status change flips row instantly then server confirms; break server (stop dotnet) → change status →
row flips BACK + toast; pagination boundaries; @defer chunk visible in dist; virtual scroll renders
subset (assert DOM row count < total).

## Content (delegate to sonnet bg agent AFTER snapshot verified, same prompt skeleton as ch12)
~18 steps. Arc: "המסך הראשון שבאמת מרגיש כמו מוצר". Key steps: URL-as-state recap and why filters
belong there; IssueListQuery mirror; reactive-URL resource w/ serializer; linkedSignal (v22 callout —
server-truth-resets-local pattern); optimistic command w/ rollback (+live demo step); toolbar wiring;
pagination from PagedResult; @defer anatomy (triggers, placeholder, chunk proof); cdk virtual scroll
(why itemSize, what breaks with variable heights); dumb row; board hosting; finale app-tree + ch14 tease
(Signal Forms, issue detail + comments).
Live demo: **optimistic-rollback timeline** (list + "fail next request" toggle + visible
pending/confirmed/rolled-back states + log, timer-cleanup via DestroyRef like ch11/ch12 demos).
Interview Qs: optimistic vs pessimistic UX trade-offs; linkedSignal vs computed vs signal;
why virtual scroll (DOM cost) vs pagination (network cost) — and why this board uses both.
Remember: agent prompt MUST include — no arrows ANYWHERE in prose (incl. quoting demo button labels —
ch12 lesson), `@`-in-template-text needs `&#64;` (ch12 lesson), 409/JSON-string facts only if reused,
coverage = new-file literals (issues.store, issue-board ×3, issue-row ×3, issue.model is ch07-owned mod).

## Risks / open questions for the implementer
- linkedSignal API shape in the installed v22 — VERIFY against node_modules typings before teaching.
- cdk virtual scroll inside the board layout (sticky page shell) needs explicit viewport height —
  test at 375px too (overflow sweep habit from 2026-06-12 session).
- Search debounce: if it feels janky live, a 250ms setTimeout-clear in the component is fine —
  teach it as "debounce is a UI concern, the store stays synchronous".
- If pageSize default in IssueListParams is small (check ch04), seed may need more issues for
  virtual scroll to be visible — extending DbSeeder in ch13 is allowed (region step-13.x, like ch12 maya).
