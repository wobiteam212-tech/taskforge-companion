using System.Security.Claims;

namespace TaskForge.Api.Auth;

public static class CurrentUserExtensions
{
    // ה-claim ‏sub מהטוקן מגיע לכאן כ-NameIdentifier (מיפוי ברירת המחדל של ה-handler).
    // אם אין משתמש מאומת — זו שגיאת תכנות (endpoint בלי RequireAuthorization), ולכן זורקים.
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var raw = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException(
                "No user id claim — is this endpoint missing RequireAuthorization()?");
        return int.Parse(raw);
    }
}
