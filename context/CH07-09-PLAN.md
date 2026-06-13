# TaskForge Companion — Chapters 07/08/09 Plan + Full Handoff Context

> Written 2026-06-11. Self-contained: everything done so far, all conventions, and the
> detailed file/step plan for ch07–ch09 so any agent (codex / Claude / human) can continue cold.

---

## 1. What this project is

`taskforge-companion/` is an Angular v22 app that IS a guide: it teaches Oleg to hand-build
**TaskForge** (project/issue tracker) — .NET 10 Minimal API backend + Angular v22 client.
Oleg types every line of the *taught* app himself; we build only the guide + verified
reference snapshots. Hebrew RTL prose, English code. Historical note: this ch07-ch09 handoff was written before the
craft upgrade; the current roadmap is 27 chapters / 7 waves.

- Wave 0: setup (ch00) ✅
- Wave 1 backend: ch01 anatomy ✅, ch02 layers ✅, ch03 EF+SQLite ✅, ch04 full API ✅, ch05 Auth/JWT ✅
- Wave 2 frontend foundation: ch06 Angular foundation ✅, **ch07 architecture / ch08 design system / ch09 UI kit ← THIS PLAN**, ch10 routing, ch11 HTTP+state
- Wave 3 features (ch12–14), wave 4 craft/polish (ch15–20), wave 5 quality (ch21–22), wave 6 production (ch23–26)

Registry (`src/app/core/registry/registry.ts`) is the single source of truth for
chapter ids/slugs/titles/blurbs. ch07–ch11 entries are LOCKED:

| id | slug | scope (from blurb) |
|---|---|---|
| ch07 | frontend-architecture | core/shared/features, smart vs dumb, state boundaries, client contracts mirroring server DTOs. **NO HttpClient** |
| ch08 | design-system-css | tokens, @layer, logical properties + RTL, container queries, color-mix, clamp, dark mode |
| ch09 | shared-ui-kit | button/field/badge/dialog/toast as dumb signal components, projection, a11y |
| ch10 | routing | lazy loading, guards/resolvers, URL as state, route input binding |
| ch11 | http-state | httpResource/resource, functional interceptors, signal stores, ProblemDetails end-to-end |

**Consequence:** ch07's data layer is a MOCK signal store (in-memory seed mirroring the
server's DbSeeder). HttpClient/CORS arrive in ch11, which swaps the mock behind the same
interface — the same "seam pays off" narrative as backend ch02→ch03.

## 2. Current state (all verified green as of 2026-06-11)

Commits on main (newest first):
- `3ae15ae` ch06 content (15 steps, ready)
- `af14a99` ch06 snapshot (v22 client scaffold + SignalsDemo)
- `c4ea4df` ch05 deepened (5.3b seam / 5.6b migration tour / 5.10b ClaimsPrincipal) + `.gitattributes` (generated manifest eol=lf)
- `1bc4817` codex quality pass (source-browser component, rail layout fix, deterministic manifest, deleted-files support, ch04 step 4.1b, ch05 base content)

Gates state: **42 vitest tests green, verify:coverage 60/60 ready files, build green,
verify:snapshots all milestones compile (ch01–05 dotnet, ch06 ng).**

Ready chapters: ch00–ch06. Glossary ~40 terms. Drill page grows from interview callouts
(callout `tone: 'interview'` — its `title` MUST be the literal interview question).

### Taught-app state after ch06 (cumulative snapshot)
- `server/` — full .NET 10 API: 3 projects (Api/Core/Infrastructure), EF Core 10 + SQLite,
  2 real migrations, JWT auth + refresh rotation, ProjectMember 403 authorization,
  issues CRUD + filtering/paging/validation/ProblemDetails/OpenAPI. Port 5080.
- `client/` — fresh Angular v22 scaffold (pnpm dlx @angular/cli@22, scss, no ssr), zoneless
  explicit (`provideZonelessChangeDetection()`), App = title signal + tagline computed,
  minimal header shell, empty routes, vitest spec using `whenStable()`. Port 4500.
  `assets: []` in angular.json (no binary files allowed in snapshots — manifest embeds text).

