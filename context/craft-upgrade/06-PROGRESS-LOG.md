# 06 — Progress Log (LIVING — update after every chunk)

> **Whoever works on this MUST append an entry below after each chunk.** Start your session by reading the latest entry.
> Newest entries at the TOP. This is how work survives across agents / sessions / tools (Claude ↔ codex).

## Entry template (copy this)

```
### YYYY-MM-DD — <unit, e.g. "Phase 0a ch08 retrofit"> — <STATUS: done | in-progress | blocked>
- What I did:
- Where (files + commit hash):
- Gate outcomes: gen:manifest [ ] · test [N passed] · verify:coverage [N files] · build [ ] · snapshots/milestones [ ]
- Runtime smoke / 375px sweep:
- Decisions made / values locked (e.g. final token names):
- Surprises / deviations from the spec:
- WHAT'S NEXT (the very next action for the next person):
```

## Status board (keep current)

| Unit | Spec | Status |
|---|---|---|
| Phase 0a — ch08 design-tokens v2 | `04-chapter-specs/ch08-retrofit.md` | DONE — token foundation `743ce36`; component adoption completion `3919f87` |
| Phase 0b — companion re-skin | `04-chapter-specs/companion-reskin.md` | DONE — `47f7712` |
| Renumber placeholders ch15–20 → ch21–26 | `03-PROPAGATION-AND-SYNC.md` Procedure C | DONE — `27811b6` |
| ch15 — Modern CSS 2026 | `04-chapter-specs/ch15-modern-css.md` | DONE — snapshot `c7f7b7d`, content + demo committed (see latest log entry) |
| ch16 — Command palette | `04-chapter-specs/ch16-command-palette.md` | DONE — snapshot (`bfc4bb7`/`974f074`/`1de5821`) + demo + content; see latest log entry |
| ch17 — Kanban DnD | `04-chapter-specs/ch17-kanban-dnd.md` | DONE — backend `b68c9af`; frontend + content + demo `9b3f79a` (entity-store/optimistic spine, accessible pointer+keyboard DnD, runtime-verified) |
| ch18 — Dashboard | `04-chapter-specs/ch18-dashboard.md` | DONE — backend `fecc7f2`; frontend + content + demo `29000ee` (stats GROUP BY + activity log + migration; DashboardStore derived selectors + hand-rolled SVG charts; runtime + layout verified) |
| ch19 — Rich detail | `04-chapter-specs/ch19-rich-detail.md` | DONE — backend `d2c9147`; frontend + content + demo `fec9fe8` (markdown+XSS, @mention custom control, attachments BLOB, optimistic comments+undo, issue activity timeline; runtime-verified; content delegated+reviewed) |
| ch20 — State capstone | `04-chapter-specs/ch20-state-capstone.md` | NOT STARTED |
| Wave 5 — Testing (ch21) | (planned in `01-MASTER-PLAN.md`) | NOT STARTED |
| Wave 5 — Perf & a11y (ch22) | (planned) | NOT STARTED |
| Wave 6 — Production (ch23–26) | (planned) | NOT STARTED |

---

## Log entries (newest first)

### 2026-06-15 — ch19 Rich Issue Detail — DONE (Claude; content DELEGATED + reviewed) (Oleg picked "build ch19" over skipping)
- Full chapter done: backend `d2c9147`, frontend+content+demo `fec9fe8`. **spine #4 = custom form control + optimistic threads + undo.**
- BACKEND (`reference/ch19/server/`): `Attachment` entity (BLOB bytes IN the DB — dev-simple/atomic; trade-off taught
  vs blob-storage); `IAttachmentRepository`/`EfAttachmentRepository` (list uses `.Select` projection that OMITS the BLOB;
  download loads bytes); `AttachmentContracts.AttachmentResponse`; `AttachmentEndpoints` POST multipart (5MB cap,
  `.DisableAntiforgery()` — Bearer not cookies so no CSRF), GET list, GET `/api/attachments/{id}` download via
  `TypedResults.File`; upload logs `ActivityType.AttachmentAdded` (enum value, NO migration — TEXT column);
  `IActivityRepository.GetRecentForIssueAsync` + `DashboardEndpoints` GET `/api/issues/{id}/activity`; EF migration
  `AddAttachments`. 201 uploader name from the `name` JWT claim (`with {…}` — nav not loaded). milestones += ch19 dotnet.
  Curl-verified: upload→201, list "Demo User"/26B, download text/plain bytes round-trip, issue activity incl
  AttachmentAdded, anon→401, 6MB→400.
- FRONTEND (`reference/ch19/client/`): `core/markdown/markdown.ts` — **escape-FIRST** then safe tags (the XSS lesson);
  `shared/ui/markdown-editor/` MarkdownEditor = `FormValueControl<string>` (deepens ch14 priority-picker) with
  Write/Preview toggle + @mention autocomplete; `IssueDetailStore` += 3 httpResources (attachments/activity/members),
  optimistic comments with a **4s undo window** (postCommentWithUndo/undoPendingComment/commitPending), addAttachment +
  blob download; `issue-detail.{ts,html,scss}` two-column workspace (markdown comments via [innerHTML], undo bar,
  attachments upload/list/download, activity timeline w/ icons). View-transition-name already wired (ch10+ch14).
  Had to overlay `dashboard.model.ts` (+AttachmentAdded to the ActivityType union) and `dashboard.ts` (+icon) — extending
  a shared union ripples into existing Record<ActivityType,…>. 25-step content + rich-comment live demo. registry→ready,
  milestones += ch19 ng.
