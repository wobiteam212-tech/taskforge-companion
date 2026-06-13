# Spec — ch20: State Architecture Capstone (@ngrx/signals)

**Type:** new forward chapter. **Spine piece #5:** consolidate the hand-rolled spine, then map ONE store to `@ngrx/signals`.
Closes Wave 4.

## Goal

Step back and look at the state architecture you built by hand across ch16–19 (command bus, entity-store base,
optimistic util, derived selectors, undo/redo), name the patterns, then **refactor one store to `@ngrx/signals`** to
show how the industry-standard library formalizes exactly what you built — honoring "no magic" first, then the tool.

## Frontend (`reference/ch20/client/...`)

- `package.json` — add `@ngrx/signals` (matching Angular major). This dependency is **confined to this chapter's
  snapshot** — earlier chapters never depend on it.
- Refactor ONE store (recommended: `IssuesStore`, the richest) to `@ngrx/signals`:
  `signalStore(withEntities<Issue>(), withComputed(...), withMethods(...))`, mapping:
  - hand-rolled entity-store base → `withEntities` / `entityConfig`
  - computed selectors → `withComputed`
  - command methods + optimistic util → `withMethods` (+ `rxMethod`/`tapResponse` or keep promise-based)
  - keep the SAME public surface the components consume (so `issue-board`/`kanban` don't change) — this is the lesson:
    the seam held, only the implementation changed.
- Keep the OTHER stores hand-rolled (the comparison is the point). Region `step-20.x`.
- `milestones.json` += ch20 ng.

## Backend

None.

## Architecture (the teaching core)

A side-by-side: "here's the entity-store base I wrote; here's `withEntities` doing the same. Here's my optimistic util;
here's how it maps to a `withMethods` updater + rollback." Discuss: when a library is worth the dependency, what you
give up (control, bundle) and gain (conventions, devtools, team familiarity). Interview-grade content.

## CSS

None new.

## Live demo

A tiny `@ngrx/signals` store demo (counter/list with `withEntities`+`withComputed`+`withMethods`) next to its
hand-rolled twin, showing identical behavior from both. Or a static side-by-side code panel if a live dep-in-demo is
awkward — prefer the live demo if the dependency loads cleanly in the guide's build.

## Teaching outline

~14 steps: recap the spine, why these patterns exist, install `@ngrx/signals`, `withEntities`/`withComputed`/
`withMethods`, the refactor diff (stable public surface!), the trade-off discussion, when NOT to adopt it. Quiz ≥6,
proveIt ≥3 (the refactored store behaves identically; components untouched; bundle delta), exercise (port a second
store, OR add a `withHooks`/custom feature), terms ≥6 (signalStore, withEntities, withMethods, withComputed, custom
feature, …).

## Verification

- Snapshot compiles (ng, with the new dep installed in `.build`). Gates green. Note: `verify:snapshots` runs
  `pnpm install` in the materialized client — confirm `@ngrx/signals` resolves.
- Two-server smoke: the refactored board/kanban behave identically to before; 0 console errors.

## Delegation prompt

Standard template + verified facts: the exact `@ngrx/signals` API shape used, the before/after store signatures, the
preserved public surface, the demo behavior, the measured bundle delta if you captured it.

## Done when

Gates + smoke + review + commit + progress log. Wave 4 complete — update `06-PROGRESS-LOG.md` "what's next" to point at
the shifted Wave 5 (Testing, ch21).
