# 06 — Progress Log (LIVING — update after every chunk)

> **Whoever works on this MUST append an entry below after each chunk.** Start your session by reading the latest entry.
> Newest entries at the TOP. This is how work survives across agents / sessions / tools (Claude ↔ codex).

## Entry template (copy this)

```
### YYYY-MM-DD — <unit, e.g. "Phase 0a ch08 retrofit"> — <STATUS: done | in-progress | blocked>
- What I did:
- Where (files + commit hash):
- Gate outcomes: gen:manifest [ ] · test [N passed] · verify:coverage [N files] · build [ ] · snapshots/milestones [ ]
- Runtime smoke / 375px sweep:
- Decisions made / values locked (e.g. final token names):
- Surprises / deviations from the spec:
- WHAT'S NEXT (the very next action for the next person):
```

## Status board (keep current)

| Unit | Spec | Status |
|---|---|---|
| Phase 0a — ch08 design-tokens v2 | `04-chapter-specs/ch08-retrofit.md` | DONE — token foundation `743ce36`; component adoption completion `3919f87` |
| Phase 0b — companion re-skin | `04-chapter-specs/companion-reskin.md` | DONE — `47f7712` |
| Renumber placeholders ch15–20 → ch21–26 | `03-PROPAGATION-AND-SYNC.md` Procedure C | NOT STARTED |
| ch15 — Modern CSS 2026 | `04-chapter-specs/ch15-modern-css.md` | NOT STARTED |
| ch16 — Command palette | `04-chapter-specs/ch16-command-palette.md` | NOT STARTED |
| ch17 — Kanban DnD | `04-chapter-specs/ch17-kanban-dnd.md` | NOT STARTED |
| ch18 — Dashboard | `04-chapter-specs/ch18-dashboard.md` | NOT STARTED |
| ch19 — Rich detail | `04-chapter-specs/ch19-rich-detail.md` | NOT STARTED |
| ch20 — State capstone | `04-chapter-specs/ch20-state-capstone.md` | NOT STARTED |
| Wave 5 — Testing (ch21) | (planned in `01-MASTER-PLAN.md`) | NOT STARTED |
| Wave 5 — Perf & a11y (ch22) | (planned) | NOT STARTED |
| Wave 6 — Production (ch23–26) | (planned) | NOT STARTED |

---

## Log entries (newest first)

### 2026-06-13 — Phase 0b: companion guide re-skin — done
- What I did: Re-skinned the guide shell onto the same v2 vocabulary as the taught app: neutral surface ramp, one
  ember accent, semantic status colors, density/radius/motion/elevation tokens, tokenized focus rings, and quieter
  shell/card/source-browser transitions. Removed the reported home hero gradient and the remaining guide-level
  gradients from the shell/chapter/source/demo surfaces without adding new guide features.
- Where: `src/styles.scss`, `src/app/app.scss`, `src/app/core/ui/home/home.scss`,
  `src/app/core/ui/chapter-page/chapter-page.scss`, `src/app/core/ui/panels/code-panel.scss`,
  `src/app/core/ui/panels/live-demo-panel.ts`, `src/app/core/ui/source-browser/source-browser.scss`.
  Implementation commit `47f7712`; this progress-log correction is committed separately.
- Gate outcomes: gradient scan clean for guide source · `git diff --check` clean except expected CRLF warnings ·
  test 90 passed · verify:coverage 133 files · guide build clean with only the pre-existing Mermaid CommonJS warning.
- Runtime smoke / 375px sweep: Guide `http://127.0.0.1:4400` verified in the in-app browser. Desktop home and
  `shared-ui-kit` source browser had `scrollWidth === clientWidth`, source browser rendered rows/status chips with
  tokenized transitions/radius/shadow, and computed gradient count was 0. Mobile `375px` home + chapter + source
  browser also had no horizontal overflow. Light mode computed `data-theme="light"`, warm paper `--bg`, ember hero
  text with no gradient, and no console warnings/errors.
- Decisions made / values locked: The companion keeps existing alias names (`--txt`, `--sur3/4`, `--eglow`, etc.)
  while adding the v2 primitives. Code blocks stay dark in both themes. No feature work or roadmap content changed
  in this unit.
- Surprises / deviations from the spec: The in-app browser exposes both desktop and mobile theme buttons in the DOM;
  the visible desktop toggle was coordinate-clicked after rectangle verification because locator targeting the hidden
  duplicate was flaky.
- WHAT'S NEXT: Run the roadmap sync: insert Wave 4 Craft & Polish as ch15-ch20, shift old Quality/Production
  placeholders to ch21-ch26, update registry/plan/progress together, regenerate manifest, run gates, and browser-check
  the home roadmap.

### 2026-06-13 — Phase 0a: component adoption + content sync — done
- What I did: Completed the visible ch09 primitive adoption of the ch08 v2 token vocabulary. Buttons, fields, dialogs,
  toasts, badges, and project cards now use the additive motion/elevation/density/radius tokens without renaming any
  existing token. Synced ch08/ch09 prose and the inline badge snippet so panels no longer show unexplained motion,
  elevation, focus, or density code.
- Where: `reference/ch09/client/src/app/shared/ui/{button,badge,field,dialog,toast}/*.scss`,
  `reference/ch09/client/src/app/features/projects/project-card.scss`,
  `src/app/chapters/ch08-design-system-css/content.ts`, `src/app/chapters/ch09-shared-ui-kit/content.ts`,
  regenerated `guide-manifest.generated.ts`. Implementation commit `3919f87`; this progress-log correction is committed separately.
