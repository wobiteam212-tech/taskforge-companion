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
        });

        modelBuilder.Entity<Label>(label =>
        {
            label.Property(l => l.Name)
                 .HasMaxLength(40)
                 .IsRequired();

            // אין שתי תוויות באותו שם
            label.HasIndex(l => l.Name).IsUnique();
        });
    }
    // #endregion
}
