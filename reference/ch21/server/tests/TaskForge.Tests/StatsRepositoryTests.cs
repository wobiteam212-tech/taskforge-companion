using TaskForge.Core.Entities;
using TaskForge.Infrastructure.Repositories;
using Xunit;

namespace TaskForge.Tests;

// #region step-21.4
// מבחן האגרגציה: ה-GROUP BY של EfStatsRepository רץ מול SQLite אמיתי ומוכיח
// שהספירות נכונות. זה מאמת גם את ה-LINQ-to-SQL וגם את ההקרנה ל-ProjectStats.
public sealed class StatsRepositoryTests : IDisposable
{
    private readonly SqliteInMemory sqlite = new();

    [Fact]
    public async Task GetForProjectAsync_counts_issues_by_status()
    {
        int projectId;
        await using (var seed = sqlite.NewContext())
        {
            var project = new Project { Name = "Counts", CreatedAtUtc = DateTime.UtcNow };
            seed.Projects.Add(project);
            await seed.SaveChangesAsync();
            projectId = project.Id;

            seed.Issues.AddRange(
                Issue(projectId, IssueStatus.Open, IssuePriority.Low),
                Issue(projectId, IssueStatus.Open, IssuePriority.High),
                Issue(projectId, IssueStatus.InProgress, IssuePriority.Medium),
                Issue(projectId, IssueStatus.InProgress, IssuePriority.Critical),
                Issue(projectId, IssueStatus.Done, IssuePriority.Low));
            await seed.SaveChangesAsync();
        }

        await using var db = sqlite.NewContext();
        var stats = await new EfStatsRepository(db).GetForProjectAsync(projectId);

        Assert.Equal(5, stats.Total);
        Assert.Equal(2, stats.Open);
        Assert.Equal(2, stats.InProgress);
        Assert.Equal(1, stats.Done);
        // byPriority הוא GROUP BY נפרד — סך הספירות שלו חייב להתלכד עם Total
        Assert.Equal(5, stats.ByPriority.Sum(p => p.Count));
    }

    private static Issue Issue(int projectId, IssueStatus status, IssuePriority priority) => new()
    {
        Title = $"{status}-{priority}",
        Status = status,
        Priority = priority,
        ProjectId = projectId,
        CreatedAtUtc = DateTime.UtcNow,
    };

    public void Dispose() => sqlite.Dispose();
}
// #endregion
