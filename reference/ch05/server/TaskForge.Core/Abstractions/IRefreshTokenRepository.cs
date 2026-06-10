using TaskForge.Core.Entities;

namespace TaskForge.Core.Abstractions;

public interface IRefreshTokenRepository
{
    Task AddAsync(RefreshToken token, CancellationToken cancellationToken = default);

    /// <summary>מחזיר את הטוקן (כולל המשתמש) רק אם הוא קיים, בתוקף ולא בוטל.</summary>
    Task<RefreshToken?> GetActiveAsync(string token, CancellationToken cancellationToken = default);

    /// <summary>מסמן טוקן כמבוטל — הצעד הראשון בכל rotation.</summary>
    Task RevokeAsync(RefreshToken token, CancellationToken cancellationToken = default);
}
