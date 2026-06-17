using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using TaskForge.Api.Auth;
using TaskForge.Core.Abstractions;

namespace TaskForge.Api.Hubs;

// #region step-24.2
// ה-Hub הוא הקצה השני של החיבור: לא request/response אלא חיבור מתמשך שהשרת
// דוחף דרכו. `[Authorize]` חל על כל החיבור — בלי טוקן תקף אין handshake בכלל
// (האימות מגיע מה-query string, ראו Program.cs step-24.6, כי WebSocket לא
// יכול לשלוח כותרת Authorization מהדפדפן).
//
// הלקוח לא "מאזין לכל השרת" — הוא מצטרף ל-group של פרויקט. ה-broadcast ממוקד
// ל-group הזה בלבד. ההצטרפות עצמה עוברת את אותה הרשאה מבוססת-משאב כמו ה-REST:
// רק חבר בפרויקט יכול להצטרף ל-`project-{id}`.
[Authorize]
public sealed class BoardHub(IProjectRepository projects) : Hub
{
    public static string ProjectGroup(int projectId) => $"project-{projectId}";

    public async Task JoinProject(int projectId)
    {
        var userId = Context.User!.GetUserId();
        if (!await projects.IsMemberAsync(projectId, userId, Context.ConnectionAborted))
        {
            // HubException הוא היחיד שמגיע ללקוח כהודעה; חריגות אחרות מוסתרות.
            throw new HubException("You are not a member of this project.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, ProjectGroup(projectId));
    }

    public Task LeaveProject(int projectId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, ProjectGroup(projectId));
}
// #endregion
