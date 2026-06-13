using Microsoft.EntityFrameworkCore;
using TaskForge.Core.Abstractions;
using TaskForge.Core.Common;
using TaskForge.Core.Entities;
using TaskForge.Infrastructure.Data;

namespace TaskForge.Infrastructure.Repositories;

public sealed class EfIssueRepository(TaskForgeDbContext db) : IIssueRepository
{
    // #region step-4.5
    // שאילתה דינמית: בונים IQueryable שלב-שלב, ושום SQL לא רץ
    // עד CountAsync / ToListAsync. ה-DB מקבל בדיוק שאילתה אחת לכל קריאה.
    public async Task<PagedResult<Issue>> GetPagedAsync(IssueQuery query, CancellationToken cancellationToken = default)
    {
        var issues = db.Issues
            .AsNoTracking()
            .Where(i => i.ProjectId == query.ProjectId);

        // כל סינון מצטרף רק אם נתבקש — composition של ביטויים, לא SQL בידיים
        if (query.Status is { } status)
        {
            issues = issues.Where(i => i.Status == status);
        }

        if (query.Priority is { } priority)
        {
            issues = issues.Where(i => i.Priority == priority);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            issues = issues.Where(i => EF.Functions.Like(i.Title, $"%{query.Search}%"));
        }

        issues = query.Sort switch
        {
            "created" => issues.OrderBy(i => i.CreatedAtUtc),
            "title" => issues.OrderBy(i => i.Title),
            "priority" => issues.OrderByDescending(i => i.Priority).ThenBy(i => i.CreatedAtUtc),
            _ => issues.OrderByDescending(i => i.CreatedAtUtc), // "-created", ברירת המחדל
        };

        // קודם סופרים (שאילתת COUNT רזה), ואז שולפים עמוד אחד בלבד
        var total = await issues.CountAsync(cancellationToken);

        var items = await issues
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Include(i => i.Labels)
            .ToListAsync(cancellationToken);

        return new PagedResult<Issue>(items, total, query.Page, query.PageSize);
    }
    // #endregion

    public Task<Issue?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        db.Issues
            .AsNoTracking()
            .Include(i => i.Labels)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

    public Task<bool> TitleExistsAsync(
        int projectId,
        string title,
        int? excludeIssueId = null,
        CancellationToken cancellationToken = default)
    {
        var normalized = title.Trim();
        return db.Issues
            .AsNoTracking()
            .Where(i => i.ProjectId == projectId)
            .Where(i => excludeIssueId == null || i.Id != excludeIssueId)
            .AnyAsync(i => i.Title == normalized, cancellationToken);
    }

    // #region step-4.6
    public async Task<Issue> AddAsync(Issue issue, CancellationToken cancellationToken = default)
    {
        db.Issues.Add(issue);
        await db.SaveChangesAsync(cancellationToken);
        return issue; // ה-Id כבר מאוכלס — EF קרא אותו חזרה מה-DB
    }

    // עדכון בסגנון tracked: טוענים עם מעקב, נותנים לקורא לשנות, ושומרים.
    // ה-Change Tracker (פרק 03) מזהה בדיוק אילו עמודות השתנו.
    public async Task<Issue?> UpdateAsync(int id, Action<Issue> apply, CancellationToken cancellationToken = default)
    {
        var issue = await db.Issues
            .Include(i => i.Labels)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

        if (issue is null)
        {
            return null;
        }

        apply(issue);
        await db.SaveChangesAsync(cancellationToken);
        return issue;
    }

    // מחיקה בלי לטעון: ExecuteDelete שולח DELETE ישיר ומחזיר כמה שורות נמחקו
    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default) =>
        await db.Issues
            .Where(i => i.Id == id)
            .ExecuteDeleteAsync(cancellationToken) > 0;
    // #endregion
}
