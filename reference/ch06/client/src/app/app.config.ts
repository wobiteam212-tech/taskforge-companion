import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

// #region step-6.8
export const appConfig: ApplicationConfig = {
  providers: [
    // zoneless הוא ברירת המחדל ב-v22 (אין zone.js ב-package.json) —
    // אנחנו מצהירים עליו במפורש כדי שהבחירה תהיה גלויה, לא מובלעת.
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
  ],
};
// #endregion
