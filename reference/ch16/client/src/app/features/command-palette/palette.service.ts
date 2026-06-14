import { Injectable, signal } from '@angular/core';

// #region step-16.7
// מצב הפתיחה של ה-palette כ-signal יחיד. ה-shell פותח (Cmd+K),
// הרכיב צורך. הפרדה נקייה בין "מתי פתוח" ל"איך זה נראה".
@Injectable({ providedIn: 'root' })
export class PaletteService {
  readonly open = signal(false);

  toggle(): void {
    this.open.update((v) => !v);
  }

  close(): void {
    this.open.set(false);
  }
}
// #endregion
