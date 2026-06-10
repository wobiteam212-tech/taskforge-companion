using Microsoft.EntityFrameworkCore;
using TaskForge.Core.Abstractions;
using TaskForge.Core.Common;
using TaskForge.Core.Entities;
using TaskForge.Infrastructure.Data;

namespace TaskForge.Infrastructure.Repositories;

public sealed class EfProjectRepository(TaskForgeDbContext db) : IProjectRepository
{
    // #region step-4.14
    // הקרנה (projection): ‏Select לתוך record. ‏EF מתרגם את הכול —
    // כולל ספירת ה-Issues הפתוחים — לשאילתת SQL אחת עם COUNT מקונן.
    // ה-Issues עצמם לא נטענים לזיכרון לעולם.
    public async Task<IReadOnlyList<ProjectSummary>> GetSummariesAsync(CancellationToken cancellationToken = default) =>
        await db.Projects
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .Select(p => new ProjectSummary(
                p.Id,
                p.Name,
                p.Description,
                p.Issues.Count(i => i.Status != IssueStatus.Done)))
            .ToListAsync(cancellationToken);
    // #endregion

    public Task<Project?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        db.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    // #region step-5.14
    // הפרויקט והחברות נכנסים באותו SaveChanges — טרנזקציה אחת.
    // אין רגע שבו קיים פרויקט בלי Owner.
    public async Task<Project> AddAsync(Project project, int ownerUserId, CancellationToken cancellationToken = default)
    {
        db.Projects.Add(project);
        db.ProjectMembers.Add(new ProjectMember
        {
            Project = project,
            UserId = ownerUserId,
            Role = ProjectRole.Owner,
        });
        await db.SaveChangesAsync(cancellationToken);
        return project;
    }
    // #endregion

    // בדיקת קיום רזה: ‏EXISTS ב-SQL, בלי לטעון את הישות
    public Task<bool> ExistsAsync(int id, CancellationToken cancellationToken = default) =>
        db.Projects.AnyAsync(p => p.Id == id, cancellationToken);

    public Task<bool> IsMemberAsync(int projectId, int userId, CancellationToken cancellationToken = default) =>
        db.ProjectMembers.AnyAsync(
            m => m.ProjectId == projectId && m.UserId == userId, cancellationToken);
}
