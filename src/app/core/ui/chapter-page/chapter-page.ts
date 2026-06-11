import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  resource,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { findChapter, nextChapter, prevChapter } from '../../registry/registry';
import { ProgressService } from '../../state/progress';
import { chapterFiles } from '../../source/manifest';
import { Blocks } from '../blocks/blocks';
import { PanelHost } from '../panels/panel-host';
import { Quiz } from '../quiz/quiz';
import { SourceBrowser } from '../source-browser/source-browser';

type EndTab = 'quiz' | 'prove' | 'exercise' | 'source';

/**
 * The scrollytelling chapter engine — the Angular descendant of HireHub's
 * scrolly.js. Narrative steps scroll on the inline-start side (right, in RTL);
 * the matching visual panel crossfades in a sticky stage. An
 * IntersectionObserver with a −45% activation band keeps them in sync, feeds
 * the progress service, the top progress bar and the step rail. On narrow
 * screens panels render inline under their step instead (data-driven, no DOM
 * reparenting). The chapter ends with Quiz / Prove-it / Exercise / Full-source
 * tabs.
 */
@Component({
  selector: 'chapter-page',
  imports: [RouterLink, Blocks, PanelHost, Quiz, SourceBrowser],
  templateUrl: './chapter-page.html',
  styleUrl: './chapter-page.scss',
})
export class ChapterPage {
  private readonly route = inject(ActivatedRoute);
  protected readonly progress = inject(ProgressService);

  /** bound from route data via withComponentInputBinding() */
  readonly chapterId = input.required<string>();

  protected readonly meta = computed(() => findChapter(this.chapterId()));
  protected readonly prev = computed(() => prevChapter(this.chapterId()));
  protected readonly next = computed(() => nextChapter(this.chapterId()));

  protected readonly contentRes = resource({
    params: () => this.meta(),
    loader: ({ params }) => params?.loadContent?.() ?? Promise.resolve(null),
  });

  protected readonly steps = computed(() => this.contentRes.value()?.steps ?? []);

  /* ---------- scroll sync ---------- */

  protected readonly activeIndex = signal(0);

  /** panels render lazily as you approach them, then stay alive (no flicker) */
  private readonly renderedUpTo = signal(1);

  private readonly scrollyEl = viewChild<ElementRef<HTMLElement>>('scrollyEl');
  private readonly stepEls = viewChildren<ElementRef<HTMLElement>>('stepEl');

  protected readonly isNarrow = signal(false);
  protected readonly showRail = signal(false);

  private readonly fragment = toSignal(this.route.fragment);
  private scrolledFragment: string | null = null;

  protected readonly pct = computed(() => {
    const total = this.steps().length;
    return total ? Math.round(((this.activeIndex() + 1) / total) * 100) : 0;
  });

  constructor() {
    // Container watcher — the sidebar consumes viewport space, so chapter
    // layout must react to the actual main-column width, not window width.
    afterRenderEffect((onCleanup) => {
      const el = this.scrollyEl()?.nativeElement;
      if (!el) return;
      const update = () => {
        const width = el.getBoundingClientRect().width;
        this.isNarrow.set(width < 1040);
        this.showRail.set(width >= 1260);
      };
      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      onCleanup(() => ro.disconnect());
    });

    // step↔panel sync: observe rendered steps with a center activation band
    afterRenderEffect((onCleanup) => {
      const els = this.stepEls();
      if (!els.length) return;
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const idx = els.findIndex((el) => el.nativeElement === entry.target);
            if (idx >= 0) this.activateStep(idx);
          }
        },
        { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
      );
      for (const el of els) io.observe(el.nativeElement);
      onCleanup(() => io.disconnect());
    });

    // deep links (#step-1.3 from search/glossary): scroll once content rendered
    afterRenderEffect(() => {
      const frag = this.fragment();
      const els = this.stepEls();
      if (!frag || !els.length) return;
      const key = `${this.chapterId()}:${frag}`;
      if (this.scrolledFragment === key) return;
      const el = document.getElementById(frag);
      if (el) {
        this.scrolledFragment = key;
        el.scrollIntoView({ block: 'center' });
      }
    });
  }

  private activateStep(idx: number): void {
    this.activeIndex.set(idx);
    if (idx + 1 > this.renderedUpTo()) this.renderedUpTo.set(idx + 1);
    const step = this.steps()[idx];
    if (step) this.progress.markStepSeen(this.chapterId(), step.id);
  }

  protected shouldRenderPanel(idx: number): boolean {
    return idx <= this.renderedUpTo();
  }

  protected goTo(idx: number): void {
    const el = this.stepEls()[idx]?.nativeElement;
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ---------- end sections ---------- */

  protected readonly endTab = signal<EndTab>('quiz');

  protected readonly sourceFiles = computed(() => chapterFiles(this.chapterId()));

  protected toggleDone(): void {
    this.progress.toggleDone(this.chapterId());
  }

  protected toggleBookmark(): void {
    this.progress.toggleBookmark(this.chapterId());
  }
}
