# START HERE — TaskForge "Craft & Polish" Level-Up Bundle

This folder is a **self-contained handoff** for the next big phase of the TaskForge companion guide:
turning the taught app into a **Linear-grade** product and expanding the curriculum (especially modern CSS),
while **never breaking** the 14 chapters already built.

It is written so that an agent with **no memory of the planning conversation** (e.g. codex) can execute it safely.

## The Golden Rule (read this twice)

> **After every work chunk, append to [`06-PROGRESS-LOG.md`](06-PROGRESS-LOG.md):**
> what you did · where (files + commit hash) · the gate outcomes (pass/fail numbers) · what is next.
>
> The next agent (or future you) starts by reading the LAST entry of that log. If you don't update it,
> work gets lost or duplicated. This is non-negotiable.

## Read order

1. **`07-REPO-FACTS.md`** — how this repo works (commands, pipeline, content model, gotchas). Read first if you've never touched this project.
2. **`01-MASTER-PLAN.md`** — the what & why: the 9 locked decisions and the phased roadmap.
3. **`03-PROPAGATION-AND-SYNC.md`** — the "don't break anything" bible. Read BEFORE editing any `reference/` file.
4. **`02-DESIGN-LANGUAGE-V2.md`** — the concrete token system to implement in Phase 0.
5. **`04-chapter-specs/`** — pick the spec for the unit you're building. Each is self-contained and ends with a ready-to-paste delegation prompt.
6. **`05-DELEGATION-GUIDE.md`** — how to delegate chapter prose to a sub-agent and review it.
7. **`06-PROGRESS-LOG.md`** — the living log. Update it constantly.

## Execution order (the actual sequence of work)

```
Phase 0  → 04-chapter-specs/ch08-retrofit.md      (design tokens v2, in place, ripple ch09–14)   ← do FIRST, gate hard
Phase 0  → 04-chapter-specs/companion-reskin.md   (apply v2 to the guide site itself)
Wave 4   → ch15-modern-css.md
Wave 4   → ch16-command-palette.md
Wave 4   → ch17-kanban-dnd.md
Wave 4   → ch18-dashboard.md
Wave 4   → ch19-rich-detail.md
Wave 4   → ch20-state-capstone.md
(then the shifted Quality + Production waves — out of scope for this bundle; see 01-MASTER-PLAN.md)
```

Do them **in order**. Each must be fully green (see gates in `07-REPO-FACTS.md`) and committed before starting the next.
Trim order if time runs short: drop ch19 first, then ch18.

## Hard safety rules (full detail in `03-PROPAGATION-AND-SYNC.md`)

- **Never renumber a built chapter (ch00–14).** New chapters append as ch15+. Only the *unbuilt* planned waves get renumbered (metadata only).
- **Never edit a file under `reference/.build/`** — it is generated. Edit the overlay under `reference/chNN/` instead.
- **After any `reference/` change**: regenerate the manifest and run ALL gates before commit.
- **Commit only when the user asks**, or per the per-chapter loop the project already uses; one branch, never force-push.
- This bundle's creation = **docs only**. No app/snapshot/registry edits happened when it was written.

## Current state at bundle creation (2026-06-13)

- Built & green: **ch00–ch14** (commit `a0f984c`). Branch: `codex/taskforge-ch14-continuation` (per session) / work lands toward `main`.
- Gates passing: 90 tests, 133 ready files covered, all 18 snapshot milestones compile, build clean.
- This bundle is the plan for everything AFTER ch14, starting with the Phase 0 design-system retrofit.
