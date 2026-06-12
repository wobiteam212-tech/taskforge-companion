import { Component, computed, inject, input, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../../core/api/api';
import { TokenStore } from '../../core/auth/token.store';
import { ProjectMember, ProjectRole } from '../../core/models/member.model';
import { TfBadge } from '../../shared/ui/badge/badge';
import { TfButton } from '../../shared/ui/button/button';
import { TfDialog } from '../../shared/ui/dialog/dialog';
import { TfField } from '../../shared/ui/field/field';
import { ToastService } from '../../shared/ui/toast/toast.service';

// #region step-12.12b
// httpResource עם URL ריאקטיבי: הפונקציה תלויה גם ב-projectId וגם
// במצב ההתחברות. החזרת undefined = "אל תשלח בקשה" — אורח לא מפעיל
// 401 מיותר, ומעבר בין פרויקטים מרענן את הרשימה מעצמו.
@Component({
  selector: 'tf-project-members',
  imports: [TfBadge, TfButton, TfDialog, TfField],
  templateUrl: './project-members.html',
  styleUrl: './project-members.scss',
})
export class ProjectMembers {
  private readonly http = inject(HttpClient);
  private readonly toastSvc = inject(ToastService);
  protected readonly tokenStore = inject(TokenStore);

  readonly projectId = input.required<number>();

  protected readonly members = httpResource<ProjectMember[]>(() =>
    this.tokenStore.isLoggedIn()
      ? `${API_BASE}/projects/${this.projectId()}/members`
      : undefined,
  );

  protected readonly list = computed<ProjectMember[]>(() =>
    this.members.hasValue() ? this.members.value() : [],
  );

  // ההרשאה נגזרת מהנתונים, לא מנוחשת: אני Owner אם השרת אומר שאני Owner.
  protected readonly myRole = computed<ProjectRole | null>(() => {
    const me = this.tokenStore.user();
    if (!me) return null;
    return this.list().find((m) => m.userId === me.id)?.role ?? null;
  });

  protected readonly isOwner = computed(() => this.myRole() === 'Owner');

  // 403 הוא state לגיטימי של המסך — לא רק toast חולף:
  // המשתמש מחובר אבל אינו חבר בפרויקט הזה.
  protected readonly forbidden = computed(() => {
    const err = this.members.error();
    return err instanceof HttpErrorResponse && err.status === 403;
  });
  // #endregion

  // #region step-12.13
  // הפקודה: POST של אימייל + תפקיד, ואז reload — הרשימה תמיד משקפת
  // את השרת. שגיאות (404 משתמש, 403 לא-Owner, 409 כבר חבר) כבר
  // מתורגמות ל-toast ב-interceptor; כאן רק מנהלים את הדיאלוג.
  protected readonly addOpen = signal(false);
  protected readonly pending = signal(false);

  protected async add(email: string, role: string): Promise<void> {
    const trimmed = email.trim();
    if (!trimmed) {
      this.toastSvc.show('Email is required', 'danger');
      return;
    }

    this.pending.set(true);
    try {
      await firstValueFrom(
        this.http.post(`${API_BASE}/projects/${this.projectId()}/members`, {
          email: trimmed,
          role,
        }),
      );
      this.toastSvc.show(`${trimmed} added to the project`, 'success');
      this.addOpen.set(false);
      this.members.reload();
    } catch {
      // הדיאלוג נשאר פתוח — אפשר לתקן את האימייל ולנסות שוב
    } finally {
      this.pending.set(false);
    }
  }
  // #endregion
}
