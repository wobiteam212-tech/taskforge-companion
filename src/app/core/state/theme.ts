import { Injectable, effect, signal } from '@angular/core';

export type Theme = 'dark' | 'light';

const KEY = 'taskforge-companion-theme';

/** Forge theme: dark graphite by default, warm-paper light on demand. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.initial());

  constructor() {
    effect(() => {
      const t = this.theme();
      document.documentElement.setAttribute('data-theme', t);
      try {
        localStorage.setItem(KEY, t);
      } catch {
        /* private mode */
      }
    });
  }

  toggle(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  private initial(): Theme {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      /* private mode */
    }
    return 'dark';
  }
}
