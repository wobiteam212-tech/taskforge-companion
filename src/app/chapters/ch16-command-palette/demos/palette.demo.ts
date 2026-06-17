import { Component, computed, signal } from '@angular/core';

interface DemoCommand {
  id: string;
  title: string;
  group: string;
  keywords: string;
}

const COMMANDS: DemoCommand[] = [
  { id: 'nav.projects', title: 'Go to all projects', group: 'Navigation', keywords: 'home projects' },
  { id: 'view.theme', title: 'Toggle dark / light mode', group: 'View', keywords: 'theme dark light' },
  { id: 'issue.create', title: 'Create new issue', group: 'Issues', keywords: 'new issue create' },
  { id: 'board.open', title: 'Open the board', group: 'Navigation', keywords: 'board kanban' },
  { id: 'auth.signout', title: 'Sign out', group: 'Identity', keywords: 'sign out logout' },
  { id: 'search.issues', title: 'Search issues', group: 'Issues', keywords: 'search find' },
];

// אותו scorer של fuzzy.ts בפרק 16, בגרסה עצמאית לדמו: כל תווי ה-query
// חייבים להופיע לפי הסדר; בונוס על תחילת מילה ועל רצף.
function fuzzyScore(text: string, query: string): number {
  if (!query) return 0;
  const t = text.toLowerCase();
  let score = 0;
  let from = 0;
  let prev = -2;
  for (const ch of query.toLowerCase()) {
    const at = t.indexOf(ch, from);
    if (at === -1) return -1;
    score += at === 0 || /[\s\-/_]/.test(t[at - 1]) ? 8 : 1;
    if (at === prev + 1) score += 3;
    prev = at;
    from = at + 1;
  }
  return score;
}

/**
 * דמו: command palette מוקטן ותמיד-פתוח. fuzzy filter, ניווט במקלדת
 * (חיצים + Enter), ולוג של מה שהורץ — המודל של פרק 16 בלי השרת וה-overlay.
 */
@Component({
  selector: 'demo-command-palette',
  templateUrl: './palette.demo.html',
  styleUrl: './palette.demo.scss',
})
export class CommandPaletteDemo {
  protected readonly query = signal('');
  protected readonly active = signal(0);
  protected readonly log = signal<string[]>([]);

  protected readonly results = computed<DemoCommand[]>(() => {
    const q = this.query().trim();
    if (!q) return COMMANDS;
    return COMMANDS.map((c) => ({ c, s: fuzzyScore(`${c.title} ${c.group} ${c.keywords}`, q) }))
      .filter((r) => r.s >= 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.c);
  });

  protected onInput(value: string): void {
    this.query.set(value);
    this.active.set(0);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const len = this.results().length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.active.update((i) => (len ? (i + 1) % len : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.active.update((i) => (len ? (i - 1 + len) % len : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const cmd = this.results()[this.active()];
      if (cmd) this.run(cmd);
    }
  }

  protected run(cmd: DemoCommand): void {
    this.log.update((l) => [`Ran: ${cmd.title}`, ...l].slice(0, 5));
  }
}
