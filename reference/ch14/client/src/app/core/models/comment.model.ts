/** Mirrors server/TaskForge.Api/Contracts/CommentContracts.cs */
export interface Comment {
  id: number;
  issueId: number;
  body: string;
  authorUserId: number;
  authorName: string;
  createdAtUtc: string;
}

export interface CreateCommentRequest {
  body: string;
}