### Server wire contracts the client must mirror (READ from reference/, do not invent)
JSON is camelCase; enums serialize as PascalCase member names (`new JsonStringEnumConverter()`
default — wire values are `"Open" | "InProgress" | "Done"`, `"Low" | "Medium" | "High" | "Critical"`,
`"Member" | "Admin"`, `"Member" | "Owner"`).
- `ProjectSummary` → `{ id: number; name: string; description: string | null; openIssues: number }`
- `IssueResponse` → `{ id; title; description: string | null; status: IssueStatus; priority: IssuePriority; projectId: number; createdAtUtc: string; labels: LabelResponse[] }`
- `LabelResponse` → `{ id: number; name: string; color: string | null }`
- `PagedResult<T>` → `{ items: T[]; total: number; page: number; pageSize: number; totalPages: number }` (totalPages is a get-only property — it DOES serialize)
- `AuthResponse` → `{ accessToken: string; refreshToken: string; expiresAtUtc: string; user: UserResponse }`
- `UserResponse` → `{ id: number; email: string; displayName: string; role: UserRole }`

DbSeeder seeds 3 projects ("Website Redesign"-style — read `reference/ch03/.../DbSeeder.cs`
+ ch05 overlay for exact names/issues) — the ch07 mock store should mirror those seeds.

## 3. Architecture of the companion (how the guide machine works)

- `core/registry/` — `ChapterMeta` (eager) + lazy `loadContent()` per chapter returning
  `ChapterContent { steps, quiz, proveIt, exercise }`. Steps have `blocks: ContentBlock[]`
  + exactly ONE `panel: PanelDef`.
- Panel kinds: `code` (manifest file + optional `region` + `diff` gutter) / `code-inline`
  (`{ kind, lang, code, file? }` — PanelDef ONLY, **not** a ContentBlock kind!) / `diagram`
  (mermaid) / `filetree` (annotated lines) / `simulator` (req/res scenario) / `live-demo`
  (`load: () => import('./demos/x.demo').then(m => m.X)`) / `app-tree` (cumulative snapshot explorer).
- `reference/chNN/` = overlay model: ONLY files created/changed by that chapter
  (+ `_delete.json` array for deletions). `tools/generate-guide-manifest.mjs` builds
  `guide-manifest.generated.ts` (committed; regenerated by start/build): cumulative `files`
  per chapter + `changes` (added/modified/deleted) + `#region step-N.M` extraction + LCS
  changed-lines diff. Deterministic (CRLF-normalized, sorted).
- `reference/milestones.json` — compile gates: `kind: "dotnet"` (dotnet build) or
  `kind: "ng"` (pnpm install + ng build in materialized `.build/` tree).
- `tools/verify-coverage.mjs` — every snapshot file of a READY chapter must appear as a
  literal path somewhere in `src/app/chapters/**` (ready-chapter-aware; pending chapters
  reported but not required).
- `src/app/chapters/content-rules.spec.ts` — per-ready-chapter machine gates: 8+ steps,
  unique ids, 1 panel each, **arrow ban (→ ➜ ⇒) in all prose** incl. captions/simulator,
  manifest-backed panel file+region resolution, interview title required, quiz integrity
  (4+ questions, options/answer/explain), 3+ proveIt, exercise, 2+ terms.
- Chapter UI: two-pane scrollytelling (steps right RTL, sticky stage left), IntersectionObserver
  activation, container-width layout via ResizeObserver on `.scrolly` (narrow < 1040px,
  step rail ≥ 1260px in its own grid column), endcap tabs (Quiz / Prove-it / Exercise /
  source-browser). `source-browser` component = hierarchical tree + status/scope filters +
  NEW/MOD/DEL badges + deleted-file preview.

## 4. The build pipeline per chapter (FOLLOW THIS)

