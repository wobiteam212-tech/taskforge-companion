// Overlay composer for the reference snapshots.
//
// reference/chNN/ holds only the files created or changed in chapter NN;
// the full app state at chapter N is the overlay of ch00..chN (later wins).
// `overlayFiles` builds that state in memory; the CLI materializes it to
// reference/.build/chNN/ so verify-snapshots can compile it.
import {
  readdirSync,
  statSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  existsSync,
} from 'node:fs';
import { join, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKIP_DIRS = new Set(['.build', 'node_modules', 'bin', 'obj', 'dist', '.angular']);

/** Sorted chapter folder names (ch00, ch01, …) under reference/. */
export function listChapterDirs(referenceDir) {
  if (!existsSync(referenceDir)) return [];
  return readdirSync(referenceDir)
    .filter((name) => /^ch\d+$/.test(name) && statSync(join(referenceDir, name)).isDirectory())
    .sort();
}

function walk(dir, base, files) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, base, files);
      continue;
    }
    const key = full.slice(base.length + 1).split(sep).join('/');
    files[key] = readFileSync(full, 'utf8');
  }
}

/**
 * Overlay the given chapter dirs (in order) into a flat { path → content } map.
 * A chapter may ship a `_delete.json` (array of paths) to REMOVE files from the
 * cumulative state — e.g. ch04 retires the ch01 teaching scaffolding.
 */
export function overlayFiles(referenceDir, chapterDirs) {
  const files = {};
  for (const ch of chapterDirs) {
    const dir = join(referenceDir, ch);
    if (!existsSync(dir)) continue;
    walk(dir, dir, files);
    if (files['_delete.json'] !== undefined) {
      for (const path of JSON.parse(files['_delete.json'])) delete files[path];
      delete files['_delete.json'];
    }
  }
  return files;
}

/** Write the cumulative state of every chapter to reference/.build/chNN/. */
export function materializeAll(referenceDir) {
  const buildDir = join(referenceDir, '.build');
  rmSync(buildDir, { recursive: true, force: true });
  const chapterDirs = listChapterDirs(referenceDir);
  for (let i = 0; i < chapterDirs.length; i++) {
    const state = overlayFiles(referenceDir, chapterDirs.slice(0, i + 1));
    for (const [path, content] of Object.entries(state)) {
      const out = join(buildDir, chapterDirs[i], ...path.split('/'));
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, content, 'utf8');
    }
  }
  return chapterDirs;
}

// CLI: `node tools/materialize-snapshots.mjs`
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const referenceDir = join(root, 'reference');
  const dirs = materializeAll(referenceDir);
  console.log(
    dirs.length
      ? `materialized ${dirs.length} cumulative snapshot(s) under reference/.build/`
      : 'no reference chapters yet — nothing to materialize',
  );
}
