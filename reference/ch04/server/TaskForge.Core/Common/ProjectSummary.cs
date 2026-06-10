namespace TaskForge.Core.Common;

// הקרנה לקריאה: בדיוק מה שמסך רשימת הפרויקטים צריך, כולל ספירה
// שמחושבת ב-SQL — בלי לטעון את ה-Issues עצמם לזיכרון.
public sealed record ProjectSummary(
    int Id,
    string Name,
    string? Description,
    int OpenIssues);
