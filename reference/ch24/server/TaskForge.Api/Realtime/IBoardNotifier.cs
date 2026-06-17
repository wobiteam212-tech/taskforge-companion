using TaskForge.Api.Contracts;

namespace TaskForge.Api.Realtime;

// #region step-24.3b
// ה-seam של ה-realtime, בדיוק כמו ה-repositories: ה-handlers תלויים בממשק הזה,
// לא ב-SignalR. כך הדומיין לא יודע על transport (DIP), ואפשר להחליף/למוק אותו.
// המימוש (SignalRBoardNotifier) עוטף את IHubContext ומשדר ל-group של הפרויקט.
public interface IBoardNotifier
{
    Task IssueChangedAsync(int projectId, string? origin, IssueResponse issue, CancellationToken ct);

    Task IssueDeletedAsync(int projectId, string? origin, int issueId, CancellationToken ct);

    Task CommentAddedAsync(int projectId, string? origin, int issueId, CommentResponse comment, CancellationToken ct);
}
// #endregion
