using Microsoft.AspNetCore.Http.HttpResults;
using TaskForge.Api.Contracts;
using TaskForge.Core.Abstractions;
using TaskForge.Core.Common;
using TaskForge.Core.Entities;

namespace TaskForge.Api.Endpoints;

public static class ProjectEndpoints
{
    public static IEndpointRouteBuilder MapProjectEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/projects").WithTags("Projects");

        group.MapGet("/", GetProjects);
        group.MapGet("/{id:int}", GetProjectById).WithName("GetProjectById");
        group.MapPost("/", CreateProject);

        return app;
    }

    private static async Task<Ok<IReadOnlyList<ProjectSummary>>> GetProjects(
        IProjectRepository projects,
        CancellationToken cancellationToken) =>
        TypedResults.Ok(await projects.GetSummariesAsync(cancellationToken));

    private static async Task<Results<Ok<ProjectResponse>, NotFound>> GetProjectById(
        int id,
        IProjectRepository projects,
        CancellationToken cancellationToken)
    {
        var project = await projects.GetByIdAsync(id, cancellationToken);
        return project is null
            ? TypedResults.NotFound()
            : TypedResults.Ok(ProjectResponse.FromEntity(project));
    }

    private static async Task<CreatedAtRoute<ProjectResponse>> CreateProject(
        CreateProjectRequest request,
        IProjectRepository projects,
        CancellationToken cancellationToken)
    {
        var project = await projects.AddAsync(new Project
        {
            Name = request.Name,
            Description = request.Description,
            CreatedAtUtc = DateTime.UtcNow,
        }, cancellationToken);

        return TypedResults.CreatedAtRoute(
            ProjectResponse.FromEntity(project),
            "GetProjectById",
            new { id = project.Id });
    }
}
