import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { WAVES, findChapter } from './core/registry/registry';
import { ThemeService } from './core/state/theme';
import { ProgressService } from './core/state/progress';
import { SearchHit, SearchService } from './core/state/search';

/** App shell: sidebar (waves, search, resume, progress) + theme toggle + outlet. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: {
    '(document:keydown.escape)': 'closeNav()',
  },
})
export class App {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly search = inject(SearchService);
  protected readonly theme = inject(ThemeService);
  protected readonly progress = inject(ProgressService);

  protected readonly waves = WAVES;

  protected readonly sidebarOpen = signal(false);
  protected readonly mobileNav = signal(false);
  protected readonly navHidden = computed(() => this.mobileNav() && !this.sidebarOpen());
  protected readonly mainHidden = computed(() => this.mobileNav() && this.sidebarOpen());

  constructor() {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return;

    const query = window.matchMedia('(max-width: 900px)');
    const update = () => {
      this.mobileNav.set(query.matches);
      if (!query.matches) this.sidebarOpen.set(false);
    };

    update();
    query.addEventListener('change', update);
    this.destroyRef.onDestroy(() => query.removeEventListener('change', update));
  }

  protected toggleNav(): void {
    this.sidebarOpen.update((open) => !open);
  }

  /* ---------- search ---------- */
  protected readonly q = signal('');
  protected readonly hits = signal<SearchHit[]>([]);
  private searchToken = 0;

  protected onSearch(value: string): void {
    this.q.set(value);
    const token = ++this.searchToken;
    void this.search.search(value).then((hits) => {
      if (token === this.searchToken) this.hits.set(hits);
    });
  }

  protected openHit(hit: SearchHit): void {
    this.q.set('');
    this.hits.set([]);
    this.sidebarOpen.set(false);
    void this.router.navigate(['/chapters', hit.slug], {
      fragment: hit.stepId ? `step-${hit.stepId}` : undefined,
    });
  }

  /* ---------- resume where you left off ---------- */
  protected readonly resume = computed(() => {
    const last = this.progress.last();
    if (!last) return undefined;
    const meta = findChapter(last.chapter);
    if (!meta || meta.status !== 'ready') return undefined;
    return { slug: meta.slug, title: meta.title, fragment: `step-${last.step}` };
  });

  protected pad(no: number): string {
    return no.toString().padStart(2, '0');
  }

  protected closeNav(): void {
    this.sidebarOpen.set(false);
  }
}
