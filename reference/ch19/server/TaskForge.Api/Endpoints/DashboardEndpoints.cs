using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using TaskForge.Api.Auth;
using TaskForge.Api.Contracts;
using TaskForge.Api.Filters;
using TaskForge.Core.Abstractions;
using TaskForge.Core.Common;

namespace TaskForge.Api.Endpoints;

public static class DashboardEndpoints
{
    // #region step-18.8
    // endpoints קריאה לדשבורד: סיכום (אגרגציה), פיד פעילות של הפרויקט,
    // ופרק 19 מוסיף פיד פעילות מסונן ל-issue אחד. אותו דפוס קבוצה כמו השאר.
    public static IEndpointRouteBuilder MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var project = app.MapGroup("/api/projects/{projectId:int}")
            .WithTags("Dashboard")
            .AddEndpointFilter<HandlerTimingFilter>()
            .RequireAuthorization();

        project.MapGet("/stats", GetStats);
        project.MapGet("/activity", GetActivity);

        // #region step-19.9
        var issue = app.MapGroup("/api/issues/{issueId:int}")
            .WithTags("Dashboard")
            .AddEndpointFilter<HandlerTimingFilter>()
            .RequireAuthorization();

        issue.MapGet("/activity", GetIssueActivity);
        // #endregion

        return app;
    }

    // ‏stats: 404 אם הפרויקט לא קיים, 403 אם המשתמש אינו חבר — אותה הרשאה
    // מבוססת-משאב כמו בלוח. ה-DB עושה את האגרגציה; כאן רק מחזירים אותה.
    private static async Task<Results<Ok<ProjectStats>, NotFound, ForbidHttpResult>> GetStats(
        int projectId,
        ClaimsPrincipal user,
        IStatsRepository stats,
        IProjectRepository projects,
        CancellationToken cancellationToken)
    {
        if (!await projects.ExistsAsync(projectId, cancellationToken))
        {
            return TypedResults.NotFound();
        }

        if (!await projects.IsMemberAsync(projectId, user.GetUserId(), cancellationToken))
        {
            return TypedResults.Forbid();
        }

        return TypedResults.Ok(await stats.GetForProjectAsync(projectId, cancellationToken));
    }
    // #endregion

    // #region step-18.8b
    // ‏activity: ה-feed האחרון. take מוגבל ל-1..50 כדי לא לשאוב יומן שלם.
    private static async Task<Results<Ok<IReadOnlyList<ActivityResponse>>, NotFound, ForbidHttpResult>> GetActivity(
        int projectId,
        int? take,
        ClaimsPrincipal user,
        IActivityRepository activity,
        IProjectRepository projects,
        CancellationToken cancellationToken)
    {
        if (!await projects.ExistsAsync(projectId, cancellationToken))
        {
            return TypedResults.NotFound();
        }

        if (!await projects.IsMemberAsync(projectId, user.GetUserId(), cancellationToken))
        {
            return TypedResults.Forbid();
        }

        var limit = Math.Clamp(take ?? 10, 1, 50);
        var events = await activity.GetRecentForProjectAsync(projectId, limit, cancellationToken);
        var mapped = events.Select(ActivityResponse.FromEntity).ToList();

        return TypedResults.Ok<IReadOnlyList<ActivityResponse>>(mapped);
    }
    // #endregion

    // #region step-19.9b
    // פיד הפעילות של issue יחיד — ה-timeline במסך הפרטים. ההרשאה עוברת דרך
    // ה-issue: 404 אם אינו קיים, 403 אם המשתמש אינו חבר בפרויקט שלו.
    private static async Task<Results<Ok<IReadOnlyList<ActivityResponse>>, NotFound, ForbidHttpResult>> GetIssueActivity(
        int issueId,
        int? take,
        ClaimsPrincipal user,
        IActivityRepository activity,
        IIssueRepository issues,
        IProjectRepository projects,
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

        var limit = Math.Clamp(take ?? 20, 1, 50);
        var events = await activity.GetRecentForIssueAsync(issueId, limit, cancellationToken);
        var mapped = events.Select(ActivityResponse.FromEntity).ToList();

        return TypedResults.Ok<IReadOnlyList<ActivityResponse>>(mapped);
    }
    // #endregion
}
