# 05 — Delegation Guide (how to use sub-agents safely)

This is the exact pipeline that produced ch12–14: **you** build and runtime-prove the snapshot (precision work);
a **sub-agent** writes the Hebrew chapter prose from verified facts; **you** review line-by-line and gate it.

## What to delegate vs do yourself

| Do YOURSELF (precision / judgment) | DELEGATE (bulk prose, after snapshot is green) |
|---|---|
| Design tokens + the ch08 ripple | ch08 content-prose upgrade (optional) |
| Snapshot files (TS/C#/SCSS/HTML) | A chapter's `content.ts` (steps/quiz/proveIt/exercise) |
| EF migrations | The companion re-skin (tight, bounded prompt) is delegable |
| Runtime smoke + a11y verification | — |
| Registry/milestones edits | — |

Never delegate snapshot code or migrations — the agent can't runtime-verify the way you must.

## Golden delegation rules

1. **Snapshot must be built, compiled, and runtime-proven BEFORE you delegate the prose.** The agent writes ABOUT
   verified code; it must not invent behavior.
2. **Verified-facts-only.** Put the exact facts the agent may state (real endpoint shapes + example responses, real
   component signatures, real demo behavior, real chunk/number observations) in the prompt. Tell it: *state only these
   as observed behavior; invent no numbers, names, messages.*
3. **One agent at a time runs gates** (shared `.angular`/`dist`). If you must parallelize, isolate in a git worktree.
4. **Agents may die mid-task** (session limits). If so, the next launch must include an INVENTORY of what already exists
   (which files were created) so it doesn't redo/clobber. Re-run gates yourself if the agent stopped before them.
5. **You always review + gate + commit.** The agent's "done" is not done until you've verified.

## Prompt template (fill the brackets)

> Write **chNN "[title]"** content for taskforge-companion. The snapshot is built, compiled, and runtime-proven, and
> committed at `reference/chNN/`. First read: `context/craft-upgrade/07-REPO-FACTS.md` (repo + content model + gotchas),
> this file's house rules, and `src/app/chapters/ch14-issue-detail-comments/content.ts` for house style/voice.
>
> **Deliverables:** `src/app/chapters/chNN-[slug]/content.ts` exporting `CHNN_CONTENT: ChapterContent`; a live-demo
> under `demos/` if specified; flip chNN in `src/app/core/registry/registry.ts` to `status:'ready'` + `loadContent`.
>
> **Region map (panel file → region):** [exact list].
> **Verified facts you may state (and ONLY these as observed behavior):** [endpoint shapes + example responses;
> component signatures; demo behavior; any measured numbers].
>
> **Hard rules:** (a) Hebrew RTL prose, English code; **NO unicode arrows (→ ➜ ⇒ ← ↦ ⮕) anywhere in prose, even inside
> backticks** — describe transitions in words. (b) `code-inline` is a PanelDef kind, NOT a ContentBlock kind. (c) Exactly
> ONE panel per step; unique step ids `NN.x`. (d) Interview callouts set `title` = the question. (e) In any demo template,
> a literal `@` shown as TEXT must be written `&#64;`. (f) Any `@container` query needs a `container-type` ancestor.
> (g) Quiz ≥6 with explanations; proveIt ≥3 runnable against the two-server setup (login demo@taskforge.dev / Passw0rd!);
> exercise with tasks + acceptance; ≥2 terms. (h) Connect explicitly to prior chapters by number where relevant.
>
> **Make ALL gates green, iterating until clean:** `pnpm gen:manifest`, `pnpm test`, `pnpm verify:coverage`, `pnpm build`.
> Do NOT run `verify:snapshots` (slow; snapshot already verified). Do NOT edit anything under `reference/` — if something
> there seems wrong, report it instead.
>
> Finish with a summary: step count, gate outputs (numbers), files created/changed, anything you were unsure about.

## Review checklist (you, after the agent returns) — the ch12–14 standard

- [ ] **Factual accuracy**: every claim matches the runtime-proven snapshot (no invented numbers/messages/behavior).
- [ ] **No arrows** anywhere in Hebrew prose (the test catches these, but eyeball too).
- [ ] **Hebrew quality**: fix machine-translation slips, gender/plural, English-term handling (keep technical terms English).
- [ ] **Panels**: one per step; files+regions resolve; right panel kind for the job.
- [ ] **Demo**: compiles, behaves as described, timers cleaned in `DestroyRef`, `@`→`&#64;` where needed, `container-type` present for any `@container`.
- [ ] **Pedagogy**: what/why-now/mental-model/line-by-line/alternatives/gotchas/interview present; not hand-wavy.
- [ ] **Gates**: re-run all four yourself; record numbers.
- [ ] **Browser**: open the chapter (use `#step-NN.x` if tab hidden), exercise the demo, check 375px.
- [ ] **Commit** + **update `06-PROGRESS-LOG.md`**.

## Common agent failure modes seen so far

- Soft-hacking `verify:coverage` by dumping many file paths into one callout (ch04). Fix: real per-file teaching steps.
- Writing `@container` without `container-type` (ch13 → mobile overflow).
- Dying after creating only the demo files (ch13). Relaunch with an inventory.
- Treating `code-inline` as a ContentBlock (ch06). It's a PanelDef.
- Stating unverified specifics (chunk sizes, status codes). Enforce verified-facts-only.
