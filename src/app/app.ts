import { Component, computed, inject, signal } from '@angular/core';
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
})
export class App {
  private readonly router = inject(Router);
  private readonly search = inject(SearchService);
  protected readonly theme = inject(ThemeService);
  protected readonly progress = inject(ProgressService);

  protected readonly waves = WAVES;

  protected readonly sidebarOpen = signal(false);

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
