// Builds the guide manifest from the verified reference snapshots.
//
// reference/chNN/ holds ONLY the files created or changed in chapter NN.
// The cumulative app state at chapter N is the overlay of ch00..chN.
// For every chapter we emit: cumulative files, added/modified status,
// per-file changed-line numbers (a real LCS diff vs the previous chapter),
// and named regions extracted from `// #region <name>` markers.
//
// Run via `pnpm gen:manifest` (also chained into start/build).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listChapterDirs, overlayFiles } from './materialize-snapshots.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const referenceDir = join(root, 'reference');
const outFile = join(root, 'src', 'app', 'core', 'source', 'guide-manifest.generated.ts');

// ---- region markers ------------------------------------------------------
// Accept `// #region name`, `# #region name`, `<!-- #region name -->`,
// and C#'s native `#region name` (same for #endregion). Marker lines are
// stripped from the displayed content; the raw snapshot file keeps them
// (they are legal comments/directives, so the snapshot still compiles).
const REGION_OPEN = /^\s*(?:\/\/|#|<!--)?\s*#region\s+(.+?)\s*(?:-->)?\s*$/;
const REGION_CLOSE = /^\s*(?:\/\/|#|<!--)?\s*#endregion\b.*$/;

function normalizeText(raw) {
  return raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function extractRegions(raw) {
  const lines = normalizeText(raw).split('\n');
  const out = [];
  const regions = {};
  const stack = [];
  for (const line of lines) {
    const open = line.match(REGION_OPEN);
    if (open) {
      stack.push({ name: open[1], start: out.length + 1 });
      continue;
    }
    if (REGION_CLOSE.test(line)) {
      const r = stack.pop();
      if (r) regions[r.name] = { start: r.start, end: out.length };
      continue;
    }
    out.push(line);
  }
  // unclosed regions run to the end of the file
  for (const r of stack) regions[r.name] = { start: r.start, end: out.length };
  return { content: out.join('\n'), regions };
}

// ---- line diff (LCS) -----------------------------------------------------
// Returns the 1-based line numbers in `next` that are not part of the
// longest common subsequence with `prev` — i.e. added or changed lines.
function changedLineNumbers(prev, next) {
  const a = normalizeText(prev).split('\n');
  const b = normalizeText(next).split('\n');
  const n = a.length;
  const m = b.length;
  // dp[i][j] = LCS length of a[i..] and b[j..]
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const changed = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++; // line removed from prev — not visible in next
    } else {
      changed.push(j + 1);
      j++;
    }
  }
  while (j < m) changed.push(++j);
  return changed;
}

// ---- build ---------------------------------------------------------------
export function buildManifest() {
  const chapterDirs = existsSync(referenceDir) ? listChapterDirs(referenceDir) : [];
  const chapters = {};
  let prevClean = {}; // path → cleaned content of previous cumulative state

  for (const ch of chapterDirs) {
    const chapterIndex = chapterDirs.indexOf(ch);
    const cumulative = overlayFiles(referenceDir, chapterDirs.slice(0, chapterIndex + 1));
    const ownFiles = new Set(Object.keys(overlayFiles(referenceDir, [ch])));
    const deleteFile = join(referenceDir, ch, '_delete.json');
    const deletedPaths = existsSync(deleteFile)
      ? JSON.parse(readFileSync(deleteFile, 'utf8')).sort()
      : [];
    const files = {};
    const changes = {};
    const nextClean = {};

    for (const [path, raw] of Object.entries(cumulative).sort(([a], [b]) => a.localeCompare(b))) {
      const { content, regions } = extractRegions(raw);
      nextClean[path] = content;
      const before = prevClean[path];
      let status = 'unchanged';
      let changedLines = [];
      if (before === undefined) {
        status = 'added';
        changedLines = content.split('\n').map((_, k) => k + 1);
      } else if (ownFiles.has(path) && before !== content) {
        status = 'modified';
        changedLines = changedLineNumbers(before, content);
      }
      files[path] = { content, status, regions, changedLines };
      if (status !== 'unchanged') changes[path] = files[path];
    }

    for (const path of deletedPaths) {
      const before = prevClean[path];
      if (before === undefined) continue;
      changes[path] = {
        content: before,
        status: 'deleted',
        regions: {},
        changedLines: [],
      };
    }

    chapters[ch] = { files, changes };
    prevClean = nextClean;
  }

  return { chapters };
}

const manifest = buildManifest();

const banner = `/**
 * AUTO-GENERATED — do not edit by hand.
 * Produced by tools/generate-guide-manifest.mjs. Run \`pnpm gen:manifest\` to refresh.
 */
`;
const body = `export const GUIDE_MANIFEST = ${JSON.stringify(manifest, null, 2)};
`;

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, banner + body, 'utf8');

const chapterCount = Object.keys(manifest.chapters).length;
const fileCount = Object.values(manifest.chapters).reduce(
  (acc, c) => acc + Object.keys(c.files).length,
  0,
);
console.log(`guide-manifest: ${chapterCount} chapter snapshot(s), ${fileCount} cumulative file entries`);
