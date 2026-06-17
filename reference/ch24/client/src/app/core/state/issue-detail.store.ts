import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../api/api';
import { TokenStore } from '../auth/token.store';
import { Comment } from '../models/comment.model';
import { Issue, UpdateIssueRequest } from '../models/issue.model';
import { Attachment } from '../models/attachment.model';
import { ActivityEvent } from '../models/dashboard.model';
import { ProjectMember } from '../models/member.model';

// חלון ה-Undo: התגובה נשלחת רק אחרי השהייה זו, כדי שאפשר לבטל לפני שהשרת ראה אותה
const COMMENT_UNDO_MS = 4000;

@Injectable({ providedIn: 'root' })
export class IssueDetailStore {
  private readonly http = inject(HttpClient);
  private readonly tokenStore = inject(TokenStore);
  private readonly issueId = signal<number | null>(null);

  // #region step-14.9
  setIssueId(issueId: number): void {
    this.issueId.set(issueId);
  }

  clear(): void {
    this.cancelPending();
    this.issueId.set(null);
  }

  private readonly issueResource = httpResource<Issue>(() => {
    const id = this.issueId();
    return id && this.tokenStore.isLoggedIn() ? `${API_BASE}/issues/${id}` : undefined;
  });

  private readonly commentsResource = httpResource<Comment[]>(() => {
    const id = this.issueId();
    return id && this.tokenStore.isLoggedIn() ? `${API_BASE}/issues/${id}/comments` : undefined;
  });

  readonly issue = computed(() => (this.issueResource.hasValue() ? this.issueResource.value() : null));
  readonly loading = computed(() => this.issueResource.isLoading());
  readonly loadError = computed(() => this.issueResource.error() || this.commentsResource.error());

  reload(): void {
    this.issueResource.reload();
    this.commentsResource.reload();
  }
  // #endregion

  // #region step-19.16
  // פרק 19: שלושה resources נוספים מפתח לפי אותו issueId — קבצים, פיד פעילות,
  // וחברי הפרויקט (לרשימת ה-@mention, מפתח לפי projectId של ה-issue שנטען).
  private readonly attachmentsResource = httpResource<Attachment[]>(() => {
    const id = this.issueId();
    return id && this.tokenStore.isLoggedIn() ? `${API_BASE}/issues/${id}/attachments` : undefined;
  });

  private readonly activityResource = httpResource<ActivityEvent[]>(() => {
    const id = this.issueId();
    return id && this.tokenStore.isLoggedIn() ? `${API_BASE}/issues/${id}/activity` : undefined;
  });

  private readonly membersResource = httpResource<ProjectMember[]>(() => {
    const issue = this.issueResource.hasValue() ? this.issueResource.value() : null;
    return issue && this.tokenStore.isLoggedIn()
      ? `${API_BASE}/projects/${issue.projectId}/members`
      : undefined;
  });

  readonly attachments = computed(() =>
    this.attachmentsResource.hasValue() ? this.attachmentsResource.value() : [],
  );
  readonly activity = computed(() =>
    this.activityResource.hasValue() ? this.activityResource.value() : [],
  );
  readonly memberNames = computed(() =>
    (this.membersResource.hasValue() ? this.membersResource.value() : []).map((m) => m.displayName),
  );
  // #endregion

  // #region step-24.14
  // פרק 24: תגובה שנוספה על ידי משתמש אחר הגיעה דרך SignalR. אם אנחנו פתוחים
  // *על אותו issue* — מרעננים את ה-thread ואת הפיד. refetch (ולא הוספה במקום)
  // הוא הבחירה הנכונה כאן: תגובות הן משאב קטן, לא-תכוף, וה-resource כבר ממוזג
  // עם ה-pending האופטימי — שמירה על מקור-אמת אחד פשוטה יותר מלתחזק overlay שלישי.
  applyRemoteComment(issueId: number): void {
    if (issueId === this.issueId()) {
      this.commentsResource.reload();
      this.activityResource.reload();
    }
  }
  // #endregion

  // #region step-19.17
  // תגובות אופטימיות עם Undo: מציירים תגובה זמנית מיד, פותחים חלון Undo, ורק
  // כשהחלון נסגר באמת שולחים POST. ביטול בתוך החלון מסיר את התגובה — בלי בקשה.
  // כישלון בשליחה מסיר את הזמנית (ה-toast כבר הוצג ע"י ה-interceptor מפרק 11).
  private readonly pending = signal<Comment | null>(null);
  private undoTimer: ReturnType<typeof setTimeout> | undefined;

  readonly pendingComment = computed(() => this.pending());

  // ה-comments הציבורי כולל את הזמנית, כך שהיא מופיעה בתהליך בלי קוד מיוחד בתבנית
  readonly comments = computed<Comment[]>(() => {
    const base = this.commentsResource.hasValue() ? this.commentsResource.value() : [];
    const optimistic = this.pending();
    return optimistic ? [...base, optimistic] : base;
  });

  postCommentWithUndo(issueId: number, body: string): void {
    this.cancelPending();
    const user = this.tokenStore.user();
    const temp: Comment = {
      id: -Date.now(), // מזהה זמני שלילי — לא יתנגש ב-ids אמיתיים
      issueId,
      body,
      authorUserId: user?.id ?? 0,
      authorName: user?.displayName ?? 'אני',
      createdAtUtc: new Date().toISOString(),
    };
    this.pending.set(temp);
    this.undoTimer = setTimeout(() => void this.commitPending(issueId, body), COMMENT_UNDO_MS);
  }

  undoPendingComment(): void {
    this.cancelPending();
  }

  private cancelPending(): void {
    clearTimeout(this.undoTimer);
    this.undoTimer = undefined;
    this.pending.set(null);
  }

  private async commitPending(issueId: number, body: string): Promise<void> {
    this.undoTimer = undefined;
    try {
      await firstValueFrom(this.http.post(`${API_BASE}/issues/${issueId}/comments`, { body }));
      this.pending.set(null);
      this.commentsResource.reload();
      this.activityResource.reload();
    } catch {
      this.pending.set(null); // מסירים את הזמנית; ה-interceptor כבר הציג שגיאה
    }
  }
  // #endregion

  // #region step-14.16
  async saveIssue(issueId: number, request: UpdateIssueRequest): Promise<void> {
    await firstValueFrom(this.http.put(`${API_BASE}/issues/${issueId}`, request));
    this.reload();
  }
  // #endregion

  // #region step-19.18
  // העלאת קובץ: multipart דרך FormData. הצלחה → רענון רשימת הקבצים והפעילות.
  async addAttachment(issueId: number, file: File): Promise<boolean> {
    const data = new FormData();
    data.append('file', file);
    try {
      await firstValueFrom(this.http.post(`${API_BASE}/issues/${issueId}/attachments`, data));
      this.attachmentsResource.reload();
      this.activityResource.reload();
      return true;
    } catch {
      return false;
    }
  }

  // הורדה: שולפים blob עם ה-Bearer (ה-interceptor מצרף אותו), ומפעילים הורדת דפדפן.
  async download(attachment: Attachment): Promise<void> {
    const blob = await firstValueFrom(
      this.http.get(`${API_BASE}/attachments/${attachment.id}`, { responseType: 'blob' }),
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
  // #endregion
}
