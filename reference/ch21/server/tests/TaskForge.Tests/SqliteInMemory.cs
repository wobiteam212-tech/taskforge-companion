using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using TaskForge.Infrastructure.Data;

namespace TaskForge.Tests;

// #region step-21.1
// בסיס נתונים אמיתי, אבל חד-פעמי. ‏SQLite ":memory:" חי כל עוד החיבור פתוח —
// כל מבחן מקבל DB נקי משלו, מהיר, וזהה ל-SQLite האמיתי של האפליקציה (לא mock).
// IDisposable: סגירת החיבור מוחקת את ה-DB — אפס דליפה בין מבחנים.
public sealed class SqliteInMemory : IDisposable
{
    private readonly SqliteConnection connection;

    public SqliteInMemory()
    {
        // חיבור שנשאר פתוח = ה-DB בזיכרון נשאר חי לאורך המבחן
        connection = new SqliteConnection("Filename=:memory:");
        connection.Open();
    }

    // context חדש על אותו חיבור. EnsureCreated בונה את הסכמה מהמודל —
    // אין צורך במיגרציות במבחנים, רק במודל עצמו.
    public TaskForgeDbContext NewContext()
    {
        var options = new DbContextOptionsBuilder<TaskForgeDbContext>()
            .UseSqlite(connection)
            .Options;
        var db = new TaskForgeDbContext(options);
        db.Database.EnsureCreated();
        return db;
    }

    public void Dispose() => connection.Dispose();
}
// #endregion
