using System.Diagnostics;

namespace TaskForge.Api.Filters;

// Endpoint filter: עוטף את ה-handler בלבד — לא את כל הצינור כמו middleware.
// ההשוואה בין X-Handler-Ms לבין X-Elapsed-Ms (מפרק 01) מספרת
// כמה זמן נבלע ב-middleware, ב-routing וב-binding מסביב ל-handler עצמו.
public sealed class HandlerTimingFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var stopwatch = Stopwatch.StartNew();

        var result = await next(context); // ה-handler (או הפילטר הבא בשרשרת)

        stopwatch.Stop();
        context.HttpContext.Response.Headers.Append("X-Handler-Ms",
            stopwatch.ElapsedMilliseconds.ToString());

        return result;
    }
}
