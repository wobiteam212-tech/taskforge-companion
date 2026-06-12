using TaskForge.Core.Common;
using TaskForge.Core.Entities;

namespace TaskForge.Core.Abstractions;

// החוזה מוגדר בדומיין: "ככה ניגשים לפרויקטים".
// מי שמממש אותו ואיך — לא עניינו של ה-Core. זה חוק התלות בפעולה.
public interface IProjectRepository
{
    Task<IReadOnlyList<ProjectSummary>> GetSummariesAsync(CancellationToken cancellationToken = default);

    Task<Project?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>יוצר פרויקט ומצרף את היוצר כ-Owner — פעולה אטומית אחת.</summary>
    Task<Project> AddAsync(Project project, int ownerUserId, CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken = default);

    /// <summary>הרשאה מבוססת-משאב: האם המשתמש חבר בפרויקט הזה?</summary>
    Task<bool> IsMemberAsync(int projectId, int userId, CancellationToken cancellationToken = default);

    // #region step-12.3
    /// <summary>התפקיד של המשתמש בפרויקט — null אם אינו חבר כלל.</summary>
    Task<ProjectRole?> GetRoleAsync(int projectId, int userId, CancellationToken cancellationToken = default);

    /// <summary>כל חברי הפרויקט, כהקרנה רזה לתצוגה.</summary>
    Task<IReadOnlyList<ProjectMemberInfo>> GetMembersAsync(int projectId, CancellationToken cancellationToken = default);

    /// <summary>צירוף חבר קיים במערכת לפרויקט. מחזיר false אם כבר חבר.</summary>
    Task<bool> AddMemberAsync(int projectId, int userId, ProjectRole role, CancellationToken cancellationToken = default);
    // #endregion
}
