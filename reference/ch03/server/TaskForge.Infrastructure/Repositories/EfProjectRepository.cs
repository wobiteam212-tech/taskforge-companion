using Microsoft.EntityFrameworkCore;
using TaskForge.Core.Abstractions;
using TaskForge.Core.Entities;
using TaskForge.Infrastructure.Data;

namespace TaskForge.Infrastructure.Repositories;

// המימוש השני של אותו חוזה מפרק 02 — הפעם מול DB אמיתי.
// ה-Core וה-endpoint לא יודעים שמשהו השתנה. זה ה-seam משלם.
public sealed class EfProjectRepository(TaskForgeDbContext db) : IProjectRepository
{
    public async Task<IReadOnlyList<Project>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await db.Projects
            .AsNoTracking() // קריאה בלבד: בלי מעקב, בלי עלות זיכרון מיותרת
            .OrderBy(p => p.Id)
            .ToListAsync(cancellationToken);

    public Task<Project?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        db.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
}