- DELEGATION (Oleg's /goal said "delegate what can be"): I built+runtime-proved the snapshot AND built the live demo
  myself, then delegated ONLY the `content.ts` Hebrew prose to a sonnet general-purpose agent with verified-facts-only +
  the exact region map. Agent returned all-gates-green (25 steps/7 quiz/5 proveIt/exercise/6 terms) and even caught a real
  bug in MY demo (literal backticks inside the component `template:` literal → fixed to `&#96;`). My review found 1 issue:
  a copy-paste title typo "ChartContracts"→"AttachmentContracts" (fixed). All facts checked accurate; no arrows; the
  ``**bold**`` occurrences are inside backticks (intentional md-syntax examples shown as code), not raw emphasis.
- RUNTIME-VERIFIED (two-server smoke, explicit widths): markdown **bold**/`code`/@mention render; pasted `<script>`
  ESCAPED to text (hasScriptTag false) — XSS defense proven; @mention popover filters+inserts; optimistic comment shows
  instantly (pending), Undo removes it and server count UNCHANGED, break-server→rollback+toast "boom"; file upload via the
  real input→list+timeline AttachmentAdded; download round-trips (curl); view-transition-name=issue-1; 375px 1-col no
  overflow; 0 console errors. Guide chapter (port 4400) verified: 25 steps render, live demo works (mention+preview+script
  escaped), 375px clean, 0 errors.
- GATES ALL green: gen:manifest 19/1763 · verify:coverage 183 (0 pending) · vitest 120 (+6 ch19) · guide build clean ·
  clean re-materialize + ch19 server `dotnet build` 0/0 + ch19 client `ng build` clean. launch.json snapshot ch18→ch19.
- WHAT'S NEXT: **Wave 4 craft is now COMPLETE through ch19.** Per master plan ch20 = State capstone (@ngrx/signals —
  consolidate the hand-rolled spine: EntityStore + optimistic + selectors + the undo stack into a library-backed store).
  After ch20, Wave 5 = ch21 Testing, ch22 Perf/a11y. Confirm with Oleg whether to do ch20 next or jump to Wave 5 testing.

### 2026-06-15 — ch18 Dashboard & Data-Viz — DONE (Claude)
- Full chapter done: backend `fecc7f2`, frontend+content+demo `29000ee`. **spine #3 = derived/aggregation selectors.**
- BACKEND (`reference/ch18/server/`): aggregation seam `IStatsRepository`/`EfStatsRepository` — GROUP BY by status,
  priority, and `CreatedAtUtc.Date` (per-day trend) → `ProjectStats` DTO (Core/Common); `ActivityEvent` entity +
  `ActivityType` enum (string-converted), `IActivityRepository`/`EfActivityRepository` (LogAsync + GetRecent w/ Include
  Actor), `DashboardContracts.ActivityResponse`; `DashboardEndpoints` GET `/api/projects/{id}/stats` + `/activity?take=`
  (member-authz, take clamp 1..50); activity WRITTEN from handlers (IssueEndpoints create + status-change-only reorder;
  CommentEndpoints add) via injected IActivityRepository; EF migration `AddActivityLog` (new table + FK cascade/restrict
  + index) generated in `.build` then copied to overlay (+ ModelSnapshot); DbSeeder seeds 5 events. milestones += ch18 dotnet.
  Curl-verified: stats p1 total 60 (open21/inProgress20/done19 — matches ch17 kanban), byPriority sums 60, createdPerDay
  19 days (GroupBy date translates in SQLite!); activity newest-first w/ actor names; anon→401; create issue grows
  activity 4→5 + total 60→61.
- FRONTEND (`reference/ch18/client/`): `core/models/dashboard.model.ts`; `core/state/dashboard.store.ts` = two
  httpResource keyed by projectId (undefined when logged-out) + **derived selectors** summaryCards/statusSlices/
  prioritySlices/trend (raw counts → chart-ready view models, colors as `var(--chart-*)`); hand-rolled SVG charts
  `features/dashboard/charts/{donut,bar,sparkline}.ts` (single-file dumb components); `dashboard.{ts,html,scss}` (smart
  component, DatePipe feed, intrinsic auto-fit grid + container-query card font + clamp + OKLCH series colors); route
  `/projects/:id/dashboard` (guard+resolver) + board nav link. milestones += ch18 ng. 20-step content + mini-dashboard
  live demo (regenerate → selectors → SVG). registry ch18 → ready.
