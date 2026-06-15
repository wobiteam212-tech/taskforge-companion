using TaskForge.Core.Entities;

namespace TaskForge.Api.Contracts;

// #region step-19.4
// תשובת המטא-דאטה של קובץ — בלי ה-bytes. זה מה שרשימת הקבצים מציגה,
// ומה ש-201 מחזיר אחרי העלאה. ההורדה עצמה היא endpoint נפרד שמחזיר את הקובץ.
public sealed record AttachmentResponse(
    int Id,
    int IssueId,
    string FileName,
    string ContentType,
    long SizeBytes,
    string UploadedByName,
    DateTime CreatedAtUtc)
{
    public static AttachmentResponse FromEntity(Attachment a) => new(
        a.Id,
        a.IssueId,
        a.FileName,
        a.ContentType,
        a.SizeBytes,
        a.UploadedBy?.DisplayName ?? "Unknown",
        a.CreatedAtUtc);
}
// #endregion
