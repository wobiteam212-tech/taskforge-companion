import { GUIDE_MANIFEST } from './guide-manifest.generated';

/* ============================================================
   Typed access to the generated guide manifest.
   The manifest is produced by tools/generate-guide-manifest.mjs
   from the verified reference snapshots, so every file shown in
   the guide is byte-for-byte the file that compiles.
   ============================================================ */

export interface SnapshotFile {
  content: string;
  /** relative to the previous chapter's cumulative state */
  status: 'added' | 'modified' | 'unchanged';
  /** named slices from `// #region <name>` markers — 1-based line ranges */
  regions: Record<string, { start: number; end: number }>;
  /** 1-based line numbers that are new or changed vs the previous chapter */
  changedLines: number[];
}

export interface SnapshotChange extends Omit<SnapshotFile, 'status'> {
  /** relative to the previous chapter's cumulative state */
  status: 'added' | 'modified' | 'deleted';
}

export interface ChapterSnapshot {
  /** cumulative file state at this chapter: path → file */
  files: Record<string, SnapshotFile>;
  /** files added, modified or deleted by this chapter */
  changes?: Record<string, SnapshotChange>;
}

export interface GuideManifest {
  chapters: Record<string, ChapterSnapshot>;
}

const manifest = GUIDE_MANIFEST as GuideManifest;

export function chapterSnapshot(chapterId: string): ChapterSnapshot | undefined {
  return manifest.chapters[chapterId];
}

/** Throws loudly in dev — a panel pointing at a missing file is an authoring bug. */
export function snapshotFile(chapterId: string, path: string): SnapshotFile {
  const file = manifest.chapters[chapterId]?.files[path];
  if (!file) {
    throw new Error(
      `[guide-manifest] missing file "${path}" in chapter "${chapterId}" — ` +
        `check the reference/ snapshot and re-run pnpm gen:manifest`,
    );
  }
  return file;
}

/** All file paths in a chapter's cumulative snapshot, sorted. */
export function chapterFiles(chapterId: string): string[] {
  return Object.keys(manifest.chapters[chapterId]?.files ?? {}).sort();
}

/** File changes introduced in this specific chapter, including deletions. */
export function chapterFileChanges(chapterId: string): Record<string, SnapshotChange> {
  const snap = manifest.chapters[chapterId];
  if (!snap) return {};
  if (snap.changes) return snap.changes;
  return Object.fromEntries(
    Object.entries(snap.files)
      .filter(([, f]) => f.status !== 'unchanged')
      .map(([path, f]) => [path, { ...f, status: f.status as 'added' | 'modified' }]),
  );
}

/** Paths added, modified or deleted in this specific chapter. */
export function chapterChangedFiles(chapterId: string): string[] {
  return Object.keys(chapterFileChanges(chapterId)).sort();
}
