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
    // שני endpoints קריאה לדשבורד: סיכום (אגרגציה) ופיד פעילות. אותו דפוס
    // קבוצה כמו כל השאר — prefix /api, תג, פילטר תזמון, אימות חובה.
    public static IEndpointRouteBuilder MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/projects/{projectId:int}")
            .WithTags("Dashboard")
            .AddEndpointFilter<HandlerTimingFilter>()
            .RequireAuthorization();

        group.MapGet("/stats", GetStats);
        group.MapGet("/activity", GetActivity);

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
}
