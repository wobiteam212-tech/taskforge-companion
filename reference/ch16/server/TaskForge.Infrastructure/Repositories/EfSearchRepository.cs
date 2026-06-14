using Microsoft.EntityFrameworkCore;
using TaskForge.Core.Abstractions;
using TaskForge.Core.Common;
using TaskForge.Infrastructure.Data;

namespace TaskForge.Infrastructure.Repositories;

// #region step-16.11b
// שתי שאילתות רזות, שתיהן מסוננות-הרשאה דרך טבלת ה-membership:
// רק פרויקטים/issues שהמשתמש חבר בהם חוזרים. Take מגביל את העלות —
// palette צריך כמה תוצאות מובילות, לא את הכול.
public sealed class EfSearchRepository(TaskForgeDbContext db) : ISearchRepository
{
    public async Task<SearchResults> SearchForMemberAsync(
        int userId,
        string term,
        int take,
        CancellationToken cancellationToken = default)
    {
        var like = $"%{term}%";

        var projects = await db.Projects
            .AsNoTracking()
            .Where(p =>
                EF.Functions.Like(p.Name, like) &&
                db.ProjectMembers.Any(m => m.ProjectId == p.Id && m.UserId == userId))
            .OrderBy(p => p.Name)
            .Take(take)
            .Select(p => new ProjectHit(p.Id, p.Name))
            .ToListAsync(cancellationToken);

        var issues = await db.Issues
            .AsNoTracking()
            .Where(i =>
                EF.Functions.Like(i.Title, like) &&
                db.ProjectMembers.Any(m => m.ProjectId == i.ProjectId && m.UserId == userId))
            .OrderByDescending(i => i.CreatedAtUtc)
            .Take(take)
            .Select(i => new IssueHit(i.Id, i.ProjectId, i.Title, i.Status))
            .ToListAsync(cancellationToken);

        return new SearchResults(projects, issues);
    }
}
// #endregion
