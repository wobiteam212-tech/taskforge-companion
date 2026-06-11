import { Component, inject, model, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { TfButton } from '../../shared/ui/button/button';
import { TfDialog } from '../../shared/ui/dialog/dialog';
import { TfField } from '../../shared/ui/field/field';
import { ToastService } from '../../shared/ui/toast/toast.service';

// #region step-11.13
// הערכה מפרק 09 משלמת: דיאלוג, שני שדות וכפתור — אפס CSS חדש כמעט.
// שגיאות (401, ולידציה, שרת כבוי) מטופלות ב-error interceptor; הרכיב
// רק מחזיק את ה-pending ומגיב להצלחה.
@Component({
  selector: 'tf-login-dialog',
  imports: [TfButton, TfDialog, TfField],
  templateUrl: './login-dialog.html',
  styleUrl: './login-dialog.scss',
})
export class LoginDialog {
  private readonly auth = inject(AuthService);
  private readonly toastSvc = inject(ToastService);

  readonly open = model(false);

  protected readonly pending = signal(false);

  protected async submit(email: string, password: string): Promise<void> {
    this.pending.set(true);
    try {
      await this.auth.login(email, password);
      this.toastSvc.show('Welcome back!', 'success');
      this.open.set(false);
    } catch {
      // ההודעה כבר הוצגה על ידי ה-interceptor — הדיאלוג פשוט נשאר פתוח
    } finally {
      this.pending.set(false);
    }
  }
}
// #endregion
