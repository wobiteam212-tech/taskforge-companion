# Spec — ch17: Drag-and-Drop Kanban Board

**Type:** new forward chapter. **Spine piece #2:** entity-store base + reusable optimistic-update+rollback utility.
**Hardest a11y in the course** — budget extra review.

## Goal

A kanban view of issues grouped into status columns, with **accessible** drag-and-drop (pointer AND keyboard) and
optimistic reordering persisted to the server via a rank model.

## Backend (`reference/ch17/server/...`) — grow to match

- **Ordering model**: add a rank to `Issue`. Recommended: a `string Rank` using **fractional/LexoRank-style** keys
  (teaches ordering-at-scale without renumbering rows) OR a `double SortOrder` (simpler; teaches the midpoint trick +
  its precision limit). Pick one; teach the trade-off. Entity edit: `Issue.cs` (+ default rank on create).
- **Reorder endpoint**: `PATCH /api/issues/{id}/rank` (or `/reorder`) taking the target status + neighbor ranks,
  computes the new rank, persists. Resource-based authz (`IsMemberAsync`). `IIssueRepository.ReorderAsync(...)` +
  `EfIssueRepository` impl. Region `step-17.x`. Update `GetPagedAsync` sort to honor rank for the board view (add a
  `sort=rank` option, keep existing sorts).
- **EF migration** required (new column): generate in `.build`, copy back into `reference/ch17/server/.../Migrations/`.
- Seed: give existing issues initial ranks (update `DbSeeder` deterministically).
- `milestones.json` += ch17 dotnet + ng.

## Frontend (`reference/ch17/client/...`)

- `core/state/entity-store.ts` — **spine #2**: a small generic base for entity collections (signal map, upsert/remove,
  selectors) + a reusable **optimistic mutation helper** `optimistic(apply, persist, rollback)` that the kanban (and
  later detail) reuse. Refactor `IssuesStore` to use it WITHOUT changing its public surface (`issues()`, `setStatus`, …).
- `features/issues/kanban-board.ts/.html/.scss` — columns by status, cards = reuse/adapt `issue-row`/a new `issue-card`.
  DnD: prefer **Angular CDK DragDrop** (`@angular/cdk/drag-drop`) — teach it; OR native HTML DnD + a keyboard fallback.
  Either way: **keyboard DnD is mandatory** (pick up / move / drop via keyboard, ARIA live announcements).
- Optimistic reorder: move the card immediately (linkedSignal/entity-store), call the rank endpoint, rollback on failure
  (toast already shows from the error interceptor). Route: add a board view toggle (list vs kanban) synced to URL.
- If using CDK: `package.json` already has `@angular/cdk` (added in ch13). Confirm; if not, add it.
- `milestones.json` ng entry.

## Architecture

Entity-store base + optimistic util become the reusable spine. Keep store public surfaces stable (Procedure C / sync
rules). The reorder is the canonical **optimistic concurrency** lesson (what if two users reorder? last-write + rank gaps).

## CSS techniques

Grid/flex columns, drag affordances (cursor, elevation-3 on lift, drop placeholder), motion tokens for reflow,
`:has()` for column empty/over states, container queries for column sizing, reduced-motion (no transform animations).

## Live demo

A self-contained kanban demo: 2–3 columns, draggable fake cards, a "break the server" toggle showing optimistic move
then rollback, plus a keyboard-DnD path. Timers cleaned in `DestroyRef`.

## Teaching outline

~18 steps: the rank model + trade-offs (fractional vs float vs integer-renumber — interview), the reorder endpoint,
entity-store base, optimistic util, CDK DragDrop vs native, **accessible DnD** (keyboard + ARIA), URL view toggle.
Quiz ≥6, proveIt ≥4 (drag to reorder; reload persists; break server → rollback; keyboard-only reorder), exercise
(add WIP-limit per column or a new column), terms ≥6.

## Verification

- Snapshot compiles (dotnet incl. migration + ng). Gates green.
- Two-server smoke: drag reorders + persists across reload; **keyboard-only** reorder works with announcements; break
  server → card snaps back + toast; 375px columns usable; reduced-motion ok; 0 console errors.

## Delegation prompt

Standard template + verified facts: the chosen rank strategy + endpoint shape + example, the entity-store/optimistic
signatures, the demo behavior, and the a11y interactions you actually verified (state ONLY verified a11y behavior).

## Done when

Gates + smoke (incl. keyboard DnD) + review + commit + progress log. (If trimming scope, this chapter is a KEEP.)
