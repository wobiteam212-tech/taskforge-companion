import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE } from '../api/api';
import { TokenStore } from '../auth/token.store';
import { Comment, CreateCommentRequest } from '../models/comment.model';
import { Issue, UpdateIssueRequest } from '../models/issue.model';

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
  readonly comments = computed(() =>
    this.commentsResource.hasValue() ? this.commentsResource.value() : [],
  );
  readonly loading = computed(() => this.issueResource.isLoading());
  readonly loadError = computed(() => this.issueResource.error() || this.commentsResource.error());

  reload(): void {
    this.issueResource.reload();
    this.commentsResource.reload();
  }
  // #endregion

  // #region step-14.16
  async saveIssue(issueId: number, request: UpdateIssueRequest): Promise<void> {
    await firstValueFrom(this.http.put(`${API_BASE}/issues/${issueId}`, request));
    this.reload();
  }

  async addComment(issueId: number, request: CreateCommentRequest): Promise<void> {
    await firstValueFrom(this.http.post(`${API_BASE}/issues/${issueId}/comments`, request));
    this.commentsResource.reload();
  }
  // #endregion
}
