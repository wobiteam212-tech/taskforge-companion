import { Injectable, computed, signal } from '@angular/core';
import { ALL_CHAPTERS } from '../registry/registry';

interface StoreShape {
  seenSteps: Record<string, string[]>;
  doneChapters: string[];
  bookmarks: string[];
  quiz: Record<string, { score: number; total: number }>;
  last?: { chapter: string; step: string };
}

const KEY = 'taskforge-companion-progress';
const VALID_IDS = new Set(ALL_CHAPTERS.map((c) => c.id));

/**
 * localStorage-backed learning progress: which steps were read, which
 * chapters are done, quiz scores, bookmarks, and where you left off
 * (powers the "continue" banner + sidebar checkmarks).
 */
@Injectable({ providedIn: 'root' })
export class ProgressService {
  readonly seenSteps = signal<Readonly<Record<string, ReadonlySet<string>>>>({});
  readonly doneChapters = signal<ReadonlySet<string>>(new Set());
  readonly bookmarks = signal<ReadonlySet<string>>(new Set());
  readonly quiz = signal<Readonly<Record<string, { score: number; total: number }>>>({});
  readonly last = signal<{ chapter: string; step: string } | undefined>(undefined);

  readonly doneCount = computed(() => this.doneChapters().size);

  constructor() {
    this.load();
  }

  isDone(chapterId: string): boolean {
    return this.doneChapters().has(chapterId);
  }

  isBookmarked(chapterId: string): boolean {
    return this.bookmarks().has(chapterId);
  }

  seenCount(chapterId: string): number {
    return this.seenSteps()[chapterId]?.size ?? 0;
  }

  quizScore(chapterId: string): { score: number; total: number } | undefined {
    return this.quiz()[chapterId];
  }

  markStepSeen(chapterId: string, stepId: string): void {
    if (!VALID_IDS.has(chapterId)) return;
    this.seenSteps.update((all) => {
      const set = new Set(all[chapterId] ?? []);
      if (set.has(stepId)) return all;
      set.add(stepId);
      return { ...all, [chapterId]: set };
    });
    this.last.set({ chapter: chapterId, step: stepId });
    this.save();
  }

  toggleDone(chapterId: string): void {
    if (!VALID_IDS.has(chapterId)) return;
    this.doneChapters.update((set) => this.toggle(set, chapterId));
    this.save();
  }

  toggleBookmark(chapterId: string): void {
    if (!VALID_IDS.has(chapterId)) return;
    this.bookmarks.update((set) => this.toggle(set, chapterId));
    this.save();
  }

  setQuizScore(chapterId: string, score: number, total: number): void {
    if (!VALID_IDS.has(chapterId)) return;
    this.quiz.update((all) => ({ ...all, [chapterId]: { score, total } }));
    this.save();
  }

  private toggle(set: ReadonlySet<string>, id: string): ReadonlySet<string> {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as Partial<StoreShape>;
      const seen: Record<string, ReadonlySet<string>> = {};
      for (const [ch, steps] of Object.entries(p.seenSteps ?? {})) {
        if (VALID_IDS.has(ch)) seen[ch] = new Set(steps);
      }
      this.seenSteps.set(seen);
      this.doneChapters.set(new Set((p.doneChapters ?? []).filter((id) => VALID_IDS.has(id))));
      this.bookmarks.set(new Set((p.bookmarks ?? []).filter((id) => VALID_IDS.has(id))));
      this.quiz.set(p.quiz ?? {});
      if (p.last && VALID_IDS.has(p.last.chapter)) this.last.set(p.last);
    } catch {
      /* corrupted store — start clean */
    }
  }

  private save(): void {
    try {
      const seen: Record<string, string[]> = {};
      for (const [ch, set] of Object.entries(this.seenSteps())) seen[ch] = [...set];
      const payload: StoreShape = {
        seenSteps: seen,
        doneChapters: [...this.doneChapters()],
        bookmarks: [...this.bookmarks()],
        quiz: { ...this.quiz() },
        last: this.last(),
      };
      localStorage.setItem(KEY, JSON.stringify(payload));
    } catch {
      /* localStorage can be blocked in private contexts */
    }
  }
}