- Gate outcomes: gen:manifest clean (14 snapshots, 976 entries) · test 90 passed · verify:coverage 133 files · guide
  build clean (only pre-existing Mermaid CommonJS warning) · cumulative ch14 client `ng build` passed after installing
  the materialized client's declared dependencies.
- Runtime smoke / 375px sweep: API `http://127.0.0.1:5080` + client `http://localhost:4500` verified. Login
  `demo@taskforge.dev / Passw0rd!` succeeds; project list renders seeded projects; dialog, primary button, badge,
  card, and toast computed styles show the new tokenized shadow/motion/density values; desktop, light mode, mobile
  `375px`, and mobile dialog all had `scrollWidth === clientWidth`; browser logs had 0 warnings/errors.
- Decisions made / values locked: Keep the current additive strategy and cited legacy hex/clamp values for now. Full
  OKLCH remap remains a deliberate future content upgrade because current ch08 prose still teaches exact old values.
- Surprises / deviations from the spec: Browser login must use `http://localhost:4500`, not `127.0.0.1:4500`, because
  the snapshot API base and CORS policy are keyed to `localhost`. Direct ch14 client compile required `pnpm install`
  inside `reference/.build/ch14/client` so `@angular/cdk` could resolve.
- WHAT'S NEXT: Phase 0b — re-skin the companion guide site itself from `04-chapter-specs/companion-reskin.md`, then
  renumber the old soon placeholders before starting ch15.

### 2026-06-13 — Phase 0a: design-system v2 token foundation — in-progress
- What I did: Implemented the v2 token VOCABULARY additively (no existing value changed) so all later craft chapters
  have it with zero visual-regression risk. Audited token usage first (`var(--…)` across `reference/**` scss + companion);
  confirmed `_tokens.scss`/`_base.scss` are owned only by ch08 (edits reach `.build/ch14`); confirmed ch08 PROSE
  hardcodes `#ff8a3d/#2dd4bf/#0f1217/#e06616` + the clamp() values → kept those verbatim to avoid silently breaking the
  teaching. Added accent system, elevation, motion, density, radius, neutral additions, full type/weight scale (regions
  step-8.3b / step-8.5b); `_base.scss` now uses an accent focus-ring + token theme transition + reduced-motion block.
- Where: `reference/ch08/client/src/styles/_tokens.scss`, `_base.scss`, regenerated `guide-manifest.generated.ts`.
  Commit `743ce36` on branch `codex/taskforge-ch14-continuation`.
- Gate outcomes: gen:manifest clean (14 snapshots, 976 entries) · test 90 passed · verify:coverage 133 files · guide
  build clean (only pre-existing Mermaid CJS warning) · cumulative ch14 client `ng build` compiles.
- Runtime/375px sweep: deferred — commit is additive (no value change), real visual verification belongs to the
  component-adoption commit (next).
- Decisions locked: kept cited brand hexes + clamps verbatim; single accent = ember (teal demoted to status); a fuller
  OKLCH re-value + ch08 prose rewrite is a DELIBERATE future content upgrade, not done here (would falsify prose).
- Gotcha hit: materialize EPERM — leftover `TaskForge.Api.exe` + ng/esbuild from `.build/ch14` locked it; killed PIDs,
  re-materialized. Also: piping materialize through `tail` masked its crash exit code — run it un-piped when checking.
- WHAT'S NEXT: **Phase 0a component adoption** — adopt elevation/motion/density in the ch09-owned primitives
  (`reference/ch09/client/src/app/shared/ui/{dialog,toast,button,field}/*.scss`, badge) and `project-card.scss`
  (ch09 owner) for the visible jump; then two-server smoke + 375px/dark-light sweep; commit. After that: companion
  re-skin (`companion-reskin.md`).

### 2026-06-13 — Handoff bundle created — done
- What I did: Ran the grill-me planning session with Oleg; locked the 9 decisions; wrote this `context/craft-upgrade/`
  bundle (00–07 + 8 chapter specs). NO app/snapshot/registry/code changes were made — docs only.
- Where (files + commit hash): `taskforge-companion/context/craft-upgrade/**` (uncommitted at time of writing — commit
  when ready). Local plan mirror: `~/.claude/plans/structured-hugging-globe.md`.
- Gate outcomes: n/a (no code touched).
- Decisions locked: see `01-MASTER-PLAN.md` "9 locked decisions". Design language = neutral + single accent (best
  practice), additive token retrofit; all four craft surfaces in scope; hand-roll architecture then @ngrx/signals
  capstone; companion polish-only; backend grows to match; craft wave (ch15–20) before the shifted testing/production waves.
- Surprises: none.
- WHAT'S NEXT: **Phase 0a** — implement Design-Language v2 per `02-DESIGN-LANGUAGE-V2.md` into
  `reference/ch08/client/src/styles/_tokens.scss` (additive; rename nothing), run Procedure A in
  `03-PROPAGATION-AND-SYNC.md`, get all 6 gates + visual sweep green, commit, then log the FINAL token names/values here
  so every later spec uses the real names. (Also do the placeholder renumber ch15–20 → ch21–26 around this time.)
