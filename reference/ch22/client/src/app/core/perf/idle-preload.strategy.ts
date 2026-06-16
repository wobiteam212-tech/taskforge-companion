import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

// #region step-22.1
// אסטרטגיית preload משלנו: לא eager (לא מורידים הכול מראש ומעכבים את הטעינה
// הראשונה), ולא lazy-בלבד (לא מחכים שהמשתמש ילחץ ואז יראה ספינר). ה-middle
// ground: אחרי שהמסך הראשון מוכן, מורידים ברקע את ה-chunks של המסכים הבאים,
// כך שניווט עתידי הוא מיידי. route יכול לוותר עם data: { preload: false }.
@Injectable({ providedIn: 'root' })
export class IdlePreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (route.data?.['preload'] === false) {
      return of(null);
    }
    // השהיה קצרה נותנת ל-bootstrap ולמסך הראשון לסיים, ואז ה-chunk יורד ברקע
    return timer(1500).pipe(mergeMap(() => load()));
  }
}
// #endregion
