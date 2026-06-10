using Microsoft.EntityFrameworkCore;
using TaskForge.Core.Abstractions;
using TaskForge.Core.Entities;
using TaskForge.Infrastructure.Data;

namespace TaskForge.Infrastructure.Repositories;

public sealed class EfRefreshTokenRepository(TaskForgeDbContext db) : IRefreshTokenRepository
{
    public async Task AddAsync(RefreshToken token, CancellationToken cancellationToken = default)
    {
        db.RefreshTokens.Add(token);
        await db.SaveChangesAsync(cancellationToken);
    }

    public Task<RefreshToken?> GetActiveAsync(string token, CancellationToken cancellationToken = default) =>
        db.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(
                t => t.Token == token && t.RevokedAtUtc == null && t.ExpiresAtUtc > DateTime.UtcNow,
                cancellationToken);

    public async Task RevokeAsync(RefreshToken token, CancellationToken cancellationToken = default)
    {
        token.RevokedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
    }
}
