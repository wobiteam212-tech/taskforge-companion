using TaskForge.Core.Entities;

namespace TaskForge.Core.Common;

// #region step-16.11
// תוצאות חיפוש כהקרנות רזות — בדיוק מה שה-palette צריך כדי לקפוץ ליעד.
// חיים ב-Core/Common כמו ProjectSummary: POCO חוצה-שכבות, לא ישות מלאה.
public sealed record ProjectHit(int Id, string Name);

public sealed record IssueHit(int Id, int ProjectId, string Title, IssueStatus Status);

public sealed record SearchResults(
    IReadOnlyList<ProjectHit> Projects,
    IReadOnlyList<IssueHit> Issues);
// #endregion
