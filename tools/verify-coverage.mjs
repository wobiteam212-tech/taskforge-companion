// Enforces the "no file appears by magic" rule (plan §3.5.1):
// every file in the cumulative snapshot must be mentioned somewhere in the
// authored chapter content (typed by hand in a code panel, or toured).
//
// Pipeline-aware: a file is only REQUIRED to be covered once the chapter
// that introduced it is marked `ready` in the registry. Snapshots are built
// before their content is authored, so files of not-yet-ready chapters are
// reported as pending, not failures.
//
// Mechanically: a path counts as covered if it appears as a string literal
// anywhere under src/app/chapters/. Fails loudly otherwise.
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listChapterDirs, overlayFiles } from './materialize-snapshots.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const referenceDir = join(root, 'reference');
const chaptersDir = join(root, 'src', 'app', 'chapters');
const registryFile = join(root, 'src', 'app', 'core', 'registry', 'registry.ts');

const chapterDirs = listChapterDirs(referenceDir);
if (!chapterDirs.length) {
  console.log('verify:coverage — no reference chapters yet, nothing to cover. OK');
  process.exit(0);
}

// which chapters are ready? (regex over the registry — ids precede status)
const registry = readFileSync(registryFile, 'utf8');
const ready = new Set(
  [...registry.matchAll(/id:\s*'(ch\d+)'[\s\S]*?status:\s*'(ready|soon)'/g)]
    .filter((m) => m[2] === 'ready')
    .map((m) => m[1]),
);

// map every path to the chapter that FIRST introduced it
const introducedIn = {};
let seen = new Set();
for (const ch of chapterDirs) {
  const state = overlayFiles(referenceDir, chapterDirs.slice(0, chapterDirs.indexOf(ch) + 1));
  for (const path of Object.keys(state)) {
    if (!seen.has(path)) introducedIn[path] = ch;
  }
  seen = new Set(Object.keys(state));
}

const finalState = overlayFiles(referenceDir, chapterDirs);

// concat all authored chapter content
let authored = '';
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (entry.endsWith('.ts') || entry.endsWith('.html')) authored += readFileSync(full, 'utf8');
  }
})(chaptersDir);

const required = [];
const pending = [];
for (const path of Object.keys(finalState)) {
  const origin = introducedIn[path] ?? chapterDirs[0];
  (ready.has(origin) ? required : pending).push(path);
}

const uncovered = required.filter((p) => !authored.includes(p));

if (uncovered.length) {
  console.error(
    `verify:coverage — ${uncovered.length} file(s) from READY chapters are never mentioned in any chapter:`,
  );
  for (const p of uncovered) console.error(`  ✗ ${p} (introduced in ${introducedIn[p]})`);
  process.exit(1);
}

const pendingNote = pending.length
  ? ` (${pending.length} file(s) from not-yet-ready chapters pending)`
  : '';
console.log(`verify:coverage — all ${required.length} ready-chapter files are taught or toured. OK${pendingNote}`);
