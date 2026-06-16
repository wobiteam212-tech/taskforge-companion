using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Options;
using TaskForge.Api.Auth;
using TaskForge.Api.Contracts;
using TaskForge.Core.Abstractions;
using TaskForge.Core.Common;
using TaskForge.Core.Entities;
using System.Security.Claims;

namespace TaskForge.Api.Endpoints;

public static class AuthEndpoints
{
    // #region step-5.11
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        // #region step-23.6c
        // register ו-login הם משטח ניחוש-הסיסמאות — מצמידים להם את ה-policy "auth"
        // (חלון קבוע צר). refresh *לא* מוגבל: ה-SPA קורא לו שגרתית לרענון שקט,
        // וטוקן רענון הוא סוד ארוך וחד-פעמי, לא סיסמה שמנחשים.
        group.MapPost("/register", Register).RequireRateLimiting("auth");
        group.MapPost("/login", Login).RequireRateLimiting("auth");
        // #endregion
        group.MapPost("/refresh", Refresh);

        // היחיד בקבוצה שדורש טוקן: "מי אני" לפי ה-claims המאומתים
        group.MapGet("/me", Me).RequireAuthorization();

        return app;
    }
    // #endregion

    // #region step-5.12
    private static async Task<Results<Created<AuthResponse>, Conflict<string>>> Register(
        RegisterRequest request,
        IUserRepository users,
        IPasswordHasher hasher,
        ITokenService tokens,
        IRefreshTokenRepository refreshTokens,
        IOptions<JwtOptions> jwt,
        CancellationToken cancellationToken)
    {
        if (await users.EmailExistsAsync(request.Email, cancellationToken))
        {
            // 409: הבקשה תקינה, אבל מתנגשת במצב הקיים
            return TypedResults.Conflict("Email is already registered.");
        }

        var user = await users.AddAsync(new User
        {
            Email = request.Email,
            DisplayName = request.DisplayName,
            PasswordHash = hasher.Hash(request.Password),
            CreatedAtUtc = DateTime.UtcNow,
        }, cancellationToken);

        var auth = await IssueTokensAsync(user, tokens, refreshTokens, jwt.Value, cancellationToken);
        return TypedResults.Created("/api/auth/me", auth);
    }

    private static async Task<Results<Ok<AuthResponse>, UnauthorizedHttpResult>> Login(
        LoginRequest request,
        IUserRepository users,
        IPasswordHasher hasher,
        ITokenService tokens,
        IRefreshTokenRepository refreshTokens,
        IOptions<JwtOptions> jwt,
        CancellationToken cancellationToken)
    {
        var user = await users.GetByEmailAsync(request.Email, cancellationToken);

        // תשובה אחידה לשני הכישלונות — לא מסגירים אם האימייל קיים
        if (user is null || !hasher.Verify(request.Password, user.PasswordHash))
        {
            return TypedResults.Unauthorized();
        }

        var auth = await IssueTokensAsync(user, tokens, refreshTokens, jwt.Value, cancellationToken);
        return TypedResults.Ok(auth);
    }
    // #endregion

    // #region step-5.13
    // Rotation: כל refresh שורף את הטוקן הישן ומנפיק זוג חדש.
    // טוקן גנוב שמנוסה שוב — כבר מבוטל, והגניבה נחשפת.
    private static async Task<Results<Ok<AuthResponse>, UnauthorizedHttpResult>> Refresh(
        RefreshRequest request,
        IRefreshTokenRepository refreshTokens,
        ITokenService tokens,
        IOptions<JwtOptions> jwt,
        CancellationToken cancellationToken)
    {
        var existing = await refreshTokens.GetActiveAsync(request.RefreshToken, cancellationToken);
        if (existing?.User is null)
        {
            return TypedResults.Unauthorized();
        }

        await refreshTokens.RevokeAsync(existing, cancellationToken);

        var auth = await IssueTokensAsync(existing.User, tokens, refreshTokens, jwt.Value, cancellationToken);
        return TypedResults.Ok(auth);
    }
    // #endregion

    private static async Task<Results<Ok<UserResponse>, NotFound>> Me(
        ClaimsPrincipal principal,
        IUserRepository users,
        CancellationToken cancellationToken)
    {
        var user = await users.GetByIdAsync(principal.GetUserId(), cancellationToken);
        return user is null
            ? TypedResults.NotFound()
            : TypedResults.Ok(UserResponse.FromEntity(user));
    }

    // מסלול אחד להנפקה — register, login ו-refresh חולקים אותו
    private static async Task<AuthResponse> IssueTokensAsync(
        User user,
        ITokenService tokens,
        IRefreshTokenRepository refreshTokens,
        JwtOptions jwt,
        CancellationToken cancellationToken)
    {
        var refresh = new RefreshToken
        {
            Token = tokens.CreateRefreshToken(),
            UserId = user.Id,
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(jwt.RefreshTokenDays),
        };
        await refreshTokens.AddAsync(refresh, cancellationToken);

        return new AuthResponse(
            tokens.CreateAccessToken(user),
            refresh.Token,
            DateTime.UtcNow.AddMinutes(jwt.AccessTokenMinutes),
            UserResponse.FromEntity(user));
    }
}