- **LAYOUT BUG caught by Oleg (screenshot) AFTER I prematurely called it done** — charts ballooned (`width:100%`+
  `aspect-ratio:200/120` → bar ~360px tall) and a cross-tile `grid-row:span 3` subgrid OVERLAPPED tiles. FIX: bound every
  chart by HEIGHT (donut fixed 140px square, bar `height:150px`, sparkline `height:88px`) + `preserveAspectRatio="xMidYMid
  meet"` + tile `overflow:hidden`; dropped subgrid for robust flex-column tiles. Re-verified via bounding boxes at 1280
  (4 cards, 3 aligned chart cols, every svg inside its tile) and 375 (2x2 cards, 1-col charts), `docOverflow:false`, 0
  console errors. Saved durable feedback memory `verify-layout-before-done.md`.
- **GOTCHAS (write these on the wall):** (1) ALWAYS visually/measurement-verify layout BEFORE saying done — compile+tests
  don't catch overflow/overlap. (2) Preview `clientWidth` is often **0** (hidden tab) → forces FALSE overflow readings;
  `preview_resize` to an EXPLICIT width (1280 AND 375) before measuring. `preview_screenshot` times out on hidden tab —
  use `preview_eval` bounding-box reads. (3) hand-rolled SVG charts must be HEIGHT-bounded, never width-driven aspect-ratio.
  (4) content.ts: arrow-ban scans `step.title` + prose + panel captions (NOT JS comments) — no →/←; the bash `code` panel
  needs `\n` escapes, not literal newlines in `"..."`. (5) `pnpm install --silent` after a fresh materialize can leave
  `@angular/cdk` unresolved (ng build fails on `@angular/cdk/drag-drop`) — rerun full `pnpm install`; known transient.
- GATES ALL green: gen:manifest 18 snapshots/1580 entries · verify:coverage 171 files (0 pending) · vitest 114 (+6 ch18) ·
  guide `pnpm build` clean (only Mermaid CJS warning) · re-materialized + ch18 client `ng build` 0 errors + ch18 server
  `dotnet build` 0/0. launch.json snapshot config ch17 → ch18.
- WHAT'S NEXT: **ch19 — Rich Issue Detail** (`04-chapter-specs/ch19-rich-detail.md`): markdown editor, mentions,
  attachments (safe save), issue-level activity timeline (sits on the ch18 activity log!), undo/rollback around rich
  actions. Snapshot-first as usual. NOTE master-plan trim order = drop ch19 FIRST if scope must shrink; ch18 was the
  second-to-keep, so ch19 is the most-trimmable — confirm with Oleg whether to build it or jump to Wave 5 (ch21 testing).

### 2026-06-14 — ch17 frontend + content + demo — DONE (Claude)
- Finished ch17 (commit `9b3f79a`). Frontend overlay (`reference/ch17/client/`):
  - **spine #2** `core/state/entity-store.ts` — generic `EntityStore<T>` built ON linkedSignal (resets to server truth,
    allows local patch/upsert/remove/snapshot/restore) + reusable `optimistic(apply, persist, rollback)` (returns bool).
  - Refactored `IssuesStore` onto EntityStore WITHOUT changing its public surface; `setStatus` + new `reorder` both go
    through `optimistic`. `reorder` = optimistic patch(status+rank) → `PATCH /api/issues/{id}/rank`; NO reload on success
    (unlike setStatus) because the final position is already drawn. issue.model.ts += `rank:number` + `'rank'` sort.
  - New `features/issues/kanban-board.{ts,html,scss}` — columns by status (computed, re-sorted by rank so optimistic
    patches jump instantly). **CDK pointer DnD** (cdkDropListGroup/cdkDropList/cdkDrag) AND **hand-built keyboard DnD**
    (Space grab, arrows move in/across columns, Esc cancel, refocus-after-render by `data-issue-id`, aria-live assertive).
    Both paths converge on `commitMove` → midpoint-rank → `store.reorder`. CSS: auto-fit columns, `:has(.cdk-drag-placeholder)`
    over-state, container query, CDK drag classes, reduced-motion block.
  - `project-board.{ts,html}` += `?view=kanban` URL toggle (reuses `.filters` style; no new scss). milestones += ch17 ng.
- DECISION (locked): `pageSize` cap is **100** (server `Range(1,100)` from ch04) — BOARD_PAGE_SIZE=100, not 200. My first
  pass used 200 → 400 validation error at runtime; fixed. Board >100 issues would need paging/virtual-scroll (out of scope).
- DECISION: `double Rank` with client-computed midpoints (gap seed 1024) — kept simple; taught the precision limit vs LexoRank.
- Content: wrote `chapters/ch17-kanban-dnd/content.ts` MYSELF (22 steps, 7 quiz, 5 proveIt, exercise=WIP-limit, 6 terms) +
  built the live demo `demos/kanban.demo.*` (mini kanban, keyboard+native drag, break-server toggle → rollback, DestroyRef
  timers). registry ch17 → `ready` + loadContent. (Did NOT delegate — harness rule: no agents unless asked.)
