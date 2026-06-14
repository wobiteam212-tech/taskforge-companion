using TaskForge.Core.Common;

namespace TaskForge.Core.Abstractions;

// #region step-16.11
// חיפוש חי כ-seam נפרד: הוא חוצה ישויות (פרויקטים + issues), ולכן מקבל
// חוזה משלו במקום להעמיס על repo קיים. הפלטה צורכת אותו, לא יודעת על EF.
public interface ISearchRepository
{
    /// <summary>חיפוש מוגבל-הרשאה: רק פרויקטים ו-issues שהמשתמש חבר בהם.</summary>
    Task<SearchResults> SearchForMemberAsync(
        int userId,
        string term,
        int take,
        CancellationToken cancellationToken = default);
}
// #endregion
