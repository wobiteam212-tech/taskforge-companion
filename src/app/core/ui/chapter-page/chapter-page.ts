import {
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  resource,
  signal,
  viewChildren,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { findChapter, nextChapter, prevChapter } from '../../registry/registry';
import { ProgressService } from '../../state/progress';
import { chapterFiles, snapshotFile } from '../../source/manifest';
import { highlight, langFromFile } from '../../source/highlight';
import { Blocks } from '../blocks/blocks';
import { PanelHost } from '../panels/panel-host';
import { Quiz } from '../quiz/quiz';

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
  imports: [RouterLink, Blocks, PanelHost, Quiz],
  templateUrl: './chapter-page.html',
  styleUrl: './chapter-page.scss',
})
export class ChapterPage {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);
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

  private readonly stepEls = viewChildren<ElementRef<HTMLElement>>('stepEl');

  protected readonly isNarrow = signal(false);

  private readonly fragment = toSignal(this.route.fragment);
  private fragmentConsumed = false;

  protected readonly pct = computed(() => {
    const total = this.steps().length;
    return total ? Math.round(((this.activeIndex() + 1) / total) * 100) : 0;
  });

  constructor() {
    // viewport watcher — drives the narrative/stage vs single-column layout
    const mq = window.matchMedia('(max-width: 900px)');
    this.isNarrow.set(mq.matches);
    const onChange = (e: MediaQueryListEvent) => this.isNarrow.set(e.matches);
    mq.addEventListener('change', onChange);
    this.destroyRef.onDestroy(() => mq.removeEventListener('change', onChange));

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
      if (this.fragmentConsumed || !frag || !els.length) return;
      const el = document.getElementById(frag);
      if (el) {
        this.fragmentConsumed = true;
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

  protected readonly openSource = signal<string | null>(null);

  protected readonly openSourceHtml = computed<SafeHtml | null>(() => {
    const path = this.openSource();
    if (!path) return null;
    const f = snapshotFile(this.chapterId(), path);
    return this.sanitizer.bypassSecurityTrustHtml(highlight(f.content, langFromFile(path)));
  });

  protected toggleDone(): void {
    this.progress.toggleDone(this.chapterId());
  }

  protected toggleBookmark(): void {
    this.progress.toggleBookmark(this.chapterId());
  }
}
