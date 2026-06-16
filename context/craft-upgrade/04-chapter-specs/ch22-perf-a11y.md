# Spec — ch22: Performance & Accessibility (PROPOSAL / DRAFT — confirm with Oleg before building)

**Status:** DRAFT, like ch21 was. ch22 is a shifted placeholder with no grill-me session. This proposes a scope; the
**OPEN DECISIONS** must be confirmed before building. Unlike the feature chapters, ch22 is **audit-shaped** (measure →
fix → teach), so scope choice matters more.

**Type:** new forward chapter, continues **Wave 5 (Quality)** after ch21 Testing. **Theme:** make the app fast and
usable for everyone — and teach how to MEASURE both, not guess.

## Goal

Two halves. **Perf:** measure the bundle + runtime, then apply targeted wins (route preloading, deferred loading,
asset/image hygiene) — honoring zoneless's already-good change detection. **A11y:** audit the interactive surfaces built
across ch09/ch16/ch17/ch19 (dialog, command palette, kanban keyboard DnD, markdown editor + mention popover, toasts),
fix the real gaps, and teach the testing tools (axe / Lighthouse / keyboard-only / screen-reader pass).

## OPEN DECISIONS (confirm with Oleg)

1. **One chapter or split** — perf + a11y in ONE chapter (proposal: yes, they share the "measure don't guess" spine), or
   ch22 perf + ch23 a11y (pushing production to ch24+)?
2. **Perf depth** — just teach measurement (source-map-explorer / esbuild metafile / Lighthouse) + 1-2 concrete wins
   (router preloading strategy, a `@defer` with prefetch), or go deeper (image `loading=lazy`/`ngSrc`, font strategy,
   server response caching — but caching is ch23 Hardening)? Proposal: measurement + router preloading + one `@defer`
   prefetch win; defer server caching to ch23.
3. **A11y depth** — audit + fix the existing features (the highest-value, since they're already built) + teach the tools,
   or also add a global skip-link / focus-visible system / contrast tokens pass? Proposal: do BOTH — a small global a11y
   layer (skip-link, `:focus-visible` audit, prefers-reduced-motion coverage check) AND a documented audit of the
   ch16-19 interactive components with any fixes found.
4. **What's actually broken** — needs a real audit pass first. Many features were already built a11y-aware (ch17 keyboard
   DnD + aria-live, ch16 palette focus-trap via native `<dialog>`, ch09 dialog, reduced-motion blocks). So ch22 may be
   more "verify + teach + small gaps" than "big fixes" — confirm the appetite (deep teaching vs minimal).
5. **Snapshot shape** — perf/a11y are partly non-code (Lighthouse runs, measurements). Decide how much lands as compiled
   snapshot code (e.g. a `provideRouter(withPreloading(...))` change + a skip-link component + any a11y fixes) vs taught
   conceptually with captured numbers. Proposal: ship the concrete code (preloading + skip-link + fixes) as the snapshot;
   teach measurement with real captured numbers (bundle sizes already observed: e.g. project-board chunk ~116-120kB).

## Frontend (`reference/ch22/client/...`) — proposed concrete deliverables

- **Router preloading**: add a preloading strategy to `provideRouter` (custom "preload on idle / after first paint", or a
  built-in one) so lazy routes are fetched ahead of navigation — teach the eager-vs-lazy-vs-preload trade-off. Region `step-22.x`.
- **Deferred prefetch**: take one heavy already-`@defer`-ed block (e.g. the issue board virtual list) and add
  `prefetch on idle`/`on hover` — show the network timing difference.
- **Skip-link + focus system**: a global "skip to content" link in the app shell + a `:focus-visible` audit; verify
  `prefers-reduced-motion` coverage across the craft features.
- **A11y fixes** from the audit (whatever the audit finds — e.g. missing `aria-current`, label gaps, focus-return after
  dialog/palette close, the kanban announcements). Keep `IssuesStore`/components' public surfaces stable.
- `milestones.json` += ch22 ng.

## Backend

None expected (caching/compression belong to ch23 Hardening).

## Live demo

A "measure it" demo: a small interactive that shows the same list rendered naively vs with `@defer`/virtualization, with
a visible render-time/element-count readout; OR an a11y demo — a focus-trap / keyboard-nav widget with a live "what the
screen reader would announce" log. Timers cleaned in DestroyRef. (Pick per the perf-vs-a11y emphasis decided above.)

## Teaching outline (~16 steps, proposed)

Measure-don't-guess intro; reading a bundle (source-map-explorer / esbuild metafile) with real numbers; lazy vs preload
vs eager; router preloading strategy; `@defer` triggers + prefetch; image/asset hygiene; zoneless CD recap (why we're
already good); the a11y half — the POUR principles briefly, keyboard-only pass of palette/kanban/dialog, screen-reader
mental model + aria-live, focus management (trap + return), skip-link, `:focus-visible`, prefers-reduced-motion, color
contrast (OKLCH from ch08/ch18); axe/Lighthouse how-to. Quiz ≥6, proveIt ≥4 (Lighthouse run; keyboard-only complete a
flow; preloaded chunk appears in network before nav; reduced-motion kills animations), exercise (fix one a11y gap or add
a preload trigger), terms ≥6 (preloading, code-splitting, `@defer`, focus trap, aria-live, skip-link, contrast ratio, …).

## Verification

- Snapshot compiles (ng). Gates green. Two-server smoke: preloaded chunks fetched ahead of nav (network panel); every
  interactive feature operable keyboard-only with correct announcements; reduced-motion honored; **dual-width layout
  check (1280 + 375)** clean; 0 console errors. (Lighthouse/axe numbers captured for the content where claimed.)

## Done when

Decisions confirmed → audit pass → snapshot built + verified + content (delegable) + gates + review + commit + progress
log. Then Wave 6 production: ch23 Hardening (caching/compression/rate-limit/secrets), ch24 Realtime (SignalR), ch25 Ship
(deploy/CI), ch26 Capstone.
