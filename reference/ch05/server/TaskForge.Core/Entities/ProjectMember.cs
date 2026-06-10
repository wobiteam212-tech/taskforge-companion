namespace TaskForge.Core.Entities;

public enum ProjectRole
{
    Member,
    Owner,
}

// טבלת חיבור עם נתונים משלה (תפקיד) — ולכן ישות מפורשת,
// בניגוד ל-IssueLabel שנשאר skip navigation. המפתח: (ProjectId, UserId).
public sealed class ProjectMember
{
    public int ProjectId { get; set; }
    public Project? Project { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public ProjectRole Role { get; set; } = ProjectRole.Member;
}
