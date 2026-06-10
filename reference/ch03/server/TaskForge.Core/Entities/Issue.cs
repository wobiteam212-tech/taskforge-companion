namespace TaskForge.Core.Entities;

// enum = שפת הדומיין: סט ערכים סגור שהמהדר אוכף.
// "Open" שגוי-איות פשוט לא יתקמפל — לעומת string חופשי.

public enum IssueStatus
{
    Open,
    InProgress,
    Done,
}

public enum IssuePriority
{
    Low,
    Medium,
    High,
    Critical,
}

public sealed class Issue
{
    public int Id { get; set; }

    public required string Title { get; set; }

    public string? Description { get; set; }

    public IssueStatus Status { get; set; } = IssueStatus.Open;

    public IssuePriority Priority { get; set; } = IssuePriority.Medium;

    public DateTime CreatedAtUtc { get; set; }

    // הזוג הקלאסי: מפתח זר + navigation property.
    // ה-FK הוא העמודה בטבלה; ה-nav הוא הדרך של הקוד "ללכת" לפרויקט.
    public int ProjectId { get; set; }
    public Project? Project { get; set; }

    // many-to-many: ‏EF יבנה טבלת חיבור לבד (skip navigation)
    public List<Label> Labels { get; set; } = [];
}
