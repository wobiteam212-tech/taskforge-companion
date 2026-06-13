# Spec — Phase 0b: Companion Guide Site Re-skin (polish only)

**Type:** edit the guide app itself (`src/`), not the taught snapshots. No new guide features (per decision #7).
**Prereq:** ch08 retrofit done so the final token names/values are locked (see progress log).

## Goal

Make the guide SITE look as polished as the app it teaches: adopt Design-Language v2, fix interaction states /
transitions / mobile rough edges. The guide should visually match the taught app (shared token definitions).

## Files to change

- `src/styles.scss` — replace the token block with the canonical v2 set (copy from `_tokens.scss`, adapted to the
  companion's existing semantic names: it uses `--txt` not `--txt1`, has `--sur3/4`, `--eglow`, etc.). Keep those names
  as aliases onto the ramp. Add elevation/motion/density tokens. Keep "code blocks always dark" + Prism theme.
- `src/app/core/ui/**` component SCSS — adopt motion tokens for transitions (sidebar, panels crossfade, cards, dialog),
  elevation for raised surfaces, the `--ring` focus treatment. Targets: `home`, `chapter-page`, `panels/*`, `blocks`,
  `quiz`, `drill`, `glossary`, `source-browser`, `app.scss`.
- Fix the known rough edges: hover/active/focus states on cards & buttons, smoother step-rail + panel transitions,
  mobile sidebar/backdrop polish, consistent spacing via `--sp-*`.

## Explicitly OUT of scope

No Cmd-K palette for the guide, no new search engine, no new pages. Polish + re-skin only. (Revisit features later if
desired — log a note, don't build.)

## CSS techniques

Same v2 system; plus tidy the existing scrollytelling transitions with motion tokens and ensure
`prefers-reduced-motion` covers them.

## Verification

- `pnpm build` clean; `pnpm test` still green (content unaffected).
- Browser sweep on **port 4400**: every chapter route + home + drill + glossary, desktop + **375px**, dark + light,
  **0 console errors, 0 horizontal overflow** (re-run the established overflow/RTL sweep — this is where the prior
  `code.ic` / flex `min-width:0` / `@container` fixes must not regress).
- Theme toggle works; reduced-motion respected.

## Delegation

Can be delegated to a sub-agent with a tight prompt ("apply these exact tokens; adopt motion/elevation; fix states;
no new features; pass the 375px sweep"). Review the diff for any hardcoded colors that should be tokens.

## Done when

Build + tests green, browser sweep clean across all routes/breakpoints/themes, committed
(`fix(taskforge-companion): re-skin guide site to design-language v2`), progress log updated.