- Runtime-verified (two-server smoke, demo@taskforge.dev, preview on 4500 + API 5080): kanban renders 3 cols
  (Open21/InProgress20/Done19=60 by rank); KEYBOARD reorder persists (issue 2 ArrowDown→rank 4608 exact midpoint;
  ArrowLeft cross-col→InProgress rank 60416; focus follows; aria-live announces "פתוח, 2 מתוך 21"); break-server (fetch
  override 500) → order reverts + grab released + toast "boom"; pointer `onDrop` both branches persist (same-col 10752,
  cross-col 2560 exact midpoints) — verified via real CdkDragDrop event shape (synthetic raw pointer events don't engage
  CDK in the headless harness, a harness limit not an app bug; cdk-drag/cdk-drop-list confirmed attached); 375px → single
  307px col, 3 stacked rows, 0 horizontal overflow; reduced-motion + placeholder + card-transition CSS all shipped; list
  view paging intact ("Page 1 of 2 — 60 issues"); view toggle URL-synced both ways via real router (aria-current moves).
- GOTCHA confirmed (memory): the 4→12 console `InvalidStateError: Transition was aborted` are `withViewTransitions` failing
  because `document.visibilityState==='hidden'` (preview tab not foregrounded) — NOT a feature bug; the kanban load +
  keyboard reorders produced ZERO errors. Same cause makes `preview_screenshot` time out (renderer not painting) — used
  eval/snapshot instead (more precise anyway).
- Gates ALL green: gen:manifest 17 snapshots/1409 entries · verify:coverage 153 files (0 pending) · vitest 108 passed
  (+6 = one describe.each block for ch17; its 6 `it`s incl. panel-region resolution all pass) · guide `pnpm build` clean
  (only pre-existing Mermaid CJS warning) · re-materialized + ch17 client `ng build` 0 errors + ch17 server `dotnet build`
  0/0. `.claude/launch.json` snapshot config ch16 → ch17.
- WHAT'S NEXT: **ch18 — Dashboard & Data Viz** (`04-chapter-specs/ch18-dashboard.md`): summary cards, activity feed,
  stats endpoint(s), derived selectors over the EntityStore/store, hand-rolled SVG charts bound to real data. Snapshot-first
  as usual (backend stats endpoint + client selectors/charts → milestones → compile → two-server smoke → content → gates →
  commit). Reuse the ch17 spine (EntityStore + derived computed) for the dashboard's derived numbers.

### 2026-06-14 — ch17 snapshot pt1: backend rank + reorder + migration — in-progress (Claude)
- Backend ordering model + reorder endpoint (committed next). Decision: `double Rank` with client-computed midpoints
  (simple + correct; teach the precision trade-off vs LexoRank) and REUSE the existing `UpdateAsync(id, apply)` for the
  reorder handler — no new repo method. Files (ch17 server overlay): `Issue.cs` +`Rank` (step-17.1); `IssueContracts`
  +`ReorderIssueRequest` + `Rank` on `IssueResponse` (17.2/17.2b); `EfIssueRepository` +`"rank"` sort (17.3);
  `IssueEndpoints` +`PATCH /api/issues/{id}/rank` (member-authz via IsMemberAsync, UpdateAsync sets Status+Rank) + new
  issues get `Rank = DateTime.UtcNow.Ticks` (17.4/4b/4c); `DbSeeder` gap-based initial ranks 1024,2048,… per project
  (17.5). EF migration `AddIssueRank` generated in `.build` and copied to the overlay (+ updated ModelSnapshot).
  milestones += ch17 dotnet.
- Verified: ch17 server compiles 0/0; curl (demo@taskforge.dev): `sort=rank` → ranks 1024/2048/3072/4096; PATCH
  reorder issue 1 → status Done, rank 1536; anon reorder → 401. gen:manifest 17 snapshots/1405 entries, 102 tests.
- WHAT'S NEXT to finish ch17 (frontend + content):
  1. **Frontend** (`reference/ch17/client/`): `core/state/entity-store.ts` (spine #2: generic signal entity map +
     reusable `optimistic(apply, persist, rollback)` helper); refactor `IssuesStore` to use it WITHOUT changing its
     public surface; client `Issue` model +`rank`; new `kanban-board.{ts,html,scss}` (columns by status, ordered by
     rank) with **accessible DnD** (pointer + keyboard + ARIA live) — CDK DragDrop (`@angular/cdk` already present from
     ch13) or native + keyboard fallback; reorder = optimistic move + client-computed midpoint rank → `PATCH .../rank`,
     rollback on failure; URL view toggle list/kanban; `sort=rank` when kanban. milestones += ch17 ng. Two-server smoke
     incl. KEYBOARD-only reorder + break-server rollback + 375px + reduced-motion.
  2. **Live demo**: self-contained kanban (2–3 columns, draggable fake cards, break-server toggle showing optimistic
     move then rollback, keyboard path), DestroyRef timer cleanup.
  3. **Content**: delegate (template in `05-DELEGATION-GUIDE.md`) with verified facts (rank strategy + endpoint +
     curl examples above, entity-store/optimistic signatures, the a11y interactions ACTUALLY verified). Flip ch17 →
     ready, gates, browser-verify, commit. REMEMBER agent gotchas: no `**`/`*` markdown in prose; every new file needs
     a real code panel (not just filetree); agents can stall after writing — run gates yourself.

