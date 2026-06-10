using Microsoft.EntityFrameworkCore;
using TaskForge.Core.Entities;

namespace TaskForge.Infrastructure.Data;

// נתוני פיתוח: רצים פעם אחת, רק על DB ריק.
// אותם שלושה פרויקטים מהפרק הקודם — עכשיו עם Issues ותוויות.
public static class DbSeeder
{
    public static async Task SeedAsync(TaskForgeDbContext db)
    {
        if (await db.Projects.AnyAsync())
        {
            return; // יש כבר נתונים — לא נוגעים
        }

        var bug = new Label { Name = "bug", Color = "#f87171" };
        var feature = new Label { Name = "feature", Color = "#4ade80" };
        var design = new Label { Name = "design", Color = "#c084fc" };

        var website = new Project
        {
            Name = "Website Redesign",
            Description = "Refresh the marketing site end to end",
            CreatedAtUtc = new DateTime(2026, 1, 12, 0, 0, 0, DateTimeKind.Utc),
            Issues =
            [
                new Issue
                {
                    Title = "Fix login redirect loop",
                    Description = "Users bounce between /login and /home",
                    Status = IssueStatus.InProgress,
                    Priority = IssuePriority.Critical,
                    CreatedAtUtc = new DateTime(2026, 1, 14, 9, 0, 0, DateTimeKind.Utc),
                    Labels = [bug],
                },
                new Issue
                {
                    Title = "New hero section",
                    Status = IssueStatus.Open,
                    Priority = IssuePriority.Medium,
                    CreatedAtUtc = new DateTime(2026, 1, 20, 11, 30, 0, DateTimeKind.Utc),
                    Labels = [feature, design],
                },
            ],
        };

        var mobile = new Project
        {
            Name = "Mobile App",
            Description = "iOS + Android companion app",
            CreatedAtUtc = new DateTime(2026, 2, 3, 0, 0, 0, DateTimeKind.Utc),
            Issues =
            [
                new Issue
                {
                    Title = "Push notifications opt-in",
                    Status = IssueStatus.Open,
                    Priority = IssuePriority.High,
                    CreatedAtUtc = new DateTime(2026, 2, 10, 8, 15, 0, DateTimeKind.Utc),
                    Labels = [feature],
                },
                new Issue
                {
                    Title = "Crash on cold start (Android 15)",
                    Status = IssueStatus.Done,
                    Priority = IssuePriority.Critical,
                    CreatedAtUtc = new DateTime(2026, 2, 12, 16, 45, 0, DateTimeKind.Utc),
                    Labels = [bug],
                },
            ],
        };

        var tools = new Project
        {
            Name = "Internal Tools",
            Description = null,
            CreatedAtUtc = new DateTime(2026, 3, 21, 0, 0, 0, DateTimeKind.Utc),
        };

        // מוסיפים רק את השורשים — ה-Change Tracker מגלה את כל הגרף
        // (Issues, ‏Labels וטבלת החיבור) ושומר הכול ב-SaveChanges אחד.
        db.Projects.AddRange(website, mobile, tools);
        await db.SaveChangesAsync();
    }
}
