namespace TaskForge.Core.Entities;

public enum UserRole
{
    Member,
    Admin,
}

public sealed class User
{
    public int Id { get; set; }

    public required string Email { get; set; }

    public required string DisplayName { get; set; }

    // לעולם לא הסיסמה עצמה — רק התוצר של PBKDF2 (צעד 5.4)
    public required string PasswordHash { get; set; }

    public UserRole Role { get; set; } = UserRole.Member;

    public DateTime CreatedAtUtc { get; set; }
}
