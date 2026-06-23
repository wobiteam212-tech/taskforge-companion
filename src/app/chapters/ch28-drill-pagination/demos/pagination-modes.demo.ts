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
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, defer, finalize, map, switchMap, tap, timer } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface Row {
  id: number;
  name: string;
}
interface Query {
  page: number;
  search: string;
}
interface PageResult {
  items: Row[];
  total: number;
  page: number;
  pageSize: number;
}

type Mode = 'local' | 'offset' | 'rxjs' | 'infinite';

const TOTAL = 137;
const PAGE_SIZE = 10;
const LATENCY = 700;

/**
 * Demo for ch28 — the same dataset paged four ways, so the trade-offs are
 * visible side by side:
 *   - local:    client already has all rows, slice with a computed(). Instant.
 *   - offset:   simulated server window (skip/take) + total-count envelope.
 *   - rxjs:     page$ + debounced search$ into switchMap — rapid paging shows
 *               switchMap CANCELLING the stale request (the log proves it).
 *   - infinite: IntersectionObserver sentinel appends the next window.
 * All timers cleaned in DestroyRef; the rxjs stream uses takeUntilDestroyed.
 */
@Component({
  selector: 'demo-pagination',
  templateUrl: './pagination-modes.demo.html',
  styleUrl: './pagination-modes.demo.scss',
})
export class PaginationModesDemo {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly mode = signal<Mode>('rxjs');
  protected readonly modes: { id: Mode; label: string }[] = [
    { id: 'local', label: 'local slice' },
    { id: 'offset', label: 'server offset' },
    { id: 'rxjs', label: 'RxJS switchMap' },
    { id: 'infinite', label: 'infinite scroll' },
  ];

  private readonly all: Row[] = Array.from({ length: TOTAL }, (_, i) => ({
    id: i + 1,
    name: `Issue #${i + 1}`,
  }));

  // ---------- 1. local slice (pure signals) ----------
  protected readonly localPage = signal(1);
  protected readonly localTotalPages = Math.ceil(TOTAL / PAGE_SIZE);
  protected readonly localView = computed(() => {
    const start = (this.localPage() - 1) * PAGE_SIZE;
    return this.all.slice(start, start + PAGE_SIZE);
  });

  // ---------- 2. server offset (simulated async) ----------
  protected readonly offsetPage = signal(1);
  protected readonly offsetResult = signal<PageResult | null>(null);
  protected readonly offsetLoading = signal(false);
  protected readonly offsetTotalPages = computed(() =>
    Math.ceil((this.offsetResult()?.total ?? TOTAL) / PAGE_SIZE),
  );

  // ---------- 3. rxjs (page$ + search$ -> switchMap) ----------
  protected readonly rxPage = signal(1);
  protected readonly rxSearch = signal('');
  protected readonly rxResult = signal<PageResult | null>(null);
  protected readonly rxLoading = signal(false);
  protected readonly reqLog = signal<string[]>([]);
  protected readonly rxTotalPages = computed(() =>
    Math.ceil((this.rxResult()?.total ?? 0) / PAGE_SIZE),
  );
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  // ---------- 4. infinite scroll ----------
  protected readonly infinite = signal<Row[]>([]);
  protected readonly infiniteLoading = signal(false);
  private infinitePage = 0;
  private readonly sentinel = viewChild<ElementRef<HTMLElement>>('sentinel');
  private io: IntersectionObserver | null = null;
  private observed: Element | null = null;

