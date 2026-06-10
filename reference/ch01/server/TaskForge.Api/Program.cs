using TaskForge.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// #region step-1.5
// ── המחצית הראשונה: רישום שירותים ב-DI Container ──
// כאן רק "מלמדים" את האפליקציה איך לייצר כל שירות.
// שום מופע עוד לא נוצר — מופעים נוצרים רק כשמישהו מבקש אותם.

builder.Services.AddSingleton<SingletonProbe>();
builder.Services.AddScoped<ScopedProbe>();
builder.Services.AddTransient<TransientProbe>();
// #endregion

var app = builder.Build();

// #region step-1.10
// ── המחצית השנייה: בניית ה-pipeline. הסדר כאן הוא הכול ──

// middleware 1: לוג לכל בקשה — נכנס ראשון, מסיים אחרון
app.Use(async (context, next) =>
{
    app.Logger.LogInformation("{Method} {Path} started",
        context.Request.Method, context.Request.Path);

    await next(context);

    app.Logger.LogInformation("{Method} {Path} finished with {Status}",
        context.Request.Method, context.Request.Path, context.Response.StatusCode);
});

// middleware 2: מדידת זמן. הכותרת נקבעת בתוך OnStarting,
// כי אחרי שגוף התשובה התחיל לזרום אסור לגעת ב-headers.
app.Use(async (context, next) =>
{
    var stopwatch = System.Diagnostics.Stopwatch.StartNew();

    context.Response.OnStarting(() =>
    {
        stopwatch.Stop();
        context.Response.Headers.Append("X-Elapsed-Ms",
            stopwatch.ElapsedMilliseconds.ToString());
        return Task.CompletedTask;
    });

    await next(context);
});
// #endregion

// #region step-1.11
// ── endpoints: היעד הסופי של המסע ──

app.MapGet("/", () => "TaskForge API is alive");

app.MapGet("/healthz", () => Results.Ok(new { status = "healthy" }));
// #endregion

// #region step-1.8
// endpoint הגילוי: מזריקים כל probe פעמיים ומשווים מזהים
app.MapGet("/di/lifetimes", (
    SingletonProbe singleton,
    ScopedProbe scopedA,
    ScopedProbe scopedB,
    TransientProbe transientA,
    TransientProbe transientB) => Results.Ok(new
{
    singleton = singleton.Id,
    scopedA = scopedA.Id,
    scopedB = scopedB.Id,
    transientA = transientA.Id,
    transientB = transientB.Id,
}));
// #endregion

app.Run();
