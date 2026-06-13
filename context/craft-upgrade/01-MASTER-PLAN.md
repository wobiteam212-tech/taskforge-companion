# 01 — Master Plan: TaskForge "Craft & Polish" Level-Up

## Context (why this exists)

After ch00–14 the taught app works but feels **too narrow and too plainly styled**, and the guide site itself
**lacks polish**. The owner (Oleg) wants the project to be **harder to build — visually, architecturally, UX-wise —
so he learns more**, with special weight on **pixel-perfect modern-CSS (2026) layout craft**. He builds the app by
hand from the guide, so "harder" must show up as richer chapters, not just a prettier screenshot.

Goal: make TaskForge a **Linear-grade** issue tracker (beautiful, opinionated, keyboard-first), expand the curriculum
(especially CSS + state architecture + backend depth), and keep the companion's teaching perfectly in sync — **without
breaking the 14 built chapters.**

## The 9 locked decisions

1. **Ambition** = Linear-grade craft. Stay an issue tracker; add **depth**, not breadth.
2. **Sequencing** = hybrid. Retrofit the **visual** foundation at its source (ch08 tokens, in place). Layer **features
   and architecture** forward as new chapters.
3. **Design language** = industry-standard **neutral + single-accent**, best-practice 2026 (Linear/Radix/shadcn
   lineage). Unify the taught-app and companion token sets (they've drifted). CSS becomes a much larger part of the course.
4. **CSS curriculum** = BOTH a dedicated "Modern CSS 2026" reference chapter AND applied pixel-perfect practice woven
   through every craft surface.
5. **Surfaces** = all four: command palette + keyboard system · drag-and-drop kanban · dashboard + data-viz · rich
   issue detail + activity.
6. **Architecture spine** = hand-roll deep first (entity-store base, optimistic-update+rollback utility, command/action
   bus, undo/redo, derived selectors), THEN a capstone chapter mapping one store to `@ngrx/signals`.
7. **Companion site** = polish + re-skin only (apply the new language; fix states/transitions/mobile). No new guide
   features (no palette for the guide).
8. **Backend** = grow to match: issue ranking/reorder, dashboard aggregation, activity/event log, attachments, search.
9. **Cadence** = new Wave 4 "Craft & Polish" at ch15+, opening with the green-gated foundation retrofit. The originally
   planned testing/perf/production waves shift to ch21–26 and then cover the richer app.

## Roadmap (net ≈ 26 chapters)

### Phase 0 — Foundation retrofit (do first; high-ripple; isolate + gate hard)
- Design-language v2 defined in `02-DESIGN-LANGUAGE-V2.md`.
- Retrofit **in place** into ch08 (`reference/ch08/client/src/styles/*`), additive/value-first.
- Mechanically re-skin ch09–14 component SCSS overlays where tokens changed.
- Re-skin the companion guide site (`src/styles.scss` + `src/app/**`).
- Regenerate manifest; **all 18 milestones still compile**; companion renders clean. Commit.
- Specs: `04-chapter-specs/ch08-retrofit.md`, `04-chapter-specs/companion-reskin.md`.

### Wave 4 — Craft & Polish (new chapters ch15–ch20)
| Ch | Title | Frontend | Backend | Architecture | Spec |
|----|-------|----------|---------|--------------|------|
| 15 | Modern CSS 2026 | subgrid, container queries, anchor positioning, cascade layers, `:has()`, OKLCH/`color-mix`, fluid type, logical/RTL, scroll-driven anim, View Transitions API — applied to refine existing screens pixel-perfect | — | — | `ch15-modern-css.md` |
| 16 | Motion + Command palette | motion/easing tokens, keyboard service, Cmd-K palette (portal, focus trap, fuzzy search), shortcuts-help | search endpoint | command/action **registry + bus** (spine #1) | `ch16-command-palette.md` |
| 17 | Drag-and-drop kanban | kanban view, accessible pointer+keyboard DnD, optimistic reorder | rank/order model + reorder endpoint + migration | **entity-store base** + reusable optimistic-update+rollback util (spine #2) | `ch17-kanban-dnd.md` |
| 18 | Dashboard + data-viz | dashboard layout (subgrid/container queries), summary cards, charts, activity feed | aggregation/stats endpoints + activity/event-log table + migration | derived/aggregation selectors (spine #3) | `ch18-dashboard.md` |
| 19 | Rich detail + activity | markdown/rich-text editor, @mentions, attachments, activity timeline, View Transitions board→detail | attachments upload/storage + mentions lookup + activity surfacing | custom form controls (deepen signal forms), optimistic threads + undo/redo (spine #4) | `ch19-rich-detail.md` |
| 20 | State architecture capstone | refactor one store to `@ngrx/signals` | — | consolidate spine, then map to the industry tool (spine #5) | `ch20-state-capstone.md` |

### Wave 5 — Quality (shifted: ch21–22) — out of scope for THIS bundle, planned only
- ch21 Testing: xUnit + WebApplicationFactory (incl. reorder/stats/attachments endpoints), Vitest + TestBed, Playwright e2e for palette + kanban.
- ch22 Performance & a11y: OnPush/zoneless audit, bundle budgets, NgOptimizedImage, CWV, keyboard/screen-reader pass (DnD + palette focus).

### Wave 6 — Production (shifted: ch23–26) — planned only
- ch23 Hardening (OutputCaching for dashboard stats, RateLimiter, health checks, logging) · ch24 Real-time SignalR
  (live kanban + presence) · ch25 Ship it (Docker, compose, CI) · ch26 Capstone (recap + interview-drill finale).

## Registry / numbering changes

- ch00–14: **unchanged** (built).
- The CURRENT registry has placeholder "soon" chapters ch15 testing, ch16 perf, ch17 hardening, ch18 realtime,
  ch19 ship-it, ch20 capstone. These are **unbuilt metadata** → renumber them to ch21–26 and add a new Wave 4 with
  ch15–20 as above. This is the ONLY renumbering allowed and it touches metadata only (no snapshots exist for them).
- Update `context/plan.txt` (the long-form roadmap) to match.

## Scope, trimming, and effort

- This is large (~12 new/changed units). Build strictly one at a time, each independently green and committed.
- **Trim order if time runs short**: drop ch19 (rich detail — ch14 detail already works), then ch18 (dashboard).
  Keep ch15 (CSS), ch16 (palette), ch17 (kanban) — they deliver the biggest visual + architecture jump.
- The architecture spine is introduced incrementally across ch16–19 and consolidated in ch20; if you trim ch19,
  fold undo/redo into ch20.

## Definition of done (per unit)

All five gates green + two-server runtime smoke + 375px/RTL sweep clean + content reviewed line-by-line + committed +
`06-PROGRESS-LOG.md` updated. See `07-REPO-FACTS.md` for exact commands and `03-PROPAGATION-AND-SYNC.md` for the
regenerate→gate procedure.
