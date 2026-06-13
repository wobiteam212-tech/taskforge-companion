# 07 — Repo Facts (cold-start reference)

Everything an agent needs to operate this repo without prior context. If something here conflicts with what you
observe in the code, **trust the code** and fix this doc (note it in `06-PROGRESS-LOG.md`).

## What this project is

`taskforge-companion/` is an **Angular v22 app that IS a guide**. It teaches the reader to hand-build **TaskForge**
(a .NET 10 Minimal API + Angular v22 issue tracker), chapter by chapter. The reader types every line of the taught
app themselves; we build only (a) the guide app and (b) **verified reference snapshots** of the taught app that the
guide's code panels are generated from.

- Hebrew RTL prose + English code. **No unicode arrows (→ ➜ ⇒ ← ↦ ⮕) anywhere in Hebrew prose** — machine-scanned, fails tests.
- Preview/launch config name `taskforge-companion`, **port 4400**. Snapshot client serves on **port 4500**, API on **5080**.
- Package manager **pnpm**. Angular is **zoneless** (`provideZonelessChangeDetection()`), signals everywhere.

## Key locations

| What | Path |
|---|---|
| Guide chapters (Hebrew content) | `src/app/chapters/chNN-*/content.ts` (+ `demos/` per chapter) |
| Chapter registry (metadata, ready/soon, routes) | `src/app/core/registry/registry.ts` |
| Content model types | `src/app/core/registry/chapter.types.ts` |
| Guide design tokens | `src/styles.scss` |
| Guide UI components | `src/app/core/ui/**` (home, chapter-page, panels, drill, glossary, source-browser, blocks, quiz) |
| Reference overlays (the answer key) | `reference/chNN/...` — ONLY files created/changed that chapter |
| Materialized cumulative trees (generated) | `reference/.build/chNN/...` — **never edit by hand** |
| Snapshot milestone list | `reference/milestones.json` |
| Generated source manifest (committed) | `src/app/core/source/guide-manifest.generated.ts` |
| Content-quality test | `src/app/chapters/content-rules.spec.ts` |
| Tooling | `tools/generate-guide-manifest.mjs`, `tools/materialize-snapshots.mjs`, `tools/verify-coverage.mjs`, `tools/verify-snapshots.mjs` |
| Handoff notes | `context/` (this bundle lives in `context/craft-upgrade/`) |

## The reference / overlay model (how snapshots work)

- Chapter N's **full app state** = overlay of `ch01 … chN` (later files override earlier). Each `reference/chNN/`
  folder contains **exactly the files you type in that chapter** — same unit the guide teaches.
- `tools/materialize-snapshots.mjs` composes overlays into `reference/.build/chNN/` (cumulative). It **wipes and
  rebuilds `.build`** — so a running dev server / lingering MSBuild daemon locking `.build` causes an EPERM (see Gotchas).
- `reference/milestones.json` = array of `{ "chapter": "chNN", "kind": "dotnet"|"ng", "dir": "server"|"client"|"server/TaskForge.Api" }`.
  Add an entry per new chapter that introduces compilable code.
- **Region markers** in reference files: `// #region step-13.4` … `// #endregion` (or `<!-- #region ... -->` in html/scss).
  The manifest extracts named slices so a code panel can show a focused excerpt of a file that still compiles whole.
- A chapter that adds a backend entity needs an **EF migration**: generate it inside `reference/.build/chNN/server`
  (`dotnet ef migrations add Name`), then **copy the generated files back** into the `reference/chNN/` overlay
  (established in ch03/ch05). Migrations are toured, not hand-typed.

## The content model (`chapter.types.ts`) — exact shapes

```
ChapterContent = { steps: StepDef[]; quiz: QuizQuestion[]; proveIt: ProveItTask[]; exercise?: ExerciseDef }
StepDef       = { id: '13.4'; title; blocks: ContentBlock[]; panel: PanelDef }   // exactly ONE panel per step
ContentBlock  = p | h | ul | ol | code(lang,code,title?) | callout(tone,title?,body) | term(name,definition)
CalloutTone   = tip | warn | gotcha | why | alt | dotnet10 | v22 | interview   // interview: title = the question
PanelDef      = code(chapter,file,region?,diff?,title?)        // a manifest file slice
              | code-inline(lang,code,file?)                   // literal code, no snapshot yet
              | diagram(mermaid,caption?)
              | filetree(lines,title?,caption?)
              | simulator(scenario: DemoScenario)              // backend request/response demo
              | live-demo(load: () => import().then(m => m.X)) // real Angular component
              | app-tree(chapter,title?)                       // cumulative snapshot explorer
```
- `code-inline` is a **PanelDef kind only**, NOT a ContentBlock kind (common mistake).
- Step `id` doubles as the URL fragment (`#step-13.4`).
- Interview callouts MUST set `title` to the question (the drill page renders it).

## The gates (run from `taskforge-companion/`)

