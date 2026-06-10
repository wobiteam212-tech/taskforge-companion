using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using TaskForge.Api.Endpoints;
using TaskForge.Core.Abstractions;
using TaskForge.Infrastructure.Data;
using TaskForge.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// #region step-4.2
// enums נכנסים ויוצאים כטקסט ("Open") בכל ה-API — הגדרה אחת, לכולם
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
// #endregion

// #region step-3.7
// ה-DbContext נרשם Scoped מעצם הגדרתו: יחידת עבודה אחת לכל בקשה.
// מחרוזת החיבור מגיעה מהקונפיגורציה — לא מקובעת בקוד.
builder.Services.AddDbContext<TaskForgeDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default")));
// #endregion

// #region step-4.4
// שני ה-seams של הדומיין: חוזה מה-Core, מימוש מה-Infrastructure
builder.Services.AddScoped<IProjectRepository, EfProjectRepository>();
builder.Services.AddScoped<IIssueRepository, EfIssueRepository>();
// #endregion

// #region step-4.9
// הוולידציה המובנית של .NET 10: כל DTO מסומן ב-DataAnnotations נבדק
// אוטומטית לפני ה-handler; כישלון מחזיר 400 ValidationProblem אחיד.
builder.Services.AddValidation();
// #endregion

// ProblemDetails (RFC 7807) כברירת מחדל לכל שגיאה וסטטוס ללא גוף
builder.Services.AddProblemDetails();

builder.Services.AddOpenApi();

var app = builder.Build();

// #region step-3.11
// בעליית האפליקציה: מיישמים מיגרציות שחסרות ומזריעים DB ריק.
// CreateScope חובה — DbContext הוא Scoped, ומחוץ לבקשה אין scope.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TaskForgeDbContext>();
    await db.Database.MigrateAsync();
    await DbSeeder.SeedAsync(db);
}
// #endregion

// #region step-4.10
// העוטפים החיצוניים: חריגה לא מטופלת הופכת ל-500 ProblemDetails,
// וכל תשובת סטטוס בלי גוף (כמו 404 של routing) מקבלת גוף אחיד.
app.UseExceptionHandler();
app.UseStatusCodePages();
// #endregion

// #region step-1.10
// ── ה-pipeline המוכר מפרק 01: לוגים ומדידת זמן ──

app.Use(async (context, next) =>
{
    app.Logger.LogInformation("{Method} {Path} started",
        context.Request.Method, context.Request.Path);

    await next(context);

    app.Logger.LogInformation("{Method} {Path} finished with {Status}",
        context.Request.Method, context.Request.Path, context.Response.StatusCode);
});

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

// #region step-4.17
// תיאור ה-API נוצר מהקוד עצמו — בסביבת פיתוח בלבד
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi(); // GET /openapi/v1.json
}
// #endregion

// #region step-4.16
app.MapGet("/", () => "TaskForge API is alive");

app.MapGet("/healthz", () => Results.Ok(new { status = "healthy" }));

// כל ה-API העסקי — מאורגן בקבצים לפי פיצ׳ר
app.MapProjectEndpoints();
app.MapIssueEndpoints();
// #endregion

app.Run();
