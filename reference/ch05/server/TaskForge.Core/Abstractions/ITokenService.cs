using TaskForge.Core.Entities;

namespace TaskForge.Core.Abstractions;

public interface ITokenService
{
    /// <summary>JWT חתום עם זהות המשתמש והתפקיד — תקף לדקות ספורות.</summary>
    string CreateAccessToken(User user);

    /// <summary>מחרוזת אקראית קריפטוגרפית — נשמרת ב-DB דרך IRefreshTokenRepository.</summary>
    string CreateRefreshToken();
}
