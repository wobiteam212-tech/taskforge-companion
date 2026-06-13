using TaskForge.Core.Common;
using TaskForge.Core.Entities;

namespace TaskForge.Core.Abstractions;

// שאילתת הלוח כחוזה: כל מה שאפשר לסנן, למיין ולדפדף בו —
// במקום חמישה פרמטרים בודדים שמתרבים עם כל פיצ׳ר.
public sealed record IssueQuery(
    int ProjectId,
    IssueStatus? Status = null,
    IssuePriority? Priority = null,
    string? Search = null,
    string Sort = "-created",
    int Page = 1,
    int PageSize = 20);

public interface IIssueRepository
{
    Task<PagedResult<Issue>> GetPagedAsync(IssueQuery query, CancellationToken cancellationToken = default);

    Task<Issue?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<bool> TitleExistsAsync(
        int projectId,
        string title,
        int? excludeIssueId = null,
        CancellationToken cancellationToken = default);

    Task<Issue> AddAsync(Issue issue, CancellationToken cancellationToken = default);

    /// <summary>טוען ישות במעקב, מפעיל עליה את השינוי, ושומר. null אם לא נמצאה.</summary>
    Task<Issue?> UpdateAsync(int id, Action<Issue> apply, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
