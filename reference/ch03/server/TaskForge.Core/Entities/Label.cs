namespace TaskForge.Core.Entities;

public sealed class Label
{
    public int Id { get; set; }

    public required string Name { get; set; }

    // צבע תצוגה הקסדצימלי, למשל "#f87171" — אופציונלי
    public string? Color { get; set; }

    // הצד השני של ה-many-to-many עם Issue
    public List<Issue> Issues { get; set; } = [];
}
