# #region step-25.2
# Dockerfile רב-שלבי ל-API. שלב ה-build כבד (SDK מלא, מקור, חבילות); שלב ה-runtime
# רזה (רק ה-aspnet runtime + הפלט המפורסם). ה-image הסופי לא נושא את ה-SDK ולא את
# המקור — קטן יותר, משטח-תקיפה קטן יותר, push/pull מהיר יותר.

# ── שלב build: קומפילציה ופרסום ──
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# קודם מעתיקים *רק* את קבצי הפרויקט ומשחזרים — שכבת ה-restore נשמרת ב-cache
# כל עוד התלויות לא השתנו, גם אם הקוד כן (Docker layer caching).
COPY TaskForge.slnx ./
COPY TaskForge.Core/TaskForge.Core.csproj TaskForge.Core/
COPY TaskForge.Infrastructure/TaskForge.Infrastructure.csproj TaskForge.Infrastructure/
COPY TaskForge.Api/TaskForge.Api.csproj TaskForge.Api/
COPY tests/TaskForge.Tests/TaskForge.Tests.csproj tests/TaskForge.Tests/
RUN dotnet restore TaskForge.Api/TaskForge.Api.csproj

# עכשיו את שאר המקור, ומפרסמים Release. ה-publish כולל trim של קבצי dev.
COPY . .
RUN dotnet publish TaskForge.Api/TaskForge.Api.csproj -c Release -o /app/publish --no-restore

# ── שלב runtime: image רזה לריצה בלבד ──
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Kestrel מאזין על 8080 בתוך הקונטיינר (לא 5080 של הפיתוח). ה-reverse proxy
# (ראו client/nginx.conf) מפנה אליו. ASPNETCORE_ENVIRONMENT ו-Jwt__Key מגיעים
# מ-compose/הסביבה — לא מ-appsettings (פרק 23: סוד לא יושב בקוד).
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "TaskForge.Api.dll"]
# #endregion
