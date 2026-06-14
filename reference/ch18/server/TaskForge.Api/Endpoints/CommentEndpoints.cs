using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using TaskForge.Api.Auth;
using TaskForge.Api.Contracts;
using TaskForge.Core.Abstractions;
using TaskForge.Core.Entities;

namespace TaskForge.Api.Endpoints;

public static class CommentEndpoints
{
    // #region step-14.5
    public static IEndpointRouteBuilder MapCommentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app
            .MapGroup("/api/issues/{issueId:int}/comments")
            .WithTags("Comments")
            .RequireAuthorization();

        group.MapGet("/", GetComments);
        group.MapPost("/", AddComment);

        return app;
    }

    private static async Task<Results<Ok<IReadOnlyList<CommentResponse>>, NotFound, ForbidHttpResult>> GetComments(
        int issueId,
        ClaimsPrincipal user,
        IIssueRepository issues,
        IProjectRepository projects,
        ICommentRepository comments,
        CancellationToken cancellationToken)
    {
        var issue = await issues.GetByIdAsync(issueId, cancellationToken);
        if (issue is null)
        {
            return TypedResults.NotFound();
        }

        if (!await projects.IsMemberAsync(issue.ProjectId, user.GetUserId(), cancellationToken))
        {
            return TypedResults.Forbid();
        }

        var mapped = (await comments.GetByIssueAsync(issueId, cancellationToken))
            .Select(CommentResponse.FromEntity)
            .ToList();

        return TypedResults.Ok<IReadOnlyList<CommentResponse>>(mapped);
    }

    private static async Task<Results<Created<CommentResponse>, NotFound, ForbidHttpResult>> AddComment(
        int issueId,
        CreateCommentRequest request,
        ClaimsPrincipal user,
        IIssueRepository issues,
        IProjectRepository projects,
        ICommentRepository comments,
        // #region step-18.12e
        // פרק 18: תגובה היא פעילות — היומן מוזרק כדי לרשום אותה לפיד
        IActivityRepository activity,
        // #endregion
        CancellationToken cancellationToken)
    {
        var issue = await issues.GetByIdAsync(issueId, cancellationToken);
        if (issue is null)
        {
            return TypedResults.NotFound();
        }

        if (!await projects.IsMemberAsync(issue.ProjectId, user.GetUserId(), cancellationToken))
        {
            return TypedResults.Forbid();
        }

        var comment = await comments.AddAsync(new Comment
        {
            IssueId = issueId,
            AuthorUserId = user.GetUserId(),
            Body = request.Body.Trim(),
            CreatedAtUtc = DateTime.UtcNow,
        }, cancellationToken);

        // #region step-18.12f
        await activity.LogAsync(new ActivityEvent
        {
            ProjectId = issue.ProjectId,
            IssueId = issueId,
            ActorUserId = user.GetUserId(),
            Type = ActivityType.CommentAdded,
            Summary = $"הגיב/ה על \"{issue.Title}\"",
            CreatedAtUtc = DateTime.UtcNow,
        }, cancellationToken);
        // #endregion

        return TypedResults.Created(
            $"/api/issues/{issueId}/comments/{comment.Id}",
            CommentResponse.FromEntity(comment));
    }
    // #endregion
}
