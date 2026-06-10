import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ALL_CHAPTERS, READY_CHAPTERS, WAVES, findChapter } from '../../registry/registry';
import { ProgressService } from '../../state/progress';

/** Roadmap home: hero, continue banner, wave map with chapter cards. */
@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly progress = inject(ProgressService);

  protected readonly waves = WAVES;
  protected readonly totalChapters = ALL_CHAPTERS.length;
  protected readonly readyCount = READY_CHAPTERS.length;

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
}
