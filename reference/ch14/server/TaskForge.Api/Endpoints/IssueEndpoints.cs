using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using TaskForge.Api.Auth;
using TaskForge.Api.Contracts;
using TaskForge.Api.Filters;
using TaskForge.Core.Abstractions;
using TaskForge.Core.Common;
using TaskForge.Core.Entities;

namespace TaskForge.Api.Endpoints;

public static class IssueEndpoints
{
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
        group.MapDelete("/issues/{id:int}", DeleteIssue);

        return app;
    }
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
        }, cancellationToken);

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

        return TypedResults.Ok(IssueResponse.FromEntity(issue!));
    }

    private static async Task<Results<NoContent, NotFound, ForbidHttpResult>> DeleteIssue(
        int id,
        ClaimsPrincipal user,
        IIssueRepository issues,
        IProjectRepository projects,
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
        return TypedResults.NoContent();
    }
    // #endregion
}
