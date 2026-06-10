import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  chapterFileChanges,
  chapterFiles,
  snapshotFile,
  SnapshotChange,
  SnapshotFile,
} from '../../source/manifest';
import { highlight, langFromFile } from '../../source/highlight';

type SourceStatus = 'added' | 'modified' | 'deleted' | 'unchanged';
type StatusFilter = 'changed' | 'added' | 'modified' | 'deleted' | 'all';
type ScopeFilter = 'all' | 'backend' | 'client' | 'config';
type SourceVariant = 'panel' | 'endcap';

interface SourceEntry {
  path: string;
  status: SourceStatus;
  content: string;
  exists: boolean;
  scope: Exclude<ScopeFilter, 'all'>;
}

interface TreeRow {
  id: string;
  path?: string;
  label: string;
  depth: number;
  status?: SourceStatus;
  exists?: boolean;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'changed', label: 'השינוי בפרק' },
  { value: 'added', label: 'חדשים' },
  { value: 'modified', label: 'עודכנו' },
  { value: 'deleted', label: 'נמחקו' },
  { value: 'all', label: 'כל הקבצים' },
];

const SCOPE_OPTIONS: { value: ScopeFilter; label: string }[] = [
  { value: 'all', label: 'הכול' },
  { value: 'backend', label: 'Backend' },
  { value: 'client', label: 'Client' },
  { value: 'config', label: 'Config' },
];

@Component({
  selector: 'source-browser',
  templateUrl: './source-browser.html',
  styleUrl: './source-browser.scss',
})
export class SourceBrowser {
  private readonly sanitizer = inject(DomSanitizer);

  readonly chapter = input.required<string>();
  readonly title = input('עץ הקוד');
  readonly variant = input<SourceVariant>('endcap');
  readonly initialStatus = input<StatusFilter>('changed');

  protected readonly query = signal('');
  protected readonly statusFilter = linkedSignal<StatusFilter, StatusFilter>({
    source: this.initialStatus,
    computation: (status) => status,
  });
  protected readonly scopeFilter = signal<ScopeFilter>('all');

  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly scopeOptions = SCOPE_OPTIONS;

  private readonly entries = computed<SourceEntry[]>(() => {
    const chapter = this.chapter();
    const changes = chapterFileChanges(chapter);
    const byPath = new Map<string, SourceEntry>();

    for (const path of chapterFiles(chapter)) {
      const file = snapshotFile(chapter, path);
      const change = changes[path];
      const status = this.existingStatus(file, change);
      byPath.set(path, {
        path,
        status,
        content: file.content,
        exists: true,
        scope: this.scopeOf(path),
      });
    }

    for (const [path, change] of Object.entries(changes)) {
      if (change.status !== 'deleted') continue;
      byPath.set(path, {
        path,
        status: 'deleted',
        content: change.content,
        exists: false,
        scope: this.scopeOf(path),
      });
    }

    return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
  });

  protected readonly visibleScopes = computed(() => {
    const scopes = new Set(this.entries().map((entry) => entry.scope));
    return this.scopeOptions.filter((option) => option.value === 'all' || scopes.has(option.value));
  });

  protected readonly visibleEntries = computed(() => {
    const query = this.query().trim().toLowerCase();
    const status = this.statusFilter();
    const scope = this.scopeFilter();
    return this.entries().filter((entry) => {
      if (query && !entry.path.toLowerCase().includes(query)) return false;
      if (scope !== 'all' && entry.scope !== scope) return false;
      if (status === 'all') return true;
      if (status === 'changed') return entry.status !== 'unchanged';
      return entry.status === status;
    });
  });

  protected readonly rows = computed<TreeRow[]>(() => {
    const rows: TreeRow[] = [];
    const seenDirs = new Set<string>();
    for (const entry of this.visibleEntries()) {
      const parts = entry.path.split('/');
      for (let i = 0; i < parts.length - 1; i++) {
        const dir = parts.slice(0, i + 1).join('/');
        if (seenDirs.has(dir)) continue;
        seenDirs.add(dir);
        rows.push({ id: `dir:${dir}`, label: `${parts[i]}/`, depth: i });
      }
      rows.push({
        id: `file:${entry.path}`,
        path: entry.path,
        label: parts[parts.length - 1],
        depth: parts.length - 1,
        status: entry.status,
        exists: entry.exists,
      });
    }
    return rows;
  });

  protected readonly openPath = linkedSignal<string, string | null>({
    source: this.chapter,
    computation: () => null,
  });

  protected readonly openEntry = computed(() => {
    const path = this.openPath();
    if (!path) return undefined;
    return this.entries().find((entry) => entry.path === path);
  });

  protected readonly openHtml = computed<SafeHtml | null>(() => {
    const entry = this.openEntry();
    if (!entry) return null;
    return this.sanitizer.bypassSecurityTrustHtml(highlight(entry.content, langFromFile(entry.path)));
  });

  protected readonly summary = computed(() => {
    const entries = this.entries();
    const changed = entries.filter((entry) => entry.status !== 'unchanged').length;
    const deleted = entries.filter((entry) => entry.status === 'deleted').length;
    return { total: entries.length, changed, deleted };
  });

  protected open(path: string | undefined): void {
    if (path) this.openPath.set(path);
  }

  protected statusLabel(status: SourceStatus): string {
    switch (status) {
      case 'added':
        return 'NEW';
      case 'modified':
        return 'MOD';
      case 'deleted':
        return 'DEL';
      case 'unchanged':
        return '';
    }
  }

  private existingStatus(file: SnapshotFile, change: SnapshotChange | undefined): SourceStatus {
    if (change?.status === 'added' || change?.status === 'modified') return change.status;
    return file.status;
  }

  private scopeOf(path: string): Exclude<ScopeFilter, 'all'> {
    if (path.startsWith('server/')) return 'backend';
    if (path.startsWith('client/')) return 'client';
    return 'config';
  }
}
