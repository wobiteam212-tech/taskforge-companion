using Microsoft.EntityFrameworkCore;
using TaskForge.Core.Abstractions;
using TaskForge.Core.Entities;
using TaskForge.Infrastructure.Data;

namespace TaskForge.Infrastructure.Repositories;

public sealed class EfCommentRepository(TaskForgeDbContext db) : ICommentRepository
{
    public async Task<IReadOnlyList<Comment>> GetByIssueAsync(
        int issueId,
        CancellationToken cancellationToken = default) =>
        await db.Comments
            .AsNoTracking()
            .Include(c => c.Author)
            .Where(c => c.IssueId == issueId)
            .OrderBy(c => c.CreatedAtUtc)
            .ToListAsync(cancellationToken);

    public async Task<Comment> AddAsync(Comment comment, CancellationToken cancellationToken = default)
    {
        db.Comments.Add(comment);
        await db.SaveChangesAsync(cancellationToken);

        return await db.Comments
            .AsNoTracking()
            .Include(c => c.Author)
            .SingleAsync(c => c.Id == comment.Id, cancellationToken);
    }
}
