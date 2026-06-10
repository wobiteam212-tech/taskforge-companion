namespace TaskForge.Core.Common;

// אופציות ה-JWT כ-POCO נקי: גם מנפיק הטוקנים (Infrastructure) וגם
// מאמת הטוקנים (Api) קוראים מאותה הגדרה אחת — שמגיעה מהקונפיגורציה.
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "";

    public string Audience { get; set; } = "";

    // המפתח הסימטרי לחתימה. בפיתוח: appsettings; בפרודקשן: משתנה סביבה בלבד.
    public string Key { get; set; } = "";

    public int AccessTokenMinutes { get; set; } = 15;

    public int RefreshTokenDays { get; set; } = 7;
}
