# Spec — ch16: Motion System + Command Palette (Cmd-K)

**Type:** new forward chapter (may split into two if it gets large: 16 motion+keyboard infra, 16b palette UI).
**Spine piece #1:** the command/action **registry + bus**.

## Goal

Give TaskForge its Linear soul: a global keyboard layer + a Cmd-K fuzzy command palette that can navigate and run
actions. Establish the motion system in practice.

## Frontend (`reference/ch16/client/...`)

- `core/keyboard/keyboard.service.ts` — global shortcut registry (signal-based), `bind(combo, handler, opts)`,
  scope handling, ignores typing in inputs. Region `step-16.x`.
- `core/commands/command-registry.ts` — a `Command { id, title, group, keywords, run() }` registry; signal of all
  commands; feature modules register commands. This is the **command bus** (spine #1). Region `step-16.x`.
- `core/commands/fuzzy.ts` — small fuzzy matcher/ranker (hand-rolled; teaches scoring). Region.
- `features/command-palette/command-palette.ts/.html/.scss` — overlay dialog (native `<dialog>` or portal),
  focus trap, arrow-key nav, fuzzy filter, grouped results, runs the selected command. Uses **anchor positioning**
  for any submenus and **motion tokens** for enter/exit. `&#64;`-escape any literal `@` shown as text.
- Wire palette open on Cmd-K / Ctrl-K in `app.ts`; register commands from projects/issues features (go to project,
  open board, create issue, toggle theme, switch density…).
- Search-backed commands: a "search issues…" mode hitting the new backend search endpoint.
- `milestones.json` += ch16 ng.

## Backend (`reference/ch16/server/...`)

- Search endpoint: `GET /api/search?q=` (or `/api/projects/{id}/issues/search`) returning lightweight hits
  (issues by title, projects by name) the palette can jump to. Add to `IIssueRepository`/`IProjectRepository` +
  `EfIssueRepository` (use `EF.Functions.Like`, cap results). New endpoints in a `SearchEndpoints.cs` or extend
  existing groups; `RequireAuthorization()`; resource-scoped where needed. Region `step-16.x`.
- No new entity → likely **no migration**. If you add nothing schema-level, skip EF. `milestones.json` += ch16 dotnet.

## Architecture

Command registry + bus is the first spine piece. Keep it framework-light and signal-based. Features REGISTER commands;
the palette is a dumb consumer. This pattern recurs in ch17–19.

## CSS techniques

Anchor positioning, motion tokens (enter/exit, list highlight), `:has()` for empty/selected states, focus-visible ring,
reduced-motion. Pixel-perfect overlay (backdrop blur optional, elevation-3).

## Live demo

A self-contained mini command-palette demo (fake command list, fuzzy filter, keyboard nav, runs a no-op that logs).
Timers cleaned in `DestroyRef`. Shows the ranking + keyboard model without the real app.

## Teaching outline

~16 steps: keyboard service, the command pattern (why a registry/bus vs scattered handlers — interview gold), fuzzy
ranking, overlay + focus trap a11y, anchor positioning, motion, wiring features' commands, the search endpoint.
Quiz ≥6, proveIt ≥3 (open palette, type, jump; Cmd-K from anywhere), exercise (register a new command + shortcut),
terms ≥6.

## Verification

- Snapshot compiles (dotnet + ng). Gates green.
- Two-server smoke: Cmd-K opens palette, fuzzy filter works, Enter navigates/runs, Esc closes, focus trapped, search
  hits return from API, 0 console errors, 375px ok (palette responsive), reduced-motion ok, keyboard-only operable.

## Delegation prompt

Same template as ch15 (see `05-DELEGATION-GUIDE.md`), with verified facts: exact command/keyboard service signatures,
the search endpoint shape + a real example response, the demo behavior. Emphasize a11y claims must match runtime.

## Done when

Gates + smoke (incl. keyboard-only) + review + commit + progress log.
