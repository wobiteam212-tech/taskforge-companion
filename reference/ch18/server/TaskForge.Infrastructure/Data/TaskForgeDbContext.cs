using Microsoft.EntityFrameworkCore;
using TaskForge.Core.Entities;

namespace TaskForge.Infrastructure.Data;

// ה-DbContext הוא יחידת העבודה: צוהר אחד ל-DB לכל בקשה,
// שעוקב אחרי כל ישות שהוא הגיש ויודע לתרגם שינויים ל-SQL.
public sealed class TaskForgeDbContext(DbContextOptions<TaskForgeDbContext> options)
    : DbContext(options)
{
    // כל DbSet = טבלה. Set<T>() במקום setter — אין מצב ביניים null.
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Issue> Issues => Set<Issue>();
    public DbSet<Label> Labels => Set<Label>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<Comment> Comments => Set<Comment>();
    // #region step-18.9
    public DbSet<ActivityEvent> ActivityEvents => Set<ActivityEvent>();
    // #endregion

    // #region step-3.6
    // Fluent API: כל חוקי המיפוי כאן, והישויות ב-Core נשארות נקיות —
    // בלי attributes של EF. זה חוק התלות מפרק 02, מיושם על שכבת הנתונים.
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Project>(project =>
        {
            project.Property(p => p.Name)
                   .HasMaxLength(120)
                   .IsRequired();

            // אחד-לרבים: מחיקת פרויקט גוררת את ה-Issues שלו
            project.HasMany(p => p.Issues)
                   .WithOne(i => i.Project!)
                   .HasForeignKey(i => i.ProjectId)
                   .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Issue>(issue =>
        {
            issue.Property(i => i.Title)
                 .HasMaxLength(200)
                 .IsRequired();

            // enum נשמר כטקסט קריא ב-DB ("Open"), לא כמספר קסם (0)
            issue.Property(i => i.Status)
                 .HasConversion<string>()
                 .HasMaxLength(20);

            issue.Property(i => i.Priority)
                 .HasConversion<string>()
                 .HasMaxLength(20);

            // האינדקס של שאילתת הלוח: "כל ה-Issues הפתוחים בפרויקט X"
            issue.HasIndex(i => new { i.ProjectId, i.Status });

            // many-to-many: ‏EF מסיק טבלת חיבור IssueLabel לבד
            issue.HasMany(i => i.Labels)
                 .WithMany(l => l.Issues);

            // תגובות הן חלק מחיי ה-issue: מחיקת issue מוחקת את ה-thread שלו.
            issue.HasMany(i => i.Comments)
                 .WithOne(c => c.Issue!)
                 .HasForeignKey(c => c.IssueId)
                 .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Label>(label =>
        {
            label.Property(l => l.Name)
                 .HasMaxLength(40)
                 .IsRequired();

            // אין שתי תוויות באותו שם
            label.HasIndex(l => l.Name).IsUnique();
        });

        // #region step-5.6
        modelBuilder.Entity<User>(user =>
        {
            user.Property(u => u.Email).HasMaxLength(254).IsRequired();
            user.Property(u => u.DisplayName).HasMaxLength(60).IsRequired();
            user.Property(u => u.PasswordHash).HasMaxLength(300).IsRequired();
            user.Property(u => u.Role).HasConversion<string>().HasMaxLength(20);

            // אימייל הוא הזהות — אין שניים
            user.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<RefreshToken>(token =>
        {
            token.Property(t => t.Token).HasMaxLength(120).IsRequired();

            // חיפוש הטוקן הוא הנתיב החם של /auth/refresh — אינדקס ייחודי
            token.HasIndex(t => t.Token).IsUnique();

            // מחיקת משתמש גוררת את הטוקנים שלו
            token.HasOne(t => t.User)
                 .WithMany()
                 .HasForeignKey(t => t.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProjectMember>(member =>
        {
            // מפתח מורכב: זוג (פרויקט, משתמש) הוא החברות עצמה — בלי Id מלאכותי
            member.HasKey(m => new { m.ProjectId, m.UserId });

            member.Property(m => m.Role).HasConversion<string>().HasMaxLength(20);

            member.HasOne(m => m.Project)
                  .WithMany()
                  .HasForeignKey(m => m.ProjectId)
                  .OnDelete(DeleteBehavior.Cascade);

            member.HasOne(m => m.User)
                  .WithMany()
                  .HasForeignKey(m => m.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
        // #endregion

        // #region step-14.3
        modelBuilder.Entity<Comment>(comment =>
        {
            comment.Property(c => c.Body)
                   .HasMaxLength(1200)
                   .IsRequired();

            comment.HasIndex(c => new { c.IssueId, c.CreatedAtUtc });

            comment.HasOne(c => c.Author)
                   .WithMany()
                   .HasForeignKey(c => c.AuthorUserId)
                   .OnDelete(DeleteBehavior.Restrict);
        });
        // #endregion

        // #region step-18.9b
        modelBuilder.Entity<ActivityEvent>(activity =>
        {
            activity.Property(e => e.Type).HasConversion<string>().HasMaxLength(30);
            activity.Property(e => e.Summary).HasMaxLength(300).IsRequired();

            // הנתיב החם של ה-feed: "האירועים האחרונים בפרויקט X"
            activity.HasIndex(e => new { e.ProjectId, e.CreatedAtUtc });

            // מחיקת פרויקט גוררת את היומן שלו; מחיקת משתמש לא תמחק היסטוריה
            activity.HasOne(e => e.Project)
                    .WithMany()
                    .HasForeignKey(e => e.ProjectId)
                    .OnDelete(DeleteBehavior.Cascade);

            activity.HasOne(e => e.Actor)
                    .WithMany()
                    .HasForeignKey(e => e.ActorUserId)
                    .OnDelete(DeleteBehavior.Restrict);
        });
        // #endregion
    }
    // #endregion
}
