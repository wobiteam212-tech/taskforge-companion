using Microsoft.AspNetCore.SignalR;
using TaskForge.Api.Contracts;
using TaskForge.Api.Hubs;

namespace TaskForge.Api.Realtime;

// #region step-24.4
// המימוש: עוטף IHubContext<BoardHub> (singleton) ומשדר ל-group של הפרויקט.
// כל מתודה שולחת אירוע בשם שתואם למתודה אצל הלקוח (`connection.on("IssueChanged"...)`).
// ה-Origin עובר כמו שהוא — הלקוח יחליט אם זה ההד שלו ולדלג.
public sealed class SignalRBoardNotifier(IHubContext<BoardHub> hub) : IBoardNotifier
{
    public Task IssueChangedAsync(int projectId, string? origin, IssueResponse issue, CancellationToken ct) =>
        hub.Clients
            .Group(BoardHub.ProjectGroup(projectId))
            .SendAsync("IssueChanged", new IssueChangedEvent(origin, issue), ct);

    public Task IssueDeletedAsync(int projectId, string? origin, int issueId, CancellationToken ct) =>
        hub.Clients
            .Group(BoardHub.ProjectGroup(projectId))
            .SendAsync("IssueDeleted", new IssueDeletedEvent(origin, issueId), ct);

    public Task CommentAddedAsync(int projectId, string? origin, int issueId, CommentResponse comment, CancellationToken ct) =>
        hub.Clients
            .Group(BoardHub.ProjectGroup(projectId))
            .SendAsync("CommentAdded", new CommentAddedEvent(origin, issueId, comment), ct);
}
// #endregion
