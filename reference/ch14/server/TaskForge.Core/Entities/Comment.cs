namespace TaskForge.Core.Entities;

public sealed class Comment
{
    public int Id { get; set; }

    public required string Body { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public int IssueId { get; set; }
    public Issue? Issue { get; set; }

    public int AuthorUserId { get; set; }
    public User? Author { get; set; }
}
