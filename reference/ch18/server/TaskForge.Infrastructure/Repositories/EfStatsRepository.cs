using Microsoft.EntityFrameworkCore;
using TaskForge.Core.Abstractions;
using TaskForge.Core.Common;
using TaskForge.Core.Entities;
using TaskForge.Infrastructure.Data;

namespace TaskForge.Infrastructure.Repositories;

// #region step-18.4
// אגרגציה בצד ה-DB: כל ספירה היא GROUP BY שמחזיר שורות מעטות, לא את כל
// ה-issues לזיכרון. AsNoTracking כי זו קריאה בלבד. ה-DB עושה את העבודה הכבדה.
public sealed class EfStatsRepository(TaskForgeDbContext db) : IStatsRepository
{
    public async Task<ProjectStats> GetForProjectAsync(int projectId, CancellationToken cancellationToken = default)
    {
        var issues = db.Issues.AsNoTracking().Where(i => i.ProjectId == projectId);

        // GROUP BY Status → שורה לכל סטטוס עם הספירה שלו
        var byStatus = await issues
            .GroupBy(i => i.Status)
            .Select(g => new StatusCount(g.Key, g.Count()))
            .ToListAsync(cancellationToken);

        var byPriority = await issues
            .GroupBy(i => i.Priority)
            .Select(g => new PriorityCount(g.Key, g.Count()))
            .ToListAsync(cancellationToken);

        // מגמה: ספירה ליום. מקבצים לפי התאריך (ללא שעה) בצד ה-DB,
        // וממירים ל-DateOnly בזיכרון אחרי שהשורות חזרו.
        var perDay = await issues
            .GroupBy(i => i.CreatedAtUtc.Date)
            .Select(g => new { Day = g.Key, Count = g.Count() })
            .OrderBy(x => x.Day)
            .ToListAsync(cancellationToken);

        var createdPerDay = perDay
            .Select(x => new DayCount(DateOnly.FromDateTime(x.Day), x.Count))
            .ToList();

        int CountOf(IssueStatus status) =>
            byStatus.FirstOrDefault(s => s.Status == status)?.Count ?? 0;

        return new ProjectStats(
            byStatus.Sum(s => s.Count),
            CountOf(IssueStatus.Open),
            CountOf(IssueStatus.InProgress),
            CountOf(IssueStatus.Done),
            byStatus,
            byPriority,
            createdPerDay);
    }
}
// #endregion
