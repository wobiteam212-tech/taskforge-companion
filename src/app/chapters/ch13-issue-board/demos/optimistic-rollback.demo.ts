import { Component, DestroyRef, computed, inject, linkedSignal, signal } from '@angular/core';

interface FakeIssue {
  id: number;
  title: string;
  status: 'Open' | 'InProgress' | 'Done';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
}

const SEED_ISSUES: FakeIssue[] = [
  { id: 1, title: 'Fix login redirect loop', status: 'InProgress', priority: 'Critical' },
  { id: 2, title: 'New hero section', status: 'Open', priority: 'Medium' },
  { id: 3, title: 'Polish the navbar', status: 'Open', priority: 'Low' },
  { id: 4, title: 'Optimize image pipeline', status: 'Done', priority: 'High' },
];

type LogEntry = { kind: 'optimistic' | 'confirm' | 'rollback' | 'error'; text: string };

/**
 * דמו: עדכון אופטימי עם rollback. רשימה מזויפת + לחצן "break server" +
 * לוג שמתעד optimistic, confirm ו-rollback בנפרד.
 * מבנה: linkedSignal מאפשר עריכה מקומית; תשובת שרת (מדומה) מאפסת אותו.
 */
@Component({
  selector: 'optimistic-rollback-demo',
  templateUrl: './optimistic-rollback.demo.html',
  styleUrl: './optimistic-rollback.demo.scss',
})
export class OptimisticRollbackDemo {
  private readonly destroyRef = inject(DestroyRef);

  /** האמת המדומה שהגיעה "מהשרת" — server source of truth */
  private readonly serverIssues = signal<FakeIssue[]>(structuredClone(SEED_ISSUES));

  /** linkedSignal: ה-store מציגה מהשרת, פקודות אופטימיות כותבות לכאן לפני התגובה */
  readonly issues = linkedSignal<FakeIssue[]>(() => this.serverIssues());

  readonly breakServer = signal(false);

  readonly log = signal<LogEntry[]>([]);

  readonly pendingId = signal<number | null>(null);

  readonly statuses: ('Open' | 'InProgress' | 'Done')[] = ['Open', 'InProgress', 'Done'];

  readonly timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const t of this.timers) clearTimeout(t);
    });
  }

  protected toneOf(status: string): string {
    return status === 'Open' ? 'open' : status === 'InProgress' ? 'progress' : 'done';
  }

  protected changeStatus(issue: FakeIssue, newStatus: 'Open' | 'InProgress' | 'Done'): void {
    if (newStatus === issue.status) return;
    if (this.pendingId() !== null) return; // מונע לחיצות מרובות במקביל

    const before = this.issues();
    this.pendingId.set(issue.id);

    // --- שלב 1: עדכון אופטימי (מיידי) ---
    this.issues.update((list) =>
      list.map((i) => (i.id === issue.id ? { ...i, status: newStatus } : i)),
    );
    this.pushLog('optimistic', `Optimistic: issue #${issue.id} status set to "${newStatus}"`);

    // --- שלב 2: בקשה לשרת (מדומה, ~900ms) ---
    const t = setTimeout(() => {
      this.pendingId.set(null);

      if (this.breakServer()) {
        // שרת נכשל — rollback
        this.issues.set(before);
        this.pushLog('rollback', `Rollback: issue #${issue.id} reverted to "${issue.status}"`);
        this.pushLog('error', 'Cannot reach the server — is the API running?');
      } else {
        // שרת מאשר — מעדכנים את ה-serverIssues (גורם ל-linkedSignal להתאפס מחדש)
        this.serverIssues.update((list) =>
          list.map((i) => (i.id === issue.id ? { ...i, status: newStatus } : i)),
        );
        this.pushLog('confirm', `Confirmed: server echoed status "${newStatus}" for issue #${issue.id}`);
      }
    }, 900);

    this.timers.push(t);
  }

  protected clearLog(): void {
    this.log.set([]);
  }

  private pushLog(kind: LogEntry['kind'], text: string): void {
    this.log.update((l) => [{ kind, text }, ...l].slice(0, 20));
  }
}
