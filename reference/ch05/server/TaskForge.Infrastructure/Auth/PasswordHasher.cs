using System.Security.Cryptography;
using TaskForge.Core.Abstractions;

namespace TaskForge.Infrastructure.Auth;

// PBKDF2 טהור מה-BCL — בלי חבילות, בלי קסם.
// פורמט האחסון: iterations.saltBase64.hashBase64 — הכול נחוץ לאימות עתידי.
public sealed class PasswordHasher : IPasswordHasher
{
    private const int Iterations = 100_000;
    private const int SaltSize = 16; // bytes
    private const int KeySize = 32;  // bytes

    public string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);

        var key = Rfc2898DeriveBytes.Pbkdf2(
            password, salt, Iterations, HashAlgorithmName.SHA256, KeySize);

        return $"{Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(key)}";
    }

    public bool Verify(string password, string passwordHash)
    {
        var parts = passwordHash.Split('.');
        if (parts.Length != 3)
        {
            return false;
        }

        var iterations = int.Parse(parts[0]);
        var salt = Convert.FromBase64String(parts[1]);
        var expected = Convert.FromBase64String(parts[2]);

        var actual = Rfc2898DeriveBytes.Pbkdf2(
            password, salt, iterations, HashAlgorithmName.SHA256, expected.Length);

        // השוואה בזמן קבוע — חוסמת timing attacks על אורך ההתאמה
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
}
