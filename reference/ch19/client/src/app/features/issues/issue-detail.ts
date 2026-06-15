import { Component, DestroyRef, computed, effect, inject, input, numberAttribute, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FormField,
  debounce,
  form,
  maxLength,
  minLength,
  required,
  submit,
  validateHttp,
} from '@angular/forms/signals';
import { API_BASE } from '../../core/api/api';
import { Comment } from '../../core/models/comment.model';
import { ActivityEvent, ActivityType } from '../../core/models/dashboard.model';
import { Attachment } from '../../core/models/attachment.model';
import {
  Issue,
  IssuePriority,
  IssueStatus,
  TitleAvailabilityResponse,
} from '../../core/models/issue.model';
import { ProjectSummary } from '../../core/models/project.model';
import { IssueDetailStore } from '../../core/state/issue-detail.store';
import { renderMarkdown } from '../../core/markdown/markdown';
import { TfBadge } from '../../shared/ui/badge/badge';
import { TfButton } from '../../shared/ui/button/button';
import { PriorityPicker } from './priority-picker';
import { MarkdownEditor } from '../../shared/ui/markdown-editor/markdown-editor';

type IssueFormModel = {
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
};

const ACTIVITY_ICON: Record<ActivityType, string> = {
  IssueCreated: '✚',
  IssueMoved: '↻',
  CommentAdded: '💬',
  AttachmentAdded: '📎',
};

// #region step-19.19
@Component({
  selector: 'tf-issue-detail',
  imports: [RouterLink, FormField, TfBadge, TfButton, PriorityPicker, MarkdownEditor],
  templateUrl: './issue-detail.html',
  styleUrl: './issue-detail.scss',
})
export class IssueDetail {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly store = inject(IssueDetailStore);

  readonly projectId = input.required({ transform: numberAttribute });
  readonly issueId = input.required({ transform: numberAttribute });
  readonly project = input.required<ProjectSummary>();

  protected readonly savingIssue = signal(false);
  protected readonly uploading = signal(false);
  private readonly loadedIssueId = signal<number | null>(null);
  private readonly originalTitle = signal('');

  protected readonly issueModel = signal<IssueFormModel>({
    title: '',
    description: '',
    status: 'Open',
    priority: 'Medium',
  });

  protected readonly commentModel = signal({ body: '' });

  protected readonly issueForm = form(this.issueModel, (s) => {
    required(s.title, { message: 'Title is required' });
    minLength(s.title, 3, { message: 'Use at least 3 characters' });
    maxLength(s.title, 200, { message: 'Keep the title under 200 characters' });
    maxLength(s.description, 4000, { message: 'Keep the description under 4000 characters' });
    debounce(s.title, 300);

    // #region step-14.14
    validateHttp<string, TitleAvailabilityResponse>(s.title, {
      debounce: 300,
      request: ({ value }) => {
        const title = value().trim();
        if (title.length < 3 || title === this.originalTitle()) return undefined;

        const params = new URLSearchParams({
          title,
          excludeIssueId: String(this.issueId()),
        });
        return `${API_BASE}/projects/${this.projectId()}/issues/title-available?${params}`;
      },
      onSuccess: (result) =>
        result.available
          ? undefined
          : { kind: 'titleTaken', message: 'An issue with this title already exists' },
      onError: () => ({ kind: 'titleCheckFailed', message: 'Could not verify this title' }),
    });
    // #endregion
  });

  protected readonly commentForm = form(this.commentModel, (s) => {
    required(s.body, { message: 'Comment is required' });
    minLength(s.body, 2, { message: 'Use at least 2 characters' });
    maxLength(s.body, 1200, { message: 'Keep comments under 1200 characters' });
  });

  protected readonly issue = computed(() => this.store.issue());
  protected readonly comments = computed(() => this.store.comments());

  constructor() {
    effect(() => this.store.setIssueId(this.issueId()));

    effect(() => {
      const issue = this.store.issue();
      if (!issue || this.loadedIssueId() === issue.id) return;
      this.loadedIssueId.set(issue.id);
      this.originalTitle.set(issue.title);
      this.issueModel.set({
        title: issue.title,
        description: issue.description ?? '',
        status: issue.status,
        priority: issue.priority,
      });
    });

    this.destroyRef.onDestroy(() => this.store.clear());
  }
  // #endregion

  // #region step-14.16
  protected async saveIssue(): Promise<void> {
    const ok = await submit(this.issueForm, async () => {
      const model = this.issueModel();
      this.savingIssue.set(true);
      try {
        await this.store.saveIssue(this.issueId(), {
          title: model.title.trim(),
          description: model.description.trim() || null,
          status: model.status,
          priority: model.priority,
        });
        this.originalTitle.set(model.title.trim());
      } finally {
        this.savingIssue.set(false);
      }
    });

    if (ok) {
      this.loadedIssueId.set(null);
    }
  }
  // #endregion

  // #region step-19.20
  // התגובה נשלחת אופטימית עם חלון Undo — אין await ואין ספינר; היא מופיעה מיד
  // והשרת מתעדכן ברקע אחרי החלון. ה-form מתאפס מיד כדי שאפשר להמשיך לכתוב.
  protected async addComment(): Promise<void> {
    const ok = await submit(this.commentForm, async () => {
      this.store.postCommentWithUndo(this.issueId(), this.commentModel().body.trim());
    });
    if (ok) {
      this.commentModel.set({ body: '' });
    }
  }

  protected undoComment(): void {
    this.store.undoPendingComment();
  }

  protected isPending(comment: Comment): boolean {
    return comment.id < 0;
  }
  // #endregion

  // #region step-19.21
  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    try {
      await this.store.addAttachment(this.issueId(), file);
    } finally {
      this.uploading.set(false);
      input.value = ''; // מאפשר לבחור שוב את אותו קובץ
    }
  }

  protected download(attachment: Attachment): void {
    void this.store.download(attachment);
  }

  protected prettySize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected activityIcon(type: ActivityType): string {
    return ACTIVITY_ICON[type];
  }
  // #endregion

  protected commentHtml(comment: Comment): string {
    return renderMarkdown(comment.body);
  }

  protected firstError(errors: readonly { message?: string; kind: string }[]): string | null {
    return errors[0]?.message ?? errors[0]?.kind ?? null;
  }

  protected toneOf(status: IssueStatus): 'open' | 'progress' | 'done' {
    return status === 'Open' ? 'open' : status === 'InProgress' ? 'progress' : 'done';
  }

  protected formattedDate(value: string): string {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  }

  protected trackActivity(_: number, event: ActivityEvent): number {
    return event.id;
  }
}
