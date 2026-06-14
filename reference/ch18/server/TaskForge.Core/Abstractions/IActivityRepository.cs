using TaskForge.Core.Entities;

namespace TaskForge.Core.Abstractions;

// #region step-18.5
// יומן הפעילות הוא read+write: כותבים אירוע ליד הפעולה, וקוראים את האחרונים
// כ-feed. שתי השיטות חיות מאחורי seam אחד, כמו שאר ה-repositories.
public interface IActivityRepository
{
    Task LogAsync(ActivityEvent activityEvent, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ActivityEvent>> GetRecentForProjectAsync(
        int projectId,
        int take,
        CancellationToken cancellationToken = default);
}
// #endregion