1. **Snapshot first (precision work — main agent/codex itself):** create `reference/chNN/client/...`
   overlay files with `// #region step-N.M` markers where step panels need slices.
   Add `{ "chapter": "chNN", "kind": "ng", "dir": "client" }` to `reference/milestones.json`.
   Run `pnpm gen:manifest` then `pnpm verify:snapshots` → must compile.
2. **Demos (precision work):** live-demo components under `src/app/chapters/chNN-<slug>/demos/`.
   Hebrew UI, `.ltr` islands for code-ish content, signals only, follow ch01/ch06 demo style.
   Note: demos are only type-checked once content references them (lazy import) — gates catch it.
3. **Content (delegate to a cheaper agent — sonnet — with a hardened prompt):** agent creates
   `src/app/chapters/chNN-<slug>/content.ts` + flips registry to `ready` + adds loadContent.
   The prompt must include: exemplar files to read (ch05+ch06 content.ts), exact step outline
   with panel kind/file/region per step, the style contract, the no-hack rules below, and the
   gate commands. Agents must NOT touch tools/, spec, demos/, reference/, other chapters.
4. **Review (NEVER SKIP — every delegated draft so far had issues):** checklist in §5.
5. **Gates after review fixes:** `pnpm gen:manifest && pnpm test && pnpm verify:coverage && pnpm build`
   (run serially; never two gate runs in parallel — shared dist/.angular).
6. **Preview verification:** launch config `taskforge-companion` port 4400. Check: step count,
   panel activation, live-demo interaction, arrow TreeWalker scan (skip pre/code/.ltr/svg),
   0 console errors, glossary/drill growth.
7. **Commit** with a descriptive message.

### Known agent failure modes (real incidents — check for these in review)
- **Coverage path-dumping**: ch04 agent dumped 17 future-chapter paths into a callout to satisfy
  verify-coverage. Fixed by making the tool ready-aware + prompt hardening. Still check:
  every file path must appear in the step that actually TEACHES it.
- **Panel/topic mismatch**: ch06 agent gave the effect step (6.12) a panel of an app.ts region
  that contains no effect. Check each panel actually shows what the step discusses.
- **Block/panel duplication**: ch06 agent duplicated the same snippet as a `code` block AND
  the panel (residue of fixing the next item). Check for duplicates.
- **`code-inline` confusion**: it is a PanelDef kind only — as a ContentBlock use `kind: 'code'`
  with `title` = full path (title counts for coverage).
