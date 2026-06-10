import { Component, computed, signal } from '@angular/core';

type EntityState = 'Unchanged' | 'Added' | 'Modified' | 'Deleted';

interface TrackedRow {
  id: number;
  name: string;
  state: EntityState;
}

let nextId = 4;

const LOADED: TrackedRow[] = [
  { id: 1, name: 'Website Redesign', state: 'Unchanged' },
  { id: 2, name: 'Mobile App', state: 'Unchanged' },
];

/**
 * Interactive EF Change Tracker: every entity the context serves gets a
 * state. SaveChanges reads the states, emits exactly the right SQL, and
 * resets everything to Unchanged. Click through the whole lifecycle.
 */
@Component({
  selector: 'demo-tracker',
  templateUrl: './tracker.demo.html',
  styleUrl: './tracker.demo.scss',
})
export class TrackerDemo {
  protected readonly rows = signal<TrackedRow[]>(structuredClone(LOADED));
  protected readonly sql = signal<string[]>([]);

  protected readonly pendingCount = computed(
    () => this.rows().filter((r) => r.state !== 'Unchanged').length,
  );

  protected readonly sqlText = computed(() => this.sql().join('\n'));

  protected reload(): void {
    this.rows.set(structuredClone(LOADED));
    this.sql.set([]);
  }

  protected modifyFirst(): void {
    this.rows.update((rows) => {
      const target = rows.find((r) => r.state === 'Unchanged');
      if (!target) return rows;
      return rows.map((r) =>
        r === target ? { ...r, name: r.name + ' v2', state: 'Modified' as const } : r,
      );
    });
  }

  protected addNew(): void {
    this.rows.update((rows) => [
      ...rows,
      { id: nextId++, name: 'New Project', state: 'Added' },
    ]);
  }

  protected deleteLast(): void {
    this.rows.update((rows) => {
      const target = [...rows].reverse().find((r) => r.state !== 'Deleted');
      if (!target) return rows;
      return rows.map((r) => (r === target ? { ...r, state: 'Deleted' as const } : r));
    });
  }

  protected saveChanges(): void {
    const statements: string[] = [];
    for (const r of this.rows()) {
      if (r.state === 'Added') {
        statements.push(`INSERT INTO Projects (Name) VALUES ('${r.name}');`);
      } else if (r.state === 'Modified') {
        statements.push(`UPDATE Projects SET Name = '${r.name}' WHERE Id = ${r.id};`);
      } else if (r.state === 'Deleted') {
        statements.push(`DELETE FROM Projects WHERE Id = ${r.id};`);
      }
    }
    this.sql.set(statements.length ? statements : ['-- אין שינויים; שום SQL לא נשלח']);
    this.rows.update((rows) =>
      rows
        .filter((r) => r.state !== 'Deleted')
        .map((r) => ({ ...r, state: 'Unchanged' as const })),
    );
  }
}
