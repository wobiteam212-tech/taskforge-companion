import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';

// #region step-6.8
export const appConfig: ApplicationConfig = {
  providers: [
    // zoneless הוא ברירת המחדל ב-v22 (אין zone.js ב-package.json) —
    // אנחנו מצהירים עליו במפורש כדי שהבחירה תהיה גלויה, לא מובלעת.
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    // #region step-10.2
    // withComponentInputBinding: פרמטרים מהנתיב, query string ונתוני
    // resolver נקשרים ישירות ל-inputs של הקומפוננטה — בלי ActivatedRoute ידני.
    provideRouter(routes, withComponentInputBinding()),
    // #endregion
  ],
};
// #endregion
