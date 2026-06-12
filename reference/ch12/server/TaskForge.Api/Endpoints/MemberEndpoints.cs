using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using TaskForge.Api.Auth;
using TaskForge.Api.Contracts;
using TaskForge.Core.Abstractions;
using TaskForge.Core.Entities;

namespace TaskForge.Api.Endpoints;

public static class MemberEndpoints
{
    // #region step-12.6
    // הרשאה מבוססת-משאב: RequireAuthorization עונה על "מי אתה?",
    // אבל "מותר לך *בפרויקט הזה*?" תלוי בנתונים — ולכן נבדק בתוך ה-handler,
    // מול ה-repository. roles גלובליים לא מספיקים כאן.
    public static IEndpointRouteBuilder MapMemberEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app
            .MapGroup("/api/projects/{projectId:int}/members")
            .WithTags("Members")
            .RequireAuthorization();

        group.MapGet("/", GetMembers);
        group.MapPost("/", AddMember);

        return app;
    }

    // קריאה: כל חבר רואה את רשימת החברים. מי שאינו חבר מקבל 403 —
    // לא 404 — כי הפרויקט קיים; פשוט אסור לו להציץ פנימה.
    private static async Task<Results<Ok<IReadOnlyList<MemberResponse>>, NotFound, ForbidHttpResult>> GetMembers(
        int projectId,
        ClaimsPrincipal user,
        IProjectRepository projects,
        CancellationToken cancellationToken)
    {
        if (!await projects.ExistsAsync(projectId, cancellationToken))
        {
            return TypedResults.NotFound();
        }

        var role = await projects.GetRoleAsync(projectId, user.GetUserId(), cancellationToken);
        if (role is null)
        {
            return TypedResults.Forbid();
        }

        var members = await projects.GetMembersAsync(projectId, cancellationToken);
        IReadOnlyList<MemberResponse> mapped = members.Select(MemberResponse.FromInfo).ToList();
        return TypedResults.Ok(mapped);
    }
    // #endregion

    // #region step-12.7
    // פקודה: רק Owner מצרף חברים. כל מסלול יציאה מוצהר בחתימה —
    // 200 עם הרשימה המעודכנת, 404 (פרויקט/משתמש), 403 (לא Owner),
    // 409 (כבר חבר). המהדר לא נותן לשכוח אף אחד מהם.
    private static async Task<Results<Ok<IReadOnlyList<MemberResponse>>, NotFound, ForbidHttpResult, Conflict<string>>> AddMember(
        int projectId,
        AddMemberRequest request,
        ClaimsPrincipal user,
        IProjectRepository projects,
        IUserRepository users,
        CancellationToken cancellationToken)
    {
        if (!await projects.ExistsAsync(projectId, cancellationToken))
        {
            return TypedResults.NotFound();
        }

        var callerRole = await projects.GetRoleAsync(projectId, user.GetUserId(), cancellationToken);
        if (callerRole is not ProjectRole.Owner)
        {
            return TypedResults.Forbid();
        }

        var invited = await users.GetByEmailAsync(request.Email, cancellationToken);
        if (invited is null)
        {
            return TypedResults.NotFound();
        }

        var added = await projects.AddMemberAsync(projectId, invited.Id, request.Role, cancellationToken);
        if (!added)
        {
            return TypedResults.Conflict($"{request.Email} is already a member of this project");
        }

        var members = await projects.GetMembersAsync(projectId, cancellationToken);
        IReadOnlyList<MemberResponse> mapped = members.Select(MemberResponse.FromInfo).ToList();
        return TypedResults.Ok(mapped);
    }
    // #endregion
}
