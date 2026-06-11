import { Injectable, effect, signal } from '@angular/core';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'taskforge-theme';

// #region step-8.8
// signal מחזיק את הבחירה; effect הוא הגשר היחיד אל ה-DOM וה-storage.
// זה שימוש לגיטימי ב-effect: סנכרון עולם חיצוני, לא גזירת state.
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(initialTheme());

  constructor() {
    effect(() => {
      const theme = this.theme();
      document.documentElement.dataset['theme'] = theme;
      localStorage.setItem(STORAGE_KEY, theme);
    });
  }

  toggle(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }
}

function initialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  // אין העדפה שמורה: שואלים את מערכת ההפעלה. הקריאה אופציונלית בכוונה —
  // הטסטים רצים ב-jsdom, והדפדפן הוא לא הסביבה היחידה של הקוד הזה.
  return globalThis.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}
// #endregion
