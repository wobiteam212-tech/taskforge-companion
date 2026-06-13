# Spec — Phase 0a: ch08 Design-System v2 Retrofit (in place)

**Type:** in-place edit of a BUILT chapter + mechanical re-skin ripple. Highest-risk step → do first, gate hardest.
**Prereq reads:** `02-DESIGN-LANGUAGE-V2.md`, `03-PROPAGATION-AND-SYNC.md` (Procedure A).

## Goal

Replace ch08's token system with Design-Language v2 (neutral ramp + single accent + elevation + motion + density),
**additively** (rename nothing), so the whole taught app (ch08→ch14) looks industry-standard with near-zero code ripple.
Upgrade ch08's *content* to teach the richer system (this is where the CSS curriculum starts getting bigger — the deep
modern-CSS techniques themselves land in ch15).

## Files to change (taught-app overlay)

- `reference/ch08/client/src/styles/_tokens.scss` — **primary edit.** Implement the v2 primitives + remap existing
  semantic names onto the ramp + aliases. Keep `#region step-8.3` (colors) and `#region step-8.5` (type) markers; add
  new regions: `step-8.3b` (elevation+motion), `step-8.5b` (density). Dark `:root` + `[data-theme='light']` + optional
  `[data-density='compact']`.
- `reference/ch08/client/src/styles/_base.scss` — adopt motion tokens for global transitions, focus ring via `--ring`,
  selection color; ensure `prefers-reduced-motion` block still present.
- `reference/ch08/client/src/styles/_layers.scss` — unchanged unless you add a `tokens` sublayer; leave as-is if fine.
- Possibly `reference/ch08/client/src/app/features/projects/project-card.scss` (ch08 already teaches container-query
  card) — adopt elevation/motion tokens as the worked example.

## Ripple — re-skin forward where you want the new look (optional, additive)

Only where adopting a NEW token improves the component (elevation on dialog/card, motion on toast/dialog). Edit the
overlay that OWNS the file (last chapter that changed it):
- `reference/ch09/client/src/app/shared/ui/{button,field,badge,dialog,toast}/*.scss`
- `reference/ch12../14/client/src/app/features/**/*.scss`
Value-only token changes need NO edits here — components already reference `--bg/--sur/--txt1/--ember` etc.

## Content changes (`src/app/chapters/ch08-design-system-css/content.ts`)

Upgrade existing steps to teach: OKLCH + perceptual ramps, single-accent discipline, elevation system, **motion tokens**
(new), density modes (new), the additive-token migration idea ("how you evolve a design system without breaking
consumers" — a real interview topic). Add a `v22`/`tip` callout on `color-mix`/OKLCH. Keep all existing step ids; ADD
new steps with new ids (e.g. `8.x`) for elevation/motion/density so coverage of the new regions passes. Update any
quiz/term that referenced the old flat palette.

## CSS techniques featured here

OKLCH color, `color-mix`, custom-property theming, `@layer`, logical properties, `prefers-reduced-motion`,
attribute-based density. (Deeper layout — subgrid/anchor/container/scroll-driven — is ch15.)

## Verification

- Procedure A (all 6 gates). Specifically: **all 18 milestones still compile**, `pnpm test` green, `verify:coverage`
  green (new regions/files referenced by the upgraded content).
- Two-server smoke on ch14 build: app looks v2, dark + light, 375px zero overflow.
- Confirm NO token was renamed: `rg -- '--ember|--teal|--txt1|--txt2|--txt3'` still resolves everywhere.

## Delegation

Mostly NOT delegated — the token design + ripple judgment is precision work; do it yourself. You MAY delegate the ch08
*content prose* upgrade after the snapshot is green, using the standard template in `05-DELEGATION-GUIDE.md` with the
verified facts (final token names/values, which regions exist).

## Done when

Gates green + visual sweep clean + committed (`feat(taskforge-companion): design-system v2 tokens (ch08 retrofit)`) +
progress log updated with the FINAL token names/values (so every later spec uses the real names).
