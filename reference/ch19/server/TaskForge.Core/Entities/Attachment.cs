namespace TaskForge.Core.Entities;

// #region step-19.1
// קובץ מצורף ל-issue. בפיתוח אנחנו שומרים את ה-bytes ישירות ב-DB (BLOB) —
// פשוט, אטומי, ועובד בלי תלות בדיסק או באחסון ענן. בפרודקשן הטרייד-אוף הפוך:
// קבצים גדולים תופחים את ה-DB והגיבויים, ולכן שם מאחסנים ב-blob storage
// ושומרים כאן רק מצביע (StoragePath). את הטרייד-אוף הזה הפרק מלמד.
public sealed class Attachment
{
    public int Id { get; set; }

    public int IssueId { get; set; }
    public Issue? Issue { get; set; }

    public required string FileName { get; set; }

    public required string ContentType { get; set; }

    public long SizeBytes { get; set; }

    // ה-BLOB עצמו. לא נטען בשאילתת הרשימה — רק בהורדה.
    public required byte[] Bytes { get; set; }

    public int UploadedByUserId { get; set; }
    public User? UploadedBy { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
// #endregion
