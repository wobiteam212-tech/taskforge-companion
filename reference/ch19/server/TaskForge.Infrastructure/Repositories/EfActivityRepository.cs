using Microsoft.EntityFrameworkCore;
using TaskForge.Core.Abstractions;
using TaskForge.Core.Entities;
using TaskForge.Infrastructure.Data;

namespace TaskForge.Infrastructure.Repositories;

// #region step-18.6
// כתיבה: מוסיפים שורת אירוע ושומרים — append-only, בלי מעקב/עדכון.
// קריאה: ה-feed האחרון, ‏Include של ה-Actor כדי להציג שם, ‏Take מגביל עלות.
public sealed class EfActivityRepository(TaskForgeDbContext db) : IActivityRepository
{
    public async Task LogAsync(ActivityEvent activityEvent, CancellationToken cancellationToken = default)
    {
        db.ActivityEvents.Add(activityEvent);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ActivityEvent>> GetRecentForProjectAsync(
        int projectId,
        int take,
        CancellationToken cancellationToken = default) =>
        await db.ActivityEvents
            .AsNoTracking()
            .Where(e => e.ProjectId == projectId)
            .Include(e => e.Actor)
            .OrderByDescending(e => e.CreatedAtUtc)
            .ThenByDescending(e => e.Id)
            .Take(take)
            .ToListAsync(cancellationToken);

    // #region step-19.8b
    // אותה שאילתה בדיוק, רק מסוננת ל-issueId — ה-timeline של מסך הפרטים.
    public async Task<IReadOnlyList<ActivityEvent>> GetRecentForIssueAsync(
        int issueId,
        int take,
        CancellationToken cancellationToken = default) =>
        await db.ActivityEvents
            .AsNoTracking()
            .Where(e => e.IssueId == issueId)
            .Include(e => e.Actor)
            .OrderByDescending(e => e.CreatedAtUtc)
            .ThenByDescending(e => e.Id)
            .Take(take)
            .ToListAsync(cancellationToken);
    // #endregion
}
// #endregion
