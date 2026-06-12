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

    // #region step-12.4
    // התפקיד כשאילתה רזה: עמודה אחת חוזרת, ו-null מבדיל "לא חבר" מ-"חבר רגיל".
    public async Task<ProjectRole?> GetRoleAsync(int projectId, int userId, CancellationToken cancellationToken = default)
    {
        var roles = await db.ProjectMembers
            .Where(m => m.ProjectId == projectId && m.UserId == userId)
            .Select(m => m.Role)
            .ToListAsync(cancellationToken);
        return roles.Count > 0 ? roles[0] : null;
    }

    // אותו דפוס Select-לתוך-record מ-step-4.14 — הפעם דרך ניווט ל-User.
    // Owners קודם, ואז לפי שם — סדר יציב שהקליינט לא צריך למיין בעצמו.
    public async Task<IReadOnlyList<ProjectMemberInfo>> GetMembersAsync(int projectId, CancellationToken cancellationToken = default) =>
        await db.ProjectMembers
            .AsNoTracking()
            .Where(m => m.ProjectId == projectId)
            .OrderByDescending(m => m.Role)
            .ThenBy(m => m.User!.DisplayName)
            .Select(m => new ProjectMemberInfo(
                m.UserId,
                m.User!.DisplayName,
                m.User!.Email,
                m.Role))
            .ToListAsync(cancellationToken);

    // צירוף אידמפוטנטי-ידידותי: "כבר חבר" אינו חריגה — זו תשובה (false),
    // וה-endpoint מתרגם אותה ל-409 Conflict עם הסבר.
    public async Task<bool> AddMemberAsync(int projectId, int userId, ProjectRole role, CancellationToken cancellationToken = default)
    {
        var exists = await db.ProjectMembers.AnyAsync(
            m => m.ProjectId == projectId && m.UserId == userId, cancellationToken);
        if (exists) return false;

        db.ProjectMembers.Add(new ProjectMember
        {
            ProjectId = projectId,
            UserId = userId,
            Role = role,
        });
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
    // #endregion
}
