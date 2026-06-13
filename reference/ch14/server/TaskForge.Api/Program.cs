using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TaskForge.Api.Endpoints;
using TaskForge.Core.Abstractions;
using TaskForge.Core.Common;
using TaskForge.Infrastructure.Auth;
using TaskForge.Infrastructure.Data;
using TaskForge.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// #region step-4.2
// enums נכנסים ויוצאים כטקסט ("Open") בכל ה-API — הגדרה אחת, לכולם
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
// #endregion

// #region step-11.2
// הקליינט חי ב-origin אחר (4500 מול 5080) — הדפדפן יחסום כל בקשה
// עד שהשרת יצהיר במפורש שה-origin הזה רצוי. זו לא "תקלה לעקוף",
// זו הצהרת אמון: רק האפליקציה שלנו, רק הכותרות והמתודות שביקשנו.
const string ClientCors = "taskforge-client";

builder.Services.AddCors(options =>
    options.AddPolicy(ClientCors, policy => policy
        .WithOrigins("http://localhost:4500")
        .AllowAnyHeader()
        .AllowAnyMethod()));
// #endregion

// #region step-3.7
// ה-DbContext נרשם Scoped מעצם הגדרתו: יחידת עבודה אחת לכל בקשה.
// מחרוזת החיבור מגיעה מהקונפיגורציה — לא מקובעת בקוד.
builder.Services.AddDbContext<TaskForgeDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default")));
// #endregion

// #region step-4.4
// ה-seams של הדומיין: חוזה מה-Core, מימוש מה-Infrastructure
builder.Services.AddScoped<IProjectRepository, EfProjectRepository>();
builder.Services.AddScoped<IIssueRepository, EfIssueRepository>();
builder.Services.AddScoped<ICommentRepository, EfCommentRepository>();
builder.Services.AddScoped<IUserRepository, EfUserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, EfRefreshTokenRepository>();
// #endregion

// #region step-5.8
// שירותי auth חסרי-state — ‏Singleton בלב שלם
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddSingleton<ITokenService, TokenService>();

// קושרים את סקציית "Jwt" מהקונפיגורציה אל ה-options — מקור אמת אחד
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
    ?? throw new InvalidOperationException("Missing Jwt configuration section");
// #endregion

// #region step-5.9
// צד האימות: ה-handler של Bearer מצרף לכל בקשה את ה-ClaimsPrincipal
// אם הטוקן חתום נכון, בתוקף, ומגיע מהמנפיק ולקהל הנכונים.
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            ValidateLifetime = true,
            // ברירת המחדל היא 5 דקות חסד — נצמיד לשעון אמיתי
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });

builder.Services.AddAuthorization();
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

// #region step-11.2b
// מוקדם ב-pipeline: גם preflight ‏(OPTIONS) וגם תשובות שגיאה
// צריכים לשאת את כותרות ה-CORS, אחרת הדפדפן יסתיר אותן מהקליינט.
app.UseCors(ClientCors);
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

// #region step-5.10
// קודם מזהים (מי אתה?), אחר כך מחליטים (מותר לך?) — הסדר קשיח
app.UseAuthentication();
app.UseAuthorization();
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
app.MapAuthEndpoints();
app.MapProjectEndpoints();
app.MapIssueEndpoints();
// #region step-14.5b
app.MapCommentEndpoints();
// #endregion
// #endregion

// #region step-12.6b
// קבוצת ה-members מצטרפת לאותו דפוס: קובץ לפי פיצ׳ר, שורה אחת כאן
app.MapMemberEndpoints();
// #endregion

app.Run();
