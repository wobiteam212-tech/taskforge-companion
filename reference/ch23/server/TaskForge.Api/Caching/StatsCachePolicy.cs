using System.Security.Claims;
using Microsoft.AspNetCore.OutputCaching;

namespace TaskForge.Api.Caching;

// #region step-23.3
// מדיניות ה-OutputCache ל-/stats. למה צריך class ולא רק .Expire() שוטף?
// כי /stats הוא endpoint מאומת, ומדיניות ברירת המחדל של OutputCache מסרבת
// בכוונה לשמור בקשות שיש בהן Authorization. לכן כותבים מדיניות מפורשת:
//
//   1) מפעילים caching למרות ה-auth (EnableOutputCaching=true);
//   2) vary-by המשתמש *וגם* ה-projectId — אחרת ה-cache hit היה מגיש את
//      התשובה של חבר אחד למשתמש אחר. וזה קריטי לאבטחה: ב-cache hit ה-handler
//      *לא רץ*, כך שבדיקת החברות (IsMemberAsync) נדלגת. אם נשמור לפי projectId
//      בלבד, לא-חבר היה מקבל cache hit. לכן מפתח ה-cache כולל את המשתמש;
//   3) tag דינמי "stats-{projectId}" — נקודת ה-eviction: כתיבה ל-issue
//      מפנה בדיוק את הפרויקט הזה;
//   4) שומרים רק 200 — 403/404 לא נכנסים ל-cache.
public sealed class StatsCachePolicy : IOutputCachePolicy
{
    private static readonly TimeSpan Ttl = TimeSpan.FromSeconds(15);

    public ValueTask CacheRequestAsync(OutputCacheContext context, CancellationToken cancellation)
    {
        var request = context.HttpContext.Request;
        var cacheable = HttpMethods.IsGet(request.Method);

        // ברירת המחדל סירבה כי יש Authorization — אנחנו מפעילים במפורש.
        context.EnableOutputCaching = cacheable;
        context.AllowCacheLookup = cacheable;
        context.AllowCacheStorage = cacheable;
        context.AllowLocking = true;
        context.ResponseExpirationTimeSpan = Ttl;

        // מפתח ה-cache = projectId שבמסלול + מזהה המשתמש המאומת.
        context.CacheVaryByRules.RouteValueNames = "projectId";
        var userId = context.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
        context.CacheVaryByRules.VaryByValues["user"] = userId;

        // tag דינמי לפי הפרויקט — כך כתיבה תפנה רק את ה-stats של אותו פרויקט.
        if (request.RouteValues.TryGetValue("projectId", out var projectId) && projectId is not null)
        {
            context.Tags.Add($"stats-{projectId}");
        }

        return ValueTask.CompletedTask;
    }

    public ValueTask ServeFromCacheAsync(OutputCacheContext context, CancellationToken cancellation)
        => ValueTask.CompletedTask;

    public ValueTask ServeResponseAsync(OutputCacheContext context, CancellationToken cancellation)
    {
        // לא שומרים תשובות הרשאה/שגיאה — רק 200 נכנס ל-cache.
        if (context.HttpContext.Response.StatusCode != StatusCodes.Status200OK)
        {
            context.AllowCacheStorage = false;
        }

        return ValueTask.CompletedTask;
    }
}
// #endregion
