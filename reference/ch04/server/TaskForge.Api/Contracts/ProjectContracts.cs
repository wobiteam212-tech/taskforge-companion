using System.ComponentModel.DataAnnotations;
using TaskForge.Core.Entities;

namespace TaskForge.Api.Contracts;

public sealed record CreateProjectRequest(
    [property: Required, StringLength(120, MinimumLength = 2)] string Name,
    [property: StringLength(2000)] string? Description);

public sealed record ProjectResponse(
    int Id,
    string Name,
    string? Description,
    DateTime CreatedAtUtc)
{
    public static ProjectResponse FromEntity(Project project) =>
        new(project.Id, project.Name, project.Description, project.CreatedAtUtc);
}
