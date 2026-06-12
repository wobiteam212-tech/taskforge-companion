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
      toastSvc.show(problemText(err), 'danger');
      // מתרגמים, לא בולעים: הקורא עדיין יודע שהבקשה נכשלה
      return throwError(() => err);
    }),
  );
};

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
