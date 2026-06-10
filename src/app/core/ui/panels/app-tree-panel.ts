import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { chapterFiles, chapterChangedFiles, snapshotFile } from '../../source/manifest';
import { highlight, langFromFile } from '../../source/highlight';

interface TreeRow {
  /** full path for files, undefined for directories */
  path?: string;
  label: string;
  depth: number;
  badge?: 'new' | 'mod';
}

/**
 * The App Tree explorer — the cumulative state of the taught app at a given
 * chapter, generated from the verified snapshots (never hand-maintained).
 * Click a file to read it; "new/mod" badges mark this chapter's changes.
 */
@Component({
  selector: 'app-tree-panel',
  templateUrl: './app-tree-panel.html',
  styleUrl: './app-tree-panel.scss',
})
export class AppTreePanel {
  private readonly sanitizer = inject(DomSanitizer);

  readonly chapter = input.required<string>();
  readonly title = input<string>();

  protected readonly filter = signal('');

  protected readonly files = computed(() => chapterFiles(this.chapter()));
  private readonly changed = computed(() => new Set(chapterChangedFiles(this.chapter())));

  protected readonly rows = computed<TreeRow[]>(() => {
    const q = this.filter().trim().toLowerCase();
    const files = q ? this.files().filter((f) => f.toLowerCase().includes(q)) : this.files();
    const rows: TreeRow[] = [];
    const seenDirs = new Set<string>();
    for (const path of files) {
      const parts = path.split('/');
      for (let i = 0; i < parts.length - 1; i++) {
        const dir = parts.slice(0, i + 1).join('/');
        if (seenDirs.has(dir)) continue;
        seenDirs.add(dir);
        rows.push({ label: parts[i] + '/', depth: i });
      }
      const status = snapshotFile(this.chapter(), path).status;
      rows.push({
        path,
        label: parts[parts.length - 1],
        depth: parts.length - 1,
        badge: status === 'added' ? 'new' : status === 'modified' ? 'mod' : undefined,
      });
    }
    return rows;
  });

  /** clear the open file when the chapter changes */
  protected readonly openPath = linkedSignal<string, string | null>({
    source: this.chapter,
    computation: () => null,
  });

  protected readonly openHtml = computed<SafeHtml | null>(() => {
    const path = this.openPath();
    if (!path) return null;
    const f = snapshotFile(this.chapter(), path);
    return this.sanitizer.bypassSecurityTrustHtml(highlight(f.content, langFromFile(path)));
  });

  protected open(path: string | undefined): void {
    if (path) this.openPath.set(path);
  }
}
