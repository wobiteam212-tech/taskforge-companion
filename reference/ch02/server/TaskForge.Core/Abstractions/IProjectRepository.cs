using TaskForge.Core.Entities;

namespace TaskForge.Core.Abstractions;

// החוזה מוגדר בדומיין: "ככה ניגשים לפרויקטים".
// מי שמממש אותו ואיך — לא עניינו של ה-Core. זה חוק התלות בפעולה.
public interface IProjectRepository
{
    Task<IReadOnlyList<Project>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<Project?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
}
