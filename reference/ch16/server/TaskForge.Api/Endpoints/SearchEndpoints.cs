using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using TaskForge.Api.Auth;
using TaskForge.Api.Filters;
using TaskForge.Core.Abstractions;
using TaskForge.Core.Common;

namespace TaskForge.Api.Endpoints;

public static class SearchEndpoints
{
    // #region step-16.12
    // אותו דפוס כמו שאר הקבוצות: prefix /api, תג OpenAPI, פילטר תזמון,
    // והכול דורש אימות. שורה אחת ב-Program מחברת.
    public static IEndpointRouteBuilder MapSearchEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api")
            .WithTags("Search")
            .AddEndpointFilter<HandlerTimingFilter>()
            .RequireAuthorization();

        group.MapGet("/search", Search);

        return app;
    }

    // query קצר מדי = תוצאה ריקה (בלי לפגוע ב-DB על תו אחד).
    // ההרשאה נאכפת בתוך ה-repository: רק מה שהמשתמש חבר בו חוזר.
    private static async Task<Ok<SearchResults>> Search(
        string? q,
        ClaimsPrincipal user,
        ISearchRepository search,
        CancellationToken cancellationToken)
    {
        var term = (q ?? string.Empty).Trim();
        if (term.Length < 2)
        {
            return TypedResults.Ok(new SearchResults([], []));
        }

        var results = await search.SearchForMemberAsync(user.GetUserId(), term, 5, cancellationToken);
        return TypedResults.Ok(results);
    }
    // #endregion
}
