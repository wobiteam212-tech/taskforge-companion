using TaskForge.Core.Entities;

namespace TaskForge.Core.Abstractions;

// #region step-19.2
// seam הקבצים. שימו לב לשתי קריאות שונות: GetMetadataByIssueAsync לרשימה
// (בלי ה-bytes — רק שם/גודל/סוג), ו-GetByIdAsync להורדה (כולל ה-bytes).
// כך רשימת הקבצים זולה ולא שולפת מגה-בייטים לזיכרון סתם.
public interface IAttachmentRepository
{
    Task<Attachment> AddAsync(Attachment attachment, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Attachment>> GetMetadataByIssueAsync(int issueId, CancellationToken cancellationToken = default);

    Task<Attachment?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
}
// #endregion
