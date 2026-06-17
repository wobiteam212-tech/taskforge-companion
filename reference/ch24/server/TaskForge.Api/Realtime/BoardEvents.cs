using TaskForge.Api.Contracts;

namespace TaskForge.Api.Realtime;

// #region step-24.3
// המטען של כל אירוע realtime. שלושה סוגים, שלוש מתודות אצל הלקוח:
//   IssueChanged — issue נוצר/עודכן/הוזז: שולחים את ה-IssueResponse המלא, הלקוח
//                  עושה upsert ישיר ל-store בלי refetch.
//   IssueDeleted — נמחק: רק ה-id, הלקוח מסיר.
//   CommentAdded — תגובה חדשה: ה-issueId + ה-CommentResponse.
//
// לכל אירוע יש `Origin` = ה-connectionId של מי שיזם את הכתיבה (הלקוח שולח אותו
// בכותרת X-Connection-Id). כך הלקוח שכבר עדכן אופטימית (פרק 17/20) מזהה את
// ההד של עצמו ומדלג עליו — לא נלחם בעדכון שכבר ביצע. ראו step-24.8.
public sealed record IssueChangedEvent(string? Origin, IssueResponse Issue);

public sealed record IssueDeletedEvent(string? Origin, int IssueId);

public sealed record CommentAddedEvent(string? Origin, int IssueId, CommentResponse Comment);
// #endregion
