import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/ui/toast/toast.service';

interface ProblemDetails {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

// #region step-11.9
// קצה אחד לכל השגיאות: השרת מדבר ProblemDetails (RFC 7807) מאז פרק 04,
// והקליינט מתרגם אותו להודעה אנושית אחת — במקום try/catch בכל רכיב.
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastSvc = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // #region step-23.9
      // 429 מה-rate limiter (פרק 23): לא שגיאה "אדומה" אלא בקשה להאט. קוראים
      // את כותרת Retry-After (שניות) ומציגים הודעה רכה — tone 'info', לא 'danger'.
      // אותו מתרגם יחיד לומד ניב שרת נוסף, בלי שאף רכיב ידע על rate limiting.
      if (err.status === 429) {
        toastSvc.show(retryText(err), 'info');
        return throwError(() => err);
      }
      // #endregion

      toastSvc.show(problemText(err), 'danger');
      // מתרגמים, לא בולעים: הקורא עדיין יודע שהבקשה נכשלה
      return throwError(() => err);
    }),
  );
};

// #region step-23.9b
// Retry-After מגיע כשניות (כך שלח אותו ה-OnRejected של ה-limiter). אם הוא
// חסר או לא-מספרי — נופלים להודעה גנרית, בלי לשבור את החוויה.
function retryText(err: HttpErrorResponse): string {
  const retryAfter = err.headers.get('Retry-After');
  const seconds = retryAfter ? Number(retryAfter) : Number.NaN;

  return Number.isFinite(seconds) && seconds > 0
    ? `Too many attempts — try again in ${seconds}s`
    : 'Too many attempts — slow down and try again';
}
// #endregion

function problemText(err: HttpErrorResponse): string {
  // #region step-12.14
  // הסים משלם שוב: השרת למד ניב חדש (409 עם גוף string מ-TypedResults.Conflict),
  // ורק המתרגם האחד הזה צריך לדעת על זה — אף רכיב לא נגע.
  if (typeof err.error === 'string' && err.error) return err.error;
  // #endregion

  const problem = err.error as ProblemDetails | null;

  // 400 של AddValidation: מילון שגיאות לפי שדה — מציגים את הראשונה
  const firstFieldError = problem?.errors && Object.values(problem.errors)[0]?.[0];
  if (firstFieldError) return firstFieldError;

  if (problem?.detail) return problem.detail;

  if (err.status === 0) return 'Cannot reach the server — is the API running?';
  if (err.status === 401) return 'You need to sign in for that';
  if (err.status === 403) return 'You are not a member of this project';

  if (problem?.title) return problem.title;

  return `Request failed (${err.status})`;
}
// #endregion
