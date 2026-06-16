import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideRouter,
  withComponentInputBinding,
  withPreloading,
  withViewTransitions,
} from '@angular/router';

import { routes } from './app.routes';
import { errorInterceptor } from './core/api/error.interceptor';
import { authInterceptor } from './core/auth/auth.interceptor';
import { IdlePreloadStrategy } from './core/perf/idle-preload.strategy';

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
    // #region step-14.11
    // #region step-22.2
    // פרק 22: withPreloading מחבר את אסטרטגיית ה-idle — אחרי המסך הראשון,
    // ה-chunks של המסכים הבאים יורדים ברקע, וניווט עתידי הופך מיידי.
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions({ skipInitialTransition: true }),
      withPreloading(IdlePreloadStrategy),
    ),
    // #endregion
    // #endregion
    // #endregion
    // #region step-11.3
    // HttpClient נכנס לתמונה — עם שני interceptors פונקציונליים:
    // auth מצרף Bearer לבקשות ל-API, error מתרגם ProblemDetails לטוסט.
    // הסדר קובע: הבקשה עוברת אותם משמאל לימין, התשובה בכיוון ההפוך.
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    // #endregion
  ],
};
// #endregion
