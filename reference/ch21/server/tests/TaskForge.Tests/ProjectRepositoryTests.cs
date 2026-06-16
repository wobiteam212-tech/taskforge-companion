using TaskForge.Core.Entities;
using TaskForge.Infrastructure.Repositories;
using Xunit;

namespace TaskForge.Tests;

// #region step-21.3
// מבחן repository מול DB אמיתי-אך-חד-פעמי. זה ה-payoff של ה-seam: IsMemberAsync
// היא אבן הפינה של ההרשאה מבוססת-המשאב בכל ה-endpoints — וכאן מוכיחים אותה ישירות.
public sealed class ProjectRepositoryTests : IDisposable
{
    private readonly SqliteInMemory sqlite = new();

    [Fact]
    public async Task IsMemberAsync_true_for_a_member_false_for_an_outsider()
    {
        // arrange: שני משתמשים, פרויקט, וחברות אחת בלבד
        await using (var seed = sqlite.NewContext())
        {
            var member = new User { Email = "m@x.dev", DisplayName = "Member", PasswordHash = "x", Role = UserRole.Member };
            var outsider = new User { Email = "o@x.dev", DisplayName = "Outsider", PasswordHash = "x", Role = UserRole.Member };
            var project = new Project { Name = "Secret", CreatedAtUtc = DateTime.UtcNow };
            seed.Users.AddRange(member, outsider);
            seed.Projects.Add(project);
            await seed.SaveChangesAsync();
            seed.ProjectMembers.Add(new ProjectMember { ProjectId = project.Id, UserId = member.Id, Role = ProjectRole.Owner });
            await seed.SaveChangesAsync();
        }

        // act + assert: context חדש (כמו בקשה חדשה), אותו DB
        await using var db = sqlite.NewContext();
        var repo = new EfProjectRepository(db);
        var projectId = db.Projects.Single().Id;
        var memberId = db.Users.Single(u => u.Email == "m@x.dev").Id;
        var outsiderId = db.Users.Single(u => u.Email == "o@x.dev").Id;

        Assert.True(await repo.IsMemberAsync(projectId, memberId));
        Assert.False(await repo.IsMemberAsync(projectId, outsiderId));
    }

    public void Dispose() => sqlite.Dispose();
}
// #endregion
