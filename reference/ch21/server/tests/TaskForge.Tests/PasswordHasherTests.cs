using TaskForge.Infrastructure.Auth;
using Xunit;

namespace TaskForge.Tests;

// #region step-21.2
// מבחני יחידה טהורים: אין DB, אין רשת — רק לוגיקה. מהירים כברק, ולכן יש מהם הרבה.
// arrange-act-assert: מסדרים קלט, מפעילים, מוודאים תוצאה.
public sealed class PasswordHasherTests
{
    private readonly PasswordHasher hasher = new();

    [Fact]
    public void Verify_returns_true_for_the_correct_password()
    {
        var hash = hasher.Hash("Passw0rd!");

        Assert.True(hasher.Verify("Passw0rd!", hash));
    }

    [Fact]
    public void Verify_returns_false_for_a_wrong_password()
    {
        var hash = hasher.Hash("Passw0rd!");

        Assert.False(hasher.Verify("wrong", hash));
    }

    [Fact]
    public void Hash_is_salted_so_same_password_yields_different_hashes()
    {
        // salt אקראי לכל hash — שני hashes של אותה סיסמה שונים, ושניהם מאמתים
        var a = hasher.Hash("same");
        var b = hasher.Hash("same");

        Assert.NotEqual(a, b);
        Assert.True(hasher.Verify("same", a));
        Assert.True(hasher.Verify("same", b));
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-three-parts")]
    [InlineData("1.only-two")]
    public void Verify_returns_false_for_a_malformed_hash(string malformed)
    {
        Assert.False(hasher.Verify("whatever", malformed));
    }
}
// #endregion