### 2026-06-14 — ch16 content + demo done — done (Claude)
- Built the ch16 live demo (`demos/palette.demo.*` — mini always-open palette, fuzzy + keyboard nav + run log,
  reduced-motion safe). Delegated ch16 content to a sonnet agent; it wrote `content.ts` (22 steps) + flipped registry
  to ready, but STALLED on the watchdog right after the registry flip (before running gates). I finished the gates and
  reviewed.
- Review fixes (the agent left two real issues the test does NOT catch): (1) `verify:coverage` failed —
  `SearchResults.cs` was only in a filetree line (no `server/` prefix), never as a panel path; split step 16.11 into
  16.11 (SearchResults.cs panel) + 16.11a (ISearchRepository panel) so both files are covered + shown. (2) the agent
  used raw Markdown `**bold**` (12) and `*italic*` (4) in prose — the inline renderer only does backtick code, so they'd
  render literally; stripped all of them (kept the `/** */` JSDoc in the displayed code panels, which is real code).
- Gates: gen:manifest 16 snapshots, test 102 passed (+6 ch16), verify:coverage 147 files OK, build clean.
- Browser-verified (guide): ch16 chapter renders 22 steps, 0 overflow at 1270px AND 375px (an earlier "225px overflow"
  was a false reading from a 0-width preview window — code panels correctly have overflow-x:auto). Live demo: type
  "dark" → filters to theme command → Enter runs → log "הורץ: …". 0 console errors.
- GOTCHA for future: the content-rules test does NOT catch raw markdown `**`/`*` in prose, nor filetree-only file
  mentions (coverage needs the full `server/`|`client/` path as a panel `file:` or prose literal). Tell content agents
  explicitly: no `**`/`*` emphasis (backticks only), and every NEW file needs a real code panel (not just a filetree row).
- WHAT'S NEXT: commit ch16 content, then **ch17 — Drag-and-drop kanban** (`04-chapter-specs/ch17-kanban-dnd.md`):
  spine piece #2 (entity-store base + optimistic+rollback util), backend rank/order model + reorder endpoint + EF
  migration, accessible pointer+keyboard DnD. Snapshot-first as usual.

### 2026-06-14 — ch16 snapshot pt2: backend search endpoint — in-progress (Claude)
- Added `GET /api/search?q=` as a dedicated search seam (committed `974f074`): Core `SearchResults`/`ProjectHit`/
  `IssueHit`, `ISearchRepository`, `EfSearchRepository` (two membership-scoped `EF.Functions.Like` queries, AsNoTracking
  + Take 5), `SearchEndpoints` (RequireAuthorization, min-length 2 guard), Program.cs DI + MapSearchEndpoints.
  milestones += ch16 dotnet. Chose a separate repo (not editing the 4 existing repo/interface files) to keep the
  overlay small and the seam clean.
- Verified (two-server curl, demo@taskforge.dev): anon→401, q=login→issue hit (status 'InProgress' string),
  q=a→empty (guard), q=Mobile→project hit; membership-scoped. ch16 server compiles 0/0. 96 tests, manifest 1254.
- WHAT'S NEXT to finish ch16 (3 sub-steps):
  1. **Client search-mode**: a small `SearchService` (httpResource over `/api/search?q=` keyed by a debounced query
     signal, undefined when query<2 or logged-out) + integrate into the palette so typing also lists project/issue
     HITS (navigable rows → router.navigate to `/projects/{id}` or `/projects/{pid}/issues/{id}`). Keep local commands
     above hits. Two-server smoke: Cmd-K, type "login", jump to the issue. Commit as ch16 snapshot pt3.
  2. **Live demo**: mini self-contained palette (fake command list + fuzzy + keyboard nav + no-op run/log), timers
     cleaned in DestroyRef — for the content's live-demo panel.
  3. **Content**: delegate ch16 Hebrew content (template in `05-DELEGATION-GUIDE.md`) with verified facts
     (keyboard/registry/fuzzy signatures, palette behavior, search endpoint shape + the curl examples above, demo
     behavior), flip registry ch16 → ready, gates, browser-verify (Cmd-K + search jump + 375px), commit.

