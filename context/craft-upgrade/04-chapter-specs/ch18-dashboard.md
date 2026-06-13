# Spec — ch18: Dashboard + Data-Viz

**Type:** new forward chapter. **Spine piece #3:** derived/aggregation selectors. The premier **modern-CSS layout** showcase.
**Trim order:** drop AFTER ch19 (i.e. this is the second-to-keep). Actually per master plan, trim ch19 first, then ch18.

## Goal

A project dashboard: summary cards, charts (issues by status/priority, a trend over time), and an activity feed —
laid out with subgrid + container queries, fed by real aggregation endpoints.

## Backend (`reference/ch18/server/...`) — grow to match

- **Aggregation/stats endpoint**: `GET /api/projects/{id}/stats` returning a projection DTO: counts by status, by
  priority, total open/done, maybe a per-day created/closed series for the trend. Use EF `GroupBy` projections
  (teach GROUP BY → DTO, AsNoTracking). Resource-based authz. Region `step-18.x`. Good **OutputCaching** candidate
  (mention; real caching is ch23).
- **Activity/event log**: new entity `ActivityEvent { Id, ProjectId, IssueId?, UserId, Type, Summary, CreatedAtUtc }`.
  Write events on issue create/update/comment (extend existing handlers minimally, or via a small service). Endpoint
  `GET /api/projects/{id}/activity?take=` returning recent events. **EF migration** (new table) → generate in `.build`,
  copy back. Seed a few events for the demo.
- `milestones.json` += ch18 dotnet + ng.

## Frontend (`reference/ch18/client/...`)

- `core/state/dashboard.store.ts` — httpResource over `/stats` + `/activity`; **derived selectors** (spine #3) that
  shape raw counts into chart-ready view models (computed). Stable public surface.
- `features/dashboard/dashboard.ts/.html/.scss` — dashboard grid (subgrid), summary cards, charts, activity feed.
- Charts: **hand-roll lightweight SVG charts** (bar + donut + sparkline) as small dumb components — teaches data→SVG
  mapping, no heavy dependency. (Avoid adding a charting lib unless you decide to teach one; hand-rolled fits the ethos.)
- Route: add `/projects/:id/dashboard` (or a tab on the project view) + a command-palette command + nav link.
- `milestones.json` ng entry.

## Architecture

Aggregation/derived-selector pattern: raw server numbers → computed view models in the store; components stay dumb.
Reinforces the stable-surface seam.

## CSS techniques (the showcase)

**Subgrid** (align cards across rows), **container queries** (cards reflow by their own width, not the viewport),
intrinsic sizing, `aspect-ratio` for chart tiles, `clamp()` fluid spacing, OKLCH for chart series colors derived from
the accent, motion tokens for bars/donut reveal (scroll-driven or on-load, reduced-motion safe).

## Live demo

A dashboard-in-miniature: fake stats, the hand-rolled SVG bar/donut/sparkline reacting to a "regenerate data" button,
showing the data→view-model→SVG pipeline. Timers cleaned.

## Teaching outline

~16–18 steps: GROUP BY projections, the stats DTO, the activity-log entity + migration, derived selectors, hand-rolled
SVG charts (coordinates, scales, accessibility of charts), the subgrid/container-query dashboard layout. Quiz ≥6,
proveIt ≥3 (open dashboard, numbers match DB; resize → cards reflow; create an issue → activity updates), exercise
(add a new stat tile or chart), terms ≥6.

## Verification

- Snapshot compiles (dotnet incl. migration + ng). Gates green.
- Two-server smoke: stats match seeded data; activity reflects actions; dashboard reflows at 375px via container queries
  (not media queries); charts render + are reduced-motion safe; 0 console errors.

## Delegation prompt

Standard template + verified facts: the stats/activity DTO shapes + real example responses, the chart components'
inputs, the derived-selector signatures, the demo behavior.

## Done when

Gates + smoke + review + commit + progress log.
