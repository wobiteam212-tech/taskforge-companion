using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.OutputCaching;
using TaskForge.Api.Auth;
using TaskForge.Api.Contracts;
using TaskForge.Api.Filters;
using TaskForge.Core.Abstractions;
using TaskForge.Core.Common;
using TaskForge.Core.Entities;

namespace TaskForge.Api.Endpoints;

public static class IssueEndpoints
{
    private const double MaxRank = 9_000_000_000_000_000_000d;

    // #region step-4.11
    // קבוצה אחת לכל ה-Issues: prefix משותף, תג OpenAPI משותף, ופילטר משותף.
    // מפרק 05: כל הקבוצה דורשת משתמש מאומת — שורה אחת מגינה על הכול.
    public static IEndpointRouteBuilder MapIssueEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api")
            .WithTags("Issues")
            .AddEndpointFilter<HandlerTimingFilter>()
            .RequireAuthorization();

        group.MapGet("/projects/{projectId:int}/issues", GetIssues);
        group.MapPost("/projects/{projectId:int}/issues", CreateIssue);
        group.MapGet("/projects/{projectId:int}/issues/title-available", TitleAvailable);

        group.MapGet("/issues/{id:int}", GetIssueById).WithName("GetIssueById");
        group.MapPut("/issues/{id:int}", UpdateIssue);
        // #region step-17.4
        // סידור-מחדש בלוח: פעולה ממוקדת (PATCH) לשינוי סטטוס + Rank בלבד
        group.MapPatch("/issues/{id:int}/rank", ReorderIssue);
        // #endregion
        group.MapDelete("/issues/{id:int}", DeleteIssue);

