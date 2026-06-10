namespace TaskForge.Core.Entities;

// הישות הראשונה של הדומיין. שימו לב מה אין כאן:
// אין JSON, אין HTTP, אין SQL — רק העסק עצמו.
public sealed class Project
{
    public int Id { get; set; }

    // required: אי אפשר לייצר Project בלי שם — המהדר אוכף את זה
    public required string Name { get; set; }

    // string? — תיאור הוא אופציונלי במפורש
    public string? Description { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    // צד ה"אחד" של אחד-לרבים: לפרויקט יש אוסף Issues
    public List<Issue> Issues { get; set; } = [];
}
