using TaskForge.Core.Common;

namespace TaskForge.Core.Abstractions;

// #region step-18.3
// seam האגרגציה: "ככה שואלים את ה-DB סיכום של פרויקט". המימוש (GROUP BY)
// חי ב-Infrastructure; ה-Core רק מצהיר על הצורה. אותו חוק תלות כמו שאר ה-repos.
public interface IStatsRepository
{
    Task<ProjectStats> GetForProjectAsync(int projectId, CancellationToken cancellationToken = default);
}
// #endregion
