using TaskForge.Core.Entities;

namespace TaskForge.Core.Abstractions;

public interface ICommentRepository
{
    Task<IReadOnlyList<Comment>> GetByIssueAsync(int issueId, CancellationToken cancellationToken = default);

    Task<Comment> AddAsync(Comment comment, CancellationToken cancellationToken = default);
}
