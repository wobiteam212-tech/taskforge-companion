# 03 — Propagation & Sync Bible ("don't break / keep in sync")

Read this BEFORE touching any `reference/` file. It explains exactly how a change ripples and how the gates catch
breakage. The owner's #1 fear is breaking or desyncing the 14 built chapters; this doc is how we prevent that.

## Mental model: three layers that must stay in sync

```
reference/chNN/  (overlays, hand-edited)
      │  materialize-snapshots.mjs  (composes cumulative trees)
      ▼
reference/.build/chNN/  (generated; compiled by verify:snapshots; NEVER hand-edit)
      │  generate-guide-manifest.mjs  (extracts files + #region slices + diffs)
      ▼
src/app/core/source/guide-manifest.generated.ts  (committed)
      ▲
src/app/chapters/chNN/content.ts  (panels reference manifest files + regions by name)
```

If a content panel references `file: '…/foo.ts'`, `region: 'step-13.4'`, the manifest MUST contain that file and region,
or `pnpm gen:manifest` / `pnpm test` fails. **That failure is your safety net** — it makes desync impossible to commit.

## The one procedure you run after ANY reference change

```
1. node tools/materialize-snapshots.mjs          # (or it runs inside the gates)
2. pnpm gen:manifest                             # fails on missing file/region refs
3. pnpm test                                     # content-rules: arrows, panels resolve, quiz/exercise integrity
4. pnpm verify:coverage                          # every ready-chapter file is taught/toured
5. pnpm build                                    # guide builds
6. pnpm verify:snapshots                         # every milestone compiles (dotnet/ng). Slow — see fallback.
```
Fallback if `verify:snapshots` times out: compile the specific milestone directly —
`dotnet build` in `reference/.build/chNN/server`, `pnpm exec ng build` in `reference/.build/chNN/client`.
All six green = safe to commit. Then update `06-PROGRESS-LOG.md`.

## Procedure A — the ch08 token retrofit (the only high-ripple step)

This is Phase 0. Because of the **additive-first** policy (see `02-DESIGN-LANGUAGE-V2.md`), it is mostly value-changes.

1. **Audit first.** `rg -n -- '--ember|--teal|--txt1|--txt2|--txt3|--bg|--sur|--bdr|--fs-|--sp-|--rad' reference/ src/`.
   Confirm which token names are used and where. Goal: change **values**, add **new** tokens, rename **nothing**.
2. Edit token partials only: `reference/ch08/client/src/styles/_tokens.scss` (+ `_base.scss`, `_layers.scss` if needed).
   Remap existing semantic names onto the new ramp; add elevation/motion/density/accent tokens; keep aliases.
3. **Re-skin selectively, forward.** Where you WANT the new look (elevation on cards, motion on transitions), edit the
   component SCSS in the overlay that OWNS that component. Representative paths:
   `reference/ch09/client/src/app/shared/ui/**/*.scss` (button/field/badge/dialog/toast),
   `reference/ch12../14/client/src/app/features/**/*.scss`. **Edit the overlay where the file was last changed**, not `.build`.
4. Run Procedure (the 6 gates). Because tokens are CSS custom properties, value changes need **no TS/HTML edits** and
   no region changes → content stays valid automatically.
5. Visual check: `node tools/materialize-snapshots.mjs`, serve `reference/.build/ch14/client` on 4500 + its server on
   5080, walk the app at desktop + 375px (zero overflow), dark + light. Then the companion (port 4400) likewise.
6. Commit Phase 0 before any ch15 work.

**Why this is safe:** no token is renamed, so no component reference breaks; the manifest regen + content-rules test
prove every panel/region still resolves; `verify:snapshots` proves every milestone still compiles.

## Procedure B — adding a new forward chapter (ch15+)

1. **Decide the overlay files.** New chapter = `reference/ch15/...` containing ONLY the files created/changed that chapter.
   If you modify a file that already exists in an earlier overlay, copy the FULL new version into `reference/ch15/`
   (overlay = full file, later wins) and add/adjust `#region step-15.x` markers.
2. **Backend with a new entity** → add it to Core/Infrastructure/Api overlays, register in `Program.cs` (copy full
   updated `Program.cs` into the overlay), then generate the EF migration: materialize, `dotnet ef migrations add Name`
   inside `reference/.build/ch15/server`, copy the generated migration files back into `reference/ch15/server/.../Migrations/`.
