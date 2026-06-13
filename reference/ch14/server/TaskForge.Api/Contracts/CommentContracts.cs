using System.ComponentModel.DataAnnotations;
using TaskForge.Core.Entities;

namespace TaskForge.Api.Contracts;

public sealed record CreateCommentRequest(
    [property: Required, StringLength(1200, MinimumLength = 2)] string Body);

public sealed record CommentResponse(
    int Id,
    int IssueId,
    string Body,
    int AuthorUserId,
    string AuthorName,
    DateTime CreatedAtUtc)
{
    public static CommentResponse FromEntity(Comment comment) => new(
        comment.Id,
        comment.IssueId,
        comment.Body,
        comment.AuthorUserId,
        comment.Author?.DisplayName ?? "Unknown user",
        comment.CreatedAtUtc);
}
