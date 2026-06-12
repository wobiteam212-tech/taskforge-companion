// Compiles the materialized cumulative snapshots so "build the app chapter
// by chapter ⇒ it compiles" is machine-checked, not hand-audited.
//
// Milestones live in reference/milestones.json:
//   [{ "chapter": "ch04", "kind": "dotnet", "dir": "server" },
//    { "chapter": "ch09", "kind": "ng",     "dir": "client" }]
// Each entry compiles reference/.build/<chapter>/<dir>.
// `kind: "dotnet"` runs `dotnet build` (+ `dotnet test` if a test project exists),
// `kind: "ng"` runs `pnpm install` + `ng build` in the materialized tree.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { materializeAll } from './materialize-snapshots.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const referenceDir = join(root, 'reference');
const milestonesFile = join(referenceDir, 'milestones.json');

const chapters = materializeAll(referenceDir);
if (!chapters.length) {
  console.log('verify:snapshots — no reference chapters yet, nothing to verify. OK');
  process.exit(0);
}

const milestones = existsSync(milestonesFile)
  ? JSON.parse(readFileSync(milestonesFile, 'utf8'))
  : [];

if (!milestones.length) {
  console.log(
    `verify:snapshots — ${chapters.length} snapshot(s) materialized but reference/milestones.json ` +
      'is empty; add milestones so chapters are compile-checked.',
  );
  process.exit(1);
}

let failed = 0;
for (const m of milestones) {
  const dir = join(referenceDir, '.build', m.chapter, m.dir ?? '.');
  if (!existsSync(dir)) {
    console.error(`✗ ${m.chapter}/${m.dir}: materialized dir not found`);
    failed++;
    continue;
  }
  try {
    if (m.kind === 'dotnet') {
      // nodeReuse:false — lingering MSBuild daemons keep handles under .build,
      // which makes the next materialize rm fail with EPERM on Windows.
      run('dotnet build --nologo -v q /nodeReuse:false', dir);
      if (existsSync(join(dir, 'tests'))) run('dotnet test --nologo -v q /nodeReuse:false', dir);
    } else if (m.kind === 'ng') {
      run('pnpm install --silent', dir);
      run('pnpm exec ng build', dir);
    } else {
      throw new Error(`unknown milestone kind "${m.kind}"`);
    }
    console.log(`✓ ${m.chapter} (${m.kind}) compiles`);
  } catch (err) {
    console.error(`✗ ${m.chapter} (${m.kind}) FAILED: ${err.message}`);
    failed++;
  }
}

function run(cmd, cwd) {
  execSync(cmd, { cwd, stdio: 'inherit' });
}

if (failed) {
  console.error(`verify:snapshots — ${failed} milestone(s) failed`);
  process.exit(1);
}
console.log('verify:snapshots — all milestones compile. OK');