  constructor() {
    // The reactive query: page changes go straight through (so each rapid click
    // fires a request that switchMap then cancels), while search is debounced.
    const page$ = toObservable(this.rxPage);
    const search$ = toObservable(this.rxSearch).pipe(debounceTime(300), distinctUntilChanged());

    combineLatest([page$, search$])
      .pipe(
        map(([page, search]): Query => ({ page, search })),
        tap(() => this.rxLoading.set(true)),
        switchMap((q) => this.serverPage$(q)),
        tap(() => this.rxLoading.set(false)),
        takeUntilDestroyed(),
      )
      .subscribe((res) => this.rxResult.set(res));

    // Attach the IntersectionObserver whenever the sentinel element appears
    // (it only exists while the infinite tab is active), and re-attach if the
    // tab is left and re-entered.
    effect(() => {
      const el = this.sentinel()?.nativeElement ?? null;
      if (el === this.observed) return;
      this.io?.disconnect();
      this.observed = el;
      if (!el) return;
      this.io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) this.loadMore();
      });
      this.io.observe(el);
      this.loadMore(); // first window
    });

    this.destroyRef.onDestroy(() => {
      this.io?.disconnect();
      for (const t of this.timers) clearTimeout(t);
      this.timers.clear();
    });
  }

  // ---- local ----
  protected localPrev(): void {
    this.localPage.update((p) => Math.max(1, p - 1));
  }
  protected localNext(): void {
    this.localPage.update((p) => Math.min(this.localTotalPages, p + 1));
  }

  // ---- offset ----
  protected offsetGo(page: number): void {
    const target = Math.min(this.offsetTotalPages(), Math.max(1, page));
    this.offsetPage.set(target);
    this.offsetLoading.set(true);
    const t = setTimeout(() => {
      this.timers.delete(t);
      this.offsetResult.set(this.computePage({ page: target, search: '' }));
      this.offsetLoading.set(false);
    }, LATENCY);
    this.timers.add(t);
  }

  // ---- rxjs ----
  protected rxPrev(): void {
    this.rxPage.update((p) => Math.max(1, p - 1));
  }
  protected rxNext(): void {
    this.rxPage.update((p) => p + 1);
  }
  /** Fire several page jumps ~150ms apart: switchMap cancels each stale one. */
  protected rapidNext(): void {
    [150, 300, 450, 600].forEach((ms) => {
      const t = setTimeout(() => {
        this.timers.delete(t);
        this.rxPage.update((p) => p + 1);
      }, ms);
      this.timers.add(t);
    });
  }
  protected onSearch(value: string): void {
    this.rxPage.set(1);
    this.rxSearch.set(value);
  }
  protected clearLog(): void {
    this.reqLog.set([]);
  }

  // ---- infinite ----
  protected loadMore(): void {
    if (this.infiniteLoading() || this.infinite().length >= TOTAL) return;
    this.infiniteLoading.set(true);
    const next = this.infinitePage + 1;
    const t = setTimeout(() => {
      this.timers.delete(t);
      const page = this.computePage({ page: next, search: '' });
      this.infinitePage = next;
      // scan-style accumulation: append the new window to what we have
      this.infinite.update((acc) => [...acc, ...page.items]);
      this.infiniteLoading.set(false);
    }, LATENCY / 2);
    this.timers.add(t);
  }

  // ---- shared fake server ----
  private computePage(q: Query): PageResult {
    const filtered = q.search
      ? this.all.filter((r) => r.name.toLowerCase().includes(q.search.toLowerCase()))
      : this.all;
    const start = (q.page - 1) * PAGE_SIZE;
    return {
      items: filtered.slice(start, start + PAGE_SIZE),
      total: filtered.length,
      page: q.page,
      pageSize: PAGE_SIZE,
    };
  }

  private serverPage$(q: Query) {
    return defer(() => {
      let emitted = false;
      const label = q.search ? `page ${q.page} "${q.search}"` : `page ${q.page}`;
      this.pushReq(`request ${label}`);
      return timer(LATENCY).pipe(
        map(() => this.computePage(q)),
        tap(() => {
          emitted = true;
          this.pushReq(`applied ${label}`);
        }),
        finalize(() => {
          if (!emitted) this.pushReq(`cancelled ${label}`);
        }),
      );
    });
  }

  private pushReq(line: string): void {
    this.reqLog.update((l) => [line, ...l].slice(0, 8));
  }
}
