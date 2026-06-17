using System.Globalization;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TaskForge.Api.Caching;
using TaskForge.Api.Endpoints;
using TaskForge.Api.Hubs;
using TaskForge.Api.Realtime;
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
        .AllowAnyMethod()
        // #region step-24.7
        // פרק 24: SignalR מעל credentials (החיבור נושא זהות) דורש AllowCredentials.
        // GOTCHA: AllowCredentials *אסור* ביחד עם AllowAnyOrigin — חייבים origin
        // מפורש (WithOrigins למעלה), אחרת ASP.NET זורק בעלייה. כאן יש לנו origin
        // מדויק, אז זה חוקי.
        .AllowCredentials()));
        // #endregion
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
// #region step-16.13
// פרק 16: seam החיפוש מצטרף לאותו דפוס רישום
builder.Services.AddScoped<ISearchRepository, EfSearchRepository>();
// #endregion
// #region step-18.11
// פרק 18: seam האגרגציה ו-seam יומן הפעילות
builder.Services.AddScoped<IStatsRepository, EfStatsRepository>();
builder.Services.AddScoped<IActivityRepository, EfActivityRepository>();
// #endregion
// #region step-19.11
// פרק 19: seam הקבצים המצורפים
builder.Services.AddScoped<IAttachmentRepository, EfAttachmentRepository>();
// #endregion
// #region step-24.4b
// פרק 24: seam ההתראות. ה-handlers תלויים ב-IBoardNotifier; המימוש עוטף
// IHubContext (singleton, חסר-state) — לכן singleton.
builder.Services.AddSingleton<IBoardNotifier, SignalRBoardNotifier>();
// #endregion
// #endregion

// #region step-5.8
// שירותי auth חסרי-state — ‏Singleton בלב שלם
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddSingleton<ITokenService, TokenService>();

// קושרים את סקציית "Jwt" מהקונפיגורציה אל ה-options — מקור אמת אחד
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
    ?? throw new InvalidOperationException("Missing Jwt configuration section");

// #region step-23.8
// סודות: מפתח החתימה כבר *לא* יושב ב-appsettings.json (הקובץ שנשלח). הוא
// מגיע מהסביבה — user-secrets בפיתוח, משתנה-סביבה/Key-Vault בפרודקשן. אם אף
// מקור לא סיפק אותו, נכשלים *מיד* בעלייה ולא מנפיקים טוקנים עם מפתח ריק.
if (string.IsNullOrWhiteSpace(jwt.Key))
{
    throw new InvalidOperationException(
        "Jwt:Key is not configured. Provide it via user-secrets (dev) " +
        "or the Jwt__Key environment variable (prod).");
}
// #endregion
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

        // #region step-24.6
        // אימות מעל WebSocket: הדפדפן לא יכול לצרף כותרת Authorization ל-WebSocket,
        // אז SignalR מעביר את הטוקן ב-query string (`?access_token=...`). כאן אנחנו
        // מרימים אותו משם — אבל *רק* לנתיבי ה-hub, כדי לא לשנות את אימות ה-REST.
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            },
        };
        // #endregion
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

// #region step-24.5
// פרק 24: SignalR. AddJsonProtocol מיישר את ה-payload לאותו ניב כמו ה-REST —
// camelCase + enums כמחרוזת — כדי שהלקוח יקבל `issue.status === 'Open'` בדיוק
// כמו מ-httpResource, בלי טיפול-מקרה לכל transport.
builder.Services
    .AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
// #endregion

// #region step-23.2
// פרק 23: OutputCache. הרישום מוסיף את ה-store ואת מנגנון המדיניות; את
// המדיניות עצמה ל-/stats מגדירים כ-policy בשם "StatsCache". excludeDefaultPolicy
// חיוני: בלעדיו מדיניות ברירת המחדל הייתה מסרבת לשמור בקשה מאומתת.
builder.Services.AddOutputCache(options =>
{
    options.AddPolicy(
        "StatsCache",
        policy => policy.AddPolicy(typeof(StatsCachePolicy)),
        excludeDefaultPolicy: true);
});
// #endregion

