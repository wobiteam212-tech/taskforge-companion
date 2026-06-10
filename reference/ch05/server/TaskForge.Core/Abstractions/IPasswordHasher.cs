namespace TaskForge.Core.Abstractions;

// הדומיין מגדיר את הצורך ("לגבב ולאמת סיסמאות"); הקריפטוגרפיה
// עצמה היא פרט מימוש של ה-Infrastructure. אותו חוק תלות, שוב.
public interface IPasswordHasher
{
    string Hash(string password);

    bool Verify(string password, string passwordHash);
}
