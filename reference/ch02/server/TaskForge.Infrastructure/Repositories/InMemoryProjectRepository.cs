using TaskForge.Core.Abstractions;
using TaskForge.Core.Entities;

namespace TaskForge.Infrastructure.Repositories;

// מימוש ראשון של החוזה: רשימה בזיכרון.
// בפרק 03 הקובץ הזה יוחלף ב-EF Core + SQLite — וה-Core וה-Api
// לא ירגישו כלום. בדיוק בשביל הרגע הזה בנינו את ה-seam.
public sealed class InMemoryProjectRepository : IProjectRepository
{
    private static readonly List<Project> Seed =
    [
        new()
        {
            Id = 1,
            Name = "Website Redesign",
            Description = "Refresh the marketing site end to end",
            CreatedAtUtc = new DateTime(2026, 1, 12, 0, 0, 0, DateTimeKind.Utc),
        },
        new()
        {
            Id = 2,
            Name = "Mobile App",
            Description = "iOS + Android companion app",
            CreatedAtUtc = new DateTime(2026, 2, 3, 0, 0, 0, DateTimeKind.Utc),
        },
        new()
        {
            Id = 3,
            Name = "Internal Tools",
            Description = null,
            CreatedAtUtc = new DateTime(2026, 3, 21, 0, 0, 0, DateTimeKind.Utc),
        },
    ];

    public Task<IReadOnlyList<Project>> GetAllAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<Project>>(Seed);

    public Task<Project?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        Task.FromResult(Seed.FirstOrDefault(p => p.Id == id));
}
