using TaskForge.Core.Entities;

namespace TaskForge.Api.Contracts;

// #region step-18.7
// תשובת ה-feed: אירוע משוטח עם שם המבצע. הישות ActivityEvent מחזיקה FK
// ל-User; כאן משטחים אותו ל-ActorName אחד, בדיוק מה שהפיד מציג.
// (תשובת ה-stats היא ProjectStats מ-Core/Common ישירות — POCO חוצה-שכבות.)
public sealed record ActivityResponse(
    int Id,
    ActivityType Type,
    string Summary,
    int? IssueId,
    string ActorName,
    DateTime CreatedAtUtc)
{
    public static ActivityResponse FromEntity(ActivityEvent e) => new(
        e.Id,
        e.Type,
        e.Summary,
        e.IssueId,
        e.Actor?.DisplayName ?? "Unknown",
        e.CreatedAtUtc);
}
// #endregion
