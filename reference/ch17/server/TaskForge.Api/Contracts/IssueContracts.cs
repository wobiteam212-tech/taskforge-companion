using System.ComponentModel.DataAnnotations;
using TaskForge.Core.Abstractions;
using TaskForge.Core.Entities;

namespace TaskForge.Api.Contracts;

// חוזה ה-HTTP של Issues. ‏records: ‏immutable, שוויון לפי ערך, ושורה אחת לכל טיפוס.
// הישות היא פנים-המערכת; ה-DTOs האלה הם מה שעובר על הקו — בכוונה בנפרד.

public sealed record CreateIssueRequest(
    [property: Required, StringLength(200, MinimumLength = 3)] string Title,
    [property: StringLength(4000)] string? Description,
    IssuePriority Priority = IssuePriority.Medium);

public sealed record UpdateIssueRequest(
    [property: Required, StringLength(200, MinimumLength = 3)] string Title,
    [property: StringLength(4000)] string? Description,
    IssueStatus Status,
    IssuePriority Priority);

// #region step-17.2
// פקודת הסידור-מחדש: סטטוס היעד (לאיזו עמודה גררו) ו-Rank חדש (נקודת אמצע
// שהקליינט חישב בין שני השכנים). ה-handler מאמת שה-Rank סופי, חיובי ובטווח.
// מינימלי בכוונה — שינוי מיקום, לא עריכת issue.
public sealed record ReorderIssueRequest(IssueStatus Status, double Rank);
// #endregion

public sealed record TitleAvailabilityResponse(bool Available);

public sealed record LabelResponse(int Id, string Name, string? Color);

public sealed record IssueResponse(
    int Id,
    string Title,
    string? Description,
    IssueStatus Status,
    IssuePriority Priority,
    int ProjectId,
    DateTime CreatedAtUtc,
    // #region step-17.2b
    double Rank,
    // #endregion
    IReadOnlyList<LabelResponse> Labels)
{
    public static IssueResponse FromEntity(Issue issue) => new(
        issue.Id,
        issue.Title,
        issue.Description,
        issue.Status,
        issue.Priority,
        issue.ProjectId,
        issue.CreatedAtUtc,
        issue.Rank,
        issue.Labels.Select(l => new LabelResponse(l.Id, l.Name, l.Color)).ToList());
}

// #region step-4.8
// [AsParameters]: כל ה-query string נקשר לאובייקט אחד במקום שישה פרמטרים.
// הוולידציה של .NET 10 רצה גם כאן — pageSize=999 ייפסל לפני ה-handler.
public sealed record IssueListParams(
    IssueStatus? Status,
    IssuePriority? Priority,
    [property: StringLength(100)] string? Search,
    string Sort = "-created",
    [property: Range(1, int.MaxValue)] int Page = 1,
    [property: Range(1, 100)] int PageSize = 20)
{
    public IssueQuery ToQuery(int projectId) =>
        new(projectId, Status, Priority, Search, Sort, Page, PageSize);
}
// #endregion
