using TaskForge.Core.Entities;

namespace TaskForge.Core.Common;

// #region step-18.2
// הקרנות אגרגציה — בדיוק מה שהדשבורד צריך כדי לצייר. חיות ב-Core/Common
// כמו ProjectSummary ו-SearchResults: POCO חוצי-שכבות, לא ישויות. כל ספירה
// היא תוצאה של GROUP BY בצד ה-DB, לא לולאה בזיכרון.
public sealed record StatusCount(IssueStatus Status, int Count);

public sealed record PriorityCount(IssuePriority Priority, int Count);

// CreatedPerDay: סדרת מגמה לגרף ה-sparkline. Day הוא תאריך בלבד (ללא שעה).
public sealed record DayCount(DateOnly Day, int Count);

public sealed record ProjectStats(
    int Total,
    int Open,
    int InProgress,
    int Done,
    IReadOnlyList<StatusCount> ByStatus,
    IReadOnlyList<PriorityCount> ByPriority,
    IReadOnlyList<DayCount> CreatedPerDay);
// #endregion
