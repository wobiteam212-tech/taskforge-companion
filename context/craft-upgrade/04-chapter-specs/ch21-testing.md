# Spec — ch21: Testing (PROPOSAL / DRAFT — confirm decisions with Oleg before building)

**Status:** DRAFT. ch21 was a shifted placeholder (no grill-me session yet). This file proposes a scope so the next
session can build fast; the **OPEN DECISIONS** block below must be confirmed with Oleg first (testing scope is a real
design fork — depth, tools, and how much e2e).

**Type:** new forward chapter, opens **Wave 5 (Quality)**. **Spine payoff:** the seams built across ch02–ch20
(`IProjectRepository`, `IIssueRepository`, `ICommentRepository`, `IStatsRepository`, `IActivityRepository`,
`IAttachmentRepository`, `ISearchRepository`, the signal stores, and the pure utils) were designed for testability —
this chapter cashes that in.

## Goal

Teach a pragmatic, layered testing strategy for the hand-built stack: fast pure-unit tests, server endpoint/repository
tests against a real-but-disposable DB, and Angular store/component tests — then a thin e2e smoke. The lesson:
"the seams we built are *why* this is testable; here is the test that the interface was for."

## OPEN DECISIONS (confirm with Oleg)

1. **Breadth vs depth** — one focused chapter (recommended: a representative test in each layer + the mental model), or
   split into ch21 backend-tests + ch22 frontend-tests? (Proposal: ONE chapter, representative tests, since the patterns
   repeat.)
2. **Backend test stack** — xUnit + `Microsoft.AspNetCore.Mvc.Testing` (`WebApplicationFactory`) for endpoint tests +
   EF Core **SQLite in-memory** (`Microsoft.Data.Sqlite` shared connection) for repository tests. Confirm xUnit (vs
   NUnit/TUnit) and whether to include `WebApplicationFactory` integration tests or stay at repository+handler unit level.
3. **Frontend test stack** — the snapshot client already has **vitest** + jsdom configured. Use it for: pure utils
   (`markdown.ts`, `fuzzy.ts`, kanban rank-midpoint math, dashboard derived selectors), store tests
   (`IssuesStore`/`@ngrx` + a hand-rolled store with `HttpTestingController`/`provideHttpClientTesting`), and a
   component test or two (`MarkdownEditor` mention autocomplete, a dumb component). Confirm depth.
4. **e2e** — include a thin Playwright smoke (login → board → create issue → kanban reorder)? Adds a real dependency +
   CI weight. (Proposal: DESCRIBE/teach e2e and provide ONE Playwright smoke spec as reference, but keep it out of the
   compiled milestone if it complicates `verify:snapshots`. Confirm.)
5. **Snapshot/milestone shape** — the test files live in the client/server snapshots. The ng milestone already runs the
   client's vitest? (No — `verify:snapshots` runs `ng build`, not test.) Decide whether to add a test-run step to the
   gate, or keep tests as taught code that the guide's own `pnpm test` exercises. (Proposal: backend tests run via
   `dotnet test` in a `tests/` project — `verify-snapshots.mjs` already auto-runs `dotnet test` if a `tests` dir exists;
   frontend tests run in the guide-level `pnpm test`.)

## Backend (`reference/ch21/server/...`) — proposed

- Add a `TaskForge.Tests` xUnit project (the snapshot's first `tests/` dir → `verify-snapshots.mjs` auto-runs
  `dotnet test`). Cover:
  - **Repository test** against SQLite in-memory: e.g. `EfIssueRepository.GetPagedAsync` filter/sort/page, or
    `EfStatsRepository` GROUP BY counts — proves the seam + the EF query.
  - **Handler/endpoint test**: resource-based authz (member 200 vs non-member 403 vs anon 401) on one endpoint, via
    `WebApplicationFactory` OR a direct handler call with fakes — the authz pattern is the highest-value thing to lock.
  - **Pure logic**: `PasswordHasher` round-trip + `FixedTimeEquals`, or the rank seed gap math.
- `milestones.json` += ch21 dotnet (the existing gate auto-runs `dotnet test`).

## Frontend (`reference/ch21/client/...`) — proposed

- Pure unit specs (no TestBed): `markdown.spec.ts` (escape-first XSS + each transform), `fuzzy.spec.ts` (scoring order),
  kanban `rank-midpoint` (between/edges/empty), dashboard selectors (raw counts → view models).
- Store spec with `provideHttpClientTesting`: `IssuesStore` load → entities, optimistic `setStatus`/`reorder` paint +
  rollback on error (flush an error). Shows the SAME test passing against both the hand-rolled and the @ngrx store
  (the seam held → the test held).
- One component spec: `MarkdownEditor` — type `@`, assert the mention popover filters; or the optimistic-comment undo.
- `milestones.json` += ch21 ng (note: ng milestone is `ng build`; the specs run under the guide's `pnpm test`/vitest).

## Architecture (teaching core)

The test pyramid mapped onto THIS app: many pure-unit (utils/selectors/rank), fewer integration (repo+DB, store+http),
few e2e. "Why the interface mattered": show a repo test swapping the EF impl for an in-memory fake via the `I*Repository`
seam. Interview-grade: test doubles (fake vs mock vs stub), why `provideHttpClientTesting` over mocking `fetch`,
deterministic DBs (SQLite in-memory shared connection), and what NOT to test (framework internals, getters).

## Live demo

A tiny in-browser "test runner" visual: a list of assertions (pure functions like rank-midpoint / fuzzy) running live
with pass/fail ticks, so the reader sees red→green without leaving the page. Timers cleaned in DestroyRef. (Or a
`simulator`-style panel showing a test file + its output.)

## Teaching outline (~16 steps, proposed)

Test pyramid for this app; xUnit project setup; SQLite-in-memory repo test; authz endpoint test; what a good assertion
is; vitest pure-unit (markdown/fuzzy/rank/selectors); `provideHttpClientTesting` store test; optimistic + rollback test;
component test (mention popover); the seam-held test (same spec, two store impls); e2e overview (+ one Playwright smoke
as reference); coverage vs confidence; what not to test. Quiz ≥6, proveIt ≥4 (`dotnet test` green; `pnpm test` green;
a deliberately-broken impl turns a test red; authz test proves 403), exercise (add a test for a chosen seam), terms ≥6
(test pyramid, test double, WebApplicationFactory, SQLite in-memory, provideHttpClientTesting, arrange-act-assert, …).

## Verification

- Snapshot compiles; `dotnet test` green (auto-run by the gate if a `tests/` dir exists); guide `pnpm test` green
  including the new specs. Two-server smoke unaffected (tests don't change runtime behavior).

## Done when

Decisions confirmed → snapshot built + tests pass + content (delegable) + gates + review + commit + progress log.
Then ch22 (Perf & a11y) — also needs its own spec/grill-me pass.