        return app;
    }
    // #endregion

    // #region step-23.4b
    // נקודת ה-eviction: כל כתיבה ל-issue בפרויקט P מפנה את ה-tag "stats-P",
    // כך שה-/stats הבא של אותו פרויקט יחושב מחדש מה-DB. caching זה הקל;
    // *זה* החלק הקשה — לזכור לפנות בכל מסלול כתיבה.
    private static ValueTask EvictStatsAsync(IOutputCacheStore cache, int projectId, CancellationToken ct) =>
        cache.EvictByTagAsync($"stats-{projectId}", ct);
    // #endregion

    // #region step-4.12
    // handlers עם שמות + Results<...>: החתימה עצמה היא תיעוד —
    // המהדר אוכף שכל מסלול יציאה מוצהר, ו-OpenAPI קורא הכול לבד.
    private static async Task<Results<Ok<PagedResult<IssueResponse>>, NotFound, ForbidHttpResult>> GetIssues(
        int projectId,
        [AsParameters] IssueListParams query,
        ClaimsPrincipal user,
        IIssueRepository issues,
        IProjectRepository projects,
        CancellationToken cancellationToken)
    {
        if (!await projects.ExistsAsync(projectId, cancellationToken))
        {
            return TypedResults.NotFound();
        }

        // #region step-13.security
        // פרק 13 מציג לוח חי, ולכן גם קריאה לרשימה חייבת להיות הרשאה מבוססת-משאב:
        // 404 אם הפרויקט לא קיים, 403 אם הוא קיים אבל המשתמש אינו חבר בו.
        if (!await projects.IsMemberAsync(projectId, user.GetUserId(), cancellationToken))
        {
            return TypedResults.Forbid();
        }
        // #endregion

        var page = await issues.GetPagedAsync(query.ToQuery(projectId), cancellationToken);

        var mapped = new PagedResult<IssueResponse>(
            page.Items.Select(IssueResponse.FromEntity).ToList(),
            page.Total,
            page.Page,
            page.PageSize);

        return TypedResults.Ok(mapped);
    }

    // #region step-14.7
    private static async Task<Results<Ok<TitleAvailabilityResponse>, NotFound, ForbidHttpResult>> TitleAvailable(
        int projectId,
        string title,
        int? excludeIssueId,
        ClaimsPrincipal user,
        IIssueRepository issues,
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

        var exists = await issues.TitleExistsAsync(
            projectId,
            title.Trim(),
            excludeIssueId,
            cancellationToken);

        return TypedResults.Ok(new TitleAvailabilityResponse(!exists));
    }
    // #endregion

    private static async Task<Results<CreatedAtRoute<IssueResponse>, NotFound, ForbidHttpResult>> CreateIssue(
        int projectId,
        CreateIssueRequest request,
        ClaimsPrincipal user,
        IIssueRepository issues,
        IProjectRepository projects,
        // #region step-18.12
        // פרק 18: יומן הפעילות מוזרק לכאן כדי לרשום אירוע ליד יצירת ה-issue
        IActivityRepository activity,
        // #endregion
        // #region step-23.4c
        // פרק 23: ה-cache store מוזרק כדי לפנות את ה-stats אחרי הכתיבה
        IOutputCacheStore cache,
        // #endregion
        CancellationToken cancellationToken)
    {
        if (!await projects.ExistsAsync(projectId, cancellationToken))
        {
            return TypedResults.NotFound();
        }

        // #region step-5.15
        // הרשאה מבוססת-משאב: מאומת זה לא מספיק — צריך להיות חבר בפרויקט.
        // ‏401 = מי אתה בכלל; ‏403 = אני יודע מי אתה, ואסור לך.
        if (!await projects.IsMemberAsync(projectId, user.GetUserId(), cancellationToken))
        {
            return TypedResults.Forbid();
        }
        // #endregion

        var issue = await issues.AddAsync(new Issue
        {
            Title = request.Title,
            Description = request.Description,
            Priority = request.Priority,
            ProjectId = projectId,
            CreatedAtUtc = DateTime.UtcNow,
            // #region step-17.4b
            // issue חדש נכנס לתחתית העמודה: Rank גדול ויחיד. ticks מונוטוני
            // לאורך זמן — שני issues שנוצרים בשניות שונות מקבלים Rank שונה.
            Rank = DateTime.UtcNow.Ticks,
            // #endregion
        }, cancellationToken);

        // #region step-18.12b
        // רושמים אירוע ליד הפעולה: הפיד יראה "X יצר issue" מיד.
        await activity.LogAsync(new ActivityEvent
        {
            ProjectId = projectId,
            IssueId = issue.Id,
            ActorUserId = user.GetUserId(),
            Type = ActivityType.IssueCreated,
            Summary = $"יצר/ה את \"{issue.Title}\"",
            CreatedAtUtc = DateTime.UtcNow,
        }, cancellationToken);
        // #endregion

        // #region step-23.4d
        // issue חדש משנה את הספירות — מפנים את ה-stats של הפרויקט.
        await EvictStatsAsync(cache, projectId, cancellationToken);
        // #endregion

        // 201 + כותרת Location שמצביעה על ה-endpoint בעל השם — בלי לשרשר URL ביד
        return TypedResults.CreatedAtRoute(
            IssueResponse.FromEntity(issue),
            "GetIssueById",
            new { id = issue.Id });
    }

    private static async Task<Results<Ok<IssueResponse>, NotFound, ForbidHttpResult>> GetIssueById(
        int id,
        ClaimsPrincipal user,
        IIssueRepository issues,
        IProjectRepository projects,
        CancellationToken cancellationToken)
    {
        var issue = await issues.GetByIdAsync(id, cancellationToken);
        if (issue is null)
        {
            return TypedResults.NotFound();
        }

        if (!await projects.IsMemberAsync(issue.ProjectId, user.GetUserId(), cancellationToken))
        {
            return TypedResults.Forbid();
        }

        return TypedResults.Ok(IssueResponse.FromEntity(issue));
    }

    private static async Task<Results<Ok<IssueResponse>, NotFound, ForbidHttpResult>> UpdateIssue(
        int id,
        UpdateIssueRequest request,
        ClaimsPrincipal user,
        IIssueRepository issues,
        IProjectRepository projects,
        // #region step-23.4e
        IOutputCacheStore cache,
        // #endregion
        CancellationToken cancellationToken)
    {
        var existing = await issues.GetByIdAsync(id, cancellationToken);
        if (existing is null)
        {
            return TypedResults.NotFound();
        }

        if (!await projects.IsMemberAsync(existing.ProjectId, user.GetUserId(), cancellationToken))
        {
            return TypedResults.Forbid();
        }

        var issue = await issues.UpdateAsync(id, i =>
        {
            i.Title = request.Title;
            i.Description = request.Description;
            i.Status = request.Status;
            i.Priority = request.Priority;
        }, cancellationToken);

        // עדכון יכול לשנות סטטוס — וזה משנה את הספירות. מפנים.
        await EvictStatsAsync(cache, existing.ProjectId, cancellationToken);

        return TypedResults.Ok(IssueResponse.FromEntity(issue!));
    }

    // #region step-17.4c
    // ReorderIssue: משנה רק Status ו-Rank, דרך אותו UpdateAsync(id, apply) מפרק 04.
    // אין repo method חדש — הסידור-מחדש הוא פשוט שינוי שתי עמודות.
    private static async Task<Results<Ok<IssueResponse>, NotFound, ForbidHttpResult, BadRequest<string>>> ReorderIssue(
        int id,
        ReorderIssueRequest request,
        ClaimsPrincipal user,
        IIssueRepository issues,
        IProjectRepository projects,
        // #region step-18.12c
        IActivityRepository activity,
        // #endregion
        // #region step-23.4f
        IOutputCacheStore cache,
        // #endregion
        CancellationToken cancellationToken)
    {
        var existing = await issues.GetByIdAsync(id, cancellationToken);
        if (existing is null)
        {
            return TypedResults.NotFound();
        }

        if (!await projects.IsMemberAsync(existing.ProjectId, user.GetUserId(), cancellationToken))
        {
            return TypedResults.Forbid();
        }

        if (!IsValidRank(request.Rank))
        {
            return TypedResults.BadRequest("Rank must be a finite positive number within the supported board range.");
        }

        // #region step-18.12d
        // אירוע "הזזה" נרשם רק כשהעמודה (הסטטוס) באמת השתנתה — סידור-מחדש
        // בתוך אותה עמודה הוא רעש, לא פעילות שכדאי להציג בפיד.
        var statusChanged = existing.Status != request.Status;
        // #endregion

        var issue = await issues.UpdateAsync(id, i =>
        {
            i.Status = request.Status;
            i.Rank = request.Rank;
        }, cancellationToken);

        if (statusChanged)
        {
            await activity.LogAsync(new ActivityEvent
            {
                ProjectId = issue!.ProjectId,
                IssueId = issue.Id,
                ActorUserId = user.GetUserId(),
                Type = ActivityType.IssueMoved,
                Summary = $"העביר/ה את \"{issue.Title}\" ל-{request.Status}",
                CreatedAtUtc = DateTime.UtcNow,
            }, cancellationToken);
        }

        // #region step-23.4g
        // הזזה בין עמודות משנה את ה-by-status counts — מפנים את ה-stats.
        // (גם סידור-מחדש בתוך עמודה מפנה; זה זול, ועדיף מאשר להחזיר מספר ישן.)
        await EvictStatsAsync(cache, existing.ProjectId, cancellationToken);
        // #endregion

        return TypedResults.Ok(IssueResponse.FromEntity(issue!));
    }
    // #endregion

    private static bool IsValidRank(double rank) =>
        double.IsFinite(rank) && rank > 0 && rank <= MaxRank;

    private static async Task<Results<NoContent, NotFound, ForbidHttpResult>> DeleteIssue(
        int id,
        ClaimsPrincipal user,
        IIssueRepository issues,
        IProjectRepository projects,
        // #region step-23.4h
        IOutputCacheStore cache,
        // #endregion
        CancellationToken cancellationToken)
    {
        var existing = await issues.GetByIdAsync(id, cancellationToken);
        if (existing is null)
        {
            return TypedResults.NotFound();
        }

        if (!await projects.IsMemberAsync(existing.ProjectId, user.GetUserId(), cancellationToken))
        {
            return TypedResults.Forbid();
        }

        await issues.DeleteAsync(id, cancellationToken);

        // מחיקה מורידה ספירה — מפנים את ה-stats של הפרויקט.
        await EvictStatsAsync(cache, existing.ProjectId, cancellationToken);

        return TypedResults.NoContent();
    }
    // #endregion
}
