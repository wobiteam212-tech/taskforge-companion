using Microsoft.EntityFrameworkCore;
using TaskForge.Core.Abstractions;
using TaskForge.Core.Entities;
using TaskForge.Infrastructure.Data;

namespace TaskForge.Infrastructure.Repositories;

// #region step-19.3
public sealed class EfAttachmentRepository(TaskForgeDbContext db) : IAttachmentRepository
{
    public async Task<Attachment> AddAsync(Attachment attachment, CancellationToken cancellationToken = default)
    {
        db.Attachments.Add(attachment);
        await db.SaveChangesAsync(cancellationToken);
        return attachment;
    }

    // הרשימה: הקרנה שמשמיטה את ה-Bytes בכוונה. EF מתרגם את ה-Select ל-SQL
    // ששולף רק את העמודות שביקשנו — ה-BLOB הכבד לא יוצא מה-DB.
    public async Task<IReadOnlyList<Attachment>> GetMetadataByIssueAsync(
        int issueId,
        CancellationToken cancellationToken = default) =>
        await db.Attachments
            .AsNoTracking()
            .Where(a => a.IssueId == issueId)
            .Include(a => a.UploadedBy)
            .OrderByDescending(a => a.CreatedAtUtc)
            .ThenByDescending(a => a.Id)
            .Select(a => new Attachment
            {
                Id = a.Id,
                IssueId = a.IssueId,
                FileName = a.FileName,
                ContentType = a.ContentType,
                SizeBytes = a.SizeBytes,
                Bytes = Array.Empty<byte>(), // לא שולפים את ה-BLOB ברשימה
                UploadedByUserId = a.UploadedByUserId,
                UploadedBy = a.UploadedBy,
                CreatedAtUtc = a.CreatedAtUtc,
            })
            .ToListAsync(cancellationToken);

    // ההורדה: כאן כן צריך את ה-bytes
    public Task<Attachment?> GetByIdAsync(int id, CancellationToken cancellationToken = default) =>
        db.Attachments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
}
// #endregion
