namespace TaskForge.Core.Entities;

// access token חי דקות; ההתחברות נשמרת בזכות ה-refresh token —
// מחרוזת אקראית חד-פעמית שנשמרת ב-DB וניתנת לביטול.
public sealed class RefreshToken
{
    public int Id { get; set; }

    public required string Token { get; set; }

    public int UserId { get; set; }
    public User? User { get; set; }

    public DateTime ExpiresAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    // null = הטוקן עדיין בתוקף; rotation מציב כאן חותמת זמן
    public DateTime? RevokedAtUtc { get; set; }

    public bool IsActive => RevokedAtUtc is null && ExpiresAtUtc > DateTime.UtcNow;
}
