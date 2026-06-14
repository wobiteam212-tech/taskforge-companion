import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommandRegistry } from '../../core/commands/command-registry';
import { Command } from '../../core/commands/command.model';
import { fuzzyRank } from '../../core/commands/fuzzy';
import { SearchResults } from '../../core/models/search.model';
import { PaletteService } from './palette.service';
import { SearchService } from './search.service';

// #region step-16.8
// ה-palette הוא צרכן טיפש: הוא לא יודע אילו פקודות קיימות או מי רשם אותן.
// הוא קורא את ה-registry, מסנן ב-fuzzy, ומריץ את הנבחרת. אותו גשר
// signal->DOM של tf-dialog (פרק 09) נותן focus trap, Escape ו-backdrop בחינם.
@Component({
  selector: 'tf-command-palette',
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.scss',
})
export class CommandPalette {
  private readonly registry = inject(CommandRegistry);
  private readonly search = inject(SearchService);
  private readonly router = inject(Router);
  protected readonly palette = inject(PaletteService);

  private readonly dlg = viewChild<ElementRef<HTMLDialogElement>>('dlg');
  private readonly queryInput = viewChild<ElementRef<HTMLInputElement>>('q');

  protected readonly query = signal('');
  protected readonly active = signal(0);

  // #region step-16.16
  // התוצאות = פקודות מקומיות (fuzzy) + תוצאות חיפוש מהשרת, ממופות לאותו
  // טיפוס Command. כך כל לוגיקת הניווט/הרצה נשארת זהה — hit הוא פשוט פקודה
  // שה-run שלה מנווט.
  protected readonly results = computed<Command[]>(() => {
    const local = fuzzyRank(
      this.registry.commands(),
      this.query(),
      (c) => `${c.title} ${c.group} ${c.keywords ?? ''}`,
    );
    return [...local, ...this.toHitCommands(this.search.results())];
  });

  private toHitCommands(hits: SearchResults): Command[] {
    const projects = hits.projects.map<Command>((p) => ({
      id: `hit.project.${p.id}`,
      title: p.name,
      group: 'Project',
      run: () => void this.router.navigate(['/projects', p.id]),
    }));
    const issues = hits.issues.map<Command>((i) => ({
      id: `hit.issue.${i.id}`,
      title: i.title,
      group: 'Issue',
      run: () => void this.router.navigate(['/projects', i.projectId, 'issues', i.id]),
    }));
    return [...projects, ...issues];
  }
  // #endregion

  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimer));

    // גשר signal->DOM: showModal/close לפי ה-open signal, כמו tf-dialog
    effect(() => {
      const el = this.dlg()?.nativeElement;
      if (!el) return;
      if (this.palette.open() && !el.open) {
        this.query.set('');
        this.search.setQuery('');
        this.active.set(0);
        el.showModal();
        queueMicrotask(() => this.queryInput()?.nativeElement.focus());
      } else if (!this.palette.open() && el.open) {
        el.close();
      }
    });

    // התוצאות התכווצו? אל תשאיר את ה-active מצביע מעבר לסוף
    effect(() => {
      const len = this.results().length;
      if (this.active() > len - 1) this.active.set(Math.max(0, len - 1));
    });
  }

  protected onInput(value: string): void {
    this.query.set(value);
    this.active.set(0);
    // debounce הוא דאגת UI: ה-store/שירות נשארים פשוטים וסינכרוניים
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.search.setQuery(value), 200);
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

  protected run(cmd: Command): void {
    this.palette.close();
    cmd.run();
  }

  protected onClose(): void {
    this.palette.close();
  }
}
// #endregion
