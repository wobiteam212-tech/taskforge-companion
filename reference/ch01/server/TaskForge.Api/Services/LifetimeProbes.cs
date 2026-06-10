namespace TaskForge.Api.Services;

// שלושה "גששים" זהים לחלוטין — חוץ מאופן הרישום שלהם ב-DI.
// לכל מופע נולד Guid ברגע היצירה, ולכן המזהה חושף בדיוק
// מתי ה-Container ייצר מופע חדש ומתי הוא מיחזר קיים.

public sealed class SingletonProbe
{
    public Guid Id { get; } = Guid.NewGuid();
}

public sealed class ScopedProbe
{
    public Guid Id { get; } = Guid.NewGuid();
}

public sealed class TransientProbe
{
    public Guid Id { get; } = Guid.NewGuid();
}
