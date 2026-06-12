using Microsoft.EntityFrameworkCore;
using TaskForge.Core.Entities;
using TaskForge.Infrastructure.Auth;

namespace TaskForge.Infrastructure.Data;

// נתוני פיתוח: רצים פעם אחת, רק על DB ריק.
// מפרק 05 — כולל משתמש דמו שהוא ה-Owner של כל הפרויקטים.
public static class DbSeeder
{
    public static async Task SeedAsync(TaskForgeDbContext db)
    {
        if (await db.Projects.AnyAsync())
        {
            return; // יש כבר נתונים — לא נוגעים
        }

        // #region step-5.7
        // משתמש פיתוח: demo@taskforge.dev / Passw0rd!
        // הסיסמה עוברת את אותו PBKDF2 כמו בהרשמה אמיתית — אין דלת אחורית.
        var demo = new User
        {
            Email = "demo@taskforge.dev",
            DisplayName = "Demo User",
            PasswordHash = new PasswordHasher().Hash("Passw0rd!"),
            Role = UserRole.Admin,
            CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        };
        db.Users.Add(demo);
        // #endregion

        // #region step-12.8
        // משתמשת שנייה: maya@taskforge.dev / Passw0rd! — כדי שרשימת
        // החברים תספר סיפור אמיתי, ויהיה את מי לצרף בדיאלוג Add member.
        var maya = new User
        {
            Email = "maya@taskforge.dev",
            DisplayName = "Maya Levi",
            PasswordHash = new PasswordHasher().Hash("Passw0rd!"),
            Role = UserRole.Member,
            CreatedAtUtc = new DateTime(2026, 1, 5, 0, 0, 0, DateTimeKind.Utc),
        };
        db.Users.Add(maya);
        // #endregion

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

        // #region step-13.1
        // פרק 13 צריך רשימה בגודל אמיתי: מספיק issues כדי שחיפוש, מיון,
        // דפדוף ו-virtual scroll יהיו מורגשים. הנתונים דטרמיניסטיים —
        // לולאה עם modulo, לא Random — אותו DB בכל הרצה, אותם צילומי מסך.
        string[] verbs = ["Fix", "Polish", "Refactor", "Document", "Test", "Optimize"];
        string[] areas =
        [
            "navbar", "footer", "pricing page", "blog grid",
            "contact form", "image pipeline", "search box", "cookie banner",
        ];

        for (var i = 0; i < 58; i++)
        {
            website.Issues.Add(new Issue
            {
                Title = $"{verbs[i % verbs.Length]} the {areas[i % areas.Length]} ({i + 1:D2})",
                Status = (IssueStatus)(i % 3),
                Priority = (IssuePriority)(i % 4),
                CreatedAtUtc = new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc).AddHours(i * 7),
                Labels = i % 6 == 0 ? [bug] : i % 6 == 3 ? [feature] : [],
            });
        }
        // #endregion

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

        // #region step-5.7b
        // חברות: עכשיו יש Ids אמיתיים, אפשר לקשור את המשתמש לפרויקטים
        db.ProjectMembers.AddRange(
            new ProjectMember { ProjectId = website.Id, UserId = demo.Id, Role = ProjectRole.Owner },
            new ProjectMember { ProjectId = mobile.Id, UserId = demo.Id, Role = ProjectRole.Owner },
            new ProjectMember { ProjectId = tools.Id, UserId = demo.Id, Role = ProjectRole.Owner },
            // #region step-12.8b
            // מאיה חברה רגילה ב-Website Redesign — כדי שמסך ה-members
            // יראה שני תפקידים שונים, ו-Mobile App נשאר פנוי לצירוף בדמו.
            new ProjectMember { ProjectId = website.Id, UserId = maya.Id, Role = ProjectRole.Member });
            // #endregion
        await db.SaveChangesAsync();
        // #endregion
    }
}