- **Invented claims**: ch06 agent claimed "ch03 prepared us for testing" (it didn't). Verify
  cross-chapter references and any factual claim about file contents against reference/.
- Hebrew grammar slips (~8 per draft): read the prose.

### Review checklist (§5)
- [ ] Steps match outline; ids unique; insertion steps use `Nb` suffix (e.g. `7.3b`) — never renumber.
- [ ] Each panel resolves (file exists in manifest for that chapter; region exists) AND matches the step topic.
- [ ] No arrows (→ ➜ ⇒) in prose; mermaid strings/code blocks exempt.
- [ ] Interview callout titles are literal questions.
- [ ] All chapter snapshot files taught in their right step (no dumps).
- [ ] Demo behavior described accurately (read the demo source).
- [ ] Quiz answers actually correct; explains teach.
- [ ] Final step = app-tree + recap ul + "לאן ממשיכים" callout with the REAL next-chapter registry title.
- [ ] Run all gates yourself after edits; then preview-verify.

## 5. Environment gotchas (hard-won — do not rediscover)

- **Preview tab hidden** (`document.visibilityState === 'hidden'`) → IntersectionObserver/rAF
  dead → panels beyond `renderedUpTo` never render via scroll. Workaround: navigate with a
  fragment (`/chapters/<slug>#step-N.M`) which force-renders/activates without IO. Signal-driven
  DOM updates still work in hidden tabs (zoneless scheduler has a setTimeout fallback).
- **`ng` global CLI lies**: banner says 22.0.0 but scaffolds ^21.2.0 deps. Always
  `pnpm dlx @angular/cli@22 ...` for scaffolding.
- **No binary files in reference/** — the manifest embeds file contents as text (favicon was
  excluded from ch06; angular.json has `assets: []`).
- `.build/` rmSync can hit dotnet file locks → run `dotnet build-server shutdown` before
  verify:snapshots.
- `.build/` rmSync ALSO fails if any shell's cwd is parked inside `.build` (Windows dir-handle
  lock) or if a manual `ng build` run inside `.build/...` left an esbuild service alive.
  Never `cd` into `.build` in a persistent shell; if verify fails on `syscall: 'rm'`, cd out,
  check `Get-Process esbuild`, then `rm -rf reference/.build` and rerun.
- Sass: `@use` must precede ALL other rules — the `@layer reset, tokens, base, components;`
  order statement therefore lives in its own `_layers.scss` partial that is `@use`d FIRST
  (modules emit at first-use position). Putting `@layer` at the top of styles.scss breaks
  the build.
- Generated manifest is pinned `eol=lf` via `taskforge-companion/.gitattributes` — if you see
  phantom modified status on other generated files, extend that file.
- pnpm `-C` paths: beware shell cwd drift in long sessions; prefer absolute `-C` paths.
- Preview eval reads need ~900ms settle after navigation (CSS transitions + zoneless).
- Two gate runs must never overlap (shared `dist/` + `.angular/`).
- ng-kind milestones run `pnpm install` per chapter in `.build` (~2min each, pnpm store makes
  repeats fast). With ch07–09 added expect verify:snapshots ≈ 8–10 min cold.

---

## 6. CHAPTER 07 — ארכיטקטורת הקליינט (frontend-architecture)

**Narrative:** the scaffold becomes an architecture. Folders draw the same dependency rule the
backend taught (ch02): `core/` = models + state (no UI), `features/` = smart containers,
`shared/` = dumb reusable pieces (mostly arriving ch09). Client contract models mirror the
server DTOs **by hand** (reading the actual C# records), the mock signal store seeds the same
data as DbSeeder, and the seam (`ProjectsStore` interface-ish boundary) is explicitly the
ch11 swap point. Components: smart `project-list` (injects store) vs dumb `project-card`
(`input()` / `output()` only).

### Reference snapshot: `reference/ch07/client/`
| file | status | content + regions |
|---|---|---|
| `src/app/core/models/api.model.ts` | new | `PagedResult<T>` interface + wire-format comment (totalPages serializes). `#region step-7.4` |
| `src/app/core/models/project.model.ts` | new | `ProjectSummary` interface mirroring Core/Common/ProjectSummary.cs (id, name, description: string\|null, openIssues). Hebrew comment pointing at the C# source file. |
| `src/app/core/models/issue.model.ts` | new | `IssueStatus = 'Open' \| 'InProgress' \| 'Done'`, `IssuePriority = 'Low' \| 'Medium' \| 'High' \| 'Critical'` string unions (wire = PascalCase member names!), `LabelRef`, `Issue` mirroring IssueResponse. `#region step-7.5` around the unions. |
| `src/app/core/models/auth.model.ts` | new | `UserRole`, `AuthUser` (UserResponse shape), `AuthSession` (AuthResponse shape). Short — full use arrives with login (wave 3). |
| `src/app/core/state/projects.store.ts` | new | `@Injectable({ providedIn: 'root' }) export class ProjectsStore` — private `_projects = signal<ProjectSummary[]>(SEED)`, public `readonly projects = this._projects.asReadonly()`, `readonly totalOpenIssues = computed(...)`, method `rename(id, name)` or similar mutation via `update`. SEED mirrors DbSeeder's 3 projects + open-issue counts (read ch05 cumulative DbSeeder for exact names/counts). Big Hebrew comment: "המוק הזה מתחלף ב-httpResource בפרק 11 — הציבור לא ישתנה". `#region step-7.7` (signals) + `#region step-7.8` (seed). |
| `src/app/features/projects/project-list.ts` | new | smart container: `inject(ProjectsStore)`, exposes `store.projects()` to template; selector `tf-project-list`. `#region step-7.9` |
| `src/app/features/projects/project-list.html` | new | `@for (p of store.projects(); track p.id) { <tf-project-card [project]="p" (open)="onOpen($event)" /> } @empty { ... }` |
| `src/app/features/projects/project-list.scss` | new | minimal grid (real styling = ch08) |
| `src/app/features/projects/project-card.ts` | new | dumb: `readonly project = input.required<ProjectSummary>();` `readonly open = output<number>();` no injections. `#region step-7.10` |
| `src/app/features/projects/project-card.html` | new | name, description fallback, openIssues badge-ish span, button emitting `open` |
| `src/app/features/projects/project-card.scss` | new | minimal card |
| `angular.json` | mod | add `"prefix": "tf"` (schematics for new components; app-root stays) — small diff, taught in 7.3 |
| `src/app/app.ts` | mod | imports ProjectList; (routes still empty until ch10 — shell renders the feature directly) `#region step-7.11` |
| `src/app/app.html` | mod | `<tf-project-list />` inside `<main>` |
| `src/app/app.spec.ts` | mod | keep green: shell test unchanged + maybe assert project cards render (3 seeds) |

Milestone: `{ "chapter": "ch07", "kind": "ng", "dir": "client" }`.

### Demo (build before delegation): `chapters/ch07-frontend-architecture/demos/io.demo.ts/html/scss`
"Smart/dumb playground": a fake smart parent with a signal array; a dumb child rendered
twice with `input()`/`output()`; clicking child buttons emits outputs logged visibly;
a toggle showing the child re-renders ONLY from inputs (no service access). Purpose:
make input()/output() data flow visible. Keep ~80 lines like SignalsDemo.

### Step outline (15–16 steps, ids 7.1…7.N)
1. 7.1 why architecture now (diagram: core/features/shared + dependency arrows mirroring ch02's onion)
2. 7.2 the dependency rule on the client (callout linking to ch02; filetree panel of target tree)
3. 7.3 prefix tf + angular.json diff (code panel angular.json, diff)
4. 7.4 PagedResult + api.model.ts — reading a C# record and writing the TS mirror (region step-7.4, code panel; mention totalPages get-only serializes)
5. 7.5 issue.model.ts — string unions, why wire enums are PascalCase strings (JsonStringEnumConverter callout back to ch04 step 4.x) (region step-7.5)
6. 7.6 project.model.ts + auth.model.ts — interfaces vs classes for DTOs (interview Q: "למה interface ולא class למודל API?")
7. 7.7 ProjectsStore: signal in private, asReadonly out (region step-7.7) — state boundary
8. 7.8 the seed mirrors DbSeeder (region step-7.8) — same 3 projects as the API returns; gotcha: mock now, httpResource in ch11, public surface unchanged (THE SEAM, AGAIN)
9. 7.9 smart component: project-list injects the store (region step-7.9)
10. 7.10 dumb component: input.required + output (region step-7.10) — live-demo panel = io.demo HERE or at 7.10b
11. 7.11 wiring the shell (app.ts region step-7.11, diff) — routes still empty, ch10 will own navigation
12. 7.12 template control flow @for/track/@empty in project-list.html (code panel)
13. 7.13 smart-vs-dumb live demo step (live-demo io.demo) — if not used at 7.10
14. 7.14 updating the spec — asserting seeded cards render (code panel app.spec.ts, diff)
15. 7.15 finale: app-tree + recap + tease ch08 (real registry title "מערכת עיצוב ו-CSS מודרני")
Quiz 6 / proveIt 5 (ng serve shows 3 cards; rename via store method in devtools? keep simple; pnpm test; build; track-by experiment) / exercise (add `IssueStatusFilter` dumb component emitting a status union output, or a `totalOpenIssues` computed shown in header) / terms 4+ (smart/dumb, input(), output(), store, projection? projection is ch09 — skip).

---

## 7. CHAPTER 08 — מערכת עיצוב ו-CSS מודרני (design-system-css)

**Narrative:** the client stops looking like a scaffold. A real token system in plain CSS
(custom properties), `@layer` for cascade sanity, logical properties so the UI survives
direction changes, fluid type with `clamp()`, component-level responsiveness with container
queries, status colors derived with `color-mix()`, and a dark/light architecture with
`data-theme` + a small signals ThemeService. The forge palette (graphite + ember #ff8a3d +
teal #2dd4bf) is the taught app's identity too — TaskForge UI may share DNA with the guide.

### Reference snapshot: `reference/ch08/client/`
| file | status | notes + regions |
|---|---|---|
| `src/styles/_tokens.scss` | new | CSS custom props on `:root` + `[data-theme="light"]` override block: color tokens (bg/surface/border/text×3/ember/teal/status colors), radius, spacing scale, type scale with `clamp()`. `#region step-8.3` (colors) `#region step-8.5` (clamp scale) |
| `src/styles/_reset.scss` | new | small modern reset inside `@layer reset` |
| `src/styles/_base.scss` | new | body/typography/base element styles in `@layer base`, logical properties only (margin-inline etc.) |
| `src/styles.scss` | mod | `@layer reset, tokens, base, components;` + `@use` the three partials. `#region step-8.2` |
| `src/app/core/state/theme.ts` | new | ThemeService: `theme = signal<'dark'\|'light'>(...)` , localStorage persist, effect sets `document.documentElement.dataset['theme']`. Mirror companion's own ThemeService idea but minimal. `#region step-8.8` |
| `src/app/app.ts` | mod | inject ThemeService, toggle method |
| `src/app/app.html` | mod | theme toggle button in header |
| `src/app/app.scss` | mod | header restyled with tokens + logical properties |
| `src/app/features/projects/project-list.scss` | mod | responsive grid: `repeat(auto-fill, minmax(min(100%, 280px), 1fr))` + gap tokens |
| `src/app/features/projects/project-card.ts` | mod | (only if needed for status color binding — prefer pure CSS) |
| `src/app/features/projects/project-card.scss` | mod | `container-type: inline-size` on host wrapper + `@container` query reflow; `color-mix` derived openIssues badge. `#region step-8.10` |

Milestone: `{ "chapter": "ch08", "kind": "ng", "dir": "client" }`.

### Demos
1. `demos/cq.demo` — container query playground: drag a resize handle, card inside reflows
   at container (not viewport) breakpoints; show current container width.
2. (optional) `demos/colormix.demo` — color-mix slider blending ember→teal with live swatch.
Keep both small; cq.demo is the priority.

### Step outline sketch (≈15 steps)
@layer mental model (cascade layers beat specificity wars) / styles.scss layer order (region 8.2)
/ tokens: custom properties + naming (region 8.3) / why NOT scss variables for theme values
(callout: runtime vs compile time) / clamp fluid type (region 8.5) / logical properties + RTL
(interview Q; the guide app itself is RTL — point at it) / reset+base layers / ThemeService
signals+effect+localStorage (region 8.8; callback to ch06 effect rules — DOM side effect is a
LEGIT effect use) / dark-light architecture data-theme + prefers-color-scheme initial / container
queries on project-card (region 8.10, cq.demo live panel nearby) / color-mix badge / grid
auto-fill minmax / restyled shell tour / spec still green / finale app-tree + tease ch09.
Exercise: add a `compact` density token set toggled by a second button, or prefers-reduced-motion layer.

---

## 8. CHAPTER 09 — ערכת UI משותפת (shared-ui-kit)

**Narrative:** extract the dumb layer into `shared/ui/` — five components used everywhere
later: `tf-button`, `tf-field`, `tf-badge`, `tf-dialog`, `tf-toast`. All signals-first
(`input()` / `output()` / `model()`), content projection, native-element a11y (real `<button>`,
native `<dialog>` with focus management for free, `aria-live` for toasts). project-card/list
refactored to consume the kit (the payoff diff).

### Reference snapshot: `reference/ch09/client/` (≈16–18 files)
- `src/app/shared/ui/button/button.ts/.html?/.scss` — `tf-button`: `variant = input<'primary'|'ghost'|'danger'>('primary')`, `disabled = input(false)`, `<ng-content/>` projection, host `<button>` semantics (attribute selector `button[tf-button]` is the cleanest a11y move — decide at build time and keep consistent). `#region step-9.3`
- `src/app/shared/ui/badge/badge.ts/.scss` — `tf-badge`: `tone = input<'open'|'progress'|'done'|'count'>()`, tokens from ch08. 
- `src/app/shared/ui/field/field.ts/.html/.scss` — `tf-field`: label + projected input + error text; `model()` two-way value OR projection-only (decide; `model()` teaches the new two-way primitive — prefer it). `#region step-9.6`
- `src/app/shared/ui/dialog/dialog.ts/.html/.scss` — native `<dialog>` wrapper: `open = model(false)`, effect calling `showModal()/close()`, output `closed`; focus trap/restore from the platform. `#region step-9.8`
- `src/app/shared/ui/toast/toast.service.ts` + `toast-container.ts/.html/.scss` — `ToastService` signal array + auto-dismiss timers; container `aria-live="polite"`; wired into app shell. `#region step-9.10`
- `src/app/features/projects/project-card.ts/html/scss` | mod — consume tf-button/tf-badge (diff payoff)
- `src/app/app.ts/html` | mod — toast-container in shell; maybe a demo "new project" dialog trigger (no real create yet — store.add exists from ch07? add store method if needed)
- `src/app/app.spec.ts` | mod — keep green

Milestone: `{ "chapter": "ch09", "kind": "ng", "dir": "client" }`.

### Demos
- `demos/projection.demo` — content projection visualizer (slots highlight where content lands).
- (optional) dialog/focus demo — but the taught native `<dialog>` is demoable via prove-it instead.

### Step outline sketch (≈16 steps)
why a kit + what stays OUT of it (smart things) / attribute-selector button + projection
(region 9.3) / variants via input + host bindings / badge with ch08 tokens / field with model()
two-way (region 9.6; interview Q: model() vs input+output) / native dialog powers (region 9.8;
gotcha: showModal vs open attribute) / dialog effect lifecycle / toast service signal array
(region 9.10) / aria-live + a11y checklist step / refactor diff: project-card consumes the kit
(diff panels!) / projection live demo / spec / finale + tease ch10 routing.

---

## 9. Delegation prompt skeleton (reuse for each chapter's content agent)

Include verbatim sections: read-first list (ch05+ch06 content.ts exemplars, chapter.types.ts,
content-rules.spec.ts, registry.ts, the chapter's demos/, reference/chNN/client files),
deliverables (content.ts + registry flip ONLY), manifest facts (exact file list + region names),
the full step outline, quiz/proveIt/exercise/terms requirements, style contract (Hebrew RTL,
arrow ban chars, RLM ‏ before Latin-leading Hebrew lines, interview title = question,
`code-inline` is panel-only), no-hack rules naming the ch04 coverage incident and ch06 panel
mismatch, gates (gen:manifest, test, verify:coverage, build — serial, absolute -C path),
"fix content never gates", and report format.

## 10. Definition of done per chapter
1. verify:snapshots green including the chapter's ng milestone.
2. All 4 gates green after review fixes.
3. Preview: step count = panel count, demo interactions behave as taught, arrow scan clean,
   0 console errors, glossary/drill grew.
4. Committed on main with descriptive message.
5. Memory file updated (`~/.claude/.../memory/taskforge-companion-project.md`) — keep the
   NEXT section accurate for the following session.