| Command | What it enforces |
|---|---|
| `pnpm gen:manifest` | regenerates `guide-manifest.generated.ts` from overlays; **fails on missing file/region refs** |
| `pnpm test` | `content-rules.spec.ts`: per ready chapter — unique step ids, 1 panel/step, **arrow ban** in all prose, panel file+region resolves, interview-callout title present, quiz integrity, ≥3 proveIt, exercise present, ≥2 terms |
| `pnpm verify:coverage` | every file in the final snapshot is taught/toured (appears as a literal string under `src/app/chapters/`) for **ready** chapters; not-yet-ready chapters report as pending |
| `pnpm build` | full Angular production build of the guide |
| `pnpm verify:snapshots` | materializes overlays + compiles every milestone (`dotnet build` / `ng build`). Slow. Passes `/nodeReuse:false` to dotnet. |

**Green definition for a chapter** = all five pass + a two-server runtime smoke (see below) + 375px/RTL overflow sweep clean.

## Per-chapter build loop (the proven pipeline)

1. **Snapshot first** (you, precisely): add/modify files under `reference/chNN/`; add `milestones.json` entries; generate EF migration if needed → `pnpm verify:snapshots` (or compile the one milestone directly) green.
2. **Runtime-prove it**: `node tools/materialize-snapshots.mjs`; `dotnet run` in `reference/.build/chNN/server/TaskForge.Api` (port 5080); `pnpm exec ng serve --port 4500` in `reference/.build/chNN/client`; log in **demo@taskforge.dev / Passw0rd!**; exercise the new surface; confirm zero console/network errors and zero overflow at 375px.
3. **Content** (usually delegate — see `05-DELEGATION-GUIDE.md`): author `src/app/chapters/chNN-*/content.ts` + flip registry meta to `status: 'ready'` + `loadContent`.
4. **Gate**: `pnpm gen:manifest` · `pnpm test` · `pnpm verify:coverage` · `pnpm build`.
5. **Review** the content line-by-line (factual claims vs runtime facts, Hebrew, arrows, demo `@`-escaping), browser-verify the chapter + its demo, then commit.

## Conventions

- Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`. Commit/push only when asked; one branch; never `--no-verify` / force-push.
- `.gitattributes` forces LF on the generated manifest (kills CRLF churn). Other files may warn "LF will be replaced by CRLF" — harmless on Windows.
- House SCSS: `:host`, no `::ng-deep`; logical properties (RTL-safe); design tokens are CSS custom properties (runtime theme switch).
- Demo components: clean up every `setTimeout` in `DestroyRef.onDestroy`.

## Gotchas (each one cost a debug cycle)

- **MSBuild daemons lock `.build` → EPERM on next materialize.** Fix: `dotnet build-server shutdown` (and stop any running snapshot server/preview) before re-materializing. `verify:snapshots` already passes `/nodeReuse:false`.
- **`@container` queries need a `container-type` ancestor** or they silently never fire (caused an 80px mobile overflow in ch13).
- **A literal `@` in visible template TEXT** (e.g. teaching `@defer` as a label) must be written `&#64;` or Angular's control-flow parser breaks the build.
- **Hidden preview tab** (`document.visibilityState === 'hidden'`) suspends IntersectionObserver/rAF — scrollytelling step activation can't be exercised; navigate with a `#step-X` fragment to force a panel render, and read DOM after ~900ms settle (zoneless + CSS transitions).
- **`verify:coverage` is literal-string matching** — a file is "covered" only if its exact path string appears under `src/app/chapters/`. New files MUST be named in a panel `file:` or in prose.
- **Two content/gate runs must not overlap** (shared `.angular`/`dist`) — serialize sub-agents that run gates.

## Credentials / seed (dev only)

- Login: **demo@taskforge.dev / Passw0rd!** (Admin, owner of all seeded projects). Second user: **maya@taskforge.dev / Passw0rd!** (Member).
- Seeded project "Website Redesign" (id 1) has 60 issues (for paging/virtual-scroll). "Mobile App", "Internal Tools" also seeded.

## Current taught-app shape (end of ch14) — what you're building ON

- **Backend**: layered `TaskForge.Core` / `TaskForge.Infrastructure` / `TaskForge.Api`; EF Core + SQLite; entities `User`, `Project`, `ProjectMember(role)`, `Issue(status,priority)`, `Label`, `IssueLabel`, `Comment`. Endpoints via `MapGroup` + named static handlers returning `Results<...>` unions; `[AsParameters]` query records; `TypedResults`; ProblemDetails; `HandlerTimingFilter`; JWT auth (PBKDF2, refresh rotation); resource-based authz (`IsMemberAsync`). Repos behind `IProjectRepository` / `IIssueRepository`.
- **Frontend**: standalone zoneless; `core/shared/features`; signal stores (`ProjectsStore`, `IssuesStore`, `IssueDetailStore`) = `@Injectable({providedIn:'root'})` with `httpResource` + `linkedSignal` + computed; functional interceptors (`auth`, `error`); router with guards/resolvers + `withComponentInputBinding`; shared UI kit (`button` attribute selector, `field`, `badge`, native `<dialog>`, `toast` service); signal forms in ch14 (`[formField]`, async title validation, custom `priority-picker` control).
- **Stores expose a stable public surface** (computed wrappers) so the impl can change without touching components — this is the "seam" the course repeatedly pays off. Preserve it when leveling up.
