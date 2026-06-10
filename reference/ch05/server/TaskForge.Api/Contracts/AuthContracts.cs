using System.ComponentModel.DataAnnotations;
using TaskForge.Core.Entities;

namespace TaskForge.Api.Contracts;

public sealed record RegisterRequest(
    [property: Required, EmailAddress, StringLength(254)] string Email,
    [property: Required, StringLength(60, MinimumLength = 2)] string DisplayName,
    [property: Required, StringLength(100, MinimumLength = 8)] string Password);

public sealed record LoginRequest(
    [property: Required, EmailAddress] string Email,
    [property: Required] string Password);

public sealed record RefreshRequest(
    [property: Required] string RefreshToken);

public sealed record UserResponse(int Id, string Email, string DisplayName, UserRole Role)
{
    public static UserResponse FromEntity(User user) =>
        new(user.Id, user.Email, user.DisplayName, user.Role);
}

// הזוג המלא: access קצר-חיים לבקשות, refresh ארוך-חיים לחידוש —
// והקליינט יודע בדיוק מתי ה-access יפוג.
public sealed record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAtUtc,
    UserResponse User);