3. **`reference/milestones.json`** → append `{ "chapter": "ch15", "kind": "dotnet", "dir": "server" }` and/or
   `{ "chapter": "ch15", "kind": "ng", "dir": "client" }`.
4. `pnpm verify:snapshots` (or direct compile) green = snapshot authored.
5. Runtime-prove (two-server smoke). 6. Author content + flip registry to `ready`. 7. Gates. 8. Review. 9. Commit. 10. Log.

## Procedure C — renumbering the unbuilt placeholder chapters

The registry currently has `ch15..ch20` as `status:'soon'` placeholders (testing/perf/hardening/realtime/ship/capstone).
They have **no snapshots and no content** → safe to renumber to `ch21..ch26`.
1. Edit `src/app/core/registry/registry.ts`: change those `id`/`no`/`slug` and group them under the shifted waves; add a
   new Wave 4 with the ch15–20 craft chapters as `status:'soon'` until each is built.
2. Update `context/plan.txt` roadmap section to match.
3. `pnpm gen:manifest` + `pnpm test` + `pnpm build` (no snapshot impact since they're metadata-only).
Do this renumber as part of Phase 0 or just before ch15, and log it.

## What each gate protects (so you trust them)

- **`gen:manifest`**: a panel referencing a non-existent file or `#region` → hard fail. Kills "panel points at nothing."
- **`content-rules.spec` (`pnpm test`)**: arrows in Hebrew prose, missing interview-callout titles, broken panel
  file/region resolution, quiz/exercise/term integrity. Kills the HireHub-era content bugs.
- **`verify:coverage`**: a snapshot file never mentioned in any chapter (for ready chapters) → fail. Kills "file appears
  by magic." Note: matching is **literal string** — name new files in a panel `file:` or in prose.
- **`verify:snapshots`**: a snapshot that doesn't compile → fail. Guarantees "build it chapter-by-chapter ⇒ it compiles."

## Cross-chapter consistency rules (keep the big picture in sync)

- **Stable public store surface.** Components depend on a store's *computed* surface (`issues()`, `loading()`, …), not
  its internals. When the architecture spine refactors a store (ch16–20), KEEP that public surface so earlier chapters'
  components and prose stay true. If you must change it, update every consumer in later overlays AND the prose that
  describes it.
- **Forward-references in prose.** Earlier chapters say things like "in ch11 the resolver becomes async." If a new
  chapter changes a pattern an earlier chapter promised, fix the earlier chapter's forward-reference prose too.
- **Design tokens are global truth.** After Phase 0, ALWAYS use tokens (never hardcoded colors/spacing) in new work,
  so the next theme change is again value-only.
- **The seam story.** The course repeatedly teaches "the public contract stayed; the implementation changed." Preserve
  that narrative: prefer adding behind existing seams over breaking them.

## Known gotchas (re-stated; each cost a real debug cycle)

- MSBuild daemons lock `.build` → **EPERM** on re-materialize. `dotnet build-server shutdown` + stop running servers first. `verify:snapshots` already passes `/nodeReuse:false`.
- `@container` queries silently dead without a `container-type` ancestor (ch13: 80px mobile overflow).
- Literal `@` in visible demo template TEXT must be `&#64;` (ch12 build break).
- Hidden preview tab suspends IO/rAF — force panel render via `#step-X` fragment; read DOM after ~900ms settle.
- Two gate runs in parallel collide on `.angular`/`dist` — serialize sub-agents that run gates.
- `.gitattributes` keeps the generated manifest LF; ignore "LF→CRLF" warnings on other files.

## Pre-commit checklist (paste into the PR/commit description)

- [ ] `pnpm gen:manifest` clean
- [ ] `pnpm test` (report count)
- [ ] `pnpm verify:coverage` (report ready-file count)
- [ ] `pnpm build` clean
- [ ] milestone(s) compile (`verify:snapshots` or direct)
- [ ] two-server runtime smoke: feature works, 0 console/network errors
- [ ] 375px + RTL + dark/light sweep: 0 overflow
- [ ] content reviewed (no arrows, facts match runtime, Hebrew clean, demo `@`-escaped)
- [ ] `06-PROGRESS-LOG.md` updated (what / where / outcomes / next)
