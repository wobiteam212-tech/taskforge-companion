import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { HUB_BASE } from '../api/api';
import { TokenStore } from '../auth/token.store';
import { IssuesStore } from '../state/issues.store';
import { IssueDetailStore } from '../state/issue-detail.store';
import { Issue } from '../models/issue.model';
import { Comment } from '../models/comment.model';

// #region step-24.11
// צד הלקוח של ה-realtime. transport שני לצד HTTP: חיבור מתמשך שהשרת דוחף דרכו.
// השירות מחזיק connection אחד, מצטרף ל-group של הפרויקט הפעיל, ומפנה כל אירוע
// ל-store המתאים. הכול חי כל עוד מחוברים, ומנוקה ב-DestroyRef.
//
// המפתח להבנה: זה לא "מאזין" פסיבי — הוא משלים את ה-optimistic. הלקוח שיזם
// כתיבה כבר עדכן אופטימית (פרק 17/20); הוא מזהה את ההד של עצמו לפי origin
// (ה-connectionId שלו, שנשלח בכותרת X-Connection-Id) ומדלג. רק שינויים של
// *אחרים* מוחלים מכאן.
interface IssueChangedEvent {
  origin: string | null;
  issue: Issue;
}
interface IssueDeletedEvent {
  origin: string | null;
  issueId: number;
}
interface CommentAddedEvent {
  origin: string | null;
  issueId: number;
  // ה-comment נושא במטען (מסומך לעתיד), אבל הלקוח פשוט מרענן את ה-thread של
  // ה-issue הפתוח — refetch זול ותמיד עקבי עבור משאב קטן ולא-תכוף כמו תגובות.
  comment: Comment;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

@Injectable({ providedIn: 'root' })
export class BoardConnection {
  private readonly tokenStore = inject(TokenStore);
  private readonly issues = inject(IssuesStore);
  private readonly detail = inject(IssueDetailStore);

  private connection: HubConnection | null = null;
  private activeProjectId: number | null = null;

  private readonly _state = signal<ConnectionState>('disconnected');
  readonly state = this._state.asReadonly();
  readonly connected = computed(() => this._state() === 'connected');

  // ה-connectionId חי כ-signal: ה-interceptor (פרק 24.12) קורא אותו ומצרף
  // אותו ל-X-Connection-Id בכל בקשת כתיבה.
  private readonly _connectionId = signal<string | null>(null);
  readonly connectionId = this._connectionId.asReadonly();

  constructor() {
    // החיבור חי כל עוד מחוברים: מתחבר כשמתחברים, מנתק כשיוצאים. אין login,
    // אין WebSocket; יש login, יש דחיפות חיות.
    effect(() => {
      if (this.tokenStore.isLoggedIn()) {
        void this.start();
      } else {
        void this.stop();
      }
    });

    inject(DestroyRef).onDestroy(() => void this.stop());
  }

  // ה-board קורא לזה כשנכנסים לפרויקט; השירות זוכר את הפרויקט הפעיל גם בשביל
  // re-join אחרי reconnect.
  setActiveProject(projectId: number): void {
    this.activeProjectId = projectId;
    void this.joinActive();
  }

  clearActiveProject(): void {
    const id = this.activeProjectId;
    this.activeProjectId = null;
    if (id !== null && this.connection?.state === HubConnectionState.Connected) {
      void this.connection.invoke('LeaveProject', id).catch(() => undefined);
    }
  }

  private async start(): Promise<void> {
    if (this.connection) return;
    this._state.set('connecting');

    const connection = new HubConnectionBuilder()
      .withUrl(`${HUB_BASE}/board`, {
        // הטוקן עובר ב-query string (WebSocket לא שולח Authorization). הפונקציה
        // נקראת שוב בכל reconnect — תמיד הטוקן הטרי.
        accessTokenFactory: () => this.tokenStore.accessToken() ?? '',
      })
      .withAutomaticReconnect()
      .build();

    connection.on('IssueChanged', (e: IssueChangedEvent) => {
      if (this.isSelf(e.origin)) return;
      this.issues.applyRemoteUpsert(e.issue);
    });
    connection.on('IssueDeleted', (e: IssueDeletedEvent) => {
      if (this.isSelf(e.origin)) return;
      this.issues.applyRemoteRemove(e.issueId);
    });
    connection.on('CommentAdded', (e: CommentAddedEvent) => {
      if (this.isSelf(e.origin)) return;
      this.detail.applyRemoteComment(e.issueId);
    });

    connection.onreconnecting(() => this._state.set('reconnecting'));
    connection.onreconnected((id) => {
      this._connectionId.set(id ?? null);
      this._state.set('connected');
      // אירועים שנשלחו בזמן הניתוק אבדו — realtime הוא best-effort. מצטרפים
      // מחדש ל-group *וגם* טוענים מחדש מהשרת כדי לסנכרן את מה שהוחמץ.
      void this.joinActive();
      this.issues.reload();
    });
    connection.onclose(() => {
      this._state.set('disconnected');
      this._connectionId.set(null);
    });

    this.connection = connection;
    try {
      await connection.start();
      this._connectionId.set(connection.connectionId);
      this._state.set('connected');
      await this.joinActive();
    } catch {
      this._state.set('disconnected');
      this.connection = null;
    }
  }

  private async stop(): Promise<void> {
    const c = this.connection;
    this.connection = null;
    this._connectionId.set(null);
    this._state.set('disconnected');
    if (c) await c.stop().catch(() => undefined);
  }

  private async joinActive(): Promise<void> {
    const id = this.activeProjectId;
    if (id !== null && this.connection?.state === HubConnectionState.Connected) {
      // לא-חבר נדחה ב-HubException; נבלע בשקט (ה-REST כבר מחזיר 403 ממילא).
      await this.connection.invoke('JoinProject', id).catch(() => undefined);
    }
  }

  private isSelf(origin: string | null): boolean {
    return origin !== null && origin === this._connectionId();
  }
}
// #endregion