### 2026-06-14 — ch16 snapshot pt1: command palette + keyboard spine — in-progress (Claude)
- Built the client command spine (spine piece #1) as a clean compiling increment, committed `bfc4bb7`:
  `core/commands/{command.model,command-registry,fuzzy}.ts`, `core/keyboard/keyboard.service.ts`,
  `features/command-palette/{palette.service,command-palette.ts/.html/.scss}`, app.ts/app.html wiring (bind mod+k,
  register Navigation/View/Identity commands, header ⌘K trigger), app.scss header flex-wrap + mobile padding.
  milestones += ch16 ng.
- Verified: ch16 client compiles; served standalone on 4500 — Cmd-K opens palette, input auto-focused, fuzzy filter
  ('dark' → theme command), Enter runs (theme dark→light) and closes, 0 console errors, 0 overflow at 375px (closed
  AND open after the header wrap fix). Gates: gen:manifest 16 snapshots/1250 entries, 96 tests, build clean.
- Note: a header overflow at 375px appeared when I added the ⌘K trigger; fixed with `flex-wrap` on
  `.header-actions`/`.app-header` + reduced mobile padding in a ch16 `app.scss` overlay (real shell improvement).
- WHAT'S NEXT for ch16 (two increments remain):
  1. **Backend search** (`reference/ch16/server/`): `GET /api/search?q=` returning member-scoped project + issue hits
     (EF.Functions.Like, Take cap, AsNoTracking); add `SearchEndpoints.cs` + repo methods on IProjectRepository/
     IIssueRepository + Ef impls + Program.cs MapSearchEndpoints; contracts `SearchResponse`/hit records. No new
     entity → NO migration. milestones += ch16 dotnet. Then a "search…" mode in the palette (debounced httpResource)
     that lists hits as navigable rows. Two-server smoke (login demo@taskforge.dev): Cmd-K, type, jump to issue/project.
  2. **Content**: delegate ch16 Hebrew content to a sonnet agent (template in `05-DELEGATION-GUIDE.md`) with verified
     facts (command/keyboard/fuzzy signatures, palette behavior, search endpoint shape + example, the mini live-demo),
     flip registry ch16 → ready, gates, browser-verify, commit. Build the ch16 live demo (mini palette) first.

### 2026-06-14 — ch15 content + demo done — done (Claude)
- ch15 content delegated to sonnet agent, then reviewed line-by-line: 17 steps (15.1–15.17) covering auto-fit/minmax,
  subgrid+@supports, container queries (×2 screens), intrinsic toolbar grid, clamp, `:has()`, anchor positioning
  (intro for ch16), scroll-driven animations, OKLCH/color-mix, logical properties, cascade layers, View Transitions
  (intro for ch19), the live playground, pixel-perfect craft. 8 quiz, 5 proveIt, exercise, terms.
- Review fixes: replaced awkward transliteration "מוציון" → `motion`, fixed "contrastz" typo (×2). Agent's panel/region
  refs all resolved; live-demo import path correct; reused ch14 `step-14.11b` region for the View-Transitions tour.
- Built the live demo myself earlier: `CssPlaygroundDemo` (playground.demo.{ts,html,scss}).
- Gates: gen:manifest (15 snapshots, 1109 entries) · test 96 passed (+6 ch15) · verify:coverage 133 · build clean.
- Browser smoke (guide port): chapter renders 17 steps, 0 overflow; playground verified live — mode toggle
  grid→flex→subgrid, container slider to 260px collapses cards to 1 col (container query fires), `:has(input:checked)`
  recolors the parent outline (ember 60%) with no JS class, 0 console errors, 0 overflow at 375px.
- registry: ch15 flipped to `ready` + loadContent. launch.json snapshot config → ch15.
- WHAT'S NEXT: **ch16 — Motion + Command palette** (`04-chapter-specs/ch16-command-palette.md`). Spine piece #1
  (command registry + bus), Cmd-K palette (anchor positioning from ch15), keyboard service; backend search endpoint.
  Snapshot-first: build overlay (client palette/keyboard/command files + server SearchEndpoints) → milestones → compile
  → two-server smoke → delegate content → review → gates → commit.

### 2026-06-13 — Review of codex Phase 0 + ch15 snapshot/demo — in-progress (Claude)
- Reviewed codex's committed work after the handoff: `743ce36` token foundation, `3919f87` component adoption,
  `47f7712` companion re-skin, `27811b6` roadmap renumber. **Verdict: good, in-sync, gate-green.** Specifically
  confirmed: registry ch00-14 untouched (`ready`), ch15-20 new Wave 4 (`soon`), ch21-26 shifted (`soon`), wave nos
  0-6 sequential; codex SYNCED prose (ch09 focus line now `var(--ember)`, added motion/elevation/field/dialog/toast
  lines; ch08 content teaches the new token dimensions). No fixes needed.
- Runtime-verified the cumulative app (two-server smoke, demo@taskforge.dev): project cards elevated + auto-fit grid,
  board toolbar intrinsic grid collapsing to 1 col at 375px (container query fires), virtual scroll 11 rows /
  "Page 1 of 2 — 60 issues", new-project dialog opens with `tf-dialog-in` animation + shadow. 0 console errors,
  0 overflow desktop + 375px. ch15 client `ng build` clean.
- Committed codex's in-progress ch15 snapshot (2 refined SCSS + milestone) as `c7f7b7d` after review. Built the ch15
  live demo myself: `src/app/chapters/ch15-modern-css/demos/playground.demo.{ts,html,scss}` (CssPlaygroundDemo —
  grid/subgrid/flex segmented control + container-width slider + `:has()` selection; reduced-motion safe; uses v2
  tokens confirmed present in companion). Verified all v2 tokens exist in `src/styles.scss` before using them.
- Updated `.claude/launch.json` snapshot config ch13 → ch15.
- Gotcha: re-confirmed the EPERM pattern — stop the snapshot API + preview before any materialize.
- WHAT'S NEXT: ch15 content delegated to sonnet agent (writes `content.ts` + flips registry to ready). On return:
  review per `05-DELEGATION-GUIDE` checklist, run gates, browser-verify the chapter + the playground demo (navigate to
  the live-demo step; toggle modes + slider + `:has()`), commit ch15 content, then start ch16 (command palette).

### 2026-06-13 — Roadmap sync: Craft & Polish wave inserted — done
- What I did: Inserted the new Wave 4 Craft & Polish as ch15-ch20 in the registry, shifted the old Quality
  placeholders to ch21-ch22, shifted Production to ch23-ch26, and synced the long-form plan plus project context
  files that still pointed to the old 21-chapter/ch15-testing roadmap.
- Where: `src/app/core/registry/registry.ts`, `context/plan.txt`, `context/MEMORY.md`,
  `context/taskforge-companion-project.md`, `context/CH07-09-PLAN.md`, `context/last_message_prev_run.txt`,
  and this progress log. Implementation commit `27811b6`; this progress-log correction is committed separately.
- Gate outcomes: `pnpm gen:manifest` clean (14 snapshots, 976 entries) · test 90 passed · verify:coverage 133 files ·
  build clean with only the pre-existing Mermaid CommonJS warning.
- Runtime smoke / 375px sweep: Guide `http://127.0.0.1:4400` home verified in the in-app browser. Desktop roadmap
  showed 27 chapters, Wave 4 Craft & Polish, ch15 Modern CSS 2026, ch21 Testing, and ch23 Hardening, with old
  ch15-testing/ch17-hardening pairings absent. Desktop and mobile `375px` had `scrollWidth === clientWidth`; mobile
  kept the hero gradient removed; console warnings/errors were 0.
- Decisions made / values locked: Built chapters ch00-ch14 remain unchanged. Only unbuilt `soon` metadata moved.
  The taught-app command palette is now in scope for ch16; personal notes and printable summaries remain out of scope.
- Surprises / deviations from the spec: Several older context handoffs still said `21 chapters / 6 waves` or
  `NEXT = ch15 testing`; those were updated so future continuation starts from ch15 Modern CSS 2026.
- WHAT'S NEXT: Regenerate/verify/build, browser-check the roadmap, commit this metadata sync, then start ch15
  snapshot-first if the tree is clean enough.

### 2026-06-13 — Phase 0b: companion guide re-skin — done
- What I did: Re-skinned the guide shell onto the same v2 vocabulary as the taught app: neutral surface ramp, one
  ember accent, semantic status colors, density/radius/motion/elevation tokens, tokenized focus rings, and quieter
  shell/card/source-browser transitions. Removed the reported home hero gradient and the remaining guide-level
  gradients from the shell/chapter/source/demo surfaces without adding new guide features.
- Where: `src/styles.scss`, `src/app/app.scss`, `src/app/core/ui/home/home.scss`,
  `src/app/core/ui/chapter-page/chapter-page.scss`, `src/app/core/ui/panels/code-panel.scss`,
  `src/app/core/ui/panels/live-demo-panel.ts`, `src/app/core/ui/source-browser/source-browser.scss`.
  Implementation commit `47f7712`; this progress-log correction is committed separately.
- Gate outcomes: gradient scan clean for guide source · `git diff --check` clean except expected CRLF warnings ·
  test 90 passed · verify:coverage 133 files · guide build clean with only the pre-existing Mermaid CommonJS warning.
- Runtime smoke / 375px sweep: Guide `http://127.0.0.1:4400` verified in the in-app browser. Desktop home and
  `shared-ui-kit` source browser had `scrollWidth === clientWidth`, source browser rendered rows/status chips with
  tokenized transitions/radius/shadow, and computed gradient count was 0. Mobile `375px` home + chapter + source
  browser also had no horizontal overflow. Light mode computed `data-theme="light"`, warm paper `--bg`, ember hero
  text with no gradient, and no console warnings/errors.
- Decisions made / values locked: The companion keeps existing alias names (`--txt`, `--sur3/4`, `--eglow`, etc.)
  while adding the v2 primitives. Code blocks stay dark in both themes. No feature work or roadmap content changed
  in this unit.
- Surprises / deviations from the spec: The in-app browser exposes both desktop and mobile theme buttons in the DOM;
  the visible desktop toggle was coordinate-clicked after rectangle verification because locator targeting the hidden
  duplicate was flaky.
- WHAT'S NEXT: Run the roadmap sync: insert Wave 4 Craft & Polish as ch15-ch20, shift old Quality/Production
  placeholders to ch21-ch26, update registry/plan/progress together, regenerate manifest, run gates, and browser-check
  the home roadmap.

### 2026-06-13 — Phase 0a: component adoption + content sync — done
- What I did: Completed the visible ch09 primitive adoption of the ch08 v2 token vocabulary. Buttons, fields, dialogs,
  toasts, badges, and project cards now use the additive motion/elevation/density/radius tokens without renaming any
  existing token. Synced ch08/ch09 prose and the inline badge snippet so panels no longer show unexplained motion,
  elevation, focus, or density code.
- Where: `reference/ch09/client/src/app/shared/ui/{button,badge,field,dialog,toast}/*.scss`,
  `reference/ch09/client/src/app/features/projects/project-card.scss`,
  `src/app/chapters/ch08-design-system-css/content.ts`, `src/app/chapters/ch09-shared-ui-kit/content.ts`,
  regenerated `guide-manifest.generated.ts`. Implementation commit `3919f87`; this progress-log correction is committed separately.
- Gate outcomes: gen:manifest clean (14 snapshots, 976 entries) · test 90 passed · verify:coverage 133 files · guide
  build clean (only pre-existing Mermaid CommonJS warning) · cumulative ch14 client `ng build` passed after installing
  the materialized client's declared dependencies.
- Runtime smoke / 375px sweep: API `http://127.0.0.1:5080` + client `http://localhost:4500` verified. Login
  `demo@taskforge.dev / Passw0rd!` succeeds; project list renders seeded projects; dialog, primary button, badge,
  card, and toast computed styles show the new tokenized shadow/motion/density values; desktop, light mode, mobile
  `375px`, and mobile dialog all had `scrollWidth === clientWidth`; browser logs had 0 warnings/errors.
- Decisions made / values locked: Keep the current additive strategy and cited legacy hex/clamp values for now. Full
  OKLCH remap remains a deliberate future content upgrade because current ch08 prose still teaches exact old values.
- Surprises / deviations from the spec: Browser login must use `http://localhost:4500`, not `127.0.0.1:4500`, because
  the snapshot API base and CORS policy are keyed to `localhost`. Direct ch14 client compile required `pnpm install`
  inside `reference/.build/ch14/client` so `@angular/cdk` could resolve.
- WHAT'S NEXT: Phase 0b — re-skin the companion guide site itself from `04-chapter-specs/companion-reskin.md`, then
  renumber the old soon placeholders before starting ch15.

### 2026-06-13 — Phase 0a: design-system v2 token foundation — in-progress
- What I did: Implemented the v2 token VOCABULARY additively (no existing value changed) so all later craft chapters
  have it with zero visual-regression risk. Audited token usage first (`var(--…)` across `reference/**` scss + companion);
  confirmed `_tokens.scss`/`_base.scss` are owned only by ch08 (edits reach `.build/ch14`); confirmed ch08 PROSE
  hardcodes `#ff8a3d/#2dd4bf/#0f1217/#e06616` + the clamp() values → kept those verbatim to avoid silently breaking the
  teaching. Added accent system, elevation, motion, density, radius, neutral additions, full type/weight scale (regions
  step-8.3b / step-8.5b); `_base.scss` now uses an accent focus-ring + token theme transition + reduced-motion block.
- Where: `reference/ch08/client/src/styles/_tokens.scss`, `_base.scss`, regenerated `guide-manifest.generated.ts`.
  Commit `743ce36` on branch `codex/taskforge-ch14-continuation`.
- Gate outcomes: gen:manifest clean (14 snapshots, 976 entries) · test 90 passed · verify:coverage 133 files · guide
  build clean (only pre-existing Mermaid CJS warning) · cumulative ch14 client `ng build` compiles.
- Runtime/375px sweep: deferred — commit is additive (no value change), real visual verification belongs to the
  component-adoption commit (next).
- Decisions locked: kept cited brand hexes + clamps verbatim; single accent = ember (teal demoted to status); a fuller
  OKLCH re-value + ch08 prose rewrite is a DELIBERATE future content upgrade, not done here (would falsify prose).
- Gotcha hit: materialize EPERM — leftover `TaskForge.Api.exe` + ng/esbuild from `.build/ch14` locked it; killed PIDs,
  re-materialized. Also: piping materialize through `tail` masked its crash exit code — run it un-piped when checking.
- WHAT'S NEXT: **Phase 0a component adoption** — adopt elevation/motion/density in the ch09-owned primitives
  (`reference/ch09/client/src/app/shared/ui/{dialog,toast,button,field}/*.scss`, badge) and `project-card.scss`
  (ch09 owner) for the visible jump; then two-server smoke + 375px/dark-light sweep; commit. After that: companion
  re-skin (`companion-reskin.md`).

### 2026-06-13 — Handoff bundle created — done
- What I did: Ran the grill-me planning session with Oleg; locked the 9 decisions; wrote this `context/craft-upgrade/`
  bundle (00–07 + 8 chapter specs). NO app/snapshot/registry/code changes were made — docs only.
- Where (files + commit hash): `taskforge-companion/context/craft-upgrade/**` (uncommitted at time of writing — commit
  when ready). Local plan mirror: `~/.claude/plans/structured-hugging-globe.md`.
- Gate outcomes: n/a (no code touched).
- Decisions locked: see `01-MASTER-PLAN.md` "9 locked decisions". Design language = neutral + single accent (best
  practice), additive token retrofit; all four craft surfaces in scope; hand-roll architecture then @ngrx/signals
  capstone; companion polish-only; backend grows to match; craft wave (ch15–20) before the shifted testing/production waves.
- Surprises: none.
- WHAT'S NEXT: **Phase 0a** — implement Design-Language v2 per `02-DESIGN-LANGUAGE-V2.md` into
  `reference/ch08/client/src/styles/_tokens.scss` (additive; rename nothing), run Procedure A in
  `03-PROPAGATION-AND-SYNC.md`, get all 6 gates + visual sweep green, commit, then log the FINAL token names/values here
  so every later spec uses the real names. (Also do the placeholder renumber ch15–20 → ch21–26 around this time.)
