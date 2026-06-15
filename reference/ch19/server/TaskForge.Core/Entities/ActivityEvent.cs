namespace TaskForge.Core.Entities;

// #region step-18.1
// סוג האירוע כ-enum: סט סגור שהמהדר אוכף, נשמר כטקסט ב-DB (כמו Status/Priority).
// מתווסף ערך רק כשנולד סוג פעילות חדש — לא string חופשי שאפשר לאיית לא נכון.
public enum ActivityType
{
    IssueCreated,
    IssueMoved,
    CommentAdded,
    // #region step-19.7
    // פרק 19: צירוף קובץ הוא פעילות. הוספת ערך ל-enum שנשמר כטקסט לא דורשת
    // מיגרציה — העמודה היא TEXT, וערך חדש הוא פשוט מחרוזת חדשה.
    AttachmentAdded,
    // #endregion
}

// יומן הפעילות: שורה אחת לכל דבר שקרה בפרויקט. הוא append-only — נכתב ליד
// הפעולה עצמה (יצירת issue, הזזה בלוח, תגובה) ונקרא כ-feed בדשבורד.
// IssueId הוא nullable: אירוע ברמת הפרויקט לא חייב issue.
public sealed class ActivityEvent
{
    public int Id { get; set; }

    public int ProjectId { get; set; }
    public Project? Project { get; set; }

    public int? IssueId { get; set; }

    public int ActorUserId { get; set; }
    public User? Actor { get; set; }

    public ActivityType Type { get; set; }

    public required string Summary { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
// #endregion
