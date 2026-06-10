# TaskForge reference snapshots — the answer key

Each `chNN/` folder holds **only the files created or changed in chapter NN** of the
guide. The full state of the taught app at chapter N is the overlay of `ch00..chN`
(later chapters override earlier ones).

- `pnpm gen:manifest` — builds the guide manifest (file trees, contents, regions,
  per-chapter diffs) that feeds every code panel and the App Tree explorer.
- `pnpm verify:snapshots` — materializes every cumulative state into `.build/`
  and compiles the milestones listed in `milestones.json` (`dotnet build` / `ng build`).
- `pnpm verify:coverage` — fails if any file in the final app is never mentioned
  in the authored chapters ("no file appears by magic").

Region markers (`// #region step-3.2` … `// #endregion`) mark named slices for
focused code panels; they are stripped from the displayed content but stay in
the snapshot files, which therefore always compile as-is.

Snapshots begin at `ch01` (chapter 00 is tooling setup — no app code yet).
