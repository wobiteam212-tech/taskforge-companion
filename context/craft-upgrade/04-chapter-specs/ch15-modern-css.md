# Spec — ch15: Modern CSS 2026 (reference + applied)

**Type:** new forward chapter. Frontend-only snapshot. Opens Wave 4.
**Why now:** the owner specifically wants to be excellent at pixel-perfect, modern-CSS layout. This is the technique
reference; later craft chapters apply it.

## Goal

Teach the modern CSS toolkit (2026 best practice) AS the way we'll build the upcoming surfaces, applied by refining real
existing screens pixel-perfect. Reader comes out able to reach for the right tool per layout problem.

## Topics (each a step, each with a worked example on a real TaskForge screen)

- **Layout**: CSS Grid mastery, **subgrid**, intrinsic sizing (`min-content`/`fit-content`/`minmax`), `aspect-ratio`.
- **Responsive without breakpoints**: **container queries** (`container-type`, `@container`), fluid type/space with
  `clamp()`, `min()/max()`.
- **`:has()`** relational selectors (parent/sibling state) — replace JS-toggled classes where possible.
- **Anchor positioning** (`anchor-name`/`position-anchor`) for menus/popovers/tooltips — used by the ch16 palette + ch17 menus.
- **Cascade layers** (`@layer`) recap + why the design system uses them.
- **Color**: OKLCH, `color-mix()`, relative color syntax; building tints/shades from one accent.
- **Logical properties & RTL** (the app is RTL) — `inline/block`, `margin-inline`, `text-align: start`.
- **Motion**: `transition` with motion tokens, **scroll-driven animations** (`animation-timeline: view()/scroll()`),
  the **View Transitions API** (intro; ch19 uses it for board→detail).
- **Pixel-perfect craft**: optical alignment, spacing rhythm, sub-pixel borders, `::before/::after` for affordances,
  building a component to a spec.

## Snapshot files (`reference/ch15/client/...`)

- Refine a couple existing screens as the worked examples (copy full updated files into the overlay with
  `#region step-15.x`): e.g. `features/projects/project-list.scss` (subgrid card grid + container queries),
  `features/issues/issue-board.scss` (intrinsic toolbar + `:has()` states). Keep behavior identical — CSS only.
- Optionally add `styles/_utilities.scss` if you introduce small composable utilities (keep minimal; tokens-first).
- `reference/milestones.json` += `{ "chapter": "ch15", "kind": "ng", "dir": "client" }`.

## Live demo (`src/app/chapters/ch15-modern-css/demos/`)

A **CSS playground** demo component: toggles that visibly switch a sample layout between flex/grid/subgrid, resize a
container to show `@container` reflow, toggle a `:has()` state, and a reduced-motion-safe scroll-driven reveal. Pure
client, no backend. Clean up any timers in `DestroyRef`.

## Architecture / backend

None. Frontend-only.

## Teaching outline

~16–18 steps following the house contract (what/why-now/mental-model/the code/line-by-line/alternatives/gotchas/
diagram-where-it-helps/interview Q&A). Quiz ≥6, proveIt ≥3 (e.g. "resize the container, watch the grid reflow with no
media query"), exercise (rebuild one screen with subgrid + container queries to a given spec), terms ≥6 (subgrid,
container query, anchor positioning, cascade layer, OKLCH, view transition…).

## Verification

- Snapshot compiles (ng build). Gates green.
- Two-server smoke: refined screens are visually identical-or-better, **0 overflow at 375px**, dark+light, reduced-motion.
- Demo click-verified in the guide (use `#step-15.x` fragment if tab hidden).

## Delegation prompt (paste, fill the bracketed verified facts after the snapshot is green)

> Write ch15 "Modern CSS 2026" content for taskforge-companion. Snapshot is built/committed at `reference/ch15/client`.
> Read `context/craft-upgrade/07-REPO-FACTS.md`, `05-DELEGATION-GUIDE.md`, and an existing chapter
> (`src/app/chapters/ch14-issue-detail-comments/content.ts`) for house style. Region map: [list files + regions].
> Verified facts you may state: [exact techniques used in each refined file; the demo's behavior]. Hard rules: no
> unicode arrows in Hebrew prose (even in backticks); `code-inline` is a PanelDef kind not a ContentBlock; one panel per
> step; interview callouts set title=question. Deliver content.ts + flip ch15 registry to ready. Make all gates green:
> `pnpm gen:manifest`, `pnpm test`, `pnpm verify:coverage`, `pnpm build`. Then summarize step count + gate results.

## Done when

Gates green + demo + smoke clean + reviewed + committed + progress log updated.