// #region step-23.5
// פרק 23: דחיסת תשובות — Brotli מועדף, Gzip כגיבוי. EnableForHttps מאשר
// דחיסה גם תחת TLS (ב-API פנימי לטוקנים זה בטוח; לראוטים עם תוכן רגיש
// ומשתנה צד-לקוח כדאי לשקול את התקפת BREACH).
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});
// #endregion

// #region step-23.6
// פרק 23: Rate limiting. שתי שכבות —
//   1) "auth": חלון קבוע צר על login/register, הגנת brute-force על סיסמאות;
//   2) global: חלון רחב ומתירני לכל IP, רשת ביטחון מפני הצפה.
// דחייה מחזירה 429 + Retry-After כדי שהקליינט יידע *מתי* לנסות שוב.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddFixedWindowLimiter("auth", limiter =>
    {
        limiter.PermitLimit = 5;
        limiter.Window = TimeSpan.FromSeconds(30);
        limiter.QueueLimit = 0;
    });

    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromSeconds(10),
                QueueLimit = 0,
            }));

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;

        // Retry-After: כמה שניות עד שהחלון מתאפס — הקליינט יקרא את זה.
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter =
                ((int)retryAfter.TotalSeconds).ToString(NumberFormatInfo.InvariantInfo);
        }

        await context.HttpContext.Response.WriteAsJsonAsync(
            new { title = "Too many requests", detail = "Slow down and try again shortly." },
            token);
    };
});
// #endregion

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

// #region step-23.7
// פרק 23: כותרות אבטחה על *כל* תשובה (כולל שגיאות ו-cache hits, כי ה-middleware
// הזה חיצוני להם). זו הגנת עומק זולה: דפדפן שלא מנחש סוגי תוכן, לא נטען ב-iframe,
// ולא מדליף referer. HSTS רק בפרודקשן — בפיתוח על http הוא מזיק.
app.Use(async (context, next) =>
{
    var headers = context.Response.Headers;
    headers["X-Content-Type-Options"] = "nosniff";
    headers["X-Frame-Options"] = "DENY";
    headers["Referrer-Policy"] = "no-referrer";
    headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'";
    await next(context);
});

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}
// #endregion

// #region step-23.5b
// דחיסה חיצונית לשאר ה-pipeline: היא עוטפת את הזרם, כך שכל תשובה שיורדת
// במורד (כולל תשובה ששורתה מה-cache) יוצאת דחוסה אם הלקוח תומך.
app.UseResponseCompression();
// #endregion

// #region step-11.2b
// מוקדם ב-pipeline: גם preflight ‏(OPTIONS) וגם תשובות שגיאה
// צריכים לשאת את כותרות ה-CORS, אחרת הדפדפן יסתיר אותן מהקליינט.
app.UseCors(ClientCors);
// #endregion

// #region step-23.6b
// ה-rate limiter רץ אחרי routing (כדי לזהות את ה-policy של ה-endpoint) ואחרי
// CORS (כדי שה-preflight לא ייספר). ה-global limiter חל על הכול; ה-policy
// בשם "auth" חל רק על ה-endpoints שביקשו אותו במפורש.
app.UseRateLimiter();
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

// #region step-23.2b
// ה-OutputCache *אחרי* האימות: כך User מאוכלס בזמן בניית מפתח ה-cache
// (vary-by-user), ו-RequireAuthorization כבר רץ — בקשה לא-מאומתת מקבלת 401
// לפני שבכלל מגיעים ל-cache. את ה-policy מצמידים ל-/stats עם CacheOutput.
app.UseOutputCache();
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

// #region step-16.13b
// פרק 16: endpoint החיפוש שמזין את ה-command palette
app.MapSearchEndpoints();
// #endregion

// #region step-18.11b
// פרק 18: endpoints הדשבורד — סיכום ופיד פעילות
app.MapDashboardEndpoints();
// #endregion

// #region step-19.11b
// פרק 19: endpoints הקבצים המצורפים
app.MapAttachmentEndpoints();
// #endregion

// #region step-24.5b
// פרק 24: ה-hub עצמו על /hubs/board. ה-[Authorize] שעליו + step-24.6 מבטיחים
// שאין handshake בלי טוקן תקף. הלקוח מתחבר, קורא JoinProject, ומקבל broadcasts.
app.MapHub<BoardHub>("/hubs/board");
// #endregion

app.Run();
