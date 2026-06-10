namespace TaskForge.Core.Common;

// חוזה הדפדוף של כל רשימה ב-TaskForge: הפריטים של העמוד הנוכחי
// לצד המספרים שהקליינט צריך כדי לצייר ניווט עמודים.
public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Total,
    int Page,
    int PageSize)
{
    public int TotalPages => (int)Math.Ceiling((double)Total / PageSize);
}
